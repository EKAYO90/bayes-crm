'use client';
import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Activity, Crown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TIER_COLORS: Record<string, string> = { Closer: '#C0392B', Hunter: '#2980B9', Enabler: '#8E44AD' };

export default function TeamPage() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'pipeline' | 'activity' | 'revenue'>('pipeline');

  useEffect(() => {
    fetch('/api/stats/leaderboard').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>;

  const tabs = [
    { key: 'pipeline' as const, label: 'Pipeline', icon: TrendingUp },
    { key: 'activity' as const, label: 'Activity', icon: Activity },
    { key: 'revenue' as const, label: 'Revenue', icon: Trophy },
  ];

  const currentData = data[tab] || [];

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: tab === t.key ? '#C0392B' : 'var(--color-card)', color: tab === t.key ? 'white' : 'var(--color-text-secondary)', border: `1px solid ${tab === t.key ? '#C0392B' : 'var(--color-border)'}` }}
          >
            <t.icon size={14} /> {t.label} Leaderboard
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={currentData.slice(0, 13)} margin={{ left: 10, right: 20 }} layout="vertical">
            <XAxis type="number" tickFormatter={(v: any) => tab === 'activity' ? String(v) : `$${(v/1000).toFixed(0)}K`} tick={{ fill: '#8A8A95', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#8A8A95', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => tab === 'activity' ? `Score: ${v}` : `$${v.toLocaleString()}`} contentStyle={{ background: '#141416', border: '1px solid #2A2A2F', borderRadius: 8, fontSize: 12, color: '#F5F5F5' }} />
            <Bar dataKey={tab === 'activity' ? 'score' : 'value'} radius={[0, 4, 4, 0]}>
              {currentData.map((entry: any) => <Cell key={entry.id} fill={TIER_COLORS[entry.tier] || '#666'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Rank</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Name</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Tier</th>
              <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{tab === 'activity' ? 'Score' : 'Value'}</th>
              {tab !== 'activity' && <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Deals</th>}
            </tr>
          </thead>
          <tbody>
            {currentData.map((u: any, i: number) => (
              <tr key={u.id} className="transition-all hover:opacity-80" style={{ borderBottom: '1px solid var(--color-border)', background: i === 0 ? 'rgba(243,156,18,0.05)' : 'transparent' }}>
                <td className="px-4 py-3">
                  <span className="text-sm font-bold" style={{ color: i === 0 ? '#F39C12' : 'var(--color-text-secondary)' }}>
                    {i === 0 ? '\u{1F3C6}' : `#${i + 1}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: TIER_COLORS[u.tier] }}>
                      {u.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: TIER_COLORS[u.tier] }}>{u.tier}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: '#27AE60' }}>
                  {tab === 'activity' ? u.score : `$${(u.value/1000).toFixed(0)}K`}
                </td>
                {tab !== 'activity' && <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--color-text-secondary)' }}>{u.deals}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
