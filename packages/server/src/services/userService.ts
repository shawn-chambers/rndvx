import { prisma } from '../lib/prisma';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateProfile(
  userId: string,
  data: { name?: string; email?: string },
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  if (data.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken && emailTaken.id !== userId) {
      throw Object.assign(new Error('Email already in use'), { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
