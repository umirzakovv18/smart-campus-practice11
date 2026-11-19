interface TimeRangeInputProps {
  startLabel: string;
  endLabel: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApplySlot: (start: string, end: string) => void;
}

const QUICK_SLOTS = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '14:00', end: '15:00' },
];

interface TimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function TimeField({ label, value, onChange }: TimeFieldProps) {
  return (
    <label className="flex-1">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        placeholder="HH:MM"
      />
    </label>
  );
}

export function TimeRangeInput({
  startLabel,
  endLabel,
  onStartChange,
  onEndChange,
  onApplySlot,
}: TimeRangeInputProps) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK_SLOTS.map((slot) => (
          <button
            key={`${slot.start}-${slot.end}`}
            type="button"
            onClick={() => onApplySlot(slot.start, slot.end)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
          >
            {slot.start} – {slot.end}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <TimeField label="Start time" value={startLabel} onChange={onStartChange} />
        <TimeField label="End time" value={endLabel} onChange={onEndChange} />
      </div>
      <p className="mt-1.5 text-[11px] text-gray-400">
        Max 120 minutes. Times use a 24-hour clock (00:00–24:00). Touching bookings are allowed.
      </p>
    </div>
  );
}
