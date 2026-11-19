// Version-agnostic regression tests for the ORIGINAL acceptance criteria AC1–AC5.
// Run against any version by pointing AVAIL_MODULE at its availability module:
//   AVAIL_MODULE=<abs path to availability.ts> node --test tests/regression-ac.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const modPath = process.env.AVAIL_MODULE
  ? path.resolve(process.env.AVAIL_MODULE)
  : path.resolve(import.meta.dirname, '../src/domain/availability.ts');
const { checkAvailability } = await import(pathToFileURL(modPath).href);

const NOW = 540; // 09:00, the simulated "now" used by the app
const room = { id: 'r1', name: 'Room 101', building: 'B', capacity: 40, blocked: false, equipment: [] };
const blockedRoom = { ...room, id: 'r2', name: 'Room 102', blocked: true };
const bookings = [
  { id: 'b1', roomId: 'r1', start: 600, end: 660, bookedBy: 'Math Dept' }, // 10:00–11:00
  { id: 'b2', roomId: 'r2', start: 700, end: 760, bookedBy: 'Other room' },
];
const check = (start: number, end: number, r = room, b = bookings) =>
  checkAvailability({ start, end }, r, b, NOW);

test('AC1: NaN times are rejected with a "valid times" message', () => {
  const res = check(NaN, NaN);
  assert.equal(res.decision, 'unavailable');
  assert.match(res.reason, /valid start and end/i);
});

test('AC1: end must be after start (equal and reversed are rejected)', () => {
  assert.equal(check(700, 700).decision, 'unavailable');
  assert.equal(check(720, 700).decision, 'unavailable');
});

test('AC1: times must stay inside 00:00–24:00; end exactly 24:00 is allowed', () => {
  assert.equal(check(-5, 60).decision, 'unavailable');
  assert.equal(check(1380, 1441).decision, 'unavailable');
  assert.equal(check(1380, 1440).decision, 'available');
});

test('AC1: start must be strictly after "now" (before and exactly at now rejected, one minute later accepted)', () => {
  assert.equal(check(NOW - 1, NOW + 30).decision, 'unavailable');
  const atNow = check(NOW, NOW + 30); // Practice #06 case "Starts now": now=540, request 540-570
  assert.equal(atNow.decision, 'unavailable');
  assert.match(atNow.reason, /after the current time \(09:00\)/);
  assert.equal(check(NOW + 1, NOW + 30).decision, 'available');
});

test('AC2 boundary: exactly 120 minutes is available, 121 is rejected', () => {
  assert.equal(check(700, 820).decision, 'available');
  const res = check(700, 821);
  assert.equal(res.decision, 'unavailable');
  assert.match(res.reason, /120/);
});

test('AC3: a blocked room is never available, even for a free slot', () => {
  const res = check(800, 860, blockedRoom);
  assert.equal(res.decision, 'unavailable');
  assert.match(res.reason, /blocked/i);
});

test('AC4: overlapping an existing booking is rejected and names the booking', () => {
  const res = check(630, 690);
  assert.equal(res.decision, 'unavailable');
  assert.match(res.reason, /10:00.*11:00.*Math Dept/);
});

test('AC4 boundary: touching intervals do not overlap, one-minute overlap does', () => {
  assert.equal(check(541, 600).decision, 'available'); // ends exactly when b1 starts (start is after now)
  assert.equal(check(660, 720).decision, 'available'); // starts exactly when b1 ends
  assert.equal(check(541, 601).decision, 'unavailable'); // 1 minute into b1
  assert.equal(check(659, 720).decision, 'unavailable'); // 1 minute before b1 ends
});

test("AC4: another room's bookings are ignored", () => {
  assert.equal(check(700, 760).decision, 'available'); // b2 belongs to r2
});

test('AC5: checking never mutates bookings, room or interval', () => {
  const b = structuredClone(bookings);
  const r = structuredClone(room);
  const interval = { start: 630, end: 690 };
  const snapshot = JSON.stringify({ b, r, interval });
  Object.freeze(r);
  b.forEach(Object.freeze);
  Object.freeze(b);
  checkAvailability(interval, r, b, NOW);
  checkAvailability({ start: 800, end: 860 }, r, b, NOW);
  assert.equal(JSON.stringify({ b, r, interval }), snapshot);
});
