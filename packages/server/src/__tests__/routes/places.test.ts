import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../helpers/testApp';
import { authHeader } from '../helpers/auth';

// Places service uses mock data internally — no prisma needed
// We can test the full controller + service stack directly

const USER_ID = 'user-1';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/places/search ───────────────────────────────────────────────────
describe('GET /api/places/search', () => {
  it('returns matching places for query', async () => {
    const res = await request(app)
      .get('/api/places/search?q=coffee')
      .set(authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.places).toBeDefined();
    expect(Array.isArray(res.body.places)).toBe(true);
    expect(res.body.places.length).toBeGreaterThan(0);
    expect(res.body.places[0].name).toContain('Coffee');
  });

  it('returns empty array for unmatched query', async () => {
    const res = await request(app)
      .get('/api/places/search?q=xyznonexistent')
      .set(authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(0);
  });

  it('returns 400 when q parameter is missing', async () => {
    const res = await request(app)
      .get('/api/places/search')
      .set(authHeader(USER_ID));

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"q"');
  });

  it('returns 400 when q is empty string', async () => {
    const res = await request(app)
      .get('/api/places/search?q=')
      .set(authHeader(USER_ID));

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/places/search?q=coffee');
    expect(res.status).toBe(401);
  });

  it('searches by type (park)', async () => {
    const res = await request(app)
      .get('/api/places/search?q=park')
      .set(authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.places.some((p: any) => p.types?.includes('park'))).toBe(true);
  });
});

// ─── GET /api/places/:placeId ─────────────────────────────────────────────────
describe('GET /api/places/:placeId', () => {
  it('returns place details for known placeId', async () => {
    const res = await request(app)
      .get('/api/places/mock-place-1')
      .set(authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.place.placeId).toBe('mock-place-1');
    expect(res.body.place.name).toBe('The Coffee House');
    expect(res.body.place).toHaveProperty('lat');
    expect(res.body.place).toHaveProperty('lng');
  });

  it('returns 404 for unknown placeId', async () => {
    const res = await request(app)
      .get('/api/places/unknown-place')
      .set(authHeader(USER_ID));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Place not found');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/places/mock-place-1');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/places/meetings/:meetingId/auto-pick ────────────────────────────
describe('GET /api/places/meetings/:meetingId/auto-pick', () => {
  it('returns a suggested place for any meetingId (stub)', async () => {
    const res = await request(app)
      .get('/api/places/meetings/meeting-1/auto-pick')
      .set(authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.place).toBeDefined();
    expect(res.body.place).toHaveProperty('placeId');
    expect(res.body.place).toHaveProperty('name');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/places/meetings/meeting-1/auto-pick');
    expect(res.status).toBe(401);
  });
});
