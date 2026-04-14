'use client';

import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, DollarSign, Target, AlertTriangle, Cpu, MessageSquare, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid } from 'recharts';
import Link from 'next/link';
import { getHeatmapColor } from '@/lib/conversations';

const SL_COLORS: Record<string, string> = { 'Clean Energy Transition': '#E67E22', 'Climate Risk & Adaptation': '#27AE60', 'Investment & Transaction': '#2980B9', 'Data & Digital': '#8E44AD', 'Programme Design': '#E74C3C' };
const STAGE_COLORS: Record<string, string> = { 'Lead Identified': '#3498DB', 'Initial Contact': '#2980B9', 'Discovery Meeting': '#8E44AD', 'Proposal Development': '#E67E22', 'Proposal Submitted': '#F39C12', 'Negotiation': '#E74C3C' };
const TIER_COLORS: Record<string, string> = { Closer: '#E74C3C', Hunter: '#E67E22', Enabler: '#27AE60' };

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

  useEffect(() => {
    fetch('/api/stats/dashboard').then((response) => response.json()).then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-sm animate-pulse-slow" style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard...</div>;

  const { kpis, funnelData, serviceLineData, sourceData, leaderboard, upcomingActions, wonCount, lostCount, conversationTracker, conversationHeatmap } = data;
  const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const forecastData = months.map((month, index) => ({
    month,
    optimistic: Math.round(kpis.totalPipeline * (0.15 + index * 0.05)),
    weighted: Math.round(kpis.weightedPipeline * (0.2 + index * 0.05)),
    conservative: Math.round(kpis.weightedPipeline * (0.1 + index * 0.03)),
  }));

  const teamConversationSummary = useMemo(() => ({
    achieved: conversationTracker.reduce((sum: number, member: any) => sum + member.weeklyConversationCount, 0),
    target: conversationTracker.reduce((sum: number, member: any) => sum + member.weeklyTarget, 0),
  }), [conversationTracker]);

  return (
    <div className="space-y-6 max-w-[1450px]">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPICard label="Active Pipeline" value={`$${(kpis.totalPipeline / 1000).toFixed(0)}K`} icon={DollarSign} color="#27AE60" sub={`${kpis.activeDeals} deals`} />
        <KPICard label="Weighted" value={`$${(kpis.weightedPipeline / 1000).toFixed(0)}K`} icon={Target} color="#2980B9" />
        <KPICard label="Won YTD" value={`$${(kpis.wonRevenue / 1000).toFixed(0)}K`} icon={TrendingUp} color="#27AE60" sub={`${wonCount} deals`} />
        <KPICard label="Overdue" value={kpis.overdueActions} icon={AlertTriangle} color="#E74C3C" />
        <KPICard label="Agent Deals" value={kpis.agentDeals} icon={Cpu} color="#8E44AD" sub={`$${(kpis.agentValue / 1000).toFixed(0)}K`} />
        <KPICard label="Convos This Week" value={kpis.conversationsThisWeek} icon={MessageSquare} color="#C0392B" sub={`Target ${teamConversationSummary.target}`} />
        <KPICard label="New Leads" value={kpis.newLeadsThisWeek} icon={UserPlus} color="#27AE60" sub="This week" />
        <KPICard label="Win Rate" value={`${winRate}%`} icon={TrendingUp} color="#F39C12" sub={`${wonCount} won / ${lostCount} lost`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Sales Funnel</h3>
          <div className="space-y-2">
            {funnelData.map((stage: any) => {
              const maxValue = Math.max(...funnelData.map((entry: any) => entry.value), 1);
              const pct = (stage.value / maxValue) * 100;
              return (
                <Link key={stage.stage} href={`/pipeline?stage=${encodeURIComponent(stage.stage)}`} className="block">
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-[11px] font-medium text-right truncate" style={{ color: 'var(--color-text-secondary)' }}>{stage.stage}</div>
                    <div className="flex-1 h-8 rounded-md overflow-hidden" style={{ background: 'var(--color-bg)' }}>
                      <div className="h-full rounded-md flex items-center px-3 transition-all duration-500" style={{ width: `${Math.max(pct, 8)}%`, background: STAGE_COLORS[stage.stage] || '#666' }}>
                        <span className="text-[10px] font-bold text-white whitespace-nowrap">{stage.count} · ${(stage.value / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Conversation Tracker</h3>
          <div className="text-[11px] mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Team progress: {teamConversationSummary.achieved}/{teamConversationSummary.target} this week
          </div>
          <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
            {conversationTracker.map((member: any) => (
              <div key={member.userId}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span style={{ color: 'var(--color-text-primary)' }}>{member.name}</span>
                  <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{member.weeklyConversationCount}/{member.weeklyTarget}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--color-bg)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, member.weeklyProgressPct)}%`, background: TIER_COLORS[member.tier] || '#666' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Weekly Heatmap (13 Weeks × 13 Team Members)</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid" style={{ gridTemplateColumns: '180px repeat(13, minmax(48px, 1fr))', gap: 4 }}>
              <div />
              {conversationHeatmap.weeks.map((weekIso: string) => (
                <div key={weekIso} className="text-[10px] text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(weekIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ))}

              {conversationHeatmap.rows
                .sort((a: any, b: any) => (a.tier === b.tier ? a.name.localeCompare(b.name) : (a.tier === 'Closer' ? -1 : a.tier === 'Hunter' && b.tier === 'Enabler' ? -1 : 1)))
                .map((row: any) => (
                  <div key={row.userId} className="contents">
                    <div className="text-[11px] font-medium pr-2 flex items-center" style={{ color: 'var(--color-text-primary)' }}>
                      {row.name}
                    </div>
                    {row.cells.map((cell: any) => (
                      <div
                        key={`${row.userId}-${cell.weekStart}`}
                        className="h-7 rounded-sm"
                        title={`${row.name}\nWeek of ${new Date(cell.weekStart).toLocaleDateString()}\n${cell.count}/${cell.weeklyTarget} conversations (${cell.progressPct}%)`}
                        style={{ background: getHeatmapColor(cell.progressPct), border: '1px solid rgba(255,255,255,0.04)' }}
                      />
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Pipeline by Service Line</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={serviceLineData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tickFormatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} tick={{ fill: '#8A8A95', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#8A8A95', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} contentStyle={{ background: '#141416', border: '1px solid #2A2A2F', borderRadius: 8, fontSize: 12, color: '#F5F5F5' }} />
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
                {sourceData.map((_: any, index: number) => <Cell key={index} fill={['#3498DB', '#E67E22', '#27AE60', '#8E44AD', '#E74C3C', '#F39C12', '#2980B9', '#1ABC9C', '#9B59B6'][index % 9]} />)}
              </Pie>
              <Tooltip formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} contentStyle={{ background: '#141416', border: '1px solid #2A2A2F', borderRadius: 8, fontSize: 12, color: '#F5F5F5' }} />
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
              <YAxis tickFormatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} tick={{ fill: '#8A8A95', fontSize: 10 }} axisLine={false} />
              <Tooltip formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} contentStyle={{ background: '#141416', border: '1px solid #2A2A2F', borderRadius: 8, fontSize: 12, color: '#F5F5F5' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="optimistic" stroke="#27AE60" strokeWidth={2} dot={false} name="Optimistic" />
              <Line type="monotone" dataKey="weighted" stroke="#2980B9" strokeWidth={2} dot={false} name="Weighted" />
              <Line type="monotone" dataKey="conservative" stroke="#E67E22" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Conservative" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Upcoming Actions & Alerts</h3>
            <Link href="/pipeline" className="text-[11px] font-medium" style={{ color: '#C0392B' }}>View Pipeline</Link>
          </div>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
            {upcomingActions.map((action: any) => (
              <Link key={action.id} href={action.link || '/dashboard'} className="flex items-center gap-2.5 py-2 px-2 rounded-lg" style={{ background: action.isOverdue ? 'rgba(231,76,60,0.08)' : 'transparent' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: action.type === 'zero_conversation_alert' ? '#E74C3C' : action.type === 'conversation_follow_up' ? '#E67E22' : action.isOverdue ? '#E74C3C' : '#27AE60' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{action.name}</div>
                  <div className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)' }}>{action.nextAction}</div>
                </div>
                <div className="text-[10px] font-mono whitespace-nowrap" style={{ color: action.isOverdue ? '#E74C3C' : 'var(--color-text-secondary)' }}>
                  {action.nextActionDate ? new Date(action.nextActionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
