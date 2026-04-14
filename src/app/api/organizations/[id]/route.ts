export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const org = await prisma.organization.findUnique({
    where: { id: params.id },
    include: {
      relationshipOwner: { select: { id: true, name: true } },
      contacts: { where: { deletedAt: null }, orderBy: { fullName: 'asc' } },
      opportunities: { where: { deletedAt: null }, include: { owner: { select: { name: true } } }, orderBy: { updatedAt: 'desc' } },
      activities: { include: { user: { select: { name: true } } }, orderBy: { date: 'desc' }, take: 20 },
    },
  });
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ organization: org });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.type !== undefined) data.type = body.type;
  if (body.sector !== undefined) data.sector = body.sector;
  if (body.serviceLineFit !== undefined) data.serviceLineFit = JSON.stringify(body.serviceLineFit);
  if (body.relationshipOwnerId !== undefined) data.relationshipOwnerId = body.relationshipOwnerId;
  if (body.relationshipStatus !== undefined) data.relationshipStatus = body.relationshipStatus;
  if (body.website !== undefined) data.website = body.website;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.lastTouchpointDate !== undefined) data.lastTouchpointDate = new Date(body.lastTouchpointDate);

  const org = await prisma.organization.update({ where: { id: params.id }, data });
  await prisma.auditLog.create({ data: { userId: session.id, action: 'UPDATE', entityType: 'organizations', entityId: params.id, newValue: JSON.stringify(data) } });
  return NextResponse.json({ organization: org });
}
