/**
 * ZMSidebar.tsx — ZERØ MERIDIAN push93
 * 200px expanded / 44px collapsed — Bloomberg terminal density
 * ZERO className | var(--zm-*) | React.memo | useMemo | mountedRef
 */

import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface NavItem  { id: string; label: string; path: string; icon: React.ReactNode; badge?: string; }
interface NavGroup { id: string; label: string; items: NavItem[]; }
interface ZMSidebarProps {
  expanded: boolean; onToggle: () => void; currentPath: string;
  headerHeight: number; expandedWidth: number; collapsedWidth: number;
}

// ── Icons — 12x12, strokeWidth 1.2 ──────────────────────────────────────────
const Ic = (d: string, extra?: React.ReactNode) => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    {extra}
  </svg>
);

const ICONS = {
  dashboard:    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.25"/><rect x="7.5" y="1" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.25"/><rect x="1" y="7.5" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.25"/><rect x="7.5" y="7.5" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.25"/></svg>,
  markets:      Ic('M1 9.5L3.5 6.5L6 8L9.5 3.5L12 5.5'),
  watchlist:    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5L7.8 4.4L11 4.8L8.7 7L9.3 10.1L6.5 8.6L3.7 10.1L4.3 7L2 4.8L5.2 4.4Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>,
  charts:       Ic('M1 10.5L3.5 6.5L6.5 8.5L9.5 4L12 6.5'),
  orderbook:    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="1.5" y1="2.5" x2="8" y2="2.5" stroke="rgba(56,139,253,1)" strokeWidth="1.25" strokeLinecap="round"/><line x1="1.5" y1="5" x2="5.5" y2="5" stroke="rgba(56,139,253,0.5)" strokeWidth="1.25" strokeLinecap="round"/><line x1="1.5" y1="8.5" x2="9" y2="8.5" stroke="rgba(239,83,80,1)" strokeWidth="1.25" strokeLinecap="round"/><line x1="1.5" y1="11" x2="6" y2="11" stroke="rgba(239,83,80,0.5)" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  derivatives:  Ic('M1 10L3.5 5L6.5 7.5L9.5 2.5L12 5.5'),
  defi:         <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="2.5" cy="6.5" r="1.6" stroke="currentColor" strokeWidth="1.25"/><circle cx="10.5" cy="2.5" r="1.6" stroke="currentColor" strokeWidth="1.25"/><circle cx="10.5" cy="10.5" r="1.6" stroke="currentColor" strokeWidth="1.25"/><line x1="4" y1="5.8" x2="9" y2="3.2" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"/><line x1="4" y1="7.2" x2="9" y2="9.8" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"/></svg>,
  onchain:      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="7.5" width="2.5" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.25"/><rect x="5" y="4.5" width="2.5" height="7" rx="0.6" stroke="currentColor" strokeWidth="1.25"/><rect x="9.5" y="1.5" width="2.5" height="10" rx="0.6" stroke="currentColor" strokeWidth="1.25"/></svg>,
  intelligence: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.25"/><circle cx="6.5" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.25"/><line x1="6.5" y1="1.5" x2="6.5" y2="4.7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  sentiment:    Ic('M1 8Q3 2 6.5 5.5Q10 9 12 3'),
  fundamentals: Ic('M1 11.5L1 6L3.5 6L3.5 11.5M4.5 11.5L4.5 3L7 3L7 11.5M8 11.5L8 7L10.5 7L10.5 11.5'),
  tokens:       <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.25"/><path d="M4 6.5h5M6.5 4v5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  networks:     <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.25"/><circle cx="2" cy="2" r="1.2" stroke="currentColor" strokeWidth="1.25"/><circle cx="11" cy="2" r="1.2" stroke="currentColor" strokeWidth="1.25"/><circle cx="2" cy="11" r="1.2" stroke="currentColor" strokeWidth="1.25"/><circle cx="11" cy="11" r="1.2" stroke="currentColor" strokeWidth="1.25"/><line x1="2.9" y1="2.9" x2="5.3" y2="5.3" stroke="currentColor" strokeWidth="1.0"/><line x1="10.1" y1="2.9" x2="7.7" y2="5.3" stroke="currentColor" strokeWidth="1.0"/><line x1="2.9" y1="10.1" x2="5.3" y2="7.7" stroke="currentColor" strokeWidth="1.0"/><line x1="10.1" y1="10.1" x2="7.7" y2="7.7" stroke="currentColor" strokeWidth="1.0"/></svg>,
  security:     Ic('M6.5 1.5L11.5 3.2V7.5C11.5 10 9.3 12 6.5 12.5C3.7 12 1.5 10 1.5 7.5V3.2L6.5 1.5Z'),
  smartmoney:   Ic('M1 9.5L4 5.5L7 7L9.5 3.5L12 5.5', <path d="M9.5 3.5h2.5v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>),
  portfolio:    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.25"/><path d="M6.5 6.5L6.5 1.5A5 5 0 0 1 11.5 6.5Z" fill="currentColor" opacity="0.15"/><path d="M6.5 6.5L11.5 6.5A5 5 0 0 1 6.5 11.5Z" fill="currentColor" opacity="0.08"/></svg>,
  alerts:       <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2C4.8 2 3.5 3.3 3.5 5V9L2 10.5H11L9.5 9V5C9.5 3.3 8.2 2 6.5 2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/><path d="M5.2 12a1.3 1.3 0 002.6 0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  converter:    Ic('M1.5 4.5h10M8 2l3 2.5L8 7M11.5 8.5h-10M5 6l-3 2.5L5 11'),
  aisignals:    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 7.5L4 5L7 6.5L10 3L12 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="5" r="1.2" fill="currentColor" opacity="0.6"/></svg>,
  settings:     <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.25"/><path d="M6.5 1.5v1M6.5 10.5v1M1.5 6.5h1M10.5 6.5h1M3 3l.7.7M9.3 9.3l.7.7M3 10l.7-.7M9.3 3.7l.7-.7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
};

const NAV_GROUPS: readonly NavGroup[] = Object.freeze([
  {
    id: 'core', label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: ICONS.dashboard },
      { id: 'markets',   label: 'Markets',   path: '/markets',   icon: ICONS.markets   },
      { id: 'watchlist', label: 'Watchlist', path: '/watchlist', icon: ICONS.watchlist },
    ],
  },
  {
    id: 'trading', label: 'Trading',
    items: [
      { id: 'charts',      label: 'Charts',      path: '/charts',      icon: ICONS.charts      },
      { id: 'orderbook',   label: 'Order Book',  path: '/orderbook',   icon: ICONS.orderbook   },
      { id: 'derivatives', label: 'Derivatives', path: '/derivatives', icon: ICONS.derivatives },
      { id: 'converter',   label: 'Converter',   path: '/converter',   icon: ICONS.converter   },
    ],
  },
  {
    id: 'analytics', label: 'Analytics',
    items: [
      { id: 'defi',         label: 'DeFi',         path: '/defi',         icon: ICONS.defi         },
      { id: 'onchain',      label: 'On-Chain',     path: '/onchain',      icon: ICONS.onchain,      badge: 'LIVE' },
      { id: 'fundamentals', label: 'Fundamentals', path: '/fundamentals', icon: ICONS.fundamentals },
      { id: 'tokens',       label: 'Tokens',       path: '/tokens',       icon: ICONS.tokens       },
      { id: 'sentiment',    label: 'Sentiment',    path: '/sentiment',    icon: ICONS.sentiment    },
    ],
  },
  {
    id: 'intel', label: 'Intelligence',
    items: [
      { id: 'smartmoney',   label: 'Smart Money', path: '/smart-money',  icon: ICONS.smartmoney                },
      { id: 'networks',     label: 'Networks',    path: '/networks',     icon: ICONS.networks                  },
      { id: 'security',     label: 'Security',    path: '/security',     icon: ICONS.security                  },
      { id: 'aisignals',    label: 'AI Signals',  path: '/ai-signals',   icon: ICONS.aisignals, badge: 'BETA'  },
      { id: 'intelligence', label: 'Research',    path: '/intelligence', icon: ICONS.intelligence              },
    ],
  },
  {
    id: 'personal', label: 'Personal',
    items: [
      { id: 'portfolio', label: 'Portfolio', path: '/portfolio', icon: ICONS.portfolio },
      { id: 'alerts',    label: 'Alerts',    path: '/alerts',    icon: ICONS.alerts    },
    ],
  },
]);

