'use client';
import { useState, useEffect } from 'react';
import { Download, FileBarChart } from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('pipeline');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?type=${reportType}`).then(r => r.json()).then(d => { setData(d.data || []); setLoading(false); });
  }, [reportType]);

  function exportCSV() {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(r => headers.map(h => r[h]));
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${reportType}-report.csv`; a.click();
  }


  function formatCellValue(key: string, value: unknown) {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';

    if (typeof value === 'number' && (key.toLowerCase().includes('value') || key === 'weighted')) {
      return `$${value.toLocaleString()}`;
    }

    if (Array.isArray(value)) {
      return value.map(item => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
    }

    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(', ');
    }

    return String(value ?? '—');
  }

  const reports = [
    { key: 'pipeline', label: 'Pipeline Report', desc: 'All active opportunities with stage, value, probability, owner' },
    { key: 'activity', label: 'Team Activity Report', desc: 'Activity count by team member with comparison to targets' },
    { key: 'relationship', label: 'Relationship Health', desc: 'All organizations by status with days since last contact' },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {reports.map(r => (
          <button key={r.key} onClick={() => setReportType(r.key)}
            className="rounded-xl p-4 text-left transition-all"
            style={{ background: reportType === r.key ? 'rgba(192,57,43,0.1)' : 'var(--color-card)', border: `1px solid ${reportType === r.key ? '#C0392B' : 'var(--color-border)'}` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <FileBarChart size={14} style={{ color: reportType === r.key ? '#C0392B' : 'var(--color-text-secondary)' }} />
              <span className="text-xs font-semibold" style={{ color: reportType === r.key ? '#C0392B' : 'var(--color-text-primary)' }}>{r.label}</span>
            </div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{r.desc}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>Loading report...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>No data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {Object.keys(data[0]).filter(k => k !== 'id').map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                      {h.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {Object.entries(row).filter(([k]) => k !== 'id').map(([k, v]) => (
                      <td key={k} className="px-3 py-2.5 whitespace-nowrap" style={{ color: k === 'atRisk' && v ? '#E74C3C' : typeof v === 'number' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                        {formatCellValue(k, v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="text-xs text-right" style={{ color: 'var(--color-text-secondary)' }}>{data.length} records</div>
    </div>
  );
}