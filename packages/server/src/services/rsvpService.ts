import { prisma } from '../lib/prisma';
import * as emailService from './emailService';

export async function upsertRsvp(meetingId: string, userId: string, status: string) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    throw Object.assign(new Error('Meeting not found'), { status: 404 });
  }

  const isOrganizer = meeting.organizerId === userId;
  if (!isOrganizer) {
    const hasRsvp = await prisma.rsvp.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (!hasRsvp) {
      const hasInvite = await prisma.invite.findFirst({
        where: { meetingId, inviteeId: userId },
      });
      if (!hasInvite) {
        throw Object.assign(new Error('Access denied'), { status: 403 });
      }
    }
  }

  const rsvp = await prisma.rsvp.upsert({
    where: { meetingId_userId: { meetingId, userId } },
    create: { meetingId, userId, status: status as any },
    update: { status: status as any },
    include: { user: { select: { email: true, name: true } } },
  });

  // Fire-and-forget email stub
  emailService
    .sendRsvpConfirmation(rsvp.user.email, meeting.title, status)
    .catch((err) => console.error('[email] rsvpConfirmation failed', err));

  // Check quorum after RSVP change
  await checkAndUpdateQuorum(meetingId);

  const { user: _, ...rsvpData } = rsvp;
  return rsvpData;
}

export async function getRsvpsForMeeting(meetingId: string, requesterId: string) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    throw Object.assign(new Error('Meeting not found'), { status: 404 });
  }

  const isOrganizer = meeting.organizerId === requesterId;
  if (!isOrganizer) {
    const hasRsvp = await prisma.rsvp.findUnique({
      where: { meetingId_userId: { meetingId, userId: requesterId } },
    });
    if (!hasRsvp) {
      const hasInvite = await prisma.invite.findFirst({
        where: { meetingId, inviteeId: requesterId },
      });
      if (!hasInvite) {
        throw Object.assign(new Error('Access denied'), { status: 403 });
      }
    }
  }

  return prisma.rsvp.findMany({
    where: { meetingId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function deleteRsvp(meetingId: string, userId: string) {
  const existing = await prisma.rsvp.findUnique({
    where: { meetingId_userId: { meetingId, userId } },
  });
  if (!existing) {
    throw Object.assign(new Error('RSVP not found'), { status: 404 });
  }

  await prisma.rsvp.delete({ where: { meetingId_userId: { meetingId, userId } } });
  await checkAndUpdateQuorum(meetingId);
}

async function checkAndUpdateQuorum(meetingId: string) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting || meeting.status === 'CANCELLED') return;

  const yesCount = await prisma.rsvp.count({
    where: { meetingId, status: 'YES' },
  });

  const shouldBeConfirmed = yesCount >= meeting.quorumThreshold;

  if (shouldBeConfirmed && meeting.status !== 'CONFIRMED') {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'CONFIRMED' },
    });

    // Notify all YES attendees
    const rsvps = await prisma.rsvp.findMany({
      where: { meetingId, status: 'YES' },
      include: { user: { select: { email: true } } },
    });
    rsvps.forEach((r) => {
      emailService
        .sendMeetingConfirmed(r.user.email, meeting.title, meeting.dateTime)
        .catch((err) => console.error('[email] meetingConfirmed failed', err));
    });
  } else if (!shouldBeConfirmed && meeting.status === 'CONFIRMED') {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'PENDING_QUORUM' },
    });
  }
}
