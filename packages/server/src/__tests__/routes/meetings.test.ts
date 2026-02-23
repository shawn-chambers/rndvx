import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../helpers/testApp';
import { authHeader } from '../helpers/auth';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    meeting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    rsvp: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    invite: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma';

const ORGANIZER_ID = 'user-org';
const OTHER_USER_ID = 'user-other';

const mockUser = {
  id: ORGANIZER_ID,
  email: 'org@example.com',
  name: 'Organizer',
  passwordHash: 'x',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMeeting = {
  id: 'meeting-1',
  title: 'Weekly Hangout',
  description: 'Fun times',
  organizerId: ORGANIZER_ID,
  groupId: null,
  dateTime: new Date('2026-03-02T19:00:00.000Z'),
  durationMinutes: 60,
  status: 'DRAFT',
  quorumThreshold: 3,
  recurrence: 'NONE',
  locationName: null,
  locationAddress: null,
  locationPlaceId: null,
  locationLat: null,
  locationLng: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  organizer: { id: ORGANIZER_ID, name: 'Organizer', email: 'org@example.com' },
  rsvps: [],
  invites: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/meetings ────────────────────────────────────────────────────────
describe('GET /api/meetings', () => {
  it('returns meetings list for authenticated user', async () => {
    (prisma.meeting.findMany as any).mockResolvedValue([mockMeeting]);

    const res = await request(app).get('/api/meetings').set(authHeader(ORGANIZER_ID));

    expect(res.status).toBe(200);
    expect(res.body.meetings).toHaveLength(1);
    expect(res.body.meetings[0].title).toBe('Weekly Hangout');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/meetings');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/meetings/:id ────────────────────────────────────────────────────
describe('GET /api/meetings/:id', () => {
  it('returns meeting when user is organizer', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });

    const res = await request(app)
      .get('/api/meetings/meeting-1')
      .set(authHeader(ORGANIZER_ID));

    expect(res.status).toBe(200);
    expect(res.body.meeting.id).toBe('meeting-1');
  });

  it('returns 404 for non-existent meeting', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/meetings/does-not-exist')
      .set(authHeader(ORGANIZER_ID));

    expect(res.status).toBe(404);
  });

  it('returns 403 when user has no access', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });

    const res = await request(app)
      .get('/api/meetings/meeting-1')
      .set(authHeader(OTHER_USER_ID));

    expect(res.status).toBe(403);
  });
});

