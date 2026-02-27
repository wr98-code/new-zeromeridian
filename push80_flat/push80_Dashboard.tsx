/**
 * Dashboard.tsx — ZERØ MERIDIAN 2026 push80
 * push80: Bloomberg Terminal density redesign
 *   - Header: title + regime badge + AI signal + fear&greed + live clock — 1 row
 *   - Asset ticker: 10 assets, ultra-compact single row
 *   - 6-column metric grid on desktop (single row, not 2 rows)
 *   - Gap reduced: 8px tiles, 12px sections
 *   - Section headers: tighter margins (mt:12 mb:8)
 *   - Chart height: 360px (was 420px) — more content above fold
 *   - Intelligence tiles: 220px (was 260px)
 *   - SparklineChart integrated in asset ticker
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo + mountedRef ✓
 * - Object.freeze() all static data ✓
 */

import React, {
  Suspense, memo, useCallback, useMemo, useRef, useEffect, useState,
} from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import GlassCard    from '../components/shared/GlassCard';
import MetricCard   from '../components/shared/MetricCard';
import Skeleton     from '../components/shared/Skeleton';
import { useCrypto } from '@/contexts/CryptoContext';
import { formatPrice, formatCompact, REGIME_CONFIG, SIGNAL_CONFIG } from '@/lib/formatters';
import type { MarketRegime, AISignal } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import SparklineChart from '../components/shared/SparklineChart';

const TradingViewChart  = React.lazy(() => import('../components/tiles/TradingViewChart'));
const OrderBookTile     = React.lazy(() => import('../components/tiles/OrderBookTile'));
const HeatmapTile       = React.lazy(() => import('../components/tiles/HeatmapTile'));
const FundingRateTile   = React.lazy(() => import('../components/tiles/FundingRateTile'));
const LiquidationTile   = React.lazy(() => import('../components/tiles/LiquidationTile'));
const NewsTickerTile    = React.lazy(() => import('../components/tiles/NewsTickerTile'));
const WasmOrderBook     = React.lazy(() => import('../components/tiles/WasmOrderBook'));
const TokenTerminalTile = React.lazy(() => import('../components/tiles/TokenTerminalTile'));
const AISignalTile      = React.lazy(() => import('../components/tiles/AISignalTile'));

// ─── Binance WS ────────────────────────────────────────────────────────────────

interface WsPrice { price: number; change: number; }
type WsPriceMap = Record<string, WsPrice>;

const WS_SYMBOLS = Object.freeze([
  'BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT',
  'DOGEUSDT','ADAUSDT','AVAXUSDT','DOTUSDT','MATICUSDT',
]);

function useBinanceWS(symbols: readonly string[]): WsPriceMap {
  const [prices, setPrices]   = useState<WsPriceMap>({});
  const mountRef               = useRef(true);
  const wsRef                  = useRef<WebSocket | null>(null);

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
      ws.onerror = () => {};
      ws.onclose = () => { if (mountRef.current) setTimeout(connect, 3000); };
    }
    connect();
    return () => { mountRef.current = false; wsRef.current?.close(); };
  }, []); // eslint-disable-line

  return prices;
}

// ─── Static configs ────────────────────────────────────────────────────────────

interface MetricCfg {
  label: string; assetId: string; wsSymbol?: string; accentColor: string;
}

const METRICS: readonly MetricCfg[] = Object.freeze([
  { label: 'BTC / USD',  assetId: 'bitcoin',     wsSymbol: 'BTCUSDT',    accentColor: 'rgba(251,191,36,1)'  },
  { label: 'ETH / USD',  assetId: 'ethereum',    wsSymbol: 'ETHUSDT',    accentColor: 'rgba(96,165,250,1)'  },
  { label: 'SOL / USD',  assetId: 'solana',      wsSymbol: 'SOLUSDT',    accentColor: 'rgba(167,139,250,1)' },
  { label: 'Total MCap', assetId: '_mcap',                                accentColor: 'rgba(45,212,191,1)'  },
  { label: 'Vol 24h',    assetId: '_volume',                              accentColor: 'rgba(52,211,153,1)'  },
  { label: 'BTC Dom.',   assetId: '_dominance',                           accentColor: 'rgba(248,113,113,1)' },
]);

