export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureLegacyUserForProfile } from '@/lib/authProfile';

export async function POST(
  _req: Request,
  { params }: { params: { profileId: string } },
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const profile = await prisma.profile.update({
    where: { id: params.profileId },
    data: {
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedById: session.id,
      rejectedAt: null,
      rejectedById: null,
      isActive: true,
    },
  });

  const legacyUser = await ensureLegacyUserForProfile(profile);
  await prisma.user.update({ where: { id: legacyUser.id }, data: { isActive: true } });

  return NextResponse.json({ ok: true });
}
