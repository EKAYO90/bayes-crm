'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AuthToast from '@/components/auth/AuthToast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function CheckEmailPage() {
  const [email, setEmail] = useState('your email');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryEmail = params.get('email');
    if (queryEmail) setEmail(queryEmail);
  }, []);
  async function resendConfirmation() {
    if (!supabase) {
      setToast({ message: 'Supabase is not configured yet.', tone: 'error' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);

    if (error) {
      setToast({ message: error.message, tone: 'error' });
      return;
    }

    setToast({ message: 'Confirmation email sent again.', tone: 'success' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      {toast && <AuthToast message={toast.message} tone={toast.tone} />}
      <div className="w-full max-w-md p-8 rounded-2xl text-center" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Check your email</h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          We sent a confirmation link to <strong>{email}</strong>. Click the link to verify your account and continue.
        </p>

        <button
          type="button"
          onClick={resendConfirmation}
          disabled={loading}
          className="w-full mt-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--color-brand-primary)' }}
        >
          {loading ? 'Sending...' : 'Resend confirmation email'}
        </button>

        <p className="mt-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Already confirmed? <Link href="/login" style={{ color: 'var(--color-brand-primary)' }}>Back to login</Link>
        </p>
      </div>
    </div>
  );
}