// ─── POST /api/meetings ───────────────────────────────────────────────────────
describe('POST /api/meetings', () => {
  it('creates a meeting with full ISO dateTime', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.meeting.create as any).mockResolvedValue({ ...mockMeeting });

    const res = await request(app)
      .post('/api/meetings')
      .set(authHeader(ORGANIZER_ID))
      .send({
        title: 'Weekly Hangout',
        dateTime: '2026-03-02T19:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.meeting.title).toBe('Weekly Hangout');
  });

  it('creates a meeting with datetime-local format (2026-03-02T19:00)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.meeting.create as any).mockResolvedValue({ ...mockMeeting });

    const res = await request(app)
      .post('/api/meetings')
      .set(authHeader(ORGANIZER_ID))
      .send({
        title: 'Weekly Hangout',
        dateTime: '2026-03-02T19:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.meeting).toBeDefined();
  });

  it('creates a meeting with all optional fields', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.meeting.create as any).mockResolvedValue({
      ...mockMeeting,
      durationMinutes: 90,
      quorumThreshold: 5,
      recurrence: 'WEEKLY',
      locationName: 'Coffee Shop',
    });

    const res = await request(app)
      .post('/api/meetings')
      .set(authHeader(ORGANIZER_ID))
      .send({
        title: 'Weekly Hangout',
        dateTime: '2026-03-02T19:00',
        durationMinutes: 90,
        quorumThreshold: 5,
        recurrence: 'WEEKLY',
        locationName: 'Coffee Shop',
        locationAddress: '123 Main St',
        locationPlaceId: 'place-123',
        locationLat: 37.7749,
        locationLng: -122.4194,
      });

    expect(res.status).toBe(201);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/meetings')
      .set(authHeader(ORGANIZER_ID))
      .send({ dateTime: '2026-03-02T19:00' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 when dateTime is invalid', async () => {
    const res = await request(app)
      .post('/api/meetings')
      .set(authHeader(ORGANIZER_ID))
      .send({ title: 'Test', dateTime: 'not-a-date' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when dateTime is missing', async () => {
    const res = await request(app)
      .post('/api/meetings')
      .set(authHeader(ORGANIZER_ID))
      .send({ title: 'Test' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid recurrence value', async () => {
    const res = await request(app)
      .post('/api/meetings')
      .set(authHeader(ORGANIZER_ID))
      .send({ title: 'Test', dateTime: '2026-03-02T19:00', recurrence: 'INVALID' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/meetings')
      .send({ title: 'Test', dateTime: '2026-03-02T19:00' });

    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/meetings/:id ────────────────────────────────────────────────────
describe('PUT /api/meetings/:id', () => {
  it('updates a meeting title', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });
    (prisma.meeting.update as any).mockResolvedValue({
      ...mockMeeting,
      title: 'Updated Title',
    });

    const res = await request(app)
      .put('/api/meetings/meeting-1')
      .set(authHeader(ORGANIZER_ID))
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.meeting.title).toBe('Updated Title');
  });

  it('updates dateTime with datetime-local format', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });
    (prisma.meeting.update as any).mockResolvedValue({
      ...mockMeeting,
      dateTime: new Date('2026-04-01T20:00'),
    });

    const res = await request(app)
      .put('/api/meetings/meeting-1')
      .set(authHeader(ORGANIZER_ID))
      .send({ dateTime: '2026-04-01T20:00' });

    expect(res.status).toBe(200);
  });

  it('returns 403 when non-organizer tries to update', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });

    const res = await request(app)
      .put('/api/meetings/meeting-1')
      .set(authHeader(OTHER_USER_ID))
      .send({ title: 'Hacked' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent meeting', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/meetings/no-meeting')
      .set(authHeader(ORGANIZER_ID))
      .send({ title: 'New Title' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/meetings/:id ─────────────────────────────────────────────────
describe('DELETE /api/meetings/:id', () => {
  it('deletes the meeting as organizer', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });
    (prisma.rsvp.findMany as any).mockResolvedValue([]);
    (prisma.meeting.delete as any).mockResolvedValue({});

    const res = await request(app)
      .delete('/api/meetings/meeting-1')
      .set(authHeader(ORGANIZER_ID));

    expect(res.status).toBe(204);
  });

  it('returns 403 when non-organizer tries to delete', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });

    const res = await request(app)
      .delete('/api/meetings/meeting-1')
      .set(authHeader(OTHER_USER_ID));

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent meeting', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/meetings/no-meeting')
      .set(authHeader(ORGANIZER_ID));

    expect(res.status).toBe(404);
  });
});

// ─── GET /api/meetings/:id/rsvps ──────────────────────────────────────────────
describe('GET /api/meetings/:id/rsvps', () => {
  it('returns RSVP list for meeting', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });
    (prisma.rsvp.findMany as any).mockResolvedValue([
      {
        id: 'rsvp-1',
        meetingId: 'meeting-1',
        userId: ORGANIZER_ID,
        status: 'YES',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: ORGANIZER_ID, name: 'Organizer', email: 'org@example.com' },
      },
    ]);

    const res = await request(app)
      .get('/api/meetings/meeting-1/rsvps')
      .set(authHeader(ORGANIZER_ID));

    expect(res.status).toBe(200);
    expect(res.body.rsvps).toHaveLength(1);
    expect(res.body.rsvps[0].status).toBe('YES');
  });

  it('returns 404 when meeting does not exist', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/meetings/no-meeting/rsvps')
      .set(authHeader(ORGANIZER_ID));

    expect(res.status).toBe(404);
  });
});

