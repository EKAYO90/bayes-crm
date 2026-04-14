'use client';

import { useEffect, useMemo, useState } from 'react';
import { CONVERSATION_TYPES } from '@/lib/conversations';
import { X, AlertTriangle, Sparkles } from 'lucide-react';

type FormState = {
  userId: string;
  conversationDate: string;
  conversationType: string;
  organizationId: string;
  opportunityId: string;
  counterpartyName: string;
  counterpartyRole: string;
  counterpartyEmail: string;
  summary: string;
  outcome: string;
  nextStep: string;
  isNewLead: boolean;
  followUpRequired: boolean;
  followUpDate: string;
};

interface LogConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultOrganizationId?: string;
  defaultOpportunityId?: string;
  defaultUserId?: string;
}

const initialForm = (defaults?: Partial<FormState>): FormState => ({
  userId: defaults?.userId || '',
  conversationDate: defaults?.conversationDate || new Date().toISOString().slice(0, 10),
  conversationType: defaults?.conversationType || '',
  organizationId: defaults?.organizationId || '',
  opportunityId: defaults?.opportunityId || '',
  counterpartyName: defaults?.counterpartyName || '',
  counterpartyRole: defaults?.counterpartyRole || '',
  counterpartyEmail: defaults?.counterpartyEmail || '',
  summary: defaults?.summary || '',
  outcome: defaults?.outcome || '',
  nextStep: defaults?.nextStep || '',
  isNewLead: defaults?.isNewLead || false,
  followUpRequired: defaults?.followUpRequired || false,
  followUpDate: defaults?.followUpDate || '',
});

