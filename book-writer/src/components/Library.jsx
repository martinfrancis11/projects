import { useState } from 'react';
import { useBooks } from '../hooks/useBooks';
import NewBookModal from './NewBookModal';
import './Library.css';

const COVER_COLORS = [
  '#8B1A1A', '#1A3A8B', '#1A6B1A', '#6B1A6B', '#6B4E1A',
  '#1A5F6B', '#8B5A1A', '#4A1A8B', '#8B3A1A', '#1A4A3A',
];

export default function Library({ onOpenBook }) {
  const { books, addBook, removeBook } = useBooks();
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleCreate = (title, author, genre, coverColor) => {
    const book = addBook(title, author, genre, coverColor);
    setShowModal(false);
    onOpenBook(book.id);
  };

  return (
    <div className="library">
      <header className="library-header">
        <div className="library-title-area">
          <span className="library-icon">📚</span>
          <h1 className="library-title">My Book Library</h1>
        </div>
        <button className="btn-new-book" onClick={() => setShowModal(true)}>
          + New Book
        </button>
      </header>

      {books.length === 0 ? (
        <div className="library-empty">
          <div className="empty-icon">✍️</div>
          <h2>Your library is empty</h2>
          <p>Start your writing journey by creating your first book.</p>
          <button className="btn-new-book large" onClick={() => setShowModal(true)}>
            Create Your First Book
          </button>
        </div>
      ) : (
        <div className="bookshelf">
          {books.map((book) => (
            <div key={book.id} className="book-item" onClick={() => onOpenBook(book.id)}>
              <div className="book-spine" style={{ backgroundColor: book.coverColor || '#8B4513' }} />
              <div className="book-cover" style={{ backgroundColor: book.coverColor || '#8B4513' }}>
                <div className="book-cover-inner">
                  <div className="book-cover-title">{book.title}</div>
                  <div className="book-cover-author">by {book.author}</div>
                  <div className="book-cover-genre">{book.genre}</div>
                  <div className="book-cover-chapters">
                    {book.chapters?.length || 0} chapter{(book.chapters?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="book-actions">
                <button
                  className="btn-open"
                  onClick={(e) => { e.stopPropagation(); onOpenBook(book.id); }}
                >
                  Open
                </button>
                <button
                  className="btn-delete"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(book.id); }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewBookModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          colors={COVER_COLORS}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Book?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn-confirm-delete"
                onClick={() => { removeBook(confirmDelete); setConfirmDelete(null); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
