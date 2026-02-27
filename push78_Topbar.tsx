/**
 * Topbar.tsx — ZERØ MERIDIAN 2026 push78
 * push78: PWA Install button — real-time native install trigger in Topbar.
 *   - Animated install icon button (download + Ø glow)
 *   - Pulse ring animation when install available
 *   - usePWAInstall() from PWAInstallContext
 *   - "Installed" checkmark state
 * push23: Theme toggle, var(--zm-*), live clock
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX ✓
 * - Zero className ✓
 * - will-change: transform ✓
 * - useCallback + useMemo + mountedRef ✓
 * - aria-label + role ✓
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { usePerformance } from '@/hooks/usePerformance';
import { usePWAInstall } from '@/contexts/PWAInstallContext';

interface TopbarProps {
  onMenuToggle:    () => void;
  sidebarExpanded: boolean;
}

const IS_DEV = import.meta.env.DEV;

const NAV_ITEMS = Object.freeze([
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Markets',   path: '/markets' },
  { label: 'DeFi',      path: '/defi' },
  { label: 'Portal',    path: '/' },
]);

// ─── Icons ────────────────────────────────────────────────────────────────────

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Download arrow + base line icon
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 2v7M4 6.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── PWA Install Button ───────────────────────────────────────────────────────

const PWAInstallButton = React.memo(() => {
  const prefersReducedMotion = useReducedMotion();
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [justInstalled, setJustInstalled] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isInstalled && mountedRef.current) {
      setJustInstalled(true);
      const t = setTimeout(() => { if (mountedRef.current) setJustInstalled(false); }, 3000);
      return () => clearTimeout(t);
    }
  }, [isInstalled]);

  const handleClick = useCallback(async () => {
    await triggerInstall();
  }, [triggerInstall]);

  // Only show if can install OR just installed
  if (!canInstall && !justInstalled) return null;

  const btnStyle = useMemo(() => ({
    position:       'relative' as const,
    width:          '32px',
    height:         '32px',
    borderRadius:   '8px',
    background:     justInstalled
      ? 'rgba(34,255,170,0.08)'
      : 'rgba(0,238,255,0.07)',
    border:         '1px solid ' + (justInstalled ? 'rgba(34,255,170,0.3)' : 'rgba(0,238,255,0.28)'),
    cursor:         justInstalled ? 'default' : 'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    color:          justInstalled ? 'rgba(34,255,170,1)' : 'rgba(0,238,255,1)',
    willChange:     'transform' as const,
    boxShadow:      justInstalled
      ? '0 0 10px rgba(34,255,170,0.15)'
      : '0 0 10px rgba(0,238,255,0.1)',
    flexShrink:     0,
  }), [justInstalled]);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Pulse ring — only when can install and not yet triggered */}
      {canInstall && !justInstalled && !prefersReducedMotion && (
        <motion.div
          style={{
            position:     'absolute',
            inset:        -3,
            borderRadius: 11,
            border:       '1px solid rgba(0,238,255,0.35)',
            pointerEvents:'none',
          }}
          animate={{ opacity: [0.8, 0, 0.8], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.button
        type="button"
        style={btnStyle}
        whileHover={prefersReducedMotion || justInstalled ? {} : { scale: 1.1, boxShadow: '0 0 18px rgba(0,238,255,0.22)' }}
        whileTap={prefersReducedMotion || justInstalled ? {} : { scale: 0.92 }}
        onClick={justInstalled ? undefined : handleClick}
        aria-label={justInstalled ? 'ZERØ MERIDIAN installed' : 'Install ZERØ MERIDIAN app'}
        title={justInstalled ? 'App installed!' : 'Install ZERØ MERIDIAN'}
        disabled={justInstalled}
      >
        <AnimatePresence mode="wait">
          {justInstalled ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.22 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <CheckIcon />
            </motion.span>
          ) : (
            <motion.span
              key="dl"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.22 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <DownloadIcon />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip label */}
      {canInstall && !justInstalled && (
        <div style={{
          position:       'absolute',
          top:            '110%',
          right:          0,
          marginTop:      4,
          background:     'rgba(7,9,18,0.98)',
          border:         '1px solid rgba(0,238,255,0.18)',
          borderRadius:   6,
          padding:        '4px 8px',
          fontFamily:     "'JetBrains Mono', monospace",
          fontSize:       9,
          fontWeight:     700,
          color:          'rgba(0,238,255,0.9)',
          letterSpacing:  '0.1em',
          whiteSpace:     'nowrap' as const,
          pointerEvents:  'none',
          boxShadow:      '0 4px 16px rgba(0,0,0,0.4)',
          zIndex:         100,
        }}>
          INSTALL APP
        </div>
      )}
    </div>
  );
});
PWAInstallButton.displayName = 'PWAInstallButton';

// ─── Topbar ───────────────────────────────────────────────────────────────────

const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, sidebarExpanded }) => {
  const mountedRef           = useRef(true);
  const prefersReducedMotion = useReducedMotion();
  const [time, setTime]      = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  const { theme, setTheme }  = useTheme();
  const { metrics }          = usePerformance(IS_DEV);

  const isDark = theme !== 'light';

  useEffect(() => {
    mountedRef.current = true;
    const interval = setInterval(() => {
      if (mountedRef.current) setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, []);

  const handleToggle = useCallback(() => { onMenuToggle(); }, [onMenuToggle]);

  const handleThemeToggle = useCallback(() => {
    if (mountedRef.current) setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const topbarStyle = useMemo(() => ({
    position:             'fixed' as const,
    top:                  32, right: 0, left: 0,
    zIndex:               50,
    height:               '64px',
    background:           'var(--zm-topbar-bg)',
    backdropFilter:       'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom:         '1px solid var(--zm-glass-border)',
    display:              'flex',
    alignItems:           'center',
    padding:              '0 24px',
    gap:                  '16px',
  }), []);

  const logoTextStyle = useMemo(() => ({
    fontFamily:           "'Space Mono', monospace",
    fontSize:             '16px',
    fontWeight:           700,
    letterSpacing:        '0.12em',
    background:           'linear-gradient(135deg, rgba(99,179,237,1) 0%, rgba(154,230,180,1) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor:  'transparent',
    backgroundClip:       'text',
  }), []);

  const indicatorStyle = useMemo(() => ({
    width: '8px', height: '8px',
    borderRadius: '50%',
    background: 'rgba(154,230,180,1)',
    boxShadow: '0 0 8px rgba(154,230,180,0.6)',
  }), []);

  const menuBtnStyle = useMemo(() => ({
    background:     'var(--zm-glass-bg)',
    border:         '1px solid var(--zm-glass-border)',
    borderRadius:   '8px',
    padding:        '8px',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    color:          'var(--zm-text-secondary)',
    willChange:     'transform' as const,
  }), []);

  const timeStyle = useMemo(() => ({
    fontFamily:    "'Space Mono', monospace",
    fontSize:      '12px',
    color:         'var(--zm-text-faint)',
    letterSpacing: '0.08em',
  }), []);

  const statusBadgeStyle = useMemo(() => ({
    display:       'flex',
    alignItems:    'center',
    gap:           '6px',
    background:    'rgba(154,230,180,0.08)',
    border:        '1px solid rgba(154,230,180,0.2)',
    borderRadius:  '20px',
    padding:       '4px 10px',
    fontSize:      '11px',
    fontFamily:    "'Space Mono', monospace",
    color:         'rgba(154,230,180,0.9)',
    letterSpacing: '0.06em',
  }), []);

  const themeBtnStyle = useMemo(() => ({
    width:          '32px',
    height:         '32px',
    borderRadius:   '8px',
    background:     'var(--zm-glass-bg)',
    border:         '1px solid var(--zm-glass-border)',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    color:          'var(--zm-text-secondary)',
    willChange:     'transform' as const,
  }), []);

  const fpsBadgeStyle = useMemo(() => ({
    display:       'flex',
    alignItems:    'center',
    gap:           '4px',
    background:    metrics.isSmooth ? 'rgba(52,211,153,0.06)' : 'rgba(251,113,133,0.08)',
    border:        '1px solid ' + (metrics.isSmooth ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.3)'),
    borderRadius:  '12px',
    padding:       '2px 8px',
    fontSize:      '9px',
    fontFamily:    "'JetBrains Mono', monospace",
    color:         metrics.isSmooth ? 'rgba(52,211,153,0.8)' : 'rgba(251,113,133,0.8)',
    letterSpacing: '0.04em',
    willChange:    'transform' as const,
  }), [metrics.isSmooth]);

  return (
    <header role="banner" style={topbarStyle} aria-label="Application topbar">
      <motion.button
        onClick={handleToggle}
        style={menuBtnStyle}
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={sidebarExpanded}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <motion.rect x="2" y="4" width="14" height="1.5" rx="0.75" fill="currentColor"
            animate={sidebarExpanded ? { width: 14 } : { width: 10 }}
            transition={{ duration: 0.2 }} />
          <rect x="2" y="8.25" width="10" height="1.5" rx="0.75" fill="currentColor" />
          <motion.rect x="2" y="12.5" width="14" height="1.5" rx="0.75" fill="currentColor"
            animate={sidebarExpanded ? { width: 14 } : { width: 6 }}
            transition={{ duration: 0.2 }} />
        </svg>
      </motion.button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={indicatorStyle} aria-hidden="true" />
        <span style={logoTextStyle} aria-label="ZERØ MERIDIAN">ZERØ MERIDIAN</span>
      </div>

      <nav role="navigation" aria-label="Main navigation" style={{ display: 'flex', gap: '4px', marginLeft: '32px' }}>
        {NAV_ITEMS.map((item) => (
          <motion.a
            key={item.path}
            href={item.path}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: "'Space Mono', monospace",
              color: 'var(--zm-text-secondary)',
              textDecoration: 'none',
              letterSpacing: '0.06em',
            }}
            whileHover={prefersReducedMotion ? {} : {
              background: 'var(--zm-glass-bg)',
              color: 'var(--zm-text-primary)',
            }}
            aria-label={item.label}
          >
            {item.label}
          </motion.a>
        ))}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={timeStyle} aria-live="polite" aria-atomic="true">{time}</span>

        {/* FPS monitor — dev only */}
        {IS_DEV && (
          <div style={fpsBadgeStyle} role="status" aria-label={'FPS: ' + metrics.fps}>
            <span>{metrics.fps}</span>
            <span style={{ opacity: 0.5 }}>fps</span>
            {metrics.latencyMs > 0 && (
              <span style={{ opacity: 0.6, marginLeft: 2 }}>
                {metrics.latencyMs + 'ms'}
              </span>
            )}
          </div>
        )}

        {/* ── PWA Install button — push78 NEW ── */}
        <PWAInstallButton />

        {/* Theme toggle */}
        <motion.button
          onClick={handleThemeToggle}
          style={themeBtnStyle}
          whileHover={prefersReducedMotion ? {} : { scale: 1.08 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </motion.button>

        {/* Live badge */}
        <div style={statusBadgeStyle} role="status" aria-label="Network status: live">
          <motion.div
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(154,230,180,1)' }}
            animate={prefersReducedMotion ? {} : { opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            aria-hidden="true"
          />
          LIVE
        </div>

        {/* Profile */}
        <motion.button
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,179,237,0.3) 0%, rgba(154,230,180,0.3) 100%)',
            border: '1px solid var(--zm-glass-border)',
            cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            color: 'var(--zm-text-primary)',
            fontFamily: "'Space Mono', monospace",
            willChange: 'transform' as const,
          }}
          whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          aria-label="User profile"
        >
          W
        </motion.button>
      </div>
    </header>
  );
};

Topbar.displayName = 'Topbar';
export default React.memo(Topbar);
