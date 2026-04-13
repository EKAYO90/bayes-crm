import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get('search');
  const status = url.searchParams.get('status');
  const owner = url.searchParams.get('owner');

  const where: any = { deletedAt: null };
  if (search) where.name = { contains: search };
  if (status) where.relationshipStatus = status;
  if (owner) where.relationshipOwnerId = owner;

  const organizations = await prisma.organization.findMany({
    where,
    include: {
      relationshipOwner: { select: { id: true, name: true } },
      _count: { select: { contacts: true, opportunities: true, activities: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ organizations });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const org = await prisma.organization.create({
    data: {
      name: body.name,
      type: body.type,
      sector: body.sector || '',
      serviceLineFit: JSON.stringify(body.serviceLineFit || []),
      relationshipOwnerId: body.relationshipOwnerId,
      relationshipStatus: body.relationshipStatus || 'Cold',
      website: body.website || '',
      notes: body.notes || '',
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.id, action: 'CREATE', entityType: 'organizations', entityId: org.id, newValue: JSON.stringify({ name: body.name }) },
  });

  return NextResponse.json({ organization: org }, { status: 201 });
}
