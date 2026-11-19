import type { Booking, Equipment, Room } from '@/domain/types';

export const ROOMS: Room[] = [
  { id: 'r1', name: 'Room 101', building: 'Engineering Block', capacity: 40, equipment: ['projector', 'whiteboard'], blocked: false },
  { id: 'r2', name: 'Room 102', building: 'Engineering Block', capacity: 25, equipment: ['whiteboard'], blocked: true },
  { id: 'r3', name: 'Room 201', building: 'Science Block', capacity: 60, equipment: ['projector', 'whiteboard', 'computers'], blocked: false },
  { id: 'r4', name: 'Room 202', building: 'Science Block', capacity: 30, equipment: ['projector', 'video-conferencing'], blocked: false },
  { id: 'r5', name: 'Auditorium A', building: 'Main Hall', capacity: 200, equipment: ['projector', 'microphone', 'video-conferencing'], blocked: false },
  { id: 'r6', name: 'Lab 301', building: 'Science Block', capacity: 20, equipment: ['computers', 'whiteboard'], blocked: false },
];

// "Now" is simulated so the demo is deterministic. 540 = 9:00 AM.
export const SIMULATED_NOW_MINUTES = 540;

export const BOOKINGS: Booking[] = [
  { id: 'b1', roomId: 'r1', start: 480, end: 540, bookedBy: 'CS Dept' },
  { id: 'b2', roomId: 'r1', start: 600, end: 660, bookedBy: 'Math Dept' },
  { id: 'b3', roomId: 'r3', start: 540, end: 600, bookedBy: 'Physics Lab' },
  { id: 'b4', roomId: 'r3', start: 720, end: 780, bookedBy: 'Chemistry Dept' },
  { id: 'b5', roomId: 'r4', start: 510, end: 570, bookedBy: 'Biology Dept' },
  { id: 'b6', roomId: 'r5', start: 540, end: 660, bookedBy: 'Guest Lecture' },
  { id: 'b7', roomId: 'r5', start: 900, end: 960, bookedBy: 'Cultural Event' },
  // Lab 301 (r6) intentionally has no bookings.
];

export const EQUIPMENT_OPTIONS: { id: Equipment; label: string }[] = [
  { id: 'projector', label: 'Projector' },
  { id: 'whiteboard', label: 'Whiteboard' },
  { id: 'microphone', label: 'Microphone' },
  { id: 'computers', label: 'Computers' },
  { id: 'video-conferencing', label: 'Video conferencing' },
];

export const EQUIPMENT_LABELS = Object.fromEntries(
  EQUIPMENT_OPTIONS.map((o) => [o.id, o.label]),
) as Record<Equipment, string>;
