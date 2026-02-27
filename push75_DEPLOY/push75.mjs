/**
 * push75.mjs — ZERØ MERIDIAN
 * Upload push75 ke GitHub: winduadiprabowo-pixel/core-meridian-data (main)
 *
 * CARA PAKAI:
 *   cd D:\FILEK\
 *   node push75.mjs
 *
 * Yang di-push (9 file):
 *   1. src/lib/apiQueue.ts              ← BARU  — rate limiter terpusat (fix H-04)
 *   2. src/components/shared/ErrorBoundary.tsx ← BARU — isolasi crash per tile (fix L-01)
 *   3. src/components/tiles/TradingViewChart.tsx ← FIX H-02 CDN→npm, FIX H-03 proxy→Binance direct
 *   4. src/components/tiles/HeatmapTile.tsx     ← FIX H-03 proxy→CoinGecko direct
 *   5. src/components/tiles/NewsTickerTile.tsx  ← FIX M-04 CryptoCompare→CoinGecko/RSS gratis
 *   6. src/pages/Dashboard.tsx                  ← ErrorBoundary di semua tiles
 *   7. vercel.json                              ← BARU — CSP headers + SPA routing
 *   8. vite.config.ts                           ← Update: hapus COEP, tambah vendor-charts chunk
 *   9. package.json                             ← Tambah lightweight-charts npm dep
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const TOKEN  = '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';
const REPO   = 'winduadiprabowo-pixel/core-meridian-data';
const BRANCH = 'main';
const BASE   = 'https://api.github.com';

// ─── FILES TO PUSH ───────────────────────────────────────────────────────────
// Format: [github_path, local_file_path_relative_to_script]

const FILES = [
  ['src/lib/apiQueue.ts',                          'src/lib/apiQueue.ts'],
  ['src/components/shared/ErrorBoundary.tsx',      'src/components/shared/ErrorBoundary.tsx'],
  ['src/components/tiles/TradingViewChart.tsx',    'src/components/tiles/TradingViewChart.tsx'],
  ['src/components/tiles/HeatmapTile.tsx',         'src/components/tiles/HeatmapTile.tsx'],
  ['src/components/tiles/NewsTickerTile.tsx',      'src/components/tiles/NewsTickerTile.tsx'],
  ['src/pages/Dashboard.tsx',                      'src/pages/Dashboard.tsx'],
  ['vercel.json',                                  'vercel.json'],
  ['vite.config.ts',                               'vite.config.ts'],
  ['package.json',                                 'package.json'],
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const headers = {
  'Authorization': 'token ' + TOKEN,
  'Content-Type':  'application/json',
  'User-Agent':    'ZM-push75',
};

async function getSHA(githubPath) {
  const url = BASE + '/repos/' + REPO + '/contents/' + githubPath + '?ref=' + BRANCH;
  const res = await fetch(url, { headers });
  if (res.status === 404) return null; // file baru, belum ada SHA
  if (!res.ok) {
    const err = await res.text();
    throw new Error('getSHA failed for ' + githubPath + ': ' + res.status + ' ' + err);
  }
  const data = await res.json();
  return data.sha ?? null;
}

async function pushFile(githubPath, content, sha, commitMsg) {
  const url  = BASE + '/repos/' + REPO + '/contents/' + githubPath;
  const body = {
    message: commitMsg,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch:  BRANCH,
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(url, {
    method:  'PUT',
    headers,
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('pushFile failed for ' + githubPath + ': ' + res.status + ' ' + err);
  }
  return res.json();
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          ZERØ MERIDIAN — push75                         ║');
  console.log('║  Fixes: H-02 H-03 H-04 M-04 L-01 + CSP + vite.config   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Repo   :', REPO);
  console.log('Branch :', BRANCH);
  console.log('Files  :', FILES.length);
  console.log('');

  let success = 0;
  let failed  = 0;

  for (const [githubPath, localPath] of FILES) {
    process.stdout.write('  [' + (success + failed + 1) + '/' + FILES.length + '] ' + githubPath + ' ... ');

    try {
      // Baca file lokal
      const fullPath = join(__dirname, localPath);
      const content  = readFileSync(fullPath, 'utf-8');

      // Ambil SHA terbaru (fresh fetch — jangan hardcode)
      const sha = await getSHA(githubPath);

      // Push ke GitHub
      const isNew = sha === null;
      const msg   = 'push75: ' + (isNew ? 'add' : 'fix') + ' ' + githubPath.split('/').pop();
      await pushFile(githubPath, content, sha, msg);

      console.log('✓ ' + (isNew ? '(NEW)' : '(updated)'));
      success++;

      // Delay kecil antar file — hindari rate limit GitHub API
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      console.log('✗ FAILED');
      console.error('    Error:', err.message);
      failed++;
    }
  }

  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log('  Done: ' + success + ' sukses, ' + failed + ' gagal');
  console.log('');

  if (success > 0) {
    console.log('  ✓ Vercel auto-deploy triggered (main branch push)');
    console.log('  ✓ Live in ~60s: https://meridian-zero-jet.vercel.app');
  }

  if (failed > 0) {
    console.log('  ✗ Ada file yang gagal — cek error di atas');
    process.exit(1);
  }

  console.log('');
  console.log('  push75 SUMMARY:');
  console.log('  • src/lib/apiQueue.ts              → BARU — rate limiter Binance + CoinGecko');
  console.log('  • ErrorBoundary.tsx                → BARU — isolasi crash per tile');
  console.log('  • TradingViewChart.tsx             → CDN → npm, proxy → Binance direct');
  console.log('  • HeatmapTile.tsx                  → proxy → CoinGecko direct');
  console.log('  • NewsTickerTile.tsx               → CryptoCompare → CoinGecko/RSS gratis');
  console.log('  • Dashboard.tsx                    → ErrorBoundary wrapping semua tiles');
  console.log('  • vercel.json                      → BARU — CSP + SPA routing');
  console.log('  • vite.config.ts                   → hapus COEP, tambah vendor-charts');
  console.log('  • package.json                     → tambah lightweight-charts@4.2.0');
  console.log('');
}

main().catch(err => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
