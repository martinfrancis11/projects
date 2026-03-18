import React, { useState, useCallback } from 'react';
import StockSearch from './components/StockSearch';
import StockChart from './components/StockChart';
import Analysis from './components/Analysis';

const POPULAR = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'JPM',  name: 'JPMorgan' },
];

const PERIODS = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
];

export default function App() {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('3mo');
  const [activeSymbol, setActiveSymbol] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const fetchStock = useCallback(async (symbol, p = period) => {
    setLoading(true);
    setError('');
    setAnalysis('');
    setActiveSymbol(symbol);

    try {
      const res = await fetch(`${__API_URL__}/api/stock/${symbol}?period=${p}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setStockData(json);
    } catch (e) {
      setError(e.message);
      setStockData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    if (activeSymbol) fetchStock(activeSymbol, p);
  };

  const runAnalysis = async () => {
    if (!stockData) return;
    setAnalyzing(true);
    setAnalysis('');

    try {
      const res = await fetch(`${__API_URL__}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stockData.symbol,
          companyName: stockData.companyName,
          data: stockData.data,
          indicators: stockData.indicators,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Analysis failed');
      setAnalysis(json.analysis);
    } catch (e) {
      setAnalysis(`❌ Analysis failed: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const latest = stockData?.data?.slice(-1)[0];
  const prev   = stockData?.data?.slice(-2, -1)[0];
  const dayChg = latest && prev ? latest.close - prev.close : null;
  const dayPct = dayChg !== null && prev ? (dayChg / prev.close * 100) : null;
  const isPos  = dayChg >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>📈</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--blue)' }}>StockIntel</span>
          <span style={{ color: 'var(--text2)', fontSize: 12, marginLeft: 4 }}>AI Market Analysis</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StockSearch onSelect={(sym) => fetchStock(sym)} />
        </div>
      </header>

      <main style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {/* Popular stocks */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'var(--text2)', fontSize: 13, marginRight: 4 }}>Quick select:</span>
          {POPULAR.map(s => (
            <button
              key={s.symbol}
              onClick={() => fetchStock(s.symbol)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)',
                background: activeSymbol === s.symbol ? 'var(--accent)' : 'var(--bg3)',
                color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {s.symbol}
            </button>
          ))}
        </div>

        {/* Stock header info */}
        {stockData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{stockData.companyName}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>{stockData.symbol} · US Equity</div>
            </div>
            {latest && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 700 }}>${latest.close.toFixed(2)}</div>
                {dayChg !== null && (
                  <div style={{ color: isPos ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {isPos ? '▲' : '▼'} ${Math.abs(dayChg).toFixed(2)} ({isPos ? '+' : ''}{dayPct.toFixed(2)}%)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Period selector */}
        {stockData && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: 'var(--text2)', fontSize: 12, marginRight: 4 }}>Period:</span>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                style={{
                  padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)',
                  background: period === p.value ? 'var(--bg3)' : 'transparent',
                  color: period === p.value ? 'var(--blue)' : 'var(--text2)',
                  cursor: 'pointer', fontSize: 13, fontWeight: period === p.value ? 700 : 400,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading / Error */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>Fetching market data…</div>
          </div>
        )}
        {error && (
          <div style={{ background: '#2d1b1b', border: '1px solid var(--red)', borderRadius: 8, padding: '12px 16px', color: 'var(--red)' }}>
            ❌ {error}
          </div>
        )}

        {/* Chart */}
        {!loading && stockData && (
          <StockChart
            data={stockData.data}
            indicators={stockData.indicators}
            symbol={stockData.symbol}
          />
        )}

        {/* Analyze button */}
        {stockData && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              style={{
                padding: '12px 32px',
                background: analyzing ? 'var(--bg3)' : 'linear-gradient(135deg, #1f6feb, #388bfd)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: analyzing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: analyzing ? 'none' : '0 4px 15px rgba(31,111,235,0.4)',
                transition: 'all 0.2s',
              }}
            >
              {analyzing ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
                  Claude is analysing…
                </>
              ) : (
                <>🤖 Analyse with Claude AI</>
              )}
            </button>
          </div>
        )}

        {/* Analysis panel */}
        {(analysis || analyzing) && (
          <Analysis text={analysis} loading={analyzing} symbol={activeSymbol} />
        )}

        {/* Empty state */}
        {!stockData && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              Market Trend Analysis
            </div>
            <div style={{ fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
              Search for a US stock or click a quick-select button above to load a candlestick chart and get AI-powered buy/sell analysis.
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
