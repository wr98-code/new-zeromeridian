/**
 * GlobalStatsBar.tsx — ZERØ MERIDIAN v30
 * Top stats bar — fully CSS variable based, WS status indicator
 */

import { memo, useMemo } from 'react';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { useCrypto } from '@/contexts/CryptoContext';
import { formatCompact } from '@/lib/formatters';

const Divider = memo(() => (
  <div style={{ width: 1, height: 12, background: 'var(--zm-divider)', flexShrink: 0 }} />
));
Divider.displayName = 'Divider';

interface StatProps {
  label: string;
  value: string;
  change?: number;
}

const Stat = memo(({ label, value, change }: StatProps) => {
  const changeColor = change != null
    ? change >= 0 ? 'var(--zm-green)' : 'var(--zm-red)'
    : undefined;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      <span style={{
        fontFamily: 'var(--zm-font-data)',
        fontSize: 'var(--zm-text-2xs)',
        color: 'var(--zm-text-3)',
        letterSpacing: '0.04em',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--zm-font-data)',
        fontSize: 'var(--zm-text-xs)',
        fontWeight: 600,
        color: 'var(--zm-text-1)',
      }}>
        {value}
      </span>
      {change != null && (
        <span style={{
          fontFamily: 'var(--zm-font-data)',
          fontSize: 'var(--zm-text-2xs)',
          color: changeColor,
        }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
    </div>
  );
});
Stat.displayName = 'Stat';

const FearGreed = memo(({ value, label }: { value: number; label: string }) => {
  const color = value <= 25 ? 'var(--zm-red)'
    : value <= 45 ? 'var(--zm-amber)'
    : value <= 55 ? 'var(--zm-text-2)'
    : value <= 75 ? 'var(--zm-green)'
    : 'var(--zm-blue)';
  const bg = value <= 25 ? 'var(--zm-red-bg)'
    : value <= 45 ? 'var(--zm-amber-bg)'
    : value <= 55 ? 'var(--zm-surface)'
    : value <= 75 ? 'var(--zm-green-bg)'
    : 'var(--zm-blue-bg)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 'var(--zm-text-2xs)', color: 'var(--zm-text-3)' }}>
        F&G
      </span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '1px 6px', borderRadius: 4, background: bg,
      }}>
        <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 'var(--zm-text-xs)', fontWeight: 700, color }}>
          {value}
        </span>
        <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 'var(--zm-text-2xs)', color }}>
          {label}
        </span>
      </div>
    </div>
  );
});
FearGreed.displayName = 'FearGreed';

const WSStatus = memo(({ status }: { status: 'connected' | 'disconnected' | 'reconnecting' }) => {
  const color = status === 'connected' ? 'var(--zm-green)'
    : status === 'reconnecting' ? 'var(--zm-amber)'
    : 'var(--zm-red)';
  const label = status === 'connected' ? 'LIVE'
    : status === 'reconnecting' ? 'RECONNECTING'
    : 'OFFLINE';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%',
        background: color,
        boxShadow: status === 'connected' ? `0 0 6px ${color}` : 'none',
        animation: status === 'reconnecting' ? 'zm-pulse 1s ease-in-out infinite' : 'none',
      }} />
      <span style={{
        fontFamily: 'var(--zm-font-data)',
        fontSize: 'var(--zm-text-2xs)',
        fontWeight: 700,
        color,
        letterSpacing: '0.08em',
      }}>
        {label}
      </span>
    </div>
  );
});
WSStatus.displayName = 'WSStatus';

const GlobalStatsBar = memo(() => {
  const stats = useGlobalStats();
  const { fearGreed, wsStatus } = useCrypto();

  const barStyle = useMemo(() => ({
    position:    'fixed' as const,
    top:         0, left: 0, right: 0,
    zIndex:      200,
    height:      28,
    background:  'var(--zm-sidebar-bg)',
    borderBottom: '1px solid var(--zm-border)',
    display:     'flex',
    alignItems:  'center',
    paddingLeft: 16,
    paddingRight: 16,
    gap:         12,
    overflowX:   'auto' as const,
    scrollbarWidth: 'none' as const,
  }), []);

  return (
    <div style={barStyle} aria-label="Global market stats bar">
      <WSStatus status={wsStatus} />
      <Divider />

      {stats.totalMcap > 0 && (
        <>
          <Stat label="MCAP" value={formatCompact(stats.totalMcap)} change={stats.mcapChange24h} />
          <Divider />
        </>
      )}
      {stats.totalVolume > 0 && (
        <>
          <Stat label="VOL" value={formatCompact(stats.totalVolume)} />
          <Divider />
        </>
      )}
      {stats.btcDominance > 0 && (
        <>
          <Stat label="BTC.D" value={stats.btcDominance.toFixed(1) + '%'} />
          <Divider />
        </>
      )}
      {fearGreed.value > 0 && (
        <>
          <FearGreed value={fearGreed.value} label={fearGreed.label} />
          <Divider />
        </>
      )}

      {/* Right side */}
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'var(--zm-font-data)',
          fontSize: 'var(--zm-text-2xs)',
          color: 'var(--zm-text-4)',
          letterSpacing: '0.1em',
        }}>
          ZERØ MERIDIAN
        </span>
      </div>
    </div>
  );
});

GlobalStatsBar.displayName = 'GlobalStatsBar';
export default GlobalStatsBar;
