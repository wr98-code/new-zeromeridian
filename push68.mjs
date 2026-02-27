// push68.mjs — ZERØ MERIDIAN
// Revert GlobalStatsBar ke sticky (bukan fixed), fix AppShell order
// CARA PAKAI: cd D:\FILEK && node push68.mjs

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
  console.log("  ZERØ MERIDIAN — push68 fix layout clean");
  console.log("=".repeat(55));

  // ── 1. Revert GlobalStatsBar — hapus fixed, pakai sticky
  console.log("\n[1/3] Reverting GlobalStatsBar.tsx...");
  const { content: gsb } = await getSHA('src/components/shared/GlobalStatsBar.tsx');

  // Remove any fixed positioning we added
  let gsbFixed = gsb
    .replace(`position: 'fixed' as const,\n        top: 0,\n        left: 0,\n        right: 0,\n        zIndex: 100,\n        height: 32,`, `height: 32,`)
    .replace(`position:   'fixed' as const,\n        top:        0,\n        left:       0,\n        right:      0,\n        zIndex:     100,\n        height:     32,`, `height:     32,`)
    .replace(`position: 'fixed' as const,\n        top: 0,\n        left: 0,\n        right: 0,\n        zIndex: 100,\n        height:     32,`, `height:     32,`);

  // Add sticky positioning instead
  gsbFixed = gsbFixed.replace(
    `height: 32,`,
    `position: 'sticky' as const,\n        top: 0,\n        zIndex: 100,\n        height: 32,`
  );

  if (gsbFixed === gsb) {
    console.log("  WARN: no change needed in GlobalStatsBar");
  } else {
    await pushFile('src/components/shared/GlobalStatsBar.tsx', gsbFixed, 'push68: GlobalStatsBar sticky top:0');
    console.log("  OK: GlobalStatsBar → sticky");
  }
  await sleep(500);

  // ── 2. Fix AppShell — swap order: Topbar dulu, GlobalStatsBar sudah sticky di dalam scroll
  // Actually the real fix: move GlobalStatsBar INSIDE the fixed header area
  // Topbar top:32 + GlobalStatsBar sticky = clean
  console.log("\n[2/3] Fixing AppShell.tsx layout order...");
  const { content: appshell } = await getSHA('src/components/layout/AppShell.tsx');

  // Fix paddingTop to 96px (already done in push67, but ensure it's right)
  let appshellFixed = appshell
    .replace("paddingTop:    '80px',", "paddingTop:    '96px',")
    .replace("paddingTop: '80px',", "paddingTop: '96px',");

  // Move GlobalStatsBar before Topbar in the JSX — swap order
  appshellFixed = appshellFixed
    .replace(
      `<GlobalStatsBar />\n        <Topbar onMenuToggle={toggleSidebar} sidebarExpanded={sidebarExpanded} />`,
      `<Topbar onMenuToggle={toggleSidebar} sidebarExpanded={sidebarExpanded} />\n        <GlobalStatsBar />`
    );

  if (appshellFixed === appshell) {
    console.log("  WARN: AppShell no change");
  } else {
    await pushFile('src/components/layout/AppShell.tsx', appshellFixed, 'push68: move Topbar before GlobalStatsBar, paddingTop 96px');
    console.log("  OK: AppShell layout fixed");
  }
  await sleep(500);

  // ── 3. Fix Topbar — pastikan top: 32 (bukan 0)
  console.log("\n[3/3] Checking Topbar.tsx...");
  const { content: topbar } = await getSHA('src/components/layout/Topbar.tsx');

  // Should already be top:32 from push67, but make sure
  if (topbar.includes('top:            32,') || topbar.includes('top: 32,')) {
    console.log("  OK: Topbar already at top:32, no change needed");
  } else {
    const topbarFixed = topbar
      .replace("top:            0, right: 0, left: 0,", "top:            32, right: 0, left: 0,")
      .replace("top: 0, right: 0, left: 0,", "top: 32, right: 0, left: 0,");
    await pushFile('src/components/layout/Topbar.tsx', topbarFixed, 'push68: ensure Topbar top:32');
    console.log("  OK: Topbar top:32 confirmed");
  }

  console.log();
  console.log("=".repeat(55));
  console.log("  PUSH68 SELESAI!");
  console.log("  Vercel auto-deploy dalam 2-3 menit.");
  console.log("  Cek: https://core-meridian-data.vercel.app/dashboard");
  console.log("=".repeat(55));
}

main().catch(e => {
  console.error("\nERROR:", e.message);
  process.exit(1);
});
