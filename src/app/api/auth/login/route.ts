export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const session = {
    id: user.id, name: user.name, email: user.email, role: user.role,
    tier: user.tier, department: user.department, title: user.title,
    avatarUrl: user.avatarUrl, themePref: user.themePref,
  };

  const token = signToken(session);
  
  // Log login
  await prisma.auditLog.create({
    data: { userId: user.id, action: 'LOGIN', entityType: 'users', entityId: user.id },
  });

  const res = NextResponse.json({ user: session });
  res.cookies.set('session', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 86400, path: '/' });
  return res;
}
