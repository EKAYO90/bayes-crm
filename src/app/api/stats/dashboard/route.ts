export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getConversationProgressForPeriod, getWeeklyHeatmapData, getCurrentQuarterWindow } from '@/lib/conversationStats';
import { getISOWeekStart, TIER_SORT_ORDER } from '@/lib/conversations';

export async function GET() {
  const activeStages = ['Lead Identified', 'Initial Contact', 'Discovery Meeting', 'Proposal Development', 'Proposal Submitted', 'Negotiation'];
  const allOpps = await prisma.opportunity.findMany({ where: { deletedAt: null }, include: { owner: true, organization: true } });
  const activeOpps = allOpps.filter((opportunity) => activeStages.includes(opportunity.stage));
  const wonOpps = allOpps.filter((opportunity) => opportunity.stage === 'Contract Signed');
  const lostOpps = allOpps.filter((opportunity) => opportunity.stage === 'Lost');

  const totalPipeline = activeOpps.reduce((sum, opportunity) => sum + opportunity.estimatedValue, 0);
  const weightedPipeline = activeOpps.reduce((sum, opportunity) => sum + (opportunity.estimatedValue * opportunity.probability) / 100, 0);
  const wonRevenue = wonOpps.reduce((sum, opportunity) => sum + opportunity.estimatedValue, 0);
  const agentDeals = activeOpps.filter((opportunity) => opportunity.hasAgentComponent);

  const now = new Date();
  const weekStart = getISOWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { quarterStart, quarterEnd } = getCurrentQuarterWindow(now);

  const [weeklyConversationProgress, quarterlyConversationProgress, heatmapData] = await Promise.all([
    getConversationProgressForPeriod(weekStart, weekEnd, 'weekly'),
    getConversationProgressForPeriod(quarterStart, quarterEnd, 'quarterly'),
    getWeeklyHeatmapData(),
  ]);

  const weeklyMap = new Map(weeklyConversationProgress.map((entry) => [entry.userId, entry]));
  const conversationTracker = quarterlyConversationProgress
    .map((quarterEntry) => ({
      ...quarterEntry,
      weeklyConversationCount: weeklyMap.get(quarterEntry.userId)?.conversationCount || 0,
      weeklyTarget: weeklyMap.get(quarterEntry.userId)?.weeklyTarget || quarterEntry.weeklyTarget,
      weeklyProgressPct: weeklyMap.get(quarterEntry.userId)?.progressPct || 0,
      weeklyNewLeads: weeklyMap.get(quarterEntry.userId)?.newLeadsCount || 0,
    }))
    .sort((a, b) => {
      const tierSort = (TIER_SORT_ORDER[a.tier] ?? 99) - (TIER_SORT_ORDER[b.tier] ?? 99);
      if (tierSort !== 0) return tierSort;
      return a.name.localeCompare(b.name);
    });

  const conversationsThisWeek = weeklyConversationProgress.reduce((sum, member) => sum + member.conversationCount, 0);
  const newLeadsThisWeek = weeklyConversationProgress.reduce((sum, member) => sum + member.newLeadsCount, 0);

  const overdueActions = activeOpps.filter((opportunity) => opportunity.nextActionDate && new Date(opportunity.nextActionDate) < now);

  const funnelData = activeStages.map((stage) => {
    const stageOpportunities = activeOpps.filter((opportunity) => opportunity.stage === stage);
    return {
      stage,
      count: stageOpportunities.length,
      value: stageOpportunities.reduce((sum, opportunity) => sum + opportunity.estimatedValue, 0),
    };
  });

  const serviceLineData: Record<string, number> = {};
  activeOpps.forEach((opportunity) => {
    serviceLineData[opportunity.serviceLine] = (serviceLineData[opportunity.serviceLine] || 0) + opportunity.estimatedValue;
  });

  const sourceData: Record<string, number> = {};
  activeOpps.forEach((opportunity) => {
    sourceData[opportunity.sourceChannel] = (sourceData[opportunity.sourceChannel] || 0) + opportunity.estimatedValue;
  });

  const users = await prisma.user.findMany({ where: { isActive: true, deletedAt: null } });
  const leaderboard = users
    .map((user) => {
      const userOpportunities = activeOpps.filter((opportunity) => opportunity.ownerId === user.id);
      const weightedValue = userOpportunities.reduce((sum, opportunity) => sum + (opportunity.estimatedValue * opportunity.probability) / 100, 0);
      return { id: user.id, name: user.name, tier: user.tier, activeDeals: userOpportunities.length, weightedValue };
    })
    .sort((a, b) => b.weightedValue - a.weightedValue);

  const opportunityActions = activeOpps
    .filter((opportunity) => opportunity.nextActionDate)
    .map((opportunity) => ({
      id: opportunity.id,
      type: 'opportunity',
      name: opportunity.name,
      nextAction: opportunity.nextAction,
      nextActionDate: opportunity.nextActionDate,
      ownerName: opportunity.owner.name,
      isOverdue: new Date(opportunity.nextActionDate!) < now,
      link: `/pipeline/${opportunity.id}`,
    }));

  const zeroConversationAlerts = weeklyConversationProgress
    .filter((member) => member.conversationCount === 0)
    .map((member) => ({
      id: `zero-${member.userId}`,
      type: 'zero_conversation_alert',
      name: member.name,
      nextAction: 'No conversation logged this week',
      nextActionDate: weekEnd,
      ownerName: member.name,
      isOverdue: true,
      link: '/team',
    }));

  const followUps = await prisma.conversation.findMany({
    where: {
      deletedAt: null,
      followUpRequired: true,
      followUpDate: {
        lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      user: { select: { name: true } },
      organization: { select: { name: true } },
    },
    orderBy: { followUpDate: 'asc' },
    take: 20,
  });

  const followUpActions = followUps.map((conversation) => ({
    id: `followup-${conversation.id}`,
    type: 'conversation_follow_up',
    name: conversation.organization?.name || conversation.counterpartyName || conversation.user.name,
    nextAction: conversation.nextStep || conversation.outcome || 'Follow-up conversation',
    nextActionDate: conversation.followUpDate,
    ownerName: conversation.user.name,
    isOverdue: conversation.followUpDate ? new Date(conversation.followUpDate) < now : false,
    link: '/conversations',
  }));

  const upcomingActions = [...opportunityActions, ...zeroConversationAlerts, ...followUpActions]
    .sort((a, b) => new Date(a.nextActionDate || now).getTime() - new Date(b.nextActionDate || now).getTime())
    .slice(0, 20);

  const winLossData: Record<string, { won: number; lost: number }> = {};
  [...wonOpps, ...lostOpps].forEach((opportunity) => {
    if (!winLossData[opportunity.serviceLine]) winLossData[opportunity.serviceLine] = { won: 0, lost: 0 };
    if (opportunity.stage === 'Contract Signed') winLossData[opportunity.serviceLine].won += 1;
    else winLossData[opportunity.serviceLine].lost += 1;
  });

  return NextResponse.json({
    kpis: {
      totalPipeline,
      weightedPipeline,
      wonRevenue,
      activeDeals: activeOpps.length,
      overdueActions: overdueActions.length,
      agentDeals: agentDeals.length,
      agentValue: agentDeals.reduce((sum, opportunity) => sum + opportunity.estimatedValue, 0),
      conversationsThisWeek,
      newLeadsThisWeek,
    },
    funnelData,
    serviceLineData: Object.entries(serviceLineData).map(([name, value]) => ({ name, value })),
    sourceData: Object.entries(sourceData).map(([name, value]) => ({ name, value })),
    leaderboard,
    upcomingActions,
    wonCount: wonOpps.length,
    lostCount: lostOpps.length,
    winLossData: Object.entries(winLossData).map(([serviceLine, values]) => ({ serviceLine, ...values })),
    conversationTracker,
    conversationHeatmap: heatmapData,
    weeklyWindow: { weekStart, weekEnd },
    quarterlyWindow: { quarterStart, quarterEnd },
  });
}
