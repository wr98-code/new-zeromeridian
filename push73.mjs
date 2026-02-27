// push73.mjs — ZERØ MERIDIAN
// Changes:
//   1. Portal.tsx      — Logo Ø crystal SVG + particle field + auto-enter 2.5s
//   2. Markets.tsx     — Tablet: 5 kolom, panel 380px (add isTablet)
//   3. ZMSidebar.tsx   — logoAreaStyle paddingTop 32px fix

import { Buffer } from 'buffer';

const TOKEN  = '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';
const REPO   = 'winduadiprabowo-pixel/core-meridian-data';
const BRANCH = 'main';

async function getSHA(path) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  const r   = await fetch(url, { headers: { Authorization: `token ${TOKEN}` } });
  const j   = await r.json();
  if (!j.sha) throw new Error('No SHA for ' + path + ': ' + JSON.stringify(j));
  return j.sha;
}

async function pushFile(path, content, sha, msg) {
  const url  = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const body = {
    message: msg,
    content: Buffer.from(content, 'utf8').toString('base64'),
    sha,
    branch:  BRANCH,
  };
  const r = await fetch(url, {
    method:  'PUT',
    headers: { Authorization: `token ${TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.content) throw new Error('Push failed for ' + path + ': ' + JSON.stringify(j));
  console.log('  ✅ ' + path);
}

// ─── 1. PORTAL.TSX ────────────────────────────────────────────────────────────
const PORTAL_TSX = `/**
 * Portal.tsx — ZERØ MERIDIAN 2026 push73
 * push73: Logo Ø crystal SVG center of particle field, auto-enter 2.5s
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo + mountedRef ✓
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

const PARTICLE_COUNT  = 6000;
const PARTICLE_SPREAD = 140;
const AUTO_ENTER_MS   = 2500;

function createPRNG(seed: number) {
  let s0 = seed >>> 0;
  let s1 = (seed * 1664525 + 1013904223) >>> 0;
  let s2 = (s1  * 1664525 + 1013904223) >>> 0;
  let s3 = (s2  * 1664525 + 1013904223) >>> 0;
  return function next(): number {
    const result = (Math.imul(s0 + s3, 5) + 0x9E3779B9) >>> 0;
    const t = s1 << 9;
    s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3;
    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);
    return (result >>> 0) / 0x100000000;
  };
}

// ─── Ø Logo — glass crystal, cyan + white specular core ──────────────────────
const OmegaLogo = React.memo(() => (
  <svg
    width="140"
    height="140"
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ display: 'block' }}
  >
    <defs>
      <filter id="zmOuterGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="10" result="b1" />
        <feGaussianBlur stdDeviation="22" result="b2" />
        <feMerge>
          <feMergeNode in="b2" />
          <feMergeNode in="b1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="zmEdgeGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="zmWhite" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient id="zmGlassFill" cx="38%" cy="32%" r="60%">
        <stop offset="0%"   stopColor="rgba(180,245,255,0.1)" />
        <stop offset="100%" stopColor="rgba(0,180,220,0.02)" />
      </radialGradient>
      <linearGradient id="zmCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.92)" />
        <stop offset="25%"  stopColor="rgba(140,238,255,1)" />
        <stop offset="65%"  stopColor="rgba(0,238,255,1)" />
        <stop offset="100%" stopColor="rgba(0,180,220,0.85)" />
      </linearGradient>
      <linearGradient id="zmSlashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.95)" />
        <stop offset="35%"  stopColor="rgba(140,240,255,1)" />
        <stop offset="70%"  stopColor="rgba(0,238,255,1)" />
        <stop offset="100%" stopColor="rgba(0,195,235,0.8)" />
      </linearGradient>
    </defs>

    {/* Glass fill */}
    <circle cx="70" cy="70" r="44" fill="url(#zmGlassFill)" />

    {/* Outer glow circle */}
    <circle cx="70" cy="70" r="44"
      stroke="rgba(0,238,255,0.32)"
      strokeWidth="13"
      fill="none"
      filter="url(#zmOuterGlow)"
    />

    {/* Main circle */}
    <circle cx="70" cy="70" r="44"
      stroke="url(#zmCircleGrad)"
      strokeWidth="7"
      fill="none"
      filter="url(#zmEdgeGlow)"
    />

    {/* White specular arc — top-left hotspot */}
    <circle cx="70" cy="70" r="44"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="2"
      fill="none"
      strokeDasharray="55 222"
      strokeDashoffset="25"
      filter="url(#zmWhite)"
    />

    {/* Slash outer glow */}
    <line x1="97" y1="29" x2="43" y2="111"
      stroke="rgba(0,238,255,0.38)"
      strokeWidth="13"
      strokeLinecap="round"
      filter="url(#zmOuterGlow)"
    />

    {/* Slash main */}
    <line x1="97" y1="29" x2="43" y2="111"
      stroke="url(#zmSlashGrad)"
      strokeWidth="7"
      strokeLinecap="round"
      filter="url(#zmEdgeGlow)"
    />

    {/* Slash white core — top hotspot */}
    <line x1="95" y1="32" x2="67" y2="74"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth="2.5"
      strokeLinecap="round"
      filter="url(#zmWhite)"
    />
  </svg>
));
OmegaLogo.displayName = 'OmegaLogo';

// ─── Thin progress bar ────────────────────────────────────────────────────────
const EnterProgress = React.memo(({ duration }: { duration: number }) => {
  const trackStyle = useMemo(() => Object.freeze({
    width: '100px',
    height: '1px',
    background: 'rgba(32,42,68,1)',
    borderRadius: '1px',
    overflow: 'hidden' as const,
    marginTop: '28px',
  }), []);
  const fillStyle = useMemo(() => Object.freeze({
    height: '100%',
    background: 'rgba(0,238,255,1)',
    borderRadius: '1px',
    transformOrigin: 'left' as const,
  }), []);
  return (
    <div style={trackStyle}>
      <motion.div
        style={fillStyle}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </div>
  );
});
EnterProgress.displayName = 'EnterProgress';

// ─── Portal ───────────────────────────────────────────────────────────────────
const Portal: React.FC = () => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);
  const frameRef   = useRef<number>(0);
  const clockRef   = useRef(new THREE.Clock());
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const navigate   = useNavigate();
  const [launched,    setLaunched]    = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);

  const doEnter = useCallback(() => {
    if (!mountedRef.current) return;
    setLaunched(true);
    setTimeout(() => navigate('/dashboard'), 600);
  }, [navigate]);

  useEffect(() => {
    mountedRef.current = true;
    const showTimer = setTimeout(() => { if (mountedRef.current) setLogoVisible(true); }, 250);
    timerRef.current  = setTimeout(() => { if (mountedRef.current) doEnter(); }, AUTO_ENTER_MS + 250);
    return () => {
      mountedRef.current = false;
      clearTimeout(showTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [doEnter]);

  const initScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mountedRef.current) return;

    const scene    = new THREE.Scene();
    scene.fog      = new THREE.FogExp2(0x000000, 0.003);
    const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 70;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    const prng      = createPRNG(PARTICLE_COUNT * 31337);
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors    = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3    = i * 3;
      const theta = prng() * Math.PI * 2;
      const phi   = Math.acos(2 * prng() - 1);
      const r     = Math.cbrt(prng()) * PARTICLE_SPREAD;
      positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      const t = r / PARTICLE_SPREAD;
      colors[i3]     = 0.38 * (1 - t) + 0.55 * t;
      colors[i3 + 1] = 0.72 * (1 - t) + 0.92 * t;
      colors[i3 + 2] = 0.95 * (1 - t) + 0.25 * t;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.7, vertexColors: true, transparent: true, opacity: 0.9,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    const mouse = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 0.4;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener('mousemove', onMouse);
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      if (!mountedRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      const t = clockRef.current.getElapsedTime();
      if (!prefersReducedMotion) {
        particles.rotation.y = t * 0.035;
        particles.rotation.x = t * 0.015;
        camera.position.x += (mouse.x * 18 - camera.position.x) * 0.03;
        camera.position.y += (-mouse.y * 18 - camera.position.y) * 0.03;
        camera.lookAt(scene.position);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      geo.dispose(); mat.dispose(); renderer.dispose();
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const cleanup = initScene();
    return () => { cleanup?.(); };
  }, [initScene]);

  const handleClick = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doEnter();
  }, [doEnter]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }, [handleClick]);

  const wrapStyle = useMemo(() => Object.freeze({
    position: 'fixed' as const,
    inset: 0, width: '100vw', height: '100vh',
    overflow: 'hidden', background: 'rgba(0,0,0,1)', cursor: 'pointer',
  }), []);

  const canvasStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const, inset: 0, width: '100%', height: '100%',
  }), []);

  const overlayStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const, inset: 0, pointerEvents: 'none' as const,
    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 25%, rgba(0,0,0,0.7) 100%)',
  }), []);

  const uiStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const, inset: 0,
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none' as const,
  }), []);

  const logoWrapStyle = useMemo(() => Object.freeze({
    position: 'relative' as const,
    width: '160px', height: '160px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }), []);

  const logoAmbientStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const, inset: '-24px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,238,255,0.1) 0%, rgba(0,238,255,0.03) 55%, transparent 80%)',
    filter: 'blur(10px)', pointerEvents: 'none' as const,
  }), []);

  const titleStyle = useMemo(() => Object.freeze({
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    fontSize: 'clamp(26px, 5.5vw, 50px)',
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0)',
    WebkitTextStroke: '1px rgba(240,240,248,0.88)',
    margin: '18px 0 0',
    lineHeight: 1,
    textAlign: 'center' as const,
    userSelect: 'none' as const,
  }), []);

  const subtitleStyle = useMemo(() => Object.freeze({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 'clamp(9px, 1.8vw, 13px)',
    letterSpacing: '0.52em',
    color: 'rgba(0,238,255,0.6)',
    margin: '5px 0 0',
    textAlign: 'center' as const,
    userSelect: 'none' as const,
  }), []);

  const versionStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const,
    bottom: '18px', right: '20px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '9px', color: 'rgba(80,80,100,1)',
    letterSpacing: '0.1em', pointerEvents: 'none' as const,
  }), []);

  return (
    <AnimatePresence>
      {!launched ? (
        <motion.div
          key="portal"
          style={wrapStyle}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          role="button"
          tabIndex={0}
          aria-label="ZERØ MERIDIAN — tap to enter"
        >
          <canvas ref={canvasRef} style={canvasStyle} aria-hidden="true" />
          <div style={overlayStyle} />

          <div style={uiStyle}>
            <AnimatePresence>
              {logoVisible && (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, scale: 0.75, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  style={logoWrapStyle}
                >
                  <div style={logoAmbientStyle} />
                  <OmegaLogo />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {logoVisible && (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.28, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', pointerEvents: 'none' as const }}
                >
                  <div style={titleStyle}>ZERØ</div>
                  <div style={subtitleStyle}>MERIDIAN</div>
                  <EnterProgress duration={AUTO_ENTER_MS} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={versionStyle}>
            {'v3.0 / ' + PARTICLE_COUNT.toLocaleString() + ' pts'}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="exit"
          style={{ position: 'fixed' as const, inset: 0, background: 'rgba(5,5,7,1)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </AnimatePresence>
  );
};

Portal.displayName = 'Portal';
export default React.memo(Portal);
`;

// ─── 2. MARKETS.TSX ──────────────────────────────────────────────────────────
const MARKETS_TSX = `/**
 * Markets.tsx — ZERØ MERIDIAN 2026 push73
 * push73: Tablet fixes — isTablet: 5 kolom, panel 380px
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓
 * - useCallback + useMemo ✓
 */

import { memo, useState, useCallback, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCrypto } from '@/contexts/CryptoContext';
import { useMarketWorker } from '@/hooks/useMarketWorker';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import VirtualList from '@/components/shared/VirtualList';
import SparklineChart from '@/components/shared/SparklineChart';
import { formatPrice, formatChange, formatCompact } from '@/lib/formatters';
import type { CryptoAsset } from '@/lib/formatters';

const TradingViewChart = lazy(() => import('../components/tiles/TradingViewChart'));
const OrderBookTile    = lazy(() => import('../components/tiles/OrderBookTile'));

type SortKey = 'rank' | 'name' | 'price' | 'change24h' | 'change7d' | 'marketCap' | 'volume24h';
type SortDir = 'asc' | 'desc';
type TVSymbol = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'BNBUSDT';

const ROW_HEIGHT        = 40;
const ROW_HEIGHT_MOBILE = 48;

const SYMBOL_MAP: Record<string, TVSymbol> = Object.freeze({
  bitcoin: 'BTCUSDT', ethereum: 'ETHUSDT', solana: 'SOLUSDT', binancecoin: 'BNBUSDT',
});

const ACCENT_MAP: Record<string, string> = Object.freeze({
  bitcoin:     'rgba(251,191,36,1)',
  ethereum:    'rgba(96,165,250,1)',
  solana:      'rgba(167,139,250,1)',
  binancecoin: 'rgba(251,146,60,1)',
  ripple:      'rgba(34,211,238,1)',
  cardano:     'rgba(52,211,153,1)',
  avalanche:   'rgba(251,113,133,1)',
  dogecoin:    'rgba(251,191,36,0.8)',
});

function getAccent(id: string): string { return ACCENT_MAP[id] ?? 'rgba(0,238,255,1)'; }

const ArrowUp = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
    <path d="M4.5 1.5l-3 4h6l-3-4z" fill="rgba(0,238,255,1)" />
  </svg>
);
const ArrowDown = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
    <path d="M4.5 7.5l-3-4h6l-3 4z" fill="rgba(0,238,255,1)" />
  </svg>
);
const ArrowBoth = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
    <path d="M4.5 1l-2 2.5h4L4.5 1zM4.5 8l-2-2.5h4L4.5 8z" fill="currentColor" opacity="0.3" />
  </svg>
);

interface HeaderCellProps {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (key: SortKey) => void; width?: string | number; align?: 'left' | 'right';
}
const HeaderCell = memo(({ label, sortKey, current, dir, onSort, width = 'auto', align = 'right' }: HeaderCellProps) => {
  const isActive = current === sortKey;
  const color    = isActive ? 'rgba(0,238,255,1)' : 'rgba(80,80,100,1)';
  return (
    <button type="button" onClick={() => onSort(sortKey)}
      aria-label={'Sort by ' + label}
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', textAlign: align,
        display: 'flex', alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        gap: '4px', color, background: 'transparent', border: 'none', cursor: 'pointer',
        padding: 0, width, flexShrink: 0, letterSpacing: '0.06em', minHeight: 36,
      }}>
      {label}
      {isActive ? dir === 'asc' ? <ArrowUp /> : <ArrowDown /> : <ArrowBoth />}
    </button>
  );
});
HeaderCell.displayName = 'HeaderCell';

interface AssetRowProps {
  asset: CryptoAsset; index: number;
  isMobile: boolean; isTablet: boolean;
  selected: boolean; onClick: (asset: CryptoAsset) => void;
}

const AssetRow = memo(({ asset, index, isMobile, isTablet, selected, onClick }: AssetRowProps) => {
  const ref       = useRef<HTMLDivElement>(null);
  const prevPrice = useRef(asset.price);
  const mountRef  = useRef(true);

  useEffect(() => { mountRef.current = true; return () => { mountRef.current = false; }; }, []);

  useEffect(() => {
    if (!mountRef.current || !ref.current) return;
    if (asset.price === prevPrice.current) return;
    const cls = asset.priceDirection === 'up' ? 'animate-flash-pos'
      : asset.priceDirection === 'down' ? 'animate-flash-neg' : '';
    if (!cls) { prevPrice.current = asset.price; return; }
    ref.current.classList.remove('animate-flash-pos', 'animate-flash-neg');
    void ref.current.offsetWidth;
    ref.current.classList.add(cls);
    prevPrice.current = asset.price;
    const t = setTimeout(() => { if (mountRef.current) ref.current?.classList.remove(cls); }, 300);
    return () => clearTimeout(t);
  }, [asset.price, asset.priceDirection]);

  const accent        = getAccent(asset.id);
  const rowHeight     = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;
  const change24Color = asset.change24h >= 0 ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)';
  const change7dColor = (asset.change7d ?? 0) >= 0 ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)';
  const rowBg         = selected ? 'rgba(0,238,255,0.06)'
    : index % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent';
  const handleClick   = useCallback(() => onClick(asset), [onClick, asset]);

  if (isMobile) {
    return (
      <div ref={ref} onClick={handleClick} role="button" tabIndex={0}
        aria-label={'View ' + asset.name + ' detail'}
        style={{
          height: rowHeight, background: rowBg, cursor: 'pointer',
          borderBottom: '1px solid rgba(0,238,255,0.05)',
          borderLeft: selected ? '2px solid ' + accent : '2px solid transparent',
          display: 'grid', gridTemplateColumns: '28px 1fr 90px 64px',
          alignItems: 'center', padding: '0 12px', gap: '8px',
          willChange: 'transform', transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(0,238,255,0.04)'; }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = rowBg; }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', textAlign: 'right', color: 'rgba(80,80,100,1)' }}>{asset.rank}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {asset.image
            ? <img src={asset.image} alt="" style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0 }} />
            : <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: accent + '33' }} />}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(240,240,248,1)' }}>
            {asset.symbol.toUpperCase()}
          </span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'right', color: 'rgba(240,240,248,1)' }}>{formatPrice(asset.price)}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'right', color: change24Color }}>{formatChange(asset.change24h)}</span>
      </div>
    );
  }

  return (
    <div ref={ref} onClick={handleClick} role="button" tabIndex={0}
      aria-label={'View ' + asset.name + ' detail'}
      style={{
        height: rowHeight, background: rowBg, cursor: 'pointer',
        borderBottom: '1px solid rgba(0,238,255,0.05)',
        borderLeft: selected ? '2px solid ' + accent : '2px solid transparent',
        display: 'flex', alignItems: 'center',
        padding: selected ? '0 16px 0 14px' : '0 16px',
        gap: '12px', willChange: 'transform', transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(0,238,255,0.04)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = rowBg; }}>

      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: 28, flexShrink: 0, textAlign: 'right', color: 'rgba(80,80,100,1)' }}>{asset.rank}</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isTablet ? 170 : 150, flexShrink: 0 }}>
        {asset.image
          ? <img src={asset.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }} />
          : <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: accent + '33' }} />}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(240,240,248,1)' }}>
            {asset.symbol.toUpperCase()}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(80,80,100,1)' }}>
            {asset.name}
          </span>
        </div>
      </div>

      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: isTablet ? 115 : 100, flexShrink: 0, textAlign: 'right', color: 'rgba(240,240,248,1)' }}>
        {formatPrice(asset.price)}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: 72, flexShrink: 0, textAlign: 'right', color: change24Color }}>
        {formatChange(asset.change24h)}
      </span>
      {!isTablet && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: 72, flexShrink: 0, textAlign: 'right', color: change7dColor }}>
          {formatChange(asset.change7d ?? 0)}
        </span>
      )}
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: isTablet ? 115 : 100, flexShrink: 0, textAlign: 'right', color: 'rgba(138,138,158,1)' }}>
        {formatCompact(asset.marketCap)}
      </span>
      {!isTablet && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: 100, flexShrink: 0, textAlign: 'right', color: 'rgba(138,138,158,1)' }}>
          {formatCompact(asset.volume24h)}
        </span>
      )}
      {!isTablet && (
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {asset.sparkline && asset.sparkline.length > 1 && (
            <SparklineChart data={asset.sparkline} width={80} height={28} color="auto" />
          )}
        </div>
      )}
    </div>
  );
});
AssetRow.displayName = 'AssetRow';

