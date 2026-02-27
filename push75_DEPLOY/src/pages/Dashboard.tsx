/**
 * Dashboard.tsx — ZERØ MERIDIAN push75
 *
 * push75: ErrorBoundary ditambahkan di setiap tile.
 *   Jika satu tile crash (WS error / canvas error / JSON error),
 *   hanya tile itu yang jatuh — dashboard tetap hidup.
 *   Setiap ErrorBoundary punya label untuk debug.
 *
 * push77: Professional layout upgrade (tetap dipertahankan)
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo + mountedRef ✓
 */

import React, { Suspense, memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import GlassCard from '../components/shared/GlassCard';
import MetricCard from '../components/shared/MetricCard';
import Skeleton from '../components/shared/Skeleton';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { useCrypto } from '@/contexts/CryptoContext';
import { formatPrice } from '@/lib/formatters';
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

// ─── Binance WS hook ──────────────────────────────────────────────────────────

interface WsPrice { price: number; change: number; }
type WsPriceMap = Record<string, WsPrice>;

const WS_SYMBOLS = Object.freeze(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT']);

function useBinanceWS(symbols: readonly string[]): WsPriceMap {
  const [prices, setPrices] = useState<WsPriceMap>({});
  const mountRef = useRef(true);
  const wsRef    = useRef<WebSocket | null>(null);

  useEffect(() => {
    mountRef.current = true;
    const streams = symbols.map(s => s.toLowerCase() + '@miniTicker').join('/');
    const url = 'wss://stream.binance.com:9443/stream?streams=' + streams;

    function connect() {
      if (!mountRef.current) return;
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        if (!mountRef.current) return;
        try {
          const d = JSON.parse(e.data).data;
          if (!d?.s) return;
          const price  = parseFloat(d.c);
          const open   = parseFloat(d.o);
          const change = open > 0 ? ((price - open) / open) * 100 : 0;
          setPrices(prev => ({ ...prev, [d.s]: { price, change } }));
        } catch { /* ignore */ }
      };
      ws.onerror  = () => {};
      ws.onclose  = () => { if (mountRef.current) setTimeout(connect, 3000); };
    }
    connect();
    return () => { mountRef.current = false; wsRef.current?.close(); };
  }, []); // eslint-disable-line

  return prices;
}

// ─── Static metric config ─────────────────────────────────────────────────────

interface MetricCfg {
  label: string; assetId: string; wsSymbol?: string;
  accentColor: string; icon?: string;
}

const METRICS: readonly MetricCfg[] = Object.freeze([
  { label: 'Bitcoin',  assetId: 'bitcoin',  wsSymbol: 'BTCUSDT', accentColor: 'rgba(251,191,36,1)',  icon: '₿' },
  { label: 'Ethereum', assetId: 'ethereum', wsSymbol: 'ETHUSDT', accentColor: 'rgba(96,165,250,1)',  icon: 'Ξ' },
  { label: 'Solana',   assetId: 'solana',   wsSymbol: 'SOLUSDT', accentColor: 'rgba(52,211,153,1)',  icon: '◎' },
  { label: 'BNB',      assetId: 'binancecoin', wsSymbol: 'BNBUSDT', accentColor: 'rgba(251,146,60,1)', icon: 'B' },
  { label: 'XRP',      assetId: 'ripple',   wsSymbol: 'XRPUSDT', accentColor: 'rgba(34,211,238,1)',  icon: 'X' },
  { label: 'Avalanche', assetId: 'avalanche-2', accentColor: 'rgba(239,68,68,1)',  icon: 'A' },
  { label: 'Chainlink', assetId: 'chainlink',   accentColor: 'rgba(96,165,250,0.9)', icon: '⬡' },
  { label: 'Polygon',   assetId: 'matic-network', accentColor: 'rgba(139,92,246,1)', icon: 'M' },
]);

// ─── LiveMetric sub-component ─────────────────────────────────────────────────

interface LiveMetricProps {
  cfg:      MetricCfg;
  wsPrice?: WsPrice;
}

const LiveMetric = memo(({ cfg, wsPrice }: LiveMetricProps) => {
  const { assets } = useCrypto();
  const asset = useMemo(() => assets.find(a => a.id === cfg.assetId), [assets, cfg.assetId]);

  const price  = wsPrice?.price  ?? asset?.price  ?? null;
  const change = wsPrice?.change ?? asset?.change24h ?? null;

  return (
    <MetricCard
      label={cfg.label}
      value={price != null ? formatPrice(price) : '—'}
      change={change != null ? change : undefined}
      accentColor={cfg.accentColor}
      icon={cfg.icon}
      sparkline={asset?.sparkline}
    />
  );
});
LiveMetric.displayName = 'LiveMetric';

// ─── TileSkeleton ─────────────────────────────────────────────────────────────

const TileSkeleton = memo(({ height }: { height: number }) => (
  <div style={{ height, borderRadius: 8, overflow: 'hidden' }}>
    <Skeleton.Card style={{ height: '100%' }} />
  </div>
));
TileSkeleton.displayName = 'TileSkeleton';

// ─── LiveClock ────────────────────────────────────────────────────────────────

const LiveClock = memo(() => {
  const [time, setTime] = useState(() => new Date());
  const mountRef = useRef(true);

  useEffect(() => {
    mountRef.current = true;
    const t = setInterval(() => {
      if (mountRef.current) setTime(new Date());
    }, 1000);
    return () => { mountRef.current = false; clearInterval(t); };
  }, []);

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(80,80,100,1)', letterSpacing: '0.08em', textAlign: 'right' as const }}>
      <div style={{ color: 'rgba(0,238,255,0.5)', fontSize: 13, fontWeight: 600 }}>
        {time.toLocaleTimeString('en-US', { hour12: false })}
      </div>
      <div>{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

// ─── MarketBar ────────────────────────────────────────────────────────────────

const MARKET_BAR_SYMBOLS = Object.freeze(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT']);
const MARKET_BAR_LABELS: Readonly<Record<string, string>> = Object.freeze({
  BTCUSDT: 'BTC', ETHUSDT: 'ETH', SOLUSDT: 'SOL', BNBUSDT: 'BNB', XRPUSDT: 'XRP',
});
const MARKET_BAR_COLORS: Readonly<Record<string, string>> = Object.freeze({
  BTCUSDT: 'rgba(251,191,36,1)', ETHUSDT: 'rgba(96,165,250,1)',
  SOLUSDT: 'rgba(52,211,153,1)', BNBUSDT: 'rgba(251,146,60,1)', XRPUSDT: 'rgba(34,211,238,1)',
});

const MarketBar = memo(({ wsMap }: { wsMap: WsPriceMap }) => (
  <GlassCard style={{ padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap' as const, alignItems: 'center' }}>
    {MARKET_BAR_SYMBOLS.map(sym => {
      const d = wsMap[sym];
      return (
        <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: MARKET_BAR_COLORS[sym], fontWeight: 700, letterSpacing: '0.06em' }}>
            {MARKET_BAR_LABELS[sym]}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(226,232,240,0.85)', fontWeight: 600 }}>
            {d?.price != null ? '$' + d.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
          </span>
          {d?.change != null && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: d.change >= 0 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)' }}>
              {(d.change >= 0 ? '+' : '') + d.change.toFixed(2) + '%'}
            </span>
          )}
        </div>
      );
    })}
    <div style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'rgba(52,211,153,0.5)' }}>
      ● LIVE
    </div>
  </GlassCard>
));
MarketBar.displayName = 'MarketBar';

// ─── SectionHeader ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  label: string;
  color: string;
  mt?:   number;
}

const SectionHeader = memo(({ label, color, mt = 8 }: SectionHeaderProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: mt }}>
    <div style={{ width: 3, height: 14, background: color, borderRadius: 2, flexShrink: 0 }} />
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
      {label}
    </span>
  </div>
));
SectionHeader.displayName = 'SectionHeader';

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
});

