export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const activeStages = ['Lead Identified', 'Initial Contact', 'Discovery Meeting', 'Proposal Development', 'Proposal Submitted', 'Negotiation'];
  const opps = await prisma.opportunity.findMany({ where: { stage: { in: activeStages }, deletedAt: null } });
  const active = opps.length;
  const value = opps.reduce((s, o) => s + o.estimatedValue, 0);
  const weighted = opps.reduce((s, o) => s + o.estimatedValue * o.probability / 100, 0);
  return NextResponse.json({ active, value, weighted });
}
