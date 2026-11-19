// Orchestrates one explanation: validate -> prompt -> adapter (with timeout) -> validate -> view.
// It never decides availability; on any problem it returns the deterministic reason (AC4).
import type { CheckResult, Room } from '../domain/types.ts';
import { minutesToLabel } from '../domain/time.ts';
import type { LlmAdapter } from './adapters.ts';
import { validateRequest, validateResponse, type ExplanationRequest } from './contract.ts';
import { buildPrompt } from './prompt.ts';

export const DEFAULT_TIMEOUT_MS = 3000;

export type ExplanationView =
  | { status: 'generated'; text: string; adapterLabel: string; isMock: boolean }
  | { status: 'fallback'; text: string; problem: string }
  | { status: 'rejected'; text: string; problem: string };

/** Builds the request from the deterministic result only (no bookedBy, no personal data). */
export function buildExplanationRequest(args: {
  room: Room;
  startLabel: string;
  endLabel: string;
  nowMinutes: number;
  result: CheckResult;
  question?: string;
}): unknown {
  const { room, startLabel, endLabel, nowMinutes, result, question } = args;
  return {
    roomLabel: room.name,
    start: startLabel,
    end: endLabel,
    currentTime: minutesToLabel(nowMinutes),
    isAvailable: result.decision === 'available',
    reasonCode: result.reasonCode,
    ...(result.conflict
      ? { conflict: { start: minutesToLabel(result.conflict.start), end: minutesToLabel(result.conflict.end) } }
      : {}),
    ...(question !== undefined ? { question } : {}),
  };
}

function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Model did not answer within ${ms} ms`));
    }, ms);
  });
  return Promise.race([run(controller.signal), timeout]).finally(() => clearTimeout(timer));
}

/**
 * @param input        untrusted request (validated here, AC3)
 * @param fallbackText the deterministic reason from checkAvailability, shown when the model fails
 */
export async function explainAvailability(
  input: unknown,
  adapter: LlmAdapter,
  fallbackText: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ExplanationView> {
  const request = validateRequest(input);
  if (!request.ok) {
    return { status: 'rejected', text: fallbackText, problem: request.error };
  }
  const req: ExplanationRequest = request.value;

  let raw: string;
  try {
    raw = await withTimeout((signal) => adapter.complete(buildPrompt(req), signal), timeoutMs);
  } catch (err) {
    return { status: 'fallback', text: fallbackText, problem: err instanceof Error ? err.message : 'Model call failed' };
  }

  const response = validateResponse(raw, req);
  if (!response.ok) {
    return { status: 'fallback', text: fallbackText, problem: response.error };
  }
  return { status: 'generated', text: response.value, adapterLabel: adapter.label, isMock: adapter.isMock };
}
