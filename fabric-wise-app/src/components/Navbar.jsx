import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

const navLinks = [
  { to: '/fabrics',   label: 'Fabrics',    icon: '🧵' },
  { to: '/scanner',  label: 'Scanner',    icon: '📷' },
  { to: '/brands',   label: 'Brands',     icon: '🏷️' },
  { to: '/community',label: 'Community',  icon: '💬' },
  { to: '/health',   label: 'Health',     icon: '💚' },
];

export default function Navbar({ onHelp }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={close}>
          <span className="navbar-logo-icon">🌿</span>
          <span className="navbar-logo-text">FabricIntel</span>
        </Link>

        {/* Desktop links */}
        <ul className="navbar-links">
          {navLinks.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  'navbar-link' + (isActive ? ' navbar-link--active' : '')
                }
              >
                <span className="navbar-link-icon">{icon}</span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Help button */}
        <button className="navbar-help" onClick={onHelp} aria-label="Help">
          ?
        </button>

        {/* Premium CTA */}
        <Link to="/premium" className="navbar-premium" onClick={close}>
          ⭐ Go Premium
        </Link>

        {/* Hamburger */}
        <button
          className={`navbar-hamburger${menuOpen ? ' is-open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`navbar-mobile${menuOpen ? ' is-open' : ''}`}>
        {navLinks.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              'navbar-mobile-link' + (isActive ? ' navbar-mobile-link--active' : '')
            }
            onClick={close}
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
        <button className="navbar-mobile-help" onClick={() => { close(); onHelp?.(); }}>
          ? Help
        </button>
        <Link to="/premium" className="navbar-mobile-premium" onClick={close}>
          ⭐ Go Premium
        </Link>
      </div>
    </nav>
  );
}
