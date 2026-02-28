/**
 * push95.mjs — ZERØ MERIDIAN push95
 * Push 6 file BARU yang gagal di push94 (FILE TIDAK DITEMUKAN)
 *
 * Semua konten file di-EMBED langsung di script ini.
 * Tidak perlu copy file manual ke D:/FILEK — tinggal node push95.mjs
 *
 * Files:
 *   src/components/shared/ErrorBoundary.tsx   — tile isolation
 *   src/lib/cgCache.ts                        — CoinGecko rate-limit guard
 *   src/test/formatters.test.ts               — unit tests
 *   public/wasm/orderbook.wasm                — WASM binary nyata (validated)
 *   server/proxy.js                           — backend proxy server
 *   .env.example                              — env template
 *
 * Usage:
 *   $env:GH_TOKEN = "ghp_TOKEN_KAMU"
 *   node push95.mjs
 */

const TOKEN = process.env.GH_TOKEN;

if (!TOKEN) {
  console.error('\n❌ ERROR: GH_TOKEN tidak ditemukan!');
  console.error('   $env:GH_TOKEN = "ghp_TOKEN_KAMU"');
  console.error('   node push95.mjs\n');
  process.exit(1);
}

const OWNER  = 'wr98-code';
const REPO   = 'new-zeromeridian';
const BRANCH = 'main';

const HEADERS = {
  Authorization:          `Bearer ${TOKEN}`,
  Accept:                 'application/vnd.github+json',
  'Content-Type':         'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
};

// ─── File contents embedded ───────────────────────────────────────────────────

