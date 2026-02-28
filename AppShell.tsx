/**
 * AppShell.tsx — ZERØ MERIDIAN push93
 * Bloomberg layout: StatsBar 26px + Topbar 36px = 62px total header
 * Sidebar: 200px expanded, 44px collapsed
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

interface AppShellProps { children: React.ReactNode; }

const STATS_H   = 26;
const TOPBAR_H  = 36;
const HEADER_H  = STATS_H + TOPBAR_H;   // 62px total
const SIDEBAR_E = 200;
const SIDEBAR_C = 44;

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const rm           = useReducedMotion();
  const loc          = useLocation();
  const { isMobile, isTablet } = useBreakpoint();
  const mountedRef   = useRef(true);

  const [expanded,   setExpanded]   = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isDrawer   = isMobile || isTablet;
  const showBottom = isMobile;

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
    marginLeft:    sidebarW,
    paddingTop:    HEADER_H + 16,
    paddingLeft:   isMobile ? 12 : 20,
    paddingRight:  isMobile ? 12 : 20,
    paddingBottom: showBottom ? 76 : 28,
    minHeight:     '100vh',
    background:    'var(--zm-bg)',
    boxSizing:     'border-box' as const,
    transition:    rm ? 'none' : `margin-left 220ms cubic-bezier(0.22,1,0.36,1)`,
  }), [sidebarW, isMobile, showBottom, rm]);

  const overlayStyle = useMemo(() => ({
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 170,
    backdropFilter: 'blur(2px)',
  }), []);

  const currentPath = loc.pathname;

  return (
    <>
      <GlobalStatsBar />

      <Topbar
        onMenuToggle={toggle}
        sidebarExpanded={expanded}
        topOffset={STATS_H}
        height={TOPBAR_H}
        sidebarWidth={sidebarW}
      />

      {/* Desktop sidebar */}
      {!isDrawer && (
        <ZMSidebar
          expanded={expanded}
          onToggle={toggle}
          currentPath={currentPath}
          headerHeight={HEADER_H}
          expandedWidth={SIDEBAR_E}
          collapsedWidth={SIDEBAR_C}
        />
      )}

      {/* Mobile drawer */}
      {isDrawer && (
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={overlayStyle}
                onClick={closeDrawer}
                aria-hidden="true"
              />
              <motion.div
                key="drawer"
                initial={{ x: -SIDEBAR_E }}
                animate={{ x: 0 }}
                exit={{ x: -SIDEBAR_E }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: 'fixed', top: 0, left: 0, zIndex: 180, height: '100vh' }}
              >
                <ZMSidebar
                  expanded={true}
                  onToggle={closeDrawer}
                  currentPath={currentPath}
                  headerHeight={HEADER_H}
                  expandedWidth={SIDEBAR_E}
                  collapsedWidth={SIDEBAR_C}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Main content */}
      <main style={contentStyle}>
        <div style={{ maxWidth: 1600, margin: '0 auto', width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {showBottom && <BottomNavBar currentPath={currentPath} />}
      <PWAInstallPrompt />
    </>
  );
};

AppShell.displayName = 'AppShell';
export default AppShell;