interface StatBoxProps { label: string; value: string; color?: string; }
const StatBox = memo(({ label, value, color }: StatBoxProps) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 3,
    padding: '8px 10px', borderRadius: 8,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(32,42,68,1)',
    flex: 1, minWidth: 0,
  }}>
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
      {label}
    </span>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: color ?? 'rgba(240,240,248,1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
      {value}
    </span>
  </div>
));
StatBox.displayName = 'StatBox';

interface AssetDetailPanelProps {
  asset: CryptoAsset; onClose: () => void; isMobile: boolean; isTablet: boolean;
}

const AssetDetailPanel = memo(({ asset, onClose, isMobile, isTablet }: AssetDetailPanelProps) => {
  const prefersReducedMotion = useReducedMotion();
  const accent      = getAccent(asset.id);
  const tvSymbol    = SYMBOL_MAP[asset.id] as TVSymbol | undefined;
  const change24h   = asset.change24h;
  const isPos       = change24h >= 0;
  const changeColor = isPos ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)';

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const panelVariants = {
    hidden:  { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 28, stiffness: 280 } },
    exit:    { x: '100%', opacity: 0, transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: [0.36, 0, 0.66, 0] } },
  };

  const panelWidth = isMobile ? '100vw' : isTablet ? '380px' : '480px';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(4,5,10,0.60)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        aria-label="Close panel"
      />
      <motion.div
        variants={panelVariants} initial="hidden" animate="visible" exit="exit"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: panelWidth,
          zIndex: 201, background: 'rgba(7,9,18,0.98)',
          borderLeft: '1px solid ' + accent.replace('1)', '0.22)'),
          display: 'flex', flexDirection: 'column', overflow: 'hidden', willChange: 'transform',
        }}
        role="dialog" aria-label={'Asset detail: ' + asset.name} aria-modal="true"
      >
        <div style={{
          padding: '16px 20px 12px', borderBottom: '1px solid rgba(32,42,68,1)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0, background: 'rgba(7,9,18,1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {asset.image
              ? <img src={asset.image} alt="" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: '1px solid ' + accent.replace('1)', '0.25)') }} />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: accent + '20' }} />}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 700, color: 'rgba(240,240,248,1)', letterSpacing: '0.04em' }}>{asset.symbol.toUpperCase()}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(80,80,100,1)' }}>{asset.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(32,42,68,1)', color: 'rgba(138,138,158,1)' }}>{'#' + asset.rank}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: accent, letterSpacing: '0.02em' }}>{formatPrice(asset.price)}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: changeColor, fontWeight: 600 }}>{isPos ? '+' : ''}{change24h.toFixed(2)}%</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close panel"
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(32,42,68,1)',
              color: 'rgba(138,138,158,1)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 300, willChange: 'transform',
            }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <StatBox label="24h High"    value={formatPrice(asset.high24h ?? asset.price)} />
            <StatBox label="24h Low"     value={formatPrice(asset.low24h  ?? asset.price)} />
            <StatBox label="7d Change"   value={formatChange(asset.change7d ?? 0)} color={(asset.change7d ?? 0) >= 0 ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)'} />
            <StatBox label="Mkt Cap"     value={formatCompact(asset.marketCap)} />
            <StatBox label="Volume 24h"  value={formatCompact(asset.volume24h)} />
            <StatBox label="Circ Supply" value={formatCompact(asset.circulatingSupply)} />
          </div>
          {asset.ath && (
            <div style={{ display: 'flex', gap: 8 }}>
              <StatBox label="All-Time High" value={formatPrice(asset.ath)} color="rgba(251,191,36,1)" />
            </div>
          )}
          {asset.sparkline && asset.sparkline.length > 1 && (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(32,42,68,1)' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em', marginBottom: 8 }}>7D PRICE CHART</div>
              <SparklineChart data={asset.sparkline} width={isMobile ? 300 : 340} height={60} color={accent} />
            </div>
          )}
          {tvSymbol ? (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(32,42,68,1)' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em', padding: '10px 14px 0' }}>LIVE CANDLESTICK</div>
              <Suspense fallback={<div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)' }}>Loading chart...</span></div>}>
                <TradingViewChart defaultSymbol={tvSymbol} height={300} />
              </Suspense>
            </div>
          ) : (
            <div style={{ padding: '20px', borderRadius: 10, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(32,42,68,1)' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)' }}>Live chart available for BTC · ETH · SOL · BNB</span>
            </div>
          )}
          {tvSymbol && (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(32,42,68,1)' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em', padding: '10px 14px 6px' }}>ORDER BOOK</div>
              <Suspense fallback={<div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)' }}>Loading...</span></div>}>
                <OrderBookTile />
              </Suspense>
            </div>
          )}
          <a href={'https://www.binance.com/en/trade/' + asset.symbol.toUpperCase() + '_USDT'}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px', borderRadius: 8, background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.18)', color: 'rgba(251,191,36,0.8)',
              textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: '0.08em', marginBottom: 8,
            }}>
            <span>TRADE ON BINANCE</span>
            <span style={{ opacity: 0.6 }}>↗</span>
          </a>
        </div>
      </motion.div>
    </>
  );
});
AssetDetailPanel.displayName = 'AssetDetailPanel';

