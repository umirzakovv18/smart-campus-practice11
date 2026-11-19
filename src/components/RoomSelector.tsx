import { MapPin, Users, Ban, SearchX } from 'lucide-react';
import { EQUIPMENT_LABELS } from '@/data/campusData';
import type { Room } from '@/domain/types';

interface RoomSelectorProps {
  rooms: Room[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearFilters: () => void;
}

export function RoomSelector({ rooms, selectedId, onSelect, onClearFilters }: RoomSelectorProps) {
  // F4 – clear empty state when no room matches the requirements
  if (rooms.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center"
      >
        <SearchX className="h-6 w-6 text-gray-400" />
        <p className="text-sm font-semibold text-gray-700">No rooms match your requirements</p>
        <p className="text-xs text-gray-500">
          Try fewer attendees or remove some of the required equipment.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {rooms.map((room) => {
        const selected = room.id === selectedId;
        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelect(room.id)}
            aria-pressed={selected}
            className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all duration-200 ${
              selected
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold ${room.blocked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {room.name}
                </span>
                {room.blocked && <Ban className="h-3.5 w-3.5 shrink-0 text-red-400" />}
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {room.building}
                </span>
                <span className="flex items-center gap-0.5">
                  <Users className="h-3 w-3" />
                  {room.capacity}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                {room.equipment.map((item) => EQUIPMENT_LABELS[item]).join(' · ')}
              </p>
            </div>
            <span
              className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                room.blocked
                  ? 'bg-red-100 text-red-600'
                  : selected
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
              }`}
            >
              {room.blocked ? 'Blocked' : 'Open'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
