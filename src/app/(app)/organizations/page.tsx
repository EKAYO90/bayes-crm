'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Plus, Search, AlertTriangle, UserCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = { Cold: '#95A5A6', Warming: '#F39C12', Warm: '#E67E22', Active: '#27AE60', Champion: '#C0392B' };

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', type: '', relationshipOwnerId: '', relationshipStatus: 'Cold', website: '', notes: '' });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/organizations?${params}`).then(r => r.json()).then(d => {
      setOrgs(d.organizations || []);
      const owners = (d.organizations || []).map((o: any) => o.relationshipOwner);
      setUsers(Array.from(new Map(owners.map((u: any) => [u.id, u])).values()));
    });
  }, [search, statusFilter]);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/organizations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrg) });
    if (res.ok) {
      setShowNew(false);
      setNewOrg({ name: '', type: '', relationshipOwnerId: '', relationshipStatus: 'Cold', website: '', notes: '' });
      const params = new URLSearchParams();
      fetch('/api/organizations').then(r => r.json()).then(d => setOrgs(d.organizations || []));
    }
  }

  // Relationship health summary
  const statusCounts = { Cold: 0, Warming: 0, Warm: 0, Active: 0, Champion: 0 };
  orgs.forEach(o => { if (statusCounts[o.relationshipStatus as keyof typeof statusCounts] !== undefined) statusCounts[o.relationshipStatus as keyof typeof statusCounts]++; });
  const total = orgs.length || 1;

  return (
    <div className="space-y-4">
      {/* Relationship Health Bar */}
      <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Relationship Health</h3>
        <div className="flex h-6 rounded-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
          {Object.entries(statusCounts).map(([status, count]) => (
            count > 0 && <div key={status} className="flex items-center justify-center text-[9px] font-bold text-white" style={{ width: `${count/total*100}%`, background: STATUS_COLORS[status] }}>{count}</div>
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[status] }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>{status}: {count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <Search size={14} style={{ color: 'var(--color-text-secondary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organizations..." className="flex-1 bg-transparent text-xs outline-none" style={{ color: 'var(--color-text-primary)' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>
          <Plus size={14} /> New Organization
        </button>
      </div>

      {/* New Org Form */}
      {showNew && (
        <form onSubmit={createOrg} className="rounded-xl p-4 space-y-3 animate-fadeIn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={newOrg.name} onChange={e => setNewOrg({...newOrg, name: e.target.value})} required placeholder="Organization name *" className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            <select value={newOrg.type} onChange={e => setNewOrg({...newOrg, type: e.target.value})} required className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
              <option value="">Type *</option>
              {['Foundation','MDB','Bilateral','DFI','Commercial Bank','Insurance','Academic','Multilateral','Other'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={newOrg.relationshipOwnerId} onChange={e => setNewOrg({...newOrg, relationshipOwnerId: e.target.value})} required className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
              <option value="">Owner *</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>Create</button>
            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-1.5 rounded-lg text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Org Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {orgs.map(org => {
          const daysSince = org.lastTouchpointDate ? Math.floor((Date.now() - new Date(org.lastTouchpointDate).getTime()) / 86400000) : 999;
          const atRisk = daysSince > 23;
          return (
            <Link key={org.id} href={`/organizations/${org.id}`} className="rounded-xl p-4 transition-all hover:opacity-90" style={{ background: 'var(--color-card)', border: `1px solid ${atRisk ? 'rgba(231,76,60,0.3)' : 'var(--color-border)'}` }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{org.name}</div>
                  <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{org.type}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: STATUS_COLORS[org.relationshipStatus] || '#666' }}>
                  {org.relationshipStatus}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                <span><UserCircle size={10} className="inline mr-0.5" /> {org.relationshipOwner?.name}</span>
                <span>{org._count?.opportunities || 0} opps</span>
                <span>{org._count?.contacts || 0} contacts</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                <span className="text-[10px]" style={{ color: atRisk ? '#E74C3C' : 'var(--color-text-secondary)' }}>
                  {atRisk && <AlertTriangle size={10} className="inline mr-0.5" />}
                  {daysSince === 999 ? 'Never contacted' : `${daysSince}d since contact`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
