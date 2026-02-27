/**
 * AppShell.tsx — ZERØ MERIDIAN 2026 push74
 * push74: PWAInstallPrompt semua breakpoint (mobile + tablet + desktop)
 * push27: PWAInstallPrompt integrated
 * push26: Mobile drawer mode + BottomNavBar integration
 * push23: var(--zm-bg-base) + max-width 1800px
 * - React.memo + displayName ✓
 * - rgba() only, zero hsl() ✓
 * - var(--zm-*) theme-aware ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
 * - Zero className ✓
 * - Zero template literals ✓
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import ZMSidebar from './ZMSidebar';
import Topbar from './Topbar';
import BottomNavBar from './BottomNavBar';
import PageTransition from '../shared/PageTransition';
import GlobalStatsBar from '../shared/GlobalStatsBar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import PWAInstallPrompt from '@/components/shared/PWAInstallPrompt';

interface AppShellProps {
  children:     React.ReactNode;
  currentPath?: string;
}

const shellVariants = Object.freeze({
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
});

const drawerVariants = Object.freeze({
  hidden:  { x: '-100%', opacity: 0 },
  visible: { x: '0%',   opacity: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit:    { x: '-100%', opacity: 0, transition: { duration: 0.22, ease: [0.36, 0, 0.66, 0] } },
});

const overlayVariants = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
});

const AppShell: React.FC<AppShellProps> = ({ children, currentPath: propPath }) => {
  const mountedRef = useRef(true);
  const [sidebarExpanded,   setSidebarExpanded]   = React.useState(true);
  const [mobileDrawerOpen,  setMobileDrawerOpen]  = React.useState(false);
  const prefersReducedMotion = useReducedMotion();
  const location             = useLocation();
  const { isMobile, isTablet } = useBreakpoint();

  const currentPath      = propPath ?? location.pathname;
  const showBottomNav    = isMobile;
  const showMobileDrawer = isMobile || isTablet;

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  React.useEffect(() => {
    if (showMobileDrawer && mobileDrawerOpen) setMobileDrawerOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  const toggleSidebar = useCallback(() => {
    if (!mountedRef.current) return;
    if (showMobileDrawer) setMobileDrawerOpen(prev => !prev);
    else setSidebarExpanded(prev => !prev);
  }, [showMobileDrawer]);

  const closeDrawer = useCallback(() => {
    if (mountedRef.current) setMobileDrawerOpen(false);
  }, []);

  const mainVariants = useMemo(() => Object.freeze({
    collapsed: { marginLeft: 72  },
    expanded:  { marginLeft: 240 },
    mobile:    { marginLeft: 0   },
  }), []);

  const mainAnimate = useMemo(() => {
    if (showMobileDrawer) return 'mobile';
    return sidebarExpanded ? 'expanded' : 'collapsed';
  }, [showMobileDrawer, sidebarExpanded]);

  const mainStyle = useMemo(() => ({
    minHeight:  '100vh',
    background: 'var(--zm-bg-base)',
    transition: prefersReducedMotion ? 'none' : 'margin-left 0.3s cubic-bezier(0.22,1,0.36,1)',
    willChange: 'margin-left' as const,
  }), [prefersReducedMotion]);

  const contentStyle = useMemo(() => ({
    padding:       isMobile ? '0 12px 24px' : '0 24px 24px',
    paddingTop:    '96px',
    paddingBottom: showBottomNav ? '84px' : '24px',
    maxWidth:      '1800px',
    margin:        '0 auto',
    boxSizing:     'border-box' as const,
    width:         '100%',
    overflowX:     'hidden' as const,
  }), [showBottomNav, isMobile]);

  const overlayStyle = useMemo(() => ({
    position:             'fixed'  as const,
    inset:                0,
    zIndex:               149,
    background:           'rgba(5,5,14,0.7)',
    backdropFilter:       'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  }), []);

  const drawerStyle = useMemo(() => ({
    position:   'fixed' as const,
    top:        0,
    left:       0,
    bottom:     0,
    zIndex:     150,
    width:      '240px',
    willChange: 'transform' as const,
  }), []);

  return (
    <motion.div
      variants={shellVariants}
      initial="initial"
      animate="animate"
      style={{ display: 'flex', minHeight: '100vh', background: 'var(--zm-bg-base)' }}
    >
      {/* Desktop sidebar */}
      {!showMobileDrawer && (
        <ZMSidebar expanded={sidebarExpanded} onToggle={toggleSidebar} currentPath={currentPath} />
      )}

      {/* Mobile/Tablet overlay drawer */}
      <AnimatePresence>
        {showMobileDrawer && mobileDrawerOpen && (
          <>
            <motion.div
              key="overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={overlayStyle}
              onClick={closeDrawer}
              aria-label="Close navigation drawer"
              role="button"
            />
            <motion.div
              key="drawer"
              variants={prefersReducedMotion ? {} : drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={drawerStyle}
            >
              <ZMSidebar expanded={true} onToggle={closeDrawer} currentPath={currentPath} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.main
        animate={mainAnimate}
        variants={mainVariants}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ ...mainStyle, flex: 1, minWidth: 0 }}
      >
        <Topbar onMenuToggle={toggleSidebar} sidebarExpanded={sidebarExpanded} />
        <GlobalStatsBar />

        <div style={contentStyle}>
          <AnimatePresence mode="wait">
            <PageTransition key={currentPath}>
              {children}
            </PageTransition>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Bottom nav — mobile only */}
      {showBottomNav && <BottomNavBar />}

      {/* PWA Install Prompt — ALL breakpoints (mobile + tablet + desktop) */}
      <PWAInstallPrompt />
    </motion.div>
  );
};

AppShell.displayName = 'AppShell';
export default React.memo(AppShell);
