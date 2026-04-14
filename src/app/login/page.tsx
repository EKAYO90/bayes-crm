'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import AuthToast from '@/components/auth/AuthToast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('themePref');
    const initialTheme =
      storedTheme === 'light' || storedTheme === 'dark'
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';
    setTheme(initialTheme);
    document.documentElement.className = initialTheme === 'light' ? 'light' : '';
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function syncSupabaseSession(accessToken: string) {
    const res = await fetch('/api/auth/supabase/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    if (res.ok) {
      setToast({ message: 'Welcome back!', tone: 'success' });
      router.push('/dashboard');
      router.refresh();
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (res.status === 403 && data?.requiresApproval) {
      router.push('/pending-approval');
      return;
    }

    throw new Error(data?.error || 'Failed to initialize application session.');
  }

  async function handleLegacyLogin() {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setToast({ message: 'Signed in with legacy authentication.', tone: 'success' });
    router.push('/dashboard');
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      if (supabase) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!signInError && data.session?.access_token) {
          await syncSupabaseSession(data.session.access_token);
          return;
        }
      }

      await handleLegacyLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      setToast({ message: 'Unable to sign in.', tone: 'error' });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      {toast && <AuthToast message={toast.message} tone={toast.tone} />}
      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <BrandLogo theme={theme} className="w-full max-w-[230px] h-auto" priority />
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in to Bayes CRM
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              required
              placeholder="you@bayesconsulting.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--color-bg)',
                border: `1px solid ${email && !isValidEmail(email) ? '#E74C3C' : 'var(--color-border)'}`,
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <Link href="/forgot-password" className="text-xs" style={{ color: 'var(--color-brand-primary)' }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-brand-primary)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
          New here?{' '}
          <Link href="/signup" style={{ color: 'var(--color-brand-primary)' }}>
            Create an account
          </Link>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Legacy default password: <span className="font-mono">bayes2026</span>
        </p>
      </div>
    </div>
  );
}
