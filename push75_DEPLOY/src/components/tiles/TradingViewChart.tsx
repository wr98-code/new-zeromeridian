/**
 * TradingViewChart.tsx — ZERØ MERIDIAN push75
 *
 * FIX H-02 (push75): lightweight-charts TIDAK lagi load via CDN unpkg.
 *   SEBELUM: script injection runtime dari https://unpkg.com/lightweight-charts@4.2.0/...
 *   SESUDAH: import langsung dari npm package → bundle time, offline-safe, zero CDN dep.
 *
 * FIX H-03 (push75): /api/klines proxy DIHAPUS.
 *   SEBELUM: fetch('/api/klines?...') — proxy tidak ada di Vercel → 404
 *   SESUDAH: fetch('https://api.binance.com/api/v3/klines?...') — public REST, no CORS issue
 *            + diqueue via binanceQueue (rate limiter terpusat)
 *
 * React.memo + displayName ✓  rgba() only ✓
 * Zero template literals in JSX ✓  Object.freeze() ✓
 * mountedRef + AbortController ✓  useCallback/useMemo ✓
 */

import { memo, useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { createChart, IChartApi, ISeriesApi, ColorType, CrosshairMode } from 'lightweight-charts';
import GlassCard from '@/components/shared/GlassCard';
import { binanceQueue } from '@/lib/apiQueue';

// ─── Types ────────────────────────────────────────────────────────────────────

type Interval    = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type ChartSymbol = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'BNBUSDT';

interface Candle {
  time:  number;
  open:  number;
  high:  number;
  low:   number;
  close: number;
  value: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYMBOLS: readonly ChartSymbol[] = Object.freeze(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']);
const INTERVALS: readonly Interval[]  = Object.freeze(['1m', '5m', '15m', '1h', '4h', '1d']);
const LIMIT = 200;

const SYMBOL_LABELS: Readonly<Record<ChartSymbol, string>> = Object.freeze({
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  BNBUSDT: 'BNB',
});

const SYMBOL_COLORS: Readonly<Record<ChartSymbol, string>> = Object.freeze({
  BTCUSDT: 'rgba(251,191,36,1)',
  ETHUSDT: 'rgba(96,165,250,1)',
  SOLUSDT: 'rgba(52,211,153,1)',
  BNBUSDT: 'rgba(251,146,60,1)',
});

const CARD_STYLE = Object.freeze({
  padding:       '16px',
  display:       'flex',
  flexDirection: 'column' as const,
  gap:           '12px',
});

// ─── Data Fetcher — direct Binance REST via binanceQueue ──────────────────────

async function fetchCandles(
  symbol: ChartSymbol,
  interval: Interval,
  signal: AbortSignal,
): Promise<Candle[]> {
  return binanceQueue.enqueue(async () => {
    try {
      const url = 'https://api.binance.com/api/v3/klines'
        + '?symbol=' + symbol
        + '&interval=' + interval
        + '&limit=' + LIMIT;
      const res = await fetch(url, { signal });
      if (!res.ok) return [];
      const raw = await res.json() as number[][];
      return raw.map((k): Candle => ({
        time:  Math.floor(k[0] / 1000),
        open:  Number(k[1]),
        high:  Number(k[2]),
        low:   Number(k[3]),
        close: Number(k[4]),
        value: Number(k[5]),
      }));
    } catch {
      return [];
    }
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TradingViewChartProps {
  defaultSymbol?:   ChartSymbol;
  defaultInterval?: Interval;
  height?:          number;
}

const TradingViewChart = memo(({
  defaultSymbol   = 'BTCUSDT',
  defaultInterval = '1h',
  height          = 380,
}: TradingViewChartProps) => {
  const mountedRef   = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const candleRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volRef       = useRef<ISeriesApi<'Histogram'> | null>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const roRef        = useRef<ResizeObserver | null>(null);

  const [symbol,    setSymbol]    = useState<ChartSymbol>(defaultSymbol);
  const [interval,  setInterval]  = useState<Interval>(defaultInterval);
  const [loading,   setLoading]   = useState(true);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [lastClose, setLastClose] = useState<number | null>(null);

  const chartH = height - 60;

  // ── Init chart via npm import (bukan CDN) ──────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (!containerRef.current) return;

    const w = containerRef.current.offsetWidth || 600;

    const chart = createChart(containerRef.current, {
      width:  w,
      height: chartH,
      layout: {
        background:  { type: ColorType.Solid, color: 'rgba(0,0,0,0)' },
        textColor:   'rgba(148,163,184,0.5)',
        fontFamily:  "'JetBrains Mono', monospace",
        fontSize:    10,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)', style: 1 },
        horzLines: { color: 'rgba(255,255,255,0.04)', style: 1 },
      },
      crosshair: {
        mode:     CrosshairMode.Normal,
        vertLine: { color: 'rgba(255,255,255,0.15)', width: 1, style: 0 },
        horzLine: { color: 'rgba(255,255,255,0.15)', width: 1, style: 0 },
      },
      timeScale: {
        borderColor:    'rgba(255,255,255,0.06)',
        timeVisible:    true,
        secondsVisible: false,
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
      handleScroll: true,
      handleScale:  true,
    });

    chartRef.current = chart;

    candleRef.current = chart.addCandlestickSeries({
      upColor:         'rgba(52,211,153,1)',
      downColor:       'rgba(251,113,133,1)',
      borderUpColor:   'rgba(52,211,153,1)',
      borderDownColor: 'rgba(251,113,133,1)',
      wickUpColor:     'rgba(52,211,153,0.6)',
      wickDownColor:   'rgba(251,113,133,0.6)',
    });

    volRef.current = chart.addHistogramSeries({
      color:        'rgba(96,165,250,0.15)',
      priceScaleId: 'volume',
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    // ResizeObserver — chart ikut lebar kontainer
    roRef.current = new ResizeObserver(() => {
      if (!mountedRef.current || !containerRef.current || !chartRef.current) return;
      chartRef.current.resize(containerRef.current.offsetWidth, chartH);
    });
    roRef.current.observe(containerRef.current);

    return () => {
      mountedRef.current = false;
      roRef.current?.disconnect();
      chart.remove();
      chartRef.current  = null;
      candleRef.current = null;
      volRef.current    = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load data — direct Binance REST ──────────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    async function load(): Promise<void> {
      const candles = await fetchCandles(symbol, interval, abortRef.current!.signal);
      if (!mountedRef.current) return;
      if (candles.length === 0) { setLoading(false); return; }

      if (candleRef.current && volRef.current) {
        candleRef.current.setData(candles.map(c => ({
          time:  c.time as unknown as import('lightweight-charts').Time,
          open:  c.open,
          high:  c.high,
          low:   c.low,
          close: c.close,
        })));

        const color = SYMBOL_COLORS[symbol];
        volRef.current.setData(candles.map(c => ({
          time:  c.time as unknown as import('lightweight-charts').Time,
          value: c.value,
          color: c.close >= c.open
            ? color.replace('1)', '0.18)')
            : 'rgba(251,113,133,0.12)',
        })));

        chartRef.current?.timeScale().fitContent();
      }

      const last = candles[candles.length - 1];
      if (mountedRef.current) {
        setLastPrice(last.close);
        setLastClose(candles.length >= 2 ? candles[candles.length - 2].close : last.open);
        setLoading(false);
      }
    }

    void load();
    return () => { abortRef.current?.abort(); };
  }, [symbol, interval]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSymbol   = useCallback((sym: ChartSymbol) => {
    if (mountedRef.current) setSymbol(sym);
  }, []);

  const handleInterval = useCallback((iv: Interval) => {
    if (mountedRef.current) setInterval(iv);
  }, []);

  const priceChange = useMemo(() => {
    if (lastPrice == null || lastClose == null || lastClose === 0) return null;
    return (lastPrice - lastClose) / lastClose * 100;
  }, [lastPrice, lastClose]);

  // ── Styles (memoized, frozen) ─────────────────────────────────────────────
  const headerStyle = useMemo(() => Object.freeze({
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    flexWrap:       'wrap' as const,
    gap:            '8px',
  }), []);

  const priceStyle = useMemo(() => Object.freeze({
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      '18px',
    fontWeight:    700,
    color:         SYMBOL_COLORS[symbol],
    letterSpacing: '0.04em',
  }), [symbol]);

  const changeStyle = useMemo(() => Object.freeze({
    fontFamily:  "'JetBrains Mono', monospace",
    fontSize:    '11px',
    marginLeft:  '8px',
    color: priceChange == null
      ? 'rgba(148,163,184,0.5)'
      : priceChange >= 0 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)',
  }), [priceChange]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <GlassCard style={CARD_STYLE}>

      {/* ── Header ── */}
      <div style={headerStyle}>

        {/* Symbol selector */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {SYMBOLS.map(sym => (
            <button
              key={sym}
              type="button"
              onClick={() => handleSymbol(sym)}
              aria-pressed={symbol === sym}
              aria-label={'Switch to ' + SYMBOL_LABELS[sym]}
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '10px',
                letterSpacing: '0.08em',
                padding:       '4px 10px',
                borderRadius:  '5px',
                cursor:        'pointer',
                background:    symbol === sym ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.025)',
                border:        '1px solid ' + (symbol === sym
                  ? SYMBOL_COLORS[sym].replace('1)', '0.4)')
                  : 'rgba(255,255,255,0.06)'),
                color:      symbol === sym ? SYMBOL_COLORS[sym] : 'rgba(148,163,184,0.5)',
                willChange: 'transform',
              }}
            >
              {SYMBOL_LABELS[sym]}
            </button>
          ))}
        </div>

        {/* Price display */}
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={priceStyle}>
            {lastPrice != null
              ? '$' + lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '—'}
          </span>
          {priceChange != null && (
            <span style={changeStyle}>
              {(priceChange >= 0 ? '+' : '') + priceChange.toFixed(2) + '%'}
            </span>
          )}
        </div>

        {/* Interval selector */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
          {INTERVALS.map(iv => (
            <button
              key={iv}
              type="button"
              onClick={() => handleInterval(iv)}
              aria-pressed={interval === iv}
              aria-label={'Interval ' + iv}
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '9px',
                letterSpacing: '0.06em',
                padding:       '3px 7px',
                borderRadius:  '4px',
                cursor:        'pointer',
                background:    interval === iv ? 'rgba(96,165,250,0.14)' : 'rgba(255,255,255,0.025)',
                border:        '1px solid ' + (interval === iv
                  ? 'rgba(96,165,250,0.3)'
                  : 'rgba(255,255,255,0.06)'),
                color:      interval === iv ? 'rgba(96,165,250,1)' : 'rgba(148,163,184,0.4)',
                willChange: 'transform',
              }}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart container ── */}
      <div style={{ position: 'relative' as const }}>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position:       'absolute' as const,
              inset:          0,
              zIndex:         10,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              background:     'rgba(0,0,0,0.3)',
              borderRadius:   '6px',
            }}
          >
            <span style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '10px',
              color:         'rgba(148,163,184,0.5)',
              letterSpacing: '0.1em',
            }}>
              LOADING...
            </span>
          </motion.div>
        )}
        <div
          ref={containerRef}
          style={{ width: '100%', height: chartH + 'px', minHeight: chartH + 'px' }}
          role="img"
          aria-label={'Chart ' + SYMBOL_LABELS[symbol] + ' ' + interval}
        />
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      '8px',
          color:         'rgba(148,163,184,0.2)',
          letterSpacing: '0.08em',
        }}>
          LIGHTWEIGHT CHARTS (NPM) · BINANCE REST
        </div>
        <div style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      '8px',
          color:         'rgba(52,211,153,0.5)',
          background:    'rgba(52,211,153,0.06)',
          border:        '1px solid rgba(52,211,153,0.12)',
          borderRadius:  '3px',
          padding:       '2px 6px',
          letterSpacing: '0.06em',
        }}>
          push75
        </div>
      </div>

    </GlassCard>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
export default TradingViewChart;
