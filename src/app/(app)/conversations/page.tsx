'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Filter, Pencil, Trash2 } from 'lucide-react';
import LogConversationModal from '@/components/conversations/LogConversationModal';
import { CONVERSATION_TYPES, ESCALATION_COLORS, EscalationStatus } from '@/lib/conversations';

function resolveEscalationColor(status?: string) {
  const normalized = (status || 'On Track') as EscalationStatus;
  return ESCALATION_COLORS[normalized] || '#27AE60';
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingConversation, setEditingConversation] = useState<any>(null);
  const [sidebarStats, setSidebarStats] = useState<any>(null);
  const [myUser, setMyUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    conversationType: '',
    organizationId: '',
    newLeadsOnly: false,
    search: '',
  });

  async function fetchConversations() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.conversationType) params.set('conversationType', filters.conversationType);
    if (filters.organizationId) params.set('organizationId', filters.organizationId);
    if (filters.newLeadsOnly) params.set('newLeadsOnly', 'true');
    if (filters.search) params.set('search', filters.search);

    const response = await fetch(`/api/conversations?${params.toString()}`);
    const data = await response.json();
    setConversations(data.conversations || []);
    setLoading(false);
  }

  useEffect(() => {
    fetch('/api/auth/me').then((response) => response.json()).then((data) => setMyUser(data.user));
    fetch('/api/organizations').then((response) => response.json()).then((data) => setOrgs(data.organizations || []));
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [filters.startDate, filters.endDate, filters.conversationType, filters.organizationId, filters.newLeadsOnly, filters.search]);

  useEffect(() => {
    if (!myUser?.id) return;
    fetch(`/api/conversations/stats/user/${myUser.id}`).then((response) => response.json()).then(setSidebarStats).catch(() => setSidebarStats(null));
  }, [myUser?.id, conversations.length]);

  const quickTotals = useMemo(() => ({
    total: conversations.length,
    newLeads: conversations.filter((conversation) => conversation.isNewLead).length,
    followUps: conversations.filter((conversation) => conversation.followUpRequired).length,
  }), [conversations]);

  async function softDelete(conversationId: string) {
    if (!window.confirm('Soft delete this conversation? It can still be audited.')) return;

    const response = await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' });
    if (!response.ok) {
      window.alert('Failed to delete conversation.');
      return;
    }

    fetchConversations();
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/conversations/${editingConversation.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingConversation),
    });

    if (!response.ok) {
      const payload = await response.json();
      window.alert(payload.error || 'Failed to update conversation');
      return;
    }

    setEditingConversation(null);
    fetchConversations();
  }

  return (
    <div className="space-y-4 max-w-[1300px]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <Filter size={13} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search summaries, outcomes, contacts"
            className="w-60 bg-transparent outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        <input type="date" value={filters.startDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} className="px-2.5 py-2 rounded-lg text-xs" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
        <input type="date" value={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} className="px-2.5 py-2 rounded-lg text-xs" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />

        <select value={filters.conversationType} onChange={(event) => setFilters((current) => ({ ...current, conversationType: event.target.value }))} className="px-2.5 py-2 rounded-lg text-xs" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
          <option value="">All types</option>
          {CONVERSATION_TYPES.map((type) => <option key={type}>{type}</option>)}
        </select>

        <select value={filters.organizationId} onChange={(event) => setFilters((current) => ({ ...current, organizationId: event.target.value }))} className="px-2.5 py-2 rounded-lg text-xs" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
          <option value="">All organizations</option>
          {orgs.map((organization: any) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
        </select>

        <label className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={filters.newLeadsOnly} onChange={(event) => setFilters((current) => ({ ...current, newLeadsOnly: event.target.checked }))} />
          New leads only
        </label>

        <div className="flex-1" />

        <button onClick={() => setShowLogModal(true)} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>
          Log Conversation
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-xl p-6 text-center text-xs animate-pulse-slow" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-xl p-6 text-center text-xs" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
              No conversations match these filters.
            </div>
          ) : conversations.map((conversation) => (
            <div key={conversation.id} className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: '#C0392B' }}>
                  {conversation.user?.name?.split(' ').map((value: string) => value[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{conversation.user?.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>{conversation.conversationType}</span>
                    {conversation.isNewLead && <span className="px-2 py-0.5 rounded-full text-[10px] text-white" style={{ background: '#27AE60' }}>New Lead</span>}
                    {conversation.isDuplicate && <span className="px-2 py-0.5 rounded-full text-[10px] text-white" style={{ background: '#F39C12' }}>Duplicate Warning</span>}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{conversation.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="inline-flex items-center gap-1"><Calendar size={10} /> {new Date(conversation.conversationDate).toLocaleDateString()}</span>
                    {conversation.organization?.name && <span>{conversation.organization.name}</span>}
                    {conversation.counterpartyName && <span>{conversation.counterpartyName}</span>}
                    {conversation.followUpRequired && <span style={{ color: '#E67E22' }}>Follow-up due {conversation.followUpDate ? new Date(conversation.followUpDate).toLocaleDateString() : '—'}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditingConversation({ ...conversation, conversationDate: new Date(conversation.conversationDate).toISOString().slice(0, 10), followUpDate: conversation.followUpDate ? new Date(conversation.followUpDate).toISOString().slice(0, 10) : '' })} className="p-1.5 rounded-md" style={{ color: 'var(--color-text-secondary)' }}><Pencil size={13} /></button>
                  <button onClick={() => softDelete(conversation.id)} className="p-1.5 rounded-md" style={{ color: '#E74C3C' }}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-xl p-4 h-fit" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>My Conversation Stats</h3>
          <div className="space-y-2 text-xs">
            <StatRow label="Visible Conversations" value={quickTotals.total} />
            <StatRow label="New Leads" value={quickTotals.newLeads} />
            <StatRow label="Follow-ups" value={quickTotals.followUps} />
          </div>

          {sidebarStats?.weekly && (
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="text-[11px] font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Weekly Progress</div>
              <div className="text-xs font-mono" style={{ color: '#27AE60' }}>
                {sidebarStats.weekly.conversationCount}/{sidebarStats.weekly.weeklyTarget} ({sidebarStats.weekly.progressPct}%)
              </div>
              <div className="w-full h-2 rounded-full mt-2" style={{ background: 'var(--color-bg)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, sidebarStats.weekly.progressPct)}%`, background: '#27AE60' }} />
              </div>
            </div>
          )}

          {sidebarStats?.quarterly && (
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="text-[11px] font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Quarterly Progress</div>
              <div className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                {sidebarStats.quarterly.conversationCount}/{sidebarStats.quarterly.quarterlyTarget} ({sidebarStats.quarterly.progressPct}%)
              </div>
              <div className="mt-2 inline-flex px-2 py-1 rounded-full text-[10px] text-white" style={{ background: resolveEscalationColor(sidebarStats.quarterly.escalationStatus) }}>
                {sidebarStats.quarterly.escalationStatus}
              </div>
            </div>
          )}
        </aside>
      </div>

      <LogConversationModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} onSuccess={fetchConversations} />

      {editingConversation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={() => setEditingConversation(null)} />
          <form onSubmit={saveEdit} className="relative w-full max-w-xl rounded-xl p-4 space-y-3" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Edit Conversation</h4>
            <input type="date" value={editingConversation.conversationDate} onChange={(event) => setEditingConversation((current: any) => ({ ...current, conversationDate: event.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            <select value={editingConversation.conversationType} onChange={(event) => setEditingConversation((current: any) => ({ ...current, conversationType: event.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
              {CONVERSATION_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
            <textarea rows={4} value={editingConversation.summary} onChange={(event) => setEditingConversation((current: any) => ({ ...current, summary: event.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" checked={editingConversation.isNewLead} onChange={(event) => setEditingConversation((current: any) => ({ ...current, isNewLead: event.target.checked }))} />
              New lead
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingConversation(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
              <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className="font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}
