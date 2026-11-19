import type { Booking, CheckResult, Equipment, Room, RoomRequirements } from './types.ts';
import { checkAvailability } from './availability.ts';
import { filterRooms, parseAttendees } from './filters.ts';
import { parseInterval } from './time.ts';

/** Everything the checker reads but never changes. */
export interface CheckerContext {
  rooms: Room[];
  bookings: Booking[];
  nowMinutes: number;
}

export interface CheckerState {
  selectedRoomId: string | null;
  startLabel: string;
  endLabel: string;
  attendeesText: string;
  equipment: Equipment[];
  result: CheckResult | null;
}

export type CheckerAction =
  | { type: 'selectRoom'; roomId: string }
  | { type: 'setStart'; value: string }
  | { type: 'setEnd'; value: string }
  | { type: 'applySlot'; start: string; end: string }
  | { type: 'setAttendees'; value: string }
  | { type: 'toggleEquipment'; item: Equipment }
  | { type: 'clearFilters' }
  | { type: 'check' }
  | { type: 'reset' };

export const initialCheckerState: CheckerState = {
  selectedRoomId: null,
  startLabel: '',
  endLabel: '',
  attendeesText: '',
  equipment: [],
  result: null,
};

export function getRequirements(state: CheckerState): RoomRequirements {
  return { attendees: parseAttendees(state.attendeesText), equipment: state.equipment };
}

export function getVisibleRooms(state: CheckerState, ctx: CheckerContext): Room[] {
  return filterRooms(ctx.rooms, getRequirements(state));
}

/** Availability for the selected room, using that room's bookings only. */
export function runCheck(state: CheckerState, ctx: CheckerContext): CheckResult {
  const room = ctx.rooms.find((r) => r.id === state.selectedRoomId);
  if (!room) return { decision: 'unavailable', reason: 'Please select a room first.' };
  const interval = parseInterval(state.startLabel, state.endLabel);
  return checkAvailability(interval, room, ctx.bookings, ctx.nowMinutes);
}

/** After a filter change, drop the selection if that room no longer matches (F4/F5). */
function withValidSelection(state: CheckerState, ctx: CheckerContext): CheckerState {
  if (state.selectedRoomId === null) return state;
  const stillVisible = getVisibleRooms(state, ctx).some((r) => r.id === state.selectedRoomId);
  return stillVisible ? state : { ...state, selectedRoomId: null, result: null };
}

export function checkerReducer(
  state: CheckerState,
  action: CheckerAction,
  ctx: CheckerContext,
): CheckerState {
  switch (action.type) {
    case 'selectRoom': {
      if (action.roomId === state.selectedRoomId) return state;
      if (!getVisibleRooms(state, ctx).some((r) => r.id === action.roomId)) return state;
      const next = { ...state, selectedRoomId: action.roomId };
      // F5: if a check was already shown, re-run it for the newly chosen room
      // (with that room's own bookings); otherwise there is nothing to refresh.
      return { ...next, result: state.result === null ? null : runCheck(next, ctx) };
    }
    case 'setStart':
      return { ...state, startLabel: action.value, result: null };
    case 'setEnd':
      return { ...state, endLabel: action.value, result: null };
    case 'applySlot':
      return { ...state, startLabel: action.start, endLabel: action.end, result: null };
    case 'setAttendees':
      return withValidSelection({ ...state, attendeesText: action.value }, ctx);
    case 'toggleEquipment': {
      const equipment = state.equipment.includes(action.item)
        ? state.equipment.filter((e) => e !== action.item)
        : [...state.equipment, action.item];
      return withValidSelection({ ...state, equipment }, ctx);
    }
    case 'clearFilters':
      return withValidSelection({ ...state, attendeesText: '', equipment: [] }, ctx);
    case 'check':
      return { ...state, result: runCheck(state, ctx) };
    case 'reset':
      return initialCheckerState;
  }
}
