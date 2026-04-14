'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const router = useRouter();

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('themePref');
    const initialTheme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';

    setTheme(initialTheme);
    document.documentElement.className = initialTheme === 'light' ? 'light' : '';
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <div className="text-center mb-8 flex flex-col items-center">
          <BrandLogo
            theme={theme}
            className="w-full max-w-[230px] h-auto"
            priority
          />
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Sales & Pipeline Management System</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@bayesconsulting.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
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
        <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Default password: <span className="font-mono">bayes2026</span>
        </p>
      </div>
    </div>
  );
}
