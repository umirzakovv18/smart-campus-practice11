import type { Interval } from './types.ts';

/** Convert minutes-since-midnight to an HH:MM label. */
export function minutesToLabel(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Convert an HH:MM string to minutes since midnight, or NaN if invalid. */
export function labelToMinutes(label: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(label.trim());
  if (!match) return NaN;
  const h = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  if (h > 24 || min > 59) return NaN;
  return h * 60 + min;
}

/**
 * The single place where two time strings become an Interval.
 * Unparseable input stays NaN so that checkAvailability (AC1) reports it.
 */
export function parseInterval(startLabel: string, endLabel: string): Interval {
  return { start: labelToMinutes(startLabel), end: labelToMinutes(endLabel) };
}

/** Interval usable for drawing, or null when either side is not a number. */
export function toCandidate(interval: Interval): Interval | null {
  return Number.isNaN(interval.start) || Number.isNaN(interval.end) ? null : interval;
}
