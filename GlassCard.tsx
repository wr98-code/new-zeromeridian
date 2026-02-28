/**
 * GlassCard.tsx — ZERØ MERIDIAN push93
 * 4px radius, border subtle, padding compact — Bloomberg terminal card
 * ZERO className | var(--zm-*) | React.memo | useMemo
 */

import { memo, type ReactNode, type CSSProperties, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TRANSITION } from '@/lib/motion';

interface GlassCardProps {
  children:     ReactNode;
  style?:       CSSProperties;
  onClick?:     () => void;
  hoverable?:   boolean;
  pressable?:   boolean;
  accentColor?: string;
  padding?:     string | number;
  title?:       string;
  subtitle?:    string;
  badge?:       string;
  action?:      ReactNode;
}

const GlassCard = memo(({
  children, style, onClick,
  hoverable = true, pressable = false,
  accentColor, padding = 12,
  title, subtitle, badge, action,
}: GlassCardProps) => {

  const cardStyle = useMemo((): CSSProperties => ({
    background:    'var(--zm-card-bg)',
    border:        '1px solid var(--zm-card-border)',
    borderRadius:  'var(--zm-card-radius)',
    overflow:      'hidden',
    position:      'relative',
    willChange:    'transform',
    transition:    'border-color 100ms ease',
    ...style,
  }), [style]);

  const headerStyle = useMemo(() => ({
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '7px 10px 6px',
    borderBottom:   '1px solid var(--zm-divider)',
  }), []);

  const accentLineStyle = useMemo(() => ({
    position:   'absolute' as const,
    top: 0, left: 0, right: 0,
    height:     1,
    background: `linear-gradient(90deg, transparent, ${accentColor ?? 'rgba(0,238,255,0.6)'}, transparent)`,
    opacity:    0.5,
  }), [accentColor]);

  const bodyStyle = useMemo(() => ({
    padding: typeof padding === 'number' ? `${padding}px` : padding,
  }), [padding]);

  return (
    <motion.div
      style={cardStyle}
      onClick={onClick}
      whileHover={hoverable ? { borderColor: 'var(--zm-card-border-hover)' } : undefined}
      whileTap={pressable ? { scale: 0.99 } : undefined}
      transition={TRANSITION.fast}
    >
      {accentColor && <div style={accentLineStyle} />}

      {title && (
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily:    'var(--zm-font-data)',
              fontSize:      9,
              fontWeight:    700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.12em',
              color:         'var(--zm-text-3)',
            }}>
              {title}
            </span>
            {badge && (
              <span style={{
                fontFamily:    'var(--zm-font-data)', fontSize: 7, fontWeight: 700,
                letterSpacing: '0.08em', padding: '1px 4px', borderRadius: 2,
                background:    'var(--zm-green-bg)', border: '1px solid var(--zm-green-border)',
                color:         'var(--zm-green)',
              }}>{badge}</span>
            )}
            {subtitle && (
              <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 8.5, color: 'var(--zm-text-3)' }}>
                {subtitle}
              </span>
            )}
          </div>
          {action}
        </div>
      )}

      <div style={bodyStyle}>{children}</div>
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';
export default GlassCard;
