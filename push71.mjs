// push71.mjs — ZERØ MERIDIAN
// FIX: header[aria-label] { top: 40px !important } → top: 32px !important
// FILES: index.css (ROOT) dan src/index.css (harus IDENTIK)
// Cara: fetch SHA → regex patch → PUT ke GitHub API

const TOKEN  = "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";
const REPO   = "wr98-code/core-meridian-data";
const BRANCH = "main";

async function getSHA(path) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`getSHA failed for ${path}: ${r.status} ${txt}`);
  }
  const j = await r.json();
  return { sha: j.sha, content: Buffer.from(j.content, "base64").toString("utf8") };
}

async function pushFile(path, content, sha, msg) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const body = {
    message: msg,
    content: Buffer.from(content, "utf8").toString("base64"),
    sha,
    branch: BRANCH,
  };
  const r = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`pushFile failed for ${path}: ${r.status} ${txt}`);
  }
  return r.json();
}

function patchCSS(css) {
  const before = css;

  // Fix 1: header[aria-label] top: 40px → 32px
  // Bug ini bikin Topbar muncul di top:40px padahal harusnya 32px (sesuai GlobalStatsBar height)
  const fixed = css.replace(
    /header\[aria-label\]\s*\{\s*top:\s*40px\s*!important;\s*\}/,
    "header[aria-label] { top: 32px !important; }"
  );

  if (fixed === before) {
    throw new Error("Regex tidak match! Pattern 'header[aria-label] { top: 40px' tidak ditemukan.");
  }

  return fixed;
}

async function main() {
  const FILES = [
    { path: "index.css",     label: "ROOT index.css" },
    { path: "src/index.css", label: "src/index.css"  },
  ];

  console.log("🚀 ZERØ MERIDIAN — push71 starting...");
  console.log("FIX: header[aria-label] top: 40px → 32px (kedua CSS files)\n");

  for (let i = 0; i < FILES.length; i++) {
    const f = FILES[i];
    console.log(`[${i + 1}/${FILES.length}] Fetching: ${f.label}`);

    const { sha, content } = await getSHA(f.path);
    console.log(`      SHA: ${sha}`);

    // Verify current state
    const currentTop = content.match(/header\[aria-label\]\s*\{[^}]+\}/)?.[0] ?? "(not found)";
    console.log(`      Current: ${currentTop.trim()}`);

    const patched = patchCSS(content);

    // Verify patch
    const patchedTop = patched.match(/header\[aria-label\]\s*\{[^}]+\}/)?.[0] ?? "(not found)";
    console.log(`      Patched: ${patchedTop.trim()}`);

    await pushFile(f.path, patched, sha, `push71: fix header top 40px→32px in ${f.path}`);
    console.log(`      ✅ Pushed!\n`);
  }

  console.log("═══════════════════════════════════════════════════");
  console.log("✅ push71 SELESAI!");
  console.log("");
  console.log("CHANGES:");
  console.log("  index.css (ROOT)  → header[aria-label] top: 32px !important");
  console.log("  src/index.css     → header[aria-label] top: 32px !important");
  console.log("  (kedua file IDENTIK ✓)");
  console.log("");
  console.log("LAYOUT FINAL:");
  console.log("  GlobalStatsBar: fixed top:0   height:32px  zIndex:100");
  console.log("  Topbar:         fixed top:32px height:64px  zIndex:50");
  console.log("  Content:        paddingTop:96px (32+64) ✓");
  console.log("");
  console.log("CEK: https://core-meridian-data.vercel.app/dashboard");
  console.log("═══════════════════════════════════════════════════");
}

main().catch(e => {
  console.error("❌ ERROR:", e.message);
  process.exit(1);
});
