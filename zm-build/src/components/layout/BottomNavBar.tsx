/**
 * BottomNavBar.tsx — ZERØ MERIDIAN 2026 push85
 * push85: "More" tab buka bottom sheet dengan grid semua fitur
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - useCallback + useMemo + mountedRef ✓  Object.freeze() ✓
 */

import React, { memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface NavTab {
  label: string; path: string; ariaLabel: string;
  icon: React.ReactNode;
}

const NAV_TABS: readonly NavTab[] = Object.freeze([
  {
    label: 'Dash', path: '/dashboard', ariaLabel: 'Navigate to Dashboard',
    icon: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6"/></svg>),
  },
  {
    label: 'Markets', path: '/markets', ariaLabel: 'Navigate to Markets',
    icon: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><polyline points="2,15 6,9 10,12 14,5 18,8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  },
  {
    label: 'Alerts', path: '/alerts', ariaLabel: 'Navigate to Alerts',
    icon: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2.5C7.24 2.5 5 4.74 5 7.5v5L3 15h14l-2-2.5v-5c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M8 16.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
  },
  {
    label: 'Watch', path: '/watchlist', ariaLabel: 'Navigate to Watchlist',
    icon: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.47 5.01L18 7.91l-4 3.9.94 5.49L10 14.77l-4.94 2.53L6 11.81 2 7.91l5.53-.9L10 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>),
  },
  {
    label: 'More', path: '__more__', ariaLabel: 'Show all features',
    icon: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="4" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="16" cy="10" r="1.5" fill="currentColor"/></svg>),
  },
]);

interface MoreItem { label: string; path: string; icon: React.ReactNode; badge?: string; }

