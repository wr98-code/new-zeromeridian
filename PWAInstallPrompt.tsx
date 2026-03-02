/**
 * PWAInstallPrompt.tsx — ZERØ MERIDIAN push135
 * AUDIT FIX: Replace dark/neon palette with Bloomberg Light
 *   - rgba(0,238,255,x)  → rgba(15,40,180,x)   [cyan → Bloomberg navy]
 *   - rgba(7,9,18,x)     → rgba(255,255,255,x)  [dark panel → white]
 *   - rgba(32,42,68,x)   → rgba(15,40,100,0.12) [dark border → light border]
 *   - rgba(80,80,100,x)  → rgba(110,120,160,x)  [dark muted → Bloomberg muted]
 *   - rgba(240,240,248,x)→ rgba(8,12,40,x)      [light text on dark → dark text on light]
 *   - rgba(200,200,214,x)→ rgba(55,65,110,x)    [step text]
 * push78: Refactored to consume PWAInstallContext
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - JetBrains Mono ✓  mountedRef + useCallback + useMemo ✓  Object.freeze ✓
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { usePWAInstall } from '@/contexts/PWAInstallContext';

const FONT = "'JetBrains Mono', monospace";

const C = Object.freeze({
  accent:       'rgba(15,40,180,1)',
  positive:     'rgba(0,155,95,1)',
  textPrimary:  'rgba(8,12,40,1)',
  textFaint:    'rgba(110,120,160,1)',
  cardBg:       'rgba(255,255,255,1)',
  accentBg:     'rgba(15,40,180,0.07)',
  accentBorder: 'rgba(15,40,180,0.22)',
  glassBorder:  'rgba(15,40,100,0.10)',
  panelBg:      'rgba(248,249,252,1)',
  panelBorder:  'rgba(15,40,100,0.12)',
});

const IOS_STEPS = Object.freeze([
  { num: '1', text: 'Tap the Share button at the bottom of Safari' },
  { num: '2', text: 'Scroll down and tap "Add to Home Screen"' },
  { num: '3', text: 'Tap "Add" in the top-right corner to confirm' },
]);

const IOSSheet = memo(({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(8,12,40,0.5)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }}
    role="dialog"
    aria-modal="true"
    aria-label="Install ZERØ MERIDIAN on iOS"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: '100%', maxWidth: 480,
        background: C.cardBg,
        border: '1px solid ' + C.accentBorder,
        borderBottom: 'none',
        borderRadius: '20px 20px 0 0',
        padding: '24px 24px 48px',
        boxShadow: '0 -24px 80px rgba(15,40,100,0.12)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Handle */}
      <div style={{
        width: 40, height: 4, borderRadius: 2,
        background: C.glassBorder,
        margin: '0 auto 24px',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: C.accentBg,
          border: '1px solid ' + C.accentBorder,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 0 16px rgba(15,40,180,0.08)',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <polygon points="16,2 14,14 16,12 18,14" fill="rgba(15,40,180,0.18)" />
            <polygon points="30,16 18,14 20,16 18,18" fill="rgba(15,40,180,0.14)" />
            <polygon points="16,30 18,18 16,20 14,18" fill="rgba(15,40,180,0.12)" />
            <polygon points="2,16 14,18 12,16 14,14" fill="rgba(15,40,180,0.16)" />
            <circle cx="16" cy="16" r="7" stroke="rgba(15,40,180,0.25)" strokeWidth="3" fill="none" />
            <circle cx="16" cy="16" r="7" stroke="rgba(15,40,180,1)" strokeWidth="1.8" fill="none" />
            <line x1="21" y1="10" x2="11" y2="22"
              stroke="rgba(15,40,180,0.35)" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="21" y1="10" x2="11" y2="22"
              stroke="rgba(15,40,180,1)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{
          fontFamily: FONT,
          fontSize: 15, fontWeight: 700,
          color: C.textPrimary,
          letterSpacing: '0.06em',
          marginBottom: 6,
        }}>
          Install ZERØ MERIDIAN
        </div>
        <div style={{
          fontFamily: FONT,
          fontSize: 11, color: C.textFaint,
          letterSpacing: '0.08em',
        }}>
          Add to Home Screen — no App Store required
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {IOS_STEPS.map(step => (
          <div key={step.num} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 16px', borderRadius: 12,
            background: C.accentBg,
            border: '1px solid ' + C.glassBorder,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: C.accentBg,
              border: '1px solid ' + C.accentBorder,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT,
              fontSize: 12, fontWeight: 700,
              color: C.accent,
            }}>
              {step.num}
            </div>
            <span style={{
              fontFamily: FONT,
              fontSize: 12, color: 'rgba(55,65,110,1)',
              lineHeight: 1.5,
            }}>
              {step.text}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close install instructions"
        style={{
          width: '100%', minHeight: 48,
          background: C.accentBg,
          border: '1px solid ' + C.accentBorder,
          borderRadius: 12, cursor: 'pointer',
          fontFamily: FONT,
          fontSize: 12, fontWeight: 700,
          color: C.accent,
          letterSpacing: '0.12em',
        }}
      >
        GOT IT
      </button>
    </motion.div>
  </motion.div>
));
IOSSheet.displayName = 'IOSSheet';

