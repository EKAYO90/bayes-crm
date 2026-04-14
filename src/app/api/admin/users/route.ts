export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const profiles = await prisma.profile.findMany({
    orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }],
    include: {
      legacyUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tier: true,
          department: true,
          title: true,
          targetsAssigned: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  });

  const pending = profiles.filter((p) => p.approvalStatus === 'pending');
  const active = profiles.filter((p) => p.approvalStatus === 'approved');
  const rejected = profiles.filter((p) => p.approvalStatus === 'rejected');

  return NextResponse.json({ pending, active, rejected });
}