// ─── PUT /api/meetings/:id/rsvps ──────────────────────────────────────────────
describe('PUT /api/meetings/:id/rsvps', () => {
  const mockRsvp = {
    id: 'rsvp-1',
    meetingId: 'meeting-1',
    userId: ORGANIZER_ID,
    status: 'YES',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { email: 'org@example.com', name: 'Organizer' },
  };

  it('upserts an RSVP with YES status', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });
    (prisma.rsvp.upsert as any).mockResolvedValue({ ...mockRsvp });
    (prisma.rsvp.count as any).mockResolvedValue(1);

    const res = await request(app)
      .put('/api/meetings/meeting-1/rsvps')
      .set(authHeader(ORGANIZER_ID))
      .send({ status: 'YES' });

    expect(res.status).toBe(200);
    expect(res.body.rsvp.status).toBe('YES');
    expect(res.body.rsvp).not.toHaveProperty('user');
  });

  it('upserts an RSVP with NO status', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });
    (prisma.rsvp.upsert as any).mockResolvedValue({ ...mockRsvp, status: 'NO' });
    (prisma.rsvp.count as any).mockResolvedValue(0);

    const res = await request(app)
      .put('/api/meetings/meeting-1/rsvps')
      .set(authHeader(ORGANIZER_ID))
      .send({ status: 'NO' });

    expect(res.status).toBe(200);
    expect(res.body.rsvp.status).toBe('NO');
  });

  it('returns 400 for invalid RSVP status', async () => {
    const res = await request(app)
      .put('/api/meetings/meeting-1/rsvps')
      .set(authHeader(ORGANIZER_ID))
      .send({ status: 'INVALID' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when meeting does not exist', async () => {
    (prisma.meeting.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/meetings/no-meeting/rsvps')
      .set(authHeader(ORGANIZER_ID))
      .send({ status: 'YES' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/meetings/:id/rsvps ──────────────────────────────────────────
describe('DELETE /api/meetings/:id/rsvps', () => {
  it('deletes an existing RSVP', async () => {
    (prisma.rsvp.findUnique as any).mockResolvedValue({
      id: 'rsvp-1',
      meetingId: 'meeting-1',
      userId: ORGANIZER_ID,
      status: 'YES',
    });
    (prisma.rsvp.delete as any).mockResolvedValue({});
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...mockMeeting });
    (prisma.rsvp.count as any).mockResolvedValue(0);

    const res = await request(app)
      .delete('/api/meetings/meeting-1/rsvps')
      .set(authHeader(ORGANIZER_ID));

    expect(res.status).toBe(204);
  });

  it('returns 404 when RSVP does not exist', async () => {
    (prisma.rsvp.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/meetings/meeting-1/rsvps')
      .set(authHeader(ORGANIZER_ID));

    expect(res.status).toBe(404);
  });
});

// ─── Quorum logic ─────────────────────────────────────────────────────────────
describe('Quorum system (via RSVP upsert)', () => {
  it('promotes meeting status to CONFIRMED when quorum is reached', async () => {
    const pendingMeeting = { ...mockMeeting, quorumThreshold: 2, status: 'DRAFT' };
    (prisma.meeting.findUnique as any).mockResolvedValue(pendingMeeting);
    (prisma.rsvp.upsert as any).mockResolvedValue({
      id: 'rsvp-1',
      meetingId: 'meeting-1',
      userId: ORGANIZER_ID,
      status: 'YES',
      user: { email: 'org@example.com', name: 'Organizer' },
    });
    // Count returns >= quorumThreshold
    (prisma.rsvp.count as any).mockResolvedValue(2);
    (prisma.meeting.update as any).mockResolvedValue({ ...pendingMeeting, status: 'CONFIRMED' });
    (prisma.rsvp.findMany as any).mockResolvedValue([]);

    const res = await request(app)
      .put('/api/meetings/meeting-1/rsvps')
      .set(authHeader(ORGANIZER_ID))
      .send({ status: 'YES' });

    expect(res.status).toBe(200);
    // Verify update was called to CONFIRM the meeting
    expect(prisma.meeting.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'CONFIRMED' },
      }),
    );
  });
});
