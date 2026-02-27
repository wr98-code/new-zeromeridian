/**
 * Dashboard.tsx — ZERØ MERIDIAN v30
 * Bloomberg-grade dashboard — CSS variables, price flash, dense layout
 */

import React, { Suspense, memo, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Skeleton from '../components/shared/Skeleton';
import { useCrypto } from '@/contexts/CryptoContext';
import { formatPrice, formatCompact, REGIME_CONFIG, SIGNAL_CONFIG } from '@/lib/formatters';
import type { MarketRegime, AISignal } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import GlassCard from '../components/shared/GlassCard';
import MetricCard from '../components/shared/MetricCard';
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

// ── Binance WS ──────────────────────────────────────────────────────────────

interface WsPrice { price: number; change: number; }
type WsPriceMap = Record<string, WsPrice>;

const WS_SYMBOLS = Object.freeze([
  'BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT',
  'DOGEUSDT','ADAUSDT','AVAXUSDT','DOTUSDT','MATICUSDT',
]);

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
      ws.onclose = () => { if (mountRef.current) setTimeout(connect, 3000); };
    }
    connect();
    return () => { mountRef.current = false; wsRef.current?.close(); };
  }, []); // eslint-disable-line
  return prices;
}

// ── Config ──────────────────────────────────────────────────────────────────

interface MetricCfg {
  label: string; assetId: string; wsSymbol?: string; accent: string;
}

const METRICS: readonly MetricCfg[] = Object.freeze([
  { label: 'BTC / USD',  assetId: 'bitcoin',    wsSymbol: 'BTCUSDT', accent: 'var(--zm-amber)'  },
  { label: 'ETH / USD',  assetId: 'ethereum',   wsSymbol: 'ETHUSDT', accent: 'var(--zm-blue)'   },
  { label: 'SOL / USD',  assetId: 'solana',     wsSymbol: 'SOLUSDT', accent: 'var(--zm-violet)' },
  { label: 'Total MCap', assetId: '_mcap',                            accent: 'var(--zm-green)'  },
  { label: '24h Volume', assetId: '_volume',                          accent: 'var(--zm-blue)'   },
  { label: 'BTC Dom.',   assetId: '_dominance',                       accent: 'var(--zm-amber)'  },
]);

const TICKER_ASSETS = Object.freeze([
  { symbol: 'BTC',  ws: 'BTCUSDT',   id: 'bitcoin'       },
  { symbol: 'ETH',  ws: 'ETHUSDT',   id: 'ethereum'      },
  { symbol: 'SOL',  ws: 'SOLUSDT',   id: 'solana'        },
  { symbol: 'BNB',  ws: 'BNBUSDT',   id: 'binancecoin'   },
  { symbol: 'XRP',  ws: 'XRPUSDT',   id: 'ripple'        },
  { symbol: 'DOGE', ws: 'DOGEUSDT',  id: 'dogecoin'      },
  { symbol: 'ADA',  ws: 'ADAUSDT',   id: 'cardano'       },
  { symbol: 'AVAX', ws: 'AVAXUSDT',  id: 'avalanche-2'   },
  { symbol: 'DOT',  ws: 'DOTUSDT',   id: 'polkadot'      },
  { symbol: 'MATIC',ws: 'MATICUSDT', id: 'matic-network' },
]);

// ── Tile skeleton ────────────────────────────────────────────────────────────

const TileSkeleton = memo(({ height = 280 }: { height?: number }) => (
  <div style={{
    height,
    borderRadius: 'var(--zm-card-radius)',
    background: 'var(--zm-surface)',
    border: '1px solid var(--zm-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Skeleton.Card />
  </div>
));
TileSkeleton.displayName = 'TileSkeleton';

// ── Regime / Signal badges ───────────────────────────────────────────────────

const REGIME_STYLES = Object.freeze({
  SURGE: { color: 'var(--zm-cyan)',  bg: 'var(--zm-cyan-bg)',  border: 'var(--zm-cyan-border)'  },
  BULL:  { color: 'var(--zm-green)', bg: 'var(--zm-green-bg)', border: 'var(--zm-green-border)' },
  CRAB:  { color: 'var(--zm-text-2)',bg: 'var(--zm-surface)',   border: 'var(--zm-border)'       },
  BEAR:  { color: 'var(--zm-red)',   bg: 'var(--zm-red-bg)',   border: 'var(--zm-red-border)'   },
} as const);

const SIGNAL_STYLES = Object.freeze({
  STRONG_BUY:  { color: 'var(--zm-green)', bg: 'var(--zm-green-bg)', border: 'var(--zm-green-border)' },
  BUY:         { color: 'var(--zm-green)', bg: 'var(--zm-green-bg)', border: 'var(--zm-green-border)' },
  NEUTRAL:     { color: 'var(--zm-text-2)',bg: 'var(--zm-surface)',   border: 'var(--zm-border)'       },
  SELL:        { color: 'var(--zm-red)',   bg: 'var(--zm-red-bg)',   border: 'var(--zm-red-border)'   },
  STRONG_SELL: { color: 'var(--zm-red)',   bg: 'var(--zm-red-bg)',   border: 'var(--zm-red-border)'   },
} as const);

const Badge = memo(({ text, style }: {
  text: string;
  style: { color: string; bg: string; border: string };
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 5,
    background: style.bg, border: '1px solid ' + style.border,
    fontFamily: 'var(--zm-font-data)', fontSize: 9, fontWeight: 700,
    color: style.color, letterSpacing: '0.08em', flexShrink: 0,
  }}>
    <div style={{ width: 4, height: 4, borderRadius: '50%', background: style.color, flexShrink: 0 }} />
    {text}
  </div>
));
Badge.displayName = 'Badge';

// ── Live Clock ───────────────────────────────────────────────────────────────

const LiveClock = memo(() => {
  const mountedRef = useRef(true);
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })
  );
  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => {
      if (mountedRef.current)
        setTime(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }));
    }, 1000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <motion.div
        style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--zm-green)', flexShrink: 0 }}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span style={{
        fontFamily: 'var(--zm-font-data)', fontSize: 10,
        color: 'var(--zm-text-3)', letterSpacing: '0.06em',
      }}>
        {time} UTC
      </span>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

