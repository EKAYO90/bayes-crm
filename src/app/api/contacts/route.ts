export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const contact = await prisma.contact.create({
    data: {
      orgId: body.orgId,
      fullName: body.fullName,
      title: body.title || '',
      email: body.email || '',
      phone: body.phone || '',
      linkedinUrl: body.linkedinUrl || '',
      isDecisionMaker: body.isDecisionMaker || false,
      notes: body.notes || '',
    },
  });
  return NextResponse.json({ contact }, { status: 201 });
}
