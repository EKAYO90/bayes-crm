export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getConversationProgressForPeriod, getCurrentQuarterWindow } from '@/lib/conversationStats';
import { getISOWeekStart } from '@/lib/conversations';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const period = url.searchParams.get('period') === 'quarterly' ? 'quarterly' : 'weekly';

  const now = new Date();
  const weekStart = getISOWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { quarterStart, quarterEnd } = getCurrentQuarterWindow(now);

  const members = period === 'weekly'
    ? await getConversationProgressForPeriod(weekStart, weekEnd, 'weekly')
    : await getConversationProgressForPeriod(quarterStart, quarterEnd, 'quarterly');

  const ranked = members
    .map((member) => ({
      ...member,
      target: period === 'weekly' ? member.weeklyTarget : member.quarterlyTarget,
      conversationCount: member.conversationCount,
      period,
    }))
    .sort((a, b) => {
      if (b.progressPct !== a.progressPct) return b.progressPct - a.progressPct;
      if (b.conversationCount !== a.conversationCount) return b.conversationCount - a.conversationCount;
      return b.newLeadsCount - a.newLeadsCount;
    })
    .map((member, index) => ({ ...member, rank: index + 1 }));

  return NextResponse.json({
    period,
    leaderboard: ranked,
    start: period === 'weekly' ? weekStart : quarterStart,
    end: period === 'weekly' ? weekEnd : quarterEnd,
  });
}
