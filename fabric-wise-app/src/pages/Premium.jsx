import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Premium.css';

const freeFeatures = [
  { label: 'Browse Fabric Library (9 fabrics)', included: true },
  { label: 'Basic health scores', included: true },
  { label: 'Brand Directory (6 brands)', included: true },
  { label: 'Community Reviews', included: true },
  { label: 'Barcode Scanner (basic)', included: true },
  { label: 'Health Insights overview', included: true },
  { label: 'Scan history & saved fabrics', included: false },
  { label: 'Personalised fabric recommendations', included: false },
  { label: 'Allergen & skin condition alerts', included: false },
  { label: 'Full brand database (100+ brands)', included: false },
  { label: 'Ad-free experience', included: false },
  { label: 'Priority brand updates', included: false },
  { label: 'Export reports (PDF)', included: false },
];

const premiumFeatures = freeFeatures.map(f => ({ ...f, included: true }));

const premiumPerks = [
  {
    icon: '📷',
    title: 'Scan History',
    desc: 'Save every scan. Review your clothing history and see patterns in what you wear.',
    soon: false,
  },
  {
    icon: '🎯',
    title: 'Personalised Recommendations',
    desc: 'Tell us your skin type and we\'ll filter the entire library to what\'s best for you.',
    soon: false,
  },
  {
    icon: '🚨',
    title: 'Allergen Alerts',
    desc: 'Set your known allergens. FabricWise will warn you before you buy or wear a risky fabric.',
    soon: false,
  },
  {
    icon: '🏢',
    title: '100+ Brand Database',
    desc: 'Access sustainability scores and ethics ratings for over 100 global clothing brands.',
    soon: true,
  },
  {
    icon: '📄',
    title: 'PDF Health Reports',
    desc: 'Export your fabric health profile as a PDF — great for dermatologist appointments.',
    soon: true,
  },
  {
    icon: '🚫',
    title: 'Ad-Free',
    desc: 'A clean, distraction-free experience with no advertising ever.',
    soon: false,
  },
];

export default function Premium() {
  const [billing, setBilling] = useState('annual'); // annual | monthly
  const [clicked, setClicked] = useState(false);

  const monthlyPrice = billing === 'annual' ? '1.67' : '2.99';
  const billedAs = billing === 'annual' ? 'Billed annually — $19.99/year' : 'Billed monthly';
  const saving = billing === 'annual' ? 'Save 44%' : null;

  const handleUpgrade = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 3000);
  };

  return (
    <div className="premium-page">
      <div className="premium-hero">
        <div className="premium-hero-badge">⭐ FabricWise Premium</div>
        <h1>Upgrade for Your Skin's Sake</h1>
        <p>
          Get personalised fabric recommendations, allergen alerts, scan history,
          and access to 100+ brand sustainability scores.
        </p>
      </div>

      <div className="container premium-container">

        {/* Billing toggle */}
        <div className="premium-billing-toggle">
          <button
            className={`billing-btn${billing === 'monthly' ? ' active' : ''}`}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className={`billing-btn${billing === 'annual' ? ' active' : ''}`}
            onClick={() => setBilling('annual')}
          >
            Annual
            <span className="billing-saving">Save 44%</span>
          </button>
        </div>

        {/* Price card */}
        <div className="premium-price-card">
          <div className="premium-price-card-left">
            <div className="premium-price">
              <span className="premium-currency">$</span>
              <span className="premium-amount">{monthlyPrice}</span>
              <span className="premium-period">/month</span>
            </div>
            <p className="premium-billed">{billedAs}</p>
            {saving && <span className="premium-save-badge">{saving}</span>}
          </div>

          <div className="premium-price-card-right">
            {clicked ? (
              <div className="premium-clicked">
                🎉 Thanks! Premium is coming soon — we'll notify you on launch.
              </div>
            ) : (
              <button className="btn btn-amber premium-cta" onClick={handleUpgrade}>
                ⭐ Get Premium
              </button>
            )}
            <p className="premium-guarantee">✅ 30-day money-back guarantee</p>
          </div>
        </div>

        {/* Feature comparison */}
        <section className="premium-comparison">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 32 }}>
            Free vs Premium
          </h2>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Free</th>
                  <th className="col-premium">⭐ Premium</th>
                </tr>
              </thead>
              <tbody>
                {freeFeatures.map((f, i) => (
                  <tr key={f.label} className={i % 2 === 0 ? 'row-even' : ''}>
                    <td>{f.label}</td>
                    <td>
                      {f.included
                        ? <span className="check green">✓</span>
                        : <span className="check red">✕</span>
                      }
                    </td>
                    <td>
                      <span className="check green">✓</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Premium perks grid */}
        <section className="premium-perks">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 8 }}>
            Everything in Premium
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: 32 }}>
            Tools designed to protect your skin and simplify fabric shopping
          </p>
          <div className="perks-grid">
            {premiumPerks.map(p => (
              <div key={p.title} className="perk-card">
                <div className="perk-card-header">
                  <span className="perk-icon">{p.icon}</span>
                  <h3>{p.title}</h3>
                  {p.soon && <span className="perk-soon">Coming Soon</span>}
                </div>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="premium-final-cta">
          <h2>Ready to protect your skin?</h2>
          <p>Join thousands of health-conscious shoppers making better fabric choices.</p>
          <div className="premium-final-actions">
            {clicked ? (
              <div className="premium-clicked">
                🎉 We'll be in touch when Premium launches!
              </div>
            ) : (
              <button className="btn btn-amber premium-cta" onClick={handleUpgrade}>
                ⭐ Get Premium — ${monthlyPrice}/month
              </button>
            )}
            <Link to="/fabrics" className="btn btn-ghost">
              Continue with Free
            </Link>
          </div>
          <p className="premium-guarantee" style={{ marginTop: 16, textAlign: 'center' }}>
            ✅ 30-day money-back guarantee · Cancel anytime · No commitments
          </p>
        </section>

      </div>
    </div>
  );
}
