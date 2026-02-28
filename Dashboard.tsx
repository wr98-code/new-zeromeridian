/**
 * Dashboard.tsx — ZERØ MERIDIAN push93
 * Bloomberg terminal grade — dense, clean, zero self-claim
 * Struktur proven push92 + visual upgrade push93
 * ZERO className | var(--zm-*) | React.memo | useMemo | mountedRef
 */

import React, { Suspense, memo, useMemo, useRef, useEffect, useState } from 'react';
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

interface MetricCfg {
  label: string; assetId: string;
  fallbackValue: string; fallbackChange: number;
  accentColor: string;
}

const METRIC_CONFIG: readonly MetricCfg[] = Object.freeze([
  { label: 'BTC / USD',  assetId: 'bitcoin',     fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(251,191,36,1)'  },
  { label: 'ETH / USD',  assetId: 'ethereum',    fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(96,165,250,1)'  },
  { label: 'SOL / USD',  assetId: 'solana',      fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(167,139,250,1)' },
  { label: 'BNB / USD',  assetId: 'binancecoin', fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(251,146,60,1)'  },
  { label: 'Vol 24H',    assetId: '_volume',     fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(38,166,154,1)'  },
  { label: 'Mkt Cap',    assetId: '_mcap',       fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(0,188,212,1)'   },
  { label: 'BTC Dom.',   assetId: '_dominance',  fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(239,83,80,1)'   },
  { label: 'Assets',     assetId: '_count',      fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(120,130,145,1)' },
]);

const containerV = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
});
const tileV = Object.freeze({
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } },
});

// ── Section header ────────────────────────────────────────────────────────────
const SectionHead = memo(({ label, accent }: { label: string; accent?: string }) => {
  const a = accent ?? 'rgba(0,238,255,0.8)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 20 }}>
      <div style={{
        width: 2, height: 11, borderRadius: 1, flexShrink: 0,
        background: a, boxShadow: `0 0 5px ${a}55`,
      }} />
      <span style={{
        fontFamily: 'var(--zm-font-data)',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        color: 'var(--zm-text-3)',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--zm-divider)' }} />
    </div>
  );
});
SectionHead.displayName = 'SectionHead';

const TileSkeleton = memo(({ height = 320 }: { height?: number }) => (
  <GlassCard style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Skeleton.Card />
  </GlassCard>
));
TileSkeleton.displayName = 'TileSkeleton';

// ── Live Clock ────────────────────────────────────────────────────────────────
const LiveClock = memo(() => {
  const mountedRef = useRef(true);
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })
  );
  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => {
      if (mountedRef.current) setTime(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }));
    }, 1000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <motion.div
        style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(38,166,154,1)', flexShrink: 0, boxShadow: '0 0 5px rgba(38,166,154,0.6)' }}
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, fontWeight: 600, color: 'var(--zm-text-2)', letterSpacing: '0.06em' }}>
        {time}
        <span style={{ color: 'var(--zm-text-4)', fontWeight: 400, fontSize: 9, marginLeft: 3 }}>UTC</span>
      </span>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

// ── Ticker strip ──────────────────────────────────────────────────────────────
const TickerStrip = memo(() => {
  const { assets } = useCrypto();
  const top10 = useMemo(() => assets.slice(0, 10), [assets]);
  if (top10.length === 0) return null;
  return (
    <div style={{
      display: 'flex', gap: 3, overflowX: 'auto', scrollbarWidth: 'none',
      maskImage: 'linear-gradient(90deg,transparent,black 2%,black 98%,transparent)',
      WebkitMaskImage: 'linear-gradient(90deg,transparent,black 2%,black 98%,transparent)',
    }} role="region" aria-label="Top assets">
      {top10.map(asset => {
        const pos = asset.change24h >= 0;
        return (
          <div key={asset.id} style={{
            flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 8px', borderRadius: 3,
            background: 'var(--zm-card-bg)',
            border: `1px solid ${pos ? 'rgba(38,166,154,0.12)' : 'rgba(239,83,80,0.12)'}`,
          }}>
            <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 8.5, fontWeight: 700, color: 'var(--zm-text-3)', letterSpacing: '0.1em' }}>
              {asset.symbol.toUpperCase()}
            </span>
            <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 10.5, fontWeight: 600, color: 'var(--zm-text-1)', letterSpacing: '-0.01em' }}>
              {formatPrice(asset.price)}
            </span>
            <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9.5, fontWeight: 600, color: pos ? 'rgba(38,166,154,1)' : 'rgba(239,83,80,1)' }}>
              {(pos ? '+' : '') + asset.change24h.toFixed(2) + '%'}
            </span>
          </div>
        );
      })}
    </div>
  );
});
TickerStrip.displayName = 'TickerStrip';

