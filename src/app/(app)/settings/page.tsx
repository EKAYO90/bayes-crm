'use client';
import { useState, useEffect } from 'react';
import { User, Bell, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user));
  }, []);

  useEffect(() => {
    if (tab === 'audit' && user && (user.role === 'admin' || user.role === 'manager')) {
      fetch('/api/audit-log?limit=50').then(r => r.json()).then(d => setAuditLogs(d.logs || []));
    }
  }, [tab, user]);

  if (!user) return null;

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    ...(user.role === 'admin' || user.role === 'manager' ? [{ key: 'audit', label: 'Audit Log', icon: Shield }] : []),
  ];

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: tab === t.key ? '#C0392B' : 'var(--color-card)', color: tab === t.key ? 'white' : 'var(--color-text-secondary)', border: `1px solid ${tab === t.key ? '#C0392B' : 'var(--color-border)'}` }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="rounded-xl p-6" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: '#C0392B' }}>
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{user.name}</h3>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user.title}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-[10px] font-medium block" style={{ color: 'var(--color-text-secondary)' }}>Role</span><span className="text-sm font-medium capitalize" style={{ color: 'var(--color-text-primary)' }}>{user.role.replace('_',' ')}</span></div>
            <div><span className="text-[10px] font-medium block" style={{ color: 'var(--color-text-secondary)' }}>Tier</span><span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{user.tier}</span></div>
            <div><span className="text-[10px] font-medium block" style={{ color: 'var(--color-text-secondary)' }}>Department</span><span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{user.department}</span></div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="rounded-xl p-6" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Notification Preferences</h3>
          <div className="space-y-3">
            {['Overdue Action Alerts','Stalled Deal Alerts','Weekly Scorecard','Deal Won Celebrations','Stage Change Notifications','Relationship Decay Warnings','Demo Day Reminders'].map(n => (
              <div key={n} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{n}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-8 h-4 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#C0392B]" style={{ background: 'var(--color-border)' }}>
                    <div className="absolute top-[2px] left-[2px] w-3 h-3 rounded-full bg-white transition-all peer-checked:translate-x-4" />
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Timestamp','User','Action','Entity','Details'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-primary)' }}>{log.user?.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{
                      background: log.action === 'CREATE' ? 'rgba(39,174,96,0.1)' : log.action === 'DELETE' ? 'rgba(231,76,60,0.1)' : log.action === 'STAGE_CHANGE' ? 'rgba(41,128,185,0.1)' : 'var(--color-bg)',
                      color: log.action === 'CREATE' ? '#27AE60' : log.action === 'DELETE' ? '#E74C3C' : log.action === 'STAGE_CHANGE' ? '#2980B9' : 'var(--color-text-secondary)',
                    }}>{log.action}</span>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{log.entityType}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] max-w-[200px] truncate" style={{ color: 'var(--color-text-secondary)' }}>{log.newValue !== '{}' ? log.newValue : log.oldValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
