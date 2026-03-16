import './HealthInsights.css';

const tableRows = [
  { name: 'Organic Cotton', cat: 'natural', breathability: 'Excellent', sensitivity: 'Very Low', odor: 'Low', moisture: 'Low', comfort: 'Excellent', score: 95, allergen: 'None', eco: 5 },
  { name: 'Tencel (Lyocell)', cat: 'semi-natural', breathability: 'Excellent', sensitivity: 'Very Low', odor: 'Very Low', moisture: 'Good', comfort: 'Excellent', score: 92, allergen: 'None', eco: 5 },
  { name: 'Bamboo Viscose', cat: 'semi-natural', breathability: 'Excellent', sensitivity: 'Very Low', odor: 'Low', moisture: 'Moderate', comfort: 'Excellent', score: 88, allergen: 'None', eco: 4 },
  { name: 'Hemp', cat: 'natural', breathability: 'Good', sensitivity: 'Low', odor: 'Low', moisture: 'Low', comfort: 'Good', score: 82, allergen: 'None', eco: 5 },
  { name: 'Regular Cotton', cat: 'natural', breathability: 'Good', sensitivity: 'Low', odor: 'Low', moisture: 'Low', comfort: 'Good', score: 75, allergen: 'Low', eco: 3 },
  { name: 'Spandex', cat: 'synthetic', breathability: 'Very Low', sensitivity: 'Moderate', odor: 'High', moisture: 'High', comfort: 'Good', score: 45, allergen: 'Low', eco: 1 },
  { name: 'Nylon', cat: 'synthetic', breathability: 'Poor', sensitivity: 'Moderate', odor: 'High', moisture: 'Moderate', comfort: 'Moderate', score: 38, allergen: 'Moderate', eco: 1 },
  { name: 'Polyester', cat: 'synthetic', breathability: 'Poor', sensitivity: 'Moderate', odor: 'High', moisture: 'Good', comfort: 'Moderate', score: 35, allergen: 'Moderate', eco: 1 },
  { name: 'Acrylic', cat: 'synthetic', breathability: 'Very Poor', sensitivity: 'High', odor: 'Very High', moisture: 'Poor', comfort: 'Poor', score: 15, allergen: 'High', eco: 1 },
];

const skinTypes = [
  {
    type: 'Normal Skin',
    icon: '😊',
    description: 'Most fabrics are tolerable, but natural fibers are always better for long-term skin health.',
    recommended: ['Organic Cotton', 'Regular Cotton', 'Tencel', 'Bamboo Viscose', 'Hemp'],
    avoid: ['Acrylic (prolonged wear)', 'Unwashed synthetics'],
    tip: 'Even with normal skin, limit polyester to sportswear and opt for natural fibers for sleep.',
  },
  {
    type: 'Sensitive Skin',
    icon: '🌸',
    description: 'Prone to redness, itching, or irritation. Needs ultra-smooth, chemical-free fabrics.',
    recommended: ['Organic Cotton', 'Tencel', 'Bamboo Viscose'],
    avoid: ['Acrylic', 'Polyester (daily wear)', 'Rough-weave Hemp', 'Nylon'],
    tip: 'Wash new clothes before first wear to remove residual dyes and sizing chemicals.',
  },
  {
    type: 'Eczema / Dermatitis',
    icon: '🔬',
    description: 'Requires hypoallergenic fabrics with minimal friction and maximum breathability.',
    recommended: ['Organic Cotton', 'Tencel (Lyocell)', 'Bamboo Viscose'],
    avoid: ['Acrylic', 'Polyester', 'Nylon', 'Wool blends', 'Any high-spandex garments'],
    tip: 'Look for GOTS-certified organic cotton and avoid fabric softeners — they leave irritating residue.',
  },
  {
    type: 'Active / Athletic',
    icon: '🏃',
    description: 'Needs moisture management, breathability, and odor resistance for high-sweat activity.',
    recommended: ['Bamboo Viscose', 'Tencel', 'Performance Polyester (sport-only)', 'Spandex blend (low %)'],
    avoid: ['Acrylic', 'Heavy cotton for intense exercise', '100% non-wicking fabrics'],
    tip: 'Bamboo and Tencel offer natural odor resistance — great alternatives to synthetic activewear.',
  },
];

const facts = [
  { icon: '🧪', title: 'Polyester releases microplastics', body: 'A single wash of a polyester garment can release over 700,000 microplastic fibers into the water system — and ultimately into the food chain.' },
  { icon: '🦠', title: 'Acrylic harbors more bacteria', body: 'Studies show acrylic fabric harbors significantly more odor-causing bacteria than natural alternatives, leading to faster smell buildup.' },
  { icon: '🌡️', title: 'Synthetics raise skin temperature', body: 'Synthetic fabrics like polyester and nylon can raise skin surface temperature by 2–4°C compared to cotton, increasing sweat and discomfort.' },
  { icon: '⚡', title: 'Static electricity and synthetics', body: 'Synthetic fabrics generate static electricity that can disrupt the body\'s natural electric field. This is linked to increased skin dryness and irritation.' },
  { icon: '🌿', title: 'Natural fabrics are pH neutral', body: 'Natural fibres like cotton and wool have a pH close to the skin\'s natural level (4.5–5.5), reducing the risk of irritation and promoting skin health.' },
  { icon: '👶', title: 'Children\'s skin is more vulnerable', body: 'Children\'s skin is 30% thinner than adult skin. Acrylic and polyester contact dermatitis is significantly more common in children under 10.' },
];

