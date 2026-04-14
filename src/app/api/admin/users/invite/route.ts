export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getBaseAppUrl, isSupabaseConfigured } from '@/lib/supabase/config';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const body = await req.json();
  const {
    email,
    fullName,
    role = 'team_member',
    tier = 'Enabler',
    department = 'Tech',
    title = '',
    targetsAssigned = '',
  } = body || {};

  if (!email || !fullName) {
    return NextResponse.json({ error: 'Email and fullName are required.' }, { status: 400 });
  }

  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'Supabase admin is not configured.' }, { status: 503 });
  }

  const redirectTo = `${getBaseAppUrl()}/auth/callback`;
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { full_name: fullName },
  });

  if (error || !data.user?.id) {
    return NextResponse.json({ error: error?.message || 'Failed to send invite.' }, { status: 400 });
  }

  const legacyUser = await prisma.user.upsert({
    where: { email: String(email).toLowerCase() },
    update: {
      name: fullName,
      role,
      tier,
      department,
      title,
      targetsAssigned,
      isActive: true,
    },
    create: {
      name: fullName,
      email: String(email).toLowerCase(),
      passwordHash: '',
      role,
      tier,
      department,
      title,
      targetsAssigned,
      isActive: true,
    },
  });

  const profile = await prisma.profile.upsert({
    where: { authUserId: data.user.id },
    create: {
      authUserId: data.user.id,
      email: String(email).toLowerCase(),
      fullName,
      role,
      tier,
      department,
      title,
      targetsAssigned,
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedById: session.id,
      invitedById: session.id,
      legacyUserId: legacyUser.id,
      isActive: true,
    },
    update: {
      email: String(email).toLowerCase(),
      fullName,
      role,
      tier,
      department,
      title,
      targetsAssigned,
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedById: session.id,
      invitedById: session.id,
      legacyUserId: legacyUser.id,
      isActive: true,
      rejectedAt: null,
      rejectedById: null,
    },
  });

  return NextResponse.json({ ok: true, profile });
}
