import * as cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { sendMeetingReminder } from './emailService';
import { generateInstances } from './recurrenceService';

// Runs every hour: send reminders for meetings starting within 24h
async function runReminderJob(): Promise<void> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const meetings = await prisma.meeting.findMany({
    where: {
      dateTime: { gte: now, lte: in24h },
      reminderSentAt: null,
      status: { in: ['CONFIRMED', 'PENDING_QUORUM'] },
    },
    include: {
      rsvps: {
        include: { user: { select: { email: true } } },
      },
    },
  });

  for (const meeting of meetings) {
    const emails = meeting.rsvps
      .filter((r) => r.status !== 'NO')
      .map((r) => r.user.email);

    await Promise.allSettled(
      emails.map((email) => sendMeetingReminder(email, meeting.title, meeting.dateTime)),
    );

    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { reminderSentAt: new Date() },
    });

    console.log(`[scheduler] Sent reminders for meeting ${meeting.id} to ${emails.length} attendees`);
  }
}

// Runs daily at midnight: generate next batch for recurring meetings whose latest instance is within 7 days
async function runRecurrenceJob(): Promise<void> {
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Find parent meetings (recurring, no parentMeetingId) that have instances
  const parents = await prisma.meeting.findMany({
    where: {
      recurrence: { not: 'NONE' },
      parentMeetingId: null,
    },
  });

  for (const parent of parents) {
    const latest = await prisma.meeting.findFirst({
      where: { parentMeetingId: parent.id },
      orderBy: { dateTime: 'desc' },
    });

    const latestDate = latest ? latest.dateTime : parent.dateTime;
    if (latestDate <= in7days) {
      try {
        await generateInstances(parent.id, parent.organizerId, 4);
        console.log(`[scheduler] Generated instances for parent meeting ${parent.id}`);
      } catch (err) {
        console.error(`[scheduler] Failed to generate instances for ${parent.id}:`, err);
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tasks: any[] = [];

export function startScheduler(): void {
  const reminderTask = cron.schedule('0 * * * *', async () => {
    console.log('[scheduler] Running reminder job');
    try {
      await runReminderJob();
    } catch (err) {
      console.error('[scheduler] Reminder job error:', err);
    }
  });

  const recurrenceTask = cron.schedule('0 0 * * *', async () => {
    console.log('[scheduler] Running recurrence job');
    try {
      await runRecurrenceJob();
    } catch (err) {
      console.error('[scheduler] Recurrence job error:', err);
    }
  });

  tasks = [reminderTask, recurrenceTask];
  console.log('[scheduler] Started: reminder (hourly) + recurrence (daily midnight)');
}

export function stopScheduler(): void {
  tasks.forEach((t) => t.stop());
  tasks = [];
  console.log('[scheduler] Stopped');
}
