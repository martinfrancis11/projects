require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

// ── Yahoo Finance helpers ────────────────────────────────────────────────────

function yfFetch(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'query1.finance.yahoo.com',
      path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    };
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Failed to parse Yahoo Finance response: ${data.slice(0, 80)}`)); }
      });
    }).on('error', reject);
  });
}

async function fetchOHLCV(symbol, rangeParam) {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${rangeParam}&includePrePost=false`;
  const json = await yfFetch(path);
  const result = json?.chart?.result?.[0];
  if (!result) {
    const err = json?.chart?.error?.description || `No data for ${symbol}`;
    throw new Error(err);
  }
  const timestamps = result.timestamp || [];
  const q = result.indicators?.quote?.[0] || {};
  const rows = timestamps.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    open:   q.open?.[i]   != null ? parseFloat(q.open[i].toFixed(2))   : null,
    high:   q.high?.[i]   != null ? parseFloat(q.high[i].toFixed(2))   : null,
    low:    q.low?.[i]    != null ? parseFloat(q.low[i].toFixed(2))    : null,
    close:  q.close?.[i]  != null ? parseFloat(q.close[i].toFixed(2))  : null,
    volume: q.volume?.[i] ?? 0,
  })).filter(d => d.open && d.high && d.low && d.close);
  // Deduplicate by date (keep last) and ensure ascending order
  const seen = {};
  for (const d of rows) seen[d.date] = d;
  return Object.values(seen).sort((a, b) => a.date.localeCompare(b.date));

}

async function fetchQuote(symbol) {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const json = await yfFetch(path);
  const meta = json?.chart?.result?.[0]?.meta || {};
  return { shortName: meta.shortName || meta.longName || symbol };
}

async function searchSymbols(q) {
  const path = `/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=false`;
  try {
    const json = await yfFetch(path);
    // Response has `quotes` at top level (not nested under finance.result)
    const quotes = json?.quotes ?? json?.finance?.result?.[0]?.quotes ?? [];
    return quotes
      .filter(r => r.quoteType === 'EQUITY' && r.symbol)
      .map(r => ({ symbol: r.symbol, name: r.shortname || r.longname || r.symbol, exchange: r.exchDisp || r.exchange || '' }));
  } catch (_) { return []; }
}

// ── Technical Indicators ────────────────────────────────────────────────────

function calcSMA(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const sum = data.slice(i - period + 1, i + 1).reduce((a, d) => a + d.close, 0);
    return parseFloat((sum / period).toFixed(2));
  });
}

function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const ema = new Array(data.length).fill(null);
  if (data.length < period) return ema;
  ema[period - 1] = parseFloat((data.slice(0, period).reduce((a, d) => a + d.close, 0) / period).toFixed(2));
  for (let i = period; i < data.length; i++) {
    ema[i] = parseFloat((data[i].close * k + ema[i - 1] * (1 - k)).toFixed(2));
  }
  return ema;
}

function calcRSI(data, period = 14) {
  const closes = data.map(d => d.close);
  const rsi = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return rsi;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const chg = closes[i] - closes[i - 1];
    if (chg >= 0) gains += chg; else losses -= chg;
  }
  let avgG = gains / period, avgL = losses / period;
  rsi[period] = avgL === 0 ? 100 : parseFloat((100 - 100 / (1 + avgG / avgL)).toFixed(2));
  for (let i = period + 1; i < closes.length; i++) {
    const chg = closes[i] - closes[i - 1];
    avgG = (avgG * (period - 1) + (chg >= 0 ? chg : 0)) / period;
    avgL = (avgL * (period - 1) + (chg < 0 ? -chg : 0)) / period;
    rsi[i] = avgL === 0 ? 100 : parseFloat((100 - 100 / (1 + avgG / avgL)).toFixed(2));
  }
  return rsi;
}

function calcMACD(data) {
  const ema12 = calcEMA(data, 12);
  const ema26 = calcEMA(data, 26);
  const macdLine = data.map((_, i) =>
    ema12[i] !== null && ema26[i] !== null ? parseFloat((ema12[i] - ema26[i]).toFixed(4)) : null
  );
  const macdProxy = data.map((d, i) => ({ ...d, close: macdLine[i] ?? 0 }));
  const signalRaw = calcEMA(macdProxy, 9);
  const signal = signalRaw.map((v, i) => (macdLine[i] !== null ? v : null));
  const histogram = data.map((_, i) =>
    macdLine[i] !== null && signal[i] !== null ? parseFloat((macdLine[i] - signal[i]).toFixed(4)) : null
  );
  return { macdLine, signal, histogram };
}

// ── Routes ──────────────────────────────────────────────────────────────────

const PERIOD_MAP = { '1mo': '1mo', '3mo': '3mo', '6mo': '6mo', '1y': '1y', '2y': '2y' };

