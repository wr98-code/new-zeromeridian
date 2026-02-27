/**
 * ZMSidebar.tsx — ZERØ MERIDIAN 2026 push85
 * push85: FULL ITEMS — semua 20 halaman masuk sidebar, grouped rapi
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - useCallback + useMemo + mountedRef ✓  Object.freeze() ✓
 */

import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  id: string; label: string; path: string; icon: React.ReactNode;
  badge?: string; group: string;
}

const NAV_ITEMS: readonly NavItem[] = Object.freeze([
  // OVERVIEW
  { id:'dashboard', label:'Dashboard', path:'/dashboard', group:'OVERVIEW',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg> },
  { id:'markets', label:'Markets', path:'/markets', group:'OVERVIEW',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="1,12 4.5,7 7.5,9.5 11,4 15,6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id:'watchlist', label:'Watchlist', path:'/watchlist', group:'OVERVIEW',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L9.9 5.4L14 6L11 8.9L11.8 13L8 11L4.2 13L5 8.9L2 6L6.1 5.4L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
  // TRADING
  { id:'charts', label:'Charts', path:'/charts', group:'TRADING',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="1,13 4.5,8 7.5,10.5 11.5,5 15,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="1" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3"/></svg> },
  { id:'orderbook', label:'Order Book', path:'/orderbook', group:'TRADING',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="3" x2="9" y2="3" stroke="rgba(52,211,153,0.9)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="6" x2="6.5" y2="6" stroke="rgba(52,211,153,0.5)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="10" x2="11" y2="10" stroke="rgba(248,113,113,0.9)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="13" x2="7.5" y2="13" stroke="rgba(248,113,113,0.5)" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id:'derivatives', label:'Derivatives', path:'/derivatives', group:'TRADING',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 13 L4 6 L8 9.5 L12 3 L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  // ANALYTICS
  { id:'defi', label:'DeFi', path:'/defi', group:'ANALYTICS',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="3.5" r="2.2" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="12.5" r="2.2" stroke="currentColor" strokeWidth="1.5"/><line x1="5.2" y1="7" x2="10.8" y2="4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="5.2" y1="9" x2="10.8" y2="11.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { id:'onchain', label:'On-Chain', path:'/onchain', badge:'NEW', group:'ANALYTICS',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="7.5" width="3" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="6.5" y="4.5" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="11.5" y="1.5" width="3" height="13" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> },
  { id:'sentiment', label:'Sentiment', path:'/sentiment', group:'ANALYTICS',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 9.5c.7 1 1.7 1.7 2.5 1.7s1.8-.7 2.5-1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="5.5" cy="6.5" r="0.8" fill="currentColor"/><circle cx="10.5" cy="6.5" r="0.8" fill="currentColor"/></svg> },
  { id:'fundamentals', label:'Fundamentals', path:'/fundamentals', group:'ANALYTICS',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><line x1="4.5" y1="6.5" x2="11.5" y2="6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="4.5" y1="9.5" x2="8.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { id:'tokens', label:'Tokens', path:'/tokens', group:'ANALYTICS',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8h4M8 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  // INTELLIGENCE
  { id:'smartmoney', label:'Smart Money', path:'/smartmoney', group:'INTELLIGENCE',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 13l4-8 4 4 4-6 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="13" cy="6" r="1.8" stroke="rgba(52,211,153,1)" strokeWidth="1.3"/></svg> },
  { id:'networks', label:'Networks', path:'/networks', group:'INTELLIGENCE',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="2.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="13.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="2.5" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="13.5" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="4" y1="4.5" x2="6.5" y2="6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="9.5" y1="6.5" x2="12" y2="4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="4" y1="11.5" x2="6.5" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="9.5" y1="9.5" x2="12" y2="11.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> },
  { id:'security', label:'Security', path:'/security', group:'INTELLIGENCE',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L2 4v4.5c0 3.5 2.5 5.5 6 6 3.5-.5 6-2.5 6-6V4L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M5.5 8l1.5 1.5 3.5-3.5" stroke="rgba(52,211,153,1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id:'intelligence', label:'AI Intel', path:'/intelligence', group:'INTELLIGENCE',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.6"/><line x1="8" y1="2" x2="8" y2="5.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/><line x1="8" y1="10.2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/><line x1="2" y1="8" x2="5.8" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/><line x1="10.2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/></svg> },
  { id:'aisignals', label:'AI Signals', path:'/aisignals', group:'INTELLIGENCE',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 11l3-5 3.5 3.5 4-7 3 3" stroke="rgba(176,130,255,1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  // PERSONAL
  { id:'portfolio', label:'Portfolio', path:'/portfolio', group:'PERSONAL',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 8 L8 1.5 A6.5 6.5 0 0 1 14.5 8 Z" fill="currentColor" opacity="0.25"/></svg> },
  { id:'alerts', label:'Alerts', path:'/alerts', group:'PERSONAL',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C5.8 2 4 3.8 4 6v4L2.5 12.5h11L12 10V6c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id:'converter', label:'Converter', path:'/converter', group:'PERSONAL',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h12M10 2l4 3-4 3M14 11H2M6 8l-4 3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
]);

const BOTTOM_ITEMS: readonly NavItem[] = Object.freeze([
  { id:'settings', label:'Settings', path:'/settings', group:'',
    icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.07 1.07M12 12l1.07 1.07M2.93 13.07l1.07-1.07M12 4l1.07-1.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
]);

const GROUP_ORDER = Object.freeze(['OVERVIEW','TRADING','ANALYTICS','INTELLIGENCE','PERSONAL']);

const LogoMark = memo(() => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <defs>
      <linearGradient id="lgm" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(52,211,153,1)"/>
        <stop offset="100%" stopColor="rgba(0,238,255,0.85)"/>
      </linearGradient>
      <filter id="lgf" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="14" cy="14" r="11" stroke="rgba(52,211,153,0.1)" strokeWidth="1" fill="rgba(52,211,153,0.03)"/>
    <circle cx="14" cy="14" r="7.5" stroke="url(#lgm)" strokeWidth="1.8" fill="none" filter="url(#lgf)"/>
    <line x1="17" y1="8.5" x2="11" y2="19.5" stroke="url(#lgm)" strokeWidth="1.8" strokeLinecap="round" filter="url(#lgf)"/>
  </svg>
));
LogoMark.displayName = 'LogoMark';

interface ZMSidebarProps { expanded: boolean; onToggle: () => void; currentPath: string; }

const ZMSidebar = memo(({ expanded, onToggle, currentPath }: ZMSidebarProps) => {
  const prefersRM  = useReducedMotion();
  const [hovered, setHovered] = useState<string|null>(null);
  const mountedRef = useRef(true);
  const navigate   = useNavigate();

  React.useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const handleHover  = useCallback((id: string|null) => { if (mountedRef.current) setHovered(id); }, []);
  const handleNav    = useCallback((path: string) => { if (mountedRef.current) navigate(path); }, [navigate]);
  const handleToggle = useCallback(() => onToggle(), [onToggle]);

  const isActive = useCallback((path: string) =>
    currentPath === path || (path !== '/dashboard' && currentPath.startsWith(path))
  , [currentPath]);

  const getItemStyle = useCallback((id: string, path: string) => {
    const active  = isActive(path);
    const hover   = hovered === id && !active;
    return {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: expanded ? '8px 12px 8px 14px' : '8px',
      justifyContent: expanded ? 'flex-start' as const : 'center' as const,
      borderRadius: '9px',
      background: active ? 'rgba(52,211,153,0.07)' : hover ? 'rgba(255,255,255,0.04)' : 'transparent',
      border: '1px solid ' + (active ? 'rgba(52,211,153,0.16)' : 'transparent'),
      color: active ? 'rgba(52,211,153,1)' : hover ? 'rgba(200,205,225,1)' : 'rgba(105,110,138,1)',
      cursor: 'pointer', transition: 'all 0.12s ease', userSelect: 'none' as const,
      width: '100%', textAlign: 'left' as const, position: 'relative' as const, marginBottom: '1px',
    };
  }, [currentPath, hovered, expanded, isActive]);

  const labelStyle = useMemo(() => ({
    fontFamily: "'Space Mono', monospace", fontSize: '11px', letterSpacing: '0.01em',
    whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500,
  }), []);

  const iconWrap = useMemo(() => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', flexShrink: 0 }), []);

  const groups = useMemo(() => {
    const map: Record<string,NavItem[]> = {};
    NAV_ITEMS.forEach(item => { if (!map[item.group]) map[item.group] = []; map[item.group].push(item); });
    return map;
  }, []);

  const renderItem = useCallback((item: NavItem) => {
    const active = isActive(item.path);
    return (
      <button key={item.id} type="button" onClick={() => handleNav(item.path)}
        onMouseEnter={() => handleHover(item.id)} onMouseLeave={() => handleHover(null)}
        aria-label={item.label} aria-current={currentPath === item.path ? 'page' : undefined}
        style={getItemStyle(item.id, item.path)}
      >
        {active && <div style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: '3px', borderRadius: '0 3px 3px 0', background: 'rgba(52,211,153,1)', boxShadow: '0 0 8px rgba(52,211,153,0.6)' }} />}
        <span style={iconWrap}>{item.icon}</span>
        <AnimatePresence>
          {expanded && (
            <motion.span initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-6 }} transition={{ duration:0.12 }}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flex:1, overflow:'hidden' }}
            >
              <span style={labelStyle}>{item.label}</span>
              {item.badge && (
                <span style={{ fontFamily:"'Space Mono', monospace", fontSize:'7px', padding:'1px 5px', borderRadius:'3px', background:'rgba(52,211,153,0.09)', border:'1px solid rgba(52,211,153,0.2)', color:'rgba(52,211,153,0.85)', letterSpacing:'0.06em', flexShrink:0, marginLeft:'6px' }}>
                  {item.badge}
                </span>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    );
  }, [expanded, currentPath, getItemStyle, handleNav, handleHover, iconWrap, labelStyle, isActive]);

  return (
    <motion.nav
      animate={{ width: expanded ? 256 : 68 }}
      transition={prefersRM ? { duration:0 } : { duration:0.22, ease:[0.22,1,0.36,1] }}
      style={{ position:'fixed', top:0, left:0, height:'100vh', background:'rgba(7,9,17,0.98)', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', zIndex:60, overflow:'hidden' }}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div style={{ height:'64px', display:'flex', alignItems:'center', padding:'0 18px', flexShrink:0, gap:'10px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <LogoMark />
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} transition={{ duration:0.14 }} style={{ flex:1 }}>
              <div style={{ fontFamily:"'Space Mono', monospace", fontSize:'12px', fontWeight:700, letterSpacing:'0.15em', color:'rgba(235,238,255,0.95)' }}>ZERØ</div>
              <div style={{ fontFamily:"'Space Mono', monospace", fontSize:'7px', letterSpacing:'0.32em', color:'rgba(52,211,153,0.45)', marginTop:'2px' }}>MERIDIAN</div>
            </motion.div>
          )}
        </AnimatePresence>
        <button type="button" onClick={handleToggle} aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{ width:'20px', height:'20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'5px', color:'rgba(90,95,120,1)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s', marginLeft: expanded ? '0' : 'auto' }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            {expanded ? <path d="M6 1.5L3 4.5L6 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/> : <path d="M3 1.5L6 4.5L3 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>}
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'8px', display:'flex', flexDirection:'column' }}>
        {GROUP_ORDER.map(groupName => {
          const items = groups[groupName];
          if (!items) return null;
          return (
            <div key={groupName} style={{ marginBottom:'4px' }}>
              {expanded && (
                <div style={{ padding:'8px 10px 4px', fontFamily:"'Space Mono', monospace", fontSize:'8px', letterSpacing:'0.2em', color:'rgba(255,255,255,0.14)', textTransform:'uppercase', fontWeight:700 }}>
                  {groupName}
                </div>
              )}
              {!expanded && groupName !== 'OVERVIEW' && <div style={{ height:'6px', borderTop:'1px solid rgba(255,255,255,0.04)', margin:'3px 5px 6px' }} />}
              {items.map(renderItem)}
            </div>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={{ padding:'8px 8px 12px', borderTop:'1px solid rgba(255,255,255,0.04)', flexShrink:0 }}>
        {BOTTOM_ITEMS.map(item => (
          <button key={item.id} type="button" onClick={() => handleNav(item.path)}
            onMouseEnter={() => handleHover(item.id)} onMouseLeave={() => handleHover(null)}
            aria-label={item.label} style={getItemStyle(item.id, item.path)}
          >
            <span style={iconWrap}>{item.icon}</span>
            <AnimatePresence>
              {expanded && (
                <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.12 }} style={labelStyle}>
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>
    </motion.nav>
  );
});

ZMSidebar.displayName = 'ZMSidebar';
export default ZMSidebar;
