export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured yet.' }, { status: 503 });
  }

  const body = await req.json();
  const {
    authUserId,
    email,
    fullName,
    role = 'team_member',
    tier = 'Enabler',
    department = 'Tech',
    title = '',
    targetsAssigned = '',
  } = body || {};

  if (!authUserId || !email || !fullName) {
    return NextResponse.json(
      { error: 'authUserId, email, and fullName are required.' },
      { status: 400 },
    );
  }

  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'Supabase admin is not configured.' }, { status: 503 });
  }

  const { data: userData, error: userErr } = await adminClient.auth.admin.getUserById(authUserId);
  if (userErr || !userData?.user || userData.user.email?.toLowerCase() !== String(email).toLowerCase()) {
    return NextResponse.json({ error: 'Unable to verify Supabase user for this email.' }, { status: 400 });
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });

  const profile = await prisma.profile.upsert({
    where: { authUserId },
    create: {
      authUserId,
      email: String(email).toLowerCase(),
      fullName,
      role,
      tier,
      department,
      title,
      targetsAssigned,
      approvalStatus: 'pending',
      isActive: true,
      legacyUserId: existingByEmail?.id,
    },
    update: {
      email: String(email).toLowerCase(),
      fullName,
      role,
      tier,
      department,
      title,
      targetsAssigned,
      approvalStatus: 'pending',
      isActive: true,
      legacyUserId: existingByEmail?.id,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      approvalStatus: true,
    },
  });

  return NextResponse.json({ ok: true, profile });
}
