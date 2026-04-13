import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const scores = await prisma.weeklyScore.findMany({
    include: { user: { select: { id: true, name: true, tier: true } } },
    orderBy: [{ weekStart: 'desc' }, { totalScore: 'desc' }],
    take: 200,
  });
  return NextResponse.json({ scores });
}
