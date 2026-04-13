'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Cpu, GripVertical } from 'lucide-react';
import { FUNNEL_STAGES, STAGE_COLORS, STAGE_MAX_DAYS } from '@/lib/constants';

export default function KanbanPage() {
  const [opps, setOpps] = useState<any[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/opportunities').then(r => r.json()).then(d => setOpps(d.opportunities || []));
  }, []);

  function handleDragStart(e: React.DragEvent, oppId: string) {
    setDragging(oppId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault();
    setDragOver(stage);
  }

  async function handleDrop(e: React.DragEvent, newStage: string) {
    e.preventDefault();
    setDragOver(null);
    if (!dragging) return;

    const draggingId = dragging;
    const opp = opps.find(o => o.id === draggingId);
    if (!opp || opp.stage === newStage) {
      setDragging(null);
      return;
    }

    const body: any = { stage: newStage };
    const isWonOrLost = newStage === 'Contract Signed' || newStage === 'Lost';

    if (isWonOrLost) {
      const reason = window.prompt(`Enter win/loss reason before moving to ${newStage}:`, opp.winLossReason || '');
      if (!reason || !reason.trim()) {
        window.alert('win_loss_reason is required to move this deal.');
        setDragging(null);
        return;
      }

      const existingCloseDate = opp.actualCloseDate ? new Date(opp.actualCloseDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      const closeDateInput = window.prompt(`Enter actual close date (YYYY-MM-DD) before moving to ${newStage}:`, existingCloseDate);
      if (!closeDateInput || !closeDateInput.trim()) {
        window.alert('actual_close_date is required to move this deal.');
        setDragging(null);
        return;
      }

      const parsedDate = new Date(closeDateInput);
      if (Number.isNaN(parsedDate.getTime())) {
        window.alert('Invalid actual_close_date. Please use YYYY-MM-DD.');
        setDragging(null);
        return;
      }

      body.winLossReason = reason.trim();
      body.actualCloseDate = parsedDate.toISOString();
    }

    const prevOpps = opps;

    // Optimistic update
    setOpps(prev => prev.map(o => o.id === draggingId ? {
      ...o,
      stage: newStage,
      stageEnteredAt: new Date().toISOString(),
      ...(body.winLossReason ? { winLossReason: body.winLossReason } : {}),
      ...(body.actualCloseDate ? { actualCloseDate: body.actualCloseDate } : {}),
    } : o));
    setDragging(null);

    const res = await fetch(`/api/opportunities/${draggingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setOpps(prevOpps);
      const err = await res.json().catch(() => ({}));
      window.alert(err.error || 'Failed to move opportunity.');
    }
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {FUNNEL_STAGES.map(stage => {
          const stageOpps = opps.filter(o => o.stage === stage);
          const totalValue = stageOpps.reduce((s, o) => s + o.estimatedValue, 0);
          const isOver = dragOver === stage;
          return (
            <div
              key={stage}
              className="w-[280px] flex-shrink-0 rounded-xl flex flex-col"
              style={{ background: isOver ? 'rgba(192,57,43,0.05)' : 'var(--color-card)', border: `1px solid ${isOver ? '#C0392B' : 'var(--color-border)'}`, transition: 'all 0.2s' }}
              onDragOver={e => handleDragOver(e, stage)}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, stage)}
            >
              {/* Column Header */}
              <div className="p-3 flex items-center justify-between" style={{ borderBottom: `2px solid ${STAGE_COLORS[stage]}` }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[stage] }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{stage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>{stageOpps.length}</span>
                  <span className="text-[10px] font-mono" style={{ color: STAGE_COLORS[stage] }}>${(totalValue / 1000).toFixed(0)}K</span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 flex-1 min-h-[200px] overflow-y-auto max-h-[calc(100vh-250px)]">
                {stageOpps.map(opp => {
                  const daysIn = Math.floor((Date.now() - new Date(opp.stageEnteredAt).getTime()) / 86400000);
                  const stalled = STAGE_MAX_DAYS[stage] ? daysIn > STAGE_MAX_DAYS[stage] : false;
                  const overdue = opp.nextActionDate && new Date(opp.nextActionDate) < new Date();
                  return (
                    <div
                      key={opp.id}
                      draggable
                      onDragStart={e => handleDragStart(e, opp.id)}
                      onDragEnd={() => setDragging(null)}
                      className="rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:opacity-90"
                      style={{
                        background: 'var(--color-bg)',
                        border: `1px solid ${stalled ? '#E74C3C' : overdue ? '#F39C12' : 'var(--color-border)'}`,
                        opacity: dragging === opp.id ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <Link href={`/pipeline/${opp.id}`} className="text-xs font-semibold leading-tight hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                          {opp.name}
                        </Link>
                        <GripVertical size={12} style={{ color: 'var(--color-text-secondary)' }} className="flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="text-[10px] mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {opp.organization?.name}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            ${(opp.estimatedValue / 1000).toFixed(0)}K
                          </span>
                          <span className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(41,128,185,0.1)', color: '#2980B9' }}>
                            {opp.probability}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {opp.hasAgentComponent && <Cpu size={10} style={{ color: '#8E44AD' }} />}
                          {stalled && <AlertTriangle size={10} style={{ color: '#E74C3C' }} />}
                          {overdue && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#E74C3C' }} />}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: '#C0392B' }}>
                          {opp.owner?.name?.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-[10px] font-mono" style={{ color: stalled ? '#E74C3C' : 'var(--color-text-secondary)' }}>
                          {daysIn}d
                        </span>
                      </div>
                    </div>
                  );
                })}
                {stageOpps.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                    Drop deals here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
