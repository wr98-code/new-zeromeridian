/**
 * Markets.tsx — ZERØ MERIDIAN v30 push90
 * push90: Full v30 token migration, perf upgrades, image lazy loading
 * - React.memo + displayName ✓
 * - rgba() + var(--zm-*) v30 ✓
 * - useCallback + useMemo ✓
 * - will-change: transform on animated rows ✓
 * - loading="lazy" on all coin images ✓
 */

import { memo, useState, useCallback, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCrypto } from '@/contexts/CryptoContext';
import { useMarketWorker } from '@/hooks/useMarketWorker';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import VirtualList from '@/components/shared/VirtualList';
import SparklineChart from '@/components/shared/SparklineChart';
import { formatPrice, formatChange, formatCompact } from '@/lib/formatters';
import type { CryptoAsset } from '@/lib/formatters';

const TradingViewChart = lazy(() => import('../components/tiles/TradingViewChart'));
const OrderBookTile    = lazy(() => import('../components/tiles/OrderBookTile'));

type SortKey = 'rank' | 'name' | 'price' | 'change24h' | 'change7d' | 'marketCap' | 'volume24h';
type SortDir = 'asc' | 'desc';
type TVSymbol = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'BNBUSDT';

const ROW_HEIGHT        = 40;
const ROW_HEIGHT_MOBILE = 48;

const SYMBOL_MAP: Record<string, TVSymbol> = Object.freeze({
  bitcoin: 'BTCUSDT', ethereum: 'ETHUSDT', solana: 'SOLUSDT', binancecoin: 'BNBUSDT',
});

const ACCENT_MAP: Record<string, string> = Object.freeze({
  bitcoin:     'rgba(251,191,36,1)',
  ethereum:    'rgba(96,165,250,1)',
  solana:      'rgba(167,139,250,1)',
  binancecoin: 'rgba(251,146,60,1)',
  ripple:      'rgba(34,211,238,1)',
  cardano:     'rgba(52,211,153,1)',
  avalanche:   'rgba(251,113,133,1)',
  dogecoin:    'rgba(251,191,36,0.8)',
});

function getAccent(id: string): string { return ACCENT_MAP[id] ?? 'var(--zm-blue)'; }

const ArrowUp = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
    <path d="M4.5 1.5l-3 4h6l-3-4z" fill="var(--zm-blue)" />
  </svg>
);
const ArrowDown = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
    <path d="M4.5 7.5l-3-4h6l-3 4z" fill="var(--zm-blue)" />
  </svg>
);
const ArrowBoth = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
    <path d="M4.5 1l-2 2.5h4L4.5 1zM4.5 8l-2-2.5h4L4.5 8z" fill="currentColor" opacity="0.3" />
  </svg>
);

interface HeaderCellProps {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (key: SortKey) => void; width?: string | number; align?: 'left' | 'right';
}
const HeaderCell = memo(({ label, sortKey, current, dir, onSort, width = 'auto', align = 'right' }: HeaderCellProps) => {
  const isActive = current === sortKey;
  const color    = isActive ? 'var(--zm-blue)' : 'var(--zm-text-3)';
  return (
    <button type="button" onClick={() => onSort(sortKey)}
      aria-label={'Sort by ' + label}
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      style={{
        fontFamily: 'var(--zm-font-data)', fontSize: 10, textAlign: align,
        display: 'flex', alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        gap: 4, color, background: 'transparent', border: 'none', cursor: 'pointer',
        padding: 0, width, flexShrink: 0, letterSpacing: '0.06em', minHeight: 36,
      }}>
      {label}
      {isActive ? dir === 'asc' ? <ArrowUp /> : <ArrowDown /> : <ArrowBoth />}
    </button>
  );
});
HeaderCell.displayName = 'HeaderCell';

interface AssetRowProps {
  asset: CryptoAsset; index: number;
  isMobile: boolean; isTablet: boolean;
  selected: boolean; onClick: (asset: CryptoAsset) => void;
}

