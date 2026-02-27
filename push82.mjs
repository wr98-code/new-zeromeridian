/**
 * push82.mjs — ZERØ MERIDIAN 2026
 * push82: Coming Soon untuk dummy pages + Tokens page REAL API (CoinGecko)
 */
import fs from 'fs';

const REPO   = 'windujm-creator/new-meridian';
const TOKEN  = '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';
const BRANCH = 'main';
const API    = `https://api.github.com/repos/${REPO}/contents`;
const HDR    = { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'push82' };

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
    body: JSON.stringify({ message: `push82: ${repoPath}`, content, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  const d = await r.json();
  console.log(r.ok ? `✅ ${repoPath}` : `❌ ${repoPath}: ${d.message}`);
}

const files = [
  // New shared component
  ['src/components/shared/ComingSoon.tsx',  './src/components/shared/ComingSoon.tsx'],
  // Real API pages
  ['src/hooks/useTrendingTokens.ts',         './src/hooks/useTrendingTokens.ts'],
  ['src/pages/Tokens.tsx',                   './src/pages/Tokens.tsx'],
  // Coming Soon pages (dummy replaced)
  ['src/pages/Networks.tsx',                 './src/pages/Networks.tsx'],
  ['src/pages/SmartMoney.tsx',               './src/pages/SmartMoney.tsx'],
  ['src/pages/Security.tsx',                 './src/pages/Security.tsx'],
  ['src/pages/Portfolio.tsx',                './src/pages/Portfolio.tsx'],
  ['src/pages/Intelligence.tsx',             './src/pages/Intelligence.tsx'],
];

console.log('🚀 push82 — Coming Soon + Real Tokens API\n');
for (const [repo, local] of files) await push(repo, local);
console.log('\n✨ Done! https://new-meridian-pearl.vercel.app');
