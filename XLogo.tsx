/**
 * XLogo.tsx — ZERØ MERIDIAN push135
 * AUDIT FIX: Remove dark/cyan palette
 *   - drop-shadow rgba(0,238,255,x) → rgba(15,40,180,x) [Bloomberg navy glow]
 *   - mixBlendMode 'screen' → 'normal' (light theme bg is white, screen mode bukan lagi relevan)
 *   - glow disesuaikan Bloomberg Professional Light
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓  useMemo ✓  Object.freeze ✓
 */

import React, { useMemo } from 'react';

interface XLogoProps {
  size?: number;
  /** Tambah glow effect, default true */
  glow?: boolean;
}

const XLogo = React.memo(({ size = 180, glow = true }: XLogoProps) => {
  const wrapStyle = useMemo(() => Object.freeze({
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }), [size]);

  const imgStyle = useMemo(() => Object.freeze({
    width: size,
    height: size,
    objectFit: 'contain' as const,
    display: 'block',
    // Bloomberg Light: normal blend mode — tidak perlu screen di light bg
    mixBlendMode: 'normal' as const,
    filter: glow
      ? 'drop-shadow(0 0 12px rgba(15,40,180,0.25)) drop-shadow(0 0 4px rgba(15,40,180,0.15))'
      : 'none',
    willChange: 'transform' as const,
  }), [size, glow]);

  return (
    <div style={wrapStyle}>
      <img
        src="/logo.png"
        alt="ZERØ MERIDIAN Logo"
        width={size}
        height={size}
        style={imgStyle}
      />
    </div>
  );
});

XLogo.displayName = 'XLogo';
export default XLogo;
