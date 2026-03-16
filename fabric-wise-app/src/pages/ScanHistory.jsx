import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadScans, deleteScan } from '../utils/scanHistory';
import './ScanHistory.css';

function scoreColor(s) {
  if (s >= 80) return '#4ade80';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function ScanHistory() {
  const [scans, setScans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadScans().then(data => { setScans(data); setLoading(false); });
  }, []);

  const handleDelete = async (scanId) => {
    setDeleting(scanId);
    const ok = await deleteScan(scanId);
    if (ok) setScans(prev => prev.filter(s => s.scanId !== scanId));
    setDeleting(null);
  };

  return (
    <div className="history-page">
      <div className="page-header">
        <h1>🕓 Scan History</h1>
        <p>All your previous barcode scans on this device</p>
      </div>

      <div className="container history-container">

        {loading && (
          <div className="history-loading">
            <div className="history-spinner" />
            <p>Loading your scan history...</p>
          </div>
        )}

        {!loading && scans.length === 0 && (
          <div className="history-empty">
            <div className="history-empty-icon">📭</div>
            <h3>No scans yet</h3>
            <p>Scan a clothing label or search a barcode to start building your history.</p>
            <Link to="/scanner" className="btn btn-primary">Go to Scanner →</Link>
          </div>
        )}

        {!loading && scans.length > 0 && (
          <>
            <p className="history-count">{scans.length} scan{scans.length !== 1 ? 's' : ''} recorded on this device</p>
            <div className="history-list">
              {scans.map(scan => (
                <div key={scan.scanId} className="history-card">
                  {/* Header */}
                  <div className="history-card-header">
                    {scan.imageUrl ? (
                      <img src={scan.imageUrl} alt={scan.name} className="history-card-img" />
                    ) : (
                      <div className="history-card-img-placeholder">🏷️</div>
                    )}
                    <div className="history-card-info">
                      <div className="history-card-name">{scan.name || scan.barcode || 'Unknown Product'}</div>
                      {scan.brand && <div className="history-card-brand">{scan.brand}</div>}
                      <div className="history-card-meta">
                        <span className="history-source-badge">{scan.source || 'Unknown'}</span>
                        <span className="history-card-date">{formatDate(scan.scannedAt)}</span>
                      </div>
                    </div>
                    <button
                      className="history-delete-btn"
                      onClick={() => handleDelete(scan.scanId)}
                      disabled={deleting === scan.scanId}
                      aria-label="Delete scan"
                    >
                      {deleting === scan.scanId ? '...' : '✕'}
                    </button>
                  </div>

                  {/* Barcode */}
                  <div className="history-barcode">
                    <span>Barcode:</span> <code>{scan.barcode}</code>
                  </div>

                  {/* Raw materials text */}
                  {scan.materialsRaw && (
                    <div className="history-materials-raw">
                      <span>Label text:</span> {scan.materialsRaw}
                    </div>
                  )}

                  {/* Matched fabrics */}
                  {scan.matchedFabrics?.length > 0 ? (
                    <div className="history-fabrics">
                      {scan.matchedFabrics.map(f => {
                        const sc = scoreColor(f.healthScore);
                        return (
                          <Link key={f.id} to={`/fabrics/${f.id}`} className="history-fabric-chip">
                            <span className="history-fabric-name">{f.name}</span>
                            {f.isoCode && <span className="history-fabric-iso">{f.isoCode}</span>}
                            <span className="history-fabric-score" style={{ color: sc, borderColor: sc }}>
                              {f.healthScore}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="history-no-fabric">No fabric composition detected</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
