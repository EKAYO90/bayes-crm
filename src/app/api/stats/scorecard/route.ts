export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId') || session.id;

  const scores = await prisma.weeklyScore.findMany({
    where: { userId },
    orderBy: { weekStart: 'desc' },
    take: 8,
  });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true, name: true } });
  return NextResponse.json({ scores, tier: user?.tier, name: user?.name });
}
