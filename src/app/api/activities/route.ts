export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const orgId = url.searchParams.get('orgId');
  const type = url.searchParams.get('type');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const where: any = {};
  if (userId) where.userId = userId;
  if (orgId) where.organizationId = orgId;
  if (type) where.activityType = type;

  const activities = await prisma.activity.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, tier: true } },
      organization: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true, displayId: true } },
      contact: { select: { id: true, fullName: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  });

  return NextResponse.json({ activities });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const activity = await prisma.activity.create({
    data: {
      date: new Date(body.date || new Date()),
      userId: body.userId || session.id,
      activityType: body.activityType,
      organizationId: body.organizationId || null,
      opportunityId: body.opportunityId || null,
      contactId: body.contactId || null,
      description: body.description,
      outcome: body.outcome || '',
      followUpRequired: body.followUpRequired || false,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
    },
    include: { user: { select: { name: true } }, organization: { select: { name: true } } },
  });

  // Update org touchpoint
  if (body.organizationId) {
    await prisma.organization.update({
      where: { id: body.organizationId },
      data: { lastTouchpointDate: new Date() },
    });
  }

  await prisma.auditLog.create({
    data: { userId: session.id, action: 'CREATE', entityType: 'activities', entityId: activity.id, newValue: JSON.stringify({ type: body.activityType }) },
  });

  return NextResponse.json({ activity }, { status: 201 });
}
