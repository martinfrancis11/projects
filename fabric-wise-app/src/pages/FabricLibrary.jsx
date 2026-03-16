import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fabrics } from '../data/fabrics';
import FabricCard from '../components/FabricCard';
import './FabricLibrary.css';

const FILTERS = [
  { key: 'all',         label: 'All Fabrics',   icon: '🧵' },
  { key: 'natural',     label: 'Natural',        icon: '🌿' },
  { key: 'semi-natural',label: 'Semi-Natural',   icon: '🌱' },
  { key: 'synthetic',   label: 'Synthetic',      icon: '⚗️' },
];

export default function FabricLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState('all');
  const [localQuery, setLocalQuery] = useState('');

  const urlQuery = searchParams.get('q') || '';

  useEffect(() => {
    setLocalQuery(urlQuery);
  }, [urlQuery]);

  const handleSearch = (val) => {
    setLocalQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() });
    } else {
      setSearchParams({});
    }
  };

  const filtered = fabrics.filter(f => {
    const matchCat = activeFilter === 'all' || f.category === activeFilter;
    const q = localQuery.toLowerCase();
    const matchQ = !q ||
      f.name.toLowerCase().includes(q) ||
      f.tags.some(t => t.includes(q)) ||
      f.category.includes(q) ||
      f.healthNotes.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="fabric-library">
      <div className="page-header">
        <h1>🧵 Fabric Library</h1>
        <p>Browse and compare fabrics by health score, breathability, and more</p>
      </div>

      <div className="container">
        {/* Search */}
        <div className="fabric-lib-search-wrap">
          <span className="fabric-lib-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search fabrics..."
            value={localQuery}
            onChange={e => handleSearch(e.target.value)}
            className="fabric-lib-search"
          />
          {localQuery && (
            <button
              className="fabric-lib-clear"
              onClick={() => handleSearch('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="fabric-lib-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`fabric-lib-filter${activeFilter === f.key ? ' active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* Results info */}
        <div className="fabric-lib-meta">
          <span>
            {filtered.length} fabric{filtered.length !== 1 ? 's' : ''}
            {localQuery ? ` for "${localQuery}"` : ''}
          </span>
          {activeFilter !== 'all' && (
            <button
              className="fabric-lib-reset"
              onClick={() => { setActiveFilter('all'); handleSearch(''); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="fabric-lib-grid">
            {filtered.map(fabric => (
              <FabricCard key={fabric.id} fabric={fabric} />
            ))}
          </div>
        ) : (
          <div className="fabric-lib-empty">
            <span>😕</span>
            <p>No fabrics found for <strong>"{localQuery}"</strong></p>
            <button className="btn btn-outline" onClick={() => handleSearch('')}>
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
