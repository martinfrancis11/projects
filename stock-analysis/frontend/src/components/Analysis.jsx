import React from 'react';

// Simple markdown-lite renderer
function renderMarkdown(text) {
  if (!text) return [];

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) { elements.push(<div key={i} style={{ height: 6 }} />); i++; continue; }

    // ## Heading
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} style={{ color: 'var(--blue)', fontSize: 15, fontWeight: 700, marginTop: 16, marginBottom: 6, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
          {line.slice(3)}
        </h3>
      );
      i++; continue;
    }

    // ### Sub-heading
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} style={{ color: 'var(--yellow)', fontSize: 13, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>
          {line.slice(4)}
        </h4>
      );
      i++; continue;
    }

    // Bullet / list
    if (line.match(/^[-*•]\s/)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, fontSize: 13 }}>
          <span style={{ color: 'var(--text2)', flexShrink: 0 }}>•</span>
          <span>{inlineFormat(line.replace(/^[-*•]\s/, ''))}</span>
        </div>
      );
      i++; continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 2 }}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function inlineFormat(text) {
  // **bold** and *italic*
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith('**')) parts.push(<strong key={m.index} style={{ color: 'var(--text)', fontWeight: 700 }}>{m[2]}</strong>);
    else if (m[0].startsWith('`')) parts.push(<code key={m.index} style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', color: 'var(--green)' }}>{m[4]}</code>);
    else parts.push(<em key={m.index}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

function getRecommendationColor(text) {
  if (/\bBUY\b/i.test(text)) return { color: '#3fb950', icon: '🟢', label: 'BUY' };
  if (/\bSELL\b/i.test(text)) return { color: '#f85149', icon: '🔴', label: 'SELL' };
  if (/\bHOLD\b/i.test(text)) return { color: '#e3b341', icon: '🟡', label: 'HOLD' };
  return null;
}

export default function Analysis({ text, loading, symbol }) {
  const rec = text ? getRecommendationColor(text) : null;

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(135deg, #1a2332, #1f2937)',
      }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Claude AI Analysis</div>
          <div style={{ color: 'var(--text2)', fontSize: 11 }}>{symbol} · Powered by claude-haiku-4-5</div>
        </div>

        {rec && (
          <div style={{
            marginLeft: 'auto', padding: '6px 18px', borderRadius: 20,
            background: `${rec.color}22`, border: `1px solid ${rec.color}`,
            color: rec.color, fontWeight: 800, fontSize: 15, letterSpacing: 1,
          }}>
            {rec.icon} {rec.label}
          </div>
        )}

        {loading && !rec && (
          <div style={{ marginLeft: 'auto', color: 'var(--text2)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ animation: 'pulse 1.5s ease infinite', display: 'inline-block' }}>●</span>
            Analysing…
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px', maxHeight: 600, overflowY: 'auto' }}>
        {text ? (
          <div>{renderMarkdown(text)}</div>
        ) : (
          <div style={{ color: 'var(--text2)', fontSize: 13, textAlign: 'center', padding: 20 }}>
            Generating analysis…
          </div>
        )}

        {/* Blinking cursor while streaming */}
        {loading && (
          <span style={{
            display: 'inline-block', width: 2, height: 14, background: 'var(--blue)',
            animation: 'pulse 0.8s step-start infinite', marginLeft: 2, verticalAlign: 'text-bottom',
          }} />
        )}
      </div>

      {/* Disclaimer */}
      {!loading && text && (
        <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <p style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center' }}>
            ⚠️ This analysis is for educational purposes only and does not constitute financial advice. Always do your own research before investing.
          </p>
        </div>
      )}
    </div>
  );
}
