import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const VIEWS = { LOGIN: 'login', REGISTER: 'register', CONFIRM: 'confirm', FORGOT: 'forgot', RESET: 'reset' };

// Defined OUTSIDE AuthPage so React never remounts it on re-render
function Field({ label, type = 'text', value, onChange, placeholder, autoFocus }) {
  return (
    <div className="auth-field">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyDown={e => e.key === 'Enter' && document.querySelector('.auth-submit')?.click()}
      />
    </div>
  );
}

export default function AuthPage() {
  const { signIn, signUp, confirmSignUp, resendCode, forgotPassword, confirmNewPassword } = useAuth();
  const [view, setView]       = useState(VIEWS.LOGIN);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  // Form fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [code, setCode]         = useState('');
  const [newPass, setNewPass]   = useState('');

  const reset = () => { setError(''); setInfo(''); };

  const handle = async (fn) => {
    reset();
    setLoading(true);
    try { await fn(); }
    catch (e) { setError(e.message || String(e)); }
    finally { setLoading(false); }
  };

  const handleLogin = () => handle(async () => {
    await signIn(email.trim(), password);
  });

  const handleRegister = () => handle(async () => {
    if (!name.trim()) throw new Error('Please enter your full name.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    await signUp(email.trim(), password, name.trim());
    setPendingEmail(email.trim());
    setInfo(`A verification code was sent to ${email.trim()}`);
    setView(VIEWS.CONFIRM);
  });

  const handleConfirm = () => handle(async () => {
    await confirmSignUp(pendingEmail || email.trim(), code.trim());
    setInfo('Account verified! Please sign in.');
    setView(VIEWS.LOGIN);
    setPassword('');
  });

  const handleResend = () => handle(async () => {
    await resendCode(pendingEmail || email.trim());
    setInfo('A new code has been sent.');
  });

  const handleForgot = () => handle(async () => {
    await forgotPassword(email.trim());
    setPendingEmail(email.trim());
    setInfo(`Reset code sent to ${email.trim()}`);
    setView(VIEWS.RESET);
  });

  const handleReset = () => handle(async () => {
    await confirmNewPassword(pendingEmail, code.trim(), newPass);
    setInfo('Password updated! Please sign in.');
    setView(VIEWS.LOGIN);
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">📚</span>
          <h1>Book Writer</h1>
          <p>Your personal writing studio</p>
        </div>

        {view === VIEWS.LOGIN && (
          <>
            <h2>Sign In</h2>
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" />
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}
            <button className="auth-submit" onClick={handleLogin} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div className="auth-links">
              <button onClick={() => { reset(); setView(VIEWS.FORGOT); }}>Forgot password?</button>
              <button onClick={() => { reset(); setView(VIEWS.REGISTER); }}>Create account</button>
            </div>
          </>
        )}

        {view === VIEWS.REGISTER && (
          <>
            <h2>Create Account</h2>
            <Field label="Full Name" value={name} onChange={setName} placeholder="Your name" autoFocus />
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-submit" onClick={handleRegister} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
            <div className="auth-links">
              <button onClick={() => { reset(); setView(VIEWS.LOGIN); }}>Already have an account? Sign in</button>
            </div>
          </>
        )}

        {view === VIEWS.CONFIRM && (
          <>
            <h2>Verify Email</h2>
            <p className="auth-hint">Enter the 6-digit code sent to <strong>{pendingEmail || email}</strong></p>
            <Field label="Verification Code" value={code} onChange={setCode} placeholder="123456" autoFocus />
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}
            <button className="auth-submit" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Verifying…' : 'Verify Email'}
            </button>
            <div className="auth-links">
              <button onClick={handleResend} disabled={loading}>Resend code</button>
              <button onClick={() => { reset(); setView(VIEWS.LOGIN); }}>Back to sign in</button>
            </div>
          </>
        )}

        {view === VIEWS.FORGOT && (
          <>
            <h2>Reset Password</h2>
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus />
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}
            <button className="auth-submit" onClick={handleForgot} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Code'}
            </button>
            <div className="auth-links">
              <button onClick={() => { reset(); setView(VIEWS.LOGIN); }}>Back to sign in</button>
            </div>
          </>
        )}

        {view === VIEWS.RESET && (
          <>
            <h2>New Password</h2>
            <Field label="Reset Code" value={code} onChange={setCode} placeholder="123456" autoFocus />
            <Field label="New Password" type="password" value={newPass} onChange={setNewPass} placeholder="Min. 8 characters" />
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}
            <button className="auth-submit" onClick={handleReset} disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
            <div className="auth-links">
              <button onClick={() => { reset(); setView(VIEWS.LOGIN); }}>Back to sign in</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
