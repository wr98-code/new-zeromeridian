// push69.mjs — ZERØ MERIDIAN
// Restore main.tsx ke ROOT (index.html butuh ./main.tsx)
// CARA PAKAI: cd D:\FILEK && node push69.mjs

const TOKEN  = "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";
const REPO   = "wr98-code/core-meridian-data";
const BRANCH = "main";

const HEADERS = {
  "Authorization": `token ${TOKEN}`,
  "Accept": "application/vnd.github.v3+json",
  "Content-Type": "application/json",
};

// main.tsx ROOT — import dari src/
const MAIN_TSX = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App.tsx';
import './index.css';

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
}

interface SyncManager {
  register(tag: string): Promise<void>;
}

interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  periodicSync?: PeriodicSyncManager;
  sync?: SyncManager;
}

async function registerSW(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', {
      scope:          '/',
      updateViaCache: 'none',
    }) as ExtendedServiceWorkerRegistration;
    reg.addEventListener('updatefound', () => {
      const next = reg.installing;
      if (!next) return;
      next.addEventListener('statechange', () => {
        if (next.state === 'installed' && navigator.serviceWorker.controller) {
          console.info('[ZM SW] Update available — reload to apply.');
        }
      });
    });
  } catch (err) {
    console.warn('[ZM SW] Registration failed:', err);
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('[ZM] Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ('requestIdleCallback' in window) {
  requestIdleCallback(registerSW);
} else {
  setTimeout(registerSW, 1000);
}
`;

async function createFile(path, content, message) {
  const r = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch: BRANCH,
      }),
    }
  );
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PUT ${path} => ${r.status}: ${t.slice(0,300)}`);
  }
  return r.json();
}

async function main() {
  console.log("=".repeat(55));
  console.log("  ZERØ MERIDIAN — push69 restore main.tsx ROOT");
  console.log("=".repeat(55));

  console.log("\n[1/1] Restoring main.tsx to ROOT...");
  await createFile('main.tsx', MAIN_TSX, 'push69: restore ROOT main.tsx (index.html needs ./main.tsx)');
  console.log("  OK: main.tsx restored!");

  console.log();
  console.log("=".repeat(55));
  console.log("  PUSH69 SELESAI!");
  console.log("  Vercel auto-deploy dalam 2-3 menit.");
  console.log("  Cek: https://core-meridian-data.vercel.app/dashboard");
  console.log("=".repeat(55));
}

main().catch(e => {
  console.error("\nERROR:", e.message);
  process.exit(1);
});