const PWAInstallPrompt = memo(() => {
  const mountedRef = useRef(true);
  const { isMobile } = useBreakpoint();
  const { canInstall, isIOS, isInstalled, isDismissed, triggerInstall, dismissInstall } = usePWAInstall();

  const [showIOSSheet, setShowIOSSheet] = useState(false);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone: boolean }).standalone === true
    );
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const handleShowIOS = () => { if (mountedRef.current) setShowIOSSheet(true); };
    window.addEventListener('zm-show-ios-install', handleShowIOS);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('zm-show-ios-install', handleShowIOS);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS) { setShowIOSSheet(true); return; }
    await triggerInstall();
  }, [isIOS, triggerInstall]);

  const handleDismiss   = useCallback(() => { dismissInstall(); }, [dismissInstall]);
  const handleCloseIOS  = useCallback(() => { setShowIOSSheet(false); }, []);

  const bannerStyle = useMemo(() => {
    const base = {
      background:          C.cardBg,
      border:              '1px solid ' + C.accentBorder,
      borderRadius:        14,
      display:             'flex', alignItems: 'center' as const, gap: 14,
      boxShadow:           '0 8px 32px rgba(15,40,100,0.12)',
      backdropFilter:      'blur(12px)',
      WebkitBackdropFilter:'blur(12px)',
    };
    if (isMobile) return Object.freeze({
      ...base, position: 'fixed' as const,
      bottom: 76, left: 12, right: 12, zIndex: 500,
      padding: '12px 14px', gap: 12,
    });
    return Object.freeze({
      ...base, position: 'fixed' as const,
      bottom: 24, right: 24, zIndex: 500,
      padding: '14px 18px', maxWidth: 360,
    });
  }, [isMobile]);

  const showBanner = canInstall && !isInstalled && !isDismissed && !isStandalone;

  return (
    <AnimatePresence>
      <>
        {showBanner && (
          <motion.div
            key="pwa-banner"
            initial={{ opacity: 0, y: isMobile ? 24 : 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobile ? 24 : 12, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={bannerStyle}
            role="banner"
            aria-label="Install ZERØ MERIDIAN app"
          >
            {/* Ø Icon */}
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: C.accentBg,
              border: '1px solid ' + C.accentBorder,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(15,40,180,0.08)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="8" stroke="rgba(15,40,180,0.22)" strokeWidth="3.5" fill="none" />
                <circle cx="12" cy="12" r="8" stroke="rgba(15,40,180,1)" strokeWidth="1.8" fill="none" />
                <line x1="17" y1="6" x2="7" y2="18" stroke="rgba(15,40,180,0.3)" strokeWidth="3" strokeLinecap="round" />
                <line x1="17" y1="6" x2="7" y2="18" stroke="rgba(15,40,180,1)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: FONT,
                fontSize: 13, fontWeight: 700,
                color: C.textPrimary,
                marginBottom: 3, letterSpacing: '0.04em',
              }}>
                Install ZERØ MERIDIAN
              </div>
              <div style={{
                fontFamily: FONT,
                fontSize: 10, color: C.textFaint,
                letterSpacing: '0.06em',
              }}>
                {isIOS ? 'Add to Home Screen · no App Store needed' : 'Full-screen · offline · instant access'}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
                style={{
                  minHeight: 36, minWidth: 36, padding: '0 10px',
                  background: 'transparent',
                  border: '1px solid ' + C.glassBorder,
                  borderRadius: 8, cursor: 'pointer',
                  fontFamily: FONT,
                  fontSize: 12, color: C.textFaint,
                }}
              >
                ✕
              </button>
              <button
                type="button"
                onClick={handleInstall}
                aria-label={isIOS ? 'Show iOS install instructions' : 'Install app'}
                style={{
                  minHeight: 36, padding: '0 16px',
                  background: C.accentBg,
                  border: '1px solid ' + C.accentBorder,
                  borderRadius: 8, cursor: 'pointer',
                  fontFamily: FONT,
                  fontSize: 10, fontWeight: 700,
                  color: C.accent,
                  letterSpacing: '0.1em',
                }}
              >
                {isIOS ? 'HOW TO' : 'INSTALL'}
              </button>
            </div>
          </motion.div>
        )}

        {showIOSSheet && (
          <IOSSheet key="ios-sheet" onClose={handleCloseIOS} />
        )}
      </>
    </AnimatePresence>
  );
});

PWAInstallPrompt.displayName = 'PWAInstallPrompt';
export default PWAInstallPrompt;
