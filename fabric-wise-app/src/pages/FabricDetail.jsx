import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFabricById, fabrics } from '../data/fabrics';
import { reviews } from '../data/reviews';
import './FabricDetail.css';

function scoreColor(s) {
  if (s >= 80) return '#4ade80';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

function ratingLabel(v) {
  const m = {
    'excellent': 'Excellent', 'good': 'Good', 'moderate': 'Moderate',
    'poor': 'Poor', 'very-poor': 'Very Poor',
    'very-low': 'Very Low', 'low': 'Low', 'high': 'High', 'very-high': 'Very High',
  };
  return m[v] || v;
}

function ratingScore(v) {
  const m = {
    'excellent': 5, 'very-low': 5, 'good': 4, 'low': 4,
    'moderate': 3, 'poor': 2, 'very-poor': 1, 'high': 2, 'very-high': 1,
  };
  return m[v] || 3;
}

function PropBar({ icon, label, value, invert = false }) {
  const raw = ratingScore(value);
  const bars = invert ? 6 - raw : raw;
  const col = bars >= 4 ? '#4ade80' : bars === 3 ? '#f59e0b' : '#ef4444';

  return (
    <div className="fd-prop">
      <div className="fd-prop-header">
        <span className="fd-prop-icon">{icon}</span>
        <span className="fd-prop-label">{label}</span>
        <span className="fd-prop-value">{ratingLabel(value)}</span>
      </div>
      <div className="fd-prop-bar-track">
        {[1,2,3,4,5].map(i => (
          <div
            key={i}
            className="fd-prop-bar-seg"
            style={{ background: i <= bars ? col : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#f59e0b' : '#334155' }}>★</span>
      ))}
    </div>
  );
}

function EcoStars({ rating }) {
  return (
    <div className="fd-eco-stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ opacity: i <= rating ? 1 : 0.2 }}>🌿</span>
      ))}
    </div>
  );
}

