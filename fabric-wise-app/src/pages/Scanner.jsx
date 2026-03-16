import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fabrics } from '../data/fabrics';
import { fetchProductByBarcode, detectFabrics } from '../utils/openProductsApi';
import './Scanner.css';

// Fallback mock barcodes for testing (used if API returns nothing)
const mockBarcodes = {
  '123456789012': 'organic-cotton',
  '987654321098': 'polyester',
  '555000111222': 'tencel',
  '111222333444': 'acrylic',
};

function scoreColor(s) {
  if (s >= 80) return '#4ade80';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

function ScoreBadge({ score }) {
  const color = scoreColor(score);
  return (
    <div className="scanner-result-score" style={{ borderColor: color, color }}>
      {score}
    </div>
  );
}

// Result from Open Products Facts API
function ApiResult({ product, onReset }) {
  const hasMatches = product.matchedFabrics.length > 0;
  return (
    <div className="scanner-result">
      {/* Source badge */}
      <div className="scanner-source-badge">
        <span className="scanner-source-icon">🌐</span>
        {product.source || 'Open Products Facts'}
      </div>

      {/* Product info */}
      <div className="scanner-api-header">
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="scanner-product-image" />
        )}
        <div>
          <p className="scanner-result-found">Product Identified</p>
          <h2 className="scanner-result-name">{product.name || 'Unknown Product'}</h2>
          {product.brand && <p className="scanner-product-brand">by {product.brand}</p>}
          {product.country && <p className="scanner-product-country">📍 {product.country}</p>}
        </div>
      </div>

      {/* Categories / labels */}
      {(product.categories || product.labels) && (
        <div className="scanner-api-meta">
          {product.categories && (
            <div className="scanner-meta-row">
              <span className="scanner-meta-label">Categories</span>
              <span className="scanner-meta-value">{product.categories}</span>
            </div>
          )}
          {product.labels && (
            <div className="scanner-meta-row">
              <span className="scanner-meta-label">Labels / Certs</span>
              <span className="scanner-meta-value">{product.labels}</span>
            </div>
          )}
          {product.materialsRaw && (
            <div className="scanner-meta-row">
              <span className="scanner-meta-label">Material Text</span>
              <span className="scanner-meta-value">{product.materialsRaw}</span>
            </div>
          )}
        </div>
      )}

      {/* Matched fabrics */}
      {hasMatches ? (
        <div className="scanner-matched-fabrics">
          <p className="scanner-matched-title">Detected Fabrics</p>
          {product.matchedFabrics.map(fabric => {
            const sc = scoreColor(fabric.healthScore);
            return (
              <div key={fabric.id} className="scanner-matched-fabric">
                <div className="scanner-matched-info">
                  <div className="scanner-matched-name">{fabric.name}</div>
                  <div className="scanner-matched-iso">
                    ISO {fabric.isoCode} — {fabric.isoName}
                  </div>
                  <div className="scanner-matched-note">{fabric.healthNotes}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <ScoreBadge score={fabric.healthScore} />
                  <Link to={`/fabrics/${fabric.id}`} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="scanner-no-match">
          <span>🔍</span>
          <p>No fabric composition detected in this product's data. Try browsing the <Link to="/fabrics">Fabric Library</Link> manually.</p>
        </div>
      )}

      <div className="scanner-result-actions">
        <button className="btn btn-outline" onClick={onReset}>Scan Another</button>
      </div>
    </div>
  );
}

// Result from local fabric database (mock map or direct ID entry)
function LocalResult({ fabric, onReset }) {
  const sc = scoreColor(fabric.healthScore);
  return (
    <div className="scanner-result">
      <div className="scanner-source-badge scanner-source-badge--local">
        <span className="scanner-source-icon">📚</span>
        FabricIntel Database
      </div>

      <div className="scanner-result-header">
        <div>
          <p className="scanner-result-found">Fabric Identified</p>
          <h2 className="scanner-result-name">{fabric.name}</h2>
          <p className="scanner-matched-iso" style={{ marginTop: '4px' }}>
            ISO {fabric.isoCode} — {fabric.isoName}
          </p>
        </div>
        <ScoreBadge score={fabric.healthScore} />
      </div>

      <p className="scanner-result-note">{fabric.healthNotes}</p>

      <div className="scanner-result-props">
        <div className="scanner-result-prop">
          <span>💨 Breathability</span>
          <strong>{fabric.breathability}</strong>
        </div>
        <div className="scanner-result-prop">
          <span>🌡️ Skin Sensitivity</span>
          <strong>{fabric.skinSensitivity}</strong>
        </div>
        <div className="scanner-result-prop">
          <span>👃 Odor Retention</span>
          <strong>{fabric.odorRetention}</strong>
        </div>
        <div className="scanner-result-prop">
          <span>🌿 Natural Content</span>
          <strong>{fabric.naturalPercent}%</strong>
        </div>
      </div>

      <div className="scanner-result-actions">
        <Link to={`/fabrics/${fabric.id}`} className="btn btn-primary">
          View Full Profile →
        </Link>
        <button className="btn btn-outline" onClick={onReset}>
          Scan Another
        </button>
      </div>
    </div>
  );
}

export default function Scanner() {
  const scannerRef  = useRef(null);
  const html5QrCodeRef = useRef(null);

  const [status, setStatus]         = useState('idle'); // idle | scanning | loading | denied | error | api-result | local-result
  const [apiProduct, setApiProduct] = useState(null);
  const [localFabric, setLocalFabric] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');
  const [notFound, setNotFound]     = useState(false);

  const handleScanSuccess = (decodedText) => {
    stopScanner();
    lookupCode(decodedText);
  };

  const lookupCode = async (code) => {
    const trimmed = code.trim();
    setNotFound(false);
    setManualError('');

    // 1. Check mock barcode map first (for testing)
    const mockFabricId = mockBarcodes[trimmed];
    if (mockFabricId) {
      const fabric = fabrics.find(f => f.id === mockFabricId);
      if (fabric) { setLocalFabric(fabric); setStatus('local-result'); return; }
    }

    // 2. Try Open Products Facts / Open Beauty Facts API
    setStatus('loading');
    const product = await fetchProductByBarcode(trimmed);
    if (product) {
      setApiProduct(product);
      setStatus('api-result');
      return;
    }

    // 3. Try fabric keywords / ISO codes in the raw input itself
    const fromText = detectFabrics(trimmed);
    if (fromText.length > 0) {
      setApiProduct({
        barcode: trimmed,
        name: trimmed,
        brand: '',
        categories: '',
        labels: '',
        materialsRaw: trimmed,
        imageUrl: '',
        country: '',
        combinedText: trimmed,
        matchedFabrics: fromText,
      });
      setStatus('api-result');
      return;
    }

    // 4. Try direct fabric ID match (e.g. user typed "organic-cotton")
    const directFabric = fabrics.find(f => f.id === trimmed.toLowerCase());
    if (directFabric) {
      setLocalFabric(directFabric);
      setStatus('local-result');
      return;
    }

    // 5. Nothing found
    setNotFound(true);
    setStatus('idle');
  };

  const startScanner = async () => {
    setStatus('scanning');
    setNotFound(false);
    setManualError('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {}
      );
    } catch (err) {
      if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission')) {
        setStatus('denied');
      } else {
        setStatus('error');
      }
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current = null;
    }
  };

  const handleReset = () => {
    stopScanner();
    setStatus('idle');
    setApiProduct(null);
    setLocalFabric(null);
    setManualCode('');
    setManualError('');
    setNotFound(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setManualError('Please enter a barcode or fabric name.');
      return;
    }
    lookupCode(manualCode);
  };

  useEffect(() => { return () => stopScanner(); }, []);

  // --- Result views ---
  if (status === 'api-result' && apiProduct) {
    return (
      <div className="scanner-page">
        <div className="page-header">
          <h1>📷 Label Scanner</h1>
          <p>Product found via Open Products Facts</p>
        </div>
        <div className="container scanner-container">
          <ApiResult product={apiProduct} onReset={handleReset} />
        </div>
      </div>
    );
  }

  if (status === 'local-result' && localFabric) {
    return (
      <div className="scanner-page">
        <div className="page-header">
          <h1>📷 Label Scanner</h1>
          <p>Fabric identified from local database</p>
        </div>
        <div className="container scanner-container">
          <LocalResult fabric={localFabric} onReset={handleReset} />
        </div>
      </div>
    );
  }

  // --- Main scanner view ---
  return (
    <div className="scanner-page">
      <div className="page-header">
        <h1>📷 Label Scanner</h1>
        <p>Point your camera at the barcode or QR code on the clothing label</p>
      </div>

      <div className="container scanner-container">

        {/* How it works */}
        <div className="scanner-instructions">
          <div className="scanner-instruction-step">
            <span className="scanner-step-num">1</span>
            <p>Find the care label on your garment — usually inside the collar or waistband.</p>
          </div>
          <div className="scanner-instruction-step">
            <span className="scanner-step-num">2</span>
            <p>Tap <strong>Start Scanner</strong> and allow camera access when prompted.</p>
          </div>
          <div className="scanner-instruction-step">
            <span className="scanner-step-num">3</span>
            <p>Hold the barcode or QR code within the frame — we'll look it up against the <strong>Open Products Facts</strong> database instantly.</p>
          </div>
        </div>

        {/* Loading state */}
        {status === 'loading' && (
          <div className="scanner-loading">
            <div className="scanner-loading-spinner" />
            <p>Looking up product in Open Products Facts database...</p>
          </div>
        )}

        {/* Not found */}
        {notFound && (
          <div className="scanner-not-found">
            ⚠️ No product found for that code. Try a different barcode, enter a fabric name like <code>cotton</code> or <code>polyester</code>, or browse the <Link to="/fabrics">Fabric Library</Link>.
          </div>
        )}

        {/* Camera */}
        <div className="scanner-camera-area">
          <div id="qr-reader" ref={scannerRef} className="scanner-qr-reader" />
          {status !== 'scanning' && (
            <div className="scanner-overlay">
              <div className="scanner-overlay-frame">
                <div className="scanner-corner tl" />
                <div className="scanner-corner tr" />
                <div className="scanner-corner bl" />
                <div className="scanner-corner br" />
                {status === 'idle' && (
                  <span className="scanner-overlay-text">Camera inactive</span>
                )}
              </div>
            </div>
          )}
          {status === 'scanning' && (
            <div className="scanner-active-hint">🎯 Hold steady — scanning...</div>
          )}
        </div>

        {/* Controls */}
        <div className="scanner-controls">
          {(status === 'idle' || status === 'loading') && (
            <button className="btn btn-primary scanner-btn" onClick={startScanner} disabled={status === 'loading'}>
              📷 Start Scanner
            </button>
          )}
          {status === 'scanning' && (
            <button className="btn btn-ghost scanner-btn" onClick={() => { stopScanner(); setStatus('idle'); }}>
              ⏹ Stop Scanner
            </button>
          )}
          {status === 'denied' && (
            <div className="scanner-denied">
              <span>🚫</span>
              <div>
                <h3>Camera Access Denied</h3>
                <p>Please allow camera access in your browser settings, then refresh the page.</p>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="scanner-denied">
              <span>⚠️</span>
              <div>
                <h3>Camera Error</h3>
                <p>Could not start the camera. Please ensure your device has a camera and try again.</p>
              </div>
            </div>
          )}
        </div>

        {/* Manual entry */}
        <div className="scanner-manual">
          <div className="scanner-manual-divider"><span>or enter manually</span></div>
          <form onSubmit={handleManualSubmit} className="scanner-manual-form">
            <input
              type="text"
              placeholder="Barcode, fabric name or ISO code (e.g. PES, CO, lyocell)"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              className="scanner-manual-input"
            />
            <button type="submit" className="btn btn-outline" disabled={status === 'loading'}>
              {status === 'loading' ? '...' : 'Look Up'}
            </button>
          </form>
          {manualError && <p className="scanner-manual-error">{manualError}</p>}
          <p className="scanner-manual-hint">
            Try ISO codes: <code>CO</code> (Cotton) · <code>PES</code> (Polyester) · <code>CLY</code> (Lyocell) · <code>EL</code> (Elastane) · <code>PA</code> (Nylon)
          </p>
        </div>

        {/* Data source info */}
        <div className="scanner-datasource">
          <span>🌐</span>
          <div>
            Powered by <strong>UPCitemdb</strong> (130M+ products) and <strong>Open Products Facts</strong>.
            Fiber codes follow <strong>ISO 2076</strong> international textile standards.
          </div>
        </div>

        {/* Premium upsell */}
        <div className="scanner-upsell">
          <span>⭐</span>
          <div>
            <strong>Premium Feature:</strong> Save your scan history and get personalised allergen alerts.
          </div>
          <Link to="/premium" className="btn btn-amber" style={{ fontSize: '0.82rem', padding: '7px 14px' }}>
            Upgrade
          </Link>
        </div>
      </div>
    </div>
  );
}
