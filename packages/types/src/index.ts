export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Meeting types

export type MeetingStatus = 'DRAFT' | 'PENDING_QUORUM' | 'CONFIRMED' | 'CANCELLED';
export type RsvpStatus = 'PENDING' | 'YES' | 'NO' | 'MAYBE';
export type RecurrenceRule = 'NONE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  organizerId: string;
  dateTime: Date;
  durationMinutes: number;
  status: MeetingStatus;
  quorumThreshold: number;
  recurrence: RecurrenceRule;
  locationName: string | null;
  locationAddress: string | null;
  locationPlaceId: string | null;
  locationLat: number | null;
  locationLng: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rsvp {
  id: string;
  meetingId: string;
  userId: string;
  status: RsvpStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  dateTime: string;
  durationMinutes?: number;
  quorumThreshold?: number;
  recurrence?: RecurrenceRule;
  locationName?: string;
  locationAddress?: string;
  locationPlaceId?: string;
  locationLat?: number;
  locationLng?: number;
}

export type UpdateMeetingPayload = Partial<CreateMeetingPayload> & {
  status?: MeetingStatus;
};

export interface RsvpUpdatePayload {
  status: RsvpStatus;
}

export interface MeetingOrganizer {
  id: string;
  name: string;
  email: string;
}

export interface RsvpWithUser extends Rsvp {
  user: { id: string; name: string };
}

export interface MeetingWithDetails extends Meeting {
  organizer: MeetingOrganizer;
  rsvps: RsvpWithUser[];
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}
