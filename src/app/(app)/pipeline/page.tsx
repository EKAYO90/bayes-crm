'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Filter, Search, AlertTriangle, ChevronDown, Cpu, Download } from 'lucide-react';

const STAGE_COLORS: Record<string, string> = { 'Lead Identified': '#3498DB', 'Initial Contact': '#2980B9', 'Discovery Meeting': '#8E44AD', 'Proposal Development': '#E67E22', 'Proposal Submitted': '#F39C12', 'Negotiation': '#E74C3C', 'Contract Signed': '#27AE60', 'Lost': '#7F8C8D', 'On Hold': '#95A5A6' };
const SL_COLORS: Record<string, string> = { 'Clean Energy Transition': '#E67E22', 'Climate Risk & Adaptation': '#27AE60', 'Investment & Transaction': '#2980B9', 'Data & Digital': '#8E44AD', 'Programme Design': '#E74C3C' };
const STAGE_MAX: Record<string, number> = { 'Lead Identified': 14, 'Initial Contact': 14, 'Discovery Meeting': 21, 'Proposal Development': 21, 'Proposal Submitted': 30, 'Negotiation': 30, 'On Hold': 60 };

export default function PipelinePage() {
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [slFilter, setSlFilter] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const stage = searchParams.get('stage') || '';
    setStageFilter(stage);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (stageFilter) params.set('stage', stageFilter);
    if (slFilter) params.set('serviceLine', slFilter);
    if (search) params.set('search', search);
    fetch(`/api/opportunities?${params}`).then(r => r.json()).then(d => { setOpps(d.opportunities || []); setLoading(false); });
  }, [stageFilter, slFilter, search]);

  function isStalled(stage: string, enteredAt: string) {
    const max = STAGE_MAX[stage];
    if (!max) return false;
    return (Date.now() - new Date(enteredAt).getTime()) / 86400000 > max;
  }

  function daysIn(enteredAt: string) {
    return Math.floor((Date.now() - new Date(enteredAt).getTime()) / 86400000);
  }

  function exportCSV() {
    const headers = ['ID','Name','Organization','Stage','Service Line','Value','Probability','Weighted','Owner','Days in Stage'];
    const rows = opps.map(o => [o.displayId, o.name, o.organization?.name, o.stage, o.serviceLine, o.estimatedValue, o.probability, Math.round(o.estimatedValue*o.probability/100), o.owner?.name, daysIn(o.stageEnteredAt)]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pipeline.csv'; a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <Search size={14} style={{ color: 'var(--color-text-secondary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities..." className="flex-1 bg-transparent text-xs outline-none" style={{ color: 'var(--color-text-primary)' }} />
        </div>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
          <option value="">All Stages</option>
          {Object.keys(STAGE_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={slFilter} onChange={e => setSlFilter(e.target.value)} className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
          <option value="">All Service Lines</option>
          {Object.keys(SL_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <Download size={14} /> Export CSV
        </button>
        <Link href="/pipeline/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#C0392B' }}>
          <Plus size={14} /> New Opportunity
        </Link>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['ID','Name','Organization','Stage','Service Line','Value','Prob','Weighted','Owner','Days','Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="px-3 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>Loading...</td></tr>
              ) : opps.length === 0 ? (
                <tr><td colSpan={11} className="px-3 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>No opportunities found</td></tr>
              ) : opps.map(o => {
                const stalled = isStalled(o.stage, o.stageEnteredAt);
                const overdue = o.nextActionDate && new Date(o.nextActionDate) < new Date();
                return (
                  <tr key={o.id} className="transition-all hover:opacity-80" style={{ borderBottom: '1px solid var(--color-border)', background: stalled ? 'rgba(231,76,60,0.05)' : 'transparent' }}>
                    <td className="px-3 py-2.5 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{o.displayId}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/pipeline/${o.id}`} className="font-medium hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                        {o.name}
                      </Link>
                      {o.hasAgentComponent && <Cpu size={12} className="inline ml-1" style={{ color: '#8E44AD' }} />}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{o.organization?.name}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: STAGE_COLORS[o.stage] || '#666' }}>
                        {stalled && <AlertTriangle size={10} />}
                        {o.stage}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: SL_COLORS[o.serviceLine] || '#666' }} />
                      <span style={{ color: 'var(--color-text-secondary)' }}>{o.serviceLine}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>${(o.estimatedValue/1000).toFixed(0)}K</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{o.probability}%</td>
                    <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: '#2980B9' }}>${(o.estimatedValue*o.probability/100/1000).toFixed(0)}K</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{o.owner?.name}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: stalled ? '#E74C3C' : 'var(--color-text-secondary)' }}>{daysIn(o.stageEnteredAt)}d</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/pipeline/${o.id}`} className="text-[11px] font-medium" style={{ color: '#C0392B' }}>View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-right" style={{ color: 'var(--color-text-secondary)' }}>{opps.length} opportunities</div>
    </div>
  );
}
