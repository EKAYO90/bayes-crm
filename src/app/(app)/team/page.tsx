'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, MessageSquarePlus, X } from 'lucide-react';
import LogConversationModal from '@/components/conversations/LogConversationModal';
import { ESCALATION_COLORS, EscalationStatus, TIER_SORT_ORDER } from '@/lib/conversations';

const TIER_COLORS: Record<string, string> = { Closer: '#E74C3C', Hunter: '#E67E22', Enabler: '#27AE60' };

function resolveEscalationColor(status?: string) {
  const normalized = (status || 'On Track') as EscalationStatus;
  return ESCALATION_COLORS[normalized] || '#27AE60';
}

export default function TeamPage() {
  const [period, setPeriod] = useState<'weekly' | 'quarterly'>('weekly');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberStats, setMemberStats] = useState<any>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  async function loadLeaderboard() {
    setLoading(true);
    const response = await fetch(`/api/conversations/stats/leaderboard?period=${period}`);
    const data = await response.json();
    const sorted = (data.leaderboard || []).sort((a: any, b: any) => {
      const tierSort = (TIER_SORT_ORDER[a.tier] ?? 99) - (TIER_SORT_ORDER[b.tier] ?? 99);
      if (tierSort !== 0) return tierSort;
      return a.rank - b.rank;
    });
    setLeaderboard(sorted);
    setLoading(false);
  }

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  useEffect(() => {
    if (!selectedMember?.userId) return;
    fetch(`/api/conversations/stats/user/${selectedMember.userId}`).then((response) => response.json()).then(setMemberStats).catch(() => setMemberStats(null));
  }, [selectedMember?.userId]);

  const summary = useMemo(() => ({
    conversations: leaderboard.reduce((sum, entry) => sum + entry.conversationCount, 0),
    target: leaderboard.reduce((sum, entry) => sum + (entry.target || 0), 0),
    newLeads: leaderboard.reduce((sum, entry) => sum + entry.newLeadsCount, 0),
  }), [leaderboard]);

  function exportCsv() {
    const headers = ['Rank', 'Name', 'Tier', 'Conversations', 'Target', 'Progress %', 'New Leads', 'Escalation Status'];
    const rows = leaderboard.map((entry) => [
      entry.rank,
      entry.name,
      entry.tier,
      entry.conversationCount,
      entry.target,
      entry.progressPct,
      entry.newLeadsCount,
      entry.escalationStatus,
    ]);
    const content = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `conversation-leaderboard-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setPeriod('weekly')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: period === 'weekly' ? '#C0392B' : 'var(--color-card)', color: period === 'weekly' ? '#fff' : 'var(--color-text-secondary)', border: `1px solid ${period === 'weekly' ? '#C0392B' : 'var(--color-border)'}` }}>Weekly</button>
        <button onClick={() => setPeriod('quarterly')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: period === 'quarterly' ? '#C0392B' : 'var(--color-card)', color: period === 'quarterly' ? '#fff' : 'var(--color-text-secondary)', border: `1px solid ${period === 'quarterly' ? '#C0392B' : 'var(--color-border)'}` }}>Quarterly</button>

        <div className="flex-1" />

        <button onClick={() => setShowLogModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(192,57,43,0.12)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.35)' }}>
          <MessageSquarePlus size={14} /> Log Conversation
        </button>

        <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--color-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard label="Team Conversations" value={summary.conversations} helper={`${period} total`} />
        <SummaryCard label="Team Target" value={summary.target} helper={`${summary.target ? Math.round((summary.conversations / summary.target) * 100) : 0}% attainment`} />
        <SummaryCard label="New Leads" value={summary.newLeads} helper={`${period} generated`} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        {loading ? (
          <div className="p-6 text-xs text-center animate-pulse-slow" style={{ color: 'var(--color-text-secondary)' }}>Loading leaderboard...</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-3 py-2 text-left" style={{ color: 'var(--color-text-secondary)' }}>Rank</th>
                <th className="px-3 py-2 text-left" style={{ color: 'var(--color-text-secondary)' }}>Name</th>
                <th className="px-3 py-2 text-left" style={{ color: 'var(--color-text-secondary)' }}>Tier</th>
                <th className="px-3 py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>Conversations</th>
                <th className="px-3 py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>Target</th>
                <th className="px-3 py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>Progress</th>
                <th className="px-3 py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>New Leads</th>
                <th className="px-3 py-2 text-left" style={{ color: 'var(--color-text-secondary)' }}>Escalation</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.userId} className="cursor-pointer" onClick={() => setSelectedMember(entry)} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-3 py-2 font-semibold" style={{ color: entry.rank === 1 ? '#F39C12' : 'var(--color-text-secondary)' }}>{entry.rank === 1 ? '🏆' : `#${entry.rank}`}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: TIER_COLORS[entry.tier] || '#666' }}>
                        {entry.name.split(' ').map((value: string) => value[0]).join('')}
                      </div>
                      <span style={{ color: 'var(--color-text-primary)' }}>{entry.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] text-white" style={{ background: TIER_COLORS[entry.tier] || '#666' }}>{entry.tier}</span></td>
                  <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-text-primary)' }}>{entry.conversationCount}</td>
                  <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-text-secondary)' }}>{entry.target}</td>
                  <td className="px-3 py-2 text-right font-mono" style={{ color: entry.progressPct >= 100 ? '#27AE60' : '#E67E22' }}>{entry.progressPct}%</td>
                  <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-text-primary)' }}>{entry.newLeadsCount}</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] text-white" style={{ background: resolveEscalationColor(entry.escalationStatus) }}>{entry.escalationStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setSelectedMember(null)} />
          <div className="relative w-full max-w-md h-full overflow-y-auto p-4 animate-slideIn" style={{ background: 'var(--color-card)', borderLeft: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedMember.name}</h3>
              <button onClick={() => setSelectedMember(null)} className="p-1.5 rounded-md" style={{ color: 'var(--color-text-secondary)' }}><X size={15} /></button>
            </div>

            {memberStats ? (
              <>
                <div className="space-y-2 text-xs">
                  <DetailRow label="Weekly" value={`${memberStats.weekly?.conversationCount || 0}/${memberStats.weekly?.weeklyTarget || 0} (${memberStats.weekly?.progressPct || 0}%)`} />
                  <DetailRow label="Quarterly" value={`${memberStats.quarterly?.conversationCount || 0}/${memberStats.quarterly?.quarterlyTarget || 0} (${memberStats.quarterly?.progressPct || 0}%)`} />
                  <DetailRow label="Escalation" value={memberStats.quarterly?.escalationStatus || '—'} badgeColor={resolveEscalationColor(memberStats.quarterly?.escalationStatus)} />
                </div>

                <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Recent Conversations</h4>
                  <div className="space-y-2">
                    {(memberStats.recentConversations || []).slice(0, 10).map((conversation: any) => (
                      <div key={conversation.id} className="rounded-lg p-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <div className="text-[11px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{conversation.conversationType}</div>
                        <div className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{conversation.summary}</div>
                        <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {new Date(conversation.conversationDate).toLocaleDateString()} {conversation.organization?.name ? `· ${conversation.organization.name}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Loading member details...</div>
            )}
          </div>
        </div>
      )}

      <LogConversationModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} onSuccess={loadLeaderboard} />
    </div>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
      <div className="text-xl mt-1 font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
      <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>{helper}</div>
    </div>
  );
}

function DetailRow({ label, value, badgeColor }: { label: string; value: string; badgeColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      {badgeColor ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] text-white" style={{ background: badgeColor }}>{value}</span>
      ) : (
        <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
      )}
    </div>
  );
}
