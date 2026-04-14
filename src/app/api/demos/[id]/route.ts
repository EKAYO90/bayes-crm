export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const data: any = {};
  for (const k of ['name','ownerId','status','url','demoDataCurrent','videoRecorded','videoUrl','issues']) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.lastTestedDate) data.lastTestedDate = new Date(body.lastTestedDate);
  const demo = await prisma.demo.update({ where: { id: params.id }, data });
  return NextResponse.json({ demo });
}
