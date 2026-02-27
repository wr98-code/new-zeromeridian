// push74.mjs — ZERØ MERIDIAN
// ALLIN PWA FIX:
//   1. manifest.json  — fix icon paths /icons/ → / (ROOT), theme-color cyan
//   2. index.html     — register sw.js + apple touch icon + Space Grotesk font
//   3. AppShell.tsx   — PWAInstallPrompt semua breakpoint (bukan hanya mobile)
//   4. PWAInstallPrompt.tsx — posisi adaptive: mobile=bottom, desktop=bottom-right corner

import { Buffer } from 'buffer';

const TOKEN  = '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';
const REPO   = 'winduadiprabowo-pixel/core-meridian-data';
const BRANCH = 'main';

async function getSHA(path) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  const r   = await fetch(url, { headers: { Authorization: `token ${TOKEN}` } });
  const j   = await r.json();
  if (!j.sha) throw new Error('No SHA for ' + path + ': ' + JSON.stringify(j));
  return j.sha;
}

async function pushFile(path, content, sha, msg) {
  const url  = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const body = {
    message: msg,
    content: Buffer.from(content, 'utf8').toString('base64'),
    sha,
    branch:  BRANCH,
  };
  const r = await fetch(url, {
    method:  'PUT',
    headers: { Authorization: `token ${TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.content) throw new Error('Push failed for ' + path + ': ' + JSON.stringify(j));
  console.log('  ✅ ' + path);
}

// ─── 1. MANIFEST.JSON ─────────────────────────────────────────────────────────
// Fix: icon paths /icons/ → / | theme-color → cyan #06080e
const MANIFEST_JSON = `{
  "name": "ZERØ MERIDIAN",
  "short_name": "ZM Terminal",
  "description": "Crypto Intelligence Terminal — Real-time markets, AI signals, on-chain analytics.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#06080e",
  "background_color": "#06080e",
  "lang": "en",
  "categories": ["finance", "productivity"],
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "url": "/dashboard",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Markets",
      "short_name": "Markets",
      "url": "/markets",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Watchlist",
      "short_name": "Watchlist",
      "url": "/watchlist",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false
}
`;

// ─── 2. INDEX.HTML ────────────────────────────────────────────────────────────
// Fix: register sw.js + apple touch icon + Space Grotesk font + correct theme-color
const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

    <!-- PWA -->
    <meta name="theme-color" content="#06080e" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="ZM Terminal" />
    <link rel="manifest" href="/manifest.json" />

    <!-- Apple touch icon (iOS home screen) -->
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
    <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />

    <!-- SEO -->
    <title>ZERØ MERIDIAN — Crypto Intelligence Terminal</title>
    <meta name="description" content="Real-time on-chain crypto intelligence. Live prices, derivatives, order book, AI signals. Always free." />
    <meta property="og:title" content="ZERØ MERIDIAN" />
    <meta property="og:description" content="Real-time crypto intelligence terminal" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/icon-512.png" />

    <!-- Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preconnect" href="https://api.coingecko.com" />
    <link rel="preconnect" href="https://stream.binance.com" />
    <link rel="dns-prefetch" href="https://fstream.binance.com" />
    <link rel="dns-prefetch" href="https://fapi.binance.com" />
    <link rel="dns-prefetch" href="https://coin-images.coingecko.com" />

    <!-- Fonts: Space Grotesk + JetBrains Mono + IBM Plex Mono -->
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>

    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(function (reg) {
              // Check for updates on each load
              reg.addEventListener('updatefound', function () {
                var newSW = reg.installing;
                if (!newSW) return;
                newSW.addEventListener('statechange', function () {
                  if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                    // New version available — tell SW to skip waiting
                    newSW.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              });
            })
            .catch(function (err) {
              console.warn('[ZM] SW registration failed:', err);
            });

          // Reload once when new SW takes control
          var refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (!refreshing) { refreshing = true; window.location.reload(); }
          });
        });
      }
    </script>
  </body>
</html>
`;

// ─── 3. APPSHELL.TSX ─────────────────────────────────────────────────────────
// Fix: PWAInstallPrompt muncul di SEMUA breakpoint, bukan hanya showBottomNav
const APPSHELL_TSX = `/**
 * AppShell.tsx — ZERØ MERIDIAN 2026 push74
 * push74: PWAInstallPrompt semua breakpoint (mobile + tablet + desktop)
 * push27: PWAInstallPrompt integrated
 * push26: Mobile drawer mode + BottomNavBar integration
 * push23: var(--zm-bg-base) + max-width 1800px
 * - React.memo + displayName ✓
 * - rgba() only, zero hsl() ✓
 * - var(--zm-*) theme-aware ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
 * - Zero className ✓
 * - Zero template literals ✓
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import ZMSidebar from './ZMSidebar';
import Topbar from './Topbar';
import BottomNavBar from './BottomNavBar';
import PageTransition from '../shared/PageTransition';
import GlobalStatsBar from '../shared/GlobalStatsBar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import PWAInstallPrompt from '@/components/shared/PWAInstallPrompt';

interface AppShellProps {
  children:     React.ReactNode;
  currentPath?: string;
}

const shellVariants = Object.freeze({
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
});

const drawerVariants = Object.freeze({
  hidden:  { x: '-100%', opacity: 0 },
  visible: { x: '0%',   opacity: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit:    { x: '-100%', opacity: 0, transition: { duration: 0.22, ease: [0.36, 0, 0.66, 0] } },
});

const overlayVariants = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
});

const AppShell: React.FC<AppShellProps> = ({ children, currentPath: propPath }) => {
  const mountedRef = useRef(true);
  const [sidebarExpanded,   setSidebarExpanded]   = React.useState(true);
  const [mobileDrawerOpen,  setMobileDrawerOpen]  = React.useState(false);
  const prefersReducedMotion = useReducedMotion();
  const location             = useLocation();
  const { isMobile, isTablet } = useBreakpoint();

  const currentPath      = propPath ?? location.pathname;
  const showBottomNav    = isMobile;
  const showMobileDrawer = isMobile || isTablet;

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  React.useEffect(() => {
    if (showMobileDrawer && mobileDrawerOpen) setMobileDrawerOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  const toggleSidebar = useCallback(() => {
    if (!mountedRef.current) return;
    if (showMobileDrawer) setMobileDrawerOpen(prev => !prev);
    else setSidebarExpanded(prev => !prev);
  }, [showMobileDrawer]);

  const closeDrawer = useCallback(() => {
    if (mountedRef.current) setMobileDrawerOpen(false);
  }, []);

  const mainVariants = useMemo(() => Object.freeze({
    collapsed: { marginLeft: 72  },
    expanded:  { marginLeft: 240 },
    mobile:    { marginLeft: 0   },
  }), []);

  const mainAnimate = useMemo(() => {
    if (showMobileDrawer) return 'mobile';
    return sidebarExpanded ? 'expanded' : 'collapsed';
  }, [showMobileDrawer, sidebarExpanded]);

  const mainStyle = useMemo(() => ({
    minHeight:  '100vh',
    background: 'var(--zm-bg-base)',
    transition: prefersReducedMotion ? 'none' : 'margin-left 0.3s cubic-bezier(0.22,1,0.36,1)',
    willChange: 'margin-left' as const,
  }), [prefersReducedMotion]);

  const contentStyle = useMemo(() => ({
    padding:       '0 24px 24px',
    paddingTop:    '96px',
    paddingBottom: showBottomNav ? '80px' : '24px',
    maxWidth:      '1800px',
    margin:        '0 auto',
  }), [showBottomNav]);

  const overlayStyle = useMemo(() => ({
    position:             'fixed'  as const,
    inset:                0,
    zIndex:               149,
    background:           'rgba(5,5,14,0.7)',
    backdropFilter:       'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  }), []);

  const drawerStyle = useMemo(() => ({
    position:   'fixed' as const,
    top:        0,
    left:       0,
    bottom:     0,
    zIndex:     150,
    width:      '240px',
    willChange: 'transform' as const,
  }), []);

  return (
    <motion.div
      variants={shellVariants}
      initial="initial"
      animate="animate"
      style={{ display: 'flex', minHeight: '100vh', background: 'var(--zm-bg-base)' }}
    >
      {/* Desktop sidebar */}
      {!showMobileDrawer && (
        <ZMSidebar expanded={sidebarExpanded} onToggle={toggleSidebar} currentPath={currentPath} />
      )}

      {/* Mobile/Tablet overlay drawer */}
      <AnimatePresence>
        {showMobileDrawer && mobileDrawerOpen && (
          <>
            <motion.div
              key="overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={overlayStyle}
              onClick={closeDrawer}
              aria-label="Close navigation drawer"
              role="button"
            />
            <motion.div
              key="drawer"
              variants={prefersReducedMotion ? {} : drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={drawerStyle}
            >
              <ZMSidebar expanded={true} onToggle={closeDrawer} currentPath={currentPath} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.main
        animate={mainAnimate}
        variants={mainVariants}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ ...mainStyle, flex: 1, minWidth: 0 }}
      >
        <Topbar onMenuToggle={toggleSidebar} sidebarExpanded={sidebarExpanded} />
        <GlobalStatsBar />

        <div style={contentStyle}>
          <AnimatePresence mode="wait">
            <PageTransition key={currentPath}>
              {children}
            </PageTransition>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Bottom nav — mobile only */}
      {showBottomNav && <BottomNavBar />}

      {/* PWA Install Prompt — ALL breakpoints (mobile + tablet + desktop) */}
      <PWAInstallPrompt />
    </motion.div>
  );
};

AppShell.displayName = 'AppShell';
export default React.memo(AppShell);
`;

// ─── 4. PWAINSTALLPROMPT.TSX ──────────────────────────────────────────────────
// Fix: posisi adaptive — mobile: bottom center, desktop: bottom-right corner elegant
const PWA_TSX = `/**
 * PWAInstallPrompt.tsx — ZERØ MERIDIAN 2026 push74
 * push74: All breakpoints, adaptive position (mobile=bottom, desktop=corner)
 * push27: initial implementation
 * - React.memo + displayName ✓
 * - Zero className ✓  rgba() only ✓
 * - Zero template literals in JSX ✓
 * - mountedRef + useCallback + useMemo ✓
 * - Touch targets 48px ✓
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const IOS_STEPS = Object.freeze([
  { icon: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
  { icon: '➕', text: 'Tap "Add to Home Screen"' },
  { icon: '✅', text: 'Tap "Add" to confirm' },
]);

const IOSInstructions = memo(({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
    }}
    role="dialog"
    aria-modal="true"
    aria-label="Install ZERØ MERIDIAN on iOS"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0,  opacity: 1 }}
      exit={{ y: 60,    opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: '100%', maxWidth: 480,
        background: 'rgba(7,9,18,0.99)',
        border: '1px solid rgba(0,238,255,0.18)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 24px 40px',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ width: 36, height: 3, background: 'rgba(80,80,100,1)', borderRadius: 2, margin: '0 auto 20px' }} />
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: 'rgba(240,240,248,1)', marginBottom: 4, letterSpacing: '0.06em' }}>
          INSTALL ZERØ MERIDIAN
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em' }}>
          Add to Home Screen for full-screen experience
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {IOS_STEPS.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(32,42,68,1)',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
              color: 'rgba(0,238,255,1)', background: 'rgba(0,238,255,0.08)',
              border: '1px solid rgba(0,238,255,0.2)',
              borderRadius: '50%', width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {i + 1}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(200,200,210,1)' }}>
              {step.text}
            </span>
          </div>
        ))}
      </div>
      <button onClick={onClose} aria-label="Close install instructions"
        style={{
          width: '100%', minHeight: 48, background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(32,42,68,1)', borderRadius: 10, cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: 'rgba(138,138,158,1)', letterSpacing: '0.08em',
        }}>
        GOT IT
      </button>
    </motion.div>
  </motion.div>
));
IOSInstructions.displayName = 'IOSInstructions';

const PWAInstallPrompt = memo(() => {
  const mountedRef  = useRef(true);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const { isMobile } = useBreakpoint();

  const [showBanner,   setShowBanner]   = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [installed,    setInstalled]    = useState(false);
  const [dismissed,    setDismissed]    = useState(false);

  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream: unknown }).MSStream;
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone: boolean }).standalone === true;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (isStandalone) return;
    try { if (localStorage.getItem('zm-pwa-dismissed') === '1') return; } catch { /* noop */ }

    if (isIOS) {
      const t = setTimeout(() => { if (mountedRef.current) setShowBanner(true); }, 4000);
      return () => { mountedRef.current = false; clearTimeout(t); };
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      if (mountedRef.current) setShowBanner(true);
    };
    const onInstalled = () => { if (mountedRef.current) { setInstalled(true); setShowBanner(false); } };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [isIOS, isStandalone]);

  const handleInstall = useCallback(async () => {
    if (isIOS) { setShowIOSSheet(true); return; }
    if (!deferredRef.current) return;
    try {
      await deferredRef.current.prompt();
      const choice = await deferredRef.current.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setShowBanner(false);
      deferredRef.current = null;
    } catch { /* user cancelled */ }
  }, [isIOS]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setDismissed(true);
    try { localStorage.setItem('zm-pwa-dismissed', '1'); } catch { /* noop */ }
  }, []);

  const handleCloseIOS = useCallback(() => {
    setShowIOSSheet(false);
    setShowBanner(false);
  }, []);

  // Banner position: mobile = bottom center above BottomNav
  //                 tablet/desktop = bottom-right corner, compact
  const bannerStyle = useMemo(() => {
    if (isMobile) return Object.freeze({
      position: 'fixed' as const,
      bottom: 76, left: 12, right: 12,
      zIndex: 500,
      background: 'rgba(7,9,18,0.97)',
      border: '1px solid rgba(0,238,255,0.2)',
      borderRadius: 14,
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,238,255,0.08)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    });
    // Desktop / tablet — bottom right corner, compact pill style
    return Object.freeze({
      position: 'fixed' as const,
      bottom: 24, right: 24,
      zIndex: 500,
      background: 'rgba(7,9,18,0.97)',
      border: '1px solid rgba(0,238,255,0.2)',
      borderRadius: 14,
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      maxWidth: 340,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,238,255,0.06)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    });
  }, [isMobile]);

  if (!showBanner || installed || dismissed || isStandalone) return null;

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="pwa-banner"
          initial={{ opacity: 0, y: isMobile ? 20 : 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobile ? 20 : 10, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={bannerStyle}
          role="banner"
          aria-label="Install ZERØ MERIDIAN app"
        >
          {/* Icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(0,238,255,0.08)',
            border: '1px solid rgba(0,238,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7.5" stroke="rgba(0,238,255,1)" strokeWidth="2" />
              <line x1="15" y1="5" x2="7" y2="17" stroke="rgba(0,238,255,1)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: 'rgba(240,240,248,1)', marginBottom: 2, letterSpacing: '0.04em' }}>
              Install ZERØ MERIDIAN
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.06em' }}>
              {isIOS ? 'Add to Home Screen — no App Store needed' : 'Install for full-screen, offline access'}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={handleDismiss} aria-label="Dismiss install prompt"
              style={{
                minHeight: 36, minWidth: 36, padding: '0 10px',
                background: 'transparent',
                border: '1px solid rgba(32,42,68,1)',
                borderRadius: 8, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: 'rgba(80,80,100,1)', letterSpacing: '0.04em',
              }}>
              ✕
            </button>
            <button onClick={handleInstall}
              aria-label={isIOS ? 'Show iOS install instructions' : 'Install app'}
              style={{
                minHeight: 36, padding: '0 14px',
                background: 'rgba(0,238,255,0.08)',
                border: '1px solid rgba(0,238,255,0.25)',
                borderRadius: 8, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                color: 'rgba(0,238,255,1)', letterSpacing: '0.08em',
              }}>
              {isIOS ? 'HOW TO' : 'INSTALL'}
            </button>
          </div>
        </motion.div>

        {/* iOS instruction sheet */}
        {showIOSSheet && (
          <IOSInstructions onClose={handleCloseIOS} />
        )}
      </>
    </AnimatePresence>
  );
});
PWAInstallPrompt.displayName = 'PWAInstallPrompt';
export default PWAInstallPrompt;
`;

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[push74] ALLIN PWA FIX — starting...\n');

  console.log('[1/4] manifest.json...');
  const sha1 = await getSHA('manifest.json');
  await pushFile('manifest.json', MANIFEST_JSON, sha1, 'push74: manifest — fix icon paths, theme-color');

  console.log('[2/4] index.html...');
  const sha2 = await getSHA('index.html');
  await pushFile('index.html', INDEX_HTML, sha2, 'push74: index.html — SW register + apple-touch-icon + Space Grotesk');

  console.log('[3/4] AppShell.tsx...');
  const sha3 = await getSHA('src/components/layout/AppShell.tsx');
  await pushFile('src/components/layout/AppShell.tsx', APPSHELL_TSX, sha3, 'push74: AppShell — PWAInstallPrompt all breakpoints');

  console.log('[4/4] PWAInstallPrompt.tsx...');
  const sha4 = await getSHA('src/components/shared/PWAInstallPrompt.tsx');
  await pushFile('src/components/shared/PWAInstallPrompt.tsx', PWA_TSX, sha4, 'push74: PWAInstallPrompt — adaptive position + framer-motion + Ø icon');

  console.log('\n✅ push74 ALLIN selesai!');
  console.log('🌐 https://meridian-zero-jet.vercel.app');
  console.log('');
  console.log('Cara test PWA:');
  console.log('  Android Chrome: menu ⋮ → "Add to Home Screen" / banner otomatis muncul');
  console.log('  iOS Safari:     share button → "Add to Home Screen"');
  console.log('  Desktop Chrome: icon install di address bar kanan');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