// ── Ticker chip ──────────────────────────────────────────────────────────────

const TickerChip = memo(({ symbol, price, change, sparkline }: {
  symbol: string; price: number; change: number; sparkline: number[];
}) => {
  const pos = change >= 0;
  return (
    <div className="zm-card" style={{
      flex: '0 0 auto',
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      minWidth: 140,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontFamily: 'var(--zm-font-data)', fontSize: 9, fontWeight: 700,
          color: 'var(--zm-text-3)', letterSpacing: '0.1em',
        }}>
          {symbol}
        </span>
        <span style={{
          fontFamily: 'var(--zm-font-data)', fontSize: 13, fontWeight: 700,
          color: 'var(--zm-text-1)',
        }}>
          {formatPrice(price)}
        </span>
      </div>
      {sparkline.length >= 2 && (
        <SparklineChart data={sparkline} width={44} height={22} color="auto" />
      )}
      <span style={{
        fontFamily: 'var(--zm-font-data)', fontSize: 10, fontWeight: 600,
        color: pos ? 'var(--zm-green)' : 'var(--zm-red)',
        whiteSpace: 'nowrap',
      }}>
        {(pos ? '+' : '') + change.toFixed(2) + '%'}
      </span>
    </div>
  );
});
TickerChip.displayName = 'TickerChip';

const AssetTicker = memo(({ wsMap }: { wsMap: WsPriceMap }) => {
  const { assets } = useCrypto();
  const chips = useMemo(() =>
    TICKER_ASSETS.map(t => {
      const ws    = wsMap[t.ws];
      const asset = assets.find(a => a.id === t.id);
      return {
        ...t,
        price:     ws ? ws.price  : (asset?.price    ?? 0),
        change:    ws ? ws.change : (asset?.change24h ?? 0),
        sparkline: asset?.sparkline ?? [],
      };
    }),
    [wsMap, assets]
  );
  if (chips.every(c => c.price === 0)) return null;
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
      {chips.map(c => (
        <TickerChip key={c.ws} symbol={c.symbol} price={c.price} change={c.change} sparkline={c.sparkline} />
      ))}
    </div>
  );
});
AssetTicker.displayName = 'AssetTicker';

// ── Live Metric ──────────────────────────────────────────────────────────────

const LiveMetric = memo(({ cfg, wsPrice }: { cfg: MetricCfg; wsPrice?: WsPrice }) => {
  const { assets } = useCrypto();
  const { value, change } = useMemo(() => {
    if (wsPrice && cfg.wsSymbol)
      return { value: formatPrice(wsPrice.price), change: wsPrice.change };
    if (cfg.assetId === '_mcap') {
      const t = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
      return t > 0 ? { value: formatCompact(t), change: 0 } : { value: '—', change: 0 };
    }
    if (cfg.assetId === '_volume') {
      const t = assets.reduce((s, a) => s + (a.volume24h ?? 0), 0);
      return t > 0 ? { value: formatCompact(t), change: 0 } : { value: '—', change: 0 };
    }
    if (cfg.assetId === '_dominance') {
      const btc   = assets.find(a => a.id === 'bitcoin');
      const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
      if (btc && total > 0)
        return { value: ((btc.marketCap / total) * 100).toFixed(1) + '%', change: 0 };
      return { value: '—', change: 0 };
    }
    const asset = assets.find(a => a.id === cfg.assetId);
    if (!asset) return { value: '—', change: 0 };
    return { value: formatPrice(asset.price), change: asset.change24h ?? 0 };
  }, [assets, cfg, wsPrice]);

  return (
    <MetricCard
      label={cfg.label}
      value={value}
      change={change !== 0 ? change : undefined}
      accentColor={cfg.accent}
    />
  );
});
LiveMetric.displayName = 'LiveMetric';