// ─── Markets Page ─────────────────────────────────────────────────────────────
const Markets = memo(() => {
  const { assets }             = useCrypto();
  const worker                 = useMarketWorker();
  const { isMobile, isTablet } = useBreakpoint();

  const [query,         setQuery]         = useState('');
  const [sortKey,       setSortKey]       = useState<SortKey>('rank');
  const [sortDir,       setSortDir]       = useState<SortDir>('asc');
  const [filtered,      setFiltered]      = useState<CryptoAsset[]>(assets);
  const [isWorking,     setIsWorking]     = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (assets.length === 0) return;
    setIsWorking(true);
    worker.sortAndFilter(assets, sortKey, sortDir, query)
      .then(result => { if (!mountedRef.current) return; setFiltered(result.assets); })
      .catch(() => {
        if (!mountedRef.current) return;
        const q = query.toLowerCase();
        const list = assets.filter(a => !q || a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
        list.sort((a, b) => {
          const mul = sortDir === 'asc' ? 1 : -1;
          if (sortKey === 'name') return mul * a.name.localeCompare(b.name);
          return mul * ((a[sortKey] as number ?? 0) - (b[sortKey] as number ?? 0));
        });
        setFiltered(list);
      })
      .finally(() => { if (mountedRef.current) setIsWorking(false); });
  }, [assets, sortKey, sortDir, query, worker]);

  const handleSort        = useCallback((key: SortKey) => {
    setSortKey(prev => { if (prev === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else setSortDir('desc'); return key; });
  }, []);
  const handleSearch      = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); }, []);
  const handleSelectAsset = useCallback((asset: CryptoAsset) => { setSelectedAsset(prev => prev?.id === asset.id ? null : asset); }, []);
  const handleClosePanel  = useCallback(() => { setSelectedAsset(null); }, []);

  const rowHeight  = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;
  const renderRow  = useCallback((asset: CryptoAsset, index: number) => (
    <AssetRow asset={asset} index={index} isMobile={isMobile} isTablet={isTablet}
      selected={selectedAsset?.id === asset.id} onClick={handleSelectAsset} />
  ), [isMobile, isTablet, selectedAsset?.id, handleSelectAsset]);
  const getKey     = useCallback((asset: CryptoAsset) => asset.id, []);
  const listHeight = useMemo(() => Math.min(window.innerHeight - 240, filtered.length * rowHeight), [filtered.length, rowHeight]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }} role="main" aria-label="Live Markets">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: 'rgba(240,240,248,1)', letterSpacing: '0.04em', margin: 0 }}>
            Live Markets
          </h1>
          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: 4, background: 'rgba(34,255,170,0.08)', color: 'rgba(34,255,170,1)' }}>
            {filtered.length + ' assets'}
          </span>
          {isWorking && <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(80,80,100,1)' }}>sorting...</span>}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(32,42,68,1)',
          minWidth: isMobile ? '100%' : 200, minHeight: isMobile ? 48 : 'auto',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>
          <input type="search" placeholder="Search assets..." value={query} onChange={handleSearch} aria-label="Search assets"
            style={{ background: 'transparent', outline: 'none', border: 'none', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, flex: 1, color: 'rgba(240,240,248,1)', WebkitAppearance: 'none' }} />
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(32,42,68,1)', borderRadius: 12, overflow: 'hidden' }}>
        {isMobile ? (
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 90px 64px', alignItems: 'center', padding: '0 12px', gap: 8, position: 'sticky' as const, top: 0, zIndex: 10, height: 36, background: 'rgba(6,8,14,0.97)', borderBottom: '1px solid rgba(32,42,68,1)', backdropFilter: 'blur(12px)' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', textAlign: 'right' }}>#</span>
            <HeaderCell label="Asset"  sortKey="name"      current={sortKey} dir={sortDir} onSort={handleSort} width="100%" align="left" />
            <HeaderCell label="Price"  sortKey="price"     current={sortKey} dir={sortDir} onSort={handleSort} width={90} />
            <HeaderCell label="24h"    sortKey="change24h" current={sortKey} dir={sortDir} onSort={handleSort} width={64} />
          </div>
        ) : isTablet ? (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, position: 'sticky' as const, top: 0, zIndex: 10, height: 36, background: 'rgba(6,8,14,0.97)', borderBottom: '1px solid rgba(32,42,68,1)', backdropFilter: 'blur(12px)' }}>
            <span style={{ width: 28, flexShrink: 0 }} />
            <span style={{ width: 170, flexShrink: 0 }}>
              <HeaderCell label="Asset"  sortKey="name"      current={sortKey} dir={sortDir} onSort={handleSort} width={170} align="left" />
            </span>
            <HeaderCell label="Price"   sortKey="price"     current={sortKey} dir={sortDir} onSort={handleSort} width={115} />
            <HeaderCell label="24h"     sortKey="change24h" current={sortKey} dir={sortDir} onSort={handleSort} width={72} />
            <HeaderCell label="Mkt Cap" sortKey="marketCap" current={sortKey} dir={sortDir} onSort={handleSort} width={115} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, position: 'sticky' as const, top: 0, zIndex: 10, height: 36, background: 'rgba(6,8,14,0.97)', borderBottom: '1px solid rgba(32,42,68,1)', backdropFilter: 'blur(12px)' }}>
            <span style={{ width: 28, flexShrink: 0 }} />
            <span style={{ width: 150, flexShrink: 0 }}>
              <HeaderCell label="Asset"   sortKey="name"      current={sortKey} dir={sortDir} onSort={handleSort} width={150} align="left" />
            </span>
            <HeaderCell label="Price"    sortKey="price"     current={sortKey} dir={sortDir} onSort={handleSort} width={100} />
            <HeaderCell label="24h"      sortKey="change24h" current={sortKey} dir={sortDir} onSort={handleSort} width={72} />
            <HeaderCell label="7d"       sortKey="change7d"  current={sortKey} dir={sortDir} onSort={handleSort} width={72} />
            <HeaderCell label="Mkt Cap"  sortKey="marketCap" current={sortKey} dir={sortDir} onSort={handleSort} width={100} />
            <HeaderCell label="Volume"   sortKey="volume24h" current={sortKey} dir={sortDir} onSort={handleSort} width={100} />
            <span style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)', letterSpacing: '0.06em' }}>7d Chart</span>
          </div>
        )}

        {!selectedAsset && filtered.length > 0 && (
          <div style={{ padding: '5px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.06em', borderBottom: '1px solid rgba(32,42,68,0.5)', background: 'rgba(0,238,255,0.02)' }}>
            {'← click any row to view detail chart & order book'}
          </div>
        )}

        <VirtualList items={filtered} itemHeight={rowHeight} height={listHeight || 400} overscan={5} renderItem={renderRow} getKey={getKey} />
      </div>

      <AnimatePresence>
        {selectedAsset && (
          <AssetDetailPanel key={selectedAsset.id} asset={selectedAsset} onClose={handleClosePanel} isMobile={isMobile} isTablet={isTablet} />
        )}
      </AnimatePresence>
    </div>
  );
});
Markets.displayName = 'Markets';
export default Markets;
`;

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[push73] Starting...\n');

  // 1. Portal
  console.log('[1/3] Portal.tsx...');
  const sha1 = await getSHA('src/pages/Portal.tsx');
  await pushFile('src/pages/Portal.tsx', PORTAL_TSX, sha1, 'push73: Portal — Ø crystal logo + particle field + auto-enter 2.5s');

  // 2. Markets
  console.log('[2/3] Markets.tsx...');
  const sha2 = await getSHA('src/pages/Markets.tsx');
  await pushFile('src/pages/Markets.tsx', MARKETS_TSX, sha2, 'push73: Markets — tablet 5 cols, panel 380px');

  // 3. ZMSidebar — fetch raw, patch logoAreaStyle, push back
  console.log('[3/3] ZMSidebar.tsx...');
  const sidebarRes  = await fetch(
    'https://api.github.com/repos/' + REPO + '/contents/src/components/layout/ZMSidebar.tsx?ref=' + BRANCH,
    { headers: { Authorization: 'token ' + TOKEN } }
  );
  const sidebarJson = await sidebarRes.json();
  const sidebarSHA  = sidebarJson.sha;
  const sidebarRaw  = Buffer.from(sidebarJson.content, 'base64').toString('utf8');

  const NEEDLE   = "    height: '64px',\n    display: 'flex',";
  const REPLACE  = "    height: '64px',\n    paddingTop: '32px',\n    display: 'flex',";
  const patched  = sidebarRaw.includes(NEEDLE) ? sidebarRaw.replace(NEEDLE, REPLACE) : null;

  if (!patched) {
    console.log('  ⚠️  ZMSidebar needle not found — skipping (safe to fix manually)');
  } else {
    await pushFile('src/components/layout/ZMSidebar.tsx', patched, sidebarSHA, 'push73: ZMSidebar — logo paddingTop 32px');
  }

  console.log('\n✅ push73 selesai!');
  console.log('🌐 https://meridian-zero-jet.vercel.app');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