const TICKER_ASSETS = Object.freeze([
  { symbol: 'BTC', ws: 'BTCUSDT',    id: 'bitcoin'     },
  { symbol: 'ETH', ws: 'ETHUSDT',    id: 'ethereum'    },
  { symbol: 'SOL', ws: 'SOLUSDT',    id: 'solana'      },
  { symbol: 'BNB', ws: 'BNBUSDT',    id: 'binancecoin' },
  { symbol: 'XRP', ws: 'XRPUSDT',    id: 'ripple'      },
  { symbol: 'DOGE',ws: 'DOGEUSDT',   id: 'dogecoin'    },
  { symbol: 'ADA', ws: 'ADAUSDT',    id: 'cardano'     },
  { symbol: 'AVAX',ws: 'AVAXUSDT',   id: 'avalanche-2' },
  { symbol: 'DOT', ws: 'DOTUSDT',    id: 'polkadot'    },
  { symbol: 'MATIC',ws:'MATICUSDT',  id: 'matic-network'},
]);

// regime → inline color (no className)
const REGIME_COLORS = Object.freeze({
  SURGE: { text: 'rgba(34,255,170,1)',  bg: 'rgba(34,255,170,0.10)', border: 'rgba(34,255,170,0.25)' },
  BULL:  { text: 'rgba(52,211,153,1)',  bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.25)' },
  CRAB:  { text: 'rgba(148,163,184,1)', bg: 'rgba(148,163,184,0.08)',border: 'rgba(148,163,184,0.2)' },
  BEAR:  { text: 'rgba(255,68,136,1)',  bg: 'rgba(255,68,136,0.10)', border: 'rgba(255,68,136,0.25)' },
} as const);

const SIGNAL_COLORS = Object.freeze({
  STRONG_BUY:  { text: 'rgba(34,255,170,1)',  bg: 'rgba(34,255,170,0.10)',  border: 'rgba(34,255,170,0.3)'  },
  BUY:         { text: 'rgba(52,211,153,1)',  bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
  NEUTRAL:     { text: 'rgba(148,163,184,1)', bg: 'rgba(148,163,184,0.06)',border: 'rgba(148,163,184,0.18)' },
  SELL:        { text: 'rgba(255,68,136,1)',  bg: 'rgba(255,68,136,0.08)',  border: 'rgba(255,68,136,0.22)' },
  STRONG_SELL: { text: 'rgba(255,68,136,1)',  bg: 'rgba(255,68,136,0.12)',  border: 'rgba(255,68,136,0.3)'  },
} as const);

// ─── Animation variants ────────────────────────────────────────────────────────

const containerVariants = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.01 } },
});

const rowVariants = Object.freeze({
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
});

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = memo(({
  label,
  color  = 'rgba(0,238,255,0.4)',
  mt     = 12,
  mb     = 8,
}: {
  label: string; color?: string; mt?: number; mb?: number;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: mt, marginBottom: mb }}>
    <div style={{ width: 2, height: 11, background: color, borderRadius: 1, flexShrink: 0 }} />
    <span style={{
      fontFamily:    "'JetBrains Mono', monospace",
      fontSize:      '9px',
      letterSpacing: '0.2em',
      color,
      textTransform: 'uppercase' as const,
    }}>
      {label}
    </span>
  </div>
));
SectionHeader.displayName = 'SectionHeader';

// ─── Tile skeleton ─────────────────────────────────────────────────────────────

const TileSkeleton = memo(({ height = 280 }: { height?: number }) => (
  <GlassCard style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Skeleton.Card />
  </GlassCard>
));
TileSkeleton.displayName = 'TileSkeleton';

// ─── Regime badge ──────────────────────────────────────────────────────────────

const RegimeBadge = memo(({ regime }: { regime: MarketRegime }) => {
  const c = REGIME_COLORS[regime];
  const badgeStyle = useMemo(() => ({
    display:       'flex',
    alignItems:    'center',
    gap:           '5px',
    padding:       '3px 8px',
    borderRadius:  '4px',
    background:    c.bg,
    border:        '1px solid ' + c.border,
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      '10px',
    fontWeight:    700,
    color:         c.text,
    letterSpacing: '0.08em',
    flexShrink:    0,
  }), [c]);

  return (
    <div style={badgeStyle}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.text, boxShadow: '0 0 5px ' + c.text, flexShrink: 0 }} />
      {REGIME_CONFIG[regime].label}
    </div>
  );
});
RegimeBadge.displayName = 'RegimeBadge';

