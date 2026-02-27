/**
 * push75_fix.mjs — ZERØ MERIDIAN 2026
 * Fix push: upload src/lib/motion.ts + src/lib/tokens.ts
 * Usage: node push75_fix.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const TOKEN  = "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";
const REPO   = "winduadiprabowo-pixel/core-meridian-data";
const BRANCH = "main";
const BASE   = `https://api.github.com/repos/${REPO}/contents`;

const HEADERS = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type":  "application/json",
  "User-Agent":    "ZM-PushScript/75",
  "X-GitHub-Api-Version": "2022-11-28",
};

// ─── File Map ─────────────────────────────────────────────────────────────────
// key   = path di GitHub repo
// value = path file lokal di D:\FILEK\

const FILES = {
  "src/lib/motion.ts": join(__dirname, "motion.ts"),
  "src/lib/tokens.ts": join(__dirname, "tokens.ts"),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSHA(repoPath) {
  const url = `${BASE}/${repoPath}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 404) return null;               // file baru, belum ada
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`getSHA(${repoPath}) ${res.status}: ${txt.slice(0,120)}`);
  }
  const json = await res.json();
  // Jika response adalah array (directory listing), SHA tidak ada
  if (Array.isArray(json)) return null;
  return json.sha ?? null;
}

async function pushFile(repoPath, localPath, sha, msg) {
  const raw     = readFileSync(localPath, "utf-8");
  const content = Buffer.from(raw, "utf-8").toString("base64");

  const body = { message: msg, content, branch: BRANCH };
  if (sha) body.sha = sha;        // update kalau sudah ada

  const url = `${BASE}/${repoPath}`;
  const res = await fetch(url, {
    method:  "PUT",
    headers: HEADERS,
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    // Tampilkan 200 char pertama agar kelihatan kalau isi HTML
    throw new Error(`pushFile(${repoPath}) ${res.status}: ${txt.slice(0,200)}`);
  }
  return await res.json();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("  ZERØ MERIDIAN push75_fix — motion.ts + tokens.ts");
  console.log("=".repeat(60));

  const entries = Object.entries(FILES);
  let passed = 0;
  let failed = 0;

  for (const [repoPath, localPath] of entries) {
    try {
      // Verify local file exists & is valid TS (not HTML)
      const raw = readFileSync(localPath, "utf-8");
      if (raw.trim().startsWith("<!DOCTYPE") || raw.trim().startsWith("<html")) {
        throw new Error(`Local file is HTML, not TypeScript! Check: ${localPath}`);
      }

      process.stdout.write(`  ⏳ ${repoPath} ... `);

      const sha  = await getSHA(repoPath);
      const msg  = sha
        ? `fix(lib): restore ${repoPath.split("/").pop()} — was corrupt HTML [push75_fix]`
        : `feat(lib): add ${repoPath.split("/").pop()} [push75_fix]`;

      await pushFile(repoPath, localPath, sha, msg);
      console.log(`✅ ${sha ? "updated" : "created"}`);
      passed++;
    } catch (err) {
      console.log(`❌ FAILED`);
      console.error(`     → ${err.message}`);
      failed++;
    }
  }

  console.log("=".repeat(60));
  console.log(`  ✅ SUCCESS: ${passed} files`);
  if (failed > 0) {
    console.log(`  ❌ FAILED:  ${failed} files`);
  }
  console.log("=".repeat(60));

  if (failed === 0) {
    console.log("");
    console.log("  🌐 Vercel auto-deploy dimulai...");
    console.log("  🔗 Live: https://meridian-zero-jet.vercel.app");
  } else {
    console.log("");
    console.log("  ⚠️  Ada file gagal. Cek pesan error di atas.");
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
