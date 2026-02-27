/**
 * Tokens.tsx — ZERØ MERIDIAN 2026 push82
 * push82: REAL DATA — CoinGecko free public API. No API key required.
 * Trending (top 15 searched 24h), Top Gainers, Top Losers from top 100 mcap.
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo ✓
 * - Object.freeze() all static data ✓
 */

import React, { memo, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrendingTokens, type TrendingToken } from '@/hooks/useTrendingTokens';
import { formatCompact } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const TABS = Object.freeze(['Trending', 'Gainers', 'Losers'] as const);
type Tab = typeof TABS[number];

const PctCell = React.memo(({ value }: { value: number }) => {
  const isPos = value >= 0;
  const style = useMemo(() => Object.freeze({
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', monospace",
    color: isPos ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)',
    fontWeight: 600,
    textAlign: 'right' as const,
  }), [isPos]);
  return <span style={style}>{isPos ? '+' : ''}{value.toFixed(2)}%</span>;
});
PctCell.displayName = 'PctCell';

const RankBadge = React.memo(({ rank }: { rank: number }) => {
  const style = useMemo(() => Object.freeze({
    width: '26px', height: '26px', borderRadius: '50%',
    background: rank <= 3 ? 'rgba(0,200,255,0.12)' : 'rgba(255,255,255,0.05)',
    border: rank <= 3 ? '1px solid rgba(0,200,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
    color: rank <= 3 ? 'rgba(0,200,255,0.9)' : 'rgba(255,255,255,0.4)',
    fontWeight: 700, flexShrink: 0,
  }), [rank]);
  return <div style={style}>{rank}</div>;
});
RankBadge.displayName = 'RankBadge';

const TokenRow = React.memo(({ token, rank, isMobile }: {
  token: TrendingToken; rank: number; isMobile: boolean;
}) => {
  const rowStyle = useMemo(() => Object.freeze({
    display: 'grid',
    gridTemplateColumns: isMobile ? '26px 36px 1fr 70px 70px' : '26px 36px 1fr 100px 80px 80px 90px',
    alignItems: 'center',
    gap: isMobile ? '8px' : '12px',
    padding: '11px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  }), [isMobile]);

  const thumbStyle = useMemo(() => Object.freeze({
    width: '28px', height: '28px', borderRadius: '50%',
    objectFit: 'cover' as const, background: 'rgba(255,255,255,0.05)',
  }), []);

  const priceStr = useMemo(() => {
    if (token.price < 0.001) return '$' + token.price.toFixed(8);
    if (token.price < 0.01)  return '$' + token.price.toFixed(6);
    if (token.price < 1)     return '$' + token.price.toFixed(4);
    return '$' + token.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [token.price]);

  return (
    <motion.div style={rowStyle} whileHover={{ background: 'rgba(255,255,255,0.025)' }}>
      <RankBadge rank={rank} />
      {token.thumb
        ? <img src={token.thumb} alt={token.symbol} style={thumbStyle} loading="lazy" />
        : <div style={{ ...thumbStyle, borderRadius: '50%' }} />
      }
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px', minWidth: 0 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{token.symbol}</span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{token.name}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.8)', textAlign: 'right' as const }}>{priceStr}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PctCell value={token.priceChange24h} />
      </div>
      {!isMobile && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PctCell value={token.priceChange7d} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.35)', textAlign: 'right' as const }}>{formatCompact(token.volume24h)}</span>
          </div>
        </>
      )}
    </motion.div>
  );
});
TokenRow.displayName = 'TokenRow';

const TableHeader = React.memo(({ isMobile }: { isMobile: boolean }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: isMobile ? '26px 36px 1fr 70px 70px' : '26px 36px 1fr 100px 80px 80px 90px',
    gap: isMobile ? '8px' : '12px',
    padding: '8px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px', color: 'rgba(255,255,255,0.25)',
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
  }}>
    <span>#</span><span />
    <span>Token</span>
    <span style={{ textAlign: 'right' }}>Price</span>
    <span style={{ textAlign: 'right' }}>24h</span>
    {!isMobile && <span style={{ textAlign: 'right' }}>7d</span>}
    {!isMobile && <span style={{ textAlign: 'right' }}>Volume</span>}
  </div>
));
TableHeader.displayName = 'TableHeader';

const SkeletonRow = React.memo(({ i }: { i: number }) => (
  <motion.div
    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    animate={{ opacity: [0.3, 0.6, 0.3] }}
    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.06 }}
  >
    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
      <div style={{ width: '55px', height: '13px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)' }} />
      <div style={{ width: '95px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)' }} />
    </div>
    <div style={{ width: '75px', height: '13px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)' }} />
    <div style={{ width: '55px', height: '13px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)' }} />
  </motion.div>
));
SkeletonRow.displayName = 'SkeletonRow';

const TabBtn = React.memo(({ label, active, onClick }: { label: Tab; active: boolean; onClick: (t: Tab) => void }) => {
  const style = useMemo(() => Object.freeze({
    padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px',
    fontWeight: active ? 600 : 400,
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
    transition: 'all 0.15s', letterSpacing: '0.04em',
  }), [active]);
  const handleClick = useCallback(() => onClick(label), [label, onClick]);
  return <button style={style} onClick={handleClick}>{label}</button>;
});
TabBtn.displayName = 'TabBtn';

const Tokens: React.FC = () => {
  const { trending, gainers, losers, loading, error, lastUpdated, refetch } = useTrendingTokens();
  const { isMobile } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<Tab>('Trending');

  const handleTab = useCallback((tab: Tab) => setActiveTab(tab), []);

  const activeList = useMemo(() => {
    if (activeTab === 'Trending') return trending;
    if (activeTab === 'Gainers')  return gainers;
    return losers;
  }, [activeTab, trending, gainers, losers]);

  const lastUpdatedStr = useMemo(() => {
    if (!lastUpdated) return '';
    return new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [lastUpdated]);

  return (
    <div style={{ padding: isMobile ? '16px 0' : '24px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px 16px' : '0 0 20px', flexWrap: 'wrap' as const, gap: '12px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
          Token Discovery
        </h1>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '3px' }}>
          {TABS.map(tab => <TabBtn key={tab} label={tab} active={activeTab === tab} onClick={handleTab} />)}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
        {!loading && !error && <TableHeader isMobile={isMobile} />}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {Array.from({ length: 12 }, (_, i) => <SkeletonRow key={i} i={i} />)}
            </motion.div>
          ) : error ? (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: '32px 16px', textAlign: 'center' as const, fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: 'rgba(251,113,133,0.8)' }}>
              <div>⚠ {error}</div>
              <button onClick={refetch} style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '8px', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', color: 'rgba(251,113,133,0.9)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', cursor: 'pointer' }}>
                Retry
              </button>
            </motion.div>
          ) : (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              {activeList.map((token, i) => <TokenRow key={token.id} token={token} rank={i + 1} isMobile={isMobile} />)}
            </motion.div>
          )}
        </AnimatePresence>
        {!loading && !error && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>
            <span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(52,211,153,0.8)', boxShadow: '0 0 6px rgba(52,211,153,0.5)', display: 'inline-block', marginRight: '6px' }} />
              Live · CoinGecko API · refresh 60s
            </span>
            {lastUpdatedStr && <span>Updated {lastUpdatedStr}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

Tokens.displayName = 'Tokens';
export default memo(Tokens);
