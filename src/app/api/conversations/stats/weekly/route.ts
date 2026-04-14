export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getConversationProgressForPeriod } from '@/lib/conversationStats';
import { getISOWeekStart } from '@/lib/conversations';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const weekStart = getISOWeekStart(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const members = await getConversationProgressForPeriod(weekStart, weekEnd, 'weekly');

  return NextResponse.json({
    weekStart,
    weekEnd,
    totals: {
      conversations: members.reduce((sum, member) => sum + member.conversationCount, 0),
      newLeads: members.reduce((sum, member) => sum + member.newLeadsCount, 0),
      teamTarget: members.reduce((sum, member) => sum + member.weeklyTarget, 0),
      contributors: members.filter((member) => member.conversationCount > 0).length,
    },
    members,
  });
}