app.get('/api/stock/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const period = PERIOD_MAP[req.query.period] || '3mo';

  try {
    const [data, quoteInfo] = await Promise.all([
      fetchOHLCV(symbol, period),
      fetchQuote(symbol).catch(() => ({ shortName: symbol })),
    ]);

    if (!data.length) return res.status(404).json({ error: `No data found for ${symbol}` });

    const sma20 = calcSMA(data, 20);
    const sma50 = calcSMA(data, 50);
    const rsi   = calcRSI(data);
    const macd  = calcMACD(data);

    res.json({
      symbol,
      companyName: quoteInfo.shortName || symbol,
      data,
      indicators: {
        sma20:  data.map((d, i) => ({ date: d.date, value: sma20[i] })),
        sma50:  data.map((d, i) => ({ date: d.date, value: sma50[i] })),
        rsi:    data.map((d, i) => ({ date: d.date, value: rsi[i] })),
        macd:   data.map((d, i) => ({ date: d.date, macd: macd.macdLine[i], signal: macd.signal[i], histogram: macd.histogram[i] })),
      },
    });
  } catch (err) {
    console.error('Stock fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  try { res.json(await searchSymbols(q)); }
  catch (_) { res.json([]); }
});

// Claude AI analysis — streams SSE
app.post('/api/analyze', async (req, res) => {
  const { symbol, companyName, data, indicators } = req.body;
  if (!data?.length) return res.status(400).json({ error: 'No stock data provided' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const latest  = data[data.length - 1];
  const oldest  = data[0];
  const pctChg  = ((latest.close - oldest.close) / oldest.close * 100).toFixed(2);
  const high52   = Math.max(...data.map(d => d.high)).toFixed(2);
  const low52    = Math.min(...data.map(d => d.low)).toFixed(2);

  const lastRSI   = [...indicators.rsi].reverse().find(r => r.value !== null)?.value;
  const lastSMA20 = [...indicators.sma20].reverse().find(s => s.value !== null)?.value;
  const lastSMA50 = [...indicators.sma50].reverse().find(s => s.value !== null)?.value;
  const lastMACD  = [...indicators.macd].reverse().find(m => m.macd !== null);

  const recentRows = data.slice(-15).map(d =>
    `${d.date}: O=${d.open} H=${d.high} L=${d.low} C=${d.close} Vol=${(d.volume / 1e6).toFixed(1)}M`
  ).join('\n');

  const prompt = `You are a professional US stock market analyst. Analyse the candlestick chart data below for **${companyName} (${symbol})** and give a clear BUY / SELL / HOLD recommendation.

---
## PRICE SUMMARY
- **Current Price:** $${latest.close}
- **Period:** ${oldest.date} → ${latest.date}
- **Price Change:** ${pctChg >= 0 ? '+' : ''}${pctChg}%
- **Period High:** $${high52} | **Period Low:** $${low52}

## TECHNICAL INDICATORS (latest values)
- **RSI (14):** ${lastRSI?.toFixed(2) ?? 'N/A'} — ${lastRSI > 70 ? 'OVERBOUGHT ⚠️' : lastRSI < 30 ? 'OVERSOLD — potential reversal ✅' : 'Neutral zone'}
- **SMA 20:** $${lastSMA20?.toFixed(2) ?? 'N/A'} — price **${latest.close > lastSMA20 ? 'ABOVE 🟢 (bullish)' : 'BELOW 🔴 (bearish)'}**
- **SMA 50:** $${lastSMA50?.toFixed(2) ?? 'N/A'} — price **${latest.close > lastSMA50 ? 'ABOVE 🟢 (bullish)' : 'BELOW 🔴 (bearish)'}**
- **SMA Cross:** ${lastSMA20 > lastSMA50 ? '📈 Golden Cross — BULLISH' : '📉 Death Cross — BEARISH'}
- **MACD Line:** ${lastMACD?.macd?.toFixed(4) ?? 'N/A'} | **Signal:** ${lastMACD?.signal?.toFixed(4) ?? 'N/A'} | **Histogram:** ${lastMACD?.histogram?.toFixed(4) ?? 'N/A'} (${(lastMACD?.histogram ?? 0) > 0 ? 'positive = bullish momentum' : 'negative = bearish momentum'})

## RECENT OHLCV — LAST 15 SESSIONS
${recentRows}

---
Provide your analysis in this exact structure:

## 📊 TREND ANALYSIS
Describe the overall trend direction, strength, and momentum from price action and MAs.

## 🔍 KEY TECHNICAL SIGNALS
List the 3-5 most significant signals from RSI, MACD, MAs, candlestick patterns and volume.

## 🛡️ SUPPORT & RESISTANCE
- **Strong Support:** $X.XX
- **Weak Support:** $X.XX
- **Weak Resistance:** $X.XX
- **Strong Resistance:** $X.XX

## ⚠️ RISK FACTORS
2-3 key risks to be aware of.

## 🎯 RECOMMENDATION
**[BUY / SELL / HOLD]** — Confidence: [High / Medium / Low]
Brief 2-3 sentence justification.

## 📋 ENTRY / EXIT STRATEGY
- **Entry Zone:** $X.XX – $X.XX
- **Stop Loss:** $X.XX (≈X% below entry)
- **Target 1 (short-term):** $X.XX (+X%)
- **Target 2 (medium-term):** $X.XX (+X%)
- **Risk/Reward:** X:X

Keep the response concise, data-driven, and actionable.`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = message.content.find(b => b.type === 'text')?.text || '';
    res.json({ analysis: text });
  } catch (err) {
    console.error('Claude error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Export app for Lambda; start server only when run directly
module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`✅  Stock analysis API  →  http://localhost:${PORT}`));
}
