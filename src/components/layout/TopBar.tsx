'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, Plus, Search, Menu, MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

interface TopBarProps {
  title: string;
  user: { id: string; name: string; role: string };
  theme: 'light' | 'dark';
  onMenuToggle?: () => void;
  onSearchOpen?: () => void;
  onLogConversationOpen?: () => void;
}

export default function TopBar({ title, user, theme, onMenuToggle, onSearchOpen, onLogConversationOpen }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/notifications?limit=10').then(r => r.json()).then(data => {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    setUnreadCount(0);
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14" style={{ background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuToggle} className="lg:hidden p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="lg:hidden flex-shrink-0">
          <BrandLogo theme={theme} className="w-[96px] h-auto" />
        </Link>
        <h1 className="text-base font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Search */}
        <button onClick={onSearchOpen} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <Search size={14} />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--color-border)' }}>⌘K</kbd>
        </button>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg transition-all hover:opacity-80" style={{ color: 'var(--color-text-secondary)' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: 'var(--color-danger)', minWidth: 18, height: 18 }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl overflow-hidden animate-slideIn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Notifications</span>
                {unreadCount > 0 && <button onClick={markAllRead} className="text-[11px] font-medium" style={{ color: 'var(--color-brand-primary)' }}>Mark all read</button>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>No notifications</div>
                ) : notifications.map(n => (
                  <Link key={n.id} href={n.link || '#'} onClick={() => setNotifOpen(false)}
                    className="block px-4 py-3 transition-all hover:opacity-80"
                    style={{ background: n.read ? 'transparent' : 'rgba(192,57,43,0.05)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{n.title}</div>
                    <div className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{n.message}</div>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/notifications" onClick={() => setNotifOpen(false)}
                className="block text-center py-2.5 text-[11px] font-medium transition-all hover:opacity-80"
                style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-brand-primary)' }}
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>

        {user.role !== 'viewer' && (
          <button
            onClick={onLogConversationOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: 'rgba(192,57,43,0.12)', color: 'var(--color-brand-primary)', border: '1px solid rgba(192,57,43,0.3)' }}
          >
            <MessageSquarePlus size={14} />
            <span className="hidden sm:inline">Log Conversation</span>
          </button>
        )}

        {/* New Opportunity */}
        {user.role !== 'viewer' && (
          <Link href="/pipeline/new" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90" style={{ background: 'var(--color-brand-primary)' }}>
            <Plus size={14} />
            <span className="hidden sm:inline">New Opportunity</span>
          </Link>
        )}
      </div>
    </header>
  );
}
