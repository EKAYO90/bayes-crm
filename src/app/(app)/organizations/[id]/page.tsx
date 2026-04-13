'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Save, Plus, User, Phone, Mail, Link2, Star } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = { Cold: '#95A5A6', Warming: '#F39C12', Warm: '#E67E22', Active: '#27AE60', Champion: '#C0392B' };

export default function OrgDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [showNewContact, setShowNewContact] = useState(false);
  const [contactForm, setContactForm] = useState({ fullName: '', title: '', email: '', phone: '', linkedinUrl: '', isDecisionMaker: false });

  useEffect(() => {
    fetch(`/api/organizations/${id}`).then(r => r.json()).then(d => { setOrg(d.organization); setForm(d.organization || {}); });
  }, [id]);

  async function saveOrg() {
    await fetch(`/api/organizations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ relationshipStatus: form.relationshipStatus, notes: form.notes, website: form.website }) });
    setEditing(false);
    fetch(`/api/organizations/${id}`).then(r => r.json()).then(d => setOrg(d.organization));
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...contactForm, orgId: id }) });
    setShowNewContact(false);
    setContactForm({ fullName: '', title: '', email: '', phone: '', linkedinUrl: '', isDecisionMaker: false });
    fetch(`/api/organizations/${id}`).then(r => r.json()).then(d => setOrg(d.organization));
  }

  if (!org) return <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>;

  const daysSince = org.lastTouchpointDate ? Math.floor((Date.now() - new Date(org.lastTouchpointDate).getTime()) / 86400000) : 999;
  const inputStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{org.name}</h2>
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{org.type} &middot; Owner: {org.relationshipOwner?.name}</div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: STATUS_COLORS[org.relationshipStatus] }}>{org.relationshipStatus}</span>
        <button onClick={() => editing ? saveOrg() : setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: editing ? '#27AE60' : '#C0392B' }}>
          {editing ? <><Save size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
        </button>
      </div>

      {editing && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Status</label>
              <select value={form.relationshipStatus} onChange={e => setForm({...form, relationshipStatus: e.target.value})} className="w-full px-3 py-2 rounded-lg text-xs" style={inputStyle}>
                {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Website</label>
              <input value={form.website || ''} onChange={e => setForm({...form, website: e.target.value})} className="w-full px-3 py-2 rounded-lg text-xs" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full px-3 py-2 rounded-lg text-xs" style={inputStyle} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contacts */}
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Contacts ({org.contacts?.length || 0})</h3>
            <button onClick={() => setShowNewContact(!showNewContact)} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: '#C0392B' }}><Plus size={12} /> Add</button>
          </div>
          {showNewContact && (
            <form onSubmit={addContact} className="mb-3 p-3 rounded-lg space-y-2" style={{ background: 'var(--color-bg)' }}>
              <input value={contactForm.fullName} onChange={e => setContactForm({...contactForm, fullName: e.target.value})} required placeholder="Full name *" className="w-full px-2 py-1.5 rounded text-xs" style={inputStyle} />
              <div className="grid grid-cols-2 gap-2">
                <input value={contactForm.title} onChange={e => setContactForm({...contactForm, title: e.target.value})} placeholder="Title" className="px-2 py-1.5 rounded text-xs" style={inputStyle} />
                <input value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} placeholder="Email" className="px-2 py-1.5 rounded text-xs" style={inputStyle} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={contactForm.isDecisionMaker} onChange={e => setContactForm({...contactForm, isDecisionMaker: e.target.checked})} id="dm" />
                <label htmlFor="dm" className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>Decision Maker</label>
              </div>
              <button type="submit" className="px-3 py-1 rounded text-xs font-semibold text-white" style={{ background: '#C0392B' }}>Add Contact</button>
            </form>
          )}
          <div className="space-y-2">
            {org.contacts?.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#2980B9' }}>
                  {c.fullName.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-text-primary)' }}>
                    {c.fullName} {c.isDecisionMaker && <Star size={10} style={{ color: '#F39C12' }} />}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{c.title}</div>
                </div>
                {c.email && <a href={`mailto:${c.email}`} style={{ color: 'var(--color-text-secondary)' }}><Mail size={12} /></a>}
                {c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" style={{ color: 'var(--color-text-secondary)' }}><Link2 size={12} /></a>}
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities */}
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Opportunities ({org.opportunities?.length || 0})</h3>
          <div className="space-y-2">
            {org.opportunities?.map((o: any) => (
              <Link key={o.id} href={`/pipeline/${o.id}`} className="block py-2 transition-all hover:opacity-80" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{o.name}</div>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: '#27AE60' }}>${(o.estimatedValue/1000).toFixed(0)}K</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{o.stage} &middot; {o.owner?.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      {org.activities?.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Recent Activities</h3>
          <div className="space-y-2">
            {org.activities.map((a: any) => (
              <div key={a.id} className="flex gap-3 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="w-1.5 rounded-full flex-shrink-0" style={{ background: '#2980B9' }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{a.activityType}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{a.description}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{a.user?.name} &middot; {new Date(a.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
