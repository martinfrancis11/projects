import { useState } from 'react';
import { useBooks } from '../hooks/useBooks';
import { useAuth } from '../contexts/AuthContext';
import NewBookModal from './NewBookModal';
import './Library.css';

const COVER_COLORS = [
  '#8B1A1A', '#1A3A8B', '#1A6B1A', '#6B1A6B', '#6B4E1A',
  '#1A5F6B', '#8B5A1A', '#4A1A8B', '#8B3A1A', '#1A4A3A',
];

export default function Library({ onOpenBook }) {
  const { books, sharedBooks, loading, error, addBook, removeBook } = useBooks();
  const { user, signOut } = useAuth();
  const [showModal, setShowModal]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tab, setTab]                   = useState('mine'); // 'mine' | 'shared'

  const handleCreate = async (title, author, genre, coverColor) => {
    const book = await addBook(title, author, genre, coverColor);
    setShowModal(false);
    onOpenBook(book.bookId || book.id, false);
  };

  const displayBooks = tab === 'mine' ? books : sharedBooks;

  return (
    <div className="library">
      <header className="library-header">
        <div className="library-title-area">
          <span className="library-icon">📚</span>
          <h1 className="library-title">My Book Library</h1>
        </div>

        <div className="library-header-right">
          <div className="user-info">
            <span className="user-avatar">{user?.name?.[0]?.toUpperCase() || '?'}</span>
            <span className="user-name">{user?.name}</span>
          </div>
          <button className="btn-new-book" onClick={() => setShowModal(true)}>+ New Book</button>
          <button className="btn-signout" onClick={signOut} title="Sign out">Sign Out</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="library-tabs">
        <button className={`lib-tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
          My Books <span className="tab-count">{books.length}</span>
        </button>
        <button className={`lib-tab ${tab === 'shared' ? 'active' : ''}`} onClick={() => setTab('shared')}>
          Shared with Me <span className="tab-count">{sharedBooks.length}</span>
        </button>
      </div>

      {loading && <div className="library-loading">Loading your library…</div>}
      {error   && <div className="library-error">Could not load books: {error}</div>}

      {!loading && displayBooks.length === 0 ? (
        <div className="library-empty">
          {tab === 'mine' ? (
            <>
              <div className="empty-icon">✍️</div>
              <h2>Your library is empty</h2>
              <p>Start your writing journey by creating your first book.</p>
              <button className="btn-new-book large" onClick={() => setShowModal(true)}>
                Create Your First Book
              </button>
            </>
          ) : (
            <>
              <div className="empty-icon">📬</div>
              <h2>No books shared with you yet</h2>
              <p>When someone shares a book with you it will appear here.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bookshelf">
          {displayBooks.map((book) => {
            const id = book.bookId || book.id;
            const isShared = !!book._shared;
            return (
              <div key={id} className="book-item" onClick={() => onOpenBook(id, isShared)}>
                <div className="book-spine" style={{ backgroundColor: book.coverColor || '#8B4513' }} />
                <div className="book-cover" style={{ backgroundColor: book.coverColor || '#8B4513' }}>
                  {isShared && <div className="shared-badge">Shared</div>}
                  <div className="book-cover-inner">
                    <div className="book-cover-title">{book.title}</div>
                    <div className="book-cover-author">by {book.author}</div>
                    <div className="book-cover-genre">{book.genre}</div>
                    {isShared && <div className="book-cover-sharedby">from {book._sharedBy}</div>}
                    {!isShared && (
                      <div className="book-cover-chapters">
                        {book.chapters?.length || 0} chapter{(book.chapters?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="book-actions">
                  <button className="btn-open" onClick={e => { e.stopPropagation(); onOpenBook(id, isShared); }}>
                    {isShared ? 'Read' : 'Open'}
                  </button>
                  {!isShared && (
                    <button className="btn-delete" onClick={e => { e.stopPropagation(); setConfirmDelete(id); }}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Book?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-confirm-delete" onClick={() => { removeBook(confirmDelete); setConfirmDelete(null); }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
