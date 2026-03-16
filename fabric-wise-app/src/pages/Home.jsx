import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fabrics } from '../data/fabrics';
import FabricCard from '../components/FabricCard';
import './Home.css';

const tableData = [
  { name: 'Organic Cotton', breathability: 'Excellent', sensitivity: 'Very Low', odor: 'Low', comfort: 'Excellent', score: 95, category: 'natural' },
  { name: 'Tencel',         breathability: 'Excellent', sensitivity: 'Very Low', odor: 'Very Low', comfort: 'Excellent', score: 92, category: 'semi-natural' },
  { name: 'Bamboo Viscose', breathability: 'Excellent', sensitivity: 'Very Low', odor: 'Low', comfort: 'Excellent', score: 88, category: 'semi-natural' },
  { name: 'Hemp',           breathability: 'Good',      sensitivity: 'Low',      odor: 'Low', comfort: 'Good',      score: 82, category: 'natural' },
  { name: 'Regular Cotton', breathability: 'Good',      sensitivity: 'Low',      odor: 'Low', comfort: 'Good',      score: 75, category: 'natural' },
  { name: 'Spandex',        breathability: 'Very Low',  sensitivity: 'Moderate', odor: 'High', comfort: 'Good',    score: 45, category: 'synthetic' },
  { name: 'Nylon',          breathability: 'Poor',      sensitivity: 'Moderate', odor: 'High', comfort: 'Moderate', score: 38, category: 'synthetic' },
  { name: 'Polyester',      breathability: 'Poor',      sensitivity: 'Moderate', odor: 'High', comfort: 'Moderate', score: 35, category: 'synthetic' },
  { name: 'Acrylic',        breathability: 'Very Poor', sensitivity: 'High',     odor: 'Very High', comfort: 'Poor', score: 15, category: 'synthetic' },
];

function scoreColor(s) {
  if (s >= 80) return '#4ade80';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

function ScoreBadge({ score }) {
  return (
    <span
      className="home-score-badge"
      style={{ color: scoreColor(score), borderColor: scoreColor(score) }}
    >
      {score}
    </span>
  );
}

const featuredFabrics = fabrics.filter(f => ['organic-cotton', 'tencel', 'bamboo-viscose'].includes(f.id));

const tips = [
  { icon: '🌱', text: 'Choose organic cotton for babies and sensitive skin — it\'s free of pesticide residues.' },
  { icon: '💧', text: 'Tencel and bamboo viscose are naturally moisture-managing, keeping you cool in heat.' },
  { icon: '⚠️', text: 'Acrylic is a known skin irritant — linked to contact dermatitis in many people.' },
  { icon: '♻️', text: 'Hemp gets softer with every wash and is one of the most eco-friendly fibres available.' },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/fabrics?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/fabrics');
    }
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">🌿 Fabric Health Awareness</div>
          <h1 className="home-hero-title">
            Know What's <span className="home-hero-accent">On Your Skin</span>
          </h1>
          <p className="home-hero-sub">
            Not all fabrics are created equal. Discover which materials are safe,
            breathable, and healthy — and which ones you should avoid.
          </p>

          <form className="home-search" onSubmit={handleSearch}>
            <span className="home-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search fabrics — e.g. cotton, polyester, sensitive skin..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="home-search-input"
            />
            <button type="submit" className="home-search-btn">Search</button>
          </form>

          <div className="home-hero-actions">
            <Link to="/scanner" className="btn btn-outline">
              📷 Scan a Label
            </Link>
            <Link to="/health" className="btn btn-ghost">
              💚 Health Guide
            </Link>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-hero-circle">
            <span className="home-hero-circle-emoji">🧵</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="home-stats">
        <div className="container">
          <div className="home-stats-grid">
            <div className="home-stat">
              <span className="home-stat-num">9</span>
              <span className="home-stat-label">Fabrics Analyzed</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-num">6</span>
              <span className="home-stat-label">Brands Rated</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-num">5</span>
              <span className="home-stat-label">Community Reviews</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-num">100</span>
              <span className="home-stat-label">Health Score Max</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Fabrics */}
      <section className="home-section container">
        <div className="home-section-header">
          <div>
            <h2 className="section-title">🏆 Top Rated Fabrics</h2>
            <p className="section-subtitle">The healthiest fabrics for your skin</p>
          </div>
          <Link to="/fabrics" className="btn btn-outline">View All →</Link>
        </div>
        <div className="home-cards-grid">
          {featuredFabrics.map(fabric => (
            <FabricCard key={fabric.id} fabric={fabric} />
          ))}
        </div>
      </section>

      {/* Fabric Awareness Table */}
      <section className="home-section container">
        <h2 className="section-title">📊 Fabric Comparison Table</h2>
        <p className="section-subtitle">At-a-glance health and comfort rankings</p>
        <div className="home-table-wrap">
          <table className="home-table">
            <thead>
              <tr>
                <th>Fabric</th>
                <th>Breathability</th>
                <th>Skin Sensitivity</th>
                <th>Odor Retention</th>
                <th>Comfort</th>
                <th>Health Score</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map(row => (
                <tr
                  key={row.name}
                  className={`home-table-row home-table-row--${row.category}`}
                >
                  <td className="home-table-name">{row.name}</td>
                  <td>{row.breathability}</td>
                  <td>{row.sensitivity}</td>
                  <td>{row.odor}</td>
                  <td>{row.comfort}</td>
                  <td><ScoreBadge score={row.score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tips */}
      <section className="home-section container">
        <h2 className="section-title">💡 Health Tips</h2>
        <p className="section-subtitle">Quick wins for your skin and wellbeing</p>
        <div className="home-tips-grid">
          {tips.map((tip, i) => (
            <div key={i} className="home-tip-card">
              <span className="home-tip-icon">{tip.icon}</span>
              <p>{tip.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scanner CTA Banner */}
      <section className="home-banner container">
        <div className="home-banner-inner">
          <div>
            <h3 className="home-banner-title">📷 Scan Any Clothing Label</h3>
            <p className="home-banner-sub">
              Point your camera at a barcode or QR code to instantly look up the fabric health score.
            </p>
          </div>
          <Link to="/scanner" className="btn btn-primary">
            Open Scanner
          </Link>
        </div>
      </section>
    </div>
  );
}
