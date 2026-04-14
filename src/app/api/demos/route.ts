export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const demos = await prisma.demo.findMany({ include: { owner: { select: { id: true, name: true } } }, orderBy: { name: 'asc' } });
  return NextResponse.json({ demos });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const demo = await prisma.demo.create({
    data: {
      name: body.name,
      ownerId: body.ownerId,
      status: body.status || 'Not Started',
      lastTestedDate: new Date(body.lastTestedDate || new Date()),
      url: body.url || '',
      demoDataCurrent: body.demoDataCurrent ?? true,
      videoRecorded: body.videoRecorded || 'No',
      videoUrl: body.videoUrl || '',
      issues: body.issues || '',
    },
  });
  return NextResponse.json({ demo }, { status: 201 });
}
