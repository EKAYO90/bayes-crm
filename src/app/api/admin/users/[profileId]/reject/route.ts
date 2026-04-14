export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { profileId: string } },
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  const profile = await prisma.profile.update({
    where: { id: params.profileId },
    data: {
      approvalStatus: 'rejected',
      approvalNotes: body?.approvalNotes || '',
      rejectedAt: new Date(),
      rejectedById: session.id,
      approvedAt: null,
      approvedById: null,
      isActive: false,
    },
  });

  if (profile.legacyUserId) {
    await prisma.user.update({ where: { id: profile.legacyUserId }, data: { isActive: false } });
  }

  return NextResponse.json({ ok: true });
}
