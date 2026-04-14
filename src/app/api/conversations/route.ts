export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { clampToLast7Days, getISOWeekStart } from '@/lib/conversations';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const conversationType = url.searchParams.get('conversationType');
  const organizationId = url.searchParams.get('organizationId');
  const newLeadsOnly = url.searchParams.get('newLeadsOnly') === 'true';
  const search = url.searchParams.get('search');
  const userId = url.searchParams.get('userId');
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
  const take = parseInt(url.searchParams.get('limit') || '100', 10);

  const where: any = {
    deletedAt: includeDeleted ? undefined : null,
  };

  if (session.role === 'team_member' || session.role === 'viewer') {
    where.userId = session.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (startDate || endDate) {
    where.conversationDate = {};
    if (startDate) where.conversationDate.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.conversationDate.lte = end;
    }
  }

  if (conversationType) where.conversationType = conversationType;
  if (organizationId) where.organizationId = organizationId;
  if (newLeadsOnly) where.isNewLead = true;
  if (search) {
    where.OR = [
      { summary: { contains: search, mode: 'insensitive' } },
      { outcome: { contains: search, mode: 'insensitive' } },
      { counterpartyName: { contains: search, mode: 'insensitive' } },
      { organization: { name: { contains: search, mode: 'insensitive' } } },
      { opportunity: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, tier: true } },
      organization: { select: { id: true, name: true } },
      opportunity: { select: { id: true, displayId: true, name: true } },
    },
    orderBy: { conversationDate: 'desc' },
    take,
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const actingUserId = session.role === 'admin' || session.role === 'manager' ? (body.userId || session.id) : session.id;

  const conversationDate = clampToLast7Days(new Date(body.conversationDate || new Date()));
  if (!conversationDate) {
    return NextResponse.json({ error: 'Conversation date must be within the last 7 days.' }, { status: 400 });
  }

  if (!body.summary || String(body.summary).trim().length < 50) {
    return NextResponse.json({ error: 'Description must be at least 50 characters.' }, { status: 400 });
  }

  const followUpRequired = Boolean(body.followUpRequired);
  if (followUpRequired && !body.followUpDate) {
    return NextResponse.json({ error: 'Follow-up date is required when follow-up is enabled.' }, { status: 400 });
  }

  const duplicateCandidate = await prisma.conversation.findFirst({
    where: {
      userId: actingUserId,
      organizationId: body.organizationId || null,
      conversationType: body.conversationType,
      conversationDate: {
        gte: new Date(new Date(conversationDate).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(conversationDate).setHours(23, 59, 59, 999)),
      },
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  const isDuplicate = Boolean(duplicateCandidate);

  const conversation = await prisma.conversation.create({
    data: {
      userId: actingUserId,
      organizationId: body.organizationId || null,
      opportunityId: body.opportunityId || null,
      conversationDate,
      conversationType: body.conversationType,
      channel: body.channel || 'External',
      counterpartyName: body.counterpartyName || '',
      counterpartyRole: body.counterpartyRole || '',
      counterpartyEmail: body.counterpartyEmail || '',
      summary: String(body.summary).trim(),
      outcome: body.outcome || '',
      nextStep: body.nextStep || '',
      followUpRequired,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      isExternal: true,
      isNewLead: Boolean(body.isNewLead),
      isDuplicate,
      metadata: JSON.stringify({
        source: body.source || 'manual',
        weekStart: getISOWeekStart(conversationDate).toISOString(),
      }),
    },
    include: {
      user: { select: { id: true, name: true, tier: true } },
      organization: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true, displayId: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: 'CREATE',
      entityType: 'conversations',
      entityId: conversation.id,
      newValue: JSON.stringify({
        userId: actingUserId,
        conversationType: conversation.conversationType,
        conversationDate: conversation.conversationDate,
        isNewLead: conversation.isNewLead,
      }),
    },
  });

  return NextResponse.json({ conversation, duplicateWarning: isDuplicate }, { status: 201 });
}
