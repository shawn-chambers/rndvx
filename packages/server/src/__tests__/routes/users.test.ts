import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../helpers/testApp';
import { authHeader } from '../helpers/auth';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma';

const USER_ID = 'user-1';
const mockUser = {
  id: USER_ID,
  email: 'alice@example.com',
  name: 'Alice',
  passwordHash: 'hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/users/me ────────────────────────────────────────────────────────
describe('GET /api/users/me', () => {
  it('returns the current user profile', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ ...mockUser });

    const res = await request(app).get('/api/users/me').set(authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('returns 404 if user no longer exists', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const res = await request(app).get('/api/users/me').set(authHeader(USER_ID));
    expect(res.status).toBe(404);
  });
});

// ─── PUT /api/users/me ────────────────────────────────────────────────────────
describe('PUT /api/users/me', () => {
  it('updates the user name', async () => {
    const updated = { ...mockUser, name: 'Alice Updated' };
    (prisma.user.findUnique as any).mockResolvedValue({ ...mockUser });
    (prisma.user.update as any).mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(USER_ID))
      .send({ name: 'Alice Updated' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Alice Updated');
  });

  it('updates the user email', async () => {
    const updated = { ...mockUser, email: 'new@example.com' };
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ ...mockUser }) // existence check
      .mockResolvedValueOnce(null); // email uniqueness check
    (prisma.user.update as any).mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(USER_ID))
      .send({ email: 'new@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('new@example.com');
  });

  it('returns 400 when no fields provided', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(USER_ID))
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(USER_ID))
      .send({ email: 'not-valid' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/users/me').send({ name: 'Alice' });
    expect(res.status).toBe(401);
  });
});
