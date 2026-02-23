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
  groupId: string | null;
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

// ─── Group types ──────────────────────────────────────────────────────────────

export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupWithMembers extends Group {
  members: (GroupMember & { user: { id: string; name: string; email: string } })[];
}

export interface CreateGroupPayload {
  name: string;
}

export interface UpdateGroupPayload {
  name?: string;
}

// ─── Invite types ─────────────────────────────────────────────────────────────

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface Invite {
  id: string;
  token: string;
  senderId: string;
  inviteeId: string | null;
  inviteeEmail: string;
  groupId: string | null;
  meetingId: string | null;
  status: InviteStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InviteWithDetails extends Invite {
  sender: { id: string; name: string; email: string };
  group: Group | null;
  meeting: Pick<Meeting, 'id' | 'title' | 'dateTime'> | null;
}

export interface CreateInvitePayload {
  inviteeEmail: string;
  groupId?: string;
  meetingId?: string;
  expiresAt?: string;
}

export interface RespondInvitePayload {
  status: 'ACCEPTED' | 'DECLINED';
}

// ─── Location / Places types ──────────────────────────────────────────────────

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types?: string[];
}

export interface LocationVote {
  id: string;
  meetingId: string;
  userId: string;
  placeId: string;
  placeName: string;
  placeAddress: string;
  createdAt: Date;
}

export interface CastLocationVotePayload {
  meetingId: string;
  placeId: string;
  placeName: string;
  placeAddress: string;
  lat?: number;
  lng?: number;
}

// ─── API Route Constants ─────────────────────────────────────────────────────
// Single source of truth for all API paths. Used by both client and server.

export const API = {
  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',

  // Users
  USERS_ME: '/users/me',

  // Meetings
  MEETINGS: '/meetings',
  meeting: (id: string) => `/meetings/${id}`,
  meetingRsvps: (id: string) => `/meetings/${id}/rsvps`,
  meetingLocationVotes: (id: string) => `/meetings/${id}/location-votes`,

  // Invites
  INVITES: '/invites',
  inviteByToken: (token: string) => `/invites/token/${token}`,
  inviteRespond: (token: string) => `/invites/token/${token}/respond`,
  invite: (id: string) => `/invites/${id}`,

  // Groups
  GROUPS: '/groups',
  group: (id: string) => `/groups/${id}`,
  groupMembers: (id: string) => `/groups/${id}/members`,
  groupMember: (groupId: string, memberId: string) => `/groups/${groupId}/members/${memberId}`,

  // Places
  PLACES_SEARCH: '/places/search',
  placeDetail: (placeId: string) => `/places/${placeId}`,
  meetingAutoPick: (meetingId: string) => `/places/meetings/${meetingId}/auto-pick`,
} as const;
