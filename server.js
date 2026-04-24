const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ─── AUTH CONFIG ──────────────────────────────────────────────────────────────
const AUTH_CREDENTIALS = {
  username: process.env.AUTH_USERNAME || 'admin',
  password: process.env.AUTH_PASSWORD || 'arb123456',
};
const AUTH_TOKEN_SECRET = process.env.AUTH_SECRET || 'arbwatch_secret_key_2024';

// ─── LOGIN API ────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') ||
                req.cookies?.auth_token ||
                (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null);

  if (!token || !token.includes(':')) {
    return res.redirect('/login.html');
  }
  next();
};

// ─── STATIC FILES (with auth) ──────────────────────────────────────────────────
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use((req, res, next) => {
  if (req.path === '/login.html' || req.path === '/api/login') {
    return next();
  }
  isAuthenticated(req, res, next);
});

app.use(express.static(path.join(__dirname, 'public')));

// ─── REDIRECT / TO /index.html ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Token Store ──────────────────────────────────────────────────────────────
const tokens = {
  rezorex: {
    accessToken:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTE0ZDc2ZWY2OGVhMWUxY2E2NmE4MSIsInJvbGUiOiJ1c2VyIiwidG9rZW5UeXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc2NTEwMDg3LCJleHAiOjE3NzY1MTA2ODd9.rrU1wZMMnFM190NZWVyLmwgqFuRSvcUk4ygmJioZvW0',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTE0ZDc2ZWY2OGVhMWUxY2E2NmE4MSIsInJvbGUiOiJ1c2VyIiwidG9rZW5UeXBlIjoicmVmcmVzaCIsImlhdCI6MTc3NjUxMDA4NywiZXhwIjoxNzc2NTI4MDg3fQ.h76ZrnYSSvf9XT4LKRl_ayemwDcIlaXenX3jrc_P1RM',
    refreshUrl:   'https://www.rezorex.com/user-api/api/v1/auth/refresh-token',
    name: 'Rezorex', lastRefresh: null, lastError: null,
  },
  cfx: {
    accessToken:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGI2YTZlZTUyMzU3MTIwNDk0MzcyYSIsInJvbGUiOiJ1c2VyIiwidG9rZW5UeXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc2NTEwMzA1LCJleHAiOjE3NzY1MTA5MDV9.C00tEn0BFsZqQ0V6ZGCZr_p9Gb0GVjLDWKTfVOkbQZY',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGI2YTZlZTUyMzU3MTIwNDk0MzcyYSIsInJvbGUiOiJ1c2VyIiwidG9rZW5UeXBlIjoicmVmcmVzaCIsImlhdCI6MTc3NjUxMDMwNSwiZXhwIjoxNzc3MTE1MTA1fQ._C8DjZA4sPs1v6kIxLcIj3utWwui1SaX31VQO4aK9QU',
    refreshUrl:   'https://cryptoforce.in/user-api/api/v1/auth/refresh-token',
    name: 'Cryptoforce', lastRefresh: null, lastError: null,
  },
};

// ─── Exchange fees (taker) ────────────────────────────────────────────────────
const EX_FEES = {
  binance: { buy: 0.001,  sell: 0.001  },  // 0.10%
  bybit:   { buy: 0.001,  sell: 0.001  },  // 0.10%
  mexc:    { buy: 0.0002, sell: 0.0002 },  // 0.02%
};

// ─── Pairs to monitor (25 pairs for wider opportunity net) ───────────────────
const PAIRS = [
  'BTC_USDT','ETH_USDT','XRP_USDT','SOL_USDT','BNB_USDT',
  'DOGE_USDT','TRX_USDT','ADA_USDT','AVAX_USDT','LINK_USDT',
  'DOT_USDT','MATIC_USDT','ATOM_USDT','LTC_USDT','NEAR_USDT',
  'UNI_USDT','FIL_USDT','APT_USDT','ARB_USDT','OP_USDT',
  'INJ_USDT','SUI_USDT','RUNE_USDT','FTM_USDT','WLD_USDT',
];

