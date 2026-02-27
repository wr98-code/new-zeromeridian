/**
 * Portal.tsx — ZERØ MERIDIAN v30
 * Clean Bloomberg-grade entry screen
 * - Auto-enter after 1.5s (not 2.5s)
 * - Skip if already visited (localStorage flag)
 * - Lightweight — no Three.js 6000 particles
 */

import React, { useEffect, useRef, useCallback, useMemo, useState, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AUTO_MS = 1500;
const VISITED_KEY = 'zm_visited';

const Portal: React.FC = () => {
  const navigate         = useNavigate();
  const mountedRef       = useRef(true);
  const rm               = useReducedMotion();
  const [visible, setVisible]   = useState(false);
  const [progress, setProgress] = useState(0);

  const doEnter = useCallback(() => {
    if (!mountedRef.current) return;
    localStorage.setItem(VISITED_KEY, '1');
    navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    mountedRef.current = true;

    // If already visited, skip to dashboard immediately
    if (localStorage.getItem(VISITED_KEY)) {
      navigate('/dashboard');
      return;
    }

    setTimeout(() => { if (mountedRef.current) setVisible(true); }, 100);

    // Progress bar
    const start = Date.now();
    const tick  = setInterval(() => {
      if (!mountedRef.current) return;
      const pct = Math.min((Date.now() - start) / AUTO_MS * 100, 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(tick); doEnter(); }
    }, 30);

    return () => {
      mountedRef.current = false;
      clearInterval(tick);
    };
  }, [doEnter, navigate]);

  const containerStyle = useMemo(() => ({
    position:       'fixed' as const,
    inset:          0,
    background:     '#080a10',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexDirection:  'column' as const,
    gap:            32,
    zIndex:         9999,
    backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 60%, rgba(79,127,255,0.08) 0%, transparent 60%)',
  }), []);

  return (
    <div style={containerStyle} onClick={doEnter} role="button" tabIndex={0} aria-label="Enter terminal">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={rm ? {} : { opacity: 0, scale: 0.94, y: 12 }}
            animate={rm ? {} : { opacity: 1, scale: 1,    y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
          >
            {/* Logo mark */}
            <motion.div
              animate={rm ? {} : { rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <circle cx="36" cy="36" r="30" stroke="rgba(79,127,255,0.15)" strokeWidth="1" fill="rgba(79,127,255,0.04)"/>
                <circle cx="36" cy="36" r="20" stroke="rgba(79,127,255,0.9)" strokeWidth="1.5" fill="none" filter="url(#glow)"/>
                <line x1="42" y1="22" x2="30" y2="50" stroke="rgba(79,127,255,1)" strokeWidth="2" strokeLinecap="round" filter="url(#glow)"/>
                <circle cx="36" cy="36" r="3" fill="rgba(79,127,255,0.6)"/>
                {/* Orbit dots */}
                <circle cx="36" cy="16" r="2" fill="rgba(79,127,255,0.4)"/>
                <circle cx="55" cy="47" r="2" fill="rgba(52,211,153,0.4)"/>
                <circle cx="17" cy="47" r="2" fill="rgba(251,113,133,0.4)"/>
              </svg>
            </motion.div>

            {/* Name */}
            <div style={{ textAlign: 'center' as const }}>
              <div style={{
                fontFamily:    'var(--zm-font-ui)',
                fontSize:      28,
                fontWeight:    700,
                color:         'rgba(228,232,244,1)',
                letterSpacing: '-0.03em',
                lineHeight:    1,
              }}>
                ZERØ MERIDIAN
              </div>
              <div style={{
                fontFamily:    'var(--zm-font-data)',
                fontSize:      10,
                color:         'rgba(78,84,110,1)',
                letterSpacing: '0.22em',
                marginTop:     6,
                textTransform: 'uppercase' as const,
              }}>
                Crypto Intelligence Terminal
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              width: 120, height: 1,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 1,
              overflow: 'hidden',
            }}>
              <motion.div
                style={{
                  height: '100%',
                  background: 'rgba(79,127,255,1)',
                  transformOrigin: 'left',
                }}
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: 0 }}
              />
            </div>

            <div style={{
              fontFamily:    'var(--zm-font-data)',
              fontSize:      9,
              color:         'rgba(78,84,110,1)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
            }}>
              Click to enter
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Portal.displayName = 'Portal';
export default memo(Portal);
