'use client';
import { useState, useEffect } from 'react';
import { Monitor, AlertTriangle, CheckCircle, Clock, Circle, Plus, ExternalLink, Video, Edit2, Save } from 'lucide-react';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'LIVE': { bg: 'rgba(39,174,96,0.1)', text: '#27AE60' },
  'BROKEN': { bg: 'rgba(231,76,60,0.1)', text: '#E74C3C' },
  'In Progress': { bg: 'rgba(243,156,18,0.1)', text: '#F39C12' },
  'Not Started': { bg: 'rgba(149,165,166,0.1)', text: '#95A5A6' },
};

const STATUS_ICONS: Record<string, any> = { 'LIVE': CheckCircle, 'BROKEN': AlertTriangle, 'In Progress': Clock, 'Not Started': Circle };

export default function DemosPage() {
  const [demos, setDemos] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', ownerId: '', status: 'Not Started', url: '', lastTestedDate: new Date().toISOString().slice(0,10) });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/demos').then(r => r.json()).then(d => setDemos(d.demos || []));
    fetch('/api/organizations').then(r => r.json()).then(d => {
      const owners = (d.organizations || []).map((o: any) => o.relationshipOwner);
      setUsers(Array.from(new Map(owners.map((u: any) => [u.id, u])).values()));
    });
  }, []);

  async function updateDemo(id: string) {
    await fetch(`/api/demos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
    setEditing(null);
    fetch('/api/demos').then(r => r.json()).then(d => setDemos(d.demos || []));
  }

  async function createDemo(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/demos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) });
    setShowNew(false);
    fetch('/api/demos').then(r => r.json()).then(d => setDemos(d.demos || []));
  }

  const liveCount = demos.filter(d => d.status === 'LIVE').length;
  const brokenCount = demos.filter(d => d.status === 'BROKEN').length;
  const inputStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.2)' }}>
          <div className="text-2xl font-bold font-mono" style={{ color: '#27AE60' }}>{liveCount}</div>
          <div className="text-[10px] font-medium" style={{ color: '#27AE60' }}>LIVE</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)' }}>
          <div className="text-2xl font-bold font-mono" style={{ color: '#E74C3C' }}>{brokenCount}</div>
          <div className="text-[10px] font-medium" style={{ color: '#E74C3C' }}>BROKEN</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.2)' }}>
          <div className="text-2xl font-bold font-mono" style={{ color: '#F39C12' }}>{demos.filter(d => d.status === 'In Progress').length}</div>
          <div className="text-[10px] font-medium" style={{ color: '#F39C12' }}>In Progress</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>{demos.length}</div>
          <div className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total</div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>
          <Plus size={14} /> Add Demo
        </button>
      </div>

      {showNew && (
        <form onSubmit={createDemo} className="rounded-xl p-4 space-y-3 animate-fadeIn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} required placeholder="Demo name *" className="px-3 py-2 rounded-lg text-xs" style={inputStyle} />
            <select value={newForm.ownerId} onChange={e => setNewForm({...newForm, ownerId: e.target.value})} required className="px-3 py-2 rounded-lg text-xs" style={inputStyle}>
              <option value="">Owner *</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input value={newForm.url} onChange={e => setNewForm({...newForm, url: e.target.value})} placeholder="Demo URL" className="px-3 py-2 rounded-lg text-xs" style={inputStyle} />
            <select value={newForm.status} onChange={e => setNewForm({...newForm, status: e.target.value})} className="px-3 py-2 rounded-lg text-xs" style={inputStyle}>
              {['LIVE','BROKEN','In Progress','Not Started'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>Create</button>
        </form>
      )}

      <div className="space-y-3">
        {demos.map(demo => {
          const StatusIcon = STATUS_ICONS[demo.status] || Circle;
          const colors = STATUS_COLORS[demo.status] || STATUS_COLORS['Not Started'];
          const daysSinceTest = Math.floor((Date.now() - new Date(demo.lastTestedDate).getTime()) / 86400000);
          const isEditing = editing === demo.id;

          return (
            <div key={demo.id} className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: `1px solid ${demo.status === 'BROKEN' ? 'rgba(231,76,60,0.3)' : 'var(--color-border)'}` }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: colors.bg }}>
                  <StatusIcon size={20} style={{ color: colors.text }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{demo.name}</h4>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Owner: {demo.owner?.name} &middot; Last tested {daysSinceTest}d ago</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: colors.bg, color: colors.text }}>{demo.status}</span>
                      <button onClick={() => { if (isEditing) updateDemo(demo.id); else { setEditing(demo.id); setEditForm(demo); } }} className="p-1.5 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                        {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
                      </button>
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="px-2 py-1.5 rounded text-xs" style={inputStyle}>
                        {['LIVE','BROKEN','In Progress','Not Started'].map(s => <option key={s}>{s}</option>)}
                      </select>
                      <select value={editForm.videoRecorded} onChange={e => setEditForm({...editForm, videoRecorded: e.target.value})} className="px-2 py-1.5 rounded text-xs" style={inputStyle}>
                        <option>No</option><option>Yes — Draft</option><option>Yes — Published</option>
                      </select>
                      <input type="date" value={editForm.lastTestedDate?.slice(0,10)} onChange={e => setEditForm({...editForm, lastTestedDate: e.target.value})} className="px-2 py-1.5 rounded text-xs" style={inputStyle} />
                      <input value={editForm.issues || ''} onChange={e => setEditForm({...editForm, issues: e.target.value})} placeholder="Known issues" className="px-2 py-1.5 rounded text-xs" style={inputStyle} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mt-2">
                      {demo.url && <a href={demo.url} target="_blank" className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#2980B9' }}><ExternalLink size={10} /> Demo URL</a>}
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: demo.videoRecorded.includes('Yes') ? '#27AE60' : 'var(--color-text-secondary)' }}><Video size={10} /> {demo.videoRecorded}</span>
                      <span className="text-[10px]" style={{ color: demo.demoDataCurrent ? '#27AE60' : '#E74C3C' }}>{demo.demoDataCurrent ? 'Data Current' : 'Data Outdated'}</span>
                      {demo.issues && <span className="text-[10px]" style={{ color: '#F39C12' }}>Issues: {demo.issues}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
