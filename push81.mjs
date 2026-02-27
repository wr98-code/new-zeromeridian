/**
 * push81.mjs — ZERØ MERIDIAN 2026
 * push81: New brand X logo + APK name fix
 * Changes:
 *   - src/components/shared/XLogo.tsx (NEW — crystal glowing X)
 *   - src/pages/Portal.tsx (use XLogo, remove CrystalLogo)
 *   - src/components/layout/Topbar.tsx (X icon in header)
 *   - public/manifest.json (short_name: "Zero Meridian")
 *   - public/icon-192.png (new X icon)
 *   - public/icon-512.png (new X icon)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO  = 'windujm-creator/new-meridian';
const TOKEN = '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';
const BRANCH = 'main';
const API = `https://api.github.com/repos/${REPO}/contents`;

const headers = {
  'Authorization': `token ${TOKEN}`,
  'Content-Type': 'application/json',
  'User-Agent': 'push81-script',
};

async function getFileSHA(filePath) {
  const url = `${API}/${filePath}?ref=${BRANCH}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha || null;
}

async function pushFile(filePath, localPath, message) {
  const content = fs.readFileSync(localPath);
  const b64 = content.toString('base64');
  const sha = await getFileSHA(filePath);
  const body = {
    message,
    content: b64,
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(`${API}/${filePath}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ ${filePath}:`, data.message);
    return false;
  }
  console.log(`✅ ${filePath}`);
  return true;
}

const files = [
  ['src/components/shared/XLogo.tsx',        './src/components/shared/XLogo.tsx'],
  ['src/pages/Portal.tsx',                    './src/pages/Portal.tsx'],
  ['src/components/layout/Topbar.tsx',        './src/components/layout/Topbar.tsx'],
  ['public/manifest.json',                    './public/manifest.json'],
  ['public/icon-192.png',                     './public/icon-192.png'],
  ['public/icon-512.png',                     './public/icon-512.png'],
];

console.log('🚀 push81 — Brand X logo + APK name fix\n');
for (const [repoPath, localPath] of files) {
  await pushFile(repoPath, localPath, `push81: ${repoPath}`);
}
console.log('\n✨ push81 done! Check: https://new-meridian-pearl.vercel.app');
