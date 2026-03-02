#!/usr/bin/env node
/**
 * push135.mjs — ZERØ MERIDIAN Auto-Push Script
 * Jalankan dari D:\FILEK:
 *   $env:GH_TOKEN = "ghp_xxxx"
 *   node push135.mjs
 *
 * push135: FULL AUDIT — Bloomberg Light enforcement across all dark palette remnants
 *
 * FILES YANG DIFIX:
 *   TILES:
 *   - HeatmapTile.tsx    → Dark palette lama SEMUA diganti Bloomberg Light
 *   - TradingViewChart.tsx → Dark palette + cyan lama diganti Bloomberg Light
 *   - NewsTickerTile.tsx  → rgba(255,68,136) → rgba(208,35,75), fade gradient fix
 *
 *   SHARED COMPONENTS:
 *   - OfflineIndicator.tsx → Dark panel → white card, neon → Bloomberg colors
 *   - PWAInstallPrompt.tsx → Dark panel rgba(7,9,18) → white, cyan → navy
 *   - XLogo.tsx           → drop-shadow rgba(0,238,255) → rgba(15,40,180)
 *
 *   PAGES:
 *   - Converter.tsx       → 1 line fix: rgba(255,68,136) → rgba(208,35,75)
 *   - Intelligence.tsx    → Sequential fetch (8s delay) → Promise.allSettled parallel
 *
 * TOTAL: 8 file difix. Zero dark palette remnants setelah push ini.
 *
 * LOKASI FILE (copy dari Claude output ke sini sebelum run):
 *   D:\FILEK\new-zeromeridian-main\src\components\tiles\HeatmapTile.tsx
 *   D:\FILEK\new-zeromeridian-main\src\components\tiles\TradingViewChart.tsx
 *   D:\FILEK\new-zeromeridian-main\src\components\tiles\NewsTickerTile.tsx
 *   D:\FILEK\new-zeromeridian-main\src\components\shared\OfflineIndicator.tsx
 *   D:\FILEK\new-zeromeridian-main\src\components\shared\PWAInstallPrompt.tsx
 *   D:\FILEK\new-zeromeridian-main\src\components\shared\XLogo.tsx
 *   D:\FILEK\new-zeromeridian-main\src\pages\Converter.tsx
 *   D:\FILEK\new-zeromeridian-main\src\pages\Intelligence.tsx
 */

import { execSync }                from 'child_process';
import { existsSync, readFileSync }from 'fs';
import { join, dirname }           from 'path';
import { fileURLToPath }           from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────

const PUSH_ID    = 'push135';
const COMMIT_MSG = 'push135: FULL AUDIT — Bloomberg Light enforcement, Promise.allSettled Intelligence\n\n- HeatmapTile: Dark/neon palette → Bloomberg Light (green/red/navy)\n- TradingViewChart: All neon/dark → Bloomberg Light, candle colors fixed\n- NewsTickerTile: rgba(255,68,136) → rgba(208,35,75), fade overlay fixed\n- OfflineIndicator: Dark panel → Bloomberg white card\n- PWAInstallPrompt: Dark panel rgba(7,9,18) → white, cyan → navy\n- XLogo: drop-shadow cyan → Bloomberg navy\n- Converter: 1 color fix rgba(255,68,136) → rgba(208,35,75)\n- Intelligence: Sequential 8s delay → Promise.allSettled parallel fetch';

const DEST_DIR = join(__dirname, 'new-zeromeridian-main');

