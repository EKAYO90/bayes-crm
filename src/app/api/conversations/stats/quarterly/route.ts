export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getConversationProgressForPeriod, getCurrentQuarterWindow } from '@/lib/conversationStats';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { quarterStart, quarterEnd } = getCurrentQuarterWindow();
  const members = await getConversationProgressForPeriod(quarterStart, quarterEnd, 'quarterly');

  return NextResponse.json({
    quarterStart,
    quarterEnd,
    totals: {
      conversations: members.reduce((sum, member) => sum + member.conversationCount, 0),
      newLeads: members.reduce((sum, member) => sum + member.newLeadsCount, 0),
      teamTarget: members.reduce((sum, member) => sum + member.quarterlyTarget, 0),
      onTrack: members.filter((member) => member.escalationStatus === 'On Track').length,
      escalated: members.filter((member) => member.escalationStatus === 'Escalated').length,
    },
    members,
  });
}
