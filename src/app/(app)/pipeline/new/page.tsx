'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SERVICE_LINES, FUNNEL_STAGES, SOURCE_CHANNELS, STAGE_DEFAULT_PROBABILITY } from '@/lib/constants';

export default function NewOpportunityPage() {
  const [form, setForm] = useState({ name: '', organizationId: '', serviceLine: '', hasAgentComponent: false, estimatedValue: '', probability: 10, stage: 'Lead Identified', ownerId: '', enablerId: '', sourceChannel: '', nextAction: '', nextActionDate: '', expectedCloseDate: '', notes: '' });
  const [orgs, setOrgs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/organizations').then(r => r.json()).then(d => setOrgs(d.organizations || []));
    fetch('/api/auth/me').then(r => r.json()).then(async d => {
      if (d.user) setForm(f => ({ ...f, ownerId: d.user.id }));
      const res = await fetch('/api/opportunities?stage=_dummy_to_get_users');
      // Also get users list from org owners
    });
    // Fetch all users for dropdown
    fetch('/api/organizations').then(r => r.json()).then(d => {
      const owners = (d.organizations || []).map((o: any) => o.relationshipOwner);
      const unique = Array.from(new Map(owners.map((u: any) => [u.id, u])).values());
      setUsers(unique as any[]);
    });
  }, []);

  function handleChange(field: string, value: any) {
    setForm(f => {
      const updated = { ...f, [field]: value };
      if (field === 'stage') updated.probability = STAGE_DEFAULT_PROBABILITY[value] ?? f.probability;
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.organizationId || !form.serviceLine || !form.ownerId || !form.sourceChannel || !form.expectedCloseDate) {
      setError('Please fill all required fields'); return;
    }
    setSaving(true);
    const res = await fetch('/api/opportunities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); setSaving(false); return; }
    const data = await res.json();
    router.push(`/pipeline/${data.opportunity.id}`);
  }

  const inputStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };
  const labelStyle = { color: 'var(--color-text-secondary)' };

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Opportunity Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Opportunity Name *</label>
              <input value={form.name} onChange={e => handleChange('name', e.target.value)} required placeholder="e.g., CIFF Phase 2 Energy Advisory" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Organization *</label>
              <select value={form.organizationId} onChange={e => handleChange('organizationId', e.target.value)} required className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="">Select organization</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Service Line *</label>
              <select value={form.serviceLine} onChange={e => handleChange('serviceLine', e.target.value)} required className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="">Select service line</option>
                {SERVICE_LINES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Estimated Value (USD) *</label>
              <input type="number" min="0" value={form.estimatedValue} onChange={e => handleChange('estimatedValue', e.target.value)} required placeholder="0" className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Probability (%) *</label>
              <input type="number" min="0" max="100" value={form.probability} onChange={e => handleChange('probability', parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Stage *</label>
              <select value={form.stage} onChange={e => handleChange('stage', e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                {FUNNEL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Source Channel *</label>
              <select value={form.sourceChannel} onChange={e => handleChange('sourceChannel', e.target.value)} required className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="">Select source</option>
                {SOURCE_CHANNELS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Owner *</label>
              <select value={form.ownerId} onChange={e => handleChange('ownerId', e.target.value)} required className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="">Select owner</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Enabler</label>
              <select value={form.enablerId} onChange={e => handleChange('enablerId', e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="">None</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Expected Close Date *</label>
              <input type="date" value={form.expectedCloseDate} onChange={e => handleChange('expectedCloseDate', e.target.value)} required className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Next Action Date</label>
              <input type="date" value={form.nextActionDate} onChange={e => handleChange('nextActionDate', e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Next Action</label>
              <input value={form.nextAction} onChange={e => handleChange('nextAction', e.target.value)} placeholder="What needs to happen next?" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.hasAgentComponent} onChange={e => handleChange('hasAgentComponent', e.target.checked)} id="agent" className="rounded" />
              <label htmlFor="agent" className="text-xs" style={labelStyle}>Has AI/Agent Component</label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium mb-1" style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={3} placeholder="Additional context..." className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
            </div>
          </div>
        </div>
        {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#C0392B' }}>{saving ? 'Creating...' : 'Create Opportunity'}</button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
