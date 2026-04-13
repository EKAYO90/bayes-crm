import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'bayes-crm-secret-key-2026';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
  department: string;
  title: string;
  avatarUrl: string;
  themePref: string;
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: SessionUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;

  const tokenSession = verifyToken(token);
  if (!tokenSession) return null;

  const user = await prisma.user.findUnique({
    where: { id: tokenSession.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tier: true,
      department: true,
      title: true,
      avatarUrl: true,
      themePref: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tier: user.tier,
    department: user.department,
    title: user.title,
    avatarUrl: user.avatarUrl,
    themePref: user.themePref,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export function canEdit(session: SessionUser, ownerId?: string): boolean {
  if (session.role === 'admin' || session.role === 'manager') return true;
  if (session.role === 'team_member' && ownerId === session.id) return true;
  return false;
}

export function isAdmin(session: SessionUser): boolean {
  return session.role === 'admin';
}
