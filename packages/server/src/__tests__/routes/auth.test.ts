import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../helpers/testApp';
import { makeToken } from '../helpers/auth';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock('../../lib/prisma', () => {
  const user = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    passwordHash: '$2a$12$K8Y.cJzg7q1vY9h5O3PztuKTQ/4bY4/XoNe5J.yFPWVKbQ9K1eR5.', // "password123"
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';

const mockUser = {
  id: 'user-1',
  email: 'alice@example.com',
  name: 'Alice',
  passwordHash: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(async () => {
  vi.clearAllMocks();
  mockUser.passwordHash = await bcrypt.hash('password123', 1);
});

// ─── Health ────────────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('creates a new user and returns token + user (without password)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ ...mockUser });

    const res = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      name: 'Alice',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 409 when email already exists', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ ...mockUser });

    const res = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      name: 'Alice',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already in use');
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      name: 'Alice',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 for password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      name: 'Alice',
      password: 'short',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('returns token + user on valid credentials', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ ...mockUser });

    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 for unknown email', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns 401 for wrong password', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ ...mockUser });

    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
  });

  it('returns 400 for missing email', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'password123' });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  it('returns the current user when authenticated', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ ...mockUser });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('user-1');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });

  it('returns 401 with malformed header (no Bearer prefix)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', makeToken('user-1'));
    expect(res.status).toBe(401);
  });
});