// ─── AI signal badge ───────────────────────────────────────────────────────────

const SignalBadge = memo(({ signal }: { signal: AISignal }) => {
  const c = SIGNAL_COLORS[signal];
  const badgeStyle = useMemo(() => ({
    padding:       '3px 8px',
    borderRadius:  '4px',
    background:    c.bg,
    border:        '1px solid ' + c.border,
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      '10px',
    fontWeight:    700,
    color:         c.text,
    letterSpacing: '0.06em',
    flexShrink:    0,
  }), [c]);

  return <div style={badgeStyle}>{SIGNAL_CONFIG[signal].label}</div>;
});
SignalBadge.displayName = 'SignalBadge';

// ─── Fear & Greed inline ───────────────────────────────────────────────────────

const FearGreedInline = memo(({ value, label }: { value: number; label: string }) => {
  const color = useMemo(() => {
    if (value <= 25)  return 'rgba(255,68,136,1)';
    if (value <= 45)  return 'rgba(255,187,0,1)';
    if (value <= 55)  return 'rgba(148,163,184,1)';
    if (value <= 75)  return 'rgba(52,211,153,1)';
    return 'rgba(0,238,255,1)';
  }, [value]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'rgba(80,80,100,1)', letterSpacing: '0.06em' }}>F&G</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 700, color }}>{value}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color, opacity: 0.8 }}>{label}</span>
    </div>
  );
});
FearGreedInline.displayName = 'FearGreedInline';

// ─── Live clock ────────────────────────────────────────────────────────────────

const LiveClock = memo(() => {
  const mountedRef = useRef(true);
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => {
      if (mountedRef.current) setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <motion.div
        style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(34,255,170,1)', flexShrink: 0 }}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(80,80,100,1)', letterSpacing: '0.06em' }}>
        {time + ' UTC'}
      </span>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

// ─── Asset ticker chip ─────────────────────────────────────────────────────────

interface TickerChipProps {
  symbol:   string;
  price:    number;
  change:   number;
  sparkline: number[];
}

const TickerChip = memo(({ symbol, price, change, sparkline }: TickerChipProps) => {
  const pos = change >= 0;
  const chipStyle = useMemo(() => ({
    flex:           '0 0 auto',
    display:        'flex',
    alignItems:     'center',
    gap:            '8px',
    padding:        '6px 10px',
    borderRadius:   '6px',
    background:     'rgba(14,17,28,1)',
    border:         '1px solid rgba(32,42,68,1)',
    minWidth:       '120px',
    cursor:         'default',
  }), []);

  const changeStyle = useMemo(() => ({
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      '9px',
    fontWeight:    600,
    color:         pos ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)',
    whiteSpace:    'nowrap' as const,
  }), [pos]);

  return (
    <div style={chipStyle}>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 700, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em' }}>
          {symbol}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'rgba(240,240,248,1)' }}>
          {formatPrice(price)}
        </span>
      </div>
      {sparkline.length >= 2 && (
        <SparklineChart data={sparkline} width={40} height={22} color="auto" />
      )}
      <span style={changeStyle}>
        {(pos ? '+' : '') + change.toFixed(2) + '%'}
      </span>
    </div>
  );
});
TickerChip.displayName = 'TickerChip';

// ─── Asset ticker row ──────────────────────────────────────────────────────────

const AssetTicker = memo(({ wsMap }: { wsMap: WsPriceMap }) => {
  const { assets } = useCrypto();

  const chips = useMemo(() => (
    TICKER_ASSETS.map(t => {
      const ws      = wsMap[t.ws];
      const asset   = assets.find(a => a.id === t.id);
      const price   = ws ? ws.price  : (asset?.price ?? 0);
      const change  = ws ? ws.change : (asset?.change24h ?? 0);
      const sparkline = asset?.sparkline ?? [];
      return { ...t, price, change, sparkline };
    })
  ), [wsMap, assets]);

  if (chips.every(c => c.price === 0)) return null;

  return (
    <div style={{
      display:        'flex',
      gap:            '6px',
      overflowX:      'auto',
      paddingBottom:  '2px',
      scrollbarWidth: 'none' as const,
    }}>
      {chips.map(c => (
        <TickerChip
          key={c.ws}
          symbol={c.symbol}
          price={c.price}
          change={c.change}
          sparkline={c.sparkline}
        />
      ))}
    </div>
  );
});
AssetTicker.displayName = 'AssetTicker';

