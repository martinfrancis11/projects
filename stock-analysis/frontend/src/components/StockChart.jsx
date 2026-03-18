import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, LineStyle, ColorType } from 'lightweight-charts';

const CHART_THEME = {
  layout: {
    background: { type: ColorType.Solid, color: '#0d1117' },
    textColor: '#8b949e',
  },
  grid: {
    vertLines: { color: '#21262d' },
    horzLines: { color: '#21262d' },
  },
  rightPriceScale: { borderColor: '#30363d' },
  timeScale: { borderColor: '#30363d', timeVisible: true },
  crosshair: { mode: CrosshairMode.Normal },
};

export default function StockChart({ data, indicators, symbol }) {
  const mainRef   = useRef(null);
  const rsiRef    = useRef(null);
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showRSI,   setShowRSI]   = useState(true);
  const [hovered, setHovered]     = useState(null);
  const [chartError, setChartError] = useState('');

  useEffect(() => {
    if (!mainRef.current || !data?.length) return;

    setChartError('');

    // ── Main chart ──────────────────────────────────────────────────────────
    let mainChart, rsiChart;
    try {
      mainChart = createChart(mainRef.current, {
        ...CHART_THEME,
        autoSize: true,
        height: 380,
      });

      // Candlestick
      const candleSeries = mainChart.addCandlestickSeries({
        upColor:        '#3fb950',
        downColor:      '#f85149',
        borderUpColor:  '#3fb950',
        borderDownColor:'#f85149',
        wickUpColor:    '#3fb950',
        wickDownColor:  '#f85149',
      });
      candleSeries.setData(data.map(d => ({
        time: d.date,
        open: d.open, high: d.high, low: d.low, close: d.close,
      })));

      // Volume
      const volSeries = mainChart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      mainChart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volSeries.setData(data.map(d => ({
        time: d.date,
        value: d.volume,
        color: d.close >= d.open ? '#3fb95055' : '#f8514955',
      })));

      // SMA 20
      const sma20Series = mainChart.addLineSeries({
        color: '#e3b341', lineWidth: 1.5,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false, lastValueVisible: false,
      });
      const sma20Data = indicators.sma20
        .filter(d => d.value !== null)
        .map(d => ({ time: d.date, value: d.value }));
      if (sma20Data.length) sma20Series.setData(sma20Data);

      // SMA 50
      const sma50Series = mainChart.addLineSeries({
        color: '#bc8cff', lineWidth: 1.5,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false, lastValueVisible: false,
      });
      const sma50Data = indicators.sma50
        .filter(d => d.value !== null)
        .map(d => ({ time: d.date, value: d.value }));
      if (sma50Data.length) sma50Series.setData(sma50Data);

      // Crosshair hover info
      mainChart.subscribeCrosshairMove(param => {
        if (!param?.time) { setHovered(null); return; }
        const c = param.seriesData?.get(candleSeries);
        if (c) setHovered({ ...c, time: param.time });
      });

      mainChart.timeScale().fitContent();

      // ── RSI sub-chart ────────────────────────────────────────────────────
      if (rsiRef.current) {
        rsiChart = createChart(rsiRef.current, {
          ...CHART_THEME,
          autoSize: true,
          height: 110,
          timeScale: { ...CHART_THEME.timeScale, visible: false },
        });

        const rsiSeries = rsiChart.addLineSeries({
          color: '#58a6ff', lineWidth: 1.5,
          priceLineVisible: false, lastValueVisible: false,
        });
        const rsiData = indicators.rsi
          .filter(d => d.value !== null)
          .map(d => ({ time: d.date, value: d.value }));
        if (rsiData.length) rsiSeries.setData(rsiData);

        rsiSeries.createPriceLine({ price: 70, color: '#f85149', lineWidth: 1, lineStyle: LineStyle.Dashed, title: '70' });
        rsiSeries.createPriceLine({ price: 30, color: '#3fb950', lineWidth: 1, lineStyle: LineStyle.Dashed, title: '30' });

        // Sync time scales (guard against feedback loop)
        let syncing = false;
        mainChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
          if (syncing || !range) return;
          syncing = true;
          rsiChart.timeScale().setVisibleLogicalRange(range);
          syncing = false;
        });
        rsiChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
          if (syncing || !range) return;
          syncing = true;
          mainChart.timeScale().setVisibleLogicalRange(range);
          syncing = false;
        });
        rsiChart.timeScale().fitContent();
      }
    } catch (err) {
      console.error('Chart error:', err);
      setChartError(err.message);
    }

    return () => {
      try { mainChart?.remove(); } catch (_) {}
      try { rsiChart?.remove(); } catch (_) {}
    };
  }, [data, indicators]);

  const latest  = data?.[data.length - 1];
  const display = hovered || latest;

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>{symbol}</span>

        {display && (
          <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
            {[['O', display.open], ['H', display.high], ['L', display.low], ['C', display.close]].map(([l, v]) => (
              <span key={l}>
                <span style={{ color: 'var(--text2)', marginRight: 3 }}>{l}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{v?.toFixed(2)}</span>
              </span>
            ))}
            {hovered?.time && <span style={{ color: 'var(--text2)' }}>{hovered.time}</span>}
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[
            { label: 'SMA 20', color: '#e3b341', on: showSMA20, set: setShowSMA20 },
            { label: 'SMA 50', color: '#bc8cff', on: showSMA50, set: setShowSMA50 },
          ].map(({ label, color, on, set }) => (
            <button key={label} onClick={() => set(v => !v)}
              style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                border: `1px solid ${color}`, background: on ? `${color}22` : 'transparent',
                color: on ? color : 'var(--text2)', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
          <button onClick={() => setShowRSI(v => !v)}
            style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
              border: '1px solid var(--blue)', background: showRSI ? '#58a6ff22' : 'transparent',
              color: showRSI ? 'var(--blue)' : 'var(--text2)', cursor: 'pointer' }}>
            RSI
          </button>
        </div>
      </div>

      {chartError && (
        <div style={{ padding: '12px 16px', color: 'var(--red)', fontSize: 13 }}>
          ⚠️ Chart error: {chartError}
        </div>
      )}

      {/* Main chart container */}
      <div ref={mainRef} style={{ width: '100%' }} />

      {/* RSI panel — always in DOM so rsiRef stays attached; hidden via CSS */}
      <div style={{ borderTop: '1px solid var(--border)', display: showRSI ? 'block' : 'none' }}>
        <div style={{ padding: '4px 16px', fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>
          RSI (14) — <span style={{ color: '#f85149' }}>70 Overbought</span> / <span style={{ color: '#3fb950' }}>30 Oversold</span>
        </div>
        <div ref={rsiRef} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
