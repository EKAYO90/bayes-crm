import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { STAGE_DEFAULT_PROBABILITY } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const stage = url.searchParams.get('stage');
  const serviceLine = url.searchParams.get('serviceLine');
  const owner = url.searchParams.get('owner');
  const search = url.searchParams.get('search');
  const sort = url.searchParams.get('sort') || 'updatedAt';
  const order = url.searchParams.get('order') || 'desc';

  const where: any = { deletedAt: null };
  if (stage) where.stage = stage;
  if (serviceLine) where.serviceLine = serviceLine;
  if (owner) where.ownerId = owner;
  if (search) where.OR = [{ name: { contains: search } }, { notes: { contains: search } }];

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: { owner: { select: { id: true, name: true, tier: true } }, enabler: { select: { id: true, name: true } }, organization: { select: { id: true, name: true } } },
    orderBy: { [sort]: order as any },
  });

  return NextResponse.json({ opportunities });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const count = await prisma.opportunity.count();
  const displayId = `OPP-${dateStr}-${String(count + 1).padStart(3, '0')}`;

  const stage = body.stage || 'Lead Identified';
  const probability = body.probability ?? (STAGE_DEFAULT_PROBABILITY[stage] || 10);

  const opp = await prisma.opportunity.create({
    data: {
      displayId,
      name: body.name,
      organizationId: body.organizationId,
      serviceLine: body.serviceLine,
      hasAgentComponent: body.hasAgentComponent || false,
      estimatedValue: parseFloat(body.estimatedValue) || 0,
      probability,
      stage,
      stageEnteredAt: now,
      ownerId: body.ownerId,
      enablerId: body.enablerId || null,
      sourceChannel: body.sourceChannel,
      nextAction: body.nextAction || '',
      nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
      expectedCloseDate: new Date(body.expectedCloseDate),
      notes: body.notes || '',
    },
    include: { owner: true, organization: true },
  });

  // Audit log
  await prisma.auditLog.create({
    data: { userId: session.id, action: 'CREATE', entityType: 'opportunities', entityId: opp.id, newValue: JSON.stringify({ displayId, name: body.name, stage }) },
  });

  // Stage history
  await prisma.stageHistory.create({
    data: { oppId: opp.id, oldStage: '', newStage: stage, userId: session.id },
  });

  // Notification
  if (opp.ownerId !== session.id) {
    await prisma.notification.create({
      data: { userId: opp.ownerId, type: 'stage_change', title: 'New Opportunity Assigned', message: `${opp.name} has been created and assigned to you.`, link: `/pipeline/${opp.id}` },
    });
  }

  return NextResponse.json({ opportunity: opp }, { status: 201 });
}
