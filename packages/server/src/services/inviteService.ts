import { prisma } from '../lib/prisma';

export async function listInvites(userId: string) {
  return prisma.invite.findMany({
    where: {
      OR: [{ senderId: userId }, { inviteeId: userId }],
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      group: true,
      meeting: { select: { id: true, title: true, dateTime: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getInviteByToken(token: string) {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      group: true,
      meeting: { select: { id: true, title: true, dateTime: true } },
    },
  });
  if (!invite) {
    throw Object.assign(new Error('Invite not found'), { status: 404 });
  }
  return invite;
}

export async function createInvite(
  senderId: string,
  data: {
    inviteeEmail: string;
    groupId?: string;
    meetingId?: string;
    expiresAt?: string;
  },
) {
  // Look up invitee by email if they exist
  const invitee = await prisma.user.findUnique({ where: { email: data.inviteeEmail } });

  // Validate group access if groupId provided
  if (data.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: senderId } },
    });
    if (!membership) {
      throw Object.assign(new Error('You are not a member of this group'), { status: 403 });
    }
  }

  // Validate meeting access if meetingId provided
  if (data.meetingId) {
    const meeting = await prisma.meeting.findUnique({ where: { id: data.meetingId } });
    if (!meeting) {
      throw Object.assign(new Error('Meeting not found'), { status: 404 });
    }
    if (meeting.organizerId !== senderId) {
      throw Object.assign(new Error('Only the organizer can invite to this meeting'), { status: 403 });
    }
  }

  return prisma.invite.create({
    data: {
      senderId,
      inviteeId: invitee?.id ?? null,
      inviteeEmail: data.inviteeEmail,
      groupId: data.groupId ?? null,
      meetingId: data.meetingId ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      status: 'PENDING',
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      group: true,
      meeting: { select: { id: true, title: true, dateTime: true } },
    },
  });
}

export async function respondToInvite(
  token: string,
  userId: string,
  status: 'ACCEPTED' | 'DECLINED',
) {
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) {
    throw Object.assign(new Error('Invite not found'), { status: 404 });
  }
  if (invite.status !== 'PENDING') {
    throw Object.assign(new Error('Invite has already been responded to'), { status: 409 });
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw Object.assign(new Error('Invite has expired'), { status: 410 });
  }

  // Verify the responding user matches invitee email
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  if (user.email !== invite.inviteeEmail && invite.inviteeId !== userId) {
    throw Object.assign(new Error('This invite was not sent to you'), { status: 403 });
  }

  const updated = await prisma.invite.update({
    where: { token },
    data: {
      status,
      inviteeId: userId,
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      group: true,
      meeting: { select: { id: true, title: true, dateTime: true } },
    },
  });

  // If accepted and invite is for a group, add user as member
  if (status === 'ACCEPTED' && invite.groupId) {
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: invite.groupId, userId } },
      create: { groupId: invite.groupId, userId, role: 'MEMBER' },
      update: {},
    });
  }

  // If accepted and invite is for a meeting, create an RSVP
  if (status === 'ACCEPTED' && invite.meetingId) {
    await prisma.rsvp.upsert({
      where: { meetingId_userId: { meetingId: invite.meetingId, userId } },
      create: { meetingId: invite.meetingId, userId, status: 'YES' },
      update: { status: 'YES' },
    });
  }

  return updated;
}

export async function deleteInvite(inviteId: string, userId: string) {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) {
    throw Object.assign(new Error('Invite not found'), { status: 404 });
  }
  if (invite.senderId !== userId) {
    throw Object.assign(new Error('Only the sender can delete this invite'), { status: 403 });
  }
  await prisma.invite.delete({ where: { id: inviteId } });
}
