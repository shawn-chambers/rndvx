import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../helpers/testApp';
import { authHeader } from '../helpers/auth';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    group: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    groupMember: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma';

const OWNER_ID = 'user-owner';
const ADMIN_ID = 'user-admin';
const MEMBER_ID = 'user-member';
const OUTSIDER_ID = 'user-outsider';

const mockGroup = {
  id: 'group-1',
  name: 'The Crew',
  ownerId: OWNER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  members: [
    {
      id: 'gm-1',
      groupId: 'group-1',
      userId: OWNER_ID,
      role: 'OWNER',
      user: { id: OWNER_ID, name: 'Owner', email: 'owner@example.com' },
    },
    {
      id: 'gm-2',
      groupId: 'group-1',
      userId: MEMBER_ID,
      role: 'MEMBER',
      user: { id: MEMBER_ID, name: 'Member', email: 'member@example.com' },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/groups ──────────────────────────────────────────────────────────
describe('GET /api/groups', () => {
  it('returns groups for authenticated user', async () => {
    (prisma.group.findMany as any).mockResolvedValue([mockGroup]);

    const res = await request(app).get('/api/groups').set(authHeader(OWNER_ID));

    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].name).toBe('The Crew');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/groups');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/groups/:id ──────────────────────────────────────────────────────
describe('GET /api/groups/:id', () => {
  it('returns group details for member', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });

    const res = await request(app)
      .get('/api/groups/group-1')
      .set(authHeader(MEMBER_ID));

    expect(res.status).toBe(200);
    expect(res.body.group.name).toBe('The Crew');
  });

  it('returns 403 for non-member', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });

    const res = await request(app)
      .get('/api/groups/group-1')
      .set(authHeader(OUTSIDER_ID));

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent group', async () => {
    (prisma.group.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/groups/no-group')
      .set(authHeader(OWNER_ID));

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/groups ─────────────────────────────────────────────────────────
describe('POST /api/groups', () => {
  it('creates a group and adds creator as OWNER', async () => {
    (prisma.group.create as any).mockResolvedValue({ ...mockGroup });

    const res = await request(app)
      .post('/api/groups')
      .set(authHeader(OWNER_ID))
      .send({ name: 'The Crew' });

    expect(res.status).toBe(201);
    expect(res.body.group.name).toBe('The Crew');
    expect(res.body.group.members[0].role).toBe('OWNER');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set(authHeader(OWNER_ID))
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 when name is empty string', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set(authHeader(OWNER_ID))
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/groups')
      .send({ name: 'Test' });

    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/groups/:id ──────────────────────────────────────────────────────
describe('PUT /api/groups/:id', () => {
  it('updates group name as owner', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });
    (prisma.groupMember.findUnique as any).mockResolvedValue({ role: 'OWNER' });
    (prisma.group.update as any).mockResolvedValue({ ...mockGroup, name: 'Updated Crew' });

    const res = await request(app)
      .put('/api/groups/group-1')
      .set(authHeader(OWNER_ID))
      .send({ name: 'Updated Crew' });

    expect(res.status).toBe(200);
    expect(res.body.group.name).toBe('Updated Crew');
  });

  it('updates group name as admin', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });
    (prisma.groupMember.findUnique as any).mockResolvedValue({ role: 'ADMIN' });
    (prisma.group.update as any).mockResolvedValue({ ...mockGroup, name: 'Admin Update' });

    const res = await request(app)
      .put('/api/groups/group-1')
      .set(authHeader(ADMIN_ID))
      .send({ name: 'Admin Update' });

    expect(res.status).toBe(200);
  });

  it('returns 403 when regular member tries to update', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });
    (prisma.groupMember.findUnique as any).mockResolvedValue({ role: 'MEMBER' });

    const res = await request(app)
      .put('/api/groups/group-1')
      .set(authHeader(MEMBER_ID))
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent group', async () => {
    (prisma.group.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/groups/no-group')
      .set(authHeader(OWNER_ID))
      .send({ name: 'Test' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/groups/:id ───────────────────────────────────────────────────
describe('DELETE /api/groups/:id', () => {
  it('deletes group as owner', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });
    (prisma.group.delete as any).mockResolvedValue({});

    const res = await request(app)
      .delete('/api/groups/group-1')
      .set(authHeader(OWNER_ID));

    expect(res.status).toBe(204);
  });

  it('returns 403 when non-owner tries to delete', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });

    const res = await request(app)
      .delete('/api/groups/group-1')
      .set(authHeader(MEMBER_ID));

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent group', async () => {
    (prisma.group.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/groups/no-group')
      .set(authHeader(OWNER_ID));

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/groups/:id/members ─────────────────────────────────────────────
describe('POST /api/groups/:id/members', () => {
  const newMember = {
    id: 'gm-3',
    groupId: 'group-1',
    userId: MEMBER_ID,
    role: 'MEMBER',
    user: { id: MEMBER_ID, name: 'Member', email: 'member@example.com' },
  };

  it('adds a member as owner', async () => {
    (prisma.groupMember.findUnique as any).mockResolvedValue({ role: 'OWNER' });
    (prisma.user.findUnique as any).mockResolvedValue({ id: MEMBER_ID, name: 'Member' });
    (prisma.groupMember.upsert as any).mockResolvedValue(newMember);

    const res = await request(app)
      .post('/api/groups/group-1/members')
      .set(authHeader(OWNER_ID))
      .send({ userId: MEMBER_ID });

    expect(res.status).toBe(201);
    expect(res.body.member.role).toBe('MEMBER');
  });

  it('returns 403 when a regular member tries to add members', async () => {
    (prisma.groupMember.findUnique as any).mockResolvedValue({ role: 'MEMBER' });

    const res = await request(app)
      .post('/api/groups/group-1/members')
      .set(authHeader(MEMBER_ID))
      .send({ userId: 'someone-else' });

    expect(res.status).toBe(403);
  });

  it('returns 404 when user to add does not exist', async () => {
    (prisma.groupMember.findUnique as any).mockResolvedValue({ role: 'OWNER' });
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/groups/group-1/members')
      .set(authHeader(OWNER_ID))
      .send({ userId: 'no-user' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/api/groups/group-1/members')
      .set(authHeader(OWNER_ID))
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─── PUT /api/groups/:id/members/:memberId ────────────────────────────────────
describe('PUT /api/groups/:id/members/:memberId', () => {
  it('updates member role as owner', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });
    (prisma.groupMember.findUnique as any).mockResolvedValue({ role: 'MEMBER' });
    (prisma.groupMember.update as any).mockResolvedValue({
      role: 'ADMIN',
      user: { id: MEMBER_ID, name: 'Member', email: 'member@example.com' },
    });

    const res = await request(app)
      .put('/api/groups/group-1/members/' + MEMBER_ID)
      .set(authHeader(OWNER_ID))
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.member.role).toBe('ADMIN');
  });

  it('returns 403 when non-owner tries to change roles', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });

    const res = await request(app)
      .put('/api/groups/group-1/members/' + MEMBER_ID)
      .set(authHeader(MEMBER_ID))
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when owner tries to change own role', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });

    const res = await request(app)
      .put('/api/groups/group-1/members/' + OWNER_ID)
      .set(authHeader(OWNER_ID))
      .send({ role: 'MEMBER' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid role value', async () => {
    const res = await request(app)
      .put('/api/groups/group-1/members/' + MEMBER_ID)
      .set(authHeader(OWNER_ID))
      .send({ role: 'SUPERADMIN' });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/groups/:id/members/:memberId ─────────────────────────────────
describe('DELETE /api/groups/:id/members/:memberId', () => {
  it('allows member to leave group (self-removal)', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });
    (prisma.groupMember.findUnique as any).mockResolvedValueOnce({ role: 'MEMBER' }) // requester membership
      .mockResolvedValueOnce({ id: 'gm-2' }); // target membership
    (prisma.groupMember.delete as any).mockResolvedValue({});

    const res = await request(app)
      .delete('/api/groups/group-1/members/' + MEMBER_ID)
      .set(authHeader(MEMBER_ID));

    expect(res.status).toBe(204);
  });

  it('returns 400 when owner tries to remove themselves', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });
    (prisma.groupMember.findUnique as any).mockResolvedValue({ role: 'OWNER' });

    const res = await request(app)
      .delete('/api/groups/group-1/members/' + OWNER_ID)
      .set(authHeader(OWNER_ID));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot remove the group owner');
  });

  it('returns 403 when outsider tries to remove a member', async () => {
    (prisma.group.findUnique as any).mockResolvedValue({ ...mockGroup });
    (prisma.groupMember.findUnique as any).mockResolvedValue(null); // outsider has no membership

    const res = await request(app)
      .delete('/api/groups/group-1/members/' + MEMBER_ID)
      .set(authHeader(OUTSIDER_ID));

    expect(res.status).toBe(403);
  });
});
