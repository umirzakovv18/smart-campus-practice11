import type { Room, RoomRequirements } from './types.ts';

/** F1 – room capacity must be greater than or equal to the attendees. */
export function meetsCapacity(room: Room, attendees: number | null): boolean {
  return attendees === null || room.capacity >= attendees;
}

/** F2 – the room must contain ALL required items. */
export function hasAllEquipment(room: Room, required: Room['equipment']): boolean {
  return required.every((item) => room.equipment.includes(item));
}

/**
 * Rooms that satisfy the requirements. Blocked rooms are kept in the list so
 * the user sees them; F3 is enforced by checkAvailability (AC3).
 * An empty result is the F4 "no rooms match" case.
 */
export function filterRooms(rooms: Room[], requirements: RoomRequirements): Room[] {
  return rooms.filter(
    (room) =>
      meetsCapacity(room, requirements.attendees) &&
      hasAllEquipment(room, requirements.equipment),
  );
}

/** Text field -> number of attendees; empty, zero, negative or invalid = no requirement. */
export function parseAttendees(text: string): number | null {
  const n = Number(text.trim());
  return text.trim() !== '' && Number.isFinite(n) && n > 0 ? Math.ceil(n) : null;
}
