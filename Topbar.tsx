/**
 * Topbar.tsx — ZERØ MERIDIAN push93
 * 36px height — Bloomberg terminal slim topbar
 * ZERO className | var(--zm-*) | React.memo | useMemo | mountedRef
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import CommandPalette from '../shared/CommandPalette';

interface TopbarProps {
  onMenuToggle: () => void; sidebarExpanded: boolean;
  topOffset: number; height: number; sidebarWidth: number;
}

const LiveClock = React.memo(() => {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })
  );
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => {
      if (mountedRef.current) setTime(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }));
    }, 1000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      <motion.div
        style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--zm-positive)', flexShrink: 0 }}
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 10, fontWeight: 600, color: 'var(--zm-text-2)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {time} <span style={{ color: 'var(--zm-text-4)', fontWeight: 400, fontSize: 9 }}>UTC</span>
      </span>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, sidebarExpanded, topOffset, height, sidebarWidth }) => {
  const rm = useReducedMotion();
  const { theme, setTheme } = useTheme();
  const { isMobile } = useBreakpoint();
  const { canInstall, triggerInstall } = usePWAInstall();
  const mountedRef = useRef(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const isDark = theme !== 'light';

  useEffect(() => {
    mountedRef.current = true;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (mountedRef.current) setCmdOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => { mountedRef.current = false; window.removeEventListener('keydown', handler); };
  }, []);

  const toggleTheme = useCallback(() => {
    if (mountedRef.current) setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const topbarS = useMemo(() => ({
    position:             'fixed' as const,
    top:                  topOffset,
    left:                 sidebarWidth,
    right:                0,
    zIndex:               190,
    height:               height,
    background:           'rgba(10,13,18,0.98)',
    backdropFilter:       'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom:         '1px solid rgba(255,255,255,0.06)',
    display:              'flex',
    alignItems:           'center',
    padding:              isMobile ? '0 10px' : '0 16px',
    gap:                  6,
    transition:           rm ? 'none' : `left 220ms cubic-bezier(0.22,1,0.36,1)`,
  }), [topOffset, sidebarWidth, height, isMobile, rm]);

  const btnS = useMemo((): React.CSSProperties => ({
    width: 24, height: 24, borderRadius: 4,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--zm-text-3)', flexShrink: 0, outline: 'none',
    transition: 'all 100ms ease',
  }), []);

  const searchS = useMemo(() => ({
    flex: 1, maxWidth: isMobile ? 'none' : 220,
    height: 24, display: 'flex', alignItems: 'center', gap: 6,
    padding: '0 8px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 4, cursor: 'pointer', outline: 'none',
    transition: 'border-color 100ms ease',
  }), [isMobile]);

  return (
    <>
      <header style={topbarS} aria-label="Top navigation bar">
        {/* Hamburger */}
        <button type="button" onClick={onMenuToggle} style={btnS} aria-label="Toggle menu">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <line x1="1" y1="2.5" x2="10" y2="2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="1" y1="8.5" x2="10" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Search */}
        <button type="button" onClick={() => setCmdOpen(true)} style={searchS as React.CSSProperties} aria-label="Open command palette (Ctrl+K)">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="4" cy="4" r="3" stroke="var(--zm-text-4)" strokeWidth="1.1"/>
            <line x1="6.5" y1="6.5" x2="9" y2="9" stroke="var(--zm-text-4)" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--zm-font-ui)', fontSize: 11, color: 'var(--zm-text-3)', flex: 1, textAlign: 'left' }}>
            {isMobile ? 'Search...' : 'Search pages...'}
          </span>
          {!isMobile && (
            <kbd style={{
              fontFamily: 'var(--zm-font-data)', fontSize: 8,
              padding: '1px 4px', borderRadius: 3,
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--zm-text-4)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>⌘K</kbd>
          )}
        </button>

        <div style={{ flex: 1 }} />
        {!isMobile && <LiveClock />}

        {/* Theme toggle */}
        <button type="button" onClick={toggleTheme} style={btnS} aria-label="Toggle theme">
          {isDark ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.1"/>
              <line x1="5" y1="0.5" x2="5" y2="1.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="5" y1="8.3" x2="5" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="0.5" y1="5" x2="1.7" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="8.3" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M8.5 5.5A3.5 3.5 0 1 1 4.5 1.5a2.5 2.5 0 0 0 4 4z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        {canInstall && (
          <motion.button type="button" onClick={triggerInstall} whileTap={{ scale: 0.95 }}
            style={{ ...btnS, color: 'var(--zm-cyan)' }} aria-label="Install app">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1.5v5M3.5 5L5 7l1.5-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1.5 8h7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </motion.button>
        )}
      </header>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
};

Topbar.displayName = 'Topbar';
export default React.memo(Topbar);
