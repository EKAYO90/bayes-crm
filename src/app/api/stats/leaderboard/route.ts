export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({ where: { isActive: true, deletedAt: null } });
  const activeStages = ['Lead Identified','Initial Contact','Discovery Meeting','Proposal Development','Proposal Submitted','Negotiation'];
  const opps = await prisma.opportunity.findMany({ where: { deletedAt: null } });

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0,0,0,0);

  const scores = await prisma.weeklyScore.findMany({ where: { weekStart: { gte: new Date(now.getTime() - 28*86400000) } } });

  // Pipeline leaderboard
  const pipeline = users.map(u => {
    const userOpps = opps.filter(o => o.ownerId === u.id && activeStages.includes(o.stage));
    return { id: u.id, name: u.name, tier: u.tier, value: userOpps.reduce((s, o) => s + o.estimatedValue * o.probability / 100, 0), deals: userOpps.length };
  }).sort((a, b) => b.value - a.value);

  // Activity leaderboard (current week)
  const activity = users.map(u => {
    const userScores = scores.filter(s => s.userId === u.id);
    const currentWeek = userScores.find(s => new Date(s.weekStart).getTime() >= weekStart.getTime());
    return { id: u.id, name: u.name, tier: u.tier, score: currentWeek?.totalScore || 0, weeks: userScores.map(s => ({ week: s.weekStart, score: s.totalScore })) };
  }).sort((a, b) => b.score - a.score);

  // Revenue leaderboard
  const revenue = users.map(u => {
    const wonOpps = opps.filter(o => o.ownerId === u.id && o.stage === 'Contract Signed');
    return { id: u.id, name: u.name, tier: u.tier, value: wonOpps.reduce((s, o) => s + o.estimatedValue, 0), deals: wonOpps.length };
  }).sort((a, b) => b.value - a.value);

  return NextResponse.json({ pipeline, activity, revenue });
}
