export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { ensureLegacyUserForProfile, toSessionUser } from '@/lib/authProfile';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const body = await req.json();
  const accessToken = body?.accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json({ error: 'Missing accessToken.' }, { status: 400 });
  }

  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'Supabase admin is not configured.' }, { status: 503 });
  }

  const { data, error } = await adminClient.auth.getUser(accessToken);
  if (error || !data.user?.id || !data.user.email) {
    return NextResponse.json({ error: 'Invalid Supabase session.' }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { authUserId: data.user.id } });
  if (!profile) {
    return NextResponse.json(
      { error: 'Your account profile was not initialized. Contact an administrator.' },
      { status: 403 },
    );
  }

  if (profile.approvalStatus !== 'approved') {
    return NextResponse.json(
      {
        requiresApproval: true,
        approvalStatus: profile.approvalStatus,
      },
      { status: 403 },
    );
  }

  if (!profile.isActive) {
    return NextResponse.json({ error: 'Your account is disabled.' }, { status: 403 });
  }

  const user = await ensureLegacyUserForProfile(profile);

  if (!user.isActive) {
    await prisma.user.update({ where: { id: user.id }, data: { isActive: true } });
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { lastLoginAt: new Date() },
  });

  const session = toSessionUser({ ...user, isActive: true });
  const token = signToken(session);

  const res = NextResponse.json({ ok: true, user: session });
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return res;
}
