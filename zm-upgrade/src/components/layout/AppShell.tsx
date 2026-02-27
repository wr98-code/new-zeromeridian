/**
 * AppShell.tsx — ZERØ MERIDIAN v30
 * Bloomberg-grade layout system
 * - Fixed GlobalStatsBar (28px) + Topbar (52px) = 80px header
 * - Collapsible sidebar desktop / drawer mobile+tablet
 * - BottomNavBar mobile only
 */

import React, { useRef, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import ZMSidebar from './ZMSidebar';
import Topbar from './Topbar';
import BottomNavBar from './BottomNavBar';
import GlobalStatsBar from '../shared/GlobalStatsBar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import PWAInstallPrompt from '@/components/shared/PWAInstallPrompt';

interface AppShellProps {
  children: React.ReactNode;
}

const STATS_H   = 28;
const TOPBAR_H  = 52;
const HEADER_H  = STATS_H + TOPBAR_H;
const SIDEBAR_E = 240;
const SIDEBAR_C = 64;

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const rm           = useReducedMotion();
  const loc          = useLocation();
  const { isMobile, isTablet } = useBreakpoint();
  const mountedRef   = useRef(true);

  const [expanded,   setExpanded]   = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isDrawer  = isMobile || isTablet;
  const showBottom = isMobile;

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Close drawer on route change
  React.useEffect(() => {
    if (isDrawer && drawerOpen) setDrawerOpen(false);
  }, [loc.pathname]); // eslint-disable-line

  const toggle = useCallback(() => {
    if (!mountedRef.current) return;
    if (isDrawer) setDrawerOpen(p => !p);
    else setExpanded(p => !p);
  }, [isDrawer]);

  const closeDrawer = useCallback(() => {
    if (mountedRef.current) setDrawerOpen(false);
  }, []);

  const sidebarW = useMemo(() =>
    isDrawer ? 0 : expanded ? SIDEBAR_E : SIDEBAR_C,
    [isDrawer, expanded]
  );

  const contentStyle = useMemo(() => ({
    marginLeft:   sidebarW,
    paddingTop:   HEADER_H + 20,
    paddingLeft:  isMobile ? 14 : 24,
    paddingRight: isMobile ? 14 : 24,
    paddingBottom: showBottom ? 80 : 36,
    minHeight:    '100vh',
    background:   'var(--zm-bg)',
    boxSizing:    'border-box' as const,
    transition:   rm ? 'none' : `margin-left ${220}ms cubic-bezier(0.22,1,0.36,1)`,
  }), [sidebarW, isMobile, showBottom, rm]);

  const overlayStyle = useMemo(() => ({
    position: 'fixed' as const,
    inset: 0,
    zIndex: 170,
    background: 'rgba(4,5,12,0.75)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  }), []);

  const drawerStyle = useMemo(() => ({
    position: 'fixed' as const,
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 180,
    width: SIDEBAR_E,
  }), []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--zm-bg)' }}>

      {/* Stats bar */}
      <GlobalStatsBar />

      {/* Topbar */}
      <Topbar
        onMenuToggle={toggle}
        sidebarExpanded={expanded}
        topOffset={STATS_H}
        height={TOPBAR_H}
        sidebarWidth={sidebarW}
      />

      {/* Sidebar — desktop only */}
      {!isDrawer && (
        <ZMSidebar
          expanded={expanded}
          onToggle={toggle}
          currentPath={loc.pathname}
          headerHeight={HEADER_H}
          expandedWidth={SIDEBAR_E}
          collapsedWidth={SIDEBAR_C}
        />
      )}

      {/* Drawer — mobile / tablet */}
      <AnimatePresence>
        {isDrawer && drawerOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={overlayStyle}
              onClick={closeDrawer}
            />
            <motion.div
              key="drawer"
              initial={rm ? {} : { x: '-100%' }}
              animate={rm ? {} : { x: '0%' }}
              exit={rm ? {} : { x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={drawerStyle}
            >
              <ZMSidebar
                expanded={true}
                onToggle={closeDrawer}
                currentPath={loc.pathname}
                headerHeight={0}
                expandedWidth={SIDEBAR_E}
                collapsedWidth={SIDEBAR_C}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main style={contentStyle}>
        <div style={{ maxWidth: 1680, margin: '0 auto', width: '100%' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={loc.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {showBottom && <BottomNavBar />}
      <PWAInstallPrompt />
    </div>
  );
};

AppShell.displayName = 'AppShell';
export default React.memo(AppShell);
