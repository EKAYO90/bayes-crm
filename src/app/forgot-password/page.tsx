'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import AuthToast from '@/components/auth/AuthToast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!supabase) {
      setToast({ message: 'Supabase is not configured yet.', tone: 'error' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);

    if (error) {
      setToast({ message: error.message, tone: 'error' });
      return;
    }

    setToast({ message: 'Password reset link sent. Check your email.', tone: 'success' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      {toast && <AuthToast message={toast.message} tone={toast.tone} />}
      <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Reset password</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Enter your account email and we’ll send you a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--color-brand-primary)' }}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Remembered it? <Link href="/login" style={{ color: 'var(--color-brand-primary)' }}>Back to login</Link>
        </p>
      </div>
    </div>
  );
}
