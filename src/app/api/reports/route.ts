import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'pipeline';

  if (type === 'pipeline') {
    const opps = await prisma.opportunity.findMany({
      where: { deletedAt: null },
      include: { owner: { select: { name: true } }, organization: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ data: opps.map(o => ({
      id: o.displayId, name: o.name, organization: o.organization.name, stage: o.stage,
      serviceLine: o.serviceLine, value: o.estimatedValue, probability: o.probability,
      weighted: o.estimatedValue * o.probability / 100, owner: o.owner.name,
      daysInStage: Math.floor((Date.now() - new Date(o.stageEnteredAt).getTime()) / 86400000),
      expectedClose: o.expectedCloseDate,
    }))});
  }

  if (type === 'activity') {
    const users = await prisma.user.findMany({ where: { isActive: true } });
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 86400000);
    const activities = await prisma.activity.findMany({ where: { date: { gte: fourWeeksAgo } } });
    const data = users.map(u => {
      const userActs = activities.filter(a => a.userId === u.id);
      const typeCounts = userActs.reduce((acc, activity) => {
        acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const types = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([activityType, count]) => `${count} ${activityType}`)
        .join(', ');

      return {
        name: u.name,
        tier: u.tier,
        totalActivities: userActs.length,
        types: types || '—',
      };
    });

    return NextResponse.json({ data });
  }

  if (type === 'relationship') {
    const orgs = await prisma.organization.findMany({
      where: { deletedAt: null },
      include: { relationshipOwner: { select: { name: true } } },
    });
    const data = orgs.map(o => ({
      name: o.name, type: o.type, status: o.relationshipStatus, owner: o.relationshipOwner.name,
      daysSinceContact: o.lastTouchpointDate ? Math.floor((Date.now() - new Date(o.lastTouchpointDate).getTime()) / 86400000) : 999,
      atRisk: o.lastTouchpointDate ? (Date.now() - new Date(o.lastTouchpointDate).getTime()) > 23 * 86400000 : true,
    }));
    return NextResponse.json({ data });
  }

  return NextResponse.json({ data: [] });
}
