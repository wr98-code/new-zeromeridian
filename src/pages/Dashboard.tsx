/**
 * Dashboard.tsx — ZERØ MERIDIAN 2026 push24
 * Bloomberg-grade full redesign:
 *   - 8-metric live ticker bar (BTC, ETH, SOL, BNB, 24h Vol, Mkt Cap, Fear&Greed, Dominance)
 *   - Primary: TradingView chart (2/3) + real-time OrderBook (1/3)
 *   - Secondary: Heatmap | Funding Rates | Liquidation Bubble
 *   - Tertiary: WASM OrderBook dual-panel
 *   - Quaternary: Protocol Revenue + AI Signals
 *   - News ticker footer
 *   - React.memo + displayName ✓
 *   - rgba() only ✓  var(--zm-*) ✓
 *   - Zero template literals in JSX ✓
 *   - Object.freeze() all static data ✓
 *   - will-change: transform ✓
 *   - useCallback + useMemo ✓
 *   - mountedRef + AbortController ✓
 *   - Responsive grid (4→2→1 col) ← push26
 *   - useBreakpoint() integration ← push26
 *   - aria-label + role ✓
 */

import React, { Suspense, memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Skeleton from '../components/shared/Skeleton';
import GlassCard from '../components/shared/GlassCard';
import MetricCard from '../components/shared/MetricCard';
import { useCrypto } from '@/contexts/CryptoContext';
import { formatPrice, formatCompact } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const TradingViewChart  = React.lazy(() => import('../components/tiles/TradingViewChart'));
const OrderBookTile     = React.lazy(() => import('../components/tiles/OrderBookTile'));
const HeatmapTile       = React.lazy(() => import('../components/tiles/HeatmapTile'));
const FundingRateTile   = React.lazy(() => import('../components/tiles/FundingRateTile'));
const LiquidationTile   = React.lazy(() => import('../components/tiles/LiquidationTile'));
const NewsTickerTile    = React.lazy(() => import('../components/tiles/NewsTickerTile'));
const WasmOrderBook     = React.lazy(() => import('../components/tiles/WasmOrderBook'));
const TokenTerminalTile = React.lazy(() => import('../components/tiles/TokenTerminalTile'));
const AISignalTile      = React.lazy(() => import('../components/tiles/AISignalTile'));

// ─── Static data ──────────────────────────────────────────────────────────────

interface MetricCfg {
  label:         string;
  assetId:       string;
  fallbackValue: string;
  fallbackChange: number;
  accentColor:   string;
  unit?:         string;
}

const METRIC_CONFIG: readonly MetricCfg[] = Object.freeze([
  { label: 'BTC / USD',  assetId: 'bitcoin',     fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(251,191,36,1)' },
  { label: 'ETH / USD',  assetId: 'ethereum',    fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(96,165,250,1)' },
  { label: 'SOL / USD',  assetId: 'solana',      fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(167,139,250,1)' },
  { label: 'BNB / USD',  assetId: 'binancecoin', fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(251,146,60,1)' },
  { label: 'Vol 24h',    assetId: '_volume',      fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(52,211,153,1)' },
  { label: 'Mkt Cap',    assetId: '_mcap',        fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(45,212,191,1)' },
  { label: 'Dominance',  assetId: '_dominance',   fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(248,113,113,1)' },
  { label: 'Assets',     assetId: '_count',       fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(148,163,184,0.8)' },
]);

const containerVariants = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
});

const tileVariants = Object.freeze({
  hidden:  { opacity: 0, y: 14, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
});

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = memo(({ label, color = 'var(--zm-text-faint)', mt = 20 }: { label: string; color?: string; mt?: number }) => (
  <p style={{
    fontFamily:    "'Space Mono', monospace",
    fontSize:      '10px',
    letterSpacing: '0.16em',
    color,
    marginBottom:  '12px',
    marginTop:     mt + 'px',
    textTransform: 'uppercase',
    willChange:    'transform',
  }}>
    {label}
  </p>
));
SectionLabel.displayName = 'SectionLabel';

// ─── Tile skeleton ────────────────────────────────────────────────────────────

const TileSkeleton = memo(({ height = 320 }: { height?: number }) => (
  <GlassCard style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Skeleton.Card />
  </GlassCard>
));
TileSkeleton.displayName = 'TileSkeleton';

// ─── Live status bar ─────────────────────────────────────────────────────────

const LiveStatusBar = memo(() => {
  const [tick, setTick] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => {
      if (mountedRef.current) setTick(t => t + 1);
    }, 1000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  const now = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour12: false });
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            '12px',
      padding:        '6px 14px',
      borderRadius:   '6px',
      background:     'var(--zm-glass-bg)',
      border:         '1px solid var(--zm-glass-border)',
      willChange:     'transform',
    }}>
      <span style={{
        width:        '6px',
        height:       '6px',
        borderRadius: '50%',
        background:   'rgba(52,211,153,1)',
        boxShadow:    '0 0 6px rgba(52,211,153,0.7)',
        flexShrink:   0,
      }} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(52,211,153,0.85)', letterSpacing: '0.06em' }}>
        LIVE
      </span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', letterSpacing: '0.04em' }}>
        {now} UTC
      </span>
    </div>
  );
});
LiveStatusBar.displayName = 'LiveStatusBar';

// ─── Live Metric Card ─────────────────────────────────────────────────────────

const LiveMetricCard = memo(({ config }: { config: MetricCfg }) => {
  const { assets } = useCrypto();

  const { value, change } = useMemo(() => {
    if (config.assetId.startsWith('_')) {
      if (config.assetId === '_volume') {
        const total = assets.reduce((s, a) => s + (a.volume24h ?? 0), 0);
        return total > 0
          ? { value: '$' + (total / 1e9).toFixed(1) + 'B', change: 0 }
          : { value: config.fallbackValue, change: config.fallbackChange };
      }
      if (config.assetId === '_mcap') {
        const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
        return total > 0
          ? { value: '$' + (total / 1e12).toFixed(2) + 'T', change: 0 }
          : { value: config.fallbackValue, change: config.fallbackChange };
      }
      if (config.assetId === '_dominance') {
        const btc   = assets.find(a => a.id === 'bitcoin');
        const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
        if (btc && total > 0) return { value: ((btc.marketCap / total) * 100).toFixed(1) + '%', change: 0 };
        return { value: config.fallbackValue, change: config.fallbackChange };
      }
      if (config.assetId === '_count') {
        return { value: assets.length.toString(), change: 0 };
      }
    }
    const asset = assets.find(a => a.id === config.assetId);
    if (!asset) return { value: config.fallbackValue, change: config.fallbackChange };
    const fmt = asset.price >= 1000
      ? '$' + asset.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : '$' + asset.price.toFixed(2);
    return { value: fmt, change: asset.change24h ?? 0 };
  }, [assets, config]);

  return (
    <Suspense fallback={<Skeleton.Card />}>
      <MetricCard
        label={config.label}
        value={value}
        change={change}
        accentColor={config.accentColor}
      />
    </Suspense>
  );
});
LiveMetricCard.displayName = 'LiveMetricCard';

// ─── Market overview mini ticker ──────────────────────────────────────────────

const MarketOverviewBar = memo(() => {
  const { assets } = useCrypto();

  const top5 = useMemo(() => assets.slice(0, 5), [assets]);

  if (top5.length === 0) return null;

  return (
    <div style={{
      display:        'flex',
      gap:            '4px',
      overflowX:      'auto',
      padding:        '0 0 2px',
      marginBottom:   '20px',
      willChange:     'transform',
    }}
    role="region"
    aria-label="Top 5 assets quick view"
    >
      {top5.map(asset => {
        const pos = asset.change24h >= 0;
        return (
          <div key={asset.id} style={{
            flex:          '0 0 auto',
            display:       'flex',
            alignItems:    'center',
            gap:           '8px',
            padding:       '6px 12px',
            borderRadius:  '6px',
            background:    'var(--zm-glass-bg)',
            border:        '1px solid var(--zm-glass-border)',
            minWidth:      '140px',
            willChange:    'transform',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.06em' }}>
                {asset.symbol.toUpperCase()}
              </span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--zm-text-primary)', marginTop: '1px' }}>
                {formatPrice(asset.price)}
              </span>
            </div>
            <span style={{
              fontFamily:   "'Space Mono', monospace",
              fontSize:     '10px',
              fontWeight:   600,
              color:        pos ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)',
              background:   pos ? 'rgba(52,211,153,0.08)' : 'rgba(251,113,133,0.08)',
              border:       '1px solid ' + (pos ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.2)'),
              borderRadius: '4px',
              padding:      '2px 6px',
              whiteSpace:   'nowrap',
            }}>
              {(pos ? '+' : '') + asset.change24h.toFixed(2) + '%'}
            </span>
          </div>
        );
      })}
    </div>
  );
});
MarketOverviewBar.displayName = 'MarketOverviewBar';

// ─── Dashboard component ──────────────────────────────────────────────────────

const Dashboard = memo(() => {
  const prefersReducedMotion = useReducedMotion();
  const mountedRef  = useRef(true);
  const [isReady, setIsReady] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  // push97: live basePrice dari context — bukan hardcoded 67840/3521
  const { assets: dashAssets } = useCrypto();
  const btcPrice = useMemo(() => dashAssets.find(a => a.id === 'bitcoin')?.price  ?? 67840, [dashAssets]);
  const ethPrice = useMemo(() => dashAssets.find(a => a.id === 'ethereum')?.price ?? 3521,  [dashAssets]);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    const id = requestAnimationFrame(() => {
      if (mountedRef.current) setIsReady(true);
    });
    return () => {
      mountedRef.current = false;
      controller.abort();
      cancelAnimationFrame(id);
    };
  }, []);

  void prefersReducedMotion;

  const metricGridStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap:                 '12px',
    marginBottom:        '12px',
  }), [isMobile, isTablet]);

  const metricGridStyle2 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap:                 '12px',
    marginBottom:        '20px',
  }), [isMobile, isTablet]);

  const mainGridStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
    gap:                 '16px',
    marginBottom:        '20px',
  }), [isMobile]);

  const triGridStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap:                 '16px',
    marginBottom:        '20px',
  }), [isMobile, isTablet]);

  const dualGridStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap:                 '16px',
    marginBottom:        '20px',
  }), [isMobile]);

  if (!isReady) return <Skeleton.Page />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="main"
      aria-label="ZERØ MERIDIAN Dashboard"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        variants={tileVariants}
        style={{
          display:       'flex',
          alignItems:    'flex-start',
          justifyContent:'space-between',
          marginBottom:  '20px',
          gap:           '12px',
          flexWrap:      'wrap',
          willChange:    'transform',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{
              fontFamily:    "'Space Mono', monospace",
              fontSize:      '22px',
              fontWeight:    700,
              color:         'var(--zm-text-primary)',
              letterSpacing: '0.06em',
              margin:        0,
              willChange:    'transform',
            }}>
              ZERØ MERIDIAN
            </h1>
            <span style={{
              fontFamily:   "'Space Mono', monospace",
              fontSize:     '9px',
              padding:      '2px 8px',
              borderRadius: '4px',
              letterSpacing:'0.12em',
              background:   'rgba(96,165,250,0.1)',
              color:        'rgba(96,165,250,0.7)',
              border:       '1px solid rgba(96,165,250,0.2)',
            }}>
              TERMINAL v24
            </span>
          </div>
          <p style={{
            fontFamily:    "'Space Mono', monospace",
            fontSize:      '11px',
            color:         'var(--zm-text-faint)',
            letterSpacing: '0.08em',
            margin:        0,
          }}>
            Institutional-grade crypto intelligence
          </p>
        </div>
        <LiveStatusBar />
      </motion.div>

      {/* ── Market Quick View ───────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Top assets overview">
        <MarketOverviewBar />
      </motion.div>

      {/* ── 8 Live Metric Cards ─────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Market key metrics">
        <SectionLabel label="▸ Key Metrics — Live" mt={0} />
        <div style={metricGridStyle}>
          {METRIC_CONFIG.slice(0, 4).map(cfg => (
            <LiveMetricCard key={cfg.assetId} config={cfg} />
          ))}
        </div>
        <div style={metricGridStyle2}>
          {METRIC_CONFIG.slice(4).map(cfg => (
            <LiveMetricCard key={cfg.assetId} config={cfg} />
          ))}
        </div>
      </motion.div>

      {/* ── Price Action + Order Book ───────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Price action and order book">
        <SectionLabel label="▸ Price Action · TradingView Lightweight Charts" />
        <div style={mainGridStyle}>
          <Suspense fallback={<TileSkeleton height={440} />}>
            <TradingViewChart height={440} />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={440} />}>
            <OrderBookTile />
          </Suspense>
        </div>
      </motion.div>

      {/* ── Market Intelligence ──────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Market intelligence tiles">
        <SectionLabel label="▸ Market Intelligence" />
        <div style={triGridStyle}>
          <Suspense fallback={<TileSkeleton height={260} />}>
            <HeatmapTile />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={260} />}>
            <FundingRateTile />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={260} />}>
            <LiquidationTile />
          </Suspense>
        </div>
      </motion.div>

      {/* ── WASM Compute Engine ─────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="WASM orderbook engine">
        <SectionLabel label="⬡ Advanced Compute · WASM Orderbook Engine" color="rgba(168,85,247,0.5)" />
        <div style={dualGridStyle}>
          <Suspense fallback={<TileSkeleton height={520} />}>
            <WasmOrderBook symbol="BTCUSDT" basePrice={btcPrice} />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={520} />}>
            <WasmOrderBook symbol="ETHUSDT" basePrice={ethPrice} />
          </Suspense>
        </div>
      </motion.div>

      {/* ── Protocol Revenue + AI Signals ───────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Protocol revenue and AI signals">
        <SectionLabel label="◈ Protocol Revenue · AI Signals" color="rgba(52,211,153,0.5)" />
        <div style={dualGridStyle}>
          <Suspense fallback={<TileSkeleton height={420} />}>
            <TokenTerminalTile />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={420} />}>
            <AISignalTile />
          </Suspense>
        </div>
      </motion.div>

      {/* ── News Ticker ─────────────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Market news">
        <SectionLabel label="▸ Market News" mt={4} />
        <Suspense fallback={<TileSkeleton height={80} />}>
          <NewsTickerTile />
        </Suspense>
      </motion.div>

    </motion.div>
  );
});
Dashboard.displayName = 'Dashboard';

export default Dashboard;