export default function FabricDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fabric = getFabricById(id);

  if (!fabric) {
    return (
      <div className="fd-not-found container">
        <h2>Fabric not found 😕</h2>
        <Link to="/fabrics" className="btn btn-primary">Back to Library</Link>
      </div>
    );
  }

  const sc = scoreColor(fabric.healthScore);
  const fabricReviews = reviews.filter(r => r.fabricId === fabric.id);
  const related = fabrics
    .filter(f => f.id !== fabric.id && (f.category === fabric.category || Math.abs(f.healthScore - fabric.healthScore) < 20))
    .slice(0, 3);

  const catClass = fabric.category === 'natural' ? 'badge-natural'
    : fabric.category === 'semi-natural' ? 'badge-semi' : 'badge-synthetic';
  const catLabel = fabric.category === 'natural' ? 'Natural'
    : fabric.category === 'semi-natural' ? 'Semi-Natural' : 'Synthetic';

  return (
    <div className="fabric-detail">
      {/* Breadcrumb */}
      <div className="fd-breadcrumb container">
        <button onClick={() => navigate(-1)} className="fd-back">← Back</button>
        <span className="fd-bc-sep">/</span>
        <Link to="/fabrics" className="fd-bc-link">Fabric Library</Link>
        <span className="fd-bc-sep">/</span>
        <span className="fd-bc-current">{fabric.name}</span>
      </div>

      {/* Hero */}
      <div className="fd-hero container">
        <div className="fd-hero-left">
          <div className="fd-hero-badges">
            <span className={`badge ${catClass}`}>{catLabel}</span>
            {fabric.ecoRating >= 4 && <span className="badge badge-natural">Eco-Friendly</span>}
          </div>
          <h1 className="fd-hero-name">{fabric.name}</h1>
          <p className="fd-hero-desc">{fabric.description}</p>

          <div className="fd-hero-eco">
            <span className="fd-eco-label">Eco Rating</span>
            <EcoStars rating={fabric.ecoRating} />
          </div>
        </div>

        <div className="fd-hero-right">
          {/* Big score circle */}
          <div className="fd-score-circle" style={{ borderColor: sc, boxShadow: `0 0 40px ${sc}30` }}>
            <span className="fd-score-num" style={{ color: sc }}>{fabric.healthScore}</span>
            <span className="fd-score-label">Health Score</span>
          </div>

          {/* Natural % */}
          <div className="fd-natural-bar">
            <div className="fd-natural-bar-header">
              <span>Natural Content</span>
              <span style={{ color: sc, fontWeight: 700 }}>{fabric.naturalPercent}%</span>
            </div>
            <div className="fd-natural-bar-track">
              <div
                className="fd-natural-bar-fill"
                style={{ width: `${fabric.naturalPercent}%`, background: sc }}
              />
            </div>
          </div>

          {/* Allergen */}
          <div className="fd-allergen">
            <span className="fd-allergen-label">Allergen Risk</span>
            <span
              className="fd-allergen-val"
              style={{
                color: fabric.allergenRisk === 'none' ? '#4ade80'
                  : fabric.allergenRisk === 'low' ? '#86efac'
                  : fabric.allergenRisk === 'moderate' ? '#f59e0b'
                  : '#ef4444'
              }}
            >
              {fabric.allergenRisk === 'none' ? '✅ None' :
               fabric.allergenRisk === 'low' ? '🟡 Low' :
               fabric.allergenRisk === 'moderate' ? '🟠 Moderate' : '🔴 High'}
            </span>
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="fd-section container">
        <h2 className="fd-section-title">📊 Properties</h2>
        <div className="fd-props-grid">
          <PropBar icon="💨" label="Breathability"   value={fabric.breathability} />
          <PropBar icon="🌡️" label="Skin Sensitivity" value={fabric.skinSensitivity} invert />
          <PropBar icon="👃" label="Odor Retention"  value={fabric.odorRetention} invert />
          <PropBar icon="💧" label="Moisture Wicking" value={fabric.moistureWicking} />
          <PropBar icon="😊" label="Comfort Level"   value={fabric.comfortLevel} />
        </div>
      </div>

      {/* Health Notes */}
      <div className="fd-section container">
        <div className="fd-health-notes">
          <span className="fd-health-notes-icon">💚</span>
          <div>
            <h3>Health Notes</h3>
            <p>{fabric.healthNotes}</p>
          </div>
        </div>
      </div>

      {/* Best for / Avoid if */}
      <div className="fd-section container">
        <div className="fd-two-col">
          <div className="fd-list-card fd-list-card--green">
            <h3>✅ Best For</h3>
            <ul>
              {fabric.bestFor.length > 0
                ? fabric.bestFor.map(item => (
                    <li key={item}>{item}</li>
                  ))
                : <li className="fd-list-none">No specific recommendations</li>
              }
            </ul>
          </div>
          <div className="fd-list-card fd-list-card--red">
            <h3>⚠️ Avoid If</h3>
            <ul>
              {fabric.avoidIf.length > 0
                ? fabric.avoidIf.map(item => (
                    <li key={item}>{item}</li>
                  ))
                : <li className="fd-list-none">No specific concerns</li>
              }
            </ul>
          </div>
        </div>
      </div>

      {/* Community Reviews */}
      {fabricReviews.length > 0 && (
        <div className="fd-section container">
          <h2 className="fd-section-title">💬 Community Reviews</h2>
          <div className="fd-reviews">
            {fabricReviews.map(r => (
              <div key={r.id} className="fd-review-card">
                <div className="fd-review-header">
                  <span className="fd-review-avatar">{r.avatar}</span>
                  <div>
                    <div className="fd-review-name">
                      {r.userName}
                      {r.verified && <span className="fd-review-verified">✓ Verified</span>}
                    </div>
                    <StarRating rating={r.rating} />
                  </div>
                  <span className="fd-review-date">{r.date}</span>
                </div>
                <h4 className="fd-review-title">{r.title}</h4>
                <p className="fd-review-body">{r.body}</p>
                <div className="fd-review-likes">👍 {r.likes} found this helpful</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Fabrics */}
      {related.length > 0 && (
        <div className="fd-section container">
          <h2 className="fd-section-title">🔗 Similar Fabrics</h2>
          <div className="fd-related">
            {related.map(f => {
              const rc = scoreColor(f.healthScore);
              const rcc = f.category === 'natural' ? 'badge-natural'
                : f.category === 'semi-natural' ? 'badge-semi' : 'badge-synthetic';
              return (
                <Link key={f.id} to={`/fabrics/${f.id}`} className="fd-related-card">
                  <div className="fd-related-score" style={{ color: rc, borderColor: rc }}>
                    {f.healthScore}
                  </div>
                  <div>
                    <div className="fd-related-name">{f.name}</div>
                    <span className={`badge ${rcc}`} style={{ fontSize: '0.7rem' }}>
                      {f.category}
                    </span>
                  </div>
                  <span className="fd-related-arrow">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ height: 48 }} />
    </div>
  );
}
