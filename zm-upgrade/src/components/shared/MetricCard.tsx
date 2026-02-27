/**
 * MetricCard.tsx — ZERØ MERIDIAN v30
 * Bloomberg-grade metric card — CSS variables, price flash animation
 */

import { memo, useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { TRANSITION, VARIANTS } from '@/lib/motion';
import Skeleton from './Skeleton';

interface MetricCardProps {
  label:        string;
  value:        string;
  change?:      number;
  icon?:        LucideIcon;
  accentColor?: string;
  loading?:     boolean;
  subtitle?:    string;
}

// Animated value with price flash
const AnimatedValue = memo(({ value }: { value: string }) => {
  const prevRef  = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (prevRef.current === value) return;
    // Determine direction from numeric part
    const prev = parseFloat(prevRef.current.replace(/[^0-9.-]/g, ''));
    const curr = parseFloat(value.replace(/[^0-9.-]/g, ''));
    const dir  = curr > prev ? 'up' : curr < prev ? 'down' : null;
    prevRef.current = value;
    if (dir && mountedRef.current) {
      setFlash(dir);
      setTimeout(() => { if (mountedRef.current) setFlash(null); }, 600);
    }
  }, [value]);

  const wrapStyle = useMemo(() => ({
    display:         'inline-block',
    borderRadius:    4,
    animation:       flash === 'up'   ? 'zm-flash-up 500ms ease-out'
                   : flash === 'down' ? 'zm-flash-down 500ms ease-out'
                   : 'none',
  }), [flash]);

  return (
    <div style={wrapStyle}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={value}
          variants={VARIANTS.numberFlip}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={TRANSITION.springBouncy}
          style={{
            display:    'inline-block',
            fontFamily: 'var(--zm-font-data)',
            fontSize:   'var(--zm-text-xl)',
            fontWeight: 700,
            color:      'var(--zm-text-1)',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
});
AnimatedValue.displayName = 'AnimatedValue';

const MetricCard = memo(({
  label, value, change, icon: Icon,
  accentColor, loading = false, subtitle,
}: MetricCardProps) => {

  if (loading) return (
    <div style={{
      background: 'var(--zm-card-bg)',
      border: '1px solid var(--zm-card-border)',
      borderRadius: 'var(--zm-card-radius)',
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8, minHeight: 90,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width={70} height={9} />
        <Skeleton width={14} height={14} borderRadius={4} />
      </div>
      <Skeleton width="60%" height={26} borderRadius={6} />
      <Skeleton width={50} height={9} />
    </div>
  );

  const changeColor = change !== undefined
    ? change >= 0 ? 'var(--zm-green)' : 'var(--zm-red)'
    : undefined;

  const changeStr = change !== undefined
    ? (change >= 0 ? '+' : '') + change.toFixed(2) + '%'
    : undefined;

  const accent = accentColor ?? 'var(--zm-blue)';

  return (
    <motion.div
      className="zm-card"
      style={{
        padding:        16,
        display:        'flex',
        flexDirection:  'column' as const,
        gap:            6,
        minHeight:      90,
        position:       'relative' as const,
        overflow:       'hidden',
      }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={TRANSITION.spring}
    >
      {/* Accent top line */}
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
        background: accent,
        opacity: 0.4,
        borderRadius: '0 0 4px 4px',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily:    'var(--zm-font-data)',
          fontSize:      'var(--zm-text-2xs)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          color:         'var(--zm-text-3)',
        }}>
          {label}
        </span>
        {Icon && <Icon size={13} style={{ color: 'var(--zm-text-3)', flexShrink: 0 }} />}
      </div>

      {/* Value */}
      <AnimatedValue value={value} />

      {/* Change */}
      {changeStr && (
        <span style={{
          fontFamily: 'var(--zm-font-data)',
          fontSize:   'var(--zm-text-xs)',
          color:      changeColor,
        }}>
          {changeStr}
        </span>
      )}

      {subtitle && (
        <span style={{
          fontFamily: 'var(--zm-font-data)',
          fontSize:   'var(--zm-text-2xs)',
          color:      'var(--zm-text-3)',
        }}>
          {subtitle}
        </span>
      )}
    </motion.div>
  );
});

MetricCard.displayName = 'MetricCard';
export default MetricCard;
