import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { STAGE_DEFAULT_PROBABILITY } from '@/lib/constants';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const opp = await prisma.opportunity.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, tier: true, email: true } },
      enabler: { select: { id: true, name: true, tier: true } },
      organization: { select: { id: true, name: true, type: true } },
      stageHistory: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      activities: { include: { user: { select: { name: true } } }, orderBy: { date: 'desc' }, take: 20 },
      attachments: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ opportunity: opp });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const opp = await prisma.opportunity.findUnique({ where: { id: params.id } });
  if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (session.role === 'team_member' && opp.ownerId !== session.id && opp.enablerId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const oldStage = opp.stage;
  const newStage = body.stage || opp.stage;
  const stageChanged = oldStage !== newStage;

  // Validate stage transitions
  if ((newStage === 'Contract Signed' || newStage === 'Lost') && !body.actualCloseDate && !opp.actualCloseDate) {
    return NextResponse.json({ error: 'actual_close_date required for Won/Lost deals' }, { status: 400 });
  }
  if ((newStage === 'Contract Signed' || newStage === 'Lost') && !body.winLossReason && !opp.winLossReason) {
    return NextResponse.json({ error: 'win_loss_reason required for Won/Lost deals' }, { status: 400 });
  }

  const updateData: any = {};
  const fields = ['name','organizationId','serviceLine','hasAgentComponent','estimatedValue','probability','stage','ownerId','enablerId','sourceChannel','nextAction','nextActionDate','expectedCloseDate','actualCloseDate','winLossReason','notes','proposalSubmitted','proposalDate'];
  for (const f of fields) {
    if (body[f] !== undefined) {
      if (['nextActionDate','expectedCloseDate','actualCloseDate','proposalDate'].includes(f) && body[f]) {
        updateData[f] = new Date(body[f]);
      } else if (f === 'estimatedValue') {
        updateData[f] = parseFloat(body[f]);
      } else if (f === 'probability') {
        updateData[f] = parseInt(body[f]);
      } else {
        updateData[f] = body[f];
      }
    }
  }

  if (stageChanged) {
    updateData.stageEnteredAt = new Date();
    if (!body.probability) updateData.probability = STAGE_DEFAULT_PROBABILITY[newStage] ?? opp.probability;
  }

  const updated = await prisma.opportunity.update({ where: { id: params.id }, data: updateData, include: { owner: true, organization: true, enabler: true } });

  // Audit log
  await prisma.auditLog.create({
    data: { userId: session.id, action: stageChanged ? 'STAGE_CHANGE' : 'UPDATE', entityType: 'opportunities', entityId: opp.id, oldValue: JSON.stringify({ stage: oldStage }), newValue: JSON.stringify(updateData) },
  });

  // Stage history
  if (stageChanged) {
    await prisma.stageHistory.create({
      data: { oppId: opp.id, oldStage, newStage, userId: session.id },
    });

    // Notify owner and enabler
    const notifUsers = [opp.ownerId, opp.enablerId].filter(Boolean).filter(id => id !== session.id);
    for (const uid of notifUsers) {
      await prisma.notification.create({
        data: { userId: uid!, type: 'stage_change', title: 'Stage Changed', message: `${opp.name} moved from ${oldStage} to ${newStage}`, link: `/pipeline/${opp.id}` },
      });
    }

    // Deal won celebration
    if (newStage === 'Contract Signed') {
      const allUsers = await prisma.user.findMany({ where: { isActive: true } });
      for (const u of allUsers) {
        await prisma.notification.create({
          data: { userId: u.id, type: 'deal_won', title: '🎉 Deal Won!', message: `${updated.owner.name} just closed ${opp.name} for $${opp.estimatedValue.toLocaleString()}!`, link: `/pipeline/${opp.id}` },
        });
      }
    }
  }

  return NextResponse.json({ opportunity: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  await prisma.opportunity.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: { userId: session.id, action: 'DELETE', entityType: 'opportunities', entityId: params.id },
  });

  return NextResponse.json({ ok: true });
}