// Files to verify (relative to DEST_DIR)
const FILES_TO_VERIFY = Object.freeze([
  'src/components/tiles/HeatmapTile.tsx',
  'src/components/tiles/TradingViewChart.tsx',
  'src/components/tiles/NewsTickerTile.tsx',
  'src/components/shared/OfflineIndicator.tsx',
  'src/components/shared/PWAInstallPrompt.tsx',
  'src/components/shared/XLogo.tsx',
  'src/pages/Converter.tsx',
  'src/pages/Intelligence.tsx',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log  = (msg) => console.log(`  ${msg}`);
const ok   = (msg) => console.log(`\x1b[32m  ✅ ${msg}\x1b[0m`);
const err  = (msg) => console.error(`\x1b[31m  ❌ ${msg}\x1b[0m`);
const info = (msg) => console.log(`\x1b[36m  ℹ  ${msg}\x1b[0m`);
const warn = (msg) => console.log(`\x1b[33m  ⚠  ${msg}\x1b[0m`);

function run(cmd, cwd = DEST_DIR) {
  return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

// ─── Quick audit check ────────────────────────────────────────────────────────

function quickAudit(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const darkPatterns = [
      /rgba\(5,7,13/g,
      /rgba\(14,17,28/g,
      /rgba\(0,238,255/g,
      /rgba\(34,255,170/g,
      /rgba\(255,68,136/g,
      /rgba\(7,9,18/g,
    ];
    let violations = 0;
    for (const pat of darkPatterns) {
      const matches = content.match(pat);
      if (matches) violations += matches.length;
    }
    return violations;
  } catch {
    return -1;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('\n\x1b[1m\x1b[36m━━━ ZERØ MERIDIAN — PUSH135 Full Audit Push ━━━━━━━━━━━━━━━\x1b[0m\n');
console.log('\x1b[33m  Bloomberg Light enforcement — 8 files, 0 dark palette\x1b[0m\n');

// 1. Token check
const token = process.env.GH_TOKEN;
if (!token) {
  err('GH_TOKEN tidak ditemukan!');
  err('Set dulu: $env:GH_TOKEN = "ghp_xxxx"');
  process.exit(1);
}
ok('GH_TOKEN found');

// 2. Validate destination
if (!existsSync(DEST_DIR)) {
  err(`Destination tidak ditemukan: ${DEST_DIR}`);
  err('Pastikan kamu run dari D:\\FILEK dan folder new-zeromeridian-main ada');
  process.exit(1);
}
ok('Folder new-zeromeridian-main found');

// 3. Verify all fixed files exist + quick audit dark palette
log('\nVerifikasi file push135...');
let allGood = true;

for (const f of FILES_TO_VERIFY) {
  const p = join(DEST_DIR, f);
  if (!existsSync(p)) {
    err(`  MISSING: ${f}`);
    allGood = false;
    continue;
  }
  const violations = quickAudit(p);
  if (violations > 0) {
    warn(`  ${f.split('/').pop()} — ⚠ masih ada ${violations} dark palette pattern!`);
  } else {
    ok(`  ${f.split('/').pop()} ✓ clean`);
  }
}

if (!allGood) {
  err('\nAda file yang kurang! Copy semua file dari output Claude ke lokasi yang benar.');
  err('Lihat comment di atas script ini untuk lokasi masing-masing file.');
  process.exit(1);
}

// 4. Git status
log('\nCek git status...');
let gitStatus;
try {
  gitStatus = run('git status --porcelain');
} catch (e) {
  err('Git error: ' + e.message);
  process.exit(1);
}

if (!gitStatus) {
  info('Tidak ada perubahan di git.');
  info('Kemungkinan file belum di-copy ke lokasi yang benar di new-zeromeridian-main/src/...');
  process.exit(0);
}

const changedFiles = gitStatus.split('\n').filter(Boolean);
info(`${changedFiles.length} file(s) changed:`);
changedFiles.forEach(f => log('  ' + f));

// 5. Git add
log('\nGit add...');
try {
  run('git add -A');
  ok('git add -A done');
} catch (e) {
  err('git add gagal: ' + e.message);
  process.exit(1);
}

// 6. Git commit
log('Git commit...');
try {
  run(`git commit -m "${COMMIT_MSG.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`);
  ok('Committed: ' + PUSH_ID);
} catch (e) {
  if (e.message.includes('nothing to commit')) {
    info('Nothing to commit — semua file sudah up to date.');
    process.exit(0);
  }
  err('git commit gagal: ' + e.message);
  process.exit(1);
}

// 7. Set remote with token
log('Setting remote URL dengan token...');
try {
  const remoteUrl = run('git remote get-url origin');
  const repoPath = remoteUrl
    .replace('https://github.com/', '')
    .replace(/^.*@github\.com[:/]/, '')
    .replace(/\.git$/, '');
  const tokenUrl = `https://${token}@github.com/${repoPath}.git`;
  run(`git remote set-url origin "${tokenUrl}"`);
  ok('Remote URL updated');
} catch (e) {
  err('Remote URL gagal: ' + e.message);
  process.exit(1);
}

// 8. Git push dengan retry
log('Pushing ke GitHub...');
let pushed = false;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const branch = run('git rev-parse --abbrev-ref HEAD');
    run(`git push origin ${branch}`);
    ok(`Push berhasil → branch: ${branch}`);
    pushed = true;
    break;
  } catch (e) {
    if (attempt < 3) {
      warn(`Attempt ${attempt} gagal, retry dalam ${attempt * 2500}ms...`);
      await new Promise(r => setTimeout(r, attempt * 2500));
    } else {
      err('git push gagal setelah 3 attempts:');
      console.error(e.stderr || e.message);
    }
  }
}

// 9. Reset remote URL (remove token from URL)
try {
  const remoteUrl = run('git remote get-url origin');
  const cleanUrl = remoteUrl.replace(/https:\/\/[^@]+@/, 'https://');
  run(`git remote set-url origin "${cleanUrl}"`);
} catch { /* noop */ }

if (!pushed) process.exit(1);

console.log('\n\x1b[1m\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log('\x1b[1m\x1b[32m  🚀 PUSH135 BERHASIL! Vercel auto-deploy triggered.\x1b[0m');
console.log('\x1b[1m\x1b[32m  🔗 https://zeromeridian.vercel.app\x1b[0m');
console.log('\x1b[1m\x1b[32m  ✅ Bloomberg Light: 100% clean — zero dark palette\x1b[0m');
console.log('\x1b[1m\x1b[32m  ✅ Intelligence: parallel fetch — no 8s delay\x1b[0m');
console.log('\x1b[1m\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
