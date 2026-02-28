/**
 * push90.mjs — ZERØ MERIDIAN push90
 * Changes:
 *   - fix: WS reconnecting issue — leader election 200ms → 50ms, no false RECONNECTING on first connect
 *   - fix: index.css — animate-flash-pos/neg aliases, legacy token aliases (--zm-accent, --zm-glass-bg, etc)
 *   - upgrade: Markets.tsx — full v30 token migration, lazy img, will-change, cleaner StatBox/DetailPanel
 *   - upgrade: Watchlist.tsx — full v30 token migration (zm-accent→zm-blue, zm-glass-bg→zm-surface, etc)
 *   - upgrade: Charts.tsx — remove hardcoded padding, Space Mono→var(--zm-font-data), v30 header
 *   - perf: all coin images now loading="lazy" decoding="async" for faster initial paint
 *
 * Usage: node push90.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OWNER  = 'wr98-code';
const REPO   = 'new-zeromeridian';
const BRANCH = 'main';
const TOKEN  = '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'; // ⚠️ ganti kalau expired

const FILES = [
  'src/index.css',
  'src/contexts/CryptoContext.tsx',
  'src/hooks/useCryptoData.ts',
  'src/pages/Markets.tsx',
  'src/pages/Watchlist.tsx',
  'src/pages/Charts.tsx',
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
  const content = readFileSync(absPath, 'utf-8');
  const encoded = Buffer.from(content).toString('base64');
  const sha     = await getFileSHA(filePath);

  const body = {
    message: `push90: v30 token migration, WS fix, perf upgrades — ${filePath}`,
    content: encoded,
    branch:  BRANCH,
    ...(sha ? { sha } : {}),
  };

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`,
    {
      method:  'PUT',
      headers: {
        Authorization:  `Bearer ${TOKEN}`,
        Accept:         'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (res.ok) {
    console.log(`✅ ${filePath}`);
  } else {
    console.error(`❌ ${filePath} — ${data.message}`);
  }
}

console.log('🚀 ZERØ MERIDIAN push90 — starting...\n');
for (const f of FILES) {
  await pushFile(f);
}
console.log('\n✨ push90 complete → Cloudflare Pages auto-deploy triggered');
console.log('   URL: https://new-zeromeridian.pages.dev');