const BOTTOM: NavItem[] = [{ id: 'settings', label: 'Settings', path: '/settings', icon: ICONS.settings }];

// ── Logo ─────────────────────────────────────────────────────────────────────
const Logo = memo(({ expanded }: { expanded: boolean }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 11px', height: 48, flexShrink: 0,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  }}>
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="9" stroke="rgba(0,238,255,0.12)" strokeWidth="1" fill="rgba(0,238,255,0.03)"/>
      <circle cx="11" cy="11" r="6.5" stroke="rgba(0,238,255,0.85)" strokeWidth="1.3" fill="none"/>
      <line x1="13.5" y1="7" x2="8.5" y2="15" stroke="rgba(0,238,255,1)" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="11" cy="11" r="1.2" fill="rgba(0,238,255,0.4)"/>
    </svg>
    <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -5 }} transition={{ duration: 0.13 }}
          style={{ overflow: 'hidden', whiteSpace: 'nowrap' as const }}
        >
          <div style={{ fontFamily: 'var(--zm-font-ui)', fontSize: 12, fontWeight: 700, color: 'var(--zm-text-1)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            ZERØ MERIDIAN
          </div>
          <div style={{ fontFamily: 'var(--zm-font-data)', fontSize: 7.5, color: 'var(--zm-text-4)', letterSpacing: '0.14em', marginTop: 1 }}>
            TERMINAL v3.1
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));
Logo.displayName = 'Logo';