export default function LogConversationModal({
  isOpen,
  onClose,
  onSuccess,
  defaultOrganizationId,
  defaultOpportunityId,
  defaultUserId,
}: LogConversationModalProps) {
  const [form, setForm] = useState<FormState>(initialForm());
  const [orgs, setOrgs] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [duplicateHint, setDuplicateHint] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const defaults = initialForm({
      organizationId: defaultOrganizationId,
      opportunityId: defaultOpportunityId,
      userId: defaultUserId,
    });
    setForm(defaults);
    setError('');
    setDuplicateHint(false);

    Promise.all([
      fetch('/api/organizations').then((response) => response.json()),
      fetch('/api/opportunities').then((response) => response.json()),
      fetch('/api/auth/me').then((response) => response.json()),
      fetch('/api/users').then((response) => response.json()).catch(() => []),
    ]).then(([organizationsData, opportunitiesData, meData, usersData]) => {
      setOrgs(organizationsData.organizations || []);
      setOpps(opportunitiesData.opportunities || []);
      setCurrentUser(meData.user || null);
      const usersArray = Array.isArray(usersData) ? usersData : usersData.users || [];
      setUsers(usersArray);
      if (!defaultUserId && meData.user?.id) {
        setForm((current) => ({ ...current, userId: meData.user.id }));
      }
    });
  }, [isOpen, defaultOrganizationId, defaultOpportunityId, defaultUserId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const canChooseUser = useMemo(() => currentUser?.role === 'admin' || currentUser?.role === 'manager', [currentUser]);

  useEffect(() => {
    if (!isOpen || !form.userId || !form.conversationType) return;

    const timeout = window.setTimeout(async () => {
      const params = new URLSearchParams({
        userId: form.userId,
        startDate: form.conversationDate,
        endDate: form.conversationDate,
        conversationType: form.conversationType,
      });
      if (form.organizationId) params.set('organizationId', form.organizationId);
      const response = await fetch(`/api/conversations?${params.toString()}`);
      if (!response.ok) return;
      const data = await response.json();
      setDuplicateHint((data.conversations || []).length > 0);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [isOpen, form.userId, form.conversationDate, form.conversationType, form.organizationId]);

  if (!isOpen) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const selectedDate = new Date(form.conversationDate);
    const now = new Date();
    const minDate = new Date();
    minDate.setDate(now.getDate() - 7);
    minDate.setHours(0, 0, 0, 0);

    if (selectedDate < minDate || selectedDate > now) {
      setError('Conversation date must be within the last 7 days.');
      return;
    }

    if (form.summary.trim().length < 50) {
      setError('Description must be at least 50 characters.');
      return;
    }

    if (form.followUpRequired && !form.followUpDate) {
      setError('Follow-up date is required when follow-up is enabled.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Failed to log conversation.');
        setLoading(false);
        return;
      }

      setToast({
        type: payload.duplicateWarning ? 'warning' : 'success',
        message: payload.duplicateWarning
          ? 'Conversation logged (duplicate warning detected).'
          : 'Conversation logged successfully! Great momentum this week.',
      });

      if (!payload.duplicateWarning) {
        setShowCelebration(true);
        window.setTimeout(() => setShowCelebration(false), 900);
      }

      onSuccess?.();
      onClose();
    } catch (submitError) {
      console.error('Failed to log conversation', submitError);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Log conversation">
        <button className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose} aria-label="Close modal" />
        <form onSubmit={submit} className="relative w-full max-w-3xl rounded-2xl p-5 max-h-[90vh] overflow-y-auto animate-fadeIn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Log External Conversation</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Capture calls, meetings, emails, and other client-facing conversations.
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-md" style={{ color: 'var(--color-text-secondary)' }}>
              <X size={16} />
            </button>
          </div>

          {error && (
            <div className="mb-3 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(231,76,60,0.12)', color: '#E74C3C' }}>
              {error}
            </div>
          )}

          {duplicateHint && (
            <div className="mb-3 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ background: 'rgba(243,156,18,0.13)', color: '#F39C12' }}>
              <AlertTriangle size={12} /> Similar conversation already exists for this date/type.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {canChooseUser && (
              <select
                value={form.userId}
                onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
                required
                className="px-3 py-2 rounded-lg text-xs"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option value="">Select team member</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            )}
            <input
              type="date"
              value={form.conversationDate}
              onChange={(event) => setForm((current) => ({ ...current, conversationDate: event.target.value }))}
              required
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <select
              value={form.conversationType}
              onChange={(event) => setForm((current) => ({ ...current, conversationType: event.target.value }))}
              required
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <option value="">Conversation type *</option>
              {CONVERSATION_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <select
              value={form.organizationId}
              onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value }))}
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <option value="">Organization (optional)</option>
              {orgs.map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </select>
            <select
              value={form.opportunityId}
              onChange={(event) => setForm((current) => ({ ...current, opportunityId: event.target.value }))}
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <option value="">Opportunity (optional)</option>
              {opps.map((opportunity) => (
                <option key={opportunity.id} value={opportunity.id}>{opportunity.name}</option>
              ))}
            </select>
            <input
              value={form.counterpartyName}
              onChange={(event) => setForm((current) => ({ ...current, counterpartyName: event.target.value }))}
              placeholder="Counterparty name"
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <input
              value={form.counterpartyRole}
              onChange={(event) => setForm((current) => ({ ...current, counterpartyRole: event.target.value }))}
              placeholder="Counterparty role"
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <input
              type="email"
              value={form.counterpartyEmail}
              onChange={(event) => setForm((current) => ({ ...current, counterpartyEmail: event.target.value }))}
              placeholder="Counterparty email"
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />

            <div className="md:col-span-2">
              <textarea
                rows={4}
                value={form.summary}
                onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                placeholder="Conversation summary (minimum 50 characters)"
                className="w-full px-3 py-2 rounded-lg text-xs resize-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                required
              />
              <div className="text-[10px] mt-1" style={{ color: form.summary.trim().length >= 50 ? '#27AE60' : 'var(--color-text-secondary)' }}>
                {form.summary.trim().length}/50 minimum characters
              </div>
            </div>

            <input
              value={form.outcome}
              onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value }))}
              placeholder="Outcome"
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <input
              value={form.nextStep}
              onChange={(event) => setForm((current) => ({ ...current, nextStep: event.target.value }))}
              placeholder="Next step"
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />

            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <input
                type="checkbox"
                checked={form.isNewLead}
                onChange={(event) => setForm((current) => ({ ...current, isNewLead: event.target.checked }))}
              />
              This conversation generated a new lead
            </label>

            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.followUpRequired}
                  onChange={(event) => setForm((current) => ({ ...current, followUpRequired: event.target.checked }))}
                />
                Follow-up required
              </label>
              {form.followUpRequired && (
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(event) => setForm((current) => ({ ...current, followUpDate: event.target.value }))}
                  className="px-2 py-1 rounded text-xs"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#C0392B', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Logging...' : 'Log Conversation'}
            </button>
          </div>
        </form>
      </div>

      {showCelebration && (
        <div className="fixed top-6 right-6 z-[80] flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white animate-fadeIn" style={{ background: '#27AE60' }}>
          <Sparkles size={14} /> Weekly progress boosted!
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[80] px-3 py-2 rounded-lg text-xs font-semibold animate-fadeIn" style={{
          background: toast.type === 'success' ? 'rgba(39,174,96,0.95)' : 'rgba(243,156,18,0.95)',
          color: '#FFF',
        }}>
          {toast.message}
        </div>
      )}
    </>
  );
}
