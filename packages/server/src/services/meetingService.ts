import { prisma } from '../lib/prisma';
import * as emailService from './emailService';

export async function listMeetings(userId: string) {
  // Return meetings where user is organizer or has an RSVP
  return prisma.meeting.findMany({
    where: {
      OR: [
        { organizerId: userId },
        { rsvps: { some: { userId } } },
      ],
    },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      rsvps: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { dateTime: 'asc' },
  });
}

export async function getMeeting(meetingId: string, requesterId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      rsvps: { include: { user: { select: { id: true, name: true } } } },
      invites: { select: { inviteeId: true, inviteeEmail: true, status: true } },
    },
  });
  if (!meeting) {
    throw Object.assign(new Error('Meeting not found'), { status: 404 });
  }

  const isOrganizer = meeting.organizerId === requesterId;
  const hasRsvp = meeting.rsvps.some((r) => r.userId === requesterId);
  const isInvited = meeting.invites.some((i) => i.inviteeId === requesterId);

  if (!isOrganizer && !hasRsvp && !isInvited) {
    throw Object.assign(new Error('You do not have access to this meeting'), { status: 403 });
  }

  // Strip invite details from response
  const { invites: _invites, ...rest } = meeting;
  return rest;
}

export async function createMeeting(organizerId: string, data: {
  title: string;
  description?: string;
  dateTime: string;
  durationMinutes?: number;
  quorumThreshold?: number;
  recurrence?: string;
  locationName?: string;
  locationAddress?: string;
  locationPlaceId?: string;
  locationLat?: number;
  locationLng?: number;
}) {
  const organizer = await prisma.user.findUnique({ where: { id: organizerId } });
  if (!organizer) {
    throw Object.assign(new Error('Organizer not found'), { status: 404 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      description: data.description,
      organizerId,
      dateTime: new Date(data.dateTime),
      durationMinutes: data.durationMinutes ?? 60,
      quorumThreshold: data.quorumThreshold ?? 3,
      recurrence: (data.recurrence as any) ?? 'NONE',
      locationName: data.locationName,
      locationAddress: data.locationAddress,
      locationPlaceId: data.locationPlaceId,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      status: 'DRAFT',
    },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      rsvps: true,
    },
  });

  emailService
    .sendMeetingCreated(organizer.email, meeting.title, meeting.dateTime)
    .catch((err) => console.error('[email] meetingCreated failed', err));

  return meeting;
}

export async function updateMeeting(meetingId: string, userId: string, data: {
  title?: string;
  description?: string;
  dateTime?: string;
  durationMinutes?: number;
  quorumThreshold?: number;
  recurrence?: string;
  locationName?: string;
  locationAddress?: string;
  locationPlaceId?: string;
  locationLat?: number;
  locationLng?: number;
  status?: string;
}) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    throw Object.assign(new Error('Meeting not found'), { status: 404 });
  }
  if (meeting.organizerId !== userId) {
    throw Object.assign(new Error('Only the organizer can update this meeting'), { status: 403 });
  }

  const updateData: Record<string, any> = { ...data };
  if (data.dateTime) {
    updateData.dateTime = new Date(data.dateTime);
  }
  if (data.recurrence) {
    updateData.recurrence = data.recurrence as any;
  }
  if (data.status !== undefined) {
    if (data.status === 'CANCELLED') {
      updateData.status = 'CANCELLED';
    } else if (data.status === 'CONFIRMED' || data.status === 'PENDING_QUORUM') {
      throw Object.assign(
        new Error('Status CONFIRMED and PENDING_QUORUM are managed by quorum logic and cannot be set directly'),
        { status: 400 },
      );
    } else {
      throw Object.assign(new Error(`Invalid status transition to '${data.status}'`), { status: 400 });
    }
  }

  return prisma.meeting.update({
    where: { id: meetingId },
    data: updateData,
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      rsvps: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

export async function deleteMeeting(meetingId: string, userId: string) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    throw Object.assign(new Error('Meeting not found'), { status: 404 });
  }
  if (meeting.organizerId !== userId) {
    throw Object.assign(new Error('Only the organizer can delete this meeting'), { status: 403 });
  }

  // Notify attendees before deletion
  const rsvps = await prisma.rsvp.findMany({
    where: { meetingId },
    include: { user: { select: { email: true } } },
  });
  rsvps.forEach((r) => {
    emailService
      .sendMeetingCancelled(r.user.email, meeting.title)
      .catch((err) => console.error('[email] meetingCancelled failed', err));
  });

  await prisma.meeting.delete({ where: { id: meetingId } });
}
