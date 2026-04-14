export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getConversationProgressForPeriod, getCurrentQuarterWindow, getWeeklyHeatmapData } from '@/lib/conversationStats';
import { getISOWeekStart, TIER_SORT_ORDER } from '@/lib/conversations';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const weekStart = getISOWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { quarterStart, quarterEnd } = getCurrentQuarterWindow(now);

  const [weeklyMembers, quarterlyMembers, heatmap] = await Promise.all([
    getConversationProgressForPeriod(weekStart, weekEnd, 'weekly'),
    getConversationProgressForPeriod(quarterStart, quarterEnd, 'quarterly'),
    getWeeklyHeatmapData(),
  ]);

  const quarterlyMap = new Map(quarterlyMembers.map((member) => [member.userId, member]));

  const teamSummary = weeklyMembers
    .map((member) => {
      const quarter = quarterlyMap.get(member.userId);
      return {
        ...member,
        quarterConversationCount: quarter?.conversationCount || 0,
        quarterTarget: quarter?.quarterlyTarget || 0,
        quarterProgressPct: quarter?.progressPct || 0,
        escalationStatus: quarter?.escalationStatus || member.escalationStatus,
      };
    })
    .sort((a, b) => {
      const tierSort = (TIER_SORT_ORDER[a.tier] ?? 99) - (TIER_SORT_ORDER[b.tier] ?? 99);
      if (tierSort !== 0) return tierSort;
      return a.name.localeCompare(b.name);
    });

  return NextResponse.json({
    weekStart,
    weekEnd,
    quarterStart,
    quarterEnd,
    summary: {
      weeklyConversations: teamSummary.reduce((sum, member) => sum + member.conversationCount, 0),
      weeklyTarget: teamSummary.reduce((sum, member) => sum + member.weeklyTarget, 0),
      quarterlyConversations: teamSummary.reduce((sum, member) => sum + member.quarterConversationCount, 0),
      quarterlyTarget: teamSummary.reduce((sum, member) => sum + member.quarterTarget, 0),
      newLeadsThisWeek: teamSummary.reduce((sum, member) => sum + member.newLeadsCount, 0),
      zeroConversationUsers: teamSummary.filter((member) => member.conversationCount === 0).map((member) => ({
        userId: member.userId,
        name: member.name,
        tier: member.tier,
      })),
    },
    members: teamSummary,
    heatmap,
  });
}
