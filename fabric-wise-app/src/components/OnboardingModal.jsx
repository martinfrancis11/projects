import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingModal.css';

const STEPS = [
  {
    icon: '🌿',
    title: 'Welcome to FabricIntel',
    subtitle: 'Know What\'s On Your Skin',
    body: 'FabricIntel helps you understand the materials in your clothing — their health impacts, breathability, allergen risks, and sustainability scores. Make smarter choices for your skin and the planet.',
    tip: null,
    action: null,
  },
  {
    icon: '🔍',
    title: 'Browse the Fabric Library',
    subtitle: 'Learn about 9 major fabric types',
    body: 'Every fabric in your wardrobe has a health score. Natural fabrics like Organic Cotton and Tencel score highest. Synthetics like Acrylic and Polyester can cause irritation, trap heat, and retain odours.',
    tip: '💡 Tip: Filter by Natural, Semi-Natural, or Synthetic to quickly find the best options for your skin type.',
    action: { label: 'Browse Fabrics →', path: '/fabrics' },
  },
  {
    icon: '📷',
    title: 'Scan Clothing Labels',
    subtitle: 'Point your camera at any barcode or QR code',
    body: 'Use the built-in scanner to instantly look up fabric details from a clothing label. No typing required — just point and scan. If camera access isn\'t available, you can enter the code manually.',
    tip: '💡 Tip: Allow camera permissions when prompted to use the live scanner.',
    action: { label: 'Open Scanner →', path: '/scanner' },
  },
  {
    icon: '🏭',
    title: 'Check Brand Sustainability',
    subtitle: 'Not all brands are equal',
    body: 'Some brands use ethical, natural materials. Others rely heavily on cheap synthetics. Our Brand Directory gives each brand a sustainability score, lists their certifications, and shows which materials they primarily use.',
    tip: '💡 Tip: Look for certifications like Fair Trade, B Corp, GOTS, and bluesign® when shopping.',
    action: { label: 'View Brands →', path: '/brands' },
  },
  {
    icon: '🏥',
    title: 'Understand Health Impacts',
    subtitle: 'Your skin absorbs what you wear',
    body: 'Certain fabrics can trigger eczema, rashes, allergies, or overheating. The Health Insights page breaks down fabric impacts by skin type — Normal, Sensitive, Eczema-prone, and Active — so you know exactly what to wear and what to avoid.',
    tip: '💡 Tip: If you have sensitive skin, prioritise fabrics scoring 80+ and avoid Acrylic and high-Polyester blends.',
    action: { label: 'Health Insights →', path: '/health' },
  },
  {
    icon: '💬',
    title: 'Join the Community',
    subtitle: 'Share your fabric experiences',
    body: 'Real people, real experiences. Read reviews from others about how specific fabrics affected their skin. Write your own review to help others make better choices. Like reviews that you find helpful.',
    tip: '💡 Tip: Filter community reviews by fabric type to find experiences relevant to your wardrobe.',
    action: { label: 'Community →', path: '/community' },
  },
  {
    icon: '🚀',
    title: 'You\'re all set!',
    subtitle: 'Start exploring FabricIntel',
    body: 'You now know everything you need to get started. Begin by searching for a fabric you wear often, scan a label in your wardrobe, or check your favourite brand\'s sustainability rating.',
    tip: null,
    action: { label: 'Get Started →', path: '/' },
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem('fw_onboarding_done');
    if (!seen) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem('fw_onboarding_done', '1');
    setVisible(false);
  };

  const handleAction = (path) => {
    dismiss();
    navigate(path);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const prev = () => setStep(s => s - 1);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="onboarding-overlay" onClick={dismiss}>
      <div className="onboarding-modal" onClick={e => e.stopPropagation()}>

        {/* Progress dots */}
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {/* Close */}
        <button className="onboarding-close" onClick={dismiss}>✕</button>

        {/* Content */}
        <div className="onboarding-icon">{current.icon}</div>
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-subtitle">{current.subtitle}</p>
        <p className="onboarding-body">{current.body}</p>

        {current.tip && (
          <div className="onboarding-tip">{current.tip}</div>
        )}

        {/* Actions */}
        <div className="onboarding-actions">
          <div className="onboarding-nav">
            {step > 0 && (
              <button className="onboarding-prev" onClick={prev}>← Back</button>
            )}
            <button className="onboarding-next" onClick={next}>
              {isLast ? 'Finish' : 'Next →'}
            </button>
          </div>

          {current.action && (
            <button
              className="onboarding-cta"
              onClick={() => handleAction(current.action.path)}
            >
              {current.action.label}
            </button>
          )}
        </div>

        {/* Skip */}
        <button className="onboarding-skip" onClick={dismiss}>
          Skip tutorial
        </button>

        {/* Step counter */}
        <div className="onboarding-counter">{step + 1} of {STEPS.length}</div>
      </div>
    </div>
  );
}
