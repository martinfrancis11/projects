import { useState } from 'react';
import { brands } from '../data/brands';
import './BrandDirectory.css';

function scoreColor(s) {
  if (s >= 75) return '#4ade80';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

function ethicsLabel(e) {
  const m = { excellent: 'Excellent', good: 'Good', mixed: 'Mixed', poor: 'Poor' };
  return m[e] || e;
}

function ethicsClass(e) {
  const m = { excellent: 'badge-natural', good: 'badge-semi', mixed: 'badge-amber', poor: 'badge-synthetic' };
  return m[e] || '';
}

function BrandCard({ brand }) {
  const sc = scoreColor(brand.sustainabilityScore);

  return (
    <div className="brand-card">
      <div className="brand-card-header">
        <span className="brand-card-logo">{brand.logo}</span>
        <div className="brand-card-title">
          <h3>{brand.name}</h3>
          <div className="brand-card-badges">
            <span className={`badge ${ethicsClass(brand.ethicsRating)}`}>
              {ethicsLabel(brand.ethicsRating)}
            </span>
            <span className="brand-card-price">{brand.priceRange}</span>
          </div>
        </div>
        <div className="brand-card-score" style={{ color: sc }}>
          <span className="brand-card-score-num">{brand.sustainabilityScore}</span>
          <span className="brand-card-score-sub">/ 100</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="brand-score-bar">
        <div className="brand-score-bar-header">
          <span>Sustainability Score</span>
          <span style={{ color: sc, fontWeight: 700 }}>{brand.sustainabilityScore}%</span>
        </div>
        <div className="brand-score-bar-track">
          <div
            className="brand-score-bar-fill"
            style={{ width: `${brand.sustainabilityScore}%`, background: sc }}
          />
        </div>
      </div>

      <p className="brand-card-desc">{brand.description}</p>

      {/* Materials */}
      <div className="brand-card-section">
        <span className="brand-card-section-label">🧵 Primary Materials</span>
        <div className="brand-card-chips">
          {brand.primaryMaterials.map(m => (
            <span key={m} className="brand-chip brand-chip--material">{m}</span>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="brand-card-section">
        <span className="brand-card-section-label">✅ Certifications</span>
        <div className="brand-card-chips">
          {brand.certifications.map(c => (
            <span key={c} className="brand-chip brand-chip--cert">{c}</span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="brand-card-footer">
        <a
          href={brand.website}
          target="_blank"
          rel="noopener noreferrer"
          className="brand-card-link"
        >
          Visit Website ↗
        </a>
        <span className="brand-card-affiliate">* affiliate link</span>
      </div>
    </div>
  );
}

const RANGES = [
  { label: 'All Brands',    min: 0 },
  { label: '🟢 75+',        min: 75 },
  { label: '🟡 50–74',      min: 50, max: 74 },
  { label: '🔴 Under 50',   max: 49 },
];

export default function BrandDirectory() {
  const [range, setRange] = useState(0);

  const filtered = brands.filter(b => {
    const r = RANGES[range];
    if (r.min !== undefined && b.sustainabilityScore < r.min) return false;
    if (r.max !== undefined && b.sustainabilityScore > r.max) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.sustainabilityScore - a.sustainabilityScore);

  return (
    <div className="brand-directory">
      <div className="page-header">
        <h1>🏷️ Brand Directory</h1>
        <p>Sustainability scores and ethics ratings for popular clothing brands</p>
      </div>

      <div className="container brand-dir-container">
        {/* Filter */}
        <div className="brand-dir-filters">
          {RANGES.map((r, i) => (
            <button
              key={i}
              className={`fabric-lib-filter${range === i ? ' active' : ''}`}
              onClick={() => setRange(i)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <p className="brand-dir-meta">
          Showing {sorted.length} brand{sorted.length !== 1 ? 's' : ''}
        </p>

        {/* Disclaimer */}
        <div className="brand-dir-disclaimer">
          ℹ️ Sustainability scores are compiled from public certifications, material disclosures, and third-party audits. Scores may change as brands update their practices.
        </div>

        {/* Grid */}
        <div className="brand-dir-grid">
          {sorted.map(brand => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="fabric-lib-empty">
            <span>😕</span>
            <p>No brands match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
