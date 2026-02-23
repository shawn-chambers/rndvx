import { RecurrenceRule } from '@prisma/client';
import { prisma } from '../lib/prisma';

function computeNextDate(current: Date, rule: RecurrenceRule): Date {
  const next = new Date(current);
  switch (rule) {
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      throw Object.assign(new Error('Meeting has no recurrence rule'), { status: 400 });
  }
  return next;
}

export async function generateInstances(
  parentMeetingId: string,
  requesterId: string,
  count: number = 4,
) {
  if (count < 1 || count > 52) {
    throw Object.assign(new Error('count must be between 1 and 52'), { status: 400 });
  }

  const parent = await prisma.meeting.findUnique({ where: { id: parentMeetingId } });
  if (!parent) {
    throw Object.assign(new Error('Meeting not found'), { status: 404 });
  }
  if (parent.organizerId !== requesterId) {
    throw Object.assign(new Error('Only the organizer can generate instances'), { status: 403 });
  }
  if (parent.recurrence === 'NONE') {
    throw Object.assign(new Error('Meeting has no recurrence rule'), { status: 400 });
  }

  // Find the latest existing instance to avoid duplicates
  const lastInstance = await prisma.meeting.findFirst({
    where: { parentMeetingId },
    orderBy: { dateTime: 'desc' },
  });

  let baseDate = lastInstance ? lastInstance.dateTime : parent.dateTime;

  const instances = [];
  for (let i = 0; i < count; i++) {
    baseDate = computeNextDate(baseDate, parent.recurrence);
    instances.push({
      title: parent.title,
      description: parent.description,
      organizerId: parent.organizerId,
      groupId: parent.groupId,
      dateTime: new Date(baseDate),
      durationMinutes: parent.durationMinutes,
      quorumThreshold: parent.quorumThreshold,
      recurrence: parent.recurrence,
      locationName: parent.locationName,
      locationAddress: parent.locationAddress,
      locationPlaceId: parent.locationPlaceId,
      locationLat: parent.locationLat,
      locationLng: parent.locationLng,
      status: 'DRAFT' as const,
      parentMeetingId,
    });
  }

  await prisma.meeting.createMany({ data: instances });

  return prisma.meeting.findMany({
    where: { parentMeetingId },
    orderBy: { dateTime: 'asc' },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      rsvps: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}
