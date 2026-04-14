import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';

const PUBLIC_ROUTES = new Set([
  '/login',
  '/signup',
  '/check-email',
  '/auth/callback',
  '/forgot-password',
  '/reset-password',
  '/pending-approval',
]);

function decodeJwtRole(token?: string) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    const parsed = JSON.parse(normalized);
    return parsed?.role || null;
  } catch {
    return null;
  }
}

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const jwtToken = req.cookies.get('session')?.value;
  const jwtRole = decodeJwtRole(jwtToken);
  const hasJwt = Boolean(jwtToken);

  if (!isSupabaseConfigured()) {
    if (!hasJwt && !PUBLIC_ROUTES.has(pathname)) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (hasJwt && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (pathname.startsWith('/settings/users') && jwtRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  let response = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { approval_status: string; role: string } | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('approval_status, role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    profile = data;
  }

  const isAuthenticated = hasJwt || Boolean(user);
  const isPublic = PUBLIC_ROUTES.has(pathname);

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    if (profile?.approval_status && profile.approval_status !== 'approved') {
      return NextResponse.redirect(new URL('/pending-approval', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  const pendingStatus = profile?.approval_status && profile.approval_status !== 'approved';
  if (pendingStatus && !['/pending-approval', '/check-email', '/auth/callback', '/reset-password'].includes(pathname)) {
    return NextResponse.redirect(new URL('/pending-approval', req.url));
  }

  if (pathname.startsWith('/settings/users')) {
    const isAdmin = profile?.role === 'admin' || jwtRole === 'admin';
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};
