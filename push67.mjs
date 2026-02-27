// push67.mjs — ZERØ MERIDIAN
// Fix overlap: GlobalStatsBar fixed top:0, Topbar top:32, paddingTop:96
// CARA PAKAI: cd D:\FILEK && node push67.mjs

import { readFileSync } from 'fs';
import { join } from 'path';

const TOKEN  = "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";
const REPO   = "wr98-code/core-meridian-data";
const BRANCH = "main";

const HEADERS = {
  "Authorization": `token ${TOKEN}`,
  "Accept": "application/vnd.github.v3+json",
  "Content-Type": "application/json",
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getSHA(path) {
  const r = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}&t=${Date.now()}`,
    { headers: HEADERS }
  );
  if (!r.ok) throw new Error(`GET ${path} => ${r.status}`);
  const j = await r.json();
  return { sha: j.sha, content: Buffer.from(j.content, 'base64').toString('utf8') };
}

async function pushFile(path, content, message) {
  const { sha } = await getSHA(path);
  const r = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha,
        branch: BRANCH,
      }),
    }
  );
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PUT ${path} => ${r.status}: ${t.slice(0,200)}`);
  }
  return r.json();
}

async function main() {
  console.log("=".repeat(55));
  console.log("  ZERØ MERIDIAN — push67 fix overlap layout");
  console.log("=".repeat(55));

  // ── 1. Fix GlobalStatsBar — tambah position fixed top:0 zIndex:100
  console.log("\n[1/3] Patching GlobalStatsBar.tsx...");
  const { content: gsb } = await getSHA('src/components/shared/GlobalStatsBar.tsx');

  const gsbFixed = gsb.replace(
    `style={{\n        height: 32,\n        background: 'rgba(2,6,23,0.95)',\n        borderBottom: '1px solid rgba(96,165,250,0.1)',\n        backdropFilter: 'blur(12px)',\n      }}`,
    `style={{\n        position:   'fixed' as const,\n        top:        0,\n        left:       0,\n        right:      0,\n        zIndex:     100,\n        height:     32,\n        background: 'rgba(2,6,23,0.95)',\n        borderBottom: '1px solid rgba(96,165,250,0.1)',\n        backdropFilter: 'blur(12px)',\n        WebkitBackdropFilter: 'blur(12px)',\n      }}`
  );

  if (gsbFixed === gsb) {
    console.log("  WARN: GlobalStatsBar pattern not matched, trying alternate...");
    // Try simpler replacement
    const gsbFixed2 = gsb.replace(
      "height: 32,",
      "position: 'fixed' as const,\n        top: 0,\n        left: 0,\n        right: 0,\n        zIndex: 100,\n        height: 32,"
    );
    if (gsbFixed2 === gsb) throw new Error("GlobalStatsBar patch failed!");
    await pushFile('src/components/shared/GlobalStatsBar.tsx', gsbFixed2, 'push67: GlobalStatsBar fixed position top:0 zIndex:100');
  } else {
    await pushFile('src/components/shared/GlobalStatsBar.tsx', gsbFixed, 'push67: GlobalStatsBar fixed position top:0 zIndex:100');
  }
  console.log("  OK: GlobalStatsBar patched!");
  await sleep(500);

  // ── 2. Fix Topbar — top: 0 → top: 32
  console.log("\n[2/3] Patching Topbar.tsx...");
  const { content: topbar } = await getSHA('src/components/layout/Topbar.tsx');

  const topbarFixed = topbar.replace(
    "top:            0, right: 0, left: 0,",
    "top:            32, right: 0, left: 0,"
  );

  if (topbarFixed === topbar) throw new Error("Topbar patch failed! Pattern not found.");
  await pushFile('src/components/layout/Topbar.tsx', topbarFixed, 'push67: Topbar top:32 (below GlobalStatsBar)');
  console.log("  OK: Topbar patched!");
  await sleep(500);

  // ── 3. Fix AppShell — paddingTop 80px → 96px
  console.log("\n[3/3] Patching AppShell.tsx...");
  const { content: appshell } = await getSHA('src/components/layout/AppShell.tsx');

  const appshellFixed = appshell.replace(
    "paddingTop:    '80px',",
    "paddingTop:    '96px',"
  );

  if (appshellFixed === appshell) throw new Error("AppShell patch failed! Pattern not found.");
  await pushFile('src/components/layout/AppShell.tsx', appshellFixed, 'push67: paddingTop 96px (64 topbar + 32 statsbar)');
  console.log("  OK: AppShell patched!");

  console.log();
  console.log("=".repeat(55));
  console.log("  PUSH67 SELESAI! 3/3 files updated.");
  console.log("  Vercel auto-deploy dalam 2-3 menit.");
  console.log("  Cek: https://core-meridian-data.vercel.app/dashboard");
  console.log("=".repeat(55));
}

main().catch(e => {
  console.error("\nERROR:", e.message);
  process.exit(1);
});
