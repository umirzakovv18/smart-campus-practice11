import { useReducer } from 'react';
import { Clock, Building2, CheckCheck, RotateCcw } from 'lucide-react';
import { ROOMS, BOOKINGS, SIMULATED_NOW_MINUTES } from '@/data/campusData';
import { bookingsForRoom } from '@/domain/bookings';
import {
  checkerReducer,
  getVisibleRooms,
  initialCheckerState,
  type CheckerAction,
  type CheckerContext,
  type CheckerState,
} from '@/domain/checkerState';
import { minutesToLabel, parseInterval, toCandidate } from '@/domain/time';
import { StepHeader } from '@/components/StepHeader';
import { RoomFilters } from '@/components/RoomFilters';
import { RoomSelector } from '@/components/RoomSelector';
import { TimeRangeInput } from '@/components/TimeRangeInput';
import { ResultPanel } from '@/components/ResultPanel';
import { Timeline } from '@/components/Timeline';
import { BookingList } from '@/components/BookingList';
import { ExplanationPanel } from '@/components/ExplanationPanel';

const CONTEXT: CheckerContext = {
  rooms: ROOMS,
  bookings: BOOKINGS,
  nowMinutes: SIMULATED_NOW_MINUTES,
};

const reducer = (state: CheckerState, action: CheckerAction) =>
  checkerReducer(state, action, CONTEXT);

function App() {
  const [state, dispatch] = useReducer(reducer, initialCheckerState);

  const visibleRooms = getVisibleRooms(state, CONTEXT);
  const selectedRoom = ROOMS.find((r) => r.id === state.selectedRoomId) ?? null;
  const roomBookings = bookingsForRoom(BOOKINGS, state.selectedRoomId);
  const candidate = toCandidate(parseInterval(state.startLabel, state.endLabel));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Smart Campus Room Checker</h1>
            <p className="text-xs text-gray-500">Check room availability — no booking is committed.</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
            <Clock className="h-3.5 w-3.5" />
            Simulated now: {minutesToLabel(SIMULATED_NOW_MINUTES)}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <section>
          <StepHeader step={1} title="What do you need?" />
          <RoomFilters
            attendeesText={state.attendeesText}
            equipment={state.equipment}
            matchCount={visibleRooms.length}
            totalCount={ROOMS.length}
            onAttendeesChange={(value) => dispatch({ type: 'setAttendees', value })}
            onToggleEquipment={(item) => dispatch({ type: 'toggleEquipment', item })}
          />
        </section>

        <section>
          <StepHeader step={2} title="Select a room" />
          <RoomSelector
            rooms={visibleRooms}
            selectedId={state.selectedRoomId}
            onSelect={(roomId) => dispatch({ type: 'selectRoom', roomId })}
            onClearFilters={() => dispatch({ type: 'clearFilters' })}
          />
        </section>

        <section>
          <StepHeader step={3} title="Choose a time interval" />
          <TimeRangeInput
            startLabel={state.startLabel}
            endLabel={state.endLabel}
            onStartChange={(value) => dispatch({ type: 'setStart', value })}
            onEndChange={(value) => dispatch({ type: 'setEnd', value })}
            onApplySlot={(start, end) => dispatch({ type: 'applySlot', start, end })}
          />
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => dispatch({ type: 'check' })}
            disabled={!state.selectedRoomId || !state.startLabel || !state.endLabel}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" />
            Check Availability
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'reset' })}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        <ResultPanel result={state.result} />

        {state.result && selectedRoom && (
          <ExplanationPanel
            key={`${selectedRoom.id}|${state.startLabel}|${state.endLabel}|${state.result.reasonCode}`}
            room={selectedRoom}
            startLabel={state.startLabel}
            endLabel={state.endLabel}
            nowMinutes={SIMULATED_NOW_MINUTES}
            result={state.result}
          />
        )}

        {selectedRoom && (
          <>
            <Timeline bookings={roomBookings} candidate={candidate} nowMinutes={SIMULATED_NOW_MINUTES} />
            <BookingList roomName={selectedRoom.name} bookings={roomBookings} />
          </>
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-6">
        <p className="text-center text-[11px] text-gray-400">
          Fictional sample data for demonstration. No bookings are actually saved.
        </p>
      </footer>
    </div>
  );
}

export default App;
