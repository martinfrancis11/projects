import { useState } from 'react';
import { reviews as initialReviews } from '../data/reviews';
import { fabrics } from '../data/fabrics';
import './Community.css';

function StarRating({ rating, onRate }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="stars-interactive">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          className="star-btn"
          onMouseEnter={() => onRate && setHovered(i)}
          onMouseLeave={() => onRate && setHovered(0)}
          onClick={() => onRate && onRate(i)}
          style={{
            color: i <= (hovered || rating) ? '#f59e0b' : '#334155',
            fontSize: '1.4rem',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const [likes, setLikes] = useState(review.likes);
  const [liked, setLiked] = useState(false);
  const fabric = fabrics.find(f => f.id === review.fabricId);

  const handleLike = () => {
    if (!liked) {
      setLikes(l => l + 1);
      setLiked(true);
    }
  };

  return (
    <div className="review-card">
      <div className="review-card-header">
        <span className="review-avatar">{review.avatar}</span>
        <div className="review-meta">
          <div className="review-name">
            {review.userName}
            {review.verified && <span className="review-verified">✓ Verified</span>}
          </div>
          <div className="review-sub">
            <div className="stars">
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ color: i <= review.rating ? '#f59e0b' : '#334155' }}>★</span>
              ))}
            </div>
            {fabric && (
              <span className="review-fabric-tag">
                🧵 {fabric.name}
              </span>
            )}
          </div>
        </div>
        <span className="review-date">{review.date}</span>
      </div>
      <h3 className="review-title">{review.title}</h3>
      <p className="review-body">{review.body}</p>
      <div className="review-footer">
        <button
          className={`review-like-btn${liked ? ' liked' : ''}`}
          onClick={handleLike}
        >
          👍 {likes} helpful
        </button>
      </div>
    </div>
  );
}

function WriteReviewModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    userName: '',
    fabricId: '',
    rating: 0,
    title: '',
    body: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.userName.trim()) e.userName = 'Name is required';
    if (!form.fabricId) e.fabricId = 'Please select a fabric';
    if (!form.rating) e.rating = 'Please give a star rating';
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.body.trim().length < 20) e.body = 'Review must be at least 20 characters';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>✍️ Write a Review</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="e.g. Sarah M."
              value={form.userName}
              onChange={e => setForm(f => ({ ...f, userName: e.target.value }))}
              className={errors.userName ? 'error' : ''}
            />
            {errors.userName && <span className="form-error">{errors.userName}</span>}
          </div>

          <div className="form-group">
            <label>Fabric</label>
            <select
              value={form.fabricId}
              onChange={e => setForm(f => ({ ...f, fabricId: e.target.value }))}
              className={errors.fabricId ? 'error' : ''}
            >
              <option value="">Select a fabric...</option>
              {fabrics.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {errors.fabricId && <span className="form-error">{errors.fabricId}</span>}
          </div>

          <div className="form-group">
            <label>Rating</label>
            <StarRating rating={form.rating} onRate={r => setForm(f => ({ ...f, rating: r }))} />
            {errors.rating && <span className="form-error">{errors.rating}</span>}
          </div>

          <div className="form-group">
            <label>Review Title</label>
            <input
              type="text"
              placeholder="Summarise your experience..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label>Your Review</label>
            <textarea
              placeholder="Share your experience with this fabric..."
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={4}
              className={errors.body ? 'error' : ''}
            />
            {errors.body && <span className="form-error">{errors.body}</span>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Review</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const SORTS = [
  { key: 'newest',     label: 'Newest First' },
  { key: 'liked',      label: 'Most Liked' },
  { key: 'highest',    label: 'Highest Rated' },
  { key: 'lowest',     label: 'Lowest Rated' },
];

export default function Community() {
  const [allReviews, setAllReviews] = useState(initialReviews);
  const [sortBy, setSortBy] = useState('newest');
  const [filterFabric, setFilterFabric] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmitReview = (form) => {
    const fabric = fabrics.find(f => f.id === form.fabricId);
    const newReview = {
      id: Date.now(),
      userId: 'anon',
      userName: form.userName,
      avatar: '🙂',
      fabricId: form.fabricId,
      rating: form.rating,
      title: form.title,
      body: form.body,
      likes: 0,
      date: new Date().toISOString().slice(0, 10),
      verified: false,
    };
    setAllReviews(r => [newReview, ...r]);
    setShowModal(false);
    setSuccessMsg(`Thanks, ${form.userName}! Your review of ${fabric?.name} has been posted.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const filtered = allReviews.filter(r =>
    filterFabric === 'all' || r.fabricId === filterFabric
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'liked')  return b.likes - a.likes;
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest')  return a.rating - b.rating;
    return 0;
  });

  return (
    <div className="community-page">
      <div className="page-header">
        <h1>💬 Community Reviews</h1>
        <p>Real experiences from real people — shared to help you choose better fabrics</p>
      </div>

      <div className="container community-container">
        {/* Success message */}
        {successMsg && (
          <div className="community-success">
            ✅ {successMsg}
          </div>
        )}

        {/* Toolbar */}
        <div className="community-toolbar">
          <div className="community-toolbar-left">
            <select
              value={filterFabric}
              onChange={e => setFilterFabric(e.target.value)}
              className="community-select"
            >
              <option value="all">All Fabrics</option>
              {fabrics.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="community-select"
            >
              {SORTS.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            ✍️ Write a Review
          </button>
        </div>

        {/* Count */}
        <p className="community-count">
          {sorted.length} review{sorted.length !== 1 ? 's' : ''}
          {filterFabric !== 'all' && ` for ${fabrics.find(f => f.id === filterFabric)?.name}`}
        </p>

        {/* Reviews */}
        <div className="community-reviews">
          {sorted.length > 0 ? (
            sorted.map(r => <ReviewCard key={r.id} review={r} />)
          ) : (
            <div className="fabric-lib-empty">
              <span>😕</span>
              <p>No reviews yet. Be the first to write one!</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                Write a Review
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <WriteReviewModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}
