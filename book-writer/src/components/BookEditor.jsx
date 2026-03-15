import { useState, useEffect, useCallback, useRef } from 'react';
import { getBook, saveBook, createChapter } from '../utils/storage';
import ExportImportModal from './ExportImportModal';
import './BookEditor.css';

export default function BookEditor({ bookId, onBack }) {
  const [book, setBook] = useState(null);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingChapterTitle, setEditingChapterTitle] = useState(null);
  const [saved, setSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [showExportImport, setShowExportImport] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    const b = getBook(bookId);
    if (b) {
      setBook(b);
      setActiveChapterId(b.chapters[0]?.id || null);
    }
  }, [bookId]);

  const activeChapter = book?.chapters?.find((c) => c.id === activeChapterId);

  const countWords = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  useEffect(() => {
    if (activeChapter) {
      setWordCount(countWords(activeChapter.content));
    }
  }, [activeChapter]);

  const persistBook = useCallback((updatedBook) => {
    const withTimestamp = { ...updatedBook, updatedAt: new Date().toISOString() };
    saveBook(withTimestamp);
    setSaved(true);
  }, []);

  const scheduleAutoSave = useCallback((updatedBook) => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistBook(updatedBook), 1000);
  }, [persistBook]);

  const handleContentChange = (content) => {
    const updated = {
      ...book,
      chapters: book.chapters.map((c) =>
        c.id === activeChapterId ? { ...c, content } : c
      ),
    };
    setBook(updated);
    setWordCount(countWords(content));
    scheduleAutoSave(updated);
  };

  const handleBookTitleSave = (newTitle) => {
    if (!newTitle.trim()) return;
    const updated = { ...book, title: newTitle.trim() };
    setBook(updated);
    persistBook(updated);
    setEditingTitle(false);
  };

  const handleChapterTitleSave = (chapterId, newTitle) => {
    if (!newTitle.trim()) return;
    const updated = {
      ...book,
      chapters: book.chapters.map((c) =>
        c.id === chapterId ? { ...c, title: newTitle.trim() } : c
      ),
    };
    setBook(updated);
    persistBook(updated);
    setEditingChapterTitle(null);
  };

  const addChapter = () => {
    const chapter = createChapter(`Chapter ${book.chapters.length + 1}`);
    const updated = { ...book, chapters: [...book.chapters, chapter] };
    setBook(updated);
    setActiveChapterId(chapter.id);
    persistBook(updated);
  };

  const deleteChapter = (chapterId) => {
    if (book.chapters.length <= 1) return;
    const updated = {
      ...book,
      chapters: book.chapters.filter((c) => c.id !== chapterId),
    };
    setBook(updated);
    if (activeChapterId === chapterId) {
      setActiveChapterId(updated.chapters[0]?.id || null);
    }
    persistBook(updated);
  };

  const handleImport = useCallback(({ chapters: newChapters }) => {
    const updated = { ...book, chapters: [...book.chapters, ...newChapters] };
    setBook(updated);
    persistBook(updated);
    setActiveChapterId(newChapters[0]?.id || activeChapterId);
  }, [book, activeChapterId, persistBook]);

  const totalWords = book?.chapters?.reduce(
    (sum, c) => sum + countWords(c.content), 0
  ) || 0;

  if (!book) return <div className="loading">Loading book...</div>;

  return (
    <div className="book-editor">
      {/* Top bar */}
      <div className="editor-topbar">
        <button className="btn-back" onClick={onBack}>
          ← Library
        </button>

        <div className="editor-book-info">
          {editingTitle ? (
            <TitleInput
              defaultValue={book.title}
              onSave={handleBookTitleSave}
              onCancel={() => setEditingTitle(false)}
            />
          ) : (
            <h1 className="editor-book-title" onClick={() => setEditingTitle(true)} title="Click to edit">
              {book.title}
            </h1>
          )}
          <span className="editor-author">by {book.author}</span>
        </div>

        <button className="btn-export-import" onClick={() => setShowExportImport(true)}>
          ⇅ Export / Import
        </button>

        <div className="editor-status">
          <span className="word-total">{totalWords.toLocaleString()} words total</span>
          <span className={`save-status ${saved ? 'saved' : 'unsaved'}`}>
            {saved ? '✓ Saved' : '● Saving...'}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="editor-main">
        {/* Left panel — Table of Contents */}
        <aside className="toc-panel">
          <div className="toc-header">
            <span>Contents</span>
          </div>
          <ul className="toc-list">
            {book.chapters.map((ch, idx) => (
              <li
                key={ch.id}
                className={`toc-item ${ch.id === activeChapterId ? 'active' : ''}`}
                onClick={() => setActiveChapterId(ch.id)}
              >
                {editingChapterTitle === ch.id ? (
                  <TitleInput
                    defaultValue={ch.title}
                    onSave={(t) => handleChapterTitleSave(ch.id, t)}
                    onCancel={() => setEditingChapterTitle(null)}
                    small
                  />
                ) : (
                  <div className="toc-item-content">
                    <span className="toc-num">{idx + 1}</span>
                    <span
                      className="toc-title"
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingChapterTitle(ch.id); }}
                      title="Double-click to rename"
                    >
                      {ch.title}
                    </span>
                    <span className="toc-words">{countWords(ch.content).toLocaleString()}w</span>
                    {book.chapters.length > 1 && (
                      <button
                        className="toc-delete"
                        title="Delete chapter"
                        onClick={(e) => { e.stopPropagation(); deleteChapter(ch.id); }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <button className="btn-add-chapter" onClick={addChapter}>
            + Add Chapter
          </button>
        </aside>

        {/* Book page */}
        <div className="book-page-container">
          <div className="book-page">
            <div className="page-header">
              <span className="page-book-title">{book.title}</span>
              <span className="page-chapter-title">{activeChapter?.title}</span>
            </div>

            <div className="page-content">
              {activeChapter && (
                <textarea
                  className="page-textarea"
                  value={activeChapter.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={`Begin writing ${activeChapter.title}...\n\nLet your story unfold here. The page is yours.`}
                  spellCheck
                />
              )}
            </div>

            <div className="page-footer">
              <span className="page-words">{wordCount.toLocaleString()} words</span>
              <span className="page-chapter-num">
                Chapter {book.chapters.findIndex((c) => c.id === activeChapterId) + 1} of {book.chapters.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showExportImport && (
        <ExportImportModal
          book={book}
          onClose={() => setShowExportImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}

function TitleInput({ defaultValue, onSave, onCancel, small }) {
  const [value, setValue] = useState(defaultValue);

  const handleKey = (e) => {
    if (e.key === 'Enter') onSave(value);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <input
      className={`inline-title-input ${small ? 'small' : ''}`}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onSave(value)}
      onKeyDown={handleKey}
      autoFocus
      onClick={(e) => e.stopPropagation()}
    />
  );
}
