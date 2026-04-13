'use client';
import { useState, useEffect } from 'react';
import { Gift, Plus, Check, X, DollarSign } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  referral_bonus: 'Referral Bonus',
  proposal_contribution: 'Proposal Contribution',
  demo_conversion: 'Demo Conversion',
  quarterly_mvp: 'Quarterly MVP',
  video_bonus: 'Video Bonus',
};

const TYPE_AMOUNTS: Record<string, string> = {
  referral_bonus: '2% of Year 1',
  proposal_contribution: 'KES 10,000',
  demo_conversion: 'KES 15,000',
  quarterly_mvp: 'KES 25,000',
  video_bonus: 'KES 5,000',
};

export default function IncentivesPage() {
  const [incentives, setIncentives] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ userId: '', type: '', amount: '', notes: '', oppId: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/incentives').then(r => r.json()).then(d => setIncentives(d.incentives || []));
    fetch('/api/organizations').then(r => r.json()).then(d => {
      const owners = (d.organizations || []).map((o: any) => o.relationshipOwner);
      setUsers(Array.from(new Map(owners.map((u: any) => [u.id, u])).values()));
    });
    fetch('/api/opportunities').then(r => r.json()).then(d => setOpps(d.opportunities || []));
    fetch('/api/auth/me').then(r => r.json()).then(d => setCurrentUser(d.user));
  }, []);

  async function createIncentive(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/incentives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowNew(false);
    fetch('/api/incentives').then(r => r.json()).then(d => setIncentives(d.incentives || []));
  }

  async function approveIncentive(id: string, approved: boolean) {
    await fetch(`/api/incentives/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approved }) });
    fetch('/api/incentives').then(r => r.json()).then(d => setIncentives(d.incentives || []));
  }

  const totalApproved = incentives.filter(i => i.approved).reduce((s, i) => s + i.amount, 0);
  const totalPending = incentives.filter(i => !i.approved).reduce((s, i) => s + i.amount, 0);
  const isAdmin = currentUser?.role === 'admin';
  const inputStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-[10px] font-medium uppercase" style={{ color: 'var(--color-text-secondary)' }}>Total Approved</div>
          <div className="text-xl font-bold font-mono mt-1" style={{ color: '#27AE60' }}>KES {totalApproved.toLocaleString()}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-[10px] font-medium uppercase" style={{ color: 'var(--color-text-secondary)' }}>Pending Approval</div>
          <div className="text-xl font-bold font-mono mt-1" style={{ color: '#F39C12' }}>KES {totalPending.toLocaleString()}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-[10px] font-medium uppercase" style={{ color: 'var(--color-text-secondary)' }}>Total Bonuses</div>
          <div className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--color-text-primary)' }}>{incentives.length}</div>
        </div>
      </div>

      {/* Incentive Types Reference */}
      <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Incentive Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <div key={key} className="px-3 py-2 rounded-lg text-center" style={{ background: 'var(--color-bg)' }}>
              <div className="text-[10px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: '#27AE60' }}>{TYPE_AMOUNTS[key]}</div>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>
            <Plus size={14} /> Record Incentive
          </button>
        </div>
      )}

      {showNew && (
        <form onSubmit={createIncentive} className="rounded-xl p-4 space-y-3 animate-fadeIn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} required className="px-3 py-2 rounded-lg text-xs" style={inputStyle}>
              <option value="">Team Member *</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} required className="px-3 py-2 rounded-lg text-xs" style={inputStyle}>
              <option value="">Incentive Type *</option>
              {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required placeholder="Amount (KES) *" className="px-3 py-2 rounded-lg text-xs font-mono" style={inputStyle} />
            <select value={form.oppId} onChange={e => setForm({...form, oppId: e.target.value})} className="px-3 py-2 rounded-lg text-xs" style={inputStyle}>
              <option value="">Related Opportunity</option>
              {opps.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes" className="w-full px-3 py-2 rounded-lg text-xs" style={inputStyle} />
          <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>Create</button>
        </form>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Team Member','Type','Amount','Related Opp','Status','Date',isAdmin ? 'Actions' : ''].filter(Boolean).map(h => (
                <th key={h} className="px-3 py-3 text-left font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incentives.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>{i.user?.name}</td>
                <td className="px-3 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{TYPE_LABELS[i.type] || i.type}</td>
                <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: '#27AE60' }}>KES {i.amount.toLocaleString()}</td>
                <td className="px-3 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{i.opportunity?.name || '—'}</td>
                <td className="px-3 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: i.approved ? 'rgba(39,174,96,0.1)' : 'rgba(243,156,18,0.1)', color: i.approved ? '#27AE60' : '#F39C12' }}>
                    {i.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{new Date(i.createdAt).toLocaleDateString()}</td>
                {isAdmin && (
                  <td className="px-3 py-2.5">
                    {!i.approved && (
                      <div className="flex gap-1">
                        <button onClick={() => approveIncentive(i.id, true)} className="p-1 rounded" style={{ color: '#27AE60' }}><Check size={14} /></button>
                        <button onClick={() => approveIncentive(i.id, false)} className="p-1 rounded" style={{ color: '#E74C3C' }}><X size={14} /></button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
