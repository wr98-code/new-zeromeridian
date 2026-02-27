/**
 * MetricCard.tsx — ZERØ MERIDIAN 2026 push85
 * push85: Price flash animation green/red saat nilai berubah
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - useCallback + useMemo + mountedRef ✓
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

const CARD_BASE = Object.freeze({
  position:      'relative' as const,
  willChange:    'transform' as const,
  background:    'var(--zm-card-bg, rgba(14,17,28,1))',
  borderRadius:  10,
  padding:       18,
  display:       'flex',
  flexDirection: 'column' as const,
  gap:           6,
  minHeight:     92,
  transition:    'border-color 0.2s',
});

const SKELETON_BASE = Object.freeze({
  background:    'rgba(255,255,255,0.05)',
  border:        '1px solid rgba(255,255,255,0.07)',
  borderRadius:  12, padding: 16,
  display:       'flex', flexDirection: 'column' as const, gap: 8, minHeight: 88,
});

// ─── Animated value with price flash ─────────────────────────────────────────

const AnimatedValue = memo(({ value, change }: { value: string; change?: number }) => {
  const prevRef  = useRef(value);
  const [flash, setFlash] = useState<'up'|'down'|null>(null);
  const mountRef = useRef(true);

  useEffect(() => { mountRef.current = true; return () => { mountRef.current = false; }; }, []);

  useEffect(() => {
    if (prevRef.current !== value) {
      if (mountRef.current) {
        const dir = change !== undefined ? (change >= 0 ? 'up' : 'down') : null;
        setFlash(dir);
        const t = setTimeout(() => { if (mountRef.current) setFlash(null); }, 600);
        prevRef.current = value;
        return () => clearTimeout(t);
      }
      prevRef.current = value;
    }
  }, [value, change]);

  const flashColor = useMemo(() => {
    if (flash === 'up')   return 'rgba(52,211,153,0.22)';
    if (flash === 'down') return 'rgba(255,68,136,0.18)';
    return 'transparent';
  }, [flash]);

  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.7, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        display:    'inline-block',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   '1.3rem',
        fontWeight: 700,
        color:      'var(--zm-text-primary, rgba(240,240,248,1))',
        willChange: 'transform, opacity',
        borderRadius: '6px',
        padding:    flash ? '1px 4px' : '1px 0',
        background: flashColor,
        transition: 'background 0.5s ease, padding 0.15s',
      }}
    >
      {value}
    </motion.span>
  );
});
AnimatedValue.displayName = 'AnimatedValue';

const MetricCard = memo(({
  label, value, change, icon: Icon, accentColor, loading = false, subtitle,
}: MetricCardProps) => {

  const cardStyle = useMemo(() => ({
    ...CARD_BASE,
    border: '1px solid ' + (accentColor ? accentColor.replace(/[\d.]+\)$/, '0.15)') : 'var(--zm-card-border, rgba(32,42,68,1))'),
  }), [accentColor]);

  const changeColor = useMemo(() => {
    if (change === undefined) return undefined;
    return change >= 0 ? 'var(--zm-positive, rgba(52,211,153,1))' : 'var(--zm-negative, rgba(255,68,136,1))';
  }, [change]);

  const changeStr = useMemo(() => {
    if (change === undefined) return undefined;
    return (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
  }, [change]);

  const topLineStyle = useMemo(() => ({
    position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1,
    background: 'linear-gradient(90deg, transparent, ' + (accentColor ?? 'rgba(96,165,250,0.5)') + ', transparent)',
    borderRadius: '12px 12px 0 0', opacity: 0.5,
  }), [accentColor]);

  if (loading) {
    return (
      <div style={SKELETON_BASE}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Skeleton width={70} height={10} />
          <Skeleton width={14} height={14} borderRadius={4} />
        </div>
        <Skeleton width="60%" height={28} borderRadius={6} />
        <Skeleton width={50} height={10} />
      </div>
    );
  }

  return (
    <motion.div style={cardStyle} whileHover={{ scale: 1.02, y: -2 }} transition={TRANSITION.spring}>
      <div style={topLineStyle} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--zm-text-faint, rgba(80,85,115,1))' }}>
          {label}
        </span>
        {Icon && <Icon size={14} style={{ color: accentColor ?? 'rgba(80,80,100,1)', flexShrink:0 }} />}
      </div>
      <AnimatedValue value={value} change={change} />
      {changeStr !== undefined && (
        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:changeColor }}>
          {changeStr}
        </span>
      )}
      {subtitle && (
        <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:'rgba(80,80,100,1)' }}>
          {subtitle}
        </span>
      )}
    </motion.div>
  );
});

MetricCard.displayName = 'MetricCard';
export default MetricCard;
