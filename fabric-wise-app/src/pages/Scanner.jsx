import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fabrics } from '../data/fabrics';
import './Scanner.css';

// Mock scan results mapping barcode → fabric id
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

function ScanResult({ fabric, onReset }) {
  const sc = scoreColor(fabric.healthScore);
  return (
    <div className="scanner-result">
      <div className="scanner-result-header">
        <span className="scanner-result-icon">✅</span>
        <div>
          <p className="scanner-result-found">Fabric Identified</p>
          <h2 className="scanner-result-name">{fabric.name}</h2>
        </div>
        <div className="scanner-result-score" style={{ borderColor: sc, color: sc }}>
          {fabric.healthScore}
        </div>
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
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | scanning | denied | error | result | manual
  const [result, setResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const handleScanSuccess = (decodedText) => {
    stopScanner();
    lookupCode(decodedText);
  };

  const lookupCode = (code) => {
    setNotFound(false);
    const trimmed = code.trim();
    // Mock lookup — first check mock map, then try fabric id directly
    const fabricId = mockBarcodes[trimmed] || trimmed;
    const fabric = fabrics.find(f => f.id === fabricId);
    if (fabric) {
      setResult(fabric);
      setStatus('result');
    } else {
      setNotFound(true);
      setStatus('idle');
    }
  };

  const startScanner = async () => {
    setStatus('scanning');
    setNotFound(false);
    setManualError('');

    // Dynamically import html5-qrcode
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {} // ignore ongoing errors
      );
    } catch (err) {
      if (
        err.toString().includes('NotAllowedError') ||
        err.toString().includes('Permission')
      ) {
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
    setResult(null);
    setManualCode('');
    setManualError('');
    setNotFound(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setManualError('Please enter a barcode or fabric ID.');
      return;
    }
    setManualError('');
    lookupCode(manualCode);
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  if (status === 'result' && result) {
    return (
      <div className="scanner-page">
        <div className="page-header">
          <h1>📷 Label Scanner</h1>
          <p>Fabric identified from label scan</p>
        </div>
        <div className="container scanner-container">
          <ScanResult fabric={result} onReset={handleReset} />
        </div>
      </div>
    );
  }

  return (
    <div className="scanner-page">
      <div className="page-header">
        <h1>📷 Label Scanner</h1>
        <p>Point your camera at the barcode or QR code on the clothing label</p>
      </div>

      <div className="container scanner-container">

        {/* Instructions */}
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
            <p>Hold the barcode or QR code within the green frame — we'll identify it instantly.</p>
          </div>
        </div>

        {/* Not found warning */}
        {notFound && (
          <div className="scanner-not-found">
            ⚠️ We couldn't identify that barcode. Try a manual entry below or browse the <Link to="/fabrics">Fabric Library</Link>.
          </div>
        )}

        {/* Camera view */}
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
            <div className="scanner-active-hint">
              🎯 Hold steady — scanning...
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="scanner-controls">
          {status === 'idle' && (
            <button className="btn btn-primary scanner-btn" onClick={startScanner}>
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
          <div className="scanner-manual-divider">
            <span>or enter manually</span>
          </div>
          <form onSubmit={handleManualSubmit} className="scanner-manual-form">
            <input
              type="text"
              placeholder="Enter barcode number or fabric ID (e.g. organic-cotton)"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              className="scanner-manual-input"
            />
            <button type="submit" className="btn btn-outline">
              Look Up
            </button>
          </form>
          {manualError && <p className="scanner-manual-error">{manualError}</p>}
          <p className="scanner-manual-hint">
            Try: <code>organic-cotton</code>, <code>polyester</code>, <code>tencel</code>, <code>123456789012</code>
          </p>
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