const MORE_ITEMS: readonly MoreItem[] = Object.freeze([
  { label: 'Charts',       path: '/charts',       icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><polyline points="1,15 5,9 9,12 13,4 17,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: 'Order Book',   path: '/orderbook',    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="2" y1="4" x2="10" y2="4" stroke="rgba(52,211,153,0.9)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="7" x2="7" y2="7" stroke="rgba(52,211,153,0.5)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="11" x2="12" y2="11" stroke="rgba(255,68,136,0.9)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="14" x2="8" y2="14" stroke="rgba(255,68,136,0.5)" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { label: 'Derivatives',  path: '/derivatives',  icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 15 L4 7 L9 11 L14 3 L17 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: 'DeFi',         path: '/defi',         icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="3" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="4" r="2.2" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="14" r="2.2" stroke="currentColor" strokeWidth="1.5"/><line x1="5.2" y1="7.8" x2="12.8" y2="4.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="5.2" y1="10.2" x2="12.8" y2="13.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: 'On-Chain',     path: '/onchain',      badge: 'NEW', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="8" width="3.5" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="7.5" y="5" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="1" width="3.5" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> },
  { label: 'Sentiment',    path: '/sentiment',    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M6 11c.83 1.2 2 2 3 2s2.17-.8 3-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="6.5" cy="7.5" r="1" fill="currentColor"/><circle cx="11.5" cy="7.5" r="1" fill="currentColor"/></svg> },
  { label: 'Fundamentals', path: '/fundamentals', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="5" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { label: 'Tokens',       path: '/tokens',       icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 9h5M9 6.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { label: 'Smart Money',  path: '/smartmoney',   icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14l4-8 4 4 4-6 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="6" r="2" stroke="rgba(52,211,153,1)" strokeWidth="1.5"/></svg> },
  { label: 'Networks',     path: '/networks',     icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="3" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="3" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.5"/><line x1="4.5" y1="5" x2="7.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="10.5" y1="7.5" x2="13.5" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="4.5" y1="13" x2="7.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="10.5" y1="10.5" x2="13.5" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { label: 'Security',     path: '/security',     icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5L2.5 4.5v5c0 4 3 6.5 6.5 7 3.5-.5 6.5-3 6.5-7v-5L9 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 9l2 2 4-4" stroke="rgba(52,211,153,1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: 'Converter',    path: '/converter',    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 6h14M12 2l4 4-4 4M16 12H2M6 8l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: 'Portfolio',    path: '/portfolio',    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M9 9 L9 2 A7 7 0 0 1 16 9 Z" fill="currentColor" opacity="0.25"/></svg> },
  { label: 'AI Intel',     path: '/intelligence', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="9" r="2.5" fill="currentColor" opacity="0.5"/></svg> },
  { label: 'AI Signals',   path: '/aisignals',    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 12l3-5 3 3 4-6 3 3" stroke="rgba(176,130,255,1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
]);

// ─── TabButton ────────────────────────────────────────────────────────────────

const TabButton = memo(({ tab, isActive, onPress }: { tab: NavTab; isActive: boolean; onPress: (p: string) => void }) => {
  const handle = useCallback(() => onPress(tab.path), [onPress, tab.path]);
  return (
    <button
      type="button" onClick={handle}
      aria-label={tab.ariaLabel} aria-current={isActive ? 'page' : undefined}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '48px', padding: '6px 4px',
        background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none',
        WebkitTapHighlightColor: 'transparent', position: 'relative',
        color: isActive ? 'rgba(52,211,153,1)' : 'rgba(100,105,135,1)',
        transition: 'color 0.15s',
      }}
    >
      <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {tab.icon}
      </div>
      <div style={{ marginTop: '3px', fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.04em', fontWeight: isActive ? 600 : 400 }}>
        {tab.label}
      </div>
      {isActive && <div style={{ position: 'absolute', bottom: 0, width: '20px', height: '2px', borderRadius: '2px 2px 0 0', background: 'rgba(52,211,153,1)', boxShadow: '0 0 8px rgba(52,211,153,0.6)' }} />}
    </button>
  );
});
TabButton.displayName = 'TabButton';

// ─── MoreSheet ────────────────────────────────────────────────────────────────

const MoreSheet = memo(({ open, onClose, onNav }: { open: boolean; onClose: () => void; onNav: (p: string) => void }) => {
  const prefersRM = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="mo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: prefersRM ? 0 : 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 299, background: 'rgba(5,6,12,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          />
          <motion.div key="ms" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: prefersRM ? 0 : 0.28, ease: [0.22,1,0.36,1] }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, background: 'rgba(10,12,22,0.98)', borderTop: '1px solid rgba(0,238,255,0.12)', borderRadius: '20px 20px 0 0', paddingBottom: 'env(safe-area-inset-bottom, 16px)', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
            </div>
            <div style={{ padding: '6px 20px 12px', fontFamily: "'Space Mono', monospace", fontSize: '11px', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: 700 }}>
              ALL FEATURES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', padding: '0 8px 16px' }}>
              {MORE_ITEMS.map(item => (
                <button key={item.path} type="button" onClick={() => { onNav(item.path); onClose(); }} aria-label={'Go to ' + item.label}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '14px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', color: 'rgba(155,160,190,1)', position: 'relative' }}
                >
                  {item.icon}
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.03em', textAlign: 'center', lineHeight: 1.3 }}>{item.label}</span>
                  {item.badge && <span style={{ position: 'absolute', top: '6px', right: '6px', fontFamily: "'Space Mono', monospace", fontSize: '7px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(52,211,153,0.15)', color: 'rgba(52,211,153,1)', letterSpacing: '0.05em' }}>{item.badge}</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
MoreSheet.displayName = 'MoreSheet';

// ─── BottomNavBar ─────────────────────────────────────────────────────────────

const BottomNavBar = memo(() => {
  const mountedRef = useRef(true);
  const navigate   = useNavigate();
  const location   = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  useEffect(() => { if (moreOpen && mountedRef.current) setMoreOpen(false); }, [location.pathname]); // eslint-disable-line

  const handlePress = useCallback((path: string) => {
    if (!mountedRef.current) return;
    if (path === '__more__') setMoreOpen(prev => !prev);
    else navigate(path);
  }, [navigate]);

  const handleNav   = useCallback((path: string) => { if (mountedRef.current) navigate(path); }, [navigate]);
  const closeMore   = useCallback(() => { if (mountedRef.current) setMoreOpen(false); }, []);

  return (
    <>
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, height: '60px', paddingBottom: 'env(safe-area-inset-bottom, 0px)', background: 'rgba(8,10,20,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'stretch' }} role="navigation" aria-label="Mobile bottom navigation">
        {NAV_TABS.map(tab => {
          const isActive = tab.path === '__more__'
            ? moreOpen
            : (location.pathname === tab.path || (tab.path !== '/dashboard' && location.pathname.startsWith(tab.path)));
          return <TabButton key={tab.label} tab={tab} isActive={isActive} onPress={handlePress} />;
        })}
      </nav>
      <MoreSheet open={moreOpen} onClose={closeMore} onNav={handleNav} />
    </>
  );
});

BottomNavBar.displayName = 'BottomNavBar';
export default BottomNavBar;
