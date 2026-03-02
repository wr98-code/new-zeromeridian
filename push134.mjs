#!/usr/bin/env node
/**
 * push134.mjs — ZERØ MERIDIAN Auto-Push Script
 * Jalankan dari D:\FILEK:
 *   node push134.mjs
 *
 * Token via env:
 *   $env:GH_TOKEN = "ghp_xxxx"   (PowerShell)
 *   node push134.mjs
 *
 * push134: 4 CRITICAL FIXES
 *   - FIX 1: Security.tsx → GoPlus Security API (was api.example.com FAKE)
 *   - FIX 2: SmartMoney.tsx → real Binance whale wallet tracker (was address=0x broken)
 *   - FIX 3: WasmOrderBook.tsx → Binance WebSocket depth stream (was buildLevels() simulasi)
 *   - FIX 4: Dashboard/Tokens/SmartMoney/Derivatives/Intelligence → Bloomberg Light theme
 */

import { execSync }                    from 'child_process';
import { existsSync, copyFileSync,
         mkdirSync, readFileSync }     from 'fs';
import { join, dirname }               from 'path';
import { fileURLToPath }               from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────

const PUSH_ID    = 'push134';
const COMMIT_MSG = 'push134: 4 CRITICAL FIXES — real market data + Bloomberg Light theme\n\n- FIX 1: Security.tsx → GoPlus Security API (was api.example.com FAKE)\n- FIX 2: SmartMoney.tsx → real Binance whale wallet tracker (was address=0x broken)\n- FIX 3: WasmOrderBook.tsx → Binance WebSocket depth stream (was buildLevels() simulasi)\n- FIX 4: Dashboard/Tokens/SmartMoney/Derivatives/Intelligence → Bloomberg Light theme\n  const C: rgba(15,40,180) accent | rgba(248,249,252) bg | rgba(255,255,255) card';

const DEST_DIR = join(__dirname, 'new-zeromeridian-main');

// Files to copy from D:\FILEK root → new-zeromeridian-main
// (these were already copied manually before running this script)
const FILES_TO_VERIFY = [
  'Dashboard.tsx',
  'Tokens.tsx',
  'SmartMoney.tsx',
  'Derivatives.tsx',
  'Intelligence.tsx',
  'WasmOrderBook.tsx',
  'Security.tsx',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log  = (msg) => console.log(`  ${msg}`);
const ok   = (msg) => console.log(`\x1b[32m  ✅ ${msg}\x1b[0m`);
const err  = (msg) => console.error(`\x1b[31m  ❌ ${msg}\x1b[0m`);
const info = (msg) => console.log(`\x1b[36m  ℹ  ${msg}\x1b[0m`);
const warn = (msg) => console.log(`\x1b[33m  ⚠  ${msg}\x1b[0m`);

function run(cmd, cwd = DEST_DIR) {
  return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe','pipe','pipe'] }).trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('\n\x1b[1m\x1b[36m━━━ ZERØ MERIDIAN — PUSH134 Auto Push ━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

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
  process.exit(1);
}
ok('Folder new-zeromeridian-main found');

// 3. Verify all fixed files exist in new-zeromeridian-main
log('Verifikasi file push134 di new-zeromeridian-main...');
let allGood = true;
for (const f of FILES_TO_VERIFY) {
  const p = join(DEST_DIR, f);
  if (existsSync(p)) {
    ok(`  ${f} ✓`);
  } else {
    err(`  ${f} TIDAK ADA di new-zeromeridian-main!`);
    allGood = false;
  }
}
if (!allGood) {
  err('Ada file yang kurang! Pastikan semua file sudah dicopy ke new-zeromeridian-main.');
  process.exit(1);
}

// 4. Git status
log('Cek git status...');
let gitStatus;
try {
  gitStatus = run('git status --porcelain');
} catch (e) {
  err('Git error: ' + e.message);
  process.exit(1);
}

if (!gitStatus) {
  info('Tidak ada perubahan di git. File mungkin sudah sama.');
  info('Coba cek apakah file sudah ter-copy dengan benar.');
  process.exit(0);
}

const changedFiles = gitStatus.split('\n').filter(Boolean);
info(`${changedFiles.length} file(s) changed:`);
changedFiles.forEach(f => log('  ' + f));

// 5. Git add
log('Git add...');
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

// 8. Git push
log('Pushing ke GitHub...');
try {
  const branch = run('git rev-parse --abbrev-ref HEAD');
  run(`git push origin ${branch}`);
  ok(`Push berhasil → branch: ${branch}`);
} catch (e) {
  err('git push gagal:');
  console.error(e.stderr || e.message);
  process.exit(1);
}

// 9. Reset remote URL (remove token)
try {
  const remoteUrl = run('git remote get-url origin');
  const cleanUrl = remoteUrl.replace(/https:\/\/[^@]+@/, 'https://');
  run(`git remote set-url origin "${cleanUrl}"`);
} catch {}

console.log('\n\x1b[1m\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log('\x1b[1m\x1b[32m  🚀 PUSH134 BERHASIL! Vercel auto-deploy triggered.\x1b[0m');
console.log('\x1b[1m\x1b[32m  🔗 https://zeromeridian.vercel.app\x1b[0m');
console.log('\x1b[1m\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
