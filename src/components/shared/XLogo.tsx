/**
 * XLogo.tsx — ZERØ MERIDIAN 2026 push81
 * Crystal glowing X logo — matches brand image
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useMemo ✓
 */

import React, { useMemo } from 'react';

interface XLogoProps {
  size?: number;
}

const XLogo = React.memo(({ size = 180 }: XLogoProps) => {
  const svgStyle = useMemo(() => Object.freeze({
    display: 'block',
    width: size,
    height: size,
  }), [size]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={svgStyle}
    >
      <defs>
        {/* Outer deep glow */}
        <filter id="xDeepGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" result="b1" />
          <feGaussianBlur stdDeviation="30" result="b2" />
          <feMerge>
            <feMergeNode in="b2" />
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Mid glow */}
        <filter id="xMidGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Sharp glow */}
        <filter id="xSharpGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Top-left arm gradient */}
        <linearGradient id="xGradTL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="30%" stopColor="rgba(100,220,255,1)" />
          <stop offset="70%" stopColor="rgba(0,200,255,0.9)" />
          <stop offset="100%" stopColor="rgba(0,140,220,0.6)" />
        </linearGradient>
        {/* Bottom-right arm gradient */}
        <linearGradient id="xGradBR" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="30%" stopColor="rgba(80,210,255,1)" />
          <stop offset="70%" stopColor="rgba(0,195,255,0.9)" />
          <stop offset="100%" stopColor="rgba(0,130,210,0.55)" />
        </linearGradient>
        {/* Top-right arm gradient */}
        <linearGradient id="xGradTR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="30%" stopColor="rgba(100,220,255,1)" />
          <stop offset="70%" stopColor="rgba(0,200,255,0.9)" />
          <stop offset="100%" stopColor="rgba(0,140,220,0.6)" />
        </linearGradient>
        {/* Bottom-left arm gradient */}
        <linearGradient id="xGradBL" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="30%" stopColor="rgba(80,210,255,1)" />
          <stop offset="70%" stopColor="rgba(0,195,255,0.9)" />
          <stop offset="100%" stopColor="rgba(0,130,210,0.55)" />
        </linearGradient>

        {/* Crystal face fills */}
        <linearGradient id="xFaceTL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(140,210,255,0.25)" />
          <stop offset="50%" stopColor="rgba(20,60,100,0.55)" />
          <stop offset="100%" stopColor="rgba(5,15,30,0.75)" />
        </linearGradient>
        <linearGradient id="xFaceBR" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(140,210,255,0.2)" />
          <stop offset="100%" stopColor="rgba(5,15,30,0.7)" />
        </linearGradient>
        <linearGradient id="xFaceTR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(160,230,255,0.22)" />
          <stop offset="100%" stopColor="rgba(5,15,30,0.72)" />
        </linearGradient>
        <linearGradient id="xFaceBL" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(100,190,255,0.18)" />
          <stop offset="100%" stopColor="rgba(5,15,30,0.7)" />
        </linearGradient>

        {/* Ambient radial */}
        <radialGradient id="xAmbient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,200,255,0.12)" />
          <stop offset="60%" stopColor="rgba(0,200,255,0.04)" />
          <stop offset="100%" stopColor="rgba(0,200,255,0)" />
        </radialGradient>
      </defs>

      {/* Ambient glow background */}
      <circle cx="100" cy="100" r="95" fill="url(#xAmbient)" />

      {/* ── X shape — 4 crystal arms ── */}

      {/* TOP-LEFT ARM — goes from center toward top-left */}
      {/* Crystal face: left side darker */}
      <polygon
        points="100,100 28,28 52,52 80,80"
        fill="url(#xFaceTL)"
      />
      {/* Crystal face: right side lighter */}
      <polygon
        points="100,100 52,28 28,52 80,80"
        fill="rgba(160,230,255,0.1)"
      />

      {/* BOTTOM-RIGHT ARM */}
      <polygon
        points="100,100 148,120 172,172 120,148"
        fill="url(#xFaceBR)"
      />
      <polygon
        points="100,100 172,148 148,172 120,120"
        fill="rgba(140,210,255,0.08)"
      />

      {/* TOP-RIGHT ARM */}
      <polygon
        points="100,100 148,80 172,28 120,52"
        fill="url(#xFaceTR)"
      />
      <polygon
        points="100,100 172,52 148,28 120,80"
        fill="rgba(120,200,255,0.1)"
      />

      {/* BOTTOM-LEFT ARM */}
      <polygon
        points="100,100 52,120 28,172 80,148"
        fill="url(#xFaceBL)"
      />
      <polygon
        points="100,100 28,148 52,172 80,120"
        fill="rgba(100,190,255,0.08)"
      />

      {/* ── Glowing edges — deep glow layer ── */}
      {/* TL arm outer edges */}
      <line x1="100" y1="100" x2="28" y2="28"
        stroke="rgba(0,200,255,0.25)" strokeWidth="20"
        strokeLinecap="round" filter="url(#xDeepGlow)" />
      <line x1="100" y1="100" x2="52" y2="28"
        stroke="rgba(0,200,255,0.2)" strokeWidth="14"
        strokeLinecap="round" filter="url(#xDeepGlow)" />

      {/* BR arm outer edges */}
      <line x1="100" y1="100" x2="172" y2="172"
        stroke="rgba(0,200,255,0.25)" strokeWidth="20"
        strokeLinecap="round" filter="url(#xDeepGlow)" />

      {/* TR arm outer edges */}
      <line x1="100" y1="100" x2="172" y2="28"
        stroke="rgba(0,200,255,0.25)" strokeWidth="20"
        strokeLinecap="round" filter="url(#xDeepGlow)" />

      {/* BL arm outer edges */}
      <line x1="100" y1="100" x2="28" y2="172"
        stroke="rgba(0,200,255,0.25)" strokeWidth="20"
        strokeLinecap="round" filter="url(#xDeepGlow)" />

      {/* ── Glowing edges — mid glow ── */}
      <line x1="100" y1="100" x2="32" y2="32"
        stroke="rgba(0,220,255,0.55)" strokeWidth="10"
        strokeLinecap="round" filter="url(#xMidGlow)" />
      <line x1="100" y1="100" x2="168" y2="168"
        stroke="rgba(0,220,255,0.55)" strokeWidth="10"
        strokeLinecap="round" filter="url(#xMidGlow)" />
      <line x1="100" y1="100" x2="168" y2="32"
        stroke="rgba(0,220,255,0.55)" strokeWidth="10"
        strokeLinecap="round" filter="url(#xMidGlow)" />
      <line x1="100" y1="100" x2="32" y2="168"
        stroke="rgba(0,220,255,0.55)" strokeWidth="10"
        strokeLinecap="round" filter="url(#xMidGlow)" />

      {/* ── Main crystal edges — sharp bright ── */}
      {/* Diagonal 1: top-left to bottom-right */}
      <line x1="30" y1="30" x2="170" y2="170"
        stroke="url(#xGradTL)" strokeWidth="5"
        strokeLinecap="round" filter="url(#xSharpGlow)" />
      {/* Diagonal 2: top-right to bottom-left */}
      <line x1="170" y1="30" x2="30" y2="170"
        stroke="url(#xGradTR)" strokeWidth="5"
        strokeLinecap="round" filter="url(#xSharpGlow)" />

      {/* ── White specular core highlights ── */}
      <line x1="30" y1="30" x2="90" y2="90"
        stroke="rgba(255,255,255,0.8)" strokeWidth="2.5"
        strokeLinecap="round" />
      <line x1="170" y1="30" x2="110" y2="90"
        stroke="rgba(255,255,255,0.75)" strokeWidth="2.5"
        strokeLinecap="round" />
      {/* Small specular tips */}
      <line x1="30" y1="30" x2="40" y2="38"
        stroke="rgba(255,255,255,0.95)" strokeWidth="3.5"
        strokeLinecap="round" />
      <line x1="170" y1="30" x2="160" y2="38"
        stroke="rgba(255,255,255,0.95)" strokeWidth="3.5"
        strokeLinecap="round" />

      {/* ── Center glow point ── */}
      <circle cx="100" cy="100" r="6"
        fill="rgba(0,230,255,0.3)"
        filter="url(#xMidGlow)" />
      <circle cx="100" cy="100" r="3"
        fill="rgba(255,255,255,0.7)" />
    </svg>
  );
});

XLogo.displayName = 'XLogo';
export default XLogo;
