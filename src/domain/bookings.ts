import type { Booking } from './types.ts';

/** The one place that decides which bookings belong to a room. */
export function bookingsForRoom(bookings: Booking[], roomId: string | null): Booking[] {
  return roomId === null ? [] : bookings.filter((b) => b.roomId === roomId);
}

export function sortByStart(bookings: Booking[]): Booking[] {
  return bookings.slice().sort((a, b) => a.start - b.start);
}
