'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GitBranch, Building2, MessageSquare, Settings } from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/organizations', label: 'Orgs', icon: Building2 },
  { href: '/conversations', label: 'Convos', icon: MessageSquare },
  { href: '/settings', label: 'More', icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden" style={{ background: 'var(--color-card)', borderTop: '1px solid var(--color-border)' }}>
      {items.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center py-2 text-[10px] font-medium transition-all"
            style={{ color: active ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)' }}>
            <Icon size={18} />
            <span className="mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
