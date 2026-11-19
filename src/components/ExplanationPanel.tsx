import { useState } from 'react';
import { Sparkles, Info, Loader2 } from 'lucide-react';
import { DEMO_ADAPTERS } from '@/explain/adapters';
import { LIMITS } from '@/explain/contract';
import { buildExplanationRequest, explainAvailability, type ExplanationView } from '@/explain/service';
import type { CheckResult, Room } from '@/domain/types';

interface ExplanationPanelProps {
  room: Room;
  startLabel: string;
  endLabel: string;
  nowMinutes: number;
  /** The deterministic result. This panel only explains it and never changes it. */
  result: CheckResult;
}

/**
 * Optional AI explanation. App renders it with a `key` built from the checked request,
 * so any change of room, time or result remounts it and drops an old explanation.
 */
export function ExplanationPanel({ room, startLabel, endLabel, nowMinutes, result }: ExplanationPanelProps) {
  const [question, setQuestion] = useState('');
  const [adapterId, setAdapterId] = useState(DEMO_ADAPTERS[0].id);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ExplanationView | null>(null);

  const adapter = DEMO_ADAPTERS.find((a) => a.id === adapterId) ?? DEMO_ADAPTERS[0];

  async function handleExplain() {
    setLoading(true);
    setView(null);
    const request = buildExplanationRequest({ room, startLabel, endLabel, nowMinutes, result, question });
    const next = await explainAvailability(request, adapter, result.reason);
    setView(next);
    setLoading(false);
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-violet-300 bg-white p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <h3 className="text-sm font-semibold text-gray-800">Explain availability (optional)</h3>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-500">
          Your question (optional, max {LIMITS.question} characters)
        </span>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder="e.g. Why can't I book this room?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
        <span className={`text-[11px] ${question.trim().length > LIMITS.question ? 'text-red-600' : 'text-gray-400'}`}>
          {question.trim().length}/{LIMITS.question}
        </span>
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-gray-500">Explanation source (demo)</span>
          <select
            value={adapterId}
            onChange={(e) => setAdapterId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
          >
            {DEMO_ADAPTERS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleExplain}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generating…' : 'Explain availability'}
        </button>
      </div>

      {view && (
        <div role="status" className="rounded-lg bg-violet-50 p-3 text-sm">
          {view.status === 'generated' ? (
            <>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                AI-generated explanation{view.isMock ? ' · mock model' : ''} · does not change the booking status
              </p>
              <p className="text-gray-800">{view.text}</p>
            </>
          ) : (
            <>
              <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                <Info className="h-3.5 w-3.5" />
                {view.status === 'rejected' ? 'Request rejected' : 'AI explanation unavailable'} · showing the rule-based reason
              </p>
              <p className="text-gray-800">{view.text}</p>
              <p className="mt-1 text-[11px] text-gray-500">Details: {view.problem}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
