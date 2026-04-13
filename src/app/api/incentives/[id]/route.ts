import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const body = await req.json();
  const incentive = await prisma.incentive.update({ where: { id: params.id }, data: { approved: body.approved, notes: body.notes } });
  return NextResponse.json({ incentive });
}