// ── Group Label ───────────────────────────────────────────────────────────────
const GroupLbl = memo(({ label, expanded }: { label: string; expanded: boolean }) => {
  if (!expanded) return <div style={{ height: 1, margin: '5px 8px', background: 'rgba(255,255,255,0.05)' }} />;
  return (
    <div style={{
      fontFamily: 'var(--zm-font-data)', fontSize: 7.5, fontWeight: 700,
      letterSpacing: '0.16em', color: 'var(--zm-text-4)',
      textTransform: 'uppercase' as const,
      padding: '9px 10px 2px',
    }}>{label}</div>
  );
});
GroupLbl.displayName = 'GroupLbl';

// ── Nav Button ────────────────────────────────────────────────────────────────
const NavBtn = memo(({ item, active, expanded, onNav }: {
  item: NavItem; active: boolean; expanded: boolean; onNav: (p: string) => void;
}) => {
  const rm = useReducedMotion();
  const [hov, setHov] = useState(false);

  const btnS = useMemo(() => ({
    display: 'flex', alignItems: 'center',
    gap: 8, width: '100%',
    padding: expanded ? '5px 10px' : '5px 0',
    justifyContent: expanded ? 'flex-start' as const : 'center' as const,
    borderRadius: 4, border: 'none', cursor: 'pointer',
    background: active ? 'rgba(0,238,255,0.07)' : hov ? 'rgba(255,255,255,0.04)' : 'transparent',
    color: active ? 'var(--zm-cyan)' : hov ? 'var(--zm-text-1)' : 'var(--zm-text-2)',
    transition: rm ? 'none' : 'all 90ms ease',
    position: 'relative' as const,
    outline: 'none', WebkitTapHighlightColor: 'transparent',
  }), [active, hov, expanded, rm]);

  const lblS = useMemo(() => ({
    fontFamily: 'var(--zm-font-ui)', fontSize: 12,
    fontWeight: active ? 500 : 400,
    whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, flex: 1,
    letterSpacing: '-0.005em',
  }), [active]);

  const badgeS = useMemo(() => ({
    fontFamily: 'var(--zm-font-data)', fontSize: 7, fontWeight: 700,
    letterSpacing: '0.08em', padding: '1px 3px', borderRadius: 2,
    background: item.badge === 'LIVE' ? 'var(--zm-green-bg)' : 'rgba(0,238,255,0.07)',
    color:      item.badge === 'LIVE' ? 'var(--zm-green)'    : 'var(--zm-cyan)',
    border: `1px solid ${item.badge === 'LIVE' ? 'var(--zm-green-border)' : 'rgba(0,238,255,0.18)'}`,
    flexShrink: 0,
  }), [item.badge]);

  return (
    <button type="button" onClick={() => onNav(item.path)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      aria-label={item.label} aria-current={active ? 'page' : undefined}
      title={!expanded ? item.label : undefined} style={btnS}
    >
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '10%', bottom: '10%',
          width: 2, borderRadius: 2,
          background: 'var(--zm-cyan)',
          boxShadow: '0 0 5px rgba(0,238,255,0.6)',
        }} />
      )}
      <span style={{ color: 'inherit', flexShrink: 0, display: 'flex' }}>{item.icon}</span>
      {expanded && <motion.span initial={false} animate={{ opacity: 1 }} style={lblS}>{item.label}</motion.span>}
      {expanded && item.badge && <span style={badgeS}>{item.badge}</span>}
    </button>
  );
});
NavBtn.displayName = 'NavBtn';