const AssetRow = memo(({ asset, index, isMobile, isTablet, selected, onClick }: AssetRowProps) => {
  const ref       = useRef<HTMLDivElement>(null);
  const prevPrice = useRef(asset.price);
  const mountRef  = useRef(true);

  useEffect(() => { mountRef.current = true; return () => { mountRef.current = false; }; }, []);

  useEffect(() => {
    if (!mountRef.current || !ref.current) return;
    if (asset.price === prevPrice.current) return;
    const cls = asset.priceDirection === 'up' ? 'animate-flash-pos'
      : asset.priceDirection === 'down' ? 'animate-flash-neg' : '';
    if (!cls) { prevPrice.current = asset.price; return; }
    ref.current.classList.remove('animate-flash-pos', 'animate-flash-neg');
    void ref.current.offsetWidth;
    ref.current.classList.add(cls);
    prevPrice.current = asset.price;
    const t = setTimeout(() => { if (mountRef.current) ref.current?.classList.remove(cls); }, 300);
    return () => clearTimeout(t);
  }, [asset.price, asset.priceDirection]);

  const accent        = getAccent(asset.id);
  const rowHeight     = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;
  const change24Color = asset.change24h >= 0 ? 'var(--zm-green)' : 'var(--zm-red)';
  const change7dColor = (asset.change7d ?? 0) >= 0 ? 'var(--zm-green)' : 'var(--zm-red)';
  const rowBg         = selected ? 'var(--zm-surface-active)'
    : index % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent';
  const handleClick   = useCallback(() => onClick(asset), [onClick, asset]);

  if (isMobile) {
    return (
      <div ref={ref} onClick={handleClick} role="button" tabIndex={0}
        aria-label={'View ' + asset.name + ' detail'}
        style={{
          height: rowHeight, background: rowBg, cursor: 'pointer',
          borderBottom: '1px solid var(--zm-border)',
          borderLeft: selected ? '2px solid ' + accent : '2px solid transparent',
          display: 'grid', gridTemplateColumns: '28px 1fr 90px 64px',
          alignItems: 'center', padding: '0 12px', gap: 8,
          willChange: 'transform', transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--zm-surface-hover)'; }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = rowBg; }}>
        <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 10, textAlign: 'right', color: 'var(--zm-text-3)' }}>{asset.rank}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {asset.image
            ? <img src={asset.image} alt="" loading="lazy" decoding="async" style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0 }} />
            : <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: accent + '33' }} />}
          <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--zm-text-1)' }}>
            {asset.symbol.toUpperCase()}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, textAlign: 'right', color: 'var(--zm-text-1)' }}>{formatPrice(asset.price)}</span>
        <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, textAlign: 'right', color: change24Color }}>{formatChange(asset.change24h)}</span>
      </div>
    );
  }

  return (
    <div ref={ref} onClick={handleClick} role="button" tabIndex={0}
      aria-label={'View ' + asset.name + ' detail'}
      style={{
        height: rowHeight, background: rowBg, cursor: 'pointer',
        borderBottom: '1px solid var(--zm-border)',
        borderLeft: selected ? '2px solid ' + accent : '2px solid transparent',
        display: 'flex', alignItems: 'center',
        padding: selected ? '0 16px 0 14px' : '0 16px',
        gap: 12, willChange: 'transform', transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--zm-surface-hover)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = rowBg; }}>

      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, width: 28, flexShrink: 0, textAlign: 'right', color: 'var(--zm-text-3)' }}>{asset.rank}</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: isTablet ? 170 : 150, flexShrink: 0 }}>
        {asset.image
          ? <img src={asset.image} alt="" loading="lazy" decoding="async" style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }} />
          : <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: accent + '33' }} />}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--zm-text-1)' }}>
            {asset.symbol.toUpperCase()}
          </span>
          <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--zm-text-3)' }}>
            {asset.name}
          </span>
        </div>
      </div>

      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, width: isTablet ? 115 : 100, flexShrink: 0, textAlign: 'right', color: 'var(--zm-text-1)' }}>
        {formatPrice(asset.price)}
      </span>
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, width: 72, flexShrink: 0, textAlign: 'right', color: change24Color }}>
        {formatChange(asset.change24h)}
      </span>
      {!isTablet && (
        <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, width: 72, flexShrink: 0, textAlign: 'right', color: change7dColor }}>
          {formatChange(asset.change7d ?? 0)}
        </span>
      )}
      <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, width: isTablet ? 115 : 100, flexShrink: 0, textAlign: 'right', color: 'var(--zm-text-2)' }}>
        {formatCompact(asset.marketCap)}
      </span>
      {!isTablet && (
        <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, width: 100, flexShrink: 0, textAlign: 'right', color: 'var(--zm-text-2)' }}>
          {formatCompact(asset.volume24h)}
        </span>
      )}
      {!isTablet && (
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {asset.sparkline && asset.sparkline.length > 1 && (
            <SparklineChart data={asset.sparkline} width={80} height={28} color="auto" />
          )}
        </div>
      )}
    </div>
  );
});
AssetRow.displayName = 'AssetRow';

