import { useState } from 'react';
import './NewBookModal.css';

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Fantasy', 'Sci-Fi', 'Romance', 'Thriller', 'Biography', 'History', 'Poetry', 'Other'];

export default function NewBookModal({ onClose, onCreate, colors }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Fiction');
  const [coverColor, setCoverColor] = useState(colors[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a book title.'); return; }
    if (!author.trim()) { setError('Please enter an author name.'); return; }
    onCreate(title.trim(), author.trim(), genre, coverColor);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal new-book-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Book</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Book Title</label>
            <input
              type="text"
              placeholder="Enter your book title..."
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Author Name</label>
            <input
              type="text"
              placeholder="Your name..."
              value={author}
              onChange={(e) => { setAuthor(e.target.value); setError(''); }}
            />
          </div>

          <div className="form-group">
            <label>Genre</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Cover Color</label>
            <div className="color-picker">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${coverColor === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCoverColor(c)}
                />
              ))}
            </div>

            <div className="cover-preview" style={{ backgroundColor: coverColor }}>
              <div className="preview-inner">
                <div className="preview-title">{title || 'Book Title'}</div>
                <div className="preview-author">by {author || 'Author'}</div>
                <div className="preview-genre">{genre}</div>
              </div>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-create">Create Book</button>
          </div>
        </form>
      </div>
    </div>
  );
}
