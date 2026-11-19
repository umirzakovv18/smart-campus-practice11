export type Equipment =
  | 'projector'
  | 'whiteboard'
  | 'microphone'
  | 'computers'
  | 'video-conferencing';

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  equipment: Equipment[];
  blocked: boolean;
}

export interface Booking {
  id: string;
  roomId: string;
  start: number; // minutes since midnight
  end: number; // minutes since midnight
  bookedBy: string;
}

export interface Interval {
  start: number;
  end: number;
}

/** What the user asks for when searching the catalog (F1, F2). */
export interface RoomRequirements {
  /** null = no capacity requirement */
  attendees: number | null;
  /** room must contain ALL of these */
  equipment: Equipment[];
}

export type Decision = 'available' | 'unavailable';

/** Machine-readable reason for a decision; used by the explanation feature. */
export type ReasonCode =
  | 'AVAILABLE'
  | 'INVALID_TIME'
  | 'OUTSIDE_DAY'
  | 'END_NOT_AFTER_START'
  | 'START_NOT_AFTER_NOW'
  | 'TOO_LONG'
  | 'ROOM_BLOCKED'
  | 'OVERLAP';

export interface CheckResult {
  decision: Decision;
  reason: string;
  /** Present on every result produced by checkAvailability. */
  reasonCode?: ReasonCode;
  /** Only for OVERLAP: the time of the conflicting booking (no names). */
  conflict?: Interval;
}
