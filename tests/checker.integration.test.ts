// Integration: the reducer that drives the UI, running on the real fictional catalog.
// Covers filtering, room switching (F5) and availability together — without a DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkerReducer,
  getVisibleRooms,
  initialCheckerState,
  type CheckerAction,
  type CheckerState,
} from '../src/domain/checkerState.ts';
import { ROOMS, BOOKINGS, SIMULATED_NOW_MINUTES } from '../src/data/campusData.ts';

const ctx = { rooms: ROOMS, bookings: BOOKINGS, nowMinutes: SIMULATED_NOW_MINUTES };
const run = (actions: CheckerAction[], from: CheckerState = initialCheckerState) =>
  actions.reduce((s, a) => checkerReducer(s, a, ctx), from);
const visibleIds = (s: CheckerState) => getVisibleRooms(s, ctx).map((r) => r.id);

const slot9to10: CheckerAction = { type: 'applySlot', start: '09:30', end: '10:00' }; // 09:00 would be "starts now" (AC1)

test('F5: switching room after a check re-runs it with the NEW room\'s bookings', () => {
  let s = run([{ type: 'selectRoom', roomId: 'r1' }, slot9to10, { type: 'check' }]);
  assert.equal(s.result?.decision, 'available'); // Room 101 is free 09:30–10:00

  s = run([{ type: 'selectRoom', roomId: 'r3' }], s); // Room 201 has Physics Lab 09:00–10:00, overlapping 09:30–10:00
  assert.equal(s.selectedRoomId, 'r3');
  assert.equal(s.result?.decision, 'unavailable');
  assert.match(s.result!.reason, /Physics Lab/);

  s = run([{ type: 'selectRoom', roomId: 'r1' }], s); // and back: not stuck on room 201's data
  assert.equal(s.result?.decision, 'available');
});

test('F5: switching room before any check leaves no result', () => {
  const s = run([{ type: 'selectRoom', roomId: 'r1' }, { type: 'selectRoom', roomId: 'r3' }]);
  assert.equal(s.selectedRoomId, 'r3');
  assert.equal(s.result, null);
});

test('editing the time after a check clears the stale result', () => {
  const s = run([{ type: 'selectRoom', roomId: 'r1' }, slot9to10, { type: 'check' }, { type: 'setEnd', value: '10:30' }]);
  assert.equal(s.result, null);
});

test('a room with no bookings (Lab 301) is available for a valid slot', () => {
  const s = run([{ type: 'selectRoom', roomId: 'r6' }, slot9to10, { type: 'check' }]);
  assert.equal(s.result?.decision, 'available');
});

test('capacity filter hides small rooms and ignores clicks on hidden rooms', () => {
  let s = run([{ type: 'setAttendees', value: '50' }]);
  assert.deepEqual(visibleIds(s), ['r3', 'r5']);
  s = run([{ type: 'selectRoom', roomId: 'r1' }], s); // Room 101 (40) is not shown
  assert.equal(s.selectedRoomId, null);
});

test('changing a filter so the selected room no longer matches drops the selection and result', () => {
  let s = run([{ type: 'selectRoom', roomId: 'r1' }, slot9to10, { type: 'check' }]);
  assert.equal(s.selectedRoomId, 'r1');
  s = run([{ type: 'setAttendees', value: '50' }], s);
  assert.equal(s.selectedRoomId, null);
  assert.equal(s.result, null);
});

test('F4 flow: no match, then "Clear filters" restores the whole catalog', () => {
  let s = run([{ type: 'setAttendees', value: '300' }]);
  assert.deepEqual(visibleIds(s), []);
  s = run([{ type: 'clearFilters' }], s);
  assert.equal(visibleIds(s).length, ROOMS.length);
});

test('equipment checkboxes combine with AND and can be toggled off again', () => {
  let s = run([
    { type: 'toggleEquipment', item: 'projector' },
    { type: 'toggleEquipment', item: 'video-conferencing' },
  ]);
  assert.deepEqual(visibleIds(s), ['r4', 'r5']);
  s = run([{ type: 'toggleEquipment', item: 'video-conferencing' }], s);
  assert.deepEqual(visibleIds(s), ['r1', 'r3', 'r4', 'r5']);
});

test('F3 end to end: the blocked Room 102 can be selected but is reported unavailable', () => {
  const s = run([{ type: 'selectRoom', roomId: 'r2' }, { type: 'applySlot', start: '14:00', end: '15:00' }, { type: 'check' }]);
  assert.equal(s.result?.decision, 'unavailable');
  assert.match(s.result!.reason, /blocked/i);
});

test('check without a room, or with invalid times, gives the right message', () => {
  assert.match(run([slot9to10, { type: 'check' }]).result!.reason, /select a room/i);
  const s = run([{ type: 'selectRoom', roomId: 'r1' }, { type: 'setStart', value: 'xx' }, { type: 'check' }]);
  assert.match(s.result!.reason, /valid start and end/i); // original UI path reported a different message
});

test('reset returns the initial state; the reducer never mutates its input', () => {
  const before = run([{ type: 'selectRoom', roomId: 'r1' }, slot9to10, { type: 'check' }]);
  const frozen = Object.freeze({ ...before, equipment: Object.freeze([...before.equipment]) as never });
  const snapshot = JSON.stringify(frozen);
  checkerReducer(frozen, { type: 'selectRoom', roomId: 'r3' }, ctx);
  checkerReducer(frozen, { type: 'toggleEquipment', item: 'projector' }, ctx);
  assert.equal(JSON.stringify(frozen), snapshot);
  assert.deepEqual(run([{ type: 'reset' }], before), initialCheckerState);
});
