'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import SearchModal from './SearchModal';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pipeline': 'Pipeline',
  '/pipeline/new': 'New Opportunity',
  '/kanban': 'Kanban Board',
  '/organizations': 'Organizations',
  '/team': 'Team',
  '/activities': 'Activities',
  '/demos': 'Demo Arsenal',
  '/incentives': 'Incentives & Bonuses',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
  '/notifications': 'Notifications',
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = window.localStorage.getItem('themePref');
      if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
    }
    return 'dark';
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [pipelineStats, setPipelineStats] = useState({ active: 0, value: 0, weighted: 0 });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) { router.push('/login'); return; }
      setUser(data.user);
      const userTheme = data.user.themePref === 'light' ? 'light' : 'dark';
      setTheme(userTheme);
      window.localStorage.setItem('themePref', userTheme);
    }).catch(() => router.push('/login'));

    fetch('/api/stats/pipeline-quick').then(r => r.json()).then(setPipelineStats).catch(() => {});
  }, [router]);

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : '';
    window.localStorage.setItem('themePref', theme);
  }, [theme]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await fetch('/api/users/theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: newTheme }) });
  }, [theme]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }, [router]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="text-sm animate-pulse-slow" style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
    </div>
  );

  const title = PAGE_TITLES[pathname] || pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') || 'Bayes CRM';

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Sidebar user={user} theme={theme} onThemeToggle={toggleTheme} onLogout={handleLogout} pipelineStats={pipelineStats} />
      <div className="lg:ml-[220px] min-h-screen pb-16 lg:pb-0">
        <TopBar title={title} user={user} theme={theme} onSearchOpen={() => setSearchOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
      <MobileNav />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
