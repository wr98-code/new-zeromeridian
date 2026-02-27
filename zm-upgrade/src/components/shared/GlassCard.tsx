/**
 * GlassCard.tsx — ZERØ MERIDIAN v30
 * Bloomberg-grade glass card — CSS variables, section header support
 */

import { memo, type ReactNode, type CSSProperties, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HOVER, TAP, TRANSITION } from '@/lib/motion';

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
  accentColor, padding = 16,
  title, subtitle, badge, action,
}: GlassCardProps) => {

  const cardStyle = useMemo((): CSSProperties => ({
    background:          'var(--zm-card-bg)',
    border:              '1px solid var(--zm-card-border)',
    borderRadius:        'var(--zm-card-radius)',
    overflow:            'hidden',
    position:            'relative',
    willChange:          'transform',
    transition:          'border-color 120ms ease, box-shadow 120ms ease',
    ...style,
  }), [style]);

  const headerStyle = useMemo(() => ({
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '10px 14px 8px',
    borderBottom:   '1px solid var(--zm-divider)',
  }), []);

  const accentLineStyle = useMemo(() => ({
    position:   'absolute' as const,
    top: 0, left: 0, right: 0,
    height:     1,
    background: `linear-gradient(90deg, transparent, ${accentColor ?? 'var(--zm-blue)'}, transparent)`,
    opacity:    0.5,
  }), [accentColor]);

  const bodyStyle = useMemo(() => ({
    padding: typeof padding === 'number' ? `${padding}px` : padding,
  }), [padding]);

  return (
    <motion.div
      style={cardStyle}
      onClick={onClick}
      whileHover={hoverable ? { borderColor: 'var(--zm-border-hover)', boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(79,127,255,0.08)' } : undefined}
      whileTap={pressable ? TAP.press : undefined}
      transition={TRANSITION.fast}
    >
      {accentColor && <div style={accentLineStyle} />}

      {title && (
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily:    'var(--zm-font-data)',
              fontSize:      'var(--zm-text-2xs)',
              fontWeight:    700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              color:         'var(--zm-text-2)',
            }}>
              {title}
            </span>
            {badge && (
              <span style={{
                fontFamily:    'var(--zm-font-data)',
                fontSize:      8,
                fontWeight:    700,
                letterSpacing: '0.08em',
                padding:       '1px 5px',
                borderRadius:  3,
                background:    'var(--zm-green-bg)',
                border:        '1px solid var(--zm-green-border)',
                color:         'var(--zm-green)',
              }}>
                {badge}
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
          </div>
          {action}
        </div>
      )}

      <div style={bodyStyle}>
        {children}
      </div>
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';
export default GlassCard;
