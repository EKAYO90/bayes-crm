'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthToast from '@/components/auth/AuthToast';

type ProfileRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  tier: string;
  department: string;
  title: string;
  targetsAssigned: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  createdAt: string;
};

const ROLES = ['admin', 'manager', 'team_member', 'viewer'];
const TIERS = ['Closer', 'Hunter', 'Enabler'];
const DEPARTMENTS = ['Leadership', 'Advisory', 'Tech'];

export default function SettingsUsersPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<ProfileRow[]>([]);
  const [active, setActive] = useState<ProfileRow[]>([]);
  const [rejected, setRejected] = useState<ProfileRow[]>([]);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    role: 'team_member',
    tier: 'Enabler',
    department: 'Tech',
    title: '',
    targetsAssigned: '',
  });

  const [editTarget, setEditTarget] = useState<ProfileRow | null>(null);
  const canView = useMemo(() => me?.role === 'admin', [me]);

  async function load() {
    setLoading(true);
    const meRes = await fetch('/api/auth/me');
    const meData = await meRes.json();
    setMe(meData.user);

    if (!meData.user || meData.user.role !== 'admin') {
      setLoading(false);
      return;
    }

    const res = await fetch('/api/admin/users');
    if (!res.ok) {
      setToast({ message: 'Failed to load users.', tone: 'error' });
      setLoading(false);
      return;
    }

    const data = await res.json();
    setPending(data.pending || []);
    setActive(data.active || []);
    setRejected(data.rejected || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(profileId: string) {
    const res = await fetch(`/api/admin/users/${profileId}/approve`, { method: 'POST' });
    if (!res.ok) return setToast({ message: 'Could not approve user.', tone: 'error' });
    setToast({ message: 'User approved.', tone: 'success' });
    await load();
  }

  async function reject(profileId: string) {
    const note = window.prompt('Reason for rejection (optional)') || '';
    const res = await fetch(`/api/admin/users/${profileId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalNotes: note }),
    });
    if (!res.ok) return setToast({ message: 'Could not reject user.', tone: 'error' });
    setToast({ message: 'User rejected and disabled.', tone: 'success' });
    await load();
  }

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inviteForm),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return setToast({ message: body?.error || 'Could not send invite.', tone: 'error' });
    }

    setToast({ message: 'Invite sent successfully.', tone: 'success' });
    setInviteOpen(false);
    setInviteForm({ fullName: '', email: '', role: 'team_member', tier: 'Enabler', department: 'Tech', title: '', targetsAssigned: '' });
    await load();
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;

    const res = await fetch(`/api/admin/users/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTarget),
    });

    if (!res.ok) return setToast({ message: 'Failed to update user.', tone: 'error' });

    setToast({ message: 'User updated.', tone: 'success' });
    setEditTarget(null);
    await load();
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading users...</div>;

  if (!canView) {
    return (
      <div className="rounded-xl p-6" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Access denied</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Only admins can access user management.</p>
        <button type="button" onClick={() => router.push('/settings')} className="mt-4 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-brand-primary)', color: 'white' }}>Back to settings</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <AuthToast message={toast.message} tone={toast.tone} />}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>User Management</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Review pending accounts, manage active users, and send invitations.</p>
        </div>
        <button type="button" onClick={() => setInviteOpen(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--color-brand-primary)' }}>Invite User</button>
      </div>

      <section className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Pending Approvals ({pending.length})</h2>
        {pending.length === 0 ? <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>No pending approvals.</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['Name', 'Email', 'Tier', 'Department', 'Requested On', 'Actions'].map((h) => <th key={h} className="text-left px-2 py-2" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
              <tbody>{pending.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-2 py-2" style={{ color: 'var(--color-text-primary)' }}>{row.fullName}</td>
                  <td className="px-2 py-2" style={{ color: 'var(--color-text-secondary)' }}>{row.email}</td>
                  <td className="px-2 py-2" style={{ color: 'var(--color-text-secondary)' }}>{row.tier}</td>
                  <td className="px-2 py-2" style={{ color: 'var(--color-text-secondary)' }}>{row.department}</td>
                  <td className="px-2 py-2" style={{ color: 'var(--color-text-secondary)' }}>{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-2 py-2 flex gap-2">
                    <button type="button" onClick={() => approve(row.id)} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(39,174,96,0.2)', color: '#27AE60' }}>Approve</button>
                    <button type="button" onClick={() => reject(row.id)} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(231,76,60,0.2)', color: '#E74C3C' }}>Reject</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Active Users ({active.length})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[740px] text-sm">
            <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['Name', 'Email', 'Role', 'Tier', 'Department', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-2 py-2" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
            <tbody>{active.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="px-2 py-2" style={{ color: 'var(--color-text-primary)' }}>{row.fullName}</td>
                <td className="px-2 py-2" style={{ color: 'var(--color-text-secondary)' }}>{row.email}</td>
                <td className="px-2 py-2 capitalize" style={{ color: 'var(--color-text-secondary)' }}>{row.role.replace('_', ' ')}</td>
                <td className="px-2 py-2" style={{ color: 'var(--color-text-secondary)' }}>{row.tier}</td>
                <td className="px-2 py-2" style={{ color: 'var(--color-text-secondary)' }}>{row.department}</td>
                <td className="px-2 py-2" style={{ color: row.isActive ? '#27AE60' : '#E74C3C' }}>{row.isActive ? 'Active' : 'Disabled'}</td>
                <td className="px-2 py-2"><button type="button" onClick={() => setEditTarget({ ...row })} className="px-2 py-1 rounded text-xs" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>Edit</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Rejected Users ({rejected.length})</h2>
        {rejected.length === 0 ? <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>No rejected users.</p> : <ul className="mt-2 space-y-2">{rejected.map((row) => <li key={row.id} className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.fullName} ({row.email})</li>)}</ul>}
      </section>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={submitInvite} className="w-full max-w-xl rounded-xl p-5 space-y-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Invite user</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Full name" required value={inviteForm.fullName} onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <input placeholder="Email" type="email" required value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <select value={inviteForm.role} onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              <select value={inviteForm.tier} onChange={(e) => setInviteForm((f) => ({ ...f, tier: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>{TIERS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              <select value={inviteForm.department} onChange={(e) => setInviteForm((f) => ({ ...f, department: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>{DEPARTMENTS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              <input placeholder="Title" value={inviteForm.title} onChange={(e) => setInviteForm((f) => ({ ...f, title: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <input placeholder="Targets assigned" value={inviteForm.targetsAssigned} onChange={(e) => setInviteForm((f) => ({ ...f, targetsAssigned: e.target.value }))} className="px-3 py-2 rounded-lg text-sm sm:col-span-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setInviteOpen(false)} className="px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>Cancel</button>
              <button type="submit" className="px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--color-brand-primary)' }}>Send invite</button>
            </div>
          </form>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={saveEdit} className="w-full max-w-xl rounded-xl p-5 space-y-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Edit user</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={editTarget.fullName} disabled className="px-3 py-2 rounded-lg text-sm opacity-70" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <input value={editTarget.email} disabled className="px-3 py-2 rounded-lg text-sm opacity-70" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <select value={editTarget.role} onChange={(e) => setEditTarget((f) => (f ? { ...f, role: e.target.value } : f))} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              <select value={editTarget.tier} onChange={(e) => setEditTarget((f) => (f ? { ...f, tier: e.target.value } : f))} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>{TIERS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              <select value={editTarget.department} onChange={(e) => setEditTarget((f) => (f ? { ...f, department: e.target.value } : f))} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>{DEPARTMENTS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              <input value={editTarget.title} onChange={(e) => setEditTarget((f) => (f ? { ...f, title: e.target.value } : f))} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <input value={editTarget.targetsAssigned} onChange={(e) => setEditTarget((f) => (f ? { ...f, targetsAssigned: e.target.value } : f))} className="px-3 py-2 rounded-lg text-sm sm:col-span-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <label className="sm:col-span-2 text-sm flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><input type="checkbox" checked={editTarget.isActive} onChange={(e) => setEditTarget((f) => (f ? { ...f, isActive: e.target.checked } : f))} />Account active</label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditTarget(null)} className="px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>Cancel</button>
              <button type="submit" className="px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--color-brand-primary)' }}>Save changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
