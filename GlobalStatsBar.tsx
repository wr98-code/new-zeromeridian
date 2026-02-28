/**
 * GlobalStatsBar.tsx — ZERØ MERIDIAN push93
 * 26px height — ultra compact Bloomberg stats strip
 * ZERO className | var(--zm-*) | React.memo | useMemo
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { useCrypto } from '@/contexts/CryptoContext';
import { formatCompact } from '@/lib/formatters';

const Pipe = memo(() => (
  <div style={{ width: 1, height: 9, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
));
Pipe.displayName = 'Pipe';

const Stat = memo(({ label, value, change }: { label: string; value: string; change?: number }) => {
  const pos = (change ?? 0) >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, color: 'var(--zm-text-3)', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 10, fontWeight: 700, color: 'var(--zm-text-1)', letterSpacing: '-0.01em' }}>
        {value}
      </span>
      {change != null && (
        <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, fontWeight: 600, color: pos ? 'var(--zm-positive)' : 'var(--zm-negative)' }}>
          {pos ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
    </div>
  );
});
Stat.displayName = 'Stat';

const FGBadge = memo(({ value, label }: { value: number; label: string }) => {
  const color = value <= 20 ? 'var(--zm-negative)' : value <= 40 ? 'var(--zm-orange)' : value <= 60 ? 'var(--zm-amber)' : value <= 80 ? 'var(--zm-positive)' : 'var(--zm-cyan)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, color: 'var(--zm-text-3)', letterSpacing: '0.08em' }}>F&amp;G</span>
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 10, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, color, opacity: 0.8 }}>{label}</span>
    </div>
  );
});
FGBadge.displayName = 'FGBadge';

const WSStatus = memo(({ status }: { status: string }) => {
  const live  = status === 'connected';
  const color = live ? 'var(--zm-positive)' : status === 'connecting' || status === 'reconnecting' ? 'var(--zm-amber)' : 'var(--zm-negative)';
  const label = live ? 'LIVE' : status === 'connecting' ? 'CONN' : status === 'reconnecting' ? 'RECONN' : 'OFFLINE';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <motion.div
        style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }}
        animate={live ? { opacity: [1, 0.3, 1] } : {}}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, fontWeight: 700, color, letterSpacing: '0.1em' }}>{label}</span>
    </div>
  );
});
WSStatus.displayName = 'WSStatus';

const GlobalStatsBar = memo(() => {
  const stats = useGlobalStats();
  const { fearGreed, wsStatus } = useCrypto();

  const barS = useMemo(() => ({
    position: 'fixed' as const,
    top: 0, left: 0, right: 0,
    zIndex: 200,
    height: 26,
    background: 'rgba(10,13,18,0.99)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    gap: 8,
    overflowX: 'auto' as const,
    scrollbarWidth: 'none' as const,
  }), []);

  return (
    <div style={barS} aria-label="Global market stats bar">
      <WSStatus status={wsStatus} />
      <Pipe />
      {stats.totalMcap > 0 && <><Stat label="MCAP" value={formatCompact(stats.totalMcap)} change={stats.mcapChange24h} /><Pipe /></>}
      {stats.totalVolume > 0 && <><Stat label="VOL" value={formatCompact(stats.totalVolume)} /><Pipe /></>}
      {stats.btcDominance > 0 && <><Stat label="BTC.D" value={stats.btcDominance.toFixed(1) + '%'} /><Pipe /></>}
      {stats.ethDominance > 0 && <><Stat label="ETH.D" value={stats.ethDominance.toFixed(1) + '%'} /><Pipe /></>}
      {fearGreed.value > 0 && <><FGBadge value={fearGreed.value} label={fearGreed.label} /></>}
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 8, color: 'var(--zm-text-4)', letterSpacing: '0.18em', flexShrink: 0 }}>
        ZERØ MERIDIAN
      </span>
    </div>
  );
});

GlobalStatsBar.displayName = 'GlobalStatsBar';
export default GlobalStatsBar;
