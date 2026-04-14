'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import PasswordStrength from '@/components/auth/PasswordStrength';
import AuthToast from '@/components/auth/AuthToast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Tech');
  const [tier, setTier] = useState('Enabler');
  const [title, setTitle] = useState('');

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
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const emailValid = email.length === 0 || isValidEmail(email);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!supabase) {
      setError('Supabase Auth variables are not configured yet. Please set env vars first.');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const emailRedirectTo = `${window.location.origin}/auth/callback`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: { full_name: fullName },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user?.id) throw new Error('Could not initialize auth user.');

      const profileRes = await fetch('/api/auth/register-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authUserId: data.user.id,
          email,
          fullName,
          role: 'team_member',
          tier,
          department,
          title,
          targetsAssigned: '',
        }),
      });

      if (!profileRes.ok) {
        const profileError = await profileRes.json().catch(() => ({}));
        throw new Error(profileError?.error || 'Failed to initialize your profile.');
      }

      if (data.session?.access_token) {
        const syncRes = await fetch('/api/auth/supabase/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: data.session.access_token }),
        });

        if (syncRes.ok) {
          router.push('/dashboard');
          router.refresh();
          return;
        }

        router.push('/pending-approval');
        return;
      }

      setToast({ message: 'Sign-up successful. Check your email to confirm.', tone: 'success' });
      router.push(`/check-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed.');
      setToast({ message: 'Could not complete sign-up.', tone: 'error' });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--color-bg)' }}>
      {toast && <AuthToast message={toast.message} tone={toast.tone} />}
      <div className="w-full max-w-lg p-8 rounded-2xl" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <div className="text-center mb-8 flex flex-col items-center">
          <BrandLogo theme={theme} className="w-full max-w-[230px] h-auto" priority />
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Create your Bayes CRM account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--color-bg)',
                  border: `1px solid ${emailValid ? 'var(--color-border)' : '#E74C3C'}`,
                  color: 'var(--color-text-primary)',
                }}
              />
              {!emailValid && <p className="text-[11px] mt-1" style={{ color: '#E74C3C' }}>Please enter a valid email format.</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option>Leadership</option>
                <option>Advisory</option>
                <option>Tech</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option>Closer</option>
                <option>Hunter</option>
                <option>Enabler</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Job Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                placeholder="e.g. AI Engineer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <PasswordStrength password={password} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--color-bg)',
                  border: `1px solid ${passwordsMatch ? 'var(--color-border)' : '#E74C3C'}`,
                  color: 'var(--color-text-primary)',
                }}
              />
              {!passwordsMatch && <p className="text-[11px] mt-1" style={{ color: '#E74C3C' }}>Passwords do not match.</p>}
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-brand-primary)' }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-brand-primary)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
