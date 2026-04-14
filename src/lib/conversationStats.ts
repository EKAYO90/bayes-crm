import { prisma } from '@/lib/prisma';
import { getEscalationStatus, getISOWeekStart, getLastNISOWeeks, getQuarterEnd, getQuarterStart } from '@/lib/conversations';

export interface MemberConversationProgress {
  userId: string;
  name: string;
  tier: string;
  weeklyTarget: number;
  quarterlyTarget: number;
  conversationCount: number;
  newLeadsCount: number;
  progressPct: number;
  escalationStatus: ReturnType<typeof getEscalationStatus>;
}

export async function getConversationProgressForPeriod(start: Date, end: Date, targetType: 'weekly' | 'quarterly') {
  const users = await prisma.user.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      weeklyQuotas: true,
      conversations: {
        where: {
          deletedAt: null,
          conversationDate: { gte: start, lte: end },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return users.map<MemberConversationProgress>((user) => {
    const quota = user.weeklyQuotas[0];
    const target = targetType === 'weekly' ? quota?.weeklyTarget || 0 : quota?.quarterlyTarget || 0;
    const conversationCount = user.conversations.length;
    const newLeadsCount = user.conversations.filter((conversation) => conversation.isNewLead).length;
    const progressPct = target > 0 ? Math.round((conversationCount / target) * 100) : 0;

    return {
      userId: user.id,
      name: user.name,
      tier: user.tier,
      weeklyTarget: quota?.weeklyTarget || 0,
      quarterlyTarget: quota?.quarterlyTarget || 0,
      conversationCount,
      newLeadsCount,
      progressPct,
      escalationStatus: getEscalationStatus(progressPct),
    };
  });
}

export async function getWeeklyHeatmapData() {
  const weekStarts = getLastNISOWeeks(13);
  const minWeekStart = weekStarts[0];
  const maxWeekEnd = new Date(weekStarts[weekStarts.length - 1]);
  maxWeekEnd.setDate(maxWeekEnd.getDate() + 6);
  maxWeekEnd.setHours(23, 59, 59, 999);

  const users = await prisma.user.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      weeklyQuotas: true,
      conversations: {
        where: {
          deletedAt: null,
          conversationDate: {
            gte: minWeekStart,
            lte: maxWeekEnd,
          },
        },
        select: {
          id: true,
          conversationDate: true,
        },
      },
    },
  });

  const weeks = weekStarts.map((weekStart) => weekStart.toISOString());

  const rows = users.map((user) => {
    const weeklyTarget = user.weeklyQuotas[0]?.weeklyTarget || 0;
    const buckets = new Map<string, number>();

    for (const conversation of user.conversations) {
      const bucket = getISOWeekStart(new Date(conversation.conversationDate)).toISOString();
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    }

    const cells = weeks.map((weekStartIso) => {
      const count = buckets.get(weekStartIso) || 0;
      const progressPct = weeklyTarget > 0 ? Math.round((count / weeklyTarget) * 100) : 0;
      return {
        weekStart: weekStartIso,
        count,
        weeklyTarget,
        progressPct,
      };
    });

    return {
      userId: user.id,
      name: user.name,
      tier: user.tier,
      weeklyTarget,
      cells,
    };
  });

  return {
    weeks,
    rows,
  };
}

export function getCurrentQuarterWindow(date = new Date()) {
  const quarterStart = getQuarterStart(date);
  const quarterEnd = getQuarterEnd(date);
  return { quarterStart, quarterEnd };
}