// ─── Triangular paths (USDT-base cycles, 3 legs) ────────────────────────────
// dir 'buy': spend quote currency to get base  → use ask price, divide
// dir 'sell': spend base currency to get quote → use bid price, multiply
const TRI_PATHS = [
  { label:'BTC→ETH cycle',  legs:[['BTCUSDT','buy'],['ETHBTC','buy'],['ETHUSDT','sell']] },
  { label:'ETH→BTC cycle',  legs:[['ETHUSDT','buy'],['ETHBTC','sell'],['BTCUSDT','sell']] },
  { label:'XRP→BTC cycle',  legs:[['XRPUSDT','buy'],['XRPBTC','sell'],['BTCUSDT','sell']] },
  { label:'BTC→XRP cycle',  legs:[['BTCUSDT','buy'],['XRPBTC','buy'],['XRPUSDT','sell']] },
  { label:'BNB→BTC cycle',  legs:[['BNBUSDT','buy'],['BNBBTC','sell'],['BTCUSDT','sell']] },
  { label:'BTC→BNB cycle',  legs:[['BTCUSDT','buy'],['BNBBTC','buy'],['BNBUSDT','sell']] },
  { label:'BNB→ETH cycle',  legs:[['BNBUSDT','buy'],['BNBETH','sell'],['ETHUSDT','sell']] },
  { label:'ETH→BNB cycle',  legs:[['ETHUSDT','buy'],['BNBETH','buy'],['BNBUSDT','sell']] },
  { label:'SOL→BTC cycle',  legs:[['SOLUSDT','buy'],['SOLBTC','sell'],['BTCUSDT','sell']] },
  { label:'ADA→BTC cycle',  legs:[['ADAUSDT','buy'],['ADABTC','sell'],['BTCUSDT','sell']] },
  { label:'LINK→ETH cycle', legs:[['LINKUSDT','buy'],['LINKETH','sell'],['ETHUSDT','sell']] },
  { label:'DOT→BTC cycle',  legs:[['DOTUSDT','buy'],['DOTBTC','sell'],['BTCUSDT','sell']] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function decodeJWT(token) {
  try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()); }
  catch { return null; }
}
function secondsLeft(token) {
  const p = decodeJWT(token);
  return p ? Math.max(0, p.exp - Math.floor(Date.now() / 1000)) : 0;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Token Refresh ────────────────────────────────────────────────────────────
async function refreshToken(exchange, attempt = 1) {
  const t = tokens[exchange];
  if (!t.refreshToken) { t.lastError = 'No refresh token — add it in Settings ⚙'; return false; }
  try {
    const res = await axios.post(t.refreshUrl,
      { refreshToken: t.refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 25000 }
    );
    if (res.data.accessToken) {
      t.accessToken  = res.data.accessToken;
      if (res.data.refreshToken) t.refreshToken = res.data.refreshToken;
      t.lastRefresh  = new Date().toISOString();
      t.lastError    = null;
      console.log(`[${new Date().toLocaleTimeString()}] ✅ ${t.name} refreshed (${secondsLeft(t.accessToken)}s left)`);
      return true;
    }
    throw new Error(res.data?.errors?.[0]?.detail || res.data?.message || 'No accessToken in response');
  } catch (err) {
    const msg = err.response?.data?.errors?.[0]?.detail || err.response?.data?.message || err.message;
    if (attempt < 3) {
      console.warn(`[${new Date().toLocaleTimeString()}] ⚠ ${t.name} attempt ${attempt}/3 — retry in ${attempt * 5}s`);
      await sleep(attempt * 5000);
      return refreshToken(exchange, attempt + 1);
    }
    const rem = secondsLeft(t.accessToken);
    const isExpired = msg.toLowerCase().includes('session') || msg.toLowerCase().includes('expired');
    const isTimeout = msg.includes('timeout') || msg.includes('ECONNRESET');
    t.lastError = isExpired
      ? 'Session expired — update tokens in ⚙ Settings'
      : isTimeout && rem > 0
        ? `Server slow, using existing token (${Math.floor(rem/60)}m ${rem%60}s left)`
        : `Refresh failed — update tokens in ⚙ Settings`;
    console.error(`[${new Date().toLocaleTimeString()}] ❌ ${t.name}: ${t.lastError}`);
    return false;
  }
}

async function smartRefresh() {
  for (const ex of ['rezorex', 'cfx']) {
    const rem = secondsLeft(tokens[ex].accessToken);
    if (rem < 180) await refreshToken(ex);
    else console.log(`[${new Date().toLocaleTimeString()}] ⏭ ${tokens[ex].name} ok (${Math.floor(rem/60)}m left)`);
  }
}

(async () => {
  await refreshToken('rezorex');
  await refreshToken('cfx');
})();
setInterval(smartRefresh, 5 * 60 * 1000);

// ─── Triangular Arb Calculator ────────────────────────────────────────────────
function calcTriangular(priceMap, fee) {
  const results = [];
  for (const { label, legs } of TRI_PATHS) {
    if (!legs.every(([sym]) => priceMap[sym])) continue;
    let amt = 1;
    for (const [sym, dir] of legs) {
      if (dir === 'buy') amt = amt / priceMap[sym].ask * (1 - fee);
      else               amt = amt * priceMap[sym].bid * (1 - fee);
    }
    const pct = (amt - 1) * 100;
    results.push({ label, pct, profitable: pct > 0 });
  }
  return results.sort((a, b) => b.pct - a.pct);
}

// ─── Funding Rate Fetcher ─────────────────────────────────────────────────────
async function getFundingRates() {
  try {
    const [bybitRes] = await Promise.all([
      axios.get('https://api.bybit.com/v5/market/tickers?category=linear', { timeout: 8000 })
           .catch(() => null),
      axios.get('https://fapi.binance.com/fapi/v1/premiumIndex', { timeout: 8000 })
           .catch(() => null),
    ]);

    const syms = ['BTCUSDT','ETHUSDT','XRPUSDT','SOLUSDT','BNBUSDT'];
    const rates = [];

    if (bybitRes) {
      const list = bybitRes.data?.result?.list || [];
      for (const s of syms) {
        const t = list.find(x => x.symbol === s);
        if (t && t.fundingRate) {
          const r8h = parseFloat(t.fundingRate) * 100;
          rates.push({
            symbol: s.replace('USDT', '/USDT'),
            exchange: 'Bybit',
            rate8h: r8h,
            rateDaily: r8h * 3,
            rateAnnual: r8h * 3 * 365,
            nextFunding: t.nextFundingTime,
            direction: r8h >= 0 ? 'Longs pay shorts' : 'Shorts pay longs',
            strategy: r8h >= 0 ? 'Long spot + Short perp → earn rate' : 'Short spot + Long perp → earn rate',
          });
        }
      }
    }
    return rates.sort((a, b) => Math.abs(b.rate8h) - Math.abs(a.rate8h));
  } catch {
    return [];
  }
}

// ─── Core Arbitrage Data Fetcher ─────────────────────────────────────────────
async function fetchArbitrageData() {
  const [gateRes, kucoinRes, binanceRes, bybitRes, mexcRes, rzrMarkupRes, cfxMarkupRes] = await Promise.all([
    axios.get('https://api.gateio.ws/api/v4/spot/tickers', { timeout: 12000 }),
    axios.get('https://api.kucoin.com/api/v1/market/allTickers', { timeout: 12000 }),
    axios.get('https://api.binance.com/api/v3/ticker/bookTicker', { timeout: 12000 }),
    axios.get('https://api.bybit.com/v5/market/tickers?category=spot', { timeout: 12000 })
         .catch(() => ({ data: { result: { list: [] } } })),
    axios.get('https://api.mexc.com/api/v3/ticker/bookTicker', { timeout: 12000 })
         .catch(() => ({ data: [] })),
    axios.get('https://www.rezorex.com/service-api/v1/market/markup', { timeout: 8000 })
         .catch(() => ({ data: { data: [{ buyMarkUp: 0, sellMarkUp: 0 }] } })),
    axios.get('https://cryptoforce.in/service-api/v1/market/markup', { timeout: 8000 })
         .catch(() => ({ data: { data: [{ buyMarkUp: 0.003, sellMarkUp: 0.003 }] } })),
  ]);

  const gTickers  = gateRes.data;
  const kTickers  = kucoinRes.data.data.ticker;
  const bTickers  = binanceRes.data;
  const bbTickers = bybitRes.data?.result?.list || [];
  const mTickers  = Array.isArray(mexcRes.data) ? mexcRes.data : [];

  const rzrMup = rzrMarkupRes.data?.data?.[0] || { buyMarkUp: 0, sellMarkUp: 0 };
  const cfxMup = cfxMarkupRes.data?.data?.[0] || { buyMarkUp: 0.003, sellMarkUp: 0.003 };

  // Build Binance price map for triangular arb
  const binancePriceMap = {};
  for (const t of bTickers) {
    binancePriceMap[t.symbol] = { bid: +t.bidPrice, ask: +t.askPrice };
  }

  const rows = [];

  for (const pair of PAIRS) {
    const sym  = pair.replace('_', '');       // BTCUSDT
    const kSym = pair.replace('_', '-');      // BTC-USDT

    const g  = gTickers.find(x => x.currency_pair === pair);
    const k  = kTickers.find(x => x.symbol === kSym);
    const b  = bTickers.find(x => x.symbol === sym);
    const bb = bbTickers.find(x => x.symbol === sym);
    const m  = mTickers.find(x => x.symbol === sym);

    // Need at least 2 sources to compare
    const sources = [];
    if (g) sources.push({ name:'Rezorex', bid:+g.highest_bid, ask:+g.lowest_ask, buyFee:rzrMup.buyMarkUp, sellFee:rzrMup.sellMarkUp });
    if (k) sources.push({ name:'CFX',     bid:+k.buy,         ask:+k.sell,       buyFee:cfxMup.buyMarkUp, sellFee:cfxMup.sellMarkUp });
    if (b) sources.push({ name:'Binance', bid:+b.bidPrice,    ask:+b.askPrice,   buyFee:EX_FEES.binance.buy, sellFee:EX_FEES.binance.sell });
    if (bb)sources.push({ name:'Bybit',   bid:+bb.bid1Price,  ask:+bb.ask1Price, buyFee:EX_FEES.bybit.buy,   sellFee:EX_FEES.bybit.sell });
    if (m) sources.push({ name:'MEXC',    bid:+m.bidPrice,    ask:+m.askPrice,   buyFee:EX_FEES.mexc.buy,    sellFee:EX_FEES.mexc.sell });

    if (sources.length < 2) continue;

    let bestBuy = null, bestSell = null;
    for (const s of sources) {
      const netBuy  = s.ask * (1 + s.buyFee);
      const netSell = s.bid * (1 - s.sellFee);
      if (!bestBuy  || netBuy  < bestBuy.netPrice)  bestBuy  = { ...s, netPrice: netBuy  };
      if (!bestSell || netSell > bestSell.netPrice)  bestSell = { ...s, netPrice: netSell };
    }

    const bestPct = (bestSell.netPrice - bestBuy.netPrice) / bestBuy.netPrice * 100;
    const prices  = {};
    for (const s of sources) prices[s.name] = { bid: s.bid, ask: s.ask, buyFee: s.buyFee, sellFee: s.sellFee };

    rows.push({
      pair,
      prices,
      bestPct,
      buyOn:    bestBuy.name,
      sellOn:   bestSell.name,
      buyPrice: bestBuy.netPrice,
      sellPrice:bestSell.netPrice,
      sameExchange: bestBuy.name === bestSell.name,
      sourceCount:  sources.length,
      gBid: g ? +g.highest_bid : null, gAsk: g ? +g.lowest_ask : null,
      kBid: k ? +k.buy : null,         kAsk: k ? +k.sell : null,
    });
  }

  rows.sort((a, b) => b.bestPct - a.bestPct);

  // Triangular arb on Binance (0.1%) and MEXC (0.02%)
  const triResults = {
    binance: calcTriangular(binancePriceMap, EX_FEES.binance.buy).slice(0, 8),
    mexc: [],  // MEXC cross-pairs scanned separately
  };

  // Build MEXC price map
  const mexcPriceMap = {};
  for (const t of mTickers) mexcPriceMap[t.symbol] = { bid: +t.bidPrice, ask: +t.askPrice };
  triResults.mexc = calcTriangular(mexcPriceMap, EX_FEES.mexc.buy).slice(0, 8);

  return {
    success: true,
    ts: new Date().toISOString(),
    markup: { rezorex: rzrMup, cfx: cfxMup },
    rows,
    triangular: triResults,
    binancePriceMap,
  };
}

// ─── Opportunity history (last 50) ───────────────────────────────────────────
const oppHistory = [];

// ─── Cached data + SSE clients ───────────────────────────────────────────────
let cachedData = null;
const sseClients = new Set();

async function refreshCache() {
  try {
    const data = await fetchArbitrageData();
    const funding = await getFundingRates();
    data.funding = funding;
    cachedData = data;

    // Track opportunities (spread > 0.05% on different exchanges)
    const best = data.rows.find(r => !r.sameExchange && r.bestPct > 0.05);
    if (best) {
      const entry = { ts: data.ts, pair: best.pair, pct: best.bestPct, buyOn: best.buyOn, sellOn: best.sellOn };
      oppHistory.unshift(entry);
      if (oppHistory.length > 50) oppHistory.pop();
      console.log(`[${new Date().toLocaleTimeString()}] 🎯 Opportunity: ${best.pair} ${best.bestPct.toFixed(3)}% buy ${best.buyOn} → sell ${best.sellOn}`);
    }

    // Broadcast to all SSE clients
    const payload = `data: ${JSON.stringify({ ...data, history: oppHistory.slice(0, 20) })}\n\n`;
    for (const client of sseClients) {
      try { client.write(payload); } catch { sseClients.delete(client); }
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Data fetch error: ${err.message}`);
  }
}

// Refresh every 5 seconds for near real-time detection
refreshCache();
setInterval(refreshCache, 5000);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/tokens', (_req, res) => {
  const out = {};
  for (const [k, t] of Object.entries(tokens)) {
    const rem = secondsLeft(t.accessToken);
    out[k] = { remainingSeconds: rem, lastRefresh: t.lastRefresh, lastError: t.lastError,
                hasAccess: !!t.accessToken, hasRefresh: !!t.refreshToken };
  }
  res.json(out);
});

app.post('/api/tokens/set', async (req, res) => {
  const { exchange, accessToken, refreshToken: rt } = req.body;
  if (!tokens[exchange]) return res.status(400).json({ success: false, error: 'Unknown exchange' });
  const t = tokens[exchange];
  let changed = false;
  if (accessToken && accessToken.length > 20) { t.accessToken = accessToken.trim(); t.lastError = null; changed = true; }
  if (rt && rt.length > 20) { t.refreshToken = rt.trim(); changed = true; }
  if (!changed) return res.status(400).json({ success: false, error: 'Provide at least one valid token' });
  if (secondsLeft(t.accessToken) < 60 && t.refreshToken) await refreshToken(exchange);
  else t.lastError = null;
  res.json({ success: true, remainingSeconds: secondsLeft(t.accessToken), error: t.lastError });
});

// REST fallback
app.get('/api/arbitrage', async (_req, res) => {
  if (cachedData) return res.json(cachedData);
  try {
    const data = await fetchArbitrageData();
    const funding = await getFundingRates();
    res.json({ ...data, funding, history: oppHistory.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/history', (_req, res) => res.json({ history: oppHistory }));

// SSE — real-time stream to browser
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  sseClients.add(res);
  console.log(`[${new Date().toLocaleTimeString()}] 📡 SSE client connected (${sseClients.size} total)`);

  // Send cached data immediately
  if (cachedData) {
    res.write(`data: ${JSON.stringify({ ...cachedData, history: oppHistory.slice(0, 20) })}\n\n`);
  }

  req.on('close', () => {
    sseClients.delete(res);
    console.log(`[${new Date().toLocaleTimeString()}] 📡 SSE client disconnected (${sseClients.size} total)`);
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`\n🚀  http://localhost:${PORT}  — Multi-Exchange Arbitrage Dashboard`);
  console.log(`📊  Monitoring ${PAIRS.length} pairs across 5 exchanges (5s refresh)`);
  console.log(`📡  Real-time SSE stream at /api/stream`);
  console.log(`🔺  Triangular arb scanning Binance + MEXC\n`);
});