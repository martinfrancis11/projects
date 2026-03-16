import { useNavigate } from 'react-router-dom';
import './FabricCard.css';

function getScoreColor(score) {
  if (score >= 80) return '#4ade80';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getRatingLabel(value) {
  const map = {
    'excellent': 'Excellent',
    'good': 'Good',
    'moderate': 'Moderate',
    'poor': 'Poor',
    'very-poor': 'Very Poor',
    'very-low': 'Very Low',
    'low': 'Low',
    'high': 'High',
    'very-high': 'Very High',
  };
  return map[value] || value;
}

function getCategoryLabel(cat) {
  const map = {
    'natural': 'Natural',
    'semi-natural': 'Semi-Natural',
    'synthetic': 'Synthetic',
  };
  return map[cat] || cat;
}

function getCategoryClass(cat) {
  const map = {
    'natural': 'badge-natural',
    'semi-natural': 'badge-semi',
    'synthetic': 'badge-synthetic',
  };
  return map[cat] || '';
}

export default function FabricCard({ fabric }) {
  const navigate = useNavigate();
  const scoreColor = getScoreColor(fabric.healthScore);

  return (
    <div
      className="fabric-card"
      onClick={() => navigate(`/fabrics/${fabric.id}`)}
      style={{ '--score-color': scoreColor }}
    >
      <div className="fabric-card-header">
        <div>
          <h3 className="fabric-card-name">{fabric.name}</h3>
          <span className={`badge ${getCategoryClass(fabric.category)}`}>
            {getCategoryLabel(fabric.category)}
          </span>
        </div>
        <div
          className="fabric-card-score"
          style={{ borderColor: scoreColor, color: scoreColor }}
        >
          <span className="fabric-card-score-num">{fabric.healthScore}</span>
          <span className="fabric-card-score-label">Health</span>
        </div>
      </div>

      <p className="fabric-card-note">{fabric.healthNotes}</p>

      <div className="fabric-card-props">
        <div className="fabric-card-prop">
          <span className="fabric-card-prop-icon">💨</span>
          <span className="fabric-card-prop-label">Breathability</span>
          <span className="fabric-card-prop-val">{getRatingLabel(fabric.breathability)}</span>
        </div>
        <div className="fabric-card-prop">
          <span className="fabric-card-prop-icon">🌡️</span>
          <span className="fabric-card-prop-label">Skin Sensitivity</span>
          <span className="fabric-card-prop-val">{getRatingLabel(fabric.skinSensitivity)}</span>
        </div>
        <div className="fabric-card-prop">
          <span className="fabric-card-prop-icon">👃</span>
          <span className="fabric-card-prop-label">Odor Retention</span>
          <span className="fabric-card-prop-val">{getRatingLabel(fabric.odorRetention)}</span>
        </div>
      </div>

      <div className="fabric-card-tags">
        {fabric.tags.slice(0, 3).map(tag => (
          <span key={tag} className="fabric-card-tag">#{tag}</span>
        ))}
      </div>

      <div className="fabric-card-footer">
        <span className="fabric-card-natural">{fabric.naturalPercent}% natural</span>
        <span className="fabric-card-cta">View Details →</span>
      </div>
    </div>
  );
}
