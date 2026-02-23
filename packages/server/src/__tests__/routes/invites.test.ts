import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../helpers/testApp';
import { authHeader } from '../helpers/auth';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    invite: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    meeting: { findUnique: vi.fn() },
    groupMember: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma';

const SENDER_ID = 'user-sender';
const INVITEE_ID = 'user-invitee';

const mockInvite = {
  id: 'invite-1',
  token: 'token-abc',
  senderId: SENDER_ID,
  inviteeId: INVITEE_ID,
  inviteeEmail: 'invitee@example.com',
  groupId: null,
  meetingId: null,
  status: 'PENDING',
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  sender: { id: SENDER_ID, name: 'Sender', email: 'sender@example.com' },
  group: null,
  meeting: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/invites ─────────────────────────────────────────────────────────
describe('GET /api/invites', () => {
  it('returns invites for authenticated user', async () => {
    (prisma.invite.findMany as any).mockResolvedValue([mockInvite]);

    const res = await request(app).get('/api/invites').set(authHeader(SENDER_ID));

    expect(res.status).toBe(200);
    expect(res.body.invites).toHaveLength(1);
    expect(res.body.invites[0].id).toBe('invite-1');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/invites');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/invites/token/:token ────────────────────────────────────────────
describe('GET /api/invites/token/:token', () => {
  it('returns invite by token', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue({ ...mockInvite });

    const res = await request(app)
      .get('/api/invites/token/token-abc')
      .set(authHeader(SENDER_ID));

    expect(res.status).toBe(200);
    expect(res.body.invite.token).toBe('token-abc');
  });

  it('returns 404 for unknown token', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/invites/token/unknown')
      .set(authHeader(SENDER_ID));

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/invites ────────────────────────────────────────────────────────
describe('POST /api/invites', () => {
  it('creates an invite for an existing user', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: INVITEE_ID,
      email: 'invitee@example.com',
      name: 'Invitee',
    });
    (prisma.invite.create as any).mockResolvedValue({ ...mockInvite });

    const res = await request(app)
      .post('/api/invites')
      .set(authHeader(SENDER_ID))
      .send({ inviteeEmail: 'invitee@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.invite.inviteeEmail).toBe('invitee@example.com');
  });

  it('creates an invite for a non-existing user (by email only)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.invite.create as any).mockResolvedValue({
      ...mockInvite,
      inviteeId: null,
    });

    const res = await request(app)
      .post('/api/invites')
      .set(authHeader(SENDER_ID))
      .send({ inviteeEmail: 'newuser@example.com' });

    expect(res.status).toBe(201);
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/invites')
      .set(authHeader(SENDER_ID))
      .send({ inviteeEmail: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when inviteeEmail is missing', async () => {
    const res = await request(app)
      .post('/api/invites')
      .set(authHeader(SENDER_ID))
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 403 when sender is not a group member', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.groupMember.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/invites')
      .set(authHeader(SENDER_ID))
      .send({ inviteeEmail: 'test@example.com', groupId: 'group-1' });

    expect(res.status).toBe(403);
  });

  it('returns 403 when sender is not the meeting organizer', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.meeting.findUnique as any).mockResolvedValue({
      id: 'meeting-1',
      organizerId: 'different-user',
    });

    const res = await request(app)
      .post('/api/invites')
      .set(authHeader(SENDER_ID))
      .send({ inviteeEmail: 'test@example.com', meetingId: 'meeting-1' });

    expect(res.status).toBe(403);
  });

  it('returns 404 when meetingId does not exist', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.meeting.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/invites')
      .set(authHeader(SENDER_ID))
      .send({ inviteeEmail: 'test@example.com', meetingId: 'no-meeting' });

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/invites')
      .send({ inviteeEmail: 'test@example.com' });

    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/invites/token/:token/respond ────────────────────────────────────
describe('PUT /api/invites/token/:token/respond', () => {
  const inviteeUser = {
    id: INVITEE_ID,
    email: 'invitee@example.com',
    name: 'Invitee',
  };

  it('accepts an invite', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue({ ...mockInvite });
    (prisma.user.findUnique as any).mockResolvedValue(inviteeUser);
    (prisma.invite.update as any).mockResolvedValue({
      ...mockInvite,
      status: 'ACCEPTED',
    });

    const res = await request(app)
      .put('/api/invites/token/token-abc/respond')
      .set(authHeader(INVITEE_ID))
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.invite.status).toBe('ACCEPTED');
  });

  it('declines an invite', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue({ ...mockInvite });
    (prisma.user.findUnique as any).mockResolvedValue(inviteeUser);
    (prisma.invite.update as any).mockResolvedValue({
      ...mockInvite,
      status: 'DECLINED',
    });

    const res = await request(app)
      .put('/api/invites/token/token-abc/respond')
      .set(authHeader(INVITEE_ID))
      .send({ status: 'DECLINED' });

    expect(res.status).toBe(200);
    expect(res.body.invite.status).toBe('DECLINED');
  });

  it('returns 409 when invite has already been responded to', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue({
      ...mockInvite,
      status: 'ACCEPTED',
    });

    const res = await request(app)
      .put('/api/invites/token/token-abc/respond')
      .set(authHeader(INVITEE_ID))
      .send({ status: 'DECLINED' });

    expect(res.status).toBe(409);
  });

  it('returns 410 when invite has expired', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue({
      ...mockInvite,
      expiresAt: new Date('2020-01-01'), // past date
    });

    const res = await request(app)
      .put('/api/invites/token/token-abc/respond')
      .set(authHeader(INVITEE_ID))
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(410);
  });

  it('returns 403 when wrong user tries to respond', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue({ ...mockInvite });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'wrong-user',
      email: 'wrongemail@example.com',
      name: 'Wrong',
    });

    const res = await request(app)
      .put('/api/invites/token/token-abc/respond')
      .set(authHeader('wrong-user'))
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown token', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/invites/token/unknown-token/respond')
      .set(authHeader(INVITEE_ID))
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app)
      .put('/api/invites/token/token-abc/respond')
      .set(authHeader(INVITEE_ID))
      .send({ status: 'MAYBE' });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/invites/:id ──────────────────────────────────────────────────
describe('DELETE /api/invites/:id', () => {
  it('deletes invite as sender', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue({ ...mockInvite });
    (prisma.invite.delete as any).mockResolvedValue({});

    const res = await request(app)
      .delete('/api/invites/invite-1')
      .set(authHeader(SENDER_ID));

    expect(res.status).toBe(204);
  });

  it('returns 403 when non-sender tries to delete', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue({ ...mockInvite });

    const res = await request(app)
      .delete('/api/invites/invite-1')
      .set(authHeader(INVITEE_ID));

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent invite', async () => {
    (prisma.invite.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/invites/no-invite')
      .set(authHeader(SENDER_ID));

    expect(res.status).toBe(404);
  });
});