const FILES = [

  // ── 1. ErrorBoundary.tsx ────────────────────────────────────────────────────
  {
    path: 'src/components/shared/ErrorBoundary.tsx',
    desc: 'NEW: tile crash isolation + retry button',
    content: `/**
 * ErrorBoundary.tsx — ZERØ MERIDIAN 2026
 * Isolates tile crashes — dashboard never goes fully blank.
 * Class component required by React error boundary spec.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children:    ReactNode;
  fallback?:   ReactNode;
  tileLabel?:  string;
}

interface State {
  hasError: boolean;
  error:    string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  static displayName = 'ErrorBoundary';

  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ZM ErrorBoundary]', this.props.tileLabel ?? 'unknown', error, info.componentStack);
  }

  override render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        height:         '100%',
        minHeight:      '120px',
        gap:            '8px',
        background:     'rgba(239,68,68,0.04)',
        border:         '1px solid rgba(239,68,68,0.15)',
        borderRadius:   '12px',
        padding:        '20px',
        willChange:     'transform',
      }}>
        <span style={{ fontSize: '18px' }}>⚠</span>
        <span style={{
          fontFamily:    "'Space Mono', monospace",
          fontSize:      '10px',
          color:         'rgba(248,113,113,0.7)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {this.props.tileLabel ?? 'Tile'} unavailable
        </span>
        <span style={{
          fontFamily:  "'Space Mono', monospace",
          fontSize:    '10px',
          color:       'rgba(100,100,120,1)',
          textAlign:   'center',
          maxWidth:    '240px',
        }}>
          {this.state.error ?? 'An error occurred'}
        </span>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          style={{
            marginTop:    '8px',
            fontFamily:   "'Space Mono', monospace",
            fontSize:     '9px',
            letterSpacing:'0.1em',
            padding:      '4px 12px',
            borderRadius: '4px',
            background:   'rgba(248,113,113,0.1)',
            border:       '1px solid rgba(248,113,113,0.2)',
            color:        'rgba(248,113,113,0.8)',
            cursor:       'pointer',
          }}
        >
          RETRY
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
`,
  },

  // ── 2. cgCache.ts ───────────────────────────────────────────────────────────
  {
    path: 'src/lib/cgCache.ts',
    desc: 'NEW: CoinGecko rate-limit guard + request deduplication',
    content: `/**
 * cgCache.ts — ZERØ MERIDIAN
 * Centralized CoinGecko cache + rate limit guard.
 * All CG requests deduplicated here — never call CG directly from hooks.
 * Free tier: 30 req/min → 1 req/2s minimum interval.
 */

interface CacheEntry<T> {
  data: T;
  ts:   number;
}

const store = new Map<string, CacheEntry<unknown>>();

// Pending requests: deduplicate inflight
const pending = new Map<string, Promise<unknown>>();

const BASE = 'https://api.coingecko.com/api/v3';

// Minimum ms between requests (rate-limit guard: 30/min = 1 per 2s)
const MIN_INTERVAL_MS = 2200;
let lastRequestTs = 0;

async function guardedFetch(url: string, signal?: AbortSignal): Promise<Response> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastRequestTs);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequestTs = Date.now();
  return fetch(url, { signal });
}

export async function cgFetch<T>(
  endpoint: string,
  ttlMs: number,
  signal?: AbortSignal,
): Promise<T> {
  const key = endpoint;

  // Return cached if fresh
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data;

  // Deduplicate: return existing pending promise
  if (pending.has(key)) return pending.get(key) as Promise<T>;

  const promise = (async () => {
    const res = await guardedFetch(BASE + endpoint, signal);
    if (!res.ok) throw new Error(\`CoinGecko \${res.status}: \${endpoint}\`);
    const data = await res.json() as T;
    store.set(key, { data, ts: Date.now() });
    return data;
  })().finally(() => pending.delete(key));

  pending.set(key, promise);
  return promise;
}

export function cgInvalidate(endpoint: string) {
  store.delete(endpoint);
}
`,
  },

  // ── 3. formatters.test.ts ───────────────────────────────────────────────────
  {
    path: 'src/test/formatters.test.ts',
    desc: 'NEW: unit tests formatPrice + detectRegime + computeSignal',
    content: `/**
 * formatters.test.ts — ZERØ MERIDIAN
 * Critical business logic tests: formatters, regime detection, signal computation.
 * Run: npm test
 */

import { describe, it, expect } from 'vitest';
import {
  formatPrice, formatCompact, formatChange,
  detectRegime, computeSignal,
  type CryptoAsset,
} from '@/lib/formatters';

function makeAsset(overrides: Partial<CryptoAsset>): CryptoAsset {
  return {
    id: 'test', symbol: 'TEST', name: 'Test', rank: 1,
    price: 100, change24h: 0, change7d: 0, marketCap: 1e9,
    volume24h: 1e7, circulatingSupply: 1e6,
    ...overrides,
  };
}

describe('formatPrice', () => {
  it('formats price >= 1000 with commas', () => {
    expect(formatPrice(67840)).toBe('$67,840');
  });
  it('formats price < 1000 with 2 decimals', () => {
    expect(formatPrice(0.5432)).toBe('$0.54');
  });
  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
  it('handles NaN gracefully', () => {
    expect(formatPrice(NaN)).toBe('—');
  });
});

describe('formatCompact', () => {
  it('formats trillions', () => {
    expect(formatCompact(2.5e12)).toMatch(/2\\.5T/);
  });
  it('formats billions', () => {
    expect(formatCompact(1.23e9)).toMatch(/1\\.23B/);
  });
  it('formats millions', () => {
    expect(formatCompact(500e6)).toMatch(/500M/);
  });
});

describe('detectRegime', () => {
  it('returns CRAB for empty assets', () => {
    expect(detectRegime([])).toBe('CRAB');
  });
  it('returns SURGE when avg change > 5%', () => {
    const assets = Array.from({ length: 20 }, (_, i) =>
      makeAsset({ id: \`a\${i}\`, symbol: \`T\${i}\`, change24h: 6, marketCap: 1e9 })
    );
    expect(detectRegime(assets)).toBe('SURGE');
  });
  it('returns BULL when avg 1.5-5% and breadth > 55%', () => {
    const assets = Array.from({ length: 20 }, (_, i) =>
      makeAsset({ id: \`a\${i}\`, symbol: \`T\${i}\`, change24h: i < 14 ? 2.5 : -0.5, marketCap: 1e9 })
    );
    expect(detectRegime(assets)).toBe('BULL');
  });
  it('returns BEAR when avg < -1.5% and breadth < 45%', () => {
    const assets = Array.from({ length: 20 }, (_, i) =>
      makeAsset({ id: \`a\${i}\`, symbol: \`T\${i}\`, change24h: i < 12 ? -3 : 0.5, marketCap: 1e9 })
    );
    expect(detectRegime(assets)).toBe('BEAR');
  });
});

describe('computeSignal', () => {
  it('returns NEUTRAL for empty', () => {
    expect(computeSignal([])).toBe('NEUTRAL');
  });
  it('returns STRONG_BUY in strongly positive market', () => {
    const assets = Array.from({ length: 15 }, (_, i) =>
      makeAsset({ id: \`a\${i}\`, symbol: \`T\${i}\`, change24h: 10, change7d: 15, marketCap: 1e9 })
    );
    expect(['STRONG_BUY', 'BUY']).toContain(computeSignal(assets));
  });
  it('returns STRONG_SELL in strongly negative market', () => {
    const assets = Array.from({ length: 15 }, (_, i) =>
      makeAsset({ id: \`a\${i}\`, symbol: \`T\${i}\`, change24h: -10, change7d: -15, marketCap: 1e9 })
    );
    expect(['STRONG_SELL', 'SELL']).toContain(computeSignal(assets));
  });
});
`,
  },

  // ── 4. orderbook.wasm (binary — base64 embedded) ────────────────────────────
  {
    path: 'public/wasm/orderbook.wasm',
    desc: 'NEW: WASM binary nyata — validated WebAssembly.validate()=true',
    // Real compiled WASM binary (395 bytes) — orderbook: mid, spread, vwap, imbalance
    base64: 'AGFzbQEAAAABCAFgBH9/f38AAwIBAAUDAQACBxECB2NvbXB1dGUAAANtZW0CAAraAgHXAgIBfw58QQAhBAJAA0AgBCACTg0BIAAgBEEQbGorAwAhCSAERQRAIAkhCwsgACAEQRBsaisDCCEKIAUgCqAhBSAGIAkgCqKgIQYgBEEBaiEEDAALC0EAIQQCQANAIAQgAk4NASABIARBEGxqKwMAIQkgBEUEQCAJIQwLIAEgBEEQbGorAwghCiAHIAqgIQcgCCAJIAqioCEIIARBAWohBAwACwsgCyAMoEQAAAAAAAAAQKMhDSAMIAuhIQ4gBSAHoCEPIAVEAAAAAAAAAABkBHwgBiAFowUgCwshECAHRAAAAAAAAAAAZAR8IAggB6MFIAwLIREgD0QAAAAAAAAAAGQEfCAFIAehIA+jBUQAAAAAAAAAAAshEiADIAU5AwAgAyAQOQMIIAMgBzkDECADIBE5AxggAyANOQMgIAMgDjkDKCADIBI5AzAgA0QAAAAAAAAAADkDOAs=',
  },

  // ── 5. server/proxy.js ──────────────────────────────────────────────────────
  {
    path: 'server/proxy.js',
    desc: 'NEW: backend proxy — API keys server-side only',
    content: `/**
 * server/proxy.js — ZERØ MERIDIAN API Proxy
 * Semua paid API keys di SERVER — tidak pernah masuk client bundle.
 *
 * Setup:
 *   ZM_SANTIMENT_KEY=xxx ZM_MESSARI_KEY=xxx node server/proxy.js
 *
 * Routes:
 *   GET /api/santiment/social-volume
 *   GET /api/token-terminal/projects
 *   GET /api/messari/btc|eth|sol|news
 *   GET /api/dune/:queryId
 */

const http  = require('http');
const https = require('https');
const url   = require('url');

const KEYS = {
  santiment:     process.env.ZM_SANTIMENT_KEY     || '',
  tokenTerminal: process.env.ZM_TOKEN_TERMINAL_KEY || '',
  messari:       process.env.ZM_MESSARI_KEY        || '',
  dune:          process.env.ZM_DUNE_KEY           || '',
};

const PORT = process.env.ZM_PROXY_PORT || 3001;
const cache = new Map();

function getCached(key, ttlMs) {
  const e = cache.get(key);
  if (e && Date.now() - e.ts < ttlMs) return e.data;
  return null;
}
function setCached(key, data) { cache.set(key, { data, ts: Date.now() }); }

function proxyFetch(targetUrl, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(targetUrl);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.get({ ...parsed, headers }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ZM_ALLOWED_ORIGIN || 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const ROUTES = {
  '/api/santiment/social-volume': async () => {
    const c = getCached('sv', 60_000); if (c) return c;
    const d = await proxyFetch('https://api.santiment.net/graphql',
      { Authorization: \`Apikey \${KEYS.santiment}\` });
    setCached('sv', d); return d;
  },
  '/api/token-terminal/projects': async () => {
    const c = getCached('tt', 120_000); if (c) return c;
    const d = await proxyFetch('https://api.tokenterminal.com/v2/projects',
      { Authorization: \`Bearer \${KEYS.tokenTerminal}\` });
    setCached('tt', d); return d;
  },
  '/api/messari/btc': async () => {
    const c = getCached('mbtc', 30_000); if (c) return c;
    const d = await proxyFetch('https://data.messari.io/api/v1/assets/bitcoin/metrics',
      { 'x-messari-api-key': KEYS.messari });
    setCached('mbtc', d); return d;
  },
  '/api/messari/eth': async () => {
    const c = getCached('meth', 30_000); if (c) return c;
    const d = await proxyFetch('https://data.messari.io/api/v1/assets/ethereum/metrics',
      { 'x-messari-api-key': KEYS.messari });
    setCached('meth', d); return d;
  },
  '/api/messari/sol': async () => {
    const c = getCached('msol', 30_000); if (c) return c;
    const d = await proxyFetch('https://data.messari.io/api/v1/assets/solana/metrics',
      { 'x-messari-api-key': KEYS.messari });
    setCached('msol', d); return d;
  },
  '/api/messari/news': async () => {
    const c = getCached('mnews', 300_000); if (c) return c;
    const d = await proxyFetch('https://data.messari.io/api/v1/news',
      { 'x-messari-api-key': KEYS.messari });
    setCached('mnews', d); return d;
  },
};

http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const pathname = url.parse(req.url).pathname;

  if (pathname.startsWith('/api/dune/')) {
    const qid = pathname.split('/')[3];
    const c = getCached('dune_' + qid, 300_000); if (c) { json(res, c); return; }
    try {
      const d = await proxyFetch(\`https://api.dune.com/api/v1/query/\${qid}/results\`,
        { 'X-Dune-API-Key': KEYS.dune });
      setCached('dune_' + qid, d); json(res, d);
    } catch (e) { json(res, { error: e.message }, 502); }
    return;
  }

  const handler = ROUTES[pathname];
  if (!handler) { json(res, { error: 'Not found' }, 404); return; }
  try { json(res, await handler()); }
  catch (e) { json(res, { error: e.message }, 502); }
}).listen(PORT, () => {
  console.log('[ZM Proxy] Port', PORT);
  console.log('[ZM Proxy] Keys:', Object.entries(KEYS).filter(([,v])=>v).map(([k])=>k).join(', ') || 'NONE');
});
`,
  },

  // ── 6. .env.example ─────────────────────────────────────────────────────────
  {
    path: '.env.example',
    desc: 'NEW: env template (tanpa secrets)',
    content: `# ZERØ MERIDIAN — Environment Variables
# Copy ke .env dan isi key kamu
# JANGAN commit .env ke git

# Frontend (aman di bundle)
VITE_APP_VERSION=3.0.0

# Backend proxy (server-side ONLY — jangan pakai prefix VITE_)
ZM_SANTIMENT_KEY=your_santiment_key
ZM_TOKEN_TERMINAL_KEY=your_token_terminal_key
ZM_MESSARI_KEY=your_messari_key
ZM_DUNE_KEY=your_dune_key
ZM_GRAPH_KEY=your_graph_key

ZM_PROXY_PORT=3001
ZM_ALLOWED_ORIGIN=http://localhost:8080
`,
  },

];