const rowVariants = Object.freeze({
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = memo(() => {
  const prefersReducedMotion = useReducedMotion();
  const { isMobile, isTablet } = useBreakpoint();
  const wsMap = useBinanceWS(WS_SYMBOLS);

  const col4 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap:                 '10px',
    marginBottom:        '14px',
  }), [isMobile, isTablet]);

  const col2chart = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
    gap:                 '14px',
    marginBottom:        '14px',
  }), [isMobile]);

  const col3 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap:                 '14px',
    marginBottom:        '14px',
  }), [isMobile, isTablet]);

  const col2 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap:                 '14px',
    marginBottom:        '14px',
  }), [isMobile]);

  return (
    <motion.div
      variants={prefersReducedMotion ? {} : containerVariants}
      initial="hidden"
      animate="visible"
      role="main"
      aria-label="ZERØ MERIDIAN Dashboard"
    >

      {/* ── Page header ── */}
      <motion.div variants={rowVariants} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' as const }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: 'rgba(240,240,248,1)', letterSpacing: '0.06em', margin: '0 0 4px' }}>
            Dashboard
          </h1>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: 'rgba(80,80,100,1)', letterSpacing: '0.06em', margin: 0 }}>
            Institutional-grade crypto intelligence · Always free
          </p>
        </div>
        <LiveClock />
      </motion.div>

      {/* ── Market quick bar ── */}
      <motion.div variants={rowVariants}>
        <MarketBar wsMap={wsMap} />
      </motion.div>

      {/* ── 8 metric cards ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="Key Metrics — Binance Live" color="rgba(0,238,255,0.4)" mt={0} />
        <div style={col4}>
          {METRICS.slice(0, 4).map(cfg => (
            <ErrorBoundary key={cfg.assetId} label={'MetricCard ' + cfg.label}>
              <LiveMetric cfg={cfg} wsPrice={cfg.wsSymbol ? wsMap[cfg.wsSymbol] : undefined} />
            </ErrorBoundary>
          ))}
        </div>
        <div style={{ ...col4, marginBottom: '20px' }}>
          {METRICS.slice(4).map(cfg => (
            <ErrorBoundary key={cfg.assetId} label={'MetricCard ' + cfg.label}>
              <LiveMetric cfg={cfg} wsPrice={cfg.wsSymbol ? wsMap[cfg.wsSymbol] : undefined} />
            </ErrorBoundary>
          ))}
        </div>
      </motion.div>

      {/* ── Price action + orderbook ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="Price Action · Binance Direct" color="rgba(96,165,250,0.45)" />
        <div style={col2chart}>
          <ErrorBoundary label="TradingViewChart">
            <Suspense fallback={<TileSkeleton height={420} />}>
              <TradingViewChart height={420} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary label="OrderBookTile">
            <Suspense fallback={<TileSkeleton height={420} />}>
              <OrderBookTile />
            </Suspense>
          </ErrorBoundary>
        </div>
      </motion.div>

      {/* ── Market intelligence ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="Market Intelligence" color="rgba(167,139,250,0.45)" />
        <div style={col3}>
          <ErrorBoundary label="HeatmapTile">
            <Suspense fallback={<TileSkeleton height={260} />}><HeatmapTile /></Suspense>
          </ErrorBoundary>
          <ErrorBoundary label="FundingRateTile">
            <Suspense fallback={<TileSkeleton height={260} />}><FundingRateTile /></Suspense>
          </ErrorBoundary>
          <ErrorBoundary label="LiquidationTile">
            <Suspense fallback={<TileSkeleton height={260} />}><LiquidationTile /></Suspense>
          </ErrorBoundary>
        </div>
      </motion.div>

      {/* ── WASM compute ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="WASM Orderbook Engine" color="rgba(176,130,255,0.45)" />
        <div style={col2}>
          <ErrorBoundary label="WasmOrderBook BTC">
            <Suspense fallback={<TileSkeleton height={480} />}>
              <WasmOrderBook symbol="BTCUSDT" basePrice={wsMap['BTCUSDT']?.price ?? 67840} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary label="WasmOrderBook ETH">
            <Suspense fallback={<TileSkeleton height={480} />}>
              <WasmOrderBook symbol="ETHUSDT" basePrice={wsMap['ETHUSDT']?.price ?? 3521} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </motion.div>

      {/* ── Protocol revenue + AI signals ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="Protocol Revenue · AI Signals" color="rgba(34,255,170,0.45)" />
        <div style={col2}>
          <ErrorBoundary label="TokenTerminalTile">
            <Suspense fallback={<TileSkeleton height={400} />}><TokenTerminalTile /></Suspense>
          </ErrorBoundary>
          <ErrorBoundary label="AISignalTile">
            <Suspense fallback={<TileSkeleton height={400} />}><AISignalTile /></Suspense>
          </ErrorBoundary>
        </div>
      </motion.div>

      {/* ── News ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="Market News — Live Feed" color="rgba(80,80,100,0.6)" mt={4} />
        <ErrorBoundary label="NewsTickerTile">
          <Suspense fallback={<TileSkeleton height={80} />}><NewsTickerTile /></Suspense>
        </ErrorBoundary>
      </motion.div>

    </motion.div>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
