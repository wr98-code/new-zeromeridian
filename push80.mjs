/**
 * push80.mjs — ZERØ MERIDIAN
 * Combined push79b + push80:
 *   CRITICAL FIXES:
 *     - public/manifest.json  → Vite publicDir fix (was at root, not served in prod)
 *     - public/sw.js          → Service worker now in publicDir
 *     - public/offline.html   → Offline page now in publicDir
 *     - public/icon-192.png   → PWA icon now in publicDir
 *     - public/icon-512.png   → PWA icon now in publicDir
 *     - main.tsx              → Full SW registration (periodicSync + backgroundSync)
 *   PUSH80 DASHBOARD REDESIGN:
 *     - src/pages/Dashboard.tsx → Bloomberg Terminal density
 *       · Dense header: regime + signal + fear&greed + clock in 1 row
 *       · 10-asset ticker with sparklines
 *       · 6-column metric grid (single row desktop)
 *       · Gap 8px, section margins 12px (was 24px)
 *       · Chart 360px, tiles 220px — more content above fold
 *
 * Run: node push80.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN  = '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';
const REPO   = 'windujm-creator/new-meridian';
const BRANCH = 'main';
const BASE   = 'https://api.github.com';

// ─── GitHub API helpers ───────────────────────────────────────────────────────

async function getSHA(path) {
  const r = await fetch(`${BASE}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (r.status === 404) return null;
  const d = await r.json();
  return d.sha ?? null;
}

async function pushFile(path, content, sha, msg) {
  const body = {
    message: msg,
    content: Buffer.isBuffer(content)
      ? content.toString('base64')
      : Buffer.from(content, 'utf8').toString('base64'),
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };
  const r = await fetch(`${BASE}/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`Push failed ${path}: ${d.message}`);
  console.log(`  ✅ ${path}`);
  return d;
}

// ─── File manifest ────────────────────────────────────────────────────────────

const FILES = [
  // ── CRITICAL: public dir fixes ──────────────────────────────────────
  {
    repo:   'public/manifest.json',
    local:  'push80_public_manifest.json',
    msg:    'push80: fix — manifest.json moved to public/ (Vite publicDir)',
    binary: false,
  },
  {
    repo:   'public/sw.js',
    local:  'push80_public_sw.js',
    msg:    'push80: fix — sw.js moved to public/ (served at /sw.js in prod)',
    binary: false,
  },
  {
    repo:   'public/offline.html',
    local:  'push80_public_offline.html',
    msg:    'push80: fix — offline.html moved to public/',
    binary: false,
  },
  {
    repo:   'public/icon-192.png',
    local:  'push80_public_icon-192.png',
    msg:    'push80: fix — icon-192 moved to public/',
    binary: true,
  },
  {
    repo:   'public/icon-512.png',
    local:  'push80_public_icon-512.png',
    msg:    'push80: fix — icon-512 moved to public/',
    binary: true,
  },
  // ── main.tsx: full SW registration ──────────────────────────────────
  {
    repo:   'main.tsx',
    local:  'push80_main.tsx',
    msg:    'push80: main.tsx — periodicSync + backgroundSync registration',
    binary: false,
  },
  // ── Dashboard: Bloomberg density redesign ────────────────────────────
  {
    repo:   'src/pages/Dashboard.tsx',
    local:  'push80_Dashboard.tsx',
    msg:    'push80: Dashboard — Bloomberg density, 6-col metrics, tight grid, sparklines',
    binary: false,
  },
];

// ─── Run ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n🚀 push80 — ZERØ MERIDIAN | Critical Fixes + Bloomberg Dashboard\n');
  console.log('Files to push:', FILES.length);
  console.log('─'.repeat(52));

  let pushed = 0;
  let failed = 0;

  for (const f of FILES) {
    try {
      const filePath = join(__dirname, f.local);
      const content  = f.binary
        ? readFileSync(filePath)                    // Buffer for binary
        : readFileSync(filePath, 'utf8');           // string for text

      const sha  = await getSHA(f.repo);
      await pushFile(f.repo, content, sha, f.msg);
      pushed++;
    } catch (e) {
      console.error(`  ❌ ${f.repo}: ${e.message}`);
      failed++;
    }
  }

  console.log('\n' + '─'.repeat(52));
  console.log(pushed + ' pushed, ' + failed + ' failed ' + (failed === 0 ? '🔥' : '⚠️'));

  if (failed === 0) {
    console.log('\n✅ Vercel auto-deploy dalam ~60 detik.');
    console.log('🌐 https://new-meridian-pearl.vercel.app');
    console.log('\nWhat\'s live:');
    console.log('  · PWA assets sekarang di /public (manifest, sw, icons, offline)');
    console.log('  · main.tsx: periodicSync + backgroundSync aktif');
    console.log('  · Dashboard: Bloomberg density — 6-col grid, 10-asset ticker');
  } else {
    console.log('\n⚠️  ' + failed + ' file(s) gagal. Cek error di atas.');
  }
})();
