import { EQUIPMENT_OPTIONS } from '@/data/campusData';
import type { Equipment } from '@/domain/types';

interface RoomFiltersProps {
  attendeesText: string;
  equipment: Equipment[];
  matchCount: number;
  totalCount: number;
  onAttendeesChange: (value: string) => void;
  onToggleEquipment: (item: Equipment) => void;
}

export function RoomFilters({
  attendeesText,
  equipment,
  matchCount,
  totalCount,
  onAttendeesChange,
  onToggleEquipment,
}: RoomFiltersProps) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-500">Number of attendees</span>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={attendeesText}
          onChange={(e) => onAttendeesChange(e.target.value)}
          placeholder="e.g. 30"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-40"
        />
      </label>

      <fieldset>
        <legend className="mb-1 text-xs font-medium text-gray-500">
          Required equipment (room must have all selected)
        </legend>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((option) => {
            const checked = equipment.includes(option.id);
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  checked
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleEquipment(option.id)}
                  className="h-3.5 w-3.5 accent-blue-600"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="text-[11px] text-gray-400" aria-live="polite">
        Showing {matchCount} of {totalCount} rooms.
      </p>
    </div>
  );
}
