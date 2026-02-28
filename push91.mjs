/**
 * push91.mjs — ZERØ MERIDIAN push91 FINAL
 * Bloomberg Terminal Grade — Upload 7 files sekaligus
 *
 * FIX CRITICAL:
 *   - useCryptoData.ts  → Skip WebTransport, langsung connectWS()
 *   - CryptoContext.tsx → wsStatus 'connecting', enhancedDispatch dep fix
 *
 * OVERHAUL:
 *   - GlobalStatsBar, Topbar, ZMSidebar, Dashboard — Bloomberg premium
 *   - index.css → missing vars: zm-font-*, zm-text-1/2/3, zm-border, colors
 *
 * Usage: node push91.mjs
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
    message: `push91: Bloomberg overhaul — ${filePath}`,
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

console.log('🚀 ZERØ MERIDIAN push91 FINAL — starting...\n');
for (const f of FILES) {
  await pushFile(f);
  await new Promise(r => setTimeout(r, 300));
}
console.log('\n✨ push91 complete → Cloudflare Pages auto-deploy triggered');
console.log('   URL: https://new-zeromeridian.pages.dev');
console.log('\n📋 Fixed: WS bug | Dashboard | Sidebar | Topbar | StatsBar | CSS vars');
