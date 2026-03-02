/**
 * TradingViewChart.tsx — ZERØ MERIDIAN push135
 * AUDIT FIX: Replaced ALL dark/neon palette with Bloomberg Light
 *   - rgba(0,238,255,x)  → rgba(15,40,180,x)   [cyan → Bloomberg navy]
 *   - rgba(34,255,170,x) → rgba(0,155,95,x)     [neon green → Bloomberg green]
 *   - rgba(255,68,136,x) → rgba(208,35,75,x)    [neon pink → Bloomberg red]
 *   - rgba(5,7,13,x)     → rgba(248,249,252,x)  [dark bg → Bloomberg light]
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - JetBrains Mono ✓  AbortController ✓  mountedRef ✓  Object.freeze ✓
 */

import { memo, useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';

const FONT = "'JetBrains Mono', monospace";

const C = Object.freeze({
  accent:       'rgba(15,40,180,1)',
  positive:     'rgba(0,155,95,1)',
  negative:     'rgba(208,35,75,1)',
  textPrimary:  'rgba(8,12,40,1)',
  textFaint:    'rgba(110,120,160,1)',
  bgBase:       'rgba(248,249,252,1)',
  cardBg:       'rgba(255,255,255,1)',
  accentBg:     'rgba(15,40,180,0.07)',
  accentBorder: 'rgba(15,40,180,0.22)',
  glassBorder:  'rgba(15,40,100,0.10)',
  glassBg:      'rgba(248,249,252,0.85)',
});

type Iv  = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type Sym = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'BNBUSDT';

interface Candle { time: number; open: number; high: number; low: number; close: number; value: number; }
interface LWC { createChart(el: HTMLElement, o: Record<string, unknown>): LWCI; }
interface LWCI {
  addCandlestickSeries(o?: Record<string, unknown>): LWS;
  addHistogramSeries(o?: Record<string, unknown>): LWS;
  timeScale(): { fitContent(): void };
  resize(w: number, h: number): void;
  remove(): void;
}
interface LWS { setData(d: unknown[]): void; applyOptions(o: Record<string, unknown>): void; }

const SYMS: readonly Sym[] = Object.freeze(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']);
const IVS:  readonly Iv[]  = Object.freeze(['1m', '5m', '15m', '1h', '4h', '1d']);

const SYM_LABEL: Readonly<Record<Sym, string>> = Object.freeze({ BTCUSDT: 'BTC', ETHUSDT: 'ETH', SOLUSDT: 'SOL', BNBUSDT: 'BNB' });
const SYM_COLOR: Readonly<Record<Sym, string>> = Object.freeze({
  BTCUSDT: 'rgba(195,125,0,1)',
  ETHUSDT: 'rgba(15,40,180,1)',
  SOLUSDT: 'rgba(100,60,200,1)',
  BNBUSDT: 'rgba(200,90,0,1)',
});

const CDN = 'https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js';

async function fetchCandles(sym: Sym, iv: Iv, signal: AbortSignal): Promise<Candle[]> {
  try {
    const url = 'https://api.binance.com/api/v3/klines?symbol=' + sym + '&interval=' + iv + '&limit=300';
    const res = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : signal, ...( AbortSignal.timeout ? {} : { signal }) });
    if (!res.ok) return [];
    const raw = await res.json() as number[][];
    return raw.map(k => ({ time: Math.floor(k[0] / 1000), open: +k[1], high: +k[2], low: +k[3], close: +k[4], value: +k[5] }));
  } catch { return []; }
}

let lwReady = false, lwBusy = false;
const lwQ: ((lw: LWC) => void)[] = [];
function loadLW(): Promise<LWC> {
  return new Promise(resolve => {
    const win = window as unknown as Record<string, unknown>;
    if (lwReady && win['LightweightCharts']) { resolve(win['LightweightCharts'] as LWC); return; }
    lwQ.push(resolve);
    if (lwBusy) return;
    lwBusy = true;
    const s = document.createElement('script');
    s.src = CDN; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = () => {
      lwReady = true; lwBusy = false;
      const lw = win['LightweightCharts'] as LWC;
      lwQ.forEach(cb => cb(lw)); lwQ.length = 0;
    };
    document.head.appendChild(s);
  });
}

