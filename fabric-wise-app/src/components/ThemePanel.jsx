import { useTheme } from '../context/ThemeContext';
import './ThemePanel.css';

const ACCENTS = [
  { id: 'green',  label: 'Green',  hex: '#4ade80' },
  { id: 'blue',   label: 'Blue',   hex: '#60a5fa' },
  { id: 'purple', label: 'Purple', hex: '#a78bfa' },
  { id: 'orange', label: 'Orange', hex: '#fb923c' },
  { id: 'pink',   label: 'Pink',   hex: '#f472b6' },
];

export default function ThemePanel({ onClose }) {
  const { theme, setTheme, accent, setAccent } = useTheme();

  return (
    <>
      <div className="theme-panel-backdrop" onClick={onClose} />
      <div className="theme-panel">
        <div className="theme-panel-header">
          <span>Appearance</span>
          <button className="theme-panel-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="theme-panel-section">
          <p className="theme-panel-label">Mode</p>
          <div className="theme-panel-modes">
            <button
              className={`theme-mode-btn${theme === 'dark' ? ' active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <span>🌙</span> Dark
            </button>
            <button
              className={`theme-mode-btn${theme === 'light' ? ' active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <span>☀️</span> Light
            </button>
          </div>
        </div>

        <div className="theme-panel-section">
          <p className="theme-panel-label">Accent colour</p>
          <div className="theme-panel-accents">
            {ACCENTS.map(a => (
              <button
                key={a.id}
                className={`theme-accent-btn${accent === a.id ? ' active' : ''}`}
                style={{ '--swatch': a.hex }}
                onClick={() => setAccent(a.id)}
                title={a.label}
                aria-label={a.label}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
