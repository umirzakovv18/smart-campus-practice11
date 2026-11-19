// LLM adapters. Only MOCK adapters live in the browser: no API key is ever used client-side.
// A real adapter would run on a server behind the same LlmAdapter contract.
import { readFacts, type PromptMessages } from './prompt.ts';

export interface LlmAdapter {
  readonly id: string;
  readonly label: string;
  readonly isMock: boolean;
  /** Returns the raw model text (expected: JSON {"explanation": string}). */
  complete(prompt: PromptMessages, signal: AbortSignal): Promise<string>;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('aborted'));
    }, { once: true });
  });
}

/** Deterministic template "model": builds the explanation only from the FACTS block. */
export function mockExplanation(prompt: PromptMessages): string {
  const f = readFacts(prompt);
  const room = String(f.room);
  const from = String(f.requestedStart);
  const to = String(f.requestedEnd);
  const conflict = f.conflictingBooking as { start: string; end: string } | undefined;
  let text: string;
  switch (f.reasonCode) {
    case 'AVAILABLE':
      text = `${room} is free from ${from} to ${to}, so it is available for your request.`;
      break;
    case 'OVERLAP':
      text = `${room} is not available because your time ${from}-${to} overlaps an existing booking from ${conflict?.start} to ${conflict?.end}. Try a time that starts when that booking ends.`;
      break;
    case 'ROOM_BLOCKED':
      text = `${room} is not available because it is currently blocked. Please choose another room.`;
      break;
    case 'START_NOT_AFTER_NOW':
      text = `${room} is not available for this request because the start time must be after the current time (${String(f.currentTime)}). Please pick a later start time.`;
      break;
    case 'TOO_LONG':
      text = `${room} is not available for this request because bookings can last at most 120 minutes. Try a shorter interval.`;
      break;
    case 'END_NOT_AFTER_START':
      text = `${room} is not available for this request because the end time ${to} is not after the start time ${from}.`;
      break;
    case 'OUTSIDE_DAY':
      text = `${room} is not available for this request because the time must stay within one day (00:00-24:00).`;
      break;
    default:
      text = `${room} is not available for this request because the times are not valid.`;
  }
  return JSON.stringify({ explanation: text });
}

export const mockAdapter: LlmAdapter = {
  id: 'mock',
  label: 'Mock AI (no API, template-based)',
  isMock: true,
  async complete(prompt, signal) {
    await wait(400, signal); // simulated latency
    return mockExplanation(prompt);
  },
};

/** Demo failure modes, used by tests and the "Simulate" selector in the UI. */
export const timeoutAdapter: LlmAdapter = {
  id: 'timeout',
  label: 'Simulate: model timeout',
  isMock: true,
  async complete(_prompt, signal) {
    await wait(60_000, signal);
    return '{}';
  },
};

export const errorAdapter: LlmAdapter = {
  id: 'error',
  label: 'Simulate: API error (HTTP 503)',
  isMock: true,
  async complete() {
    throw new Error('LLM API returned HTTP 503');
  },
};

export const missingKeyAdapter: LlmAdapter = {
  id: 'no-key',
  label: 'Simulate: API key not configured',
  isMock: true,
  async complete() {
    throw new Error('LLM API key is not configured on the server');
  },
};

export const hallucinatingAdapter: LlmAdapter = {
  id: 'hallucinate',
  label: 'Simulate: model invents details',
  isMock: true,
  async complete(prompt) {
    const f = readFacts(prompt);
    return JSON.stringify({ explanation: `${String(f.room)} is free at 11:30 and Room 999 is also free.` });
  },
};

export const DEMO_ADAPTERS: LlmAdapter[] = [
  mockAdapter,
  timeoutAdapter,
  errorAdapter,
  missingKeyAdapter,
  hallucinatingAdapter,
];
