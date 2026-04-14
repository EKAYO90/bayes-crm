export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getConversationProgressForPeriod, getCurrentQuarterWindow } from '@/lib/conversationStats';
import { getISOWeekStart } from '@/lib/conversations';

function getNairobiNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
}

function getNairobiDayBounds(reference: Date) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function alreadySentToday(userId: string, type: string, start: Date, end: Date) {
  const count = await prisma.notification.count({
    where: {
      userId,
      type,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });
  return count > 0;
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const hasCronAccess = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!hasCronAccess) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const nowEat = getNairobiNow();
  const dayOfWeek = nowEat.getDay();
  const { start: todayStart, end: todayEnd } = getNairobiDayBounds(nowEat);

  const weekStart = getISOWeekStart(nowEat);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { quarterStart, quarterEnd } = getCurrentQuarterWindow(nowEat);

  const [weeklyProgress, quarterlyProgress, admins] = await Promise.all([
    getConversationProgressForPeriod(weekStart, weekEnd, 'weekly'),
    getConversationProgressForPeriod(quarterStart, quarterEnd, 'quarterly'),
    prisma.user.findMany({ where: { role: 'admin', isActive: true, deletedAt: null }, select: { id: true, name: true } }),
  ]);

  let sent = 0;

  // Wednesday 9 AM EAT check (if called later, it still executes once per day)
  if (dayOfWeek === 3) {
    for (const member of weeklyProgress.filter((entry) => entry.progressPct < 40)) {
      const exists = await alreadySentToday(member.userId, 'conversation_midweek_check', todayStart, todayEnd);
      if (exists) continue;

      await prisma.notification.create({
        data: {
          userId: member.userId,
          type: 'conversation_midweek_check',
          title: 'Mid-week conversation check',
          message: `You are at ${member.progressPct}% of your weekly conversation target (${member.conversationCount}/${member.weeklyTarget}). You have time to recover before Friday.`,
          link: '/conversations',
        },
      });
      sent += 1;
    }
  }

  // Friday end-of-week personal report + admin team summary
  if (dayOfWeek === 5) {
    const ranked = [...weeklyProgress].sort((a, b) => b.progressPct - a.progressPct);

    for (const member of ranked) {
      const exists = await alreadySentToday(member.userId, 'conversation_weekly_report', todayStart, todayEnd);
      if (exists) continue;

      const rank = ranked.findIndex((entry) => entry.userId === member.userId) + 1;
      await prisma.notification.create({
        data: {
          userId: member.userId,
          type: 'conversation_weekly_report',
          title: 'Weekly conversation report',
          message: `You logged ${member.conversationCount}/${member.weeklyTarget} conversations (${member.progressPct}%), with ${member.newLeadsCount} new leads. Rank #${rank} this week.`,
          link: '/team',
        },
      });
      sent += 1;
    }

    const teamTotal = ranked.reduce((sum, member) => sum + member.conversationCount, 0);
    const teamTarget = ranked.reduce((sum, member) => sum + member.weeklyTarget, 0);
    const zeros = ranked.filter((member) => member.conversationCount === 0);

    for (const admin of admins) {
      const exists = await alreadySentToday(admin.id, 'conversation_weekly_admin_report', todayStart, todayEnd);
      if (exists) continue;

      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'conversation_weekly_admin_report',
          title: 'Team weekly conversation summary',
          message: `Team closed the week at ${teamTotal}/${teamTarget} conversations. ${zeros.length} members logged zero conversations: ${zeros.map((entry) => entry.name).join(', ') || 'None'}.`,
          link: '/dashboard',
        },
      });
      sent += 1;
    }
  }

  // Monday escalation check based on quarterly status
  if (dayOfWeek === 1) {
    const escalatedMembers = quarterlyProgress.filter((entry) => entry.escalationStatus === 'Escalated');

    for (const member of escalatedMembers) {
      const memberSent = await alreadySentToday(member.userId, 'conversation_monday_escalation', todayStart, todayEnd);
      if (!memberSent) {
        await prisma.notification.create({
          data: {
            userId: member.userId,
            type: 'conversation_monday_escalation',
            title: 'Quarterly escalation status',
            message: `Your quarterly conversation progress is ${member.progressPct}% (${member.conversationCount}/${member.quarterlyTarget}). Immediate recovery action is required.`,
            link: '/conversations',
          },
        });
        sent += 1;
      }

      for (const admin of admins) {
        const adminSent = await alreadySentToday(admin.id, `conversation_admin_escalation_${member.userId}`, todayStart, todayEnd);
        if (adminSent) continue;

        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: `conversation_admin_escalation_${member.userId}`,
            title: 'Quarterly escalation alert',
            message: `${member.name} is escalated at ${member.progressPct}% of quarterly target (${member.conversationCount}/${member.quarterlyTarget}).`,
            link: '/team',
          },
        });
        sent += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, dayOfWeek, nowEat });
}
