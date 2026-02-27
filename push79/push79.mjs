/**
 * push79.mjs — ZERØ MERIDIAN
 * Mobile fix:
 *   - Topbar.tsx: hide nav + badges on mobile, overflow:hidden, responsive padding
 *   - AppShell.tsx: mobile padding 12px, overflowX:hidden, paddingBottom 84px
 * Run: node push79.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN  = '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';
const REPO   = 'windujm-creator/new-meridian';
const BRANCH = 'main';
const BASE   = 'https://api.github.com';

async function getSHA(path) {
  const r = await fetch(`${BASE}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github.v3+json' },
  });
  if (r.status === 404) return null;
  const d = await r.json();
  return d.sha ?? null;
}

async function pushFile(path, content, sha, msg) {
  const body = {
    message: msg,
    content: Buffer.from(content).toString('base64'),
    branch:  BRANCH,
    ...(sha ? { sha } : {}),
  };
  const r = await fetch(`${BASE}/repos/${REPO}/contents/${path}`, {
    method:  'PUT',
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept:        'application/vnd.github.v3+json',
      'Content-Type':'application/json',
    },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`Push failed ${path}: ${d.message}`);
  console.log(`  ✅ ${path}`);
  return d;
}

const FILES = [
  {
    path:    'src/components/layout/Topbar.tsx',
    local:   'push79_Topbar.tsx',
    msg:     'push79: Topbar mobile fix — hide nav/badges on mobile, overflow:hidden',
  },
  {
    path:    'src/components/layout/AppShell.tsx',
    local:   'push79_AppShell.tsx',
    msg:     'push79: AppShell mobile fix — 12px padding, overflowX:hidden, paddingBottom 84px',
  },
];

(async () => {
  console.log('\n🚀 push79 — ZERØ MERIDIAN Mobile Fix\n');
  let pushed = 0, failed = 0;

  for (const f of FILES) {
    try {
      const content = readFileSync(join(__dirname, f.local), 'utf8');
      const sha     = await getSHA(f.path);
      await pushFile(f.path, content, sha, f.msg);
      pushed++;
    } catch (e) {
      console.error(`  ❌ ${f.path}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n${pushed} pushed, ${failed} failed ${failed === 0 ? '🔥' : '⚠️'}`);
  if (failed === 0) {
    console.log('\nVercel auto-deploy dalam ~60 detik.');
    console.log('Live: https://new-meridian-pearl.vercel.app');
  }
})();