interface StatBoxProps { label: string; value: string; color?: string; }
const StatBox = memo(({ label, value, color }: StatBoxProps) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 3,
    padding: '8px 10px', borderRadius: 8,
    background: 'var(--zm-surface)', border: '1px solid var(--zm-border)',
    flex: 1, minWidth: 0,
  }}>
    <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, color: 'var(--zm-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
      {label}
    </span>
    <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 12, fontWeight: 700, color: color ?? 'var(--zm-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
      {value}
    </span>
  </div>
));
StatBox.displayName = 'StatBox';

interface AssetDetailPanelProps {
  asset: CryptoAsset; onClose: () => void; isMobile: boolean; isTablet: boolean;
}

const AssetDetailPanel = memo(({ asset, onClose, isMobile, isTablet }: AssetDetailPanelProps) => {
  const prefersReducedMotion = useReducedMotion();
  const accent      = getAccent(asset.id);
  const tvSymbol    = SYMBOL_MAP[asset.id] as TVSymbol | undefined;
  const change24h   = asset.change24h;
  const isPos       = change24h >= 0;
  const changeColor = isPos ? 'var(--zm-green)' : 'var(--zm-red)';

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const panelVariants = {
    hidden:  { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 28, stiffness: 280 } },
    exit:    { x: '100%', opacity: 0, transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: [0.36, 0, 0.66, 0] } },
  };

  const panelWidth = isMobile ? '100vw' : isTablet ? '380px' : '480px';
  const accentBorder = accent.replace('1)', '0.22)');

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(4,5,10,0.65)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        aria-label="Close panel"
      />
      <motion.div
        variants={panelVariants} initial="hidden" animate="visible" exit="exit"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: panelWidth,
          zIndex: 201, background: 'var(--zm-bg-2)',
          borderLeft: '1px solid ' + accentBorder,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', willChange: 'transform',
        }}
        role="dialog" aria-label={'Asset detail: ' + asset.name} aria-modal="true"
      >
        <div style={{
          padding: '16px 20px 12px', borderBottom: '1px solid var(--zm-border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0, background: 'var(--zm-bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {asset.image
              ? <img src={asset.image} alt="" loading="lazy" decoding="async" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: '1px solid ' + accentBorder }} />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: accent + '20' }} />}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 16, fontWeight: 700, color: 'var(--zm-text-1)', letterSpacing: '0.04em' }}>{asset.symbol.toUpperCase()}</span>
                <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 11, color: 'var(--zm-text-3)' }}>{asset.name}</span>
                <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'var(--zm-surface)', color: 'var(--zm-text-2)' }}>{'#' + asset.rank}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
                <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 22, fontWeight: 700, color: accent, letterSpacing: '0.02em' }}>{formatPrice(asset.price)}</span>
                <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 12, color: changeColor, fontWeight: 600 }}>{isPos ? '+' : ''}{change24h.toFixed(2)}%</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close panel"
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'var(--zm-surface)', border: '1px solid var(--zm-border)',
              color: 'var(--zm-text-2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 300, willChange: 'transform',
            }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <StatBox label="24h High"    value={formatPrice(asset.high24h ?? asset.price)} />
            <StatBox label="24h Low"     value={formatPrice(asset.low24h  ?? asset.price)} />
            <StatBox label="7d Change"   value={formatChange(asset.change7d ?? 0)} color={(asset.change7d ?? 0) >= 0 ? 'var(--zm-green)' : 'var(--zm-red)'} />
            <StatBox label="Mkt Cap"     value={formatCompact(asset.marketCap)} />
            <StatBox label="Volume 24h"  value={formatCompact(asset.volume24h)} />
            <StatBox label="Circ Supply" value={formatCompact(asset.circulatingSupply)} />
          </div>
          {asset.ath && (
            <div style={{ display: 'flex', gap: 8 }}>
              <StatBox label="All-Time High" value={formatPrice(asset.ath)} color="var(--zm-amber)" />
            </div>
          )}
          {asset.sparkline && asset.sparkline.length > 1 && (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--zm-surface)', border: '1px solid var(--zm-border)' }}>
              <div style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, color: 'var(--zm-text-3)', letterSpacing: '0.1em', marginBottom: 8 }}>7D PRICE CHART</div>
              <SparklineChart data={asset.sparkline} width={isMobile ? 300 : 340} height={60} color={accent} />
            </div>
          )}
          {tvSymbol ? (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--zm-border)' }}>
              <div style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, color: 'var(--zm-text-3)', letterSpacing: '0.1em', padding: '10px 14px 0' }}>LIVE CANDLESTICK</div>
              <Suspense fallback={<div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 10, color: 'var(--zm-text-3)' }}>Loading chart...</span></div>}>
                <TradingViewChart defaultSymbol={tvSymbol} height={300} />
              </Suspense>
            </div>
          ) : (
            <div style={{ padding: '20px', borderRadius: 10, textAlign: 'center', background: 'var(--zm-surface)', border: '1px solid var(--zm-border)' }}>
              <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 10, color: 'var(--zm-text-3)' }}>Live chart available for BTC · ETH · SOL · BNB</span>
            </div>
          )}
          {tvSymbol && (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--zm-border)' }}>
              <div style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, color: 'var(--zm-text-3)', letterSpacing: '0.1em', padding: '10px 14px 6px' }}>ORDER BOOK</div>
              <Suspense fallback={<div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 10, color: 'var(--zm-text-3)' }}>Loading...</span></div>}>
                <OrderBookTile />
              </Suspense>
            </div>
          )}
          <a href={'https://www.binance.com/en/trade/' + asset.symbol.toUpperCase() + '_USDT'}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px', borderRadius: 8, background: 'var(--zm-amber-bg)',
              border: '1px solid var(--zm-amber-border)', color: 'var(--zm-amber)',
              textDecoration: 'none', fontFamily: 'var(--zm-font-data)',
              fontSize: 11, letterSpacing: '0.08em', marginBottom: 8,
            }}>
            <span>TRADE ON BINANCE</span>
            <span style={{ opacity: 0.6 }}>↗</span>
          </a>
        </div>
      </motion.div>
    </>
  );
});
AssetDetailPanel.displayName = 'AssetDetailPanel';

