/**
 * Topbar.tsx — ZERØ MERIDIAN v30
 * Bloomberg-grade topbar with command palette trigger
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import CommandPalette from '../shared/CommandPalette';

interface TopbarProps {
  onMenuToggle:    () => void;
  sidebarExpanded: boolean;
  topOffset:       number;
  height:          number;
  sidebarWidth:    number;
}

const LiveClock = React.memo(() => {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })
  );
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => {
      if (mountedRef.current)
        setTime(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }));
    }, 1000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <motion.div
        style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--zm-green)', flexShrink: 0 }}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span style={{
        fontFamily: 'var(--zm-font-data)',
        fontSize:   10,
        color:      'var(--zm-text-3)',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}>
        {time} UTC
      </span>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

const Topbar: React.FC<TopbarProps> = ({
  onMenuToggle, sidebarExpanded, topOffset, height, sidebarWidth,
}) => {
  const rm            = useReducedMotion();
  const { theme, setTheme } = useTheme();
  const { isMobile }  = useBreakpoint();
  const { canInstall, triggerInstall } = usePWAInstall();
  const mountedRef    = useRef(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const isDark = theme !== 'light';

  useEffect(() => {
    mountedRef.current = true;
    // Keyboard shortcut: Cmd/Ctrl + K
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

  const topbarStyle = useMemo(() => ({
    position:             'fixed' as const,
    top:                  topOffset,
    left:                 sidebarWidth,
    right:                0,
    zIndex:               190,
    height:               height,
    background:           isDark ? 'rgba(8,10,16,0.96)' : 'rgba(244,245,249,0.97)',
    backdropFilter:       'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom:         '1px solid var(--zm-border)',
    display:              'flex',
    alignItems:           'center',
    padding:              isMobile ? '0 14px' : '0 20px',
    gap:                  8,
    transition:           rm ? 'none' : `left 220ms cubic-bezier(0.22,1,0.36,1)`,
  }), [topOffset, sidebarWidth, height, isMobile, isDark, rm]);

  const btnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 7,
    background: 'var(--zm-surface)',
    border: '1px solid var(--zm-border)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--zm-text-2)',
    flexShrink: 0,
    outline: 'none',
    transition: 'all 120ms ease',
  };

  const searchStyle = useMemo(() => ({
    flex:          1,
    maxWidth:      isMobile ? 'none' : 280,
    height:        30,
    display:       'flex',
    alignItems:    'center',
    gap:           8,
    padding:       '0 10px',
    background:    'var(--zm-surface)',
    border:        '1px solid var(--zm-border)',
    borderRadius:  7,
    cursor:        'pointer',
    outline:       'none',
    transition:    'all 120ms ease',
  }), [isMobile]);

  return (
    <>
      <header style={topbarStyle} aria-label="Top navigation bar">

        {/* Hamburger */}
        <button type="button" onClick={onMenuToggle} style={btnStyle} aria-label="Toggle menu">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="1" y1="4" x2="13" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1="1" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Search / Command palette trigger */}
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          style={searchStyle as React.CSSProperties}
          aria-label="Open command palette (Ctrl+K)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="4" stroke="var(--zm-text-3)" strokeWidth="1.3"/>
            <line x1="8.5" y1="8.5" x2="11" y2="11" stroke="var(--zm-text-3)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--zm-font-ui)', fontSize: 12, color: 'var(--zm-text-3)', flex: 1, textAlign: 'left' }}>
            {isMobile ? 'Search...' : 'Search or jump to... '}
          </span>
          {!isMobile && (
            <kbd style={{
              fontFamily: 'var(--zm-font-data)',
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 4,
              background: 'var(--zm-border)',
              color: 'var(--zm-text-3)',
              border: '1px solid var(--zm-border-strong)',
            }}>⌘K</kbd>
          )}
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Clock */}
        {!isMobile && <LiveClock />}

        {/* Theme toggle */}
        <button type="button" onClick={toggleTheme} style={btnStyle} aria-label="Toggle theme">
          {isDark ? (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="6.5" y1="1" x2="6.5" y2="2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="6.5" y1="10.8" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="1" y1="6.5" x2="2.2" y2="6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="10.8" y1="6.5" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M11 7A5 5 0 1 1 6 2a3.5 3.5 0 0 0 5 5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* PWA install */}
        {canInstall && (
          <motion.button
            type="button"
            onClick={triggerInstall}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ ...btnStyle, color: 'var(--zm-blue)' }}
            aria-label="Install app"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 2v7M4 7l2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 10.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </motion.button>
        )}
      </header>

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
};

Topbar.displayName = 'Topbar';
export default React.memo(Topbar);
