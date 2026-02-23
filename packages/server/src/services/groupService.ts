import { prisma } from '../lib/prisma';

export async function listGroups(userId: string) {
  return prisma.group.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!group) {
    throw Object.assign(new Error('Group not found'), { status: 404 });
  }
  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) {
    throw Object.assign(new Error('You are not a member of this group'), { status: 403 });
  }
  return group;
}

export async function createGroup(ownerId: string, data: { name: string }) {
  return prisma.group.create({
    data: {
      name: data.name,
      ownerId,
      members: {
        create: { userId: ownerId, role: 'OWNER' },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export async function updateGroup(groupId: string, userId: string, data: { name?: string }) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw Object.assign(new Error('Group not found'), { status: 404 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    throw Object.assign(new Error('Only group admins can update the group'), { status: 403 });
  }

  return prisma.group.update({
    where: { id: groupId },
    data,
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export async function deleteGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw Object.assign(new Error('Group not found'), { status: 404 });
  }
  if (group.ownerId !== userId) {
    throw Object.assign(new Error('Only the group owner can delete the group'), { status: 403 });
  }
  await prisma.group.delete({ where: { id: groupId } });
}

export async function addMember(
  groupId: string,
  requesterId: string,
  data: { userId: string; role?: 'ADMIN' | 'MEMBER' },
) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requesterId } },
  });
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    throw Object.assign(new Error('Only group admins can add members'), { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  return prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId: data.userId } },
    create: { groupId, userId: data.userId, role: data.role ?? 'MEMBER' },
    update: { role: data.role ?? 'MEMBER' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function updateMemberRole(
  groupId: string,
  requesterId: string,
  memberId: string,
  role: 'ADMIN' | 'MEMBER',
) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw Object.assign(new Error('Group not found'), { status: 404 });
  }
  if (group.ownerId !== requesterId) {
    throw Object.assign(new Error('Only the group owner can change roles'), { status: 403 });
  }
  if (memberId === requesterId) {
    throw Object.assign(new Error('Cannot change your own role'), { status: 400 });
  }

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: memberId } },
  });
  if (!member) {
    throw Object.assign(new Error('Member not found in group'), { status: 404 });
  }

  return prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: memberId } },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function removeMember(groupId: string, requesterId: string, memberId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw Object.assign(new Error('Group not found'), { status: 404 });
  }

  const requesterMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requesterId } },
  });

  const isSelf = requesterId === memberId;
  const isOwnerOrAdmin =
    requesterMembership?.role === 'OWNER' || requesterMembership?.role === 'ADMIN';

  if (!isSelf && !isOwnerOrAdmin) {
    throw Object.assign(new Error('You do not have permission to remove this member'), { status: 403 });
  }
  if (memberId === group.ownerId) {
    throw Object.assign(new Error('Cannot remove the group owner'), { status: 400 });
  }

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: memberId } },
  });
  if (!member) {
    throw Object.assign(new Error('Member not found in group'), { status: 404 });
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: memberId } },
  });
}