function scoreColor(s) {
  if (s >= 80) return '#4ade80';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

function catClass(cat) {
  if (cat === 'natural') return 'tbl-natural';
  if (cat === 'semi-natural') return 'tbl-semi';
  return 'tbl-synthetic';
}

export default function HealthInsights() {
  return (
    <div className="health-page">
      <div className="page-header">
        <h1>💚 Health Insights</h1>
        <p>Evidence-based fabric health information to help you make smarter choices</p>
      </div>

      <div className="container health-container">

        {/* Full comparison table */}
        <section className="health-section">
          <h2 className="section-title">📊 Full Fabric Health Comparison</h2>
          <p className="section-subtitle">All fabrics ranked by health score with detailed properties</p>
          <div className="health-table-wrap">
            <table className="health-table">
              <thead>
                <tr>
                  <th>Fabric</th>
                  <th>Breathability</th>
                  <th>Skin Sensitivity</th>
                  <th>Odor Retention</th>
                  <th>Moisture Wicking</th>
                  <th>Comfort</th>
                  <th>Allergen Risk</th>
                  <th>Eco Rating</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(r => (
                  <tr key={r.name} className={`health-table-row ${catClass(r.cat)}`}>
                    <td className="health-table-name">{r.name}</td>
                    <td>{r.breathability}</td>
                    <td>{r.sensitivity}</td>
                    <td>{r.odor}</td>
                    <td>{r.moisture}</td>
                    <td>{r.comfort}</td>
                    <td>
                      <span className={`allergen-badge allergen-${r.allergen.toLowerCase()}`}>
                        {r.allergen}
                      </span>
                    </td>
                    <td>
                      {'🌿'.repeat(r.eco)}
                    </td>
                    <td>
                      <span
                        className="health-score-chip"
                        style={{ color: scoreColor(r.score), borderColor: scoreColor(r.score) }}
                      >
                        {r.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Skin type guide */}
        <section className="health-section">
          <h2 className="section-title">🩺 Your Skin Type Guide</h2>
          <p className="section-subtitle">Find the right fabrics for your skin type</p>
          <div className="skin-type-grid">
            {skinTypes.map(st => (
              <div key={st.type} className="skin-type-card">
                <div className="skin-type-header">
                  <span className="skin-type-icon">{st.icon}</span>
                  <h3>{st.type}</h3>
                </div>
                <p className="skin-type-desc">{st.description}</p>

                <div className="skin-type-lists">
                  <div className="skin-type-list skin-type-list--green">
                    <h4>✅ Recommended</h4>
                    <ul>
                      {st.recommended.map(r => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                  <div className="skin-type-list skin-type-list--red">
                    <h4>⚠️ Avoid</h4>
                    <ul>
                      {st.avoid.map(a => <li key={a}>{a}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="skin-type-tip">
                  💡 <em>{st.tip}</em>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Did you know */}
        <section className="health-section">
          <h2 className="section-title">🔬 Did You Know?</h2>
          <p className="section-subtitle">Research-backed facts about synthetic fabrics and skin health</p>
          <div className="facts-grid">
            {facts.map(f => (
              <div key={f.title} className="fact-card">
                <span className="fact-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Health tips */}
        <section className="health-section">
          <h2 className="section-title">💡 Practical Health Tips</h2>
          <div className="health-tips">
            {[
              { icon: '🧺', tip: 'Wash new clothes before the first wear to remove manufacturing chemicals, dyes, and sizing agents.' },
              { icon: '🌙', tip: 'Wear natural fabrics (especially organic cotton or Tencel) to bed — your skin regenerates overnight.' },
              { icon: '👶', tip: 'Always choose organic cotton or bamboo for babies and young children — their skin absorbs more than adult skin.' },
              { icon: '🏋️', tip: 'Use synthetic activewear only during exercise, not all day — switch to natural fabrics afterward.' },
              { icon: '🔍', tip: 'Check fabric labels for blend percentages — "cotton blend" may be only 30% cotton and 70% polyester.' },
              { icon: '♻️', tip: 'Invest in fewer, higher-quality natural fiber garments — they last longer and are better for your skin and the planet.' },
            ].map((item, i) => (
              <div key={i} className="health-tip-row">
                <span className="health-tip-icon">{item.icon}</span>
                <p>{item.tip}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
