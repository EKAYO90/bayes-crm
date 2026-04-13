'use client';
import { useState, useEffect } from 'react';
import { Plus, Filter, Calendar } from 'lucide-react';
import { ACTIVITY_TYPES } from '@/lib/constants';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ activityType: '', description: '', organizationId: '', opportunityId: '', date: new Date().toISOString().slice(0, 10), outcome: '', followUpRequired: false, followUpDate: '' });
  const [typeFilter, setTypeFilter] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/activities').then(r => r.json()).then(d => setActivities(d.activities || []));
    fetch('/api/organizations').then(r => r.json()).then(d => setOrgs(d.organizations || []));
    fetch('/api/opportunities').then(r => r.json()).then(d => setOpps(d.opportunities || []));
    fetch('/api/auth/me').then(r => r.json()).then(d => setCurrentUser(d.user));
  }, []);

  async function logActivity(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      setShowNew(false);
      setForm({ activityType: '', description: '', organizationId: '', opportunityId: '', date: new Date().toISOString().slice(0, 10), outcome: '', followUpRequired: false, followUpDate: '' });
      fetch('/api/activities').then(r => r.json()).then(d => setActivities(d.activities || []));
    }
  }

  const filteredActivities = typeFilter ? activities.filter(a => a.activityType === typeFilter) : activities;
  const inputStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
          <option value="">All Types</option>
          {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>
          <Plus size={14} /> Log Activity
        </button>
      </div>

      {showNew && (
        <form onSubmit={logActivity} className="rounded-xl p-4 space-y-3 animate-fadeIn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Log New Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={form.activityType} onChange={e => setForm({...form, activityType: e.target.value})} required className="px-3 py-2 rounded-lg text-xs" style={inputStyle}>
              <option value="">Activity Type *</option>
              {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="px-3 py-2 rounded-lg text-xs" style={inputStyle} />
            <select value={form.organizationId} onChange={e => setForm({...form, organizationId: e.target.value})} className="px-3 py-2 rounded-lg text-xs" style={inputStyle}>
              <option value="">Organization (optional)</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select value={form.opportunityId} onChange={e => setForm({...form, opportunityId: e.target.value})} className="px-3 py-2 rounded-lg text-xs" style={inputStyle}>
              <option value="">Opportunity (optional)</option>
              {opps.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <div className="md:col-span-2">
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="What happened? *" rows={3} className="w-full px-3 py-2 rounded-lg text-xs resize-none" style={inputStyle} />
            </div>
            <input value={form.outcome} onChange={e => setForm({...form, outcome: e.target.value})} placeholder="Outcome" className="px-3 py-2 rounded-lg text-xs" style={inputStyle} />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={form.followUpRequired} onChange={e => setForm({...form, followUpRequired: e.target.checked})} /> Follow-up required
              </label>
              {form.followUpRequired && <input type="date" value={form.followUpDate} onChange={e => setForm({...form, followUpDate: e.target.value})} className="px-2 py-1 rounded text-xs" style={inputStyle} />}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>Log Activity</button>
            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-1.5 rounded-lg text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
          </div>
        </form>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {filteredActivities.map(a => (
            <div key={a.id} className="flex gap-4 px-4 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: '#C0392B' }}>
                {a.user?.name?.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{a.user?.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>{a.activityType}</span>
                  {a.user?.tier && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: a.user.tier === 'Closer' ? '#C0392B' : a.user.tier === 'Hunter' ? '#2980B9' : '#8E44AD' }}>{a.user.tier}</span>}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{a.description}</div>
                <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                  <span><Calendar size={10} className="inline mr-0.5" /> {new Date(a.date).toLocaleDateString()}</span>
                  {a.organization && <span>{a.organization.name}</span>}
                  {a.opportunity && <span>{a.opportunity.name}</span>}
                  {a.outcome && <span>Outcome: {a.outcome}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
