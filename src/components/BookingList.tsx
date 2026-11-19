import { minutesToLabel } from '@/domain/time';
import { sortByStart } from '@/domain/bookings';
import type { Booking } from '@/domain/types';

interface BookingListProps {
  roomName: string;
  bookings: Booking[];
}

export function BookingList({ roomName, bookings }: BookingListProps) {
  if (bookings.length === 0) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Existing bookings for {roomName}
      </h4>
      <ul className="space-y-1.5">
        {sortByStart(bookings).map((b) => (
          <li key={b.id} className="flex items-center justify-between text-sm text-gray-600">
            <span className="font-medium text-gray-700">
              {minutesToLabel(b.start)} – {minutesToLabel(b.end)}
            </span>
            <span className="text-gray-400">{b.bookedBy}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
