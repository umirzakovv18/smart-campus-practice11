// F1–F4: capacity filter, equipment filter, blocked rooms, empty state.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterRooms, meetsCapacity, hasAllEquipment, parseAttendees } from '../src/domain/filters.ts';
import { checkAvailability } from '../src/domain/availability.ts';
import { ROOMS, BOOKINGS, SIMULATED_NOW_MINUTES } from '../src/data/campusData.ts';

const ids = (rooms: { id: string }[]) => rooms.map((r) => r.id);
const room = (id: string) => ROOMS.find((r) => r.id === id)!;

test('F1 boundary: exact capacity is accepted, one more attendee is not', () => {
  assert.equal(meetsCapacity(room('r1'), 40), true); // capacity 40
  assert.equal(meetsCapacity(room('r1'), 41), false);
});

test('F1: no attendee requirement keeps every room; invalid input means "no requirement"', () => {
  assert.equal(filterRooms(ROOMS, { attendees: null, equipment: [] }).length, ROOMS.length);
  assert.equal(parseAttendees(''), null);
  assert.equal(parseAttendees('0'), null);
  assert.equal(parseAttendees('-5'), null);
  assert.equal(parseAttendees('abc'), null);
  assert.equal(parseAttendees('30'), 30);
});

test('F1: capacity filter returns only rooms that fit 50 attendees', () => {
  assert.deepEqual(ids(filterRooms(ROOMS, { attendees: 50, equipment: [] })), ['r3', 'r5']);
});

test('F2: room must contain ALL selected items (projector + whiteboard)', () => {
  const result = filterRooms(ROOMS, { attendees: null, equipment: ['projector', 'whiteboard'] });
  assert.deepEqual(ids(result), ['r1', 'r3']);
});

test('F2: a room missing just one required item is excluded', () => {
  assert.equal(hasAllEquipment(room('r4'), ['projector', 'video-conferencing']), true);
  assert.equal(hasAllEquipment(room('r4'), ['projector', 'video-conferencing', 'microphone']), false);
});

test('F1 + F2 combined: 50 attendees and a projector', () => {
  assert.deepEqual(ids(filterRooms(ROOMS, { attendees: 50, equipment: ['projector'] })), ['r3', 'r5']);
});

test('F3: a blocked room that passes the filters is still reported unavailable', () => {
  const visible = filterRooms(ROOMS, { attendees: 20, equipment: ['whiteboard'] });
  assert.ok(ids(visible).includes('r2')); // Room 102 matches the filters...
  const res = checkAvailability({ start: 800, end: 860 }, room('r2'), BOOKINGS, SIMULATED_NOW_MINUTES);
  assert.equal(res.decision, 'unavailable'); // ...but can never be available
  assert.match(res.reason, /blocked/i);
});

test('F4: requirements nobody satisfies produce an empty list', () => {
  assert.deepEqual(filterRooms(ROOMS, { attendees: 300, equipment: [] }), []);
  assert.deepEqual(filterRooms(ROOMS, { attendees: 100, equipment: ['computers'] }), []);
});

test('filtering does not mutate the catalog', () => {
  const before = JSON.stringify(ROOMS);
  filterRooms(ROOMS, { attendees: 50, equipment: ['projector'] });
  assert.equal(JSON.stringify(ROOMS), before);
});
