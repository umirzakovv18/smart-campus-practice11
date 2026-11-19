import { CheckCircle2, XCircle } from 'lucide-react';
import type { CheckResult, Decision } from '@/domain/types';

interface ResultPanelProps {
  result: CheckResult | null;
}

const VARIANTS: Record<
  Decision,
  { Icon: typeof CheckCircle2; title: string; box: string; icon: string; heading: string; body: string }
> = {
  available: {
    Icon: CheckCircle2,
    title: 'Available',
    box: 'border-green-200 bg-green-50',
    icon: 'text-green-600',
    heading: 'text-green-800',
    body: 'text-green-700',
  },
  unavailable: {
    Icon: XCircle,
    title: 'Unavailable',
    box: 'border-red-200 bg-red-50',
    icon: 'text-red-600',
    heading: 'text-red-800',
    body: 'text-red-700',
  },
};

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-400">
        Select a room and enter a time range to check availability.
      </div>
    );
  }

  const v = VARIANTS[result.decision];
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${v.box}`}
    >
      <v.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${v.icon}`} />
      <div>
        <p className={`text-sm font-bold ${v.heading}`}>
          {v.title}
          <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-wide opacity-70">
            Confirmed by booking rules
          </span>
        </p>
        <p className={`mt-0.5 text-sm ${v.body}`}>{result.reason}</p>
      </div>
    </div>
  );
}