const TradingViewChart = memo(({ defaultSymbol = 'BTCUSDT' as Sym, defaultInterval = '1h' as Iv, height = 380 }) => {
  const mountedRef = useRef(true);
  const elRef      = useRef<HTMLDivElement>(null);
  const chartRef   = useRef<LWCI | null>(null);
  const candleRef  = useRef<LWS | null>(null);
  const volRef     = useRef<LWS | null>(null);
  const abortRef   = useRef<AbortController | null>(null);
  const roRef      = useRef<ResizeObserver | null>(null);

  const [sym,  setSym]  = useState<Sym>(defaultSymbol);
  const [iv,   setIv]   = useState<Iv>(defaultInterval);
  const [load, setLoad] = useState(true);
  const [last, setLast] = useState<number | null>(null);
  const [prev, setPrev] = useState<number | null>(null);
  const [err,  setErr]  = useState(false);

  const H = height - 70;

  useEffect(() => {
    mountedRef.current = true;
    let chart: LWCI | null = null;
    async function init() {
      const lw = await loadLW();
      if (!mountedRef.current || !elRef.current) return;
      chart = lw.createChart(elRef.current, {
        width: elRef.current.offsetWidth || 600, height: H,
        layout: {
          background: { color: 'rgba(0,0,0,0)' },
          textColor: C.textFaint,
          fontFamily: FONT, fontSize: 10,
        },
        grid: {
          vertLines: { color: 'rgba(15,40,100,0.06)', style: 1 },
          horzLines: { color: 'rgba(15,40,100,0.06)', style: 1 },
        },
        crosshair: {
          vertLine: { color: C.accentBorder, width: 1, style: 0 },
          horzLine: { color: C.accentBorder, width: 1, style: 0 },
        },
        timeScale: { borderColor: C.glassBorder, timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderColor: C.glassBorder },
        handleScroll: true, handleScale: true,
      });
      chartRef.current = chart;
      candleRef.current = chart.addCandlestickSeries({
        upColor:       C.positive,
        downColor:     C.negative,
        borderUpColor: C.positive,
        borderDownColor: C.negative,
        wickUpColor:   'rgba(0,155,95,0.55)',
        wickDownColor: 'rgba(208,35,75,0.55)',
      });
      volRef.current = chart.addHistogramSeries({
        color: C.accentBg, priceScaleId: 'vol', scaleMargins: { top: 0.85, bottom: 0 },
      });
      roRef.current = new ResizeObserver(() => {
        if (!mountedRef.current || !elRef.current || !chartRef.current) return;
        chartRef.current.resize(elRef.current.offsetWidth, H);
      });
      roRef.current.observe(elRef.current);
    }
    void init();
    return () => {
      mountedRef.current = false;
      roRef.current?.disconnect();
      if (chart) chart.remove();
      chartRef.current = candleRef.current = volRef.current = null;
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoad(true); setErr(false);
    async function loadData() {
      const candles = await fetchCandles(sym, iv, abortRef.current!.signal);
      if (!mountedRef.current) return;
      if (!candles.length) { setLoad(false); setErr(true); return; }
      if (candleRef.current && volRef.current) {
        candleRef.current.setData(candles.map(c => ({
          time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
        })));
        const col = SYM_COLOR[sym];
        volRef.current.setData(candles.map(c => ({
          time: c.time, value: c.value,
          color: c.close >= c.open ? col.replace('1)', '0.13)') : 'rgba(208,35,75,0.09)',
        })));
        chartRef.current?.timeScale().fitContent();
      }
      const lastC = candles[candles.length - 1];
      setLast(lastC.close);
      setPrev(candles.length >= 2 ? candles[candles.length - 2].close : lastC.open);
      setLoad(false);
    }
    void loadData();
    return () => { abortRef.current?.abort(); };
  }, [sym, iv]);

  const pct = useMemo(() => {
    if (last == null || prev == null || prev === 0) return null;
    return (last - prev) / prev * 100;
  }, [last, prev]);

  const onSym = useCallback((s: Sym) => { if (mountedRef.current) setSym(s); }, []);
  const onIv  = useCallback((i: Iv)  => { if (mountedRef.current) setIv(i); }, []);

  const btnBase = useMemo(() => ({
    fontFamily: FONT, cursor: 'pointer', borderRadius: '5px',
    willChange: 'transform' as const,
  }), []);

  const loadingOverlayStyle = useMemo(() => ({
    position: 'absolute' as const, inset: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(248,249,252,0.85)', borderRadius: '8px',
  }), []);

  const spinnerStyle = useMemo(() => ({
    width: '22px', height: '22px',
    border: '2px solid ' + C.accentBorder,
    borderTop: '2px solid ' + C.accent,
    borderRadius: '50%', animation: 'spin 0.75s linear infinite',
  }), []);

  const loadingLabelStyle = useMemo(() => ({
    fontFamily: FONT, fontSize: '9px', color: C.textFaint, letterSpacing: '0.12em',
  }), []);

  const liveBadgeStyle = useMemo(() => ({
    fontFamily: FONT, fontSize: '8px',
    color: C.positive,
    background: 'rgba(0,155,95,0.08)',
    border: '1px solid rgba(0,155,95,0.22)',
    borderRadius: '3px', padding: '2px 6px',
  }), []);

  const footerLabelStyle = useMemo(() => ({
    fontFamily: FONT, fontSize: '8px', color: 'rgba(15,40,100,0.28)', letterSpacing: '0.08em',
  }), []);

  return (
    <GlassCard style={{ padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '8px' }}>
        {/* Symbol selector */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {SYMS.map(s => (
            <button key={s} type="button" onClick={() => onSym(s)} aria-pressed={sym === s}
              style={{ ...btnBase, fontSize: '10px', letterSpacing: '0.06em', padding: '4px 10px',
                background: sym === s ? C.accentBg : 'rgba(15,40,100,0.03)',
                border: '1px solid ' + (sym === s ? C.accentBorder : C.glassBorder),
                color: sym === s ? SYM_COLOR[s] : C.textFaint,
              }}>
              {SYM_LABEL[s]}
            </button>
          ))}
        </div>
        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontFamily: FONT, fontSize: '17px', fontWeight: 700, color: SYM_COLOR[sym] }}>
            {last != null ? '$' + last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </span>
          {pct != null && (
            <span style={{ fontFamily: FONT, fontSize: '11px', color: pct >= 0 ? C.positive : C.negative }}>
              {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
            </span>
          )}
        </div>
        {/* Interval selector */}
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' as const }}>
          {IVS.map(i => (
            <button key={i} type="button" onClick={() => onIv(i)} aria-pressed={iv === i}
              style={{ ...btnBase, fontSize: '9px', padding: '3px 7px',
                background: iv === i ? C.accentBg : 'rgba(15,40,100,0.03)',
                border: '1px solid ' + (iv === i ? C.accentBorder : C.glassBorder),
                color: iv === i ? C.accent : C.textFaint,
              }}>
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: 'relative' as const }}>
        {load && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={loadingOverlayStyle}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px' }}>
              <div style={spinnerStyle} />
              <span style={loadingLabelStyle}>LOADING…</span>
            </div>
          </motion.div>
        )}
        {err && !load && (
          <div style={{ position: 'absolute' as const, inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: FONT, fontSize: '11px', color: C.negative }}>⚠ Chart unavailable</span>
          </div>
        )}
        <div ref={elRef} role="img" aria-label={'Chart ' + SYM_LABEL[sym] + ' ' + iv}
          style={{ width: '100%', height: H + 'px', minHeight: H + 'px', willChange: 'transform' }} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={footerLabelStyle}>LIGHTWEIGHT CHARTS · BINANCE DIRECT · PUSH135</span>
        <span style={liveBadgeStyle}>LIVE</span>
      </div>
    </GlassCard>
  );
});
TradingViewChart.displayName = 'TradingViewChart';
export default TradingViewChart;
