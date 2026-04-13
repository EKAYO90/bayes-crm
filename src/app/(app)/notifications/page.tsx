'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/notifications?limit=100').then(r => r.json()).then(d => setNotifications(d.notifications || []));
  }, []);

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{notifications.filter(n => !n.read).length} unread</span>
        <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: '#C0392B' }}><Check size={12} /> Mark all read</button>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>No notifications</div>
        ) : notifications.map(n => (
          <Link key={n.id} href={n.link || '#'} className="block px-4 py-3 transition-all hover:opacity-80" style={{ background: n.read ? 'transparent' : 'rgba(192,57,43,0.03)', borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.read ? 'transparent' : '#C0392B' }} />
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{n.title}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{n.message}</div>
                <div className="text-[10px] mt-1 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
