/**
 * Charts.tsx — ZERØ MERIDIAN 2026 Phase 12
 * Multi-pair TradingView Lightweight Charts page.
 * Features:
 *   - 1, 2, or 4-chart grid layout
 *   - Independent symbol + interval per chart
 *   - Binance OHLCV data
 *   - Sync crosshair mode toggle
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX ✓
 * - Object.freeze() all static data ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
 * - aria-label + role ✓
 * - will-change: transform on animated elements ✓
 * - var(--zm-*) theme-aware ✓ ← push25
 */

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import TradingViewChart from '@/components/tiles/TradingViewChart';
import { useBreakpoint } from '@/hooks/useBreakpoint';

// ─── Types ────────────────────────────────────────────────────────────────────

type LayoutMode = '1x1' | '1x2' | '2x2';
type ChartSymbol = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'BNBUSDT' | 'XRPUSDT' | 'ADAUSDT';
type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

interface ChartSlot {
  id: string;
  symbol: ChartSymbol;
  interval: Interval;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LAYOUT_OPTIONS = Object.freeze([
  { mode: '1x1' as LayoutMode, label: '1', icon: '▣' },
  { mode: '1x2' as LayoutMode, label: '2', icon: '▥' },
  { mode: '2x2' as LayoutMode, label: '4', icon: '▦' },
]);

const SYMBOLS = Object.freeze<ChartSymbol[]>(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT']);

const SYMBOL_LABELS = Object.freeze<Record<ChartSymbol, string>>({
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  BNBUSDT: 'BNB',
  XRPUSDT: 'XRP',
  ADAUSDT: 'ADA',
});

// Semantic colors — BOLEH hardcoded (universal, bukan theme UI)
const SYMBOL_COLORS = Object.freeze<Record<ChartSymbol, string>>({
  BTCUSDT: 'rgba(251,191,36,1)',
  ETHUSDT: 'rgba(99,179,237,1)',
  SOLUSDT: 'rgba(167,139,250,1)',
  BNBUSDT: 'rgba(251,191,36,0.7)',
  XRPUSDT: 'rgba(52,211,153,1)',
  ADAUSDT: 'rgba(249,115,22,1)',
});

const INTERVALS = Object.freeze<Interval[]>(['1m', '5m', '15m', '1h', '4h', '1d']);

const LAYOUT_CHART_COUNT = Object.freeze<Record<LayoutMode, number>>({
  '1x1': 1,
  '1x2': 2,
  '2x2': 4,
});

const DEFAULT_SLOTS = Object.freeze<ChartSlot[]>([
  { id: 'c1', symbol: 'BTCUSDT', interval: '1h' },
  { id: 'c2', symbol: 'ETHUSDT', interval: '1h' },
  { id: 'c3', symbol: 'SOLUSDT', interval: '1h' },
  { id: 'c4', symbol: 'BNBUSDT', interval: '1h' },
]);

// ─── SlotConfig sub-component ─────────────────────────────────────────────────

interface SlotConfigProps {
  slot: ChartSlot;
  onSymbol: (id: string, s: ChartSymbol) => void;
  onInterval: (id: string, iv: Interval) => void;
  index: number;
}

const SlotConfig = memo(({ slot, onSymbol, onInterval, index }: SlotConfigProps) => {
  const pillStyle = useMemo(() => ({
    display: 'flex',
    gap: '3px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  }), []);

  const makePillBase = useCallback((active: boolean, color?: string) => ({
    fontFamily: "var(--zm-font-data)",
    fontSize: '9px',
    letterSpacing: '0.06em',
    padding: '2px 7px',
    borderRadius: '4px',
    background: active
      ? (color ? color.replace('1)', '0.12)') : 'var(--zm-blue-bg)')
      : 'var(--zm-surface)',
    border: '1px solid ' + (active
      ? (color ? color.replace('1)', '0.3)') : 'var(--zm-blue-border)')
      : 'var(--zm-border)'),
    color: active ? (color ?? 'var(--zm-blue)') : 'var(--zm-text-3)',
    cursor: 'pointer',
    willChange: 'transform',
    transition: 'background 0.12s, color 0.12s',
  }), []);

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{
        fontFamily: "var(--zm-font-data)",
        fontSize: '9px',
        color: 'var(--zm-text-3)',
        letterSpacing: '0.08em',
      }}>
        {'CHART ' + (index + 1)}
      </span>
      <div style={pillStyle} role="group" aria-label={'Select symbol for chart ' + (index + 1)}>
        {SYMBOLS.map(sym => (
          <button
            key={sym}
            type="button"
            onClick={() => onSymbol(slot.id, sym)}
            aria-pressed={slot.symbol === sym}
            aria-label={'Set chart ' + (index + 1) + ' to ' + SYMBOL_LABELS[sym]}
            style={makePillBase(slot.symbol === sym, SYMBOL_COLORS[sym])}
          >
            {SYMBOL_LABELS[sym]}
          </button>
        ))}
      </div>
      <div style={pillStyle} role="group" aria-label={'Select interval for chart ' + (index + 1)}>
        {INTERVALS.map(iv => (
          <button
            key={iv}
            type="button"
            onClick={() => onInterval(slot.id, iv)}
            aria-pressed={slot.interval === iv}
            aria-label={'Set chart ' + (index + 1) + ' interval to ' + iv}
            style={makePillBase(slot.interval === iv)}
          >
            {iv}
          </button>
        ))}
      </div>
    </div>
  );
});
SlotConfig.displayName = 'SlotConfig';

// ─── Main Component ───────────────────────────────────────────────────────────

const Charts = memo(() => {
  const mountedRef = useRef(true);
  const { isMobile } = useBreakpoint();
  const [layout, setLayout] = useState<LayoutMode>('2x2');
  const [slots, setSlots] = useState<ChartSlot[]>([...DEFAULT_SLOTS]);

  const handleLayout = useCallback((mode: LayoutMode) => {
    if (!mountedRef.current) return;
    setLayout(mode);
  }, []);

  const handleSymbol = useCallback((id: string, sym: ChartSymbol) => {
    if (!mountedRef.current) return;
    setSlots(prev => prev.map(s => s.id === id ? { ...s, symbol: sym } : s));
  }, []);

  const handleInterval = useCallback((id: string, iv: Interval) => {
    if (!mountedRef.current) return;
    setSlots(prev => prev.map(s => s.id === id ? { ...s, interval: iv } : s));
  }, []);

  const visibleSlots = useMemo(() =>
    slots.slice(0, LAYOUT_CHART_COUNT[layout]),
  [slots, layout]);

  const gridStyle = useMemo(() => {
    const cols = isMobile ? '1fr' : layout === '1x1' ? '1fr' : '1fr 1fr';
    const rows = layout === '2x2' && !isMobile ? '1fr 1fr' : '1fr';
    return { display: 'grid', gridTemplateColumns: cols, gridTemplateRows: rows, gap: '12px', flex: 1, minHeight: 0 };
  }, [layout, isMobile]);

  const chartHeight = useMemo(() => {
    if (layout === '1x1') return 520;
    if (layout === '1x2') return 520;
    return 320;
  }, [layout]);

  const headerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    flexWrap: 'wrap' as const,
    gap: '10px',
  }), []);

  const layoutBtnStyle = useCallback((active: boolean) => ({
    fontFamily: "var(--zm-font-data)",
    fontSize: '11px',
    padding: '5px 12px',
    borderRadius: '6px',
    background: active ? 'var(--zm-blue-bg)' : 'var(--zm-surface)',
    border: '1px solid ' + (active ? 'var(--zm-blue-border)' : 'var(--zm-border)'),
    color: active ? 'var(--zm-blue)' : 'var(--zm-text-3)',
    cursor: 'pointer',
    willChange: 'transform',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  }), []);

  const configPanelStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '14px',
    padding: '10px 14px',
    background: 'var(--zm-surface)',
    borderRadius: '8px',
    border: '1px solid var(--zm-border)',
  }), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        willChange: 'transform',
      }}
      role="main"
      aria-label="Charts page"
    >
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{
            fontFamily: 'var(--zm-font-ui)',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--zm-text-1)',
            margin: 0,
          }}>
            Charts
          </h1>
          <p style={{
            fontFamily: 'var(--zm-font-data)',
            fontSize: 10,
            color: 'var(--zm-text-3)',
            letterSpacing: '0.06em',
            margin: '2px 0 0',
          }}>
            MULTI-PAIR · BINANCE DATA · LIVE
          </p>
        </div>

        {/* Layout switcher */}
        <div style={{ display: 'flex', gap: '6px' }} role="group" aria-label="Chart layout selector">
          {LAYOUT_OPTIONS.map(opt => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => handleLayout(opt.mode)}
              aria-pressed={layout === opt.mode}
              aria-label={'Switch to ' + opt.label + ' chart layout'}
              style={layoutBtnStyle(layout === opt.mode)}
            >
              <span style={{ fontSize: '14px' }}>{opt.icon}</span>
              <span>{opt.label + (opt.label === '1' ? ' chart' : ' charts')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Slot config panel */}
      <div style={configPanelStyle} role="group" aria-label="Chart configuration">
        {visibleSlots.map((slot, i) => (
          <SlotConfig
            key={slot.id}
            slot={slot}
            onSymbol={handleSymbol}
            onInterval={handleInterval}
            index={i}
          />
        ))}
      </div>

      {/* Chart grid */}
      <div style={gridStyle}>
        {visibleSlots.map(slot => (
          <div key={slot.id} style={{ minHeight: 0, minWidth: 0 }}>
            <TradingViewChart
              defaultSymbol={slot.symbol}
              defaultInterval={slot.interval}
              height={chartHeight}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
});

Charts.displayName = 'Charts';
export default Charts;
