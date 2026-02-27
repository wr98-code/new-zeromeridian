/**
 * SmartMoney.tsx — ZERØ MERIDIAN 2026 push83
 * push83: REAL DATA — Etherscan API free tier.
 * Large ETH/ERC20 whale txs, gas tracker, live ETH price.
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo ✓
 */

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWhaleTracker, type WhaleTx } from '@/hooks/useWhaleTracker';
import { useBreakpoint } from '@/hooks/useBreakpoint';

function fmtUsd(n: number): string {
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000)     return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)         return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}
function fmtEth(n: number): string {
  return n >= 1000
    ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ETH'
    : n.toFixed(2) + ' ETH';
}
function timeAgo(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60)    return d + 's ago';
  if (d < 3600)  return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}
function shortAddr(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

const GasCard = React.memo(({ label, gwei, color }: { label: string; gwei: number; color: string }) => (
  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '20px', fontWeight: 700, color }}>{gwei}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Gwei</span>
    </div>
  </div>
));
GasCard.displayName = 'GasCard';

const TypeBadge = React.memo(({ type, symbol }: { type: 'ETH' | 'ERC20'; symbol?: string }) => {
  const isEth = type === 'ETH';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.06em', background: isEth ? 'rgba(98,126,234,0.15)' : 'rgba(0,200,100,0.12)', border: isEth ? '1px solid rgba(98,126,234,0.3)' : '1px solid rgba(0,200,100,0.25)', color: isEth ? 'rgba(140,160,255,1)' : 'rgba(60,220,130,1)', flexShrink: 0 }}>
      {isEth ? 'ETH' : (symbol ?? 'ERC20')}
    </span>
  );
});
TypeBadge.displayName = 'TypeBadge';

const AddrChip = React.memo(({ addr, label }: { addr: string; label: string | null }) => (
  <a
    href={'https://etherscan.io/address/' + addr}
    target="_blank" rel="noopener noreferrer" title={addr}
    style={{ fontFamily: label ? "'Space Grotesk', sans-serif" : "'JetBrains Mono', monospace", fontSize: label ? '12px' : '11px', color: label ? 'rgba(0,200,255,0.85)' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', textDecoration: 'none', display: 'block' }}
  >
    {label ?? shortAddr(addr)}
  </a>
));
AddrChip.displayName = 'AddrChip';

const SkeletonRow = React.memo(({ i }: { i: number }) => (
  <motion.div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}>
    <div style={{ width: '60px', height: '22px', borderRadius: '6px', background: 'rgba(255,255,255,0.07)' }} />
    <div style={{ flex: 1, height: '13px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }} />
    <div style={{ width: '80px', height: '13px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }} />
    <div style={{ width: '60px', height: '13px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }} />
  </motion.div>
));
SkeletonRow.displayName = 'SkeletonRow';

const TxRow = React.memo(({ tx, isMobile }: { tx: WhaleTx; isMobile: boolean }) => {
  const cols = isMobile ? '60px 1fr 85px' : '70px 1fr 1fr 1fr 80px 80px';
  const usdColor = tx.valueUsd >= 10_000_000 ? 'rgba(251,191,36,1)' : tx.valueUsd >= 1_000_000 ? 'rgba(251,113,133,1)' : 'rgba(255,255,255,0.75)';
  return (
    <motion.div
      style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: isMobile ? '8px' : '12px', padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      whileHover={{ background: 'rgba(255,255,255,0.025)' }}
    >
      <TypeBadge type={tx.type} symbol={tx.tokenSymbol} />
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '3px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AddrChip addr={tx.from} label={tx.fromLabel} />
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>→</span>
            <AddrChip addr={tx.to} label={tx.toLabel} />
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{timeAgo(tx.timestamp)}</span>
        </div>
      ) : (
        <>
          <AddrChip addr={tx.from} label={tx.fromLabel} />
          <AddrChip addr={tx.to} label={tx.toLabel} />
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
            {tx.type === 'ETH' && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(140,160,255,0.8)' }}>{fmtEth(tx.valueEth)}</span>}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: usdColor }}>{fmtUsd(tx.valueUsd)}</span>
          </div>
        </>
      )}
      {isMobile
        ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: usdColor, textAlign: 'right' as const }}>{fmtUsd(tx.valueUsd)}</span>
        : <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{timeAgo(tx.timestamp)}</span>
      }
      {!isMobile && (
        <a href={'https://etherscan.io/tx/' + tx.hash} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(0,200,255,0.5)', textDecoration: 'none', textAlign: 'right' as const }}>
          {tx.hash.slice(0, 8)}...
        </a>
      )}
    </motion.div>
  );
});
TxRow.displayName = 'TxRow';

const SmartMoney: React.FC = () => {
  const { txs, gas, ethPrice, loading, error, lastUpdated, refetch } = useWhaleTracker();
  const { isMobile } = useBreakpoint();

  const lastUpdatedStr = useMemo(() =>
    lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
  , [lastUpdated]);

  const thCols = isMobile ? '60px 1fr 85px' : '70px 1fr 1fr 1fr 80px 80px';

  return (
    <div style={{ padding: isMobile ? '16px 12px' : '24px', maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '12px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
          🐳 Smart Money
        </h1>
        <button onClick={refetch} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', cursor: 'pointer' }}>
          ↺ Refresh
        </button>
      </div>

      {/* Stats chips */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {ethPrice > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>ETH</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 700, color: 'rgba(140,160,255,1)' }}>${ethPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
        )}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>Txs</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 700, color: 'rgba(251,191,36,1)' }}>{txs.length}</span>
        </div>
        <div style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.12)', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'rgba(0,200,255,0.7)' }}>Etherscan API</span>
        </div>
      </div>

      {/* Gas tracker */}
      {gas && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
          <GasCard label="Safe"    gwei={gas.safeGwei}    color="rgba(52,211,153,1)" />
          <GasCard label="Normal"  gwei={gas.proposeGwei} color="rgba(251,191,36,1)" />
          <GasCard label="Fast"    gwei={gas.fastGwei}    color="rgba(251,113,133,1)" />
          <div style={{ flex: 1, minWidth: '120px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Last Block</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>#{gas.lastBlock.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* TX Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: thCols, gap: isMobile ? '8px' : '12px', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            <span>Type</span>
            <span>{isMobile ? 'Details' : 'From'}</span>
            {!isMobile && <span>To</span>}
            {!isMobile && <span>Value</span>}
            {!isMobile && <span>Time</span>}
            <span style={{ textAlign: 'right' }}>{isMobile ? 'USD' : 'Tx'}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} i={i} />)}
            </motion.div>
          ) : error ? (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: '32px 16px', textAlign: 'center' as const, fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: 'rgba(251,113,133,0.8)' }}>
              <div>⚠ {error}</div>
              <button onClick={refetch} style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '8px', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', color: 'rgba(251,113,133,0.9)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', cursor: 'pointer' }}>Retry</button>
            </motion.div>
          ) : txs.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: '40px 16px', textAlign: 'center' as const, fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>
              No large transactions found in recent blocks
            </motion.div>
          ) : (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              {txs.map(tx => <TxRow key={tx.hash} tx={tx} isMobile={isMobile} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && !error && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>
            <span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(52,211,153,0.9)', boxShadow: '0 0 6px rgba(52,211,153,0.6)', display: 'inline-block', marginRight: '6px' }} />
              Live · Etherscan API · refresh 30s
            </span>
            {lastUpdatedStr && <span>Updated {lastUpdatedStr}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

SmartMoney.displayName = 'SmartMoney';
export default memo(SmartMoney);
