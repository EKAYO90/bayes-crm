'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Save, Cpu, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { FUNNEL_STAGES, STAGE_DEFAULT_PROBABILITY, SERVICE_LINES, SOURCE_CHANNELS } from '@/lib/constants';

const STAGE_COLORS: Record<string, string> = { 'Lead Identified': '#3498DB', 'Initial Contact': '#2980B9', 'Discovery Meeting': '#8E44AD', 'Proposal Development': '#E67E22', 'Proposal Submitted': '#F39C12', 'Negotiation': '#E74C3C', 'Contract Signed': '#27AE60', 'Lost': '#7F8C8D', 'On Hold': '#95A5A6' };
const STAGE_MAX: Record<string, number> = { 'Lead Identified': 14, 'Initial Contact': 14, 'Discovery Meeting': 21, 'Proposal Development': 21, 'Proposal Submitted': 30, 'Negotiation': 30, 'On Hold': 60 };

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [opp, setOpp] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/opportunities/${id}`).then(r => r.json()).then(d => { setOpp(d.opportunity); setForm(d.opportunity || {}); });
    fetch('/api/organizations').then(r => r.json()).then(d => {
      setOrgs(d.organizations || []);
      const owners = (d.organizations || []).map((o: any) => o.relationshipOwner);
      setUsers(Array.from(new Map(owners.map((u: any) => [u.id, u])).values()));
    });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    const body: any = {};
    const fields = ['name','organizationId','serviceLine','hasAgentComponent','estimatedValue','probability','stage','ownerId','enablerId','sourceChannel','nextAction','nextActionDate','expectedCloseDate','actualCloseDate','winLossReason','notes','proposalSubmitted','proposalDate'];
    for (const f of fields) {
      if (form[f] !== undefined && form[f] !== opp[f]) body[f] = form[f];
    }
    const res = await fetch(`/api/opportunities/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const d = await res.json();
      setOpp(d.opportunity);
      setForm(d.opportunity);
      setEditing(false);
    }
    setSaving(false);
  }

  if (!opp) return <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>;

  const daysInStage = Math.floor((Date.now() - new Date(opp.stageEnteredAt).getTime()) / 86400000);
  const stalled = STAGE_MAX[opp.stage] ? daysInStage > STAGE_MAX[opp.stage] : false;
  const weighted = opp.estimatedValue * opp.probability / 100;
  const inputStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="text-[11px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>{opp.displayId}</div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {opp.name} {opp.hasAgentComponent && <Cpu size={16} className="inline ml-1" style={{ color: '#8E44AD' }} />}
          </h2>
        </div>
        <button onClick={() => editing ? handleSave() : setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: editing ? '#27AE60' : '#C0392B' }}>
          {editing ? <><Save size={14} /> {saving ? 'Saving...' : 'Save'}</> : <><Edit2 size={14} /> Edit</>}
        </button>
      </div>

      {/* Stage Progress */}
      <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {FUNNEL_STAGES.filter(s => !['Lost','On Hold'].includes(s)).map((stage, i) => {
            const isCurrent = opp.stage === stage;
            const isPast = FUNNEL_STAGES.indexOf(opp.stage) > i;
            return (
              <div key={stage} className="flex items-center">
                <div className="px-3 py-1.5 rounded-md text-[10px] font-semibold whitespace-nowrap" style={{
                  background: isCurrent ? STAGE_COLORS[stage] : isPast ? `${STAGE_COLORS[stage]}30` : 'var(--color-bg)',
                  color: isCurrent ? 'white' : isPast ? STAGE_COLORS[stage] : 'var(--color-text-secondary)',
                  border: `1px solid ${isCurrent ? STAGE_COLORS[stage] : 'var(--color-border)'}`,
                }}>
                  {stage}
                </div>
                {i < 6 && <ChevronRight size={14} style={{ color: 'var(--color-border)' }} />}
              </div>
            );
          })}
        </div>
        {stalled && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
            <AlertTriangle size={14} /> This deal has been in {opp.stage} for {daysInStage} days (max: {STAGE_MAX[opp.stage]}d). Action required!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Details */}
        <div className="lg:col-span-2 rounded-xl p-4 space-y-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Details</h3>
          <div className="grid grid-cols-2 gap-3">
            {editing ? (
              <>
                <div><label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Stage</label>
                  <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value, probability: STAGE_DEFAULT_PROBABILITY[e.target.value] ?? form.probability})} className="w-full px-2 py-1.5 rounded text-xs" style={inputStyle}>{FUNNEL_STAGES.map(s => <option key={s}>{s}</option>)}</select>
                </div>
                <div><label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Value (USD)</label>
                  <input type="number" value={form.estimatedValue} onChange={e => setForm({...form, estimatedValue: e.target.value})} className="w-full px-2 py-1.5 rounded text-xs font-mono" style={inputStyle} />
                </div>
                <div><label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Probability</label>
                  <input type="number" min="0" max="100" value={form.probability} onChange={e => setForm({...form, probability: parseInt(e.target.value)})} className="w-full px-2 py-1.5 rounded text-xs font-mono" style={inputStyle} />
                </div>
                <div><label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Next Action Date</label>
                  <input type="date" value={form.nextActionDate?.slice(0,10) || ''} onChange={e => setForm({...form, nextActionDate: e.target.value})} className="w-full px-2 py-1.5 rounded text-xs" style={inputStyle} />
                </div>
                <div className="col-span-2"><label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Next Action</label>
                  <input value={form.nextAction || ''} onChange={e => setForm({...form, nextAction: e.target.value})} className="w-full px-2 py-1.5 rounded text-xs" style={inputStyle} />
                </div>
                {(form.stage === 'Contract Signed' || form.stage === 'Lost') && (
                  <div className="col-span-2"><label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Win/Loss Reason *</label>
                    <input value={form.winLossReason || ''} onChange={e => setForm({...form, winLossReason: e.target.value})} className="w-full px-2 py-1.5 rounded text-xs" style={inputStyle} required />
                  </div>
                )}
                {(form.stage === 'Contract Signed' || form.stage === 'Lost') && (
                  <div><label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Actual Close Date *</label>
                    <input type="date" value={form.actualCloseDate?.slice(0,10) || ''} onChange={e => setForm({...form, actualCloseDate: e.target.value})} className="w-full px-2 py-1.5 rounded text-xs" style={inputStyle} required />
                  </div>
                )}
              </>
            ) : (
              <>
                <InfoField label="Organization" value={opp.organization?.name} />
                <InfoField label="Service Line" value={opp.serviceLine} />
                <InfoField label="Value" value={`$${opp.estimatedValue.toLocaleString()}`} mono />
                <InfoField label="Probability" value={`${opp.probability}%`} mono />
                <InfoField label="Weighted Value" value={`$${Math.round(weighted).toLocaleString()}`} mono />
                <InfoField label="Stage" value={opp.stage} badge={STAGE_COLORS[opp.stage]} />
                <InfoField label="Days in Stage" value={`${daysInStage} days`} danger={stalled} />
                <InfoField label="Source" value={opp.sourceChannel} />
                <InfoField label="Owner" value={opp.owner?.name} />
                <InfoField label="Enabler" value={opp.enabler?.name || '—'} />
                <InfoField label="Next Action" value={opp.nextAction || '—'} span2 />
                <InfoField label="Next Action Date" value={opp.nextActionDate ? new Date(opp.nextActionDate).toLocaleDateString() : '—'} />
                <InfoField label="Expected Close" value={opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : '—'} />
                {opp.notes && <InfoField label="Notes" value={opp.notes} span2 />}
              </>
            )}
          </div>
        </div>

        {/* Stage History */}
        <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Stage History</h3>
          <div className="space-y-3">
            {opp.stageHistory?.map((h: any) => (
              <div key={h.id} className="flex gap-2">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: STAGE_COLORS[h.newStage] || '#666' }} />
                <div>
                  <div className="text-[11px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {h.oldStage ? `${h.oldStage} → ${h.newStage}` : `Created at ${h.newStage}`}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{h.user?.name} &middot; {new Date(h.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>

          {opp.activities?.length > 0 && (
            <>
              <h3 className="text-sm font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>Recent Activities</h3>
              <div className="space-y-2">
                {opp.activities.slice(0, 10).map((a: any) => (
                  <div key={a.id} className="py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div className="text-[11px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{a.activityType}</div>
                    <div className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{a.description}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{a.user?.name} &middot; {new Date(a.date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, mono, badge, danger, span2 }: any) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
      {badge ? (
        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ background: badge }}>{value}</span>
      ) : (
        <div className={`text-xs ${mono ? 'font-mono' : ''} font-medium`} style={{ color: danger ? '#E74C3C' : 'var(--color-text-primary)' }}>{value}</div>
      )}
    </div>
  );
}
