'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthToast from '@/components/auth/AuthToast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function PendingApprovalPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  async function refreshApproval() {
    if (!supabase) {
      setToast({ message: 'Supabase is not configured yet.', tone: 'error' });
      return;
    }

    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        router.push('/login');
        return;
      }

      const syncRes = await fetch('/api/auth/supabase/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      if (syncRes.ok) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      const body = await syncRes.json().catch(() => ({}));
      if (body?.approvalStatus === 'rejected') {
        setToast({ message: 'Your request was rejected. Contact an administrator.', tone: 'error' });
      } else {
        setToast({ message: 'Still pending approval.', tone: 'success' });
      }
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      {toast && <AuthToast message={toast.message} tone={toast.tone} />}
      <div className="w-full max-w-md p-8 rounded-2xl text-center" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Awaiting admin approval
        </h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Your email is verified, but your account still needs approval from a Bayes CRM administrator.
        </p>

        <button
          type="button"
          onClick={refreshApproval}
          disabled={loading}
          className="w-full mt-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--color-brand-primary)' }}
        >
          {loading ? 'Checking...' : 'Check approval status'}
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        >
          Sign out
        </button>

        <p className="mt-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Need help? Contact an admin or go back to <Link href="/login" style={{ color: 'var(--color-brand-primary)' }}>login</Link>.
        </p>
      </div>
    </div>
  );
}
