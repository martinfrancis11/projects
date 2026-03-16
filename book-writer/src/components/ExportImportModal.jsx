import { useRef, useState } from 'react';
import { exportToPDF, exportToWord } from '../utils/exporters';
import { importFromPDF, importFromWord } from '../utils/importers';
import './ExportImportModal.css';

export default function ExportImportModal({ book, onClose, onImport }) {
  const [tab, setTab] = useState('export'); // 'export' | 'import'
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState('');
  const [exporting, setExporting] = useState('');
  const fileRef = useRef();

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      await exportToPDF(book);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting('');
    }
  };

  const handleExportWord = async () => {
    setExporting('word');
    try {
      await exportToWord(book);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting('');
    }
  };

  // ── Import ──────────────────────────────────────────────────────────────────

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError('');
    setImportPreview(null);
    setImporting(true);

    try {
      let result;
      if (file.name.match(/\.pdf$/i)) {
        result = await importFromPDF(file);
      } else if (file.name.match(/\.docx?$/i)) {
        result = await importFromWord(file);
      } else {
        setImportError('Unsupported file type. Please choose a .pdf or .docx file.');
        return;
      }
      setImportPreview({ ...result, fileName: file.name });
    } catch (err) {
      console.error(err);
      setImportError(`Failed to read file: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    onImport(importPreview);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ei-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ei-header">
          <div className="ei-tabs">
            <button className={`ei-tab ${tab === 'export' ? 'active' : ''}`} onClick={() => setTab('export')}>
              Export
            </button>
            <button className={`ei-tab ${tab === 'import' ? 'active' : ''}`} onClick={() => setTab('import')}>
              Import
            </button>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ei-body">
          {tab === 'export' && (
            <div className="ei-section">
              <p className="ei-desc">
                Export <strong>"{book.title}"</strong> with all {book.chapters.length} chapter{book.chapters.length !== 1 ? 's' : ''}.
              </p>

              <div className="ei-cards">
                <div className="ei-card">
                  <div className="ei-card-icon">📄</div>
                  <div className="ei-card-info">
                    <h3>PDF <span className="kdp-badge">KDP 6×9</span></h3>
                    <p>6″×9″ trim, mirror margins, half-title &amp; copyright pages, TOC, ornamental chapter openers, mirrored page numbers, 11pt body text.</p>
                  </div>
                  <button
                    className="ei-btn pdf"
                    onClick={handleExportPDF}
                    disabled={!!exporting}
                  >
                    {exporting === 'pdf' ? 'Generating...' : 'Export PDF'}
                  </button>
                </div>

                <div className="ei-card">
                  <div className="ei-card-icon">📝</div>
                  <div className="ei-card-info">
                    <h3>Word (.docx) <span className="kdp-badge">KDP 6×9</span></h3>
                    <p>6″×9″ page, mirror margins (0.75″ gutter / 0.5″ outside), alternating headers, per-section chapter layout — upload-ready for KDP.</p>
                  </div>
                  <button
                    className="ei-btn word"
                    onClick={handleExportWord}
                    disabled={!!exporting}
                  >
                    {exporting === 'word' ? 'Generating...' : 'Export Word'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'import' && (
            <div className="ei-section">
              <p className="ei-desc">
                Import a PDF or Word document. Chapters will be auto-detected and added to this book.
              </p>

              {!importPreview && (
                <div
                  className="ei-dropzone"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      fileRef.current.files = dt.files;
                      handleFileChange({ target: fileRef.current });
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={fileRef}
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  {importing ? (
                    <div className="ei-loading">
                      <div className="ei-spinner" />
                      <span>Reading file...</span>
                    </div>
                  ) : (
                    <>
                      <div className="ei-drop-icon">📂</div>
                      <div className="ei-drop-text">
                        <strong>Click to browse</strong> or drag &amp; drop
                      </div>
                      <div className="ei-drop-hint">Supports .pdf and .docx files</div>
                    </>
                  )}
                </div>
              )}

              {importError && (
                <div className="ei-error">{importError}</div>
              )}

              {importPreview && (
                <div className="ei-preview">
                  <div className="ei-preview-header">
                    <span className="ei-preview-file">📄 {importPreview.fileName}</span>
                    <button className="ei-preview-reset" onClick={() => { setImportPreview(null); setImportError(''); }}>
                      Choose different file
                    </button>
                  </div>
                  <div className="ei-preview-info">
                    <div className="ei-preview-row">
                      <span>Detected title</span>
                      <strong>{importPreview.guessedTitle}</strong>
                    </div>
                    <div className="ei-preview-row">
                      <span>Chapters found</span>
                      <strong>{importPreview.chapters.length}</strong>
                    </div>
                  </div>
                  <ul className="ei-chapter-list">
                    {importPreview.chapters.map((ch, i) => (
                      <li key={i} className="ei-chapter-item">
                        <span className="ei-ch-num">{i + 1}</span>
                        <span className="ei-ch-title">{ch.title}</span>
                        <span className="ei-ch-words">
                          {ch.content.trim() ? ch.content.trim().split(/\s+/).length : 0}w
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="ei-import-note">
                    These chapters will be <strong>appended</strong> to your current book.
                  </p>
                  <div className="modal-actions">
                    <button className="btn-cancel" onClick={() => setImportPreview(null)}>Cancel</button>
                    <button className="ei-btn word" onClick={handleConfirmImport}>
                      Import {importPreview.chapters.length} Chapter{importPreview.chapters.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