// ── Live Metric Card ──────────────────────────────────────────────────────────
const LiveMetricCard = memo(({ config }: { config: MetricCfg }) => {
  const { assets } = useCrypto();

  const { value, change } = useMemo(() => {
    if (config.assetId === '_volume') {
      const t = assets.reduce((s, a) => s + (a.volume24h ?? 0), 0);
      return t > 0 ? { value: formatCompact(t), change: 0 } : { value: config.fallbackValue, change: config.fallbackChange };
    }
    if (config.assetId === '_mcap') {
      const t = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
      return t > 0 ? { value: formatCompact(t), change: 0 } : { value: config.fallbackValue, change: config.fallbackChange };
    }
    if (config.assetId === '_dominance') {
      const btc   = assets.find(a => a.id === 'bitcoin');
      const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
      if (btc && total > 0) return { value: ((btc.marketCap / total) * 100).toFixed(1) + '%', change: 0 };
      return { value: config.fallbackValue, change: config.fallbackChange };
    }
    if (config.assetId === '_count') {
      return { value: assets.length > 0 ? assets.length.toLocaleString() : config.fallbackValue, change: 0 };
    }
    const asset = assets.find(a => a.id === config.assetId);
    if (!asset) return { value: config.fallbackValue, change: config.fallbackChange };
    return { value: formatPrice(asset.price), change: asset.change24h ?? 0 };
  }, [assets, config]);

  return (
    <Suspense fallback={<Skeleton.Card />}>
      <MetricCard label={config.label} value={value} change={change} accentColor={config.accentColor} />
    </Suspense>
  );
});
LiveMetricCard.displayName = 'LiveMetricCard';

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = memo(() => {
  const rm = useReducedMotion();
  const mountedRef = useRef(true);
  const [isReady, setIsReady] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();
  void rm;

  useEffect(() => {
    mountedRef.current = true;
    const id = requestAnimationFrame(() => { if (mountedRef.current) setIsReady(true); });
    return () => { mountedRef.current = false; cancelAnimationFrame(id); };
  }, []);

  // Grid styles
  const grid4S = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
    gap: 8,
  }), [isMobile, isTablet]);

  const mainGridS = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
    gap: 10,
  }), [isMobile]);

  const triGridS = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
    gap: 10,
  }), [isMobile, isTablet]);

  const dualGridS = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: 10,
  }), [isMobile]);

  if (!isReady) return <Skeleton.Page />;

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" role="main" aria-label="Dashboard">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div variants={tileV} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--zm-font-ui)', fontSize: isMobile ? 16 : 18,
            fontWeight: 600, color: 'var(--zm-text-1)', margin: 0, letterSpacing: '-0.02em',
          }}>
            Dashboard
          </h1>
          <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 8.5, color: 'var(--zm-text-4)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, display: 'block', marginTop: 2 }}>
            ZERØ MERIDIAN · Binance Live
          </span>
        </div>
        <LiveClock />
      </motion.div>

      {/* ── Ticker Strip ────────────────────────────────────────────────────── */}
      <motion.div variants={tileV} style={{ marginBottom: 2 }}>
        <TickerStrip />
      </motion.div>

      {/* ── 8 Metric Cards ──────────────────────────────────────────────────── */}
      <motion.div variants={tileV} aria-label="Key metrics">
        <SectionHead label="Key Metrics — Binance Live" />
        <div style={{ ...grid4S, marginBottom: 8 }}>
          {METRIC_CONFIG.slice(0, 4).map(cfg => <LiveMetricCard key={cfg.assetId} config={cfg} />)}
        </div>
        <div style={{ ...grid4S, marginBottom: 4 }}>
          {METRIC_CONFIG.slice(4).map(cfg => <LiveMetricCard key={cfg.assetId} config={cfg} />)}
        </div>
      </motion.div>

      {/* ── Price Action ────────────────────────────────────────────────────── */}
      <motion.div variants={tileV}>
        <SectionHead label="Price Action · TradingView" />
        <div style={mainGridS}>
          <Suspense fallback={<TileSkeleton height={420} />}><TradingViewChart height={420} /></Suspense>
          <Suspense fallback={<TileSkeleton height={420} />}><OrderBookTile /></Suspense>
        </div>
      </motion.div>

      {/* ── Market Intelligence ──────────────────────────────────────────────── */}
      <motion.div variants={tileV}>
        <SectionHead label="Market Intelligence" accent="rgba(239,83,80,0.8)" />
        <div style={triGridS}>
          <Suspense fallback={<TileSkeleton height={240} />}><HeatmapTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={240} />}><FundingRateTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={240} />}><LiquidationTile /></Suspense>
        </div>
      </motion.div>

      {/* ── Order Flow Depth ─────────────────────────────────────────────────── */}
      <motion.div variants={tileV}>
        <SectionHead label="Order Flow Depth · WASM" accent="rgba(130,80,220,0.8)" />
        <div style={dualGridS}>
          <Suspense fallback={<TileSkeleton height={480} />}><WasmOrderBook symbol="BTCUSDT" basePrice={67840} /></Suspense>
          <Suspense fallback={<TileSkeleton height={480} />}><WasmOrderBook symbol="ETHUSDT" basePrice={3521} /></Suspense>
        </div>
      </motion.div>

      {/* ── Protocol Revenue + AI Signals ────────────────────────────────────── */}
      <motion.div variants={tileV}>
        <SectionHead label="Protocol Revenue · AI Signals" accent="rgba(38,166,154,0.8)" />
        <div style={dualGridS}>
          <Suspense fallback={<TileSkeleton height={380} />}><TokenTerminalTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={380} />}><AISignalTile /></Suspense>
        </div>
      </motion.div>

      {/* ── News ─────────────────────────────────────────────────────────────── */}
      <motion.div variants={tileV}>
        <SectionHead label="Market News" />
        <Suspense fallback={<TileSkeleton height={72} />}><NewsTickerTile /></Suspense>
      </motion.div>

    </motion.div>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
