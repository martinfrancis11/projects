import React, { useState, useRef, useEffect } from 'react';

export default function StockSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${__API_URL__}/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch (_) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sym = query.trim().toUpperCase();
    if (sym) { onSelect(sym); setQuery(''); setOpen(false); }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: 260 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 6 }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search symbol or company…"
          style={{
            flex: 1, padding: '7px 12px', background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: 6,
            color: 'var(--text)', fontSize: 13, outline: 'none',
          }}
        />
        <button type="submit" style={{
          padding: '7px 14px', background: 'var(--accent)', color: 'white',
          border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
        }}>
          Go
        </button>
      </form>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {results.map(r => (
            <div
              key={r.symbol}
              onClick={() => { onSelect(r.symbol); setQuery(''); setOpen(false); }}
              style={{
                padding: '9px 14px', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.symbol}</div>
                <div style={{ color: 'var(--text2)', fontSize: 12 }}>{r.name}</div>
              </div>
              <div style={{ color: 'var(--text2)', fontSize: 11 }}>{r.exchange}</div>
            </div>
          ))}
          {loading && (
            <div style={{ padding: 10, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
              Searching…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
