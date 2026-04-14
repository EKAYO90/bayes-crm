export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = new URL(req.url).searchParams.get('q') || '';
  if (q.length < 2) return NextResponse.json({ opportunities: [], organizations: [], contacts: [], activities: [] });

  const opportunities = (await prisma.opportunity.findMany({
    where: { deletedAt: null, OR: [{ name: { contains: q } }, { notes: { contains: q } }, { displayId: { contains: q } }] },
    include: { organization: { select: { name: true } } },
    take: 5,
  })).map(o => ({ id: o.id, name: o.name, subtitle: `${o.displayId} · ${o.organization.name} · ${o.stage}`, href: `/pipeline/${o.id}` }));

  const organizations = (await prisma.organization.findMany({
    where: { deletedAt: null, name: { contains: q } },
    take: 5,
  })).map(o => ({ id: o.id, name: o.name, subtitle: o.type, href: `/organizations/${o.id}` }));

  const contacts = (await prisma.contact.findMany({
    where: { deletedAt: null, OR: [{ fullName: { contains: q } }, { email: { contains: q } }] },
    include: { organization: { select: { name: true } } },
    take: 5,
  })).map(c => ({ id: c.id, name: c.fullName, subtitle: `${c.title} · ${c.organization.name}`, href: `/organizations/${c.orgId}` }));

  const activities = (await prisma.activity.findMany({
    where: { description: { contains: q } },
    include: { user: { select: { name: true } } },
    take: 5,
  })).map(a => ({ id: a.id, name: a.description.slice(0, 80), subtitle: `${a.user.name} · ${a.activityType}`, href: `/activities` }));

  return NextResponse.json({ opportunities, organizations, contacts, activities });
}
