import { minutesToLabel } from '@/domain/time';
import type { Booking, Interval } from '@/domain/types';

interface TimelineProps {
  bookings: Booking[];
  candidate: Interval | null;
  nowMinutes: number;
}

const DAY_START = 8 * 60; // 08:00
const DAY_END = 22 * 60;  // 22:00
const SPAN = DAY_END - DAY_START;

export function Timeline({ bookings, candidate, nowMinutes }: TimelineProps) {
  const clamp = (m: number) => Math.max(DAY_START, Math.min(DAY_END, m));
  const pct = (m: number) => ((clamp(m) - DAY_START) / SPAN) * 100;

  const nowPct = pct(nowMinutes);

  // Hour ticks
  const ticks: number[] = [];
  for (let h = DAY_START; h <= DAY_END; h += 120) ticks.push(h);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Today's Schedule
        </h4>
        <span className="text-[10px] text-gray-400">{minutesToLabel(DAY_START)} – {minutesToLabel(DAY_END)}</span>
      </div>

      <div className="relative h-14 rounded-lg bg-gray-100">
        {/* Existing bookings */}
        {bookings.map((b) => (
          <div
            key={b.id}
            className="absolute top-1 bottom-1 flex items-center justify-center overflow-hidden rounded-md bg-gray-300 px-1 text-[9px] font-medium text-gray-600"
            style={{ left: `${pct(b.start)}%`, width: `${pct(b.end) - pct(b.start)}%` }}
            title={`${minutesToLabel(b.start)}–${minutesToLabel(b.end)} — ${b.bookedBy}`}
          >
            <span className="truncate">{b.bookedBy}</span>
          </div>
        ))}

        {/* Candidate interval */}
        {candidate && candidate.start < candidate.end && (
          <div
            className="absolute top-0 bottom-0 rounded-md border-2 border-dashed border-blue-400 bg-blue-200/50"
            style={{ left: `${pct(candidate.start)}%`, width: `${pct(candidate.end) - pct(candidate.start)}%` }}
          />
        )}

        {/* Current-time marker */}
        {nowPct >= 0 && nowPct <= 100 && (
          <div
            className="absolute top-0 bottom-0 w-px bg-red-400"
            style={{ left: `${nowPct}%` }}
          >
            <span className="absolute -top-0.5 -translate-x-1/2 rounded bg-red-500 px-1 text-[8px] font-bold text-white">
              NOW
            </span>
          </div>
        )}
      </div>

      {/* Hour labels */}
      <div className="relative mt-1 h-3.5">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2 text-[9px] text-gray-400"
            style={{ left: `${pct(t)}%` }}
          >
            {minutesToLabel(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
