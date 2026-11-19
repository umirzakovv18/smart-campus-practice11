import type { Booking, CheckResult, Interval, ReasonCode, Room } from './types.ts';
import { bookingsForRoom } from './bookings.ts';
import { minutesToLabel } from './time.ts';

export const MAX_DURATION_MINUTES = 120;
const MINUTES_PER_DAY = 1440;

interface RuleContext {
  interval: Interval;
  room: Room;
  roomBookings: Booking[];
  nowMinutes: number;
}

interface Rejection {
  code: ReasonCode;
  reason: string;
  conflict?: Interval;
}

/** A rule returns a rejection, or null when the interval passes it. */
type Rule = (ctx: RuleContext) => Rejection | null;

// The order matters: it is the order of the original if-chain, so the first
// failing rule (and therefore the message the user sees) is unchanged.
const RULES: Rule[] = [
  // AC1 – valid time
  ({ interval }) =>
    Number.isNaN(interval.start) || Number.isNaN(interval.end)
      ? { code: 'INVALID_TIME', reason: 'Please enter valid start and end times.' }
      : null,
  ({ interval }) =>
    interval.start < 0 || interval.end > MINUTES_PER_DAY
      ? { code: 'OUTSIDE_DAY', reason: 'Times must be within the same day (00:00–24:00).' }
      : null,
  ({ interval }) =>
    interval.start >= interval.end
      ? { code: 'END_NOT_AFTER_START', reason: 'End time must be after the start time.' }
      : null,
  // AC1: start must be strictly AFTER the current time (Practice #06: "Starts now" -> Unavailable)
  ({ interval, nowMinutes }) =>
    interval.start <= nowMinutes
      ? {
          code: 'START_NOT_AFTER_NOW',
          reason: `Start time must be after the current time (${minutesToLabel(nowMinutes)}).`,
        }
      : null,

  // AC2 – maximum duration
  ({ interval }) =>
    interval.end - interval.start > MAX_DURATION_MINUTES
      ? { code: 'TOO_LONG', reason: `Bookings cannot be longer than ${MAX_DURATION_MINUTES} minutes.` }
      : null,

  // AC3 / F3 – blocked room
  ({ room }) =>
    room.blocked
      ? { code: 'ROOM_BLOCKED', reason: 'This room is currently blocked and cannot be booked.' }
      : null,

  // AC4 – overlap; touching endpoints are allowed: [a,b) and [b,c) do not overlap
  ({ interval, roomBookings }) => {
    const hit = roomBookings.find((b) => interval.start < b.end && b.start < interval.end);
    return hit
      ? {
          code: 'OVERLAP',
          reason: `Overlaps an existing booking (${minutesToLabel(hit.start)}–${minutesToLabel(hit.end)} by ${hit.bookedBy}).`,
          conflict: { start: hit.start, end: hit.end },
        }
      : null;
  },
];

/**
 * Check a candidate interval for one room. Only that room's bookings are used.
 * Never mutates its arguments (AC5). This is the only place that decides availability.
 */
export function checkAvailability(
  interval: Interval,
  room: Room,
  bookings: Booking[],
  nowMinutes: number,
): CheckResult {
  const ctx: RuleContext = {
    interval,
    room,
    roomBookings: bookingsForRoom(bookings, room.id),
    nowMinutes,
  };

  for (const rule of RULES) {
    const rejection = rule(ctx);
    if (rejection !== null) {
      const result: CheckResult = {
        decision: 'unavailable',
        reason: rejection.reason,
        reasonCode: rejection.code,
      };
      if (rejection.conflict) result.conflict = rejection.conflict;
      return result;
    }
  }

  return {
    decision: 'available',
    reason: `${room.name} is available from ${minutesToLabel(interval.start)} to ${minutesToLabel(interval.end)} (${interval.end - interval.start} min).`,
    reasonCode: 'AVAILABLE',
  };
}
