'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, GitBranch, User, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ opportunities: [], organizations: [], contacts: [], activities: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) { setQuery(''); inputRef.current?.focus(); }
  }, [isOpen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); if (!isOpen) { /* parent handles */ } }
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.length < 2) { setResults({ opportunities: [], organizations: [], contacts: [], activities: [] }); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch {}
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  function navigate(path: string) { router.push(path); onClose(); }

  const iconMap: Record<string, any> = { opportunities: GitBranch, organizations: Building2, contacts: User, activities: Activity };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fadeIn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Search size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search opportunities, organizations, contacts..."
            className="flex-1 py-3 text-sm bg-transparent outline-none" style={{ color: 'var(--color-text-primary)' }} />
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}><X size={16} /></button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-6 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>Type at least 2 characters to search</div>
          ) : loading ? (
            <div className="p-6 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>Searching...</div>
          ) : (
            Object.entries(results).map(([key, items]: [string, any]) => {
              if (!items?.length) return null;
              const Icon = iconMap[key] || Search;
              return (
                <div key={key}>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-bg)' }}>{key}</div>
                  {items.slice(0, 5).map((item: any) => (
                    <button key={item.id} onClick={() => navigate(item.href)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:opacity-80" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <Icon size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      <div>
                        <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.name}</div>
                        {item.subtitle && <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>{item.subtitle}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
