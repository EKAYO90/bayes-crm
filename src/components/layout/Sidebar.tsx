'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GitBranch, Columns3, Building2, Users, Activity, Monitor, FileBarChart, Settings, LogOut, Sun, Moon, Trophy, Gift } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/kanban', label: 'Kanban', icon: Columns3 },
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/activities', label: 'Activities', icon: Activity },
  { href: '/demos', label: 'Demos', icon: Monitor },
  { href: '/incentives', label: 'Incentives', icon: Gift },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  user: { name: string; role: string; title: string; themePref: string };
  theme: string;
  onThemeToggle: () => void;
  onLogout: () => void;
  pipelineStats?: { active: number; value: number; weighted: number };
}

export default function Sidebar({ user, theme, onThemeToggle, onLogout, pipelineStats }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex flex-col hidden lg:flex" style={{ width: 220, background: 'var(--color-card)', borderRight: '1px solid var(--color-border)' }}>
      {/* Logo */}
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-brand-primary)' }}>
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Bayes CRM</div>
          <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>Sales Pipeline</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
              style={{
                color: active ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                background: active ? 'rgba(192,57,43,0.1)' : 'transparent',
              }}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Pipeline Stats */}
      {pipelineStats && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>Quick Stats</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--color-text-secondary)' }}>Active Deals</span>
              <span className="font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>{pipelineStats.active}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--color-text-secondary)' }}>Pipeline</span>
              <span className="font-mono font-semibold" style={{ color: 'var(--color-success)' }}>${(pipelineStats.value / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--color-text-secondary)' }}>Weighted</span>
              <span className="font-mono font-semibold" style={{ color: 'var(--color-info)' }}>${(pipelineStats.weighted / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>
      )}

      {/* User + Theme */}
      <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--color-brand-primary)' }}>
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{user.name}</div>
            <div className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)' }}>{user.title}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onThemeToggle} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] transition-all hover:opacity-80" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button onClick={onLogout} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] transition-all hover:opacity-80" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