// ─── Live metric card ──────────────────────────────────────────────────────────

const LiveMetric = memo(({ cfg, wsPrice }: { cfg: MetricCfg; wsPrice?: WsPrice }) => {
  const { assets } = useCrypto();

  const { value, change } = useMemo(() => {
    if (wsPrice && cfg.wsSymbol) {
      const p   = wsPrice.price;
      const fmt = p >= 1000
        ? '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 })
        : '$' + p.toFixed(2);
      return { value: fmt, change: wsPrice.change };
    }
    if (cfg.assetId === '_mcap') {
      const t = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
      return t > 0 ? { value: '$' + formatCompact(t), change: 0 } : { value: '—', change: 0 };
    }
    if (cfg.assetId === '_volume') {
      const t = assets.reduce((s, a) => s + (a.volume24h ?? 0), 0);
      return t > 0 ? { value: '$' + formatCompact(t), change: 0 } : { value: '—', change: 0 };
    }
    if (cfg.assetId === '_dominance') {
      const btc   = assets.find(a => a.id === 'bitcoin');
      const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
      if (btc && total > 0) return { value: ((btc.marketCap / total) * 100).toFixed(1) + '%', change: 0 };
      return { value: '—', change: 0 };
    }
    const asset = assets.find(a => a.id === cfg.assetId);
    if (!asset) return { value: '—', change: 0 };
    const p   = asset.price;
    const fmt = p >= 1000
      ? '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : '$' + p.toFixed(2);
    return { value: fmt, change: asset.change24h ?? 0 };
  }, [assets, cfg, wsPrice]);

  return (
    <MetricCard
      label={cfg.label}
      value={value}
      change={change !== 0 ? change : undefined}
      accentColor={cfg.accentColor}
    />
  );
});
LiveMetric.displayName = 'LiveMetric';

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = memo(() => {
  const mountedRef               = useRef(true);
  const prefersReducedMotion     = useReducedMotion();
  const { isMobile, isTablet }   = useBreakpoint();
  const { assets, fearGreed, regime, signal } = useCrypto();
  const wsMap = useBinanceWS(WS_SYMBOLS);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Grid layouts ──────────────────────────────────────────────────────────

  const grid6 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile
      ? 'repeat(2, 1fr)'
      : isTablet ? 'repeat(3, 1fr)'
      : 'repeat(6, 1fr)',
    gap: '8px',
  }), [isMobile, isTablet]);

  const grid2chart = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
    gap:                 '8px',
  }), [isMobile]);

  const grid3 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap:                 '8px',
  }), [isMobile, isTablet]);

  const grid2 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap:                 '8px',
  }), [isMobile]);

  const btcPrice = wsMap['BTCUSDT']?.price ?? 0;
  const ethPrice = wsMap['ETHUSDT']?.price ?? 0;

  return (
    <motion.div
      variants={prefersReducedMotion ? {} : containerVariants}
      initial="hidden"
      animate="visible"
      role="main"
      aria-label="ZERØ MERIDIAN Dashboard"
      style={{ paddingBottom: '8px' }}
    >
      {/* ── Dense header row ── */}
      <motion.div
        variants={prefersReducedMotion ? {} : rowVariants}
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '10px',
          marginBottom:'14px',
          flexWrap:    'wrap' as const,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px', marginRight: '4px' }}>
          <h1 style={{
            fontFamily:    "'Space Grotesk', sans-serif",
            fontSize:      '18px',
            fontWeight:    700,
            color:         'rgba(240,240,248,1)',
            letterSpacing: '0.06em',
            margin:        0,
          }}>
            Dashboard
          </h1>
          <p style={{
            fontFamily:    "'IBM Plex Mono', monospace",
            fontSize:      '9px',
            color:         'rgba(80,80,100,1)',
            letterSpacing: '0.08em',
            margin:        0,
          }}>
            Crypto Intelligence Terminal
          </p>
        </div>

        {/* Regime */}
        <RegimeBadge regime={regime} />

        {/* AI Signal */}
        <SignalBadge signal={signal} />

        {/* Fear & Greed */}
        {fearGreed.value > 0 && (
          <FearGreedInline value={fearGreed.value} label={fearGreed.label} />
        )}

        {/* Assets count */}
        {assets.length > 0 && (
          <span style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '9px',
            color:         'rgba(80,80,100,1)',
            letterSpacing: '0.06em',
            flexShrink:    0,
          }}>
            {assets.length + ' ASSETS'}
          </span>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Live clock */}
        <LiveClock />
      </motion.div>

      {/* ── Asset ticker ── */}
      <motion.div variants={prefersReducedMotion ? {} : rowVariants} style={{ marginBottom: '14px' }}>
        <AssetTicker wsMap={wsMap} />
      </motion.div>

      {/* ── 6 metric cards — 1 row desktop ── */}
      <motion.div variants={prefersReducedMotion ? {} : rowVariants}>
        <SectionHeader label="Key Metrics — Binance Live" color="rgba(0,238,255,0.4)" mt={0} mb={8} />
        <div style={{ ...grid6, marginBottom: '14px' }}>
          {METRICS.map(cfg => (
            <LiveMetric
              key={cfg.assetId}
              cfg={cfg}
              wsPrice={cfg.wsSymbol ? wsMap[cfg.wsSymbol] : undefined}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Price action + order book ── */}
      <motion.div variants={prefersReducedMotion ? {} : rowVariants}>
        <SectionHeader label="Price Action · TradingView" color="rgba(96,165,250,0.45)" mt={0} mb={8} />
        <div style={{ ...grid2chart, marginBottom: '14px' }}>
          <Suspense fallback={<TileSkeleton height={360} />}>
            <TradingViewChart height={360} />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={360} />}>
            <OrderBookTile />
          </Suspense>
        </div>
      </motion.div>

      {/* ── Market intelligence ── */}
      <motion.div variants={prefersReducedMotion ? {} : rowVariants}>
        <SectionHeader label="Market Intelligence" color="rgba(167,139,250,0.45)" mt={0} mb={8} />
        <div style={{ ...grid3, marginBottom: '14px' }}>
          <Suspense fallback={<TileSkeleton height={220} />}><HeatmapTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={220} />}><FundingRateTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={220} />}><LiquidationTile /></Suspense>
        </div>
      </motion.div>

      {/* ── WASM depth engine ── */}
      <motion.div variants={prefersReducedMotion ? {} : rowVariants}>
        <SectionHeader label="WASM Depth Engine — Zero-Copy" color="rgba(176,130,255,0.45)" mt={0} mb={8} />
        <div style={{ ...grid2, marginBottom: '14px' }}>
          <Suspense fallback={<TileSkeleton height={440} />}>
            <WasmOrderBook symbol="BTCUSDT" basePrice={btcPrice > 0 ? btcPrice : 67840} />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={440} />}>
            <WasmOrderBook symbol="ETHUSDT" basePrice={ethPrice > 0 ? ethPrice : 3521} />
          </Suspense>
        </div>
      </motion.div>

      {/* ── Protocol revenue + AI signals ── */}
      <motion.div variants={prefersReducedMotion ? {} : rowVariants}>
        <SectionHeader label="Protocol Revenue · AI Signals" color="rgba(34,255,170,0.45)" mt={0} mb={8} />
        <div style={{ ...grid2, marginBottom: '14px' }}>
          <Suspense fallback={<TileSkeleton height={380} />}><TokenTerminalTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={380} />}><AISignalTile /></Suspense>
        </div>
      </motion.div>

      {/* ── News ── */}
      <motion.div variants={prefersReducedMotion ? {} : rowVariants}>
        <SectionHeader label="Market News" color="rgba(80,80,100,0.5)" mt={0} mb={6} />
        <Suspense fallback={<TileSkeleton height={72} />}><NewsTickerTile /></Suspense>
      </motion.div>
    </motion.div>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
