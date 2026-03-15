import { useState, useEffect } from 'react';
import { apiShareBook, apiUnshareBook, apiGetShares } from '../utils/api';
import './ShareModal.css';

export default function ShareModal({ book, onClose }) {
  const [email, setEmail]     = useState('');
  const [shares, setShares]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [msg, setMsg]         = useState(null); // { type: 'ok'|'err', text }

  useEffect(() => {
    apiGetShares(book.bookId)
      .then(d => setShares(d.shares || []))
      .catch(() => setShares([]))
      .finally(() => setFetching(false));
  }, [book.bookId]);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiShareBook(book.bookId, email.trim().toLowerCase());
      setMsg({ type: 'ok', text: res.message });
      setEmail('');
      // refresh share list
      const d = await apiGetShares(book.bookId);
      setShares(d.shares || []);
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (recipientEmail) => {
    try {
      await apiUnshareBook(book.bookId, recipientEmail);
      setShares(prev => prev.filter(s => s.recipientEmail !== recipientEmail));
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-header">
          <div>
            <h2>Share Book</h2>
            <p className="share-book-title">"{book.title}"</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="share-body">
          <form className="share-form" onSubmit={handleShare}>
            <label>Share with (by email)</label>
            <div className="share-input-row">
              <input
                type="email"
                placeholder="reader@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
              <button type="submit" disabled={loading || !email.trim()}>
                {loading ? '…' : 'Share'}
              </button>
            </div>
          </form>

          {msg && (
            <div className={`share-msg ${msg.type}`}>{msg.text}</div>
          )}

          <div className="share-list-header">
            People with access
          </div>

          {fetching ? (
            <div className="share-loading">Loading…</div>
          ) : shares.length === 0 ? (
            <div className="share-empty">Not shared with anyone yet.</div>
          ) : (
            <ul className="share-list">
              {shares.map(s => (
                <li key={s.recipientEmail} className="share-item">
                  <div className="share-avatar">{(s.recipientName || s.recipientEmail)[0].toUpperCase()}</div>
                  <div className="share-item-info">
                    <span className="share-item-name">{s.recipientName || s.recipientEmail}</span>
                    <span className="share-item-email">{s.recipientEmail}</span>
                  </div>
                  <button className="share-remove" onClick={() => handleUnshare(s.recipientEmail)} title="Remove access">✕</button>
                </li>
              ))}
            </ul>
          )}

          <p className="share-note">
            Recipients can read your book but cannot edit it.
          </p>
        </div>
      </div>
    </div>
  );
}
