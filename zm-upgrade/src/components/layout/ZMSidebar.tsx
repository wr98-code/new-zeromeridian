/**
 * ZMSidebar.tsx — ZERØ MERIDIAN v30
 * Bloomberg-grade sidebar — all routes grouped, collapsible
 */

import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  id:    string;
  label: string;
  path:  string;
  icon:  React.ReactNode;
  badge?: string;
}

interface NavGroup {
  id:    string;
  label: string;
  items: NavItem[];
}

interface ZMSidebarProps {
  expanded:       boolean;
  onToggle:       () => void;
  currentPath:    string;
  headerHeight:   number;
  expandedWidth:  number;
  collapsedWidth: number;
}

// ── Icons ────────────────────────────────────────────────────────────────────

const I = (d: string, extra?: React.ReactNode) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    {extra}
  </svg>
);

const ICONS = {
  dashboard:   <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/></svg>,
  markets:     I('M1 11 L4 7 L7 9 L10.5 4 L14 6'),
  watchlist:   <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L9.2 5L13 5.6L10.2 8.3L10.9 12L7.5 10.2L4.1 12L4.8 8.3L2 5.6L5.8 5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  charts:      I('M1 12.5 L4 7.5 L7 10 L11 5 L14 7'),
  orderbook:   <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="1.5" y1="3" x2="9" y2="3" stroke="rgba(79,127,255,1)" strokeWidth="1.4" strokeLinecap="round"/><line x1="1.5" y1="5.5" x2="6" y2="5.5" stroke="rgba(79,127,255,0.5)" strokeWidth="1.4" strokeLinecap="round"/><line x1="1.5" y1="9.5" x2="10" y2="9.5" stroke="rgba(251,113,133,1)" strokeWidth="1.4" strokeLinecap="round"/><line x1="1.5" y1="12" x2="7" y2="12" stroke="rgba(251,113,133,0.5)" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  derivatives: I('M1 12 L4 6 L7.5 9 L11 3 L14 6.5'),
  defi:        <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="2.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="12.5" cy="3" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="12.5" cy="12" r="2" stroke="currentColor" strokeWidth="1.4"/><line x1="4.5" y1="6.5" x2="10.5" y2="3.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="4.5" y1="8.5" x2="10.5" y2="11.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  onchain:     <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="7" width="3" height="7" rx="0.8" stroke="currentColor" strokeWidth="1.4"/><rect x="6" y="4" width="3" height="10" rx="0.8" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="1" width="3" height="13" rx="0.8" stroke="currentColor" strokeWidth="1.4"/></svg>,
  intelligence:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.4"/><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4"/><line x1="7.5" y1="1.5" x2="7.5" y2="5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  sentiment:   I('M1 9 Q4 2 7.5 6 Q11 10 14 3'),
  fundamentals:I('M1 13 L1 6 L4.5 6 L4.5 13 M5.5 13 L5.5 3 L9 3 L9 13 M10 13 L10 8 L13.5 8 L13.5 13'),
  tokens:      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7.5h5M7.5 5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  networks:    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="2" cy="2" r="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="13" cy="2" r="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="2" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.4"/><line x1="3.1" y1="3.1" x2="6.4" y2="6.4" stroke="currentColor" strokeWidth="1.2"/><line x1="11.9" y1="3.1" x2="8.6" y2="6.4" stroke="currentColor" strokeWidth="1.2"/><line x1="3.1" y1="11.9" x2="6.4" y2="8.6" stroke="currentColor" strokeWidth="1.2"/><line x1="11.9" y1="11.9" x2="8.6" y2="8.6" stroke="currentColor" strokeWidth="1.2"/></svg>,
  security:    I('M7.5 1.5L13 3.5V8C13 11 10 13.5 7.5 14C5 13.5 2 11 2 8V3.5L7.5 1.5Z'),
  smartmoney:  I('M1 11 L4.5 5 L8 8 L11 3.5 L14 6', <path d="M11 3.5h3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>),
  portfolio:   <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 7.5L7.5 1.5A6 6 0 0 1 13.5 7.5Z" fill="currentColor" opacity="0.15"/><path d="M7.5 7.5L13.5 7.5A6 6 0 0 1 7.5 13.5Z" fill="currentColor" opacity="0.08"/></svg>,
  alerts:      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2C5.5 2 4 3.6 4 5.5V10L2.5 11.5H12.5L11 10V5.5C11 3.6 9.5 2 7.5 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  converter:   I('M2 5h11M9.5 2l3.5 3-3.5 3M13 10H2M5.5 7l-3.5 3 3.5 3'),
  aisignals:   I('M1 8L4 5L7 7L10 3L13 5.5', <circle cx="13" cy="5.5" r="1.5" fill="currentColor" opacity="0.6"/>),
  settings:    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.2" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 1v1.4M7.5 12.6V14M1 7.5h1.4M12.6 7.5H14M2.7 2.7l1 1M11.3 11.3l1 1M2.7 12.3l1-1M11.3 3.7l1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
};

// ── Nav groups ────────────────────────────────────────────────────────────────

const NAV_GROUPS: readonly NavGroup[] = Object.freeze([
  {
    id: 'core', label: 'Overview',
    items: [
      { id: 'dashboard',  label: 'Dashboard',  path: '/dashboard',  icon: ICONS.dashboard },
      { id: 'markets',    label: 'Markets',    path: '/markets',    icon: ICONS.markets   },
      { id: 'watchlist',  label: 'Watchlist',  path: '/watchlist',  icon: ICONS.watchlist },
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
      { id: 'onchain',      label: 'On-Chain',     path: '/onchain',      icon: ICONS.onchain,  badge: 'LIVE' },
      { id: 'fundamentals', label: 'Fundamentals', path: '/fundamentals', icon: ICONS.fundamentals },
      { id: 'tokens',       label: 'Tokens',       path: '/tokens',       icon: ICONS.tokens       },
      { id: 'sentiment',    label: 'Sentiment',    path: '/sentiment',    icon: ICONS.sentiment    },
    ],
  },
  {
    id: 'intel', label: 'Intelligence',
    items: [
      { id: 'smartmoney',   label: 'Smart Money',  path: '/smart-money',  icon: ICONS.smartmoney                 },
      { id: 'networks',     label: 'Networks',     path: '/networks',     icon: ICONS.networks                   },
      { id: 'security',     label: 'Security',     path: '/security',     icon: ICONS.security                   },
      { id: 'aisignals',    label: 'AI Signals',   path: '/ai-signals',   icon: ICONS.aisignals, badge: 'BETA'   },
      { id: 'intelligence', label: 'Research',     path: '/intelligence', icon: ICONS.intelligence               },
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

const BOTTOM_ITEMS: readonly { id: string; label: string; path: string; icon: React.ReactNode }[] = Object.freeze([
  { id: 'settings', label: 'Settings', path: '/settings', icon: ICONS.settings },
]);

// ── Logo ─────────────────────────────────────────────────────────────────────

const SidebarLogo = memo(({ expanded }: { expanded: boolean }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 16px', height: 52, flexShrink: 0,
    borderBottom: '1px solid var(--zm-sidebar-border)',
  }}>
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="10" stroke="rgba(79,127,255,0.2)" strokeWidth="1" fill="rgba(79,127,255,0.05)"/>
      <circle cx="13" cy="13" r="7" stroke="rgba(79,127,255,1)" strokeWidth="1.5" fill="none"/>
      <line x1="16" y1="8.5" x2="10" y2="17.5" stroke="rgba(79,127,255,1)" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="13" cy="13" r="1.5" fill="rgba(79,127,255,0.5)"/>
    </svg>
    {expanded && (
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -4 }}
        transition={{ duration: 0.15 }}
        style={{ overflow: 'hidden', whiteSpace: 'nowrap' as const }}
      >
        <div style={{
          fontFamily: 'var(--zm-font-ui)',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--zm-text-1)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          ZERØ MERIDIAN
        </div>
        <div style={{
          fontFamily: 'var(--zm-font-data)',
          fontSize: 9,
          color: 'var(--zm-text-3)',
          letterSpacing: '0.12em',
          marginTop: 1,
        }}>
          TERMINAL v3.0
        </div>
      </motion.div>
    )}
  </div>
));
SidebarLogo.displayName = 'SidebarLogo';

// ── Nav Item ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  item:      NavItem;
  active:    boolean;
  expanded:  boolean;
  onNav:     (path: string) => void;
}

const NavItemButton = memo(({ item, active, expanded, onNav }: NavItemProps) => {
  const [hovered, setHovered] = useState(false);
  const rm = useReducedMotion();

  const style = useMemo(() => ({
    display:      'flex',
    alignItems:   'center',
    gap:          10,
    width:        '100%',
    padding:      expanded ? '7px 12px' : '7px 0',
    justifyContent: expanded ? 'flex-start' as const : 'center' as const,
    borderRadius: 7,
    border:       'none',
    cursor:       'pointer',
    background:   active
      ? 'var(--zm-blue-bg)'
      : hovered
      ? 'var(--zm-surface-hover)'
      : 'transparent',
    color:        active ? 'var(--zm-blue)' : hovered ? 'var(--zm-text-1)' : 'var(--zm-text-2)',
    transition:   rm ? 'none' : `all ${120}ms ease`,
    position:     'relative' as const,
    outline:      'none',
    WebkitTapHighlightColor: 'transparent',
  }), [active, hovered, expanded, rm]);

  const labelStyle = useMemo(() => ({
    fontFamily:    'var(--zm-font-ui)',
    fontSize:      13,
    fontWeight:    active ? 600 : 400,
    whiteSpace:    'nowrap' as const,
    overflow:      'hidden' as const,
    flex:          1,
    letterSpacing: '-0.01em',
  }), [active]);

  const badgeStyle = useMemo(() => ({
    fontFamily:    'var(--zm-font-data)',
    fontSize:      8,
    fontWeight:    700,
    letterSpacing: '0.08em',
    padding:       '1px 4px',
    borderRadius:  3,
    background:    item.badge === 'LIVE' ? 'var(--zm-green-bg)' : 'var(--zm-blue-bg)',
    color:         item.badge === 'LIVE' ? 'var(--zm-green)'    : 'var(--zm-blue)',
    border:        `1px solid ${item.badge === 'LIVE' ? 'var(--zm-green-border)' : 'var(--zm-blue-border)'}`,
    flexShrink:    0,
  }), [item.badge]);

  const activeLine = useMemo(() => ({
    position:     'absolute' as const,
    left:         0, top: '20%', bottom: '20%',
    width:        2,
    borderRadius: 2,
    background:   'var(--zm-blue)',
  }), []);

  return (
    <button
      type="button"
      onClick={() => onNav(item.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      title={!expanded ? item.label : undefined}
      style={style}
    >
      {active && <div style={activeLine} />}
      <span style={{ color: 'inherit', flexShrink: 0, display: 'flex' }}>
        {item.icon}
      </span>
      {expanded && (
        <motion.span
          initial={false}
          animate={{ opacity: 1 }}
          style={labelStyle}
        >
          {item.label}
        </motion.span>
      )}
      {expanded && item.badge && (
        <span style={badgeStyle}>{item.badge}</span>
      )}
    </button>
  );
});
NavItemButton.displayName = 'NavItemButton';

// ── Group label ───────────────────────────────────────────────────────────────

const GroupLabel = memo(({ label, expanded }: { label: string; expanded: boolean }) => {
  if (!expanded) return (
    <div style={{ height: 1, margin: '8px 12px', background: 'var(--zm-divider)' }} />
  );
  return (
    <div style={{
      fontFamily:    'var(--zm-font-data)',
      fontSize:      9,
      fontWeight:    700,
      letterSpacing: '0.14em',
      color:         'var(--zm-text-4)',
      textTransform: 'uppercase' as const,
      padding:       '12px 12px 4px',
    }}>
      {label}
    </div>
  );
});
GroupLabel.displayName = 'GroupLabel';

// ── Main Sidebar ──────────────────────────────────────────────────────────────

const ZMSidebar = memo(({
  expanded, onToggle, currentPath,
  headerHeight, expandedWidth, collapsedWidth,
}: ZMSidebarProps) => {
  const rm       = useReducedMotion();
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const nav = useCallback((path: string) => {
    if (mountedRef.current) navigate(path);
  }, [navigate]);

  const isActive = useCallback((path: string) =>
    currentPath === path || (path !== '/dashboard' && currentPath.startsWith(path)),
    [currentPath]
  );

  const sidebarStyle = useMemo(() => ({
    position:      'fixed' as const,
    top:           0, left: 0,
    height:        '100vh',
    width:         expanded ? expandedWidth : collapsedWidth,
    background:    'var(--zm-sidebar-bg)',
    borderRight:   '1px solid var(--zm-sidebar-border)',
    display:       'flex',
    flexDirection: 'column' as const,
    zIndex:        180,
    overflow:      'hidden',
    transition:    rm ? 'none' : `width 220ms cubic-bezier(0.22,1,0.36,1)`,
  }), [expanded, expandedWidth, collapsedWidth, rm]);

  const scrollStyle = useMemo(() => ({
    flex:       1,
    overflowY:  'auto' as const,
    overflowX:  'hidden',
    padding:    expanded ? '8px 8px' : '8px 6px',
    scrollbarWidth: 'none' as const,
  }), [expanded]);

  const bottomStyle = useMemo(() => ({
    padding:      expanded ? '8px 8px' : '8px 6px',
    borderTop:    '1px solid var(--zm-sidebar-border)',
    flexShrink:   0,
  }), [expanded]);

  // Toggle button
  const toggleStyle = useMemo(() => ({
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    width:          '100%',
    padding:        '6px 0',
    border:         'none',
    background:     'transparent',
    cursor:         'pointer',
    color:          'var(--zm-text-3)',
    transition:     `color ${120}ms ease`,
    outline:        'none',
  }), []);

  return (
    <aside style={sidebarStyle} aria-label="Sidebar navigation">

      {/* Logo area — aligns with topbar */}
      <div style={{ height: headerHeight || 80, display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
        <SidebarLogo expanded={expanded} />
      </div>

      {/* Nav groups */}
      <div style={scrollStyle}>
        {NAV_GROUPS.map(group => (
          <div key={group.id}>
            <GroupLabel label={group.label} expanded={expanded} />
            {group.items.map(item => (
              <NavItemButton
                key={item.id}
                item={item}
                active={isActive(item.path)}
                expanded={expanded}
                onNav={nav}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={bottomStyle}>
        {BOTTOM_ITEMS.map(item => (
          <NavItemButton
            key={item.id}
            item={item as NavItem}
            active={isActive(item.path)}
            expanded={expanded}
            onNav={nav}
          />
        ))}
        {/* Collapse toggle — desktop only */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={toggleStyle}
        >
          <svg
            width="14" height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 220ms ease' }}
          >
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </aside>
  );
});

ZMSidebar.displayName = 'ZMSidebar';
export default ZMSidebar;
