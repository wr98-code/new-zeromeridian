/**
 * push78.mjs — ZERØ MERIDIAN 2026
 * push78 changes:
 *   1. src/contexts/PWAInstallContext.tsx  — NEW: shared PWA install state context
 *   2. src/components/shared/PWAInstallPrompt.tsx  — UPGRADE: consume PWAInstallContext
 *   3. src/components/layout/Topbar.tsx  — UPGRADE: PWA Install button dengan pulse ring
 *   4. src/App.tsx  — UPGRADE: wrap dengan PWAInstallProvider
 *   5. icon-192.png  — UPGRADE: crystal Ø premium neon PNG
 *   6. icon-512.png  — UPGRADE: crystal Ø premium neon PNG 512x512
 *
 * Usage:
 *   cd D:\FILEK
 *   node push78.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const TOKEN  = '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';
const REPO   = 'windujm-creator/new-meridian';
const BRANCH = 'main';
const BASE   = 'https://api.github.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSHA(path) {
  const res = await fetch(`${BASE}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getSHA ${path}: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.sha ?? null;
}

async function pushFile(path, content, sha, msg) {
  const body = {
    message: msg,
    branch: BRANCH,
    content,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${BASE}/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`pushFile ${path}: ${res.status} ${txt}`);
  }
  return await res.json();
}

function toBase64(str) {
  return Buffer.from(str, 'utf8').toString('base64');
}

function fileToBase64(filePath) {
  const buf = readFileSync(filePath);
  return buf.toString('base64');
}

// ─── Files to push ────────────────────────────────────────────────────────────

// All content inlined (run from D:\FILEK, so paths are relative)
// The actual file content is read from same directory as this script.

const FILES = [
  {
    repoPath: 'src/contexts/PWAInstallContext.tsx',
    localPath: join(__dirname, 'push78_PWAInstallContext.tsx'),
    msg: 'push78: add PWAInstallContext — shared install state for Topbar + Banner',
    binary: false,
  },
  {
    repoPath: 'src/components/shared/PWAInstallPrompt.tsx',
    localPath: join(__dirname, 'push78_PWAInstallPrompt.tsx'),
    msg: 'push78: upgrade PWAInstallPrompt — consume PWAInstallContext, cleaner UI',
    binary: false,
  },
  {
    repoPath: 'src/components/layout/Topbar.tsx',
    localPath: join(__dirname, 'push78_Topbar.tsx'),
    msg: 'push78: Topbar — add PWA install button with pulse ring animation',
    binary: false,
  },
  {
    repoPath: 'src/App.tsx',
    localPath: join(__dirname, 'push78_App.tsx'),
    msg: 'push78: App — wrap with PWAInstallProvider',
    binary: false,
  },
  {
    repoPath: 'icon-192.png',
    localPath: join(__dirname, 'push78_icon-192.png'),
    msg: 'push78: icon-192 — crystal Ø premium neon PNG (Python-generated)',
    binary: true,
  },
  {
    repoPath: 'icon-512.png',
    localPath: join(__dirname, 'push78_icon-512.png'),
    msg: 'push78: icon-512 — crystal Ø premium neon PNG 512x512',
    binary: true,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   ZERØ MERIDIAN — push78                   ║');
  console.log('║   PWA Install button + Crystal Ø icons     ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');

  let ok = 0;
  let fail = 0;

  for (const f of FILES) {
    process.stdout.write(`  [→] ${f.repoPath} ... `);

    try {
      const sha = await getSHA(f.repoPath);
      const content = f.binary
        ? fileToBase64(f.localPath)
        : toBase64(readFileSync(f.localPath, 'utf8'));

      await pushFile(f.repoPath, content, sha, f.msg);
      console.log('✅ done' + (sha ? ' (updated)' : ' (created)'));
      ok++;
    } catch (err) {
      console.log('❌ FAILED');
      console.error('     ', err.message);
      fail++;
    }
  }

  console.log('');
  console.log(`  Result: ${ok} pushed, ${fail} failed`);
  console.log('');

  if (fail === 0) {
    console.log('  🚀 Vercel deploy triggered automatically.');
    console.log('  ⏱  Wait ~60s then check: https://new-meridian-pearl.vercel.app');
    console.log('');
    console.log('  push78 complete:');
    console.log('    ✓ PWA Install button di Topbar (pulse ring, tooltip, check state)');
    console.log('    ✓ PWAInstallContext — one shared install event, no duplicate listeners');
    console.log('    ✓ Crystal Ø icons 192+512 — neon cyan glow + shuriken spikes');
    console.log('    ✓ App.tsx wraps with PWAInstallProvider');
  } else {
    console.log('  ⚠️  Some files failed. Check errors above and retry.');
  }
  console.log('');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
