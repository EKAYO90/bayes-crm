export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const incentives = await prisma.incentive.findMany({
    include: { user: { select: { id: true, name: true } }, opportunity: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ incentives });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const body = await req.json();
  const incentive = await prisma.incentive.create({
    data: {
      userId: body.userId,
      oppId: body.oppId || null,
      type: body.type,
      amount: parseFloat(body.amount),
      currency: body.currency || 'KES',
      approved: body.approved || false,
      notes: body.notes || '',
    },
  });
  return NextResponse.json({ incentive }, { status: 201 });
}
