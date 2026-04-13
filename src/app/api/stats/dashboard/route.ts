import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const activeStages = ['Lead Identified','Initial Contact','Discovery Meeting','Proposal Development','Proposal Submitted','Negotiation'];
  const allOpps = await prisma.opportunity.findMany({ where: { deletedAt: null }, include: { owner: true, enabler: true, organization: true } });
  const activeOpps = allOpps.filter(o => activeStages.includes(o.stage));
  const wonOpps = allOpps.filter(o => o.stage === 'Contract Signed');
  const lostOpps = allOpps.filter(o => o.stage === 'Lost');
  
  const totalPipeline = activeOpps.reduce((s, o) => s + o.estimatedValue, 0);
  const weightedPipeline = activeOpps.reduce((s, o) => s + o.estimatedValue * o.probability / 100, 0);
  const wonRevenue = wonOpps.reduce((s, o) => s + o.estimatedValue, 0);
  const agentDeals = activeOpps.filter(o => o.hasAgentComponent);
  
  const now = new Date();
  const overdueActions = activeOpps.filter(o => o.nextActionDate && new Date(o.nextActionDate) < now);

  // Funnel data
  const funnelData = activeStages.map(stage => {
    const stageOpps = activeOpps.filter(o => o.stage === stage);
    return { stage, count: stageOpps.length, value: stageOpps.reduce((s, o) => s + o.estimatedValue, 0) };
  });

  // Pipeline by service line
  const serviceLineData: Record<string, number> = {};
  activeOpps.forEach(o => { serviceLineData[o.serviceLine] = (serviceLineData[o.serviceLine] || 0) + o.estimatedValue; });

  // Pipeline by source channel
  const sourceData: Record<string, number> = {};
  activeOpps.forEach(o => { sourceData[o.sourceChannel] = (sourceData[o.sourceChannel] || 0) + o.estimatedValue; });

  // Team leaderboard
  const users = await prisma.user.findMany({ where: { isActive: true, deletedAt: null } });
  const leaderboard = users.map(u => {
    const userOpps = activeOpps.filter(o => o.ownerId === u.id);
    const weighted = userOpps.reduce((s, o) => s + o.estimatedValue * o.probability / 100, 0);
    return { id: u.id, name: u.name, tier: u.tier, activeDeals: userOpps.length, weightedValue: weighted };
  }).sort((a, b) => b.weightedValue - a.weightedValue);

  // Upcoming actions (next 7 days)
  const sevenDays = new Date(now.getTime() + 7 * 86400000);
  const upcomingActions = activeOpps
    .filter(o => o.nextActionDate)
    .map(o => ({ id: o.id, displayId: o.displayId, name: o.name, nextAction: o.nextAction, nextActionDate: o.nextActionDate, ownerName: o.owner.name, ownerId: o.ownerId, isOverdue: new Date(o.nextActionDate!) < now }))
    .sort((a, b) => new Date(a.nextActionDate!).getTime() - new Date(b.nextActionDate!).getTime())
    .slice(0, 15);

  // Win/Loss by service line
  const winLossData: Record<string, { won: number; lost: number }> = {};
  [...wonOpps, ...lostOpps].forEach(o => {
    if (!winLossData[o.serviceLine]) winLossData[o.serviceLine] = { won: 0, lost: 0 };
    if (o.stage === 'Contract Signed') winLossData[o.serviceLine].won++;
    else winLossData[o.serviceLine].lost++;
  });

  return NextResponse.json({
    kpis: {
      totalPipeline, weightedPipeline, wonRevenue, activeDeals: activeOpps.length,
      overdueActions: overdueActions.length, agentDeals: agentDeals.length,
      agentValue: agentDeals.reduce((s, o) => s + o.estimatedValue, 0),
    },
    funnelData,
    serviceLineData: Object.entries(serviceLineData).map(([name, value]) => ({ name, value })),
    sourceData: Object.entries(sourceData).map(([name, value]) => ({ name, value })),
    leaderboard,
    upcomingActions,
    wonCount: wonOpps.length,
    lostCount: lostOpps.length,
    winLossData: Object.entries(winLossData).map(([sl, d]) => ({ serviceLine: sl, ...d })),
  });
}
