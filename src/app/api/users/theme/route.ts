import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { theme } = await req.json();
  await prisma.user.update({ where: { id: session.id }, data: { themePref: theme } });
  return NextResponse.json({ ok: true });
}
