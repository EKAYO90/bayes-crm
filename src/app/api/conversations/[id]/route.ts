export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { clampToLast7Days } from '@/lib/conversations';

async function canAccessConversation(session: any, conversationUserId: string) {
  if (session.role === 'admin' || session.role === 'manager') return true;
  return session.id === conversationUserId;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, tier: true } },
      organization: { select: { id: true, name: true } },
      opportunity: { select: { id: true, displayId: true, name: true } },
    },
  });

  if (!conversation || conversation.deletedAt) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const access = await canAccessConversation(session, conversation.userId);
  if (!access && session.role !== 'viewer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ conversation });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.conversation.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  const access = await canAccessConversation(session, existing.userId);
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();

  if (body.summary !== undefined && String(body.summary).trim().length < 50) {
    return NextResponse.json({ error: 'Description must be at least 50 characters.' }, { status: 400 });
  }

  let normalizedDate: Date | undefined = undefined;
  if (body.conversationDate) {
    const normalized = clampToLast7Days(new Date(body.conversationDate));
    if (!normalized) {
      return NextResponse.json({ error: 'Conversation date must be within the last 7 days.' }, { status: 400 });
    }
    normalizedDate = normalized;
  }

  const followUpRequired = body.followUpRequired !== undefined ? Boolean(body.followUpRequired) : existing.followUpRequired;
  const followUpDate = body.followUpDate !== undefined ? (body.followUpDate ? new Date(body.followUpDate) : null) : existing.followUpDate;

  if (followUpRequired && !followUpDate) {
    return NextResponse.json({ error: 'Follow-up date is required when follow-up is enabled.' }, { status: 400 });
  }

  const updated = await prisma.conversation.update({
    where: { id: params.id },
    data: {
      conversationDate: normalizedDate,
      conversationType: body.conversationType,
      organizationId: body.organizationId !== undefined ? (body.organizationId || null) : undefined,
      opportunityId: body.opportunityId !== undefined ? (body.opportunityId || null) : undefined,
      counterpartyName: body.counterpartyName,
      counterpartyRole: body.counterpartyRole,
      counterpartyEmail: body.counterpartyEmail,
      summary: body.summary !== undefined ? String(body.summary).trim() : undefined,
      outcome: body.outcome,
      nextStep: body.nextStep,
      followUpRequired,
      followUpDate,
      isNewLead: body.isNewLead,
    },
    include: {
      user: { select: { id: true, name: true, tier: true } },
      organization: { select: { id: true, name: true } },
      opportunity: { select: { id: true, displayId: true, name: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: 'UPDATE',
      entityType: 'conversations',
      entityId: updated.id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
    },
  });

  return NextResponse.json({ conversation: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.conversation.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  const access = await canAccessConversation(session, existing.userId);
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const deleted = await prisma.conversation.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: 'DELETE',
      entityType: 'conversations',
      entityId: deleted.id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify({ deletedAt: deleted.deletedAt }),
    },
  });

  return NextResponse.json({ success: true });
}