// ── ZMSidebar ─────────────────────────────────────────────────────────────────
const ZMSidebar = memo(({ expanded, onToggle, currentPath, headerHeight, expandedWidth, collapsedWidth }: ZMSidebarProps) => {
  const rm         = useReducedMotion();
  const navigate   = useNavigate();
  const mountedRef = useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const nav = useCallback((path: string) => { if (mountedRef.current) navigate(path); }, [navigate]);
  const isActive = useCallback((path: string) =>
    currentPath === path || (path !== '/dashboard' && currentPath.startsWith(path)),
    [currentPath]
  );

  const sidebarS = useMemo(() => ({
    position:      'fixed' as const,
    top:           0, left: 0,
    height:        '100vh',
    width:         expanded ? expandedWidth : collapsedWidth,
    background:    'rgba(10,13,18,1)',
    borderRight:   '1px solid rgba(255,255,255,0.06)',
    display:       'flex', flexDirection: 'column' as const,
    zIndex:        180, overflow: 'hidden',
    transition:    rm ? 'none' : `width 200ms cubic-bezier(0.22,1,0.36,1)`,
  }), [expanded, expandedWidth, collapsedWidth, rm]);

  const scrollS = useMemo(() => ({
    flex: 1, overflowY: 'auto' as const, overflowX: 'hidden',
    padding: expanded ? '4px 7px' : '4px 5px',
    scrollbarWidth: 'none' as const,
  }), [expanded]);

  const bottomS = useMemo(() => ({
    padding:   expanded ? '4px 7px' : '4px 5px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
  }), [expanded]);

  return (
    <aside style={sidebarS} aria-label="Sidebar navigation">
      <div style={{ height: headerHeight, display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
        <Logo expanded={expanded} />
      </div>

      <div style={scrollS}>
        {NAV_GROUPS.map(group => (
          <div key={group.id}>
            <GroupLbl label={group.label} expanded={expanded} />
            {group.items.map(item => (
              <NavBtn key={item.id} item={item} active={isActive(item.path)} expanded={expanded} onNav={nav} />
            ))}
          </div>
        ))}
      </div>

      <div style={bottomS}>
        {BOTTOM.map(item => (
          <NavBtn key={item.id} item={item} active={isActive(item.path)} expanded={expanded} onNav={nav} />
        ))}
        <button type="button" onClick={onToggle}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '5px 0', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--zm-text-4)', outline: 'none' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 200ms ease' }}>
            <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </aside>
  );
});

ZMSidebar.displayName = 'ZMSidebar';
export default ZMSidebar;
