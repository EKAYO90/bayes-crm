'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [error, setError] = useState('');

  useEffect(() => {
    async function run() {
      try {
        if (!supabase) {
          setError('Supabase is not configured yet.');
          return;
        }

        const query = new URLSearchParams(window.location.search);
        const code = query.get('code');
        const tokenHash = query.get('token_hash');
        const otpType = query.get('type') as
          | 'signup'
          | 'magiclink'
          | 'recovery'
          | 'invite'
          | 'email_change'
          | null;

        if (tokenHash && otpType) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: otpType,
            token_hash: tokenHash,
          });
          if (verifyError) throw verifyError;
          if (otpType === 'recovery') {
            router.replace('/reset-password');
            return;
          }
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          router.replace('/login');
          return;
        }

        const syncRes = await fetch('/api/auth/supabase/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });

        if (syncRes.ok) {
          router.replace('/dashboard');
          router.refresh();
          return;
        }

        const body = await syncRes.json().catch(() => ({}));
        if (syncRes.status === 403 && body?.requiresApproval) {
          router.replace('/pending-approval');
          return;
        }

        throw new Error(body?.error || 'Could not complete authentication.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed.');
      }
    }

    run();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md p-8 rounded-2xl text-center" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        {!error ? (
          <>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Completing sign-in...</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Please wait while we verify your account.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-danger)' }}>Authentication error</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
            <Link href="/login" className="inline-block mt-5 text-sm" style={{ color: 'var(--color-brand-primary)' }}>
              Return to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
