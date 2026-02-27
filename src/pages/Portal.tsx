/**
 * Portal.tsx — ZERØ MERIDIAN 2026 push81
 * push81: New brand X logo — crystal glowing X replaces shuriken
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo + mountedRef ✓
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import XLogo from '@/components/shared/XLogo';

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
    width: '200px', height: '200px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }), []);

  const logoAmbientStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const, inset: '-32px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,238,255,0.12) 0%, rgba(0,238,255,0.04) 50%, transparent 75%)',
    filter: 'blur(14px)', pointerEvents: 'none' as const,
  }), []);

  // Slow rotation on the logo
  const logoMotionStyle = useMemo(() => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }), []);

  const titleStyle = useMemo(() => Object.freeze({
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    fontSize: 'clamp(26px, 5.5vw, 50px)',
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0)',
    WebkitTextStroke: '1px rgba(240,240,248,0.88)',
    margin: '20px 0 0',
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
                  initial={{ opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.15 }}
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                  style={logoWrapStyle}
                >
                  <div style={logoAmbientStyle} />
                  <motion.div
                    style={logoMotionStyle}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
                  >
                    <XLogo size={180} />
                  </motion.div>
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
                  transition={{ delay: 0.32, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
