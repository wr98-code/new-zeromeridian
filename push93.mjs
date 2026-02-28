/**
 * push93.mjs — ZERØ MERIDIAN push93
 * Bloomberg Terminal Grade — Total Visual Overhaul
 *
 * Design Principles:
 *   Background: #0d1117 dark navy (bukan hitam total — mata nyaman 12 jam)
 *   Card:       #161b22 satu level lebih terang dari bg
 *   Radius:     4px terminal (bukan 16px mobile app)
 *   Positif:    teal #26a69a (bukan neon hijau)
 *   Negatif:    deep red #ef5350
 *   Font angka: JetBrains Mono
 *   TopBar:     36px slim
 *   StatsBar:   26px ultra compact
 *   Sidebar:    200px / 44px collapsed
 *
 * Files: 8 files total
 *
 * Usage: node push93.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OWNER  = 'wr98-code';
const REPO   = 'new-zeromeridian';
const BRANCH = 'main';
const TOKEN  = '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';

const FILES = [
  'src/index.css',
  'src/contexts/CryptoContext.tsx',
  'src/hooks/useCryptoData.ts',
  'src/components/layout/AppShell.tsx',
  'src/components/shared/GlobalStatsBar.tsx',
  'src/components/layout/Topbar.tsx',
  'src/components/layout/ZMSidebar.tsx',
  'src/components/shared/GlassCard.tsx',
  'src/components/shared/MetricCard.tsx',
  'src/pages/Dashboard.tsx',
];

async function getSHA(path) {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' } });
  if (r.status === 404) return null;
  return (await r.json()).sha ?? null;
}

async function push(filePath) {
  let content;
  try { content = readFileSync(resolve(__dirname, filePath), 'utf-8'); }
  catch { console.error(`❌ ${filePath} — tidak ditemukan`); return; }

  const sha = await getSHA(filePath);
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `push93: Bloomberg grade overhaul — ${filePath}`,
      content: Buffer.from(content).toString('base64'),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  const d = await res.json();
  if (res.ok) console.log(`✅ ${filePath}`);
  else console.error(`❌ ${filePath} — ${d.message}`);
}

console.log('🚀 push93 — Bloomberg Terminal Grade Overhaul\n');
for (const f of FILES) { await push(f); await new Promise(r => setTimeout(r, 300)); }
console.log('\n✨ push93 complete → https://new-zeromeridian.pages.dev');
console.log('\n📋 Changes:');
console.log('   ✓ index.css     — dark navy bg, 4px radius, teal/red palette');
console.log('   ✓ AppShell      — 26px+36px header, 200/44px sidebar');
console.log('   ✓ GlobalStatsBar — 26px ultra compact');
console.log('   ✓ Topbar         — 36px slim');
console.log('   ✓ ZMSidebar      — 200px expanded, compact density');
console.log('   ✓ GlassCard      — 4px radius, compact padding');
console.log('   ✓ MetricCard     — Bloomberg terminal style, dense');
console.log('   ✓ Dashboard      — clean header, no self-claim copy');