// ─── Markets Page ─────────────────────────────────────────────────────────────
const Markets = memo(() => {
  const { assets }             = useCrypto();
  const worker                 = useMarketWorker();
  const { isMobile, isTablet } = useBreakpoint();

  const [query,         setQuery]         = useState('');
  const [sortKey,       setSortKey]       = useState<SortKey>('rank');
  const [sortDir,       setSortDir]       = useState<SortDir>('asc');
  const [filtered,      setFiltered]      = useState<CryptoAsset[]>(assets);
  const [isWorking,     setIsWorking]     = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (assets.length === 0) return;
    setIsWorking(true);
    worker.sortAndFilter(assets, sortKey, sortDir, query)
      .then(result => { if (!mountedRef.current) return; setFiltered(result.assets); })
      .catch(() => {
        if (!mountedRef.current) return;
        const q = query.toLowerCase();
        const list = assets.filter(a => !q || a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
        list.sort((a, b) => {
          const mul = sortDir === 'asc' ? 1 : -1;
          if (sortKey === 'name') return mul * a.name.localeCompare(b.name);
          return mul * ((a[sortKey] as number ?? 0) - (b[sortKey] as number ?? 0));
        });
        setFiltered(list);
      })
      .finally(() => { if (mountedRef.current) setIsWorking(false); });
  }, [assets, sortKey, sortDir, query, worker]);

  const handleSort        = useCallback((key: SortKey) => {
    setSortKey(prev => { if (prev === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else setSortDir('desc'); return key; });
  }, []);
  const handleSearch      = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); }, []);
  const handleSelectAsset = useCallback((asset: CryptoAsset) => { setSelectedAsset(prev => prev?.id === asset.id ? null : asset); }, []);
  const handleClosePanel  = useCallback(() => { setSelectedAsset(null); }, []);

  const rowHeight  = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;
  const renderRow  = useCallback((asset: CryptoAsset, index: number) => (
    <AssetRow asset={asset} index={index} isMobile={isMobile} isTablet={isTablet}
      selected={selectedAsset?.id === asset.id} onClick={handleSelectAsset} />
  ), [isMobile, isTablet, selectedAsset?.id, handleSelectAsset]);
  const getKey     = useCallback((asset: CryptoAsset) => asset.id, []);
  const listHeight = useMemo(() => Math.min(window.innerHeight - 240, filtered.length * rowHeight), [filtered.length, rowHeight]);

  const headerRow = useMemo(() => {
    const base = {
      position: 'sticky' as const, top: 0, zIndex: 10,
      height: 36, background: 'var(--zm-bg)',
      borderBottom: '1px solid var(--zm-border)',
      backdropFilter: 'blur(12px)',
    };
    if (isMobile) return (
      <div style={{ ...base, display: 'grid', gridTemplateColumns: '28px 1fr 90px 64px', alignItems: 'center', padding: '0 12px', gap: 8 }}>
        <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 9, color: 'var(--zm-text-3)', textAlign: 'right' }}>#</span>
        <HeaderCell label="Asset"  sortKey="name"      current={sortKey} dir={sortDir} onSort={handleSort} width="100%" align="left" />
        <HeaderCell label="Price"  sortKey="price"     current={sortKey} dir={sortDir} onSort={handleSort} width={90} />
        <HeaderCell label="24h"    sortKey="change24h" current={sortKey} dir={sortDir} onSort={handleSort} width={64} />
      </div>
    );
    if (isTablet) return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
        <span style={{ width: 28, flexShrink: 0 }} />
        <span style={{ width: 170, flexShrink: 0 }}>
          <HeaderCell label="Asset"  sortKey="name"      current={sortKey} dir={sortDir} onSort={handleSort} width={170} align="left" />
        </span>
        <HeaderCell label="Price"   sortKey="price"     current={sortKey} dir={sortDir} onSort={handleSort} width={115} />
        <HeaderCell label="24h"     sortKey="change24h" current={sortKey} dir={sortDir} onSort={handleSort} width={72} />
        <HeaderCell label="Mkt Cap" sortKey="marketCap" current={sortKey} dir={sortDir} onSort={handleSort} width={115} />
      </div>
    );
    return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
        <span style={{ width: 28, flexShrink: 0 }} />
        <span style={{ width: 150, flexShrink: 0 }}>
          <HeaderCell label="Asset"   sortKey="name"      current={sortKey} dir={sortDir} onSort={handleSort} width={150} align="left" />
        </span>
        <HeaderCell label="Price"    sortKey="price"     current={sortKey} dir={sortDir} onSort={handleSort} width={100} />
        <HeaderCell label="24h"      sortKey="change24h" current={sortKey} dir={sortDir} onSort={handleSort} width={72} />
        <HeaderCell label="7d"       sortKey="change7d"  current={sortKey} dir={sortDir} onSort={handleSort} width={72} />
        <HeaderCell label="Mkt Cap"  sortKey="marketCap" current={sortKey} dir={sortDir} onSort={handleSort} width={100} />
        <HeaderCell label="Volume"   sortKey="volume24h" current={sortKey} dir={sortDir} onSort={handleSort} width={100} />
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--zm-font-data)', fontSize: 10, color: 'var(--zm-text-3)', letterSpacing: '0.06em' }}>7d Chart</span>
      </div>
    );
  }, [isMobile, isTablet, sortKey, sortDir, handleSort]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }} role="main" aria-label="Live Markets">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, fontFamily: 'var(--zm-font-ui)', color: 'var(--zm-text-1)', letterSpacing: '-0.02em', margin: 0 }}>
            Live Markets
          </h1>
          <span style={{ fontSize: 11, fontFamily: 'var(--zm-font-data)', padding: '2px 8px', borderRadius: 4, background: 'var(--zm-green-bg)', color: 'var(--zm-green)', border: '1px solid var(--zm-green-border)' }}>
            {filtered.length + ' assets'}
          </span>
          {isWorking && <span style={{ fontSize: 11, fontFamily: 'var(--zm-font-data)', color: 'var(--zm-text-3)' }}>sorting...</span>}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8,
          background: 'var(--zm-surface)', border: '1px solid var(--zm-border)',
          minWidth: isMobile ? '100%' : 200, minHeight: isMobile ? 48 : 'auto',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>
          <input type="search" placeholder="Search assets..." value={query} onChange={handleSearch} aria-label="Search assets"
            style={{ background: 'transparent', outline: 'none', border: 'none', fontFamily: 'var(--zm-font-data)', fontSize: 12, flex: 1, color: 'var(--zm-text-1)', WebkitAppearance: 'none' }} />
        </div>
      </div>

      <div style={{ background: 'var(--zm-surface)', border: '1px solid var(--zm-border)', borderRadius: 12, overflow: 'hidden' }}>
        {headerRow}

        {!selectedAsset && filtered.length > 0 && (
          <div style={{ padding: '5px 16px', fontFamily: 'var(--zm-font-data)', fontSize: 9, color: 'var(--zm-text-3)', letterSpacing: '0.06em', borderBottom: '1px solid var(--zm-border)', background: 'var(--zm-blue-bg)' }}>
            {'← click any row to view detail chart & order book'}
          </div>
        )}

        <VirtualList items={filtered} itemHeight={rowHeight} height={listHeight || 400} overscan={5} renderItem={renderRow} getKey={getKey} />
      </div>

      <AnimatePresence>
        {selectedAsset && (
          <AssetDetailPanel key={selectedAsset.id} asset={selectedAsset} onClose={handleClosePanel} isMobile={isMobile} isTablet={isTablet} />
        )}
      </AnimatePresence>
    </div>
  );
});
Markets.displayName = 'Markets';
export default Markets;
