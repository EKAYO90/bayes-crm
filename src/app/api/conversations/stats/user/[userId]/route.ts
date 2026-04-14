export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getConversationProgressForPeriod, getCurrentQuarterWindow } from '@/lib/conversationStats';
import { getISOWeekStart } from '@/lib/conversations';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isPrivileged = session.role === 'admin' || session.role === 'manager';
  if (!isPrivileged && session.id !== params.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const weekStart = getISOWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { quarterStart, quarterEnd } = getCurrentQuarterWindow(now);

  const [weekly, quarterly, recent] = await Promise.all([
    getConversationProgressForPeriod(weekStart, weekEnd, 'weekly'),
    getConversationProgressForPeriod(quarterStart, quarterEnd, 'quarterly'),
    prisma.conversation.findMany({
      where: {
        userId: params.userId,
        deletedAt: null,
      },
      include: {
        organization: { select: { id: true, name: true } },
        opportunity: { select: { id: true, name: true, displayId: true } },
      },
      orderBy: { conversationDate: 'desc' },
      take: 20,
    }),
  ]);

  const weeklyStats = weekly.find((entry) => entry.userId === params.userId);
  const quarterlyStats = quarterly.find((entry) => entry.userId === params.userId);

  if (!weeklyStats && !quarterlyStats) {
    return NextResponse.json({ error: 'User stats not found' }, { status: 404 });
  }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  return NextResponse.json({
    weekly: weeklyStats,
    quarterly: quarterlyStats,
    recentConversations: recent.slice(0, limit),
  });
}
