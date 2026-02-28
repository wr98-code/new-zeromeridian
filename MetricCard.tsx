/**
 * MetricCard.tsx — ZERØ MERIDIAN push93
 * Bloomberg terminal metric card — compact, dense, no frills
 * 4px radius | JetBrains Mono untuk angka | padding 10px
 * ZERO className | var(--zm-*) | React.memo | useMemo
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

const AnimatedValue = memo(({ value }: { value: string }) => {
  const prevRef    = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (prevRef.current === value) return;
    const prev = parseFloat(prevRef.current.replace(/[^0-9.-]/g, ''));
    const curr = parseFloat(value.replace(/[^0-9.-]/g, ''));
    const dir  = curr > prev ? 'up' : curr < prev ? 'down' : null;
    prevRef.current = value;
    if (dir && mountedRef.current) {
      setFlash(dir);
      setTimeout(() => { if (mountedRef.current) setFlash(null); }, 500);
    }
  }, [value]);

  const wrapStyle = useMemo(() => ({
    display:      'inline-block',
    borderRadius: 2,
    animation:    flash === 'up'   ? 'zm-flash-up 500ms ease-out'
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
            display:       'inline-block',
            fontFamily:    'var(--zm-font-data)',
            fontSize:      20,
            fontWeight:    700,
            color:         'var(--zm-text-1)',
            letterSpacing: '-0.03em',
            lineHeight:    1.1,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
});
AnimatedValue.displayName = 'AnimatedValue';

const MetricCard = memo(({ label, value, change, icon: Icon, accentColor, loading = false, subtitle }: MetricCardProps) => {

  if (loading) return (
    <div style={{
      background: 'var(--zm-card-bg)',
      border: '1px solid var(--zm-card-border)',
      borderRadius: 'var(--zm-card-radius)',
      padding: 10, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 72,
    }}>
      <Skeleton width={55} height={8} />
      <Skeleton width="55%" height={22} borderRadius={2} />
      <Skeleton width={40} height={8} />
    </div>
  );

  const changeColor = change !== undefined
    ? change >= 0 ? 'var(--zm-positive)' : 'var(--zm-negative)'
    : undefined;

  const changeStr = change !== undefined
    ? (change >= 0 ? '+' : '') + change.toFixed(2) + '%'
    : undefined;

  const accent = accentColor ?? 'var(--zm-blue)';

  return (
    <motion.div
      className="zm-card"
      style={{
        padding:       10,
        display:       'flex',
        flexDirection: 'column' as const,
        gap:           4,
        minHeight:     72,
        position:      'relative' as const,
        overflow:      'hidden',
      }}
      whileHover={{ y: -1 }}
      transition={TRANSITION.fast}
    >
      {/* Accent top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: accent, opacity: 0.5,
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily:    'var(--zm-font-data)',
          fontSize:      8.5,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.12em',
          color:         'var(--zm-text-3)',
          fontWeight:    500,
        }}>
          {label}
        </span>
        {Icon && <Icon size={11} style={{ color: 'var(--zm-text-4)', flexShrink: 0 }} />}
      </div>

      {/* Value */}
      <AnimatedValue value={value} />

      {/* Change */}
      {changeStr && (
        <span style={{
          fontFamily:  'var(--zm-font-data)',
          fontSize:    10,
          fontWeight:  600,
          color:       changeColor,
          letterSpacing: '-0.01em',
        }}>
          {changeStr}
        </span>
      )}

      {subtitle && (
        <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 8.5, color: 'var(--zm-text-3)' }}>
          {subtitle}
        </span>
      )}
    </motion.div>
  );
});

MetricCard.displayName = 'MetricCard';
export default MetricCard;
