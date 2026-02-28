/**
 * push92.mjs — ZERØ MERIDIAN push92
 * FIX: Dashboard rusak karena push91 import type yg tidak ada di repo ini
 *      Solusi: patch Dashboard kembali ke struktur push24 (proven work)
 *              + upgrade visual (section heads, mini ticker, clock, no self-claim copy)
 *
 * Files:
 *   src/pages/Dashboard.tsx      — patched: push24 struktur + visual upgrade
 *   src/contexts/CryptoContext.tsx — fix wsStatus + enhancedDispatch dep
 *   src/hooks/useCryptoData.ts    — fix skip WebTransport langsung WS
 *   src/components/shared/GlobalStatsBar.tsx — upgrade
 *   src/components/layout/Topbar.tsx         — upgrade
 *   src/components/layout/ZMSidebar.tsx      — upgrade
 *   src/index.css                — tambah missing CSS vars
 *
 * Usage: node push92.mjs
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
  'src/components/shared/GlobalStatsBar.tsx',
  'src/components/layout/Topbar.tsx',
  'src/components/layout/ZMSidebar.tsx',
  'src/pages/Dashboard.tsx',
];

async function getFileSHA(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' } }
  );
  if (res.status === 404) return null;
  const data = await res.json();
  return data.sha ?? null;
}

async function pushFile(filePath) {
  const absPath = resolve(__dirname, filePath);
  let content;
  try { content = readFileSync(absPath, 'utf-8'); }
  catch { console.error(`❌ ${filePath} — FILE NOT FOUND`); return; }

  const encoded = Buffer.from(content).toString('base64');
  const sha     = await getFileSHA(filePath);
  const body    = {
    message: `push92: Dashboard fix + Bloomberg overhaul — ${filePath}`,
    content: encoded, branch: BRANCH,
    ...(sha ? { sha } : {}),
  };

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (res.ok) console.log(`✅ ${filePath}`);
  else console.error(`❌ ${filePath} — ${data.message}`);
}

console.log('🚀 ZERØ MERIDIAN push92 — fixing Dashboard + Bloomberg overhaul...\n');
for (const f of FILES) {
  await pushFile(f);
  await new Promise(r => setTimeout(r, 300));
}
console.log('\n✨ push92 complete → Cloudflare Pages auto-deploy triggered');
console.log('   URL: https://new-zeromeridian.pages.dev');
console.log('\n📋 Fixed:');
console.log('   ✓ Dashboard — struktur proven push24, visual upgraded');
console.log('   ✓ Hapus "Institutional-grade" copy');
console.log('   ✓ WS RECONNECTING bug fixed');
console.log('   ✓ Sidebar / Topbar / StatsBar upgraded');
