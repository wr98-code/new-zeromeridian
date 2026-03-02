#!/usr/bin/env node
/**
 * push136.mjs — ZERØ MERIDIAN
 * push136: Bloomberg Light fix — 7 file dark palette cleaned
 *
 * Jalankan dari D:\FILEK:
 *   $env:GH_TOKEN = "ghp_xxxx"
 *   node push136.mjs
 */

import { execSync }    from 'child_process';
import { existsSync }  from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PUSH_ID    = 'push136';
const COMMIT_MSG = 'push136: Bloomberg Light enforcement — 7 files fixed\\n\\n- HeatmapTile: neon palette → Bloomberg green/red/navy\\n- TradingViewChart: cyan/dark → Bloomberg Light\\n- NewsTickerTile: neon pink → Bloomberg red\\n- OfflineIndicator: dark panel → white card\\n- PWAInstallPrompt: dark panel → white, cyan → navy\\n- XLogo: drop-shadow cyan → Bloomberg navy\\n- Converter: rgba(255,68,136) → rgba(208,35,75)';

const DEST_DIR = join(__dirname, 'new-zeromeridian-main');

const log  = (msg) => console.log(`  ${msg}`);
const ok   = (msg) => console.log(`\x1b[32m  ✅ ${msg}\x1b[0m`);
const err  = (msg) => console.error(`\x1b[31m  ❌ ${msg}\x1b[0m`);
const info = (msg) => console.log(`\x1b[36m  ℹ  ${msg}\x1b[0m`);

function run(cmd, cwd = DEST_DIR) {
  return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe','pipe','pipe'] }).trim();
}

console.log('\n\x1b[1m\x1b[36m━━━ ZERØ MERIDIAN — PUSH136 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

// 1. Token
const token = process.env.GH_TOKEN;
if (!token) { err('GH_TOKEN tidak ada! Set dulu: $env:GH_TOKEN = "ghp_xxxx"'); process.exit(1); }
ok('GH_TOKEN found');

// 2. Folder check
if (!existsSync(DEST_DIR)) { err('Folder new-zeromeridian-main tidak ditemukan!'); process.exit(1); }
ok('Folder new-zeromeridian-main found');

// 3. Git status
log('Cek git status...');
const gitStatus = run('git status --porcelain');
if (!gitStatus) {
  info('Tidak ada perubahan. Pastikan file sudah dicopy dulu pakai copy_push136.ps1');
  process.exit(0);
}
const changed = gitStatus.split('\n').filter(Boolean);
info(`${changed.length} file changed:`);
changed.forEach(f => log('  ' + f));

// 4. Git add + commit
run('git add -A');
ok('git add -A done');

try {
  run(`git commit -m "${COMMIT_MSG}"`);
  ok('Committed: ' + PUSH_ID);
} catch(e) {
  if (e.message.includes('nothing to commit')) { info('Nothing to commit.'); process.exit(0); }
  err('Commit gagal: ' + e.message); process.exit(1);
}

// 5. Push
log('Setting remote...');
const remoteUrl = run('git remote get-url origin');
const repoPath  = remoteUrl.replace('https://github.com/','').replace(/^.*@github\.com[:/]/,'').replace(/\.git$/,'');
run(`git remote set-url origin "https://${token}@github.com/${repoPath}.git"`);
ok('Remote updated');

log('Pushing...');
try {
  const branch = run('git rev-parse --abbrev-ref HEAD');
  run(`git push origin ${branch}`);
  ok(`Push berhasil → ${branch}`);
} catch(e) {
  err('Push gagal: ' + (e.stderr || e.message));
  process.exit(1);
} finally {
  try {
    const url = run('git remote get-url origin');
    run(`git remote set-url origin "${url.replace(/https:\/\/[^@]+@/,'https://')}"`);
  } catch {}
}

console.log('\n\x1b[1m\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log('\x1b[1m\x1b[32m  🚀 PUSH136 BERHASIL! Vercel auto-deploy triggered.\x1b[0m');
console.log('\x1b[1m\x1b[32m  🔗 https://zeromeridian.vercel.app\x1b[0m');
console.log('\x1b[1m\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
