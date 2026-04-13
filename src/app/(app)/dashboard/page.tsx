'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Target, AlertTriangle, Cpu } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid } from 'recharts';
import Link from 'next/link';

const SL_COLORS: Record<string, string> = { 'Clean Energy Transition': '#E67E22', 'Climate Risk & Adaptation': '#27AE60', 'Investment & Transaction': '#2980B9', 'Data & Digital': '#8E44AD', 'Programme Design': '#E74C3C' };
const STAGE_COLORS: Record<string, string> = { 'Lead Identified': '#3498DB', 'Initial Contact': '#2980B9', 'Discovery Meeting': '#8E44AD', 'Proposal Development': '#E67E22', 'Proposal Submitted': '#F39C12', 'Negotiation': '#E74C3C' };
const TIER_COLORS: Record<string, string> = { Closer: '#C0392B', Hunter: '#2980B9', Enabler: '#8E44AD' };

function KPICard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="rounded-xl p-4 animate-fadeIn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, color }}><Icon size={16} /></div>
      </div>
      <div className="text-xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
      {sub && <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/stats/dashboard').then(r => r.json()).then(setData).catch(console.error); }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-sm animate-pulse-slow" style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard...</div>;

  const { kpis, funnelData, serviceLineData, sourceData, leaderboard, upcomingActions, wonCount, lostCount, winLossData } = data;
  const winRate = wonCount + lostCount > 0 ? Math.round(wonCount / (wonCount + lostCount) * 100) : 0;

  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const forecastData = months.map((m, i) => ({
    month: m,
    optimistic: Math.round(kpis.totalPipeline * (0.15 + i * 0.05)),
    weighted: Math.round(kpis.weightedPipeline * (0.2 + i * 0.05)),
    conservative: Math.round(kpis.weightedPipeline * (0.1 + i * 0.03)),
  }));

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Active Pipeline" value={`$${(kpis.totalPipeline/1000).toFixed(0)}K`} icon={DollarSign} color="#27AE60" sub={`${kpis.activeDeals} deals`} />
        <KPICard label="Weighted Pipeline" value={`$${(kpis.weightedPipeline/1000).toFixed(0)}K`} icon={Target} color="#2980B9" />
        <KPICard label="Won Revenue (YTD)" value={`$${(kpis.wonRevenue/1000).toFixed(0)}K`} icon={TrendingUp} color="#27AE60" sub={`${wonCount} deals`} />
        <KPICard label="Active Deals" value={kpis.activeDeals} icon={Target} color="#2980B9" />
        <KPICard label="Overdue Actions" value={kpis.overdueActions} icon={AlertTriangle} color="#E74C3C" />
        <KPICard label="Agent Deals" value={kpis.agentDeals} icon={Cpu} color="#8E44AD" sub={`$${(kpis.agentValue/1000).toFixed(0)}K value`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Sales Funnel</h3>
          <div className="space-y-2">
            {funnelData.map((s: any) => {
              const maxVal = Math.max(...funnelData.map((d: any) => d.value), 1);
              const pct = (s.value / maxVal) * 100;
              return (
                <Link key={s.stage} href={`/pipeline?stage=${encodeURIComponent(s.stage)}`} className="block">
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-[11px] font-medium text-right truncate" style={{ color: 'var(--color-text-secondary)' }}>{s.stage}</div>
                    <div className="flex-1 h-8 rounded-md overflow-hidden relative" style={{ background: 'var(--color-bg)' }}>
                      <div className="h-full rounded-md flex items-center px-3 transition-all duration-500" style={{ width: `${Math.max(pct, 8)}%`, background: STAGE_COLORS[s.stage] || '#666' }}>
                        <span className="text-[10px] font-bold text-white whitespace-nowrap">{s.count} deals &middot; ${(s.value/1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(39,174,96,0.1)' }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#27AE60' }} />
              <span className="text-xs font-medium" style={{ color: '#27AE60' }}>Won: {wonCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(127,140,141,0.1)' }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#7F8C8D' }} />
              <span className="text-xs font-medium" style={{ color: '#7F8C8D' }}>Lost: {lostCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(41,128,185,0.1)' }}>
              <span className="text-xs font-medium" style={{ color: '#2980B9' }}>Win Rate: {winRate}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Team Leaderboard</h3>
            <Link href="/team" className="text-[11px] font-medium" style={{ color: '#C0392B' }}>View All</Link>
          </div>
          <div className="space-y-2">
            {leaderboard.slice(0, 8).map((u: any, i: number) => (
              <div key={u.id} className="flex items-center gap-2.5 py-1.5">
                <span className="w-5 text-center text-[11px] font-bold" style={{ color: i === 0 ? '#F39C12' : 'var(--color-text-secondary)' }}>
                  {i === 0 ? '\u{1F3C6}' : `#${i + 1}`}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: TIER_COLORS[u.tier] || '#666' }}>
                  {u.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{u.name}</div>
                  <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{u.tier} &middot; {u.activeDeals} deals</div>
                </div>
                <div className="text-xs font-mono font-semibold" style={{ color: '#27AE60' }}>${(u.weightedValue / 1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Pipeline by Service Line</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={serviceLineData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tickFormatter={(v: any) => `$${(v/1000).toFixed(0)}K`} tick={{ fill: '#8A8A95', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#8A8A95', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => `$${(v/1000).toFixed(0)}K`} contentStyle={{ background: '#141416', border: '1px solid #2A2A2F', borderRadius: 8, fontSize: 12, color: '#F5F5F5' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {serviceLineData.map((entry: any) => <Cell key={entry.name} fill={SL_COLORS[entry.name] || '#666'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Pipeline by Source Channel</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                {sourceData.map((_: any, i: number) => <Cell key={i} fill={['#3498DB','#E67E22','#27AE60','#8E44AD','#E74C3C','#F39C12','#2980B9','#1ABC9C','#9B59B6'][i % 9]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `$${(v/1000).toFixed(0)}K`} contentStyle={{ background: '#141416', border: '1px solid #2A2A2F', borderRadius: 8, fontSize: 12, color: '#F5F5F5' }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Revenue Forecast</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={forecastData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2F" />
              <XAxis dataKey="month" tick={{ fill: '#8A8A95', fontSize: 11 }} axisLine={false} />
              <YAxis tickFormatter={(v: any) => `$${(v/1000).toFixed(0)}K`} tick={{ fill: '#8A8A95', fontSize: 10 }} axisLine={false} />
              <Tooltip formatter={(v: any) => `$${(v/1000).toFixed(0)}K`} contentStyle={{ background: '#141416', border: '1px solid #2A2A2F', borderRadius: 8, fontSize: 12, color: '#F5F5F5' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="optimistic" stroke="#27AE60" strokeWidth={2} dot={false} name="Optimistic" />
              <Line type="monotone" dataKey="weighted" stroke="#2980B9" strokeWidth={2} dot={false} name="Weighted" />
              <Line type="monotone" dataKey="conservative" stroke="#E67E22" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Conservative" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Upcoming Actions</h3>
            <Link href="/pipeline" className="text-[11px] font-medium" style={{ color: '#C0392B' }}>View All</Link>
          </div>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
            {upcomingActions.map((a: any) => (
              <Link key={a.id} href={`/pipeline/${a.id}`} className="flex items-center gap-2.5 py-2 px-2 rounded-lg transition-all hover:opacity-80" style={{ background: a.isOverdue ? 'rgba(231,76,60,0.08)' : 'transparent' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.isOverdue ? '#E74C3C' : '#27AE60' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{a.name}</div>
                  <div className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)' }}>{a.nextAction}</div>
                </div>
                <div className="text-[10px] font-mono whitespace-nowrap" style={{ color: a.isOverdue ? '#E74C3C' : 'var(--color-text-secondary)' }}>
                  {new Date(a.nextActionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