// ── Section Label ────────────────────────────────────────────────────────────

const SectionLabel = memo(({ label }: { label: string }) => (
  <div className="zm-section-label">{label}</div>
));
SectionLabel.displayName = 'SectionLabel';

// ── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = memo(() => {
  const prefersReducedMotion = useReducedMotion();
  const { isMobile, isTablet } = useBreakpoint();
  const { assets, fearGreed, regime, signal } = useCrypto();
  const wsMap = useBinanceWS(WS_SYMBOLS);

  const btcPrice = wsMap['BTCUSDT']?.price ?? 0;
  const ethPrice = wsMap['ETHUSDT']?.price ?? 0;

  const grid6 = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(6,1fr)',
    gap: 12,
  }), [isMobile, isTablet]);

  const grid2chart = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
    gap: 12,
  }), [isMobile]);

  const grid3 = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
    gap: 12,
  }), [isMobile, isTablet]);

  const grid2 = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: 12,
  }), [isMobile]);

  const fgColor = useMemo(() => {
    const v = fearGreed.value;
    if (v <= 25) return 'var(--zm-red)';
    if (v <= 45) return 'var(--zm-amber)';
    if (v <= 55) return 'var(--zm-text-2)';
    return 'var(--zm-green)';
  }, [fearGreed.value]);

  return (
    <div role="main" aria-label="ZERØ MERIDIAN Dashboard" style={{ paddingBottom: 40 }}>

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--zm-font-ui)',
            fontSize:   isMobile ? 20 : 24,
            fontWeight: 700,
            color:      'var(--zm-text-1)',
            margin:     0, letterSpacing: '-0.02em',
          }}>
            Dashboard
          </h1>
          <p style={{
            fontFamily: 'var(--zm-font-data)', fontSize: 10,
            color: 'var(--zm-text-3)', margin: '3px 0 0', letterSpacing: '0.06em',
          }}>
            Crypto Intelligence Terminal
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <Badge text={REGIME_CONFIG[regime].label}  style={REGIME_STYLES[regime]} />
          <Badge text={SIGNAL_CONFIG[signal].label}  style={SIGNAL_STYLES[signal]} />
          {fearGreed.value > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 5,
              background: 'var(--zm-surface)', border: '1px solid var(--zm-border)',
            }}>
              <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, color: 'var(--zm-text-3)' }}>F&G</span>
              <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 12, fontWeight: 700, color: fgColor }}>
                {fearGreed.value}
              </span>
              <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, color: fgColor, opacity: 0.8 }}>
                {fearGreed.label}
              </span>
            </div>
          )}
          <LiveClock />
        </div>
      </div>

      {/* Ticker row */}
      <div style={{ marginBottom: 28 }}>
        <AssetTicker wsMap={wsMap} />
      </div>

      {/* 6 metric cards */}
      <SectionLabel label="Key Metrics — Live" />
      <div style={grid6}>
        {METRICS.map(cfg => (
          <LiveMetric key={cfg.assetId} cfg={cfg} wsPrice={cfg.wsSymbol ? wsMap[cfg.wsSymbol] : undefined} />
        ))}
      </div>

      {/* Chart + order book */}
      <SectionLabel label="Price Action" />
      <div style={grid2chart}>
        <Suspense fallback={<TileSkeleton height={380} />}>
          <TradingViewChart height={380} />
        </Suspense>
        <Suspense fallback={<TileSkeleton height={380} />}>
          <OrderBookTile />
        </Suspense>
      </div>

      {/* Market intelligence */}
      <SectionLabel label="Market Intelligence" />
      <div style={grid3}>
        <Suspense fallback={<TileSkeleton height={220} />}><HeatmapTile /></Suspense>
        <Suspense fallback={<TileSkeleton height={220} />}><FundingRateTile /></Suspense>
        <Suspense fallback={<TileSkeleton height={220} />}><LiquidationTile /></Suspense>
      </div>

      {/* WASM Depth */}
      <SectionLabel label="Order Flow Depth" />
      <div style={grid2}>
        <Suspense fallback={<TileSkeleton height={380} />}>
          <WasmOrderBook symbol="BTCUSDT" basePrice={btcPrice > 0 ? btcPrice : 67840} />
        </Suspense>
        <Suspense fallback={<TileSkeleton height={380} />}>
          <WasmOrderBook symbol="ETHUSDT" basePrice={ethPrice > 0 ? ethPrice : 3521} />
        </Suspense>
      </div>

      {/* Protocol Revenue + AI */}
      <SectionLabel label="Protocol Revenue · AI Signals" />
      <div style={grid2}>
        <Suspense fallback={<TileSkeleton height={340} />}><TokenTerminalTile /></Suspense>
        <Suspense fallback={<TileSkeleton height={340} />}><AISignalTile /></Suspense>
      </div>

      {/* News */}
      <SectionLabel label="Market News" />
      <Suspense fallback={<TileSkeleton height={64} />}><NewsTickerTile /></Suspense>

    </div>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
