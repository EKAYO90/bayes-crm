export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createSupabaseRouteClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', '', { httpOnly: true, maxAge: 0, path: '/' });
  return res;
}
