// Input/output contract of the "Explain availability" feature.
// Everything that crosses the LLM boundary is validated here (AC2, AC3).
import type { ReasonCode } from '../domain/types.ts';

export const REASON_CODES: readonly ReasonCode[] = [
  'AVAILABLE',
  'INVALID_TIME',
  'OUTSIDE_DAY',
  'END_NOT_AFTER_START',
  'START_NOT_AFTER_NOW',
  'TOO_LONG',
  'ROOM_BLOCKED',
  'OVERLAP',
];

export const LIMITS = {
  roomLabel: 40,
  question: 200,
  explanation: 300,
  sentences: 2,
} as const;

/** What the explanation feature receives. Built from the deterministic result only. */
export interface ExplanationRequest {
  roomLabel: string;
  start: string; // HH:MM
  end: string; // HH:MM
  currentTime: string; // HH:MM (simulated now)
  isAvailable: boolean;
  reasonCode: ReasonCode;
  /** Only for OVERLAP: time of the conflicting booking. No names or personal data. */
  conflict?: { start: string; end: string };
  /** Optional student question. Untrusted text, passed to the model as quoted data only. */
  question?: string;
}

export interface ExplanationResponse {
  explanation: string;
}

export type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;
const ROOM_LABEL = /^[\p{L}\p{N}][\p{L}\p{N} .-]*$/u;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const fail = (error: string): Validation<never> => ({ ok: false, error });

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** AC3: rejects empty, malformed or overly long input before anything reaches the model. */
export function validateRequest(input: unknown): Validation<ExplanationRequest> {
  if (!isRecord(input)) return fail('Request must be an object.');
  const { roomLabel, start, end, currentTime, isAvailable, reasonCode, conflict, question } = input;

  if (typeof roomLabel !== 'string' || roomLabel.trim() === '') return fail('Room label is empty.');
  if (roomLabel.trim().length > LIMITS.roomLabel) return fail('Room label is too long.');
  if (!ROOM_LABEL.test(roomLabel.trim())) return fail('Room label has invalid characters.');

  for (const [name, value] of [['start', start], ['end', end], ['currentTime', currentTime]] as const) {
    if (typeof value !== 'string' || value === '') return fail(`${name} is empty.`);
    if (!HHMM.test(value)) return fail(`${name} is not a valid HH:MM time.`);
  }

  if (typeof isAvailable !== 'boolean') return fail('isAvailable must be true or false.');
  if (typeof reasonCode !== 'string' || !REASON_CODES.includes(reasonCode as ReasonCode)) {
    return fail('Unknown reason code.');
  }
  if (isAvailable !== (reasonCode === 'AVAILABLE')) return fail('isAvailable does not match the reason code.');

  let conflictValue: ExplanationRequest['conflict'];
  if (reasonCode === 'OVERLAP') {
    if (!isRecord(conflict) || typeof conflict.start !== 'string' || typeof conflict.end !== 'string'
      || !HHMM.test(conflict.start) || !HHMM.test(conflict.end)) {
      return fail('OVERLAP needs the conflicting booking time.');
    }
    conflictValue = { start: conflict.start, end: conflict.end };
  } else if (conflict !== undefined) {
    return fail('conflict is only allowed for OVERLAP.');
  }

  let questionValue: string | undefined;
  if (question !== undefined) {
    if (typeof question !== 'string') return fail('Question must be text.');
    const q = question.trim();
    if (q.length > LIMITS.question) return fail(`Question is longer than ${LIMITS.question} characters.`);
    if (CONTROL_CHARS.test(q)) return fail('Question contains control characters.');
    if (q !== '') questionValue = q;
  }

  return {
    ok: true,
    value: {
      roomLabel: roomLabel.trim(),
      start: start as string,
      end: end as string,
      currentTime: currentTime as string,
      isAvailable,
      reasonCode: reasonCode as ReasonCode,
      ...(conflictValue ? { conflict: conflictValue } : {}),
      ...(questionValue ? { question: questionValue } : {}),
    },
  };
}

const NEGATIVE = /\b(unavailable|not available|isn't available|is not free|cannot be booked|can't be booked|cannot book|can't book)\b/i;
// Review finding F2: a reply may contain a negative phrase AND claim the opposite.
const POSITIVE = /\b(is free|are free|is available|are available|can book|can be booked|go ahead|book it)\b/i;
// Review finding F1: the facts never contain people or the purpose of a booking.
const WHO_OR_PURPOSE = /\b(booked|reserved|used|taken)\s+(by|for)\b|\bfor\s+(an?|the)\s+(exam|lecture|class|meeting|event|seminar|lab|test|session)\b/i;
const ALLOWED_CAPITALISED = new Set(['I', 'AI']);
const TIME_TOKEN = /\b\d{1,2}:\d{2}\b/g;
const ROOM_MENTION = /\b(?:Room|Lab|Auditorium)\s+[A-Z0-9]+\b/g;

/**
 * AC2: the model output must be valid JSON {explanation}, short, plain text, agree with the
 * deterministic decision and mention no times or rooms that were not supplied.
 */
export function validateResponse(raw: string, req: ExplanationRequest): Validation<string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail('Model output is not valid JSON.');
  }
  if (!isRecord(parsed) || typeof parsed.explanation !== 'string') {
    return fail('Model output has no explanation string.');
  }
  const text = parsed.explanation.trim().replace(/\s+/g, ' ');
  if (text === '') return fail('Explanation is empty.');
  if (text.length > LIMITS.explanation) return fail('Explanation is too long.');
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim() !== '');
  if (sentences.length > LIMITS.sentences) return fail('Explanation has more than two sentences.');
  if (/[<>]|https?:\/\//i.test(text)) return fail('Explanation contains markup or links.');

  const saysNegative = NEGATIVE.test(text);
  if (req.isAvailable && saysNegative) return fail('Explanation contradicts the result (says unavailable).');
  if (!req.isAvailable && !saysNegative) return fail('Explanation does not say the room is unavailable.');
  if (!req.isAvailable && POSITIVE.test(text)) return fail('Explanation contradicts the result (also says free/available).');

  if (WHO_OR_PURPOSE.test(text)) return fail('Explanation mentions who booked the room or why; these facts were not supplied.');
  // Capitalised words that are not at the start of a sentence are names (people, groups, places).
  // They are only allowed when they belong to the supplied room label.
  const labelWords = new Set(req.roomLabel.split(/\s+/));
  for (const sentence of sentences) {
    const words = sentence.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
    for (const word of words.slice(1)) {
      if (/^[A-Z]/.test(word) && !labelWords.has(word) && !ALLOWED_CAPITALISED.has(word)) {
        return fail(`Explanation mentions a name that was not supplied (${word}).`);
      }
    }
  }

  const allowedTimes = new Set([req.start, req.end, req.currentTime]);
  if (req.conflict) {
    allowedTimes.add(req.conflict.start);
    allowedTimes.add(req.conflict.end);
  }
  const normalise = (t: string) => t.padStart(5, '0');
  for (const t of text.match(TIME_TOKEN) ?? []) {
    if (!allowedTimes.has(normalise(t))) return fail(`Explanation mentions a time that was not supplied (${t}).`);
  }
  for (const room of text.match(ROOM_MENTION) ?? []) {
    if (room !== req.roomLabel) return fail(`Explanation mentions another room (${room}).`);
  }
  return { ok: true, value: text };
}