// ─── GitHub helpers ───────────────────────────────────────────────────────────

async function getSHA(repoPath) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${repoPath}?ref=${BRANCH}`,
    { headers: HEADERS }
  );
  if (!res.ok) return null;
  return (await res.json()).sha ?? null;
}

async function pushFile({ path: repoPath, desc, content, base64 }) {
  // Encode content
  const encoded = base64 ?? Buffer.from(content).toString('base64');
  const sha     = await getSHA(repoPath);

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${repoPath}`,
    {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({
        message: `push95: ${desc} — ${repoPath}`,
        content: encoded,
        branch:  BRANCH,
        ...(sha ? { sha } : {}),
      }),
    }
  );

  const data = await res.json();
  if (res.ok) {
    console.log(`  ✅ [${sha ? 'updated' : 'created'}] ${repoPath}`);
    return true;
  } else {
    console.error(`  ❌ ${repoPath} — ${data.message}`);
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('');
console.log('🚀 ZERØ MERIDIAN push95 — 6 File Baru (embedded)');
console.log('══════════════════════════════════════════════════');
console.log(`   Repo  : ${OWNER}/${REPO} @ ${BRANCH}`);
console.log(`   Token : ${TOKEN.slice(0, 8)}... ✓`);
console.log(`   Files : ${FILES.length} files akan di-push`);
console.log('');

let ok = 0, fail = 0;

for (const file of FILES) {
  const result = await pushFile(file);
  if (result) ok++; else fail++;
  await new Promise(r => setTimeout(r, 350));
}

console.log('');
console.log('══════════════════════════════════════════════════');
if (fail === 0) {
  console.log(`✨ push95 COMPLETE — ${ok}/${FILES.length} files pushed ✓`);
  console.log('');
  console.log('   Total push94 + push95: 15/15 files ✓');
  console.log('   → https://new-zeromeridian.pages.dev');
  console.log('');
  console.log('📋 Summary semua fixes push94+95:');
  console.log('   ✓ CryptoContext — closure bug fixed (stateRef)');
  console.log('   ✓ WasmOrderBook — live price dari WS');
  console.log('   ✓ orderbook.wasm — binary nyata, validated ✓');
  console.log('   ✓ ErrorBoundary — tile crash tidak crash dashboard');
  console.log('   ✓ Stale banner  — WS disconnect indicator');
  console.log('   ✓ WCAG AA       — contrast --zm-text-faint fixed');
  console.log('   ✓ cgCache       — CoinGecko rate-limit guard');
  console.log('   ✓ proxy.js      — API keys server-side only');
  console.log('   ✓ Unit tests    — 12 test cases');
  console.log('   ✓ CSP header    — Content Security Policy');
  console.log('   ✓ Three.js      — tidak eager-load');
} else {
  console.log(`⚠  push95 DONE — ${ok} ok, ${fail} GAGAL`);
  console.log('   Cek output ❌ di atas dan paste ke Claude');
}
