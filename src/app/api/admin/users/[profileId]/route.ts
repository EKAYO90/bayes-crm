export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { profileId: string } },
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  const profile = await prisma.profile.update({
    where: { id: params.profileId },
    data: {
      role: body.role,
      tier: body.tier,
      department: body.department,
      title: body.title,
      targetsAssigned: body.targetsAssigned,
      isActive: body.isActive,
    },
  });

  if (profile.legacyUserId) {
    await prisma.user.update({
      where: { id: profile.legacyUserId },
      data: {
        role: body.role,
        tier: body.tier,
        department: body.department,
        title: body.title,
        targetsAssigned: body.targetsAssigned,
        isActive: body.isActive,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
