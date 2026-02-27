/**
 * Topbar.tsx — ZERØ MERIDIAN 2026 push85
 * push85: Tambah Ctrl+K button + WS status eksplisit
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - useCallback + useMemo + mountedRef ✓
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface TopbarProps {
  onMenuToggle:     () => void;
  sidebarExpanded:  boolean;
  onOpenCmdPalette: () => void;
}

const SunIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const MoonIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const MenuIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="3.5" width={open ? 13 : 9} height="1.4" rx="0.7" fill="currentColor" style={{ transition:'width 0.2s' }}/>
    <rect x="1.5" y="7.3" width="9" height="1.4" rx="0.7" fill="currentColor"/>
    <rect x="1.5" y="11.1" width={open ? 13 : 5} height="1.4" rx="0.7" fill="currentColor" style={{ transition:'width 0.2s' }}/>
  </svg>
);

const PWAInstallButton = React.memo(() => {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [justInstalled, setJustInstalled] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  useEffect(() => {
    if (isInstalled && mountedRef.current) {
      setJustInstalled(true);
      const t = setTimeout(() => { if (mountedRef.current) setJustInstalled(false); }, 3000);
      return () => clearTimeout(t);
    }
  }, [isInstalled]);

  const handleClick = useCallback(async () => { await triggerInstall(); }, [triggerInstall]);
  if (!canInstall && !justInstalled) return null;

  return (
    <motion.button type="button" onClick={justInstalled ? undefined : handleClick}
      aria-label={justInstalled ? 'App installed' : 'Install ZERØ MERIDIAN'}
      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
      style={{ width:'32px', height:'32px', borderRadius:'8px', background: justInstalled ? 'rgba(52,211,153,0.08)' : 'rgba(52,211,153,0.06)', border:'1px solid '+(justInstalled?'rgba(52,211,153,0.3)':'rgba(52,211,153,0.2)'), cursor:justInstalled?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(52,211,153,0.9)', flexShrink:0 }}
    >
      {justInstalled
        ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2v6.5M4 6l2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      }
    </motion.button>
  );
});
PWAInstallButton.displayName = 'PWAInstallButton';

const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, sidebarExpanded, onOpenCmdPalette }) => {
  const mountedRef = useRef(true);
  const prefersRM  = useReducedMotion();
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  const { theme, setTheme } = useTheme();
  const { isMobile, isTablet } = useBreakpoint();

  const isDark    = theme !== 'light';
  const isCompact = isMobile || isTablet;

  useEffect(() => {
    mountedRef.current = true;
    const iv = setInterval(() => { if (mountedRef.current) setTime(new Date().toLocaleTimeString('en-US', { hour12: false })); }, 1000);
    return () => { mountedRef.current = false; clearInterval(iv); };
  }, []);

  const handleToggle      = useCallback(() => onMenuToggle(), [onMenuToggle]);
  const handleThemeToggle = useCallback(() => { if (mountedRef.current) setTheme(isDark ? 'light' : 'dark'); }, [isDark, setTheme]);
  const handleCmdPalette  = useCallback(() => onOpenCmdPalette(), [onOpenCmdPalette]);

  const topbarStyle = useMemo(() => ({
    position: 'fixed' as const, top: 28, right: 0, left: 0, zIndex: 50,
    height: '52px', background: 'rgba(7,9,17,0.93)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', alignItems: 'center',
    padding: isMobile ? '0 12px' : '0 20px', gap: '10px', overflow: 'hidden' as const,
  }), [isMobile]);

  const iconBtnStyle = useMemo(() => ({
    width:'32px', height:'32px', borderRadius:'8px',
    background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)',
    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
    color:'rgba(130,135,165,1)', flexShrink:0, transition:'all 0.15s',
  }), []);

  const searchBarStyle = useMemo(() => ({
    flex: 1, maxWidth: '340px', height: '32px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '0 10px', cursor: 'pointer', transition: 'border-color 0.15s',
  }), []);

  return (
    <header role="banner" style={topbarStyle} aria-label="Application topbar">
      <button type="button" onClick={handleToggle} style={iconBtnStyle}
        aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={sidebarExpanded}
      >
        <MenuIcon open={sidebarExpanded} />
      </button>

      {!isCompact && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
          <span style={{ fontFamily:"'Space Mono', monospace", fontSize:'12px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(220,225,245,0.9)' }}>
            ZERØ MERIDIAN
          </span>
        </div>
      )}

      {/* Search / Command palette trigger */}
      <button type="button" onClick={handleCmdPalette} style={searchBarStyle as React.CSSProperties}
        aria-label="Open command palette (Ctrl+K)"
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,238,255,0.2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" stroke="rgba(80,85,115,1)" strokeWidth="1.4"/>
          <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="rgba(80,85,115,1)" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span style={{ fontFamily:"'Space Mono', monospace", fontSize:'11px', color:'rgba(70,75,105,1)', flex:1 }}>
          {isCompact ? 'Search...' : 'Search pages...'}
        </span>
        {!isMobile && (
          <div style={{ display:'flex', gap:'3px', flexShrink:0 }}>
            <span style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'4px', padding:'1px 5px', fontFamily:"'Space Mono', monospace", fontSize:'9px', color:'rgba(90,95,125,1)' }}>
              {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
            </span>
            <span style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'4px', padding:'1px 5px', fontFamily:"'Space Mono', monospace", fontSize:'9px', color:'rgba(90,95,125,1)' }}>
              K
            </span>
          </div>
        )}
      </button>

      <div style={{ flex: 1 }} />

      {/* Right cluster */}
      <div style={{ display:'flex', alignItems:'center', gap: isMobile ? '6px' : '8px', flexShrink:0 }}>
        {!isMobile && (
          <span style={{ fontFamily:"'Space Mono', monospace", fontSize:'11px', color:'rgba(80,85,110,1)', letterSpacing:'0.08em', whiteSpace:'nowrap', minWidth:'68px', textAlign:'right' }} aria-live="polite" aria-atomic="true">
            {time}
          </span>
        )}

        <PWAInstallButton />

        <motion.button onClick={handleThemeToggle} style={iconBtnStyle}
          whileHover={prefersRM ? {} : { scale: 1.06 }} whileTap={prefersRM ? {} : { scale: 0.94 }}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </motion.button>

        {!isMobile && (
          <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.14)', borderRadius:'16px', padding:'4px 10px', fontSize:'10px', fontFamily:"'Space Mono', monospace", color:'rgba(52,211,153,0.7)', letterSpacing:'0.08em', flexShrink:0 }} role="status" aria-label="Network status: live">
            <motion.div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(52,211,153,0.9)', flexShrink:0 }} animate={prefersRM ? {} : { opacity:[1,0.35,1] }} transition={{ duration:1.8, repeat:Infinity }} aria-hidden="true" />
            LIVE
          </div>
        )}

        <motion.button style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.18)', cursor:'pointer', fontSize:'12px', fontWeight:700, color:'rgba(52,211,153,0.9)', fontFamily:"'Space Mono', monospace", flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}
          whileHover={prefersRM ? {} : { scale: 1.06 }} whileTap={prefersRM ? {} : { scale: 0.94 }}
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
