/**
 * push84.mjs — ZERØ MERIDIAN 2026
 * push84: Networks REAL (public RPC) + Security REAL (GoPlus API, no key)
 */
import fs from 'fs';

const REPO   = 'windujm-creator/new-meridian';
const TOKEN  = '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';
const BRANCH = 'main';
const API    = `https://api.github.com/repos/${REPO}/contents`;
const HDR    = { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'push84' };

async function getSHA(path) {
  const r = await fetch(`${API}/${path}?ref=${BRANCH}`, { headers: HDR });
  if (!r.ok) return null;
  return (await r.json()).sha ?? null;
}

async function push(repoPath, localPath) {
  const content = fs.readFileSync(localPath).toString('base64');
  const sha = await getSHA(repoPath);
  const r = await fetch(`${API}/${repoPath}`, {
    method: 'PUT', headers: HDR,
    body: JSON.stringify({ message: `push84: ${repoPath}`, content, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  const d = await r.json();
  console.log(r.ok ? `✅ ${repoPath}` : `❌ ${repoPath}: ${d.message}`);
}

const files = [
  ['src/hooks/useNetworkStats.ts',    './src/hooks/useNetworkStats.ts'],
  ['src/hooks/useTokenSecurity.ts',   './src/hooks/useTokenSecurity.ts'],
  ['src/pages/Networks.tsx',          './src/pages/Networks.tsx'],
  ['src/pages/Security.tsx',          './src/pages/Security.tsx'],
];

console.log('🚀 push84 — Networks + Security REAL DATA\n');
for (const [repo, local] of files) await push(repo, local);
console.log('\n✨ Done! https://new-meridian-pearl.vercel.app');
