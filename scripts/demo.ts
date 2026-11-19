// Prints the Task #02 demonstration (filtering, room switching, availability) using the same
// reducer the UI uses.  Run: npm run demo
import { checkerReducer, getVisibleRooms, initialCheckerState, type CheckerAction, type CheckerState } from '../src/domain/checkerState.ts';
import { ROOMS, BOOKINGS, SIMULATED_NOW_MINUTES } from '../src/data/campusData.ts';

const ctx = { rooms: ROOMS, bookings: BOOKINGS, nowMinutes: SIMULATED_NOW_MINUTES };
let state: CheckerState = initialCheckerState;
const step = (label: string, ...actions: CheckerAction[]) => {
  for (const a of actions) state = checkerReducer(state, a, ctx);
  const rooms = getVisibleRooms(state, ctx).map((r) => r.name).join(', ') || '(none – empty state shown)';
  const res = state.result ? `${state.result.decision.toUpperCase()}: ${state.result.reason}` : '—';
  console.log(`${label}\n   rooms shown : ${rooms}\n   selected    : ${state.selectedRoomId ?? '—'}\n   result      : ${res}\n`);
};

console.log('Simulated now = 09:00\n');
step('1. Filter: 50 attendees + projector (successful filtering)', { type: 'setAttendees', value: '50' }, { type: 'toggleEquipment', item: 'projector' });
step('2. Filter: 300 attendees (unsuccessful filtering, F4)', { type: 'setAttendees', value: '300' });
step('3. Clear filters', { type: 'clearFilters' });
step('4. Select Room 101, slot 09:30–10:00, check', { type: 'selectRoom', roomId: 'r1' }, { type: 'applySlot', start: '09:30', end: '10:00' }, { type: 'check' });
step('5. Switch to Room 201 (F5: result refreshes with its own bookings)', { type: 'selectRoom', roomId: 'r3' });
step('6. Switch to Lab 301 (no bookings)', { type: 'selectRoom', roomId: 'r6' });
step('7. Room 101, 09:30–10:30 (overlap with 10:00–11:00)', { type: 'selectRoom', roomId: 'r1' }, { type: 'applySlot', start: '09:30', end: '10:30' }, { type: 'check' });
step('8. Room 101, 11:00–13:01 (121 minutes)', { type: 'applySlot', start: '11:00', end: '13:01' }, { type: 'check' });
step('9. Room 101, 11:00–13:00 (exactly 120 minutes)', { type: 'applySlot', start: '11:00', end: '13:00' }, { type: 'check' });
step('10. Blocked Room 102, 14:00–15:00', { type: 'selectRoom', roomId: 'r2' }, { type: 'applySlot', start: '14:00', end: '15:00' }, { type: 'check' });
step('11. Room 101, 09:00–10:00 (starts exactly at simulated now, AC1)', { type: 'selectRoom', roomId: 'r1' }, { type: 'applySlot', start: '09:00', end: '10:00' }, { type: 'check' });
