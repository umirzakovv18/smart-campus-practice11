import { test } from 'node:test';
import assert from 'node:assert/strict';
import { labelToMinutes, minutesToLabel, parseInterval, toCandidate } from '../src/domain/time.ts';
import { ROOMS, BOOKINGS } from '../src/data/campusData.ts';

test('labelToMinutes parses valid labels and rejects invalid ones', () => {
  assert.equal(labelToMinutes('09:05'), 545);
  assert.equal(labelToMinutes('9:05'), 545);
  assert.equal(labelToMinutes(' 10:00 '), 600);
  assert.equal(labelToMinutes('24:00'), 1440);
  for (const bad of ['', 'abc', '25:00', '12:60', '9', '09:5']) {
    assert.ok(Number.isNaN(labelToMinutes(bad)), `"${bad}" should be NaN`);
  }
});

test('minutesToLabel formats and round-trips', () => {
  assert.equal(minutesToLabel(0), '00:00');
  assert.equal(minutesToLabel(545), '09:05');
  assert.equal(minutesToLabel(1440), '24:00');
  assert.equal(labelToMinutes(minutesToLabel(805)), 805);
});

test('parseInterval keeps NaN so AC1 can report it; toCandidate hides it from the UI', () => {
  assert.deepEqual(parseInterval('09:00', '10:00'), { start: 540, end: 600 });
  assert.ok(Number.isNaN(parseInterval('', '10:00').start));
  assert.equal(toCandidate(parseInterval('', '10:00')), null);
  assert.deepEqual(toCandidate({ start: 540, end: 600 }), { start: 540, end: 600 });
});

test('catalog: at least four rooms, each with id, name, capacity, equipment, blocked flag', () => {
  assert.ok(ROOMS.length >= 4);
  assert.equal(new Set(ROOMS.map((r) => r.id)).size, ROOMS.length);
  for (const r of ROOMS) {
    assert.ok(r.id && r.name && r.capacity > 0 && Array.isArray(r.equipment) && typeof r.blocked === 'boolean');
  }
});

test('catalog: every booking points to an existing room and has start < end', () => {
  const roomIds = new Set(ROOMS.map((r) => r.id));
  for (const b of BOOKINGS) {
    assert.ok(roomIds.has(b.roomId), `${b.id} -> unknown room ${b.roomId}`);
    assert.ok(b.start < b.end);
  }
});
