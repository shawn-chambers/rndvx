import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function makeToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

export function authHeader(userId: string): { Authorization: string } {
  return { Authorization: `Bearer ${makeToken(userId)}` };
}
