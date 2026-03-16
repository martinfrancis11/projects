import { useState, useEffect, useCallback, useRef } from 'react';
import { getCachedBooks, apiSaveBook } from '../utils/api';
import { createChapter } from '../utils/storage';
import ExportImportModal from './ExportImportModal';
import ShareModal from './ShareModal';
import AudioPlayer from './AudioPlayer';
import './BookEditor.css';

export default function BookEditor({ bookId, readOnly, onBack }) {
  const [book, setBook]                 = useState(null);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingChapterTitle, setEditingChapterTitle] = useState(null);
  const [saved, setSaved]               = useState(true);
  const [wordCount, setWordCount]       = useState(0);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showShare, setShowShare]       = useState(false);
  const [showAudio, setShowAudio]       = useState(false);
  const saveTimer = useRef(null);

  // Load book from cache (already fetched at login)
  useEffect(() => {
    const { books, sharedBooks } = getCachedBooks();
    const all = [...books, ...sharedBooks];
    const b = all.find(x => (x.bookId || x.id) === bookId);
    if (b) {
      setBook(b);
      setActiveChapterId(b.chapters?.[0]?.id || null);
    }
  }, [bookId]);

  const activeChapter = book?.chapters?.find(c => c.id === activeChapterId);

  const countWords = t => t.trim() ? t.trim().split(/\s+/).length : 0;

  useEffect(() => {
    if (activeChapter) setWordCount(countWords(activeChapter.content));
  }, [activeChapter]);

  // Persist to API (debounced)
  const persistBook = useCallback((updatedBook) => {
    const b = { ...updatedBook, updatedAt: new Date().toISOString() };
    apiSaveBook(b).then(() => setSaved(true)).catch(console.error);
  }, []);

  const scheduleAutoSave = useCallback((updatedBook) => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistBook(updatedBook), 2000);
  }, [persistBook]);

  const handleContentChange = (content) => {
    if (readOnly) return;
    const updated = {
      ...book,
      chapters: book.chapters.map(c =>
        c.id === activeChapterId ? { ...c, content } : c
      ),
    };
    setBook(updated);
    setWordCount(countWords(content));
    scheduleAutoSave(updated);
  };

  const handleBookTitleSave = (newTitle) => {
    if (!newTitle.trim() || readOnly) return;
    const updated = { ...book, title: newTitle.trim() };
    setBook(updated);
    persistBook(updated);
    setEditingTitle(false);
  };

  const handleChapterTitleSave = (chapterId, newTitle) => {
    if (!newTitle.trim() || readOnly) return;
    const updated = {
      ...book,
      chapters: book.chapters.map(c =>
        c.id === chapterId ? { ...c, title: newTitle.trim() } : c
      ),
    };
    setBook(updated);
    persistBook(updated);
    setEditingChapterTitle(null);
  };

  const addChapter = () => {
    if (readOnly) return;
    const chapter = createChapter(`Chapter ${book.chapters.length + 1}`);
    const updated = { ...book, chapters: [...book.chapters, chapter] };
    setBook(updated);
    setActiveChapterId(chapter.id);
    persistBook(updated);
  };

  const deleteChapter = (chapterId) => {
    if (readOnly || book.chapters.length <= 1) return;
    const updated = { ...book, chapters: book.chapters.filter(c => c.id !== chapterId) };
    setBook(updated);
    if (activeChapterId === chapterId) setActiveChapterId(updated.chapters[0]?.id || null);
    persistBook(updated);
  };

  const handleImport = useCallback(({ chapters: newChapters }) => {
    if (readOnly) return;
    const updated = { ...book, chapters: [...book.chapters, ...newChapters] };
    setBook(updated);
    persistBook(updated);
    setActiveChapterId(newChapters[0]?.id || activeChapterId);
  }, [book, activeChapterId, persistBook, readOnly]);

  const totalWords = book?.chapters?.reduce((s, c) => s + countWords(c.content), 0) || 0;

  if (!book) return <div className="loading">Loading book…</div>;

  return (
    <div className="book-editor">
      {/* Top bar */}
      <div className="editor-topbar">
        <button className="btn-back" onClick={onBack}>← Library</button>

        <div className="editor-book-info">
          {editingTitle && !readOnly ? (
            <TitleInput defaultValue={book.title} onSave={handleBookTitleSave} onCancel={() => setEditingTitle(false)} />
          ) : (
            <h1
              className="editor-book-title"
              onClick={() => !readOnly && setEditingTitle(true)}
              title={readOnly ? '' : 'Click to edit'}
              style={{ cursor: readOnly ? 'default' : 'pointer' }}
            >
              {book.title}
              {readOnly && <span className="readonly-badge">Read Only</span>}
            </h1>
          )}
          <span className="editor-author">by {book.author}</span>
        </div>

        <div className="topbar-actions">
          {!readOnly && (
            <button className="btn-share-book" onClick={() => setShowShare(true)}>
              ↗ Share
            </button>
          )}
          <button className="btn-listen" onClick={() => setShowAudio(a => !a)}>
            {showAudio ? '⏹ Close Player' : '▶ Listen'}
          </button>
          <button className="btn-export-import" onClick={() => setShowExportImport(true)}>
            ⇅ Export / Import
          </button>
        </div>

        <div className="editor-status">
          <span className="word-total">{totalWords.toLocaleString()} words</span>
          {!readOnly && (
            <span className={`save-status ${saved ? 'saved' : 'unsaved'}`}>
              {saved ? '✓ Saved' : '● Saving…'}
            </span>
          )}
        </div>
      </div>

      {/* Audio player */}
      {showAudio && (
        <AudioPlayer
          text={activeChapter?.content || ''}
          chapterTitle={activeChapter?.title || ''}
          bookTitle={book.title}
        />
      )}

      {/* Main area */}
      <div className="editor-main">
        <aside className="toc-panel">
          <div className="toc-header"><span>Contents</span></div>
          <ul className="toc-list">
            {book.chapters.map((ch, idx) => (
              <li
                key={ch.id}
                className={`toc-item ${ch.id === activeChapterId ? 'active' : ''}`}
                onClick={() => setActiveChapterId(ch.id)}
              >
                {editingChapterTitle === ch.id && !readOnly ? (
                  <TitleInput
                    defaultValue={ch.title}
                    onSave={t => handleChapterTitleSave(ch.id, t)}
                    onCancel={() => setEditingChapterTitle(null)}
                    small
                  />
                ) : (
                  <div className="toc-item-content">
                    <span className="toc-num">{idx + 1}</span>
                    <span
                      className="toc-title"
                      onDoubleClick={e => { if (!readOnly) { e.stopPropagation(); setEditingChapterTitle(ch.id); } }}
                      title={readOnly ? '' : 'Double-click to rename'}
                    >
                      {ch.title}
                    </span>
                    <span className="toc-words">{countWords(ch.content).toLocaleString()}w</span>
                    {!readOnly && book.chapters.length > 1 && (
                      <button className="toc-delete" onClick={e => { e.stopPropagation(); deleteChapter(ch.id); }}>✕</button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {!readOnly && (
            <button className="btn-add-chapter" onClick={addChapter}>+ Add Chapter</button>
          )}
        </aside>

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
                  onChange={e => handleContentChange(e.target.value)}
                  placeholder={readOnly ? '' : `Begin writing ${activeChapter.title}…\n\nLet your story unfold here.`}
                  readOnly={readOnly}
                  spellCheck={!readOnly}
                  style={{ cursor: readOnly ? 'default' : 'text' }}
                />
              )}
            </div>
            <div className="page-footer">
              <span className="page-words">{wordCount.toLocaleString()} words</span>
              <span className="page-chapter-num">
                Chapter {book.chapters.findIndex(c => c.id === activeChapterId) + 1} of {book.chapters.length}
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

      {showShare && (
        <ShareModal
          book={book}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

function TitleInput({ defaultValue, onSave, onCancel, small }) {
  const [value, setValue] = useState(defaultValue);
  const handleKey = e => {
    if (e.key === 'Enter') onSave(value);
    if (e.key === 'Escape') onCancel();
  };
  return (
    <input
      className={`inline-title-input ${small ? 'small' : ''}`}
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={() => onSave(value)}
      onKeyDown={handleKey}
      autoFocus
      onClick={e => e.stopPropagation()}
    />
  );
}
