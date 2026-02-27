// push72.mjs — ZERØ MERIDIAN
// FEATURE: Asset Detail Side Panel di Markets page
// Klik asset row → slide-in panel dari kanan
// Panel berisi: TradingView chart + key stats + funding rate + order book symbol auto-sync
// FILES: src/pages/Markets.tsx

const TOKEN  = "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";
const REPO   = "wr98-code/core-meridian-data";
const BRANCH = "main";

async function getSHA(path) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  const r = await fetch(url, {
    headers: { Authorization: `token ${TOKEN}`, Accept: "application/vnd.github.v3+json" },
  });
  if (!r.ok) throw new Error(`getSHA failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.sha;
}

async function pushFile(path, content, sha, msg) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const r = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: msg,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha,
      branch: BRANCH,
    }),
  });
  if (!r.ok) throw new Error(`pushFile failed: ${r.status} ${await r.text()}`);
  return r.json();
}

// ─── Markets.tsx ──────────────────────────────────────────────────────────────

const MARKETS_TSX = `/**
 * Markets.tsx — ZERØ MERIDIAN 2026 push72
 * push72: Asset Detail Side Panel
 *   - Klik row → slide-in panel dari kanan
 *   - Panel: TradingView chart + live stats + sparkline + funding + order book
 *   - Backdrop overlay, ESC untuk tutup
 *   - Framer Motion spring animation
 *   - React.memo + displayName ✓
 *   - rgba() only ✓  Zero className ✓
 *   - useCallback + useMemo ✓
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

// Binance symbol map — CoinGecko id → Binance ticker
const SYMBOL_MAP: Record<string, TVSymbol> = Object.freeze({
  bitcoin:     'BTCUSDT',
  ethereum:    'ETHUSDT',
  solana:      'SOLUSDT',
  binancecoin: 'BNBUSDT',
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

function getAccent(id: string): string {
  return ACCENT_MAP[id] ?? 'rgba(0,238,255,1)';
}

// ─── Arrow icons ──────────────────────────────────────────────────────────────

const ArrowUp = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
    <path d="M4.5 1.5l-3 4h6l-3-4z" fill="rgba(0,238,255,1)" />
  </svg>
);
const ArrowDown = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
    <path d="M4.5 7.5l-3-4h6l-3 4z" fill="rgba(0,238,255,1)" />
  </svg>
);
const ArrowBoth = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
    <path d="M4.5 1l-2 2.5h4L4.5 1zM4.5 8l-2-2.5h4L4.5 8z" fill="currentColor" opacity="0.3" />
  </svg>
);

// ─── HeaderCell ───────────────────────────────────────────────────────────────

interface HeaderCellProps {
  label:   string;
  sortKey: SortKey;
  current: SortKey;
  dir:     SortDir;
  onSort:  (key: SortKey) => void;
  width?:  string | number;
  align?:  'left' | 'right';
}

const HeaderCell = memo(({ label, sortKey, current, dir, onSort, width = 'auto', align = 'right' }: HeaderCellProps) => {
  const isActive = current === sortKey;
  const color    = isActive ? 'rgba(0,238,255,1)' : 'rgba(80,80,100,1)';
  return (
    <button
      type="button"
      style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px',
        textAlign: align,
        display: 'flex', alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        gap: '4px', color,
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: 0, width, flexShrink: 0, letterSpacing: '0.06em',
        minHeight: 36,
      }}
      onClick={() => onSort(sortKey)}
      aria-label={'Sort by ' + label}
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      {isActive ? dir === 'asc' ? <ArrowUp /> : <ArrowDown /> : <ArrowBoth />}
    </button>
  );
});
HeaderCell.displayName = 'HeaderCell';

// ─── AssetRow ─────────────────────────────────────────────────────────────────

interface AssetRowProps {
  asset:    CryptoAsset;
  index:    number;
  isMobile: boolean;
  selected: boolean;
  onClick:  (asset: CryptoAsset) => void;
}

const AssetRow = memo(({ asset, index, isMobile, selected, onClick }: AssetRowProps) => {
  const ref       = useRef<HTMLDivElement>(null);
  const prevPrice = useRef(asset.price);
  const mountRef  = useRef(true);

  useEffect(() => {
    mountRef.current = true;
    return () => { mountRef.current = false; };
  }, []);

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
    const t = setTimeout(() => {
      if (mountRef.current) ref.current?.classList.remove(cls);
    }, 300);
    return () => clearTimeout(t);
  }, [asset.price, asset.priceDirection]);

  const accent        = getAccent(asset.id);
  const rowHeight     = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;
  const change24Color = asset.change24h >= 0 ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)';
  const rowBg         = selected
    ? 'rgba(0,238,255,0.06)'
    : index % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent';

  const handleClick = useCallback(() => onClick(asset), [onClick, asset]);

  if (isMobile) {
    return (
      <div
        ref={ref}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={'View ' + asset.name + ' detail'}
        style={{
          height: rowHeight, background: rowBg, cursor: 'pointer',
          borderBottom: '1px solid rgba(0,238,255,0.05)',
          borderLeft: selected ? '2px solid ' + accent : '2px solid transparent',
          display: 'grid',
          gridTemplateColumns: '28px 1fr 90px 64px',
          alignItems: 'center',
          padding: '0 12px', gap: '8px', willChange: 'transform',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(0,238,255,0.04)'; }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = rowBg; }}
      >
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', textAlign: 'right', color: 'rgba(80,80,100,1)' }}>
          {asset.rank}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {asset.image
            ? <img src={asset.image} alt="" style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0 }} />
            : <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: accent + '33' }} />}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(240,240,248,1)' }}>
            {asset.symbol.toUpperCase()}
          </span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'right', color: 'rgba(240,240,248,1)' }}>
          {formatPrice(asset.price)}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'right', color: change24Color }}>
          {formatChange(asset.change24h)}
        </span>
      </div>
    );
  }

  const change7dColor = (asset.change7d ?? 0) >= 0 ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)';

  return (
    <div
      ref={ref}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={'View ' + asset.name + ' detail'}
      style={{
        height: rowHeight, background: rowBg, cursor: 'pointer',
        borderBottom: '1px solid rgba(0,238,255,0.05)',
        borderLeft: selected ? '2px solid ' + accent : '2px solid transparent',
        display: 'flex', alignItems: 'center',
        padding: selected ? '0 16px 0 14px' : '0 16px',
        gap: '12px', willChange: 'transform',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(0,238,255,0.04)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = rowBg; }}
    >
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: 28, flexShrink: 0, textAlign: 'right', color: 'rgba(80,80,100,1)' }}>
        {asset.rank}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 150, flexShrink: 0 }}>
        {asset.image
          ? <img src={asset.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }} />
          : <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: accent + '33' }} />}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(240,240,248,1)' }}>
            {asset.symbol.toUpperCase()}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(80,80,100,1)' }}>
            {asset.name}
          </span>
        </div>
      </div>

      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: 100, flexShrink: 0, textAlign: 'right', color: 'rgba(240,240,248,1)' }}>
        {formatPrice(asset.price)}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: 72, flexShrink: 0, textAlign: 'right', color: change24Color }}>
        {formatChange(asset.change24h)}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: 72, flexShrink: 0, textAlign: 'right', color: change7dColor }}>
        {formatChange(asset.change7d ?? 0)}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: 100, flexShrink: 0, textAlign: 'right', color: 'rgba(138,138,158,1)' }}>
        {formatCompact(asset.marketCap)}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: 100, flexShrink: 0, textAlign: 'right', color: 'rgba(138,138,158,1)' }}>
        {formatCompact(asset.volume24h)}
      </span>
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        {asset.sparkline && asset.sparkline.length > 1 && (
          <SparklineChart data={asset.sparkline} width={80} height={28} color="auto" />
        )}
      </div>
    </div>
  );
});
AssetRow.displayName = 'AssetRow';

// ─── Asset Detail Panel ───────────────────────────────────────────────────────

interface StatBoxProps { label: string; value: string; color?: string; }

const StatBox = memo(({ label, value, color }: StatBoxProps) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 3,
    padding: '8px 10px', borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(32,42,68,1)',
    flex: 1, minWidth: 0,
  }}>
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
      {label}
    </span>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: color ?? 'rgba(240,240,248,1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
      {value}
    </span>
  </div>
));
StatBox.displayName = 'StatBox';

interface AssetDetailPanelProps {
  asset:   CryptoAsset;
  onClose: () => void;
  isMobile: boolean;
}

const AssetDetailPanel = memo(({ asset, onClose, isMobile }: AssetDetailPanelProps) => {
  const prefersReducedMotion = useReducedMotion();
  const accent     = getAccent(asset.id);
  const tvSymbol   = SYMBOL_MAP[asset.id] as TVSymbol | undefined;
  const change24h  = asset.change24h;
  const isPos      = change24h >= 0;
  const changeColor = isPos ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)';

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const panelVariants = {
    hidden:  { x: '100%', opacity: 0 },
    visible: {
      x: 0, opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { type: 'spring', damping: 28, stiffness: 280 },
    },
    exit: {
      x: '100%', opacity: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.22, ease: [0.36, 0, 0.66, 0] },
    },
  };

  const panelWidth = isMobile ? '100vw' : '480px';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          zIndex: 200,
          background: 'rgba(4,5,10,0.60)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        aria-label="Close panel"
      />

      {/* Panel */}
      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: panelWidth,
          zIndex: 201,
          background: 'rgba(7,9,18,0.98)',
          borderLeft: '1px solid ' + accent.replace('1)', '0.22)'),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          willChange: 'transform',
        }}
        role="dialog"
        aria-label={'Asset detail: ' + asset.name}
        aria-modal="true"
      >
        {/* ── Panel Header ── */}
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(32,42,68,1)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(7,9,18,1)',
        }}>
          {/* Left: logo + name + price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {asset.image
              ? <img src={asset.image} alt="" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: '1px solid ' + accent.replace('1)', '0.25)') }} />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: accent + '20' }} />}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 700, color: 'rgba(240,240,248,1)', letterSpacing: '0.04em' }}>
                  {asset.symbol.toUpperCase()}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(80,80,100,1)' }}>
                  {asset.name}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(32,42,68,1)', color: 'rgba(138,138,158,1)' }}>
                  #{asset.rank}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: accent, letterSpacing: '0.02em' }}>
                  {formatPrice(asset.price)}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: changeColor, fontWeight: 600 }}>
                  {isPos ? '+' : ''}{change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(32,42,68,1)',
              color: 'rgba(138,138,158,1)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 300, willChange: 'transform',
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Key stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <StatBox label="24h High"   value={formatPrice(asset.high24h ?? asset.price)} />
            <StatBox label="24h Low"    value={formatPrice(asset.low24h  ?? asset.price)} />
            <StatBox label="7d Change"  value={formatChange(asset.change7d ?? 0)}
              color={(asset.change7d ?? 0) >= 0 ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)'} />
            <StatBox label="Mkt Cap"    value={formatCompact(asset.marketCap)} />
            <StatBox label="Volume 24h" value={formatCompact(asset.volume24h)} />
            <StatBox label="Circ Supply" value={formatCompact(asset.circulatingSupply)} />
          </div>

          {/* ATH */}
          {asset.ath && (
            <div style={{ display: 'flex', gap: 8 }}>
              <StatBox label="All-Time High" value={formatPrice(asset.ath)} color="rgba(251,191,36,1)" />
            </div>
          )}

          {/* Sparkline 7d */}
          {asset.sparkline && asset.sparkline.length > 1 && (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(32,42,68,1)' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em', marginBottom: 8 }}>
                7D PRICE CHART
              </div>
              <SparklineChart data={asset.sparkline} width={isMobile ? 300 : 400} height={60} color={accent} />
            </div>
          )}

          {/* TradingView Chart — only for Binance-listed assets */}
          {tvSymbol ? (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(32,42,68,1)' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em', padding: '10px 14px 0' }}>
                LIVE CANDLESTICK
              </div>
              <Suspense fallback={
                <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)' }}>Loading chart...</span>
                </div>
              }>
                <TradingViewChart defaultSymbol={tvSymbol} height={300} />
              </Suspense>
            </div>
          ) : (
            <div style={{
              padding: '20px', borderRadius: 10, textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(32,42,68,1)',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)' }}>
                Live chart available for BTC · ETH · SOL · BNB
              </span>
            </div>
          )}

          {/* Order Book — only for supported symbols */}
          {tvSymbol && (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(32,42,68,1)' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em', padding: '10px 14px 6px' }}>
                ORDER BOOK
              </div>
              <Suspense fallback={
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)' }}>Loading...</span>
                </div>
              }>
                <OrderBookTile />
              </Suspense>
            </div>
          )}

          {/* Binance link */}
          <a
            href={'https://www.binance.com/en/trade/' + asset.symbol.toUpperCase() + '_USDT'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px', borderRadius: 8,
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.18)',
              color: 'rgba(251,191,36,0.8)',
              textDecoration: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
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
  const { assets }       = useCrypto();
  const worker           = useMarketWorker();
  const { isMobile }     = useBreakpoint();

  const [query,       setQuery]       = useState('');
  const [sortKey,     setSortKey]     = useState<SortKey>('rank');
  const [sortDir,     setSortDir]     = useState<SortDir>('asc');
  const [filtered,    setFiltered]    = useState<CryptoAsset[]>(assets);
  const [isWorking,   setIsWorking]   = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (assets.length === 0) return;
    setIsWorking(true);
    worker.sortAndFilter(assets, sortKey, sortDir, query)
      .then(result => {
        if (!mountedRef.current) return;
        setFiltered(result.assets);
      })
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

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else setSortDir('desc');
      return key;
    });
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleSelectAsset = useCallback((asset: CryptoAsset) => {
    setSelectedAsset(prev => prev?.id === asset.id ? null : asset);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedAsset(null);
  }, []);

  const rowHeight = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;

  const renderRow = useCallback((asset: CryptoAsset, index: number) => (
    <AssetRow
      asset={asset}
      index={index}
      isMobile={isMobile}
      selected={selectedAsset?.id === asset.id}
      onClick={handleSelectAsset}
    />
  ), [isMobile, selectedAsset?.id, handleSelectAsset]);

  const getKey = useCallback((asset: CryptoAsset) => asset.id, []);

  const listHeight = useMemo(() => Math.min(
    window.innerHeight - 240,
    filtered.length * rowHeight
  ), [filtered.length, rowHeight]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }} role="main" aria-label="Live Markets">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{
            fontSize: isMobile ? '16px' : '20px', fontWeight: 700,
            fontFamily: "'IBM Plex Mono', monospace",
            color: 'rgba(240,240,248,1)', letterSpacing: '0.04em', margin: 0,
          }}>
            Live Markets
          </h1>
          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: 4, background: 'rgba(34,255,170,0.08)', color: 'rgba(34,255,170,1)' }}>
            {filtered.length} assets
          </span>
          {isWorking && (
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(80,80,100,1)' }}>
              sorting...
            </span>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(32,42,68,1)',
          minWidth: isMobile ? '100%' : 200,
          minHeight: isMobile ? 48 : 'auto',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>
          <input
            type="search"
            placeholder="Search assets..."
            value={query}
            onChange={handleSearch}
            aria-label="Search assets"
            style={{
              background: 'transparent', outline: 'none', border: 'none',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
              flex: 1, color: 'rgba(240,240,248,1)',
              WebkitAppearance: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(32,42,68,1)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Headers */}
        {isMobile ? (
          <div style={{
            display: 'grid', gridTemplateColumns: '28px 1fr 90px 64px',
            alignItems: 'center', padding: '0 12px', gap: 8,
            position: 'sticky' as const, top: 0, zIndex: 10, height: 36,
            background: 'rgba(6,8,14,0.97)',
            borderBottom: '1px solid rgba(32,42,68,1)',
            backdropFilter: 'blur(12px)',
          }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', textAlign: 'right' }}>#</span>
            <HeaderCell label="Asset"  sortKey="name"      current={sortKey} dir={sortDir} onSort={handleSort} width="100%" align="left" />
            <HeaderCell label="Price"  sortKey="price"     current={sortKey} dir={sortDir} onSort={handleSort} width={90} />
            <HeaderCell label="24h"    sortKey="change24h" current={sortKey} dir={sortDir} onSort={handleSort} width={64} />
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
            position: 'sticky' as const, top: 0, zIndex: 10, height: 36,
            background: 'rgba(6,8,14,0.97)',
            borderBottom: '1px solid rgba(32,42,68,1)',
            backdropFilter: 'blur(12px)',
          }}>
            <span style={{ width: 28, flexShrink: 0 }} />
            <span style={{ width: 150, flexShrink: 0 }}>
              <HeaderCell label="Asset"   sortKey="name"      current={sortKey} dir={sortDir} onSort={handleSort} width={150} align="left" />
            </span>
            <HeaderCell label="Price"    sortKey="price"     current={sortKey} dir={sortDir} onSort={handleSort} width={100} />
            <HeaderCell label="24h"      sortKey="change24h" current={sortKey} dir={sortDir} onSort={handleSort} width={72} />
            <HeaderCell label="7d"       sortKey="change7d"  current={sortKey} dir={sortDir} onSort={handleSort} width={72} />
            <HeaderCell label="Mkt Cap"  sortKey="marketCap" current={sortKey} dir={sortDir} onSort={handleSort} width={100} />
            <HeaderCell label="Volume"   sortKey="volume24h" current={sortKey} dir={sortDir} onSort={handleSort} width={100} />
            <span style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)', letterSpacing: '0.06em' }}>
              7d Chart
            </span>
          </div>
        )}

        {/* Hint bar */}
        {!selectedAsset && filtered.length > 0 && (
          <div style={{
            padding: '5px 16px',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
            color: 'rgba(80,80,100,1)', letterSpacing: '0.06em',
            borderBottom: '1px solid rgba(32,42,68,0.5)',
            background: 'rgba(0,238,255,0.02)',
          }}>
            ← click any row to view detail chart & order book
          </div>
        )}

        <VirtualList
          items={filtered}
          itemHeight={rowHeight}
          height={listHeight || 400}
          overscan={5}
          renderItem={renderRow}
          getKey={getKey}
        />
      </div>

      {/* ── Asset Detail Side Panel ── */}
      <AnimatePresence>
        {selectedAsset && (
          <AssetDetailPanel
            key={selectedAsset.id}
            asset={selectedAsset}
            onClose={handleClosePanel}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
Markets.displayName = 'Markets';

export default Markets;
`;

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const path = "src/pages/Markets.tsx";
  console.log("🚀 ZERØ MERIDIAN — push72 starting...");
  console.log("FEATURE: Asset Detail Side Panel\n");

  console.log("[1/1] Fetching SHA: " + path);
  const sha = await getSHA(path);
  console.log("      SHA: " + sha);

  await pushFile(path, MARKETS_TSX, sha, "push72: Asset detail side panel — click row to view chart + orderbook");
  console.log("      ✅ Pushed!\n");

  console.log("═══════════════════════════════════════════════════");
  console.log("✅ push72 SELESAI!");
  console.log("");
  console.log("FEATURE: Asset Detail Side Panel");
  console.log("  - Klik baris asset → panel slide dari kanan");
  console.log("  - Framer Motion spring animation");
  console.log("  - Backdrop blur overlay, klik backdrop / ESC = tutup");
  console.log("  - Panel isi:");
  console.log("    • Header: logo + nama + harga live + % change");
  console.log("    • Stats grid: 24h High/Low, 7d, McAP, Vol, Supply");
  console.log("    • ATH badge (kalau tersedia)");
  console.log("    • Sparkline 7d chart");
  console.log("    • TradingView candlestick (BTC/ETH/SOL/BNB)");
  console.log("    • Order Book (BTC/ETH/SOL/BNB)");
  console.log("    • Binance trade link");
  console.log("  - Row aktif = highlight + accent border kiri");
  console.log("  - Mobile: panel fullscreen");
  console.log("  - Desktop: panel 480px dari kanan");
  console.log("");
  console.log("CEK: https://core-meridian-data.vercel.app/markets");
  console.log("═══════════════════════════════════════════════════");
}

main().catch(e => {
  console.error("❌ ERROR:", e.message);
  process.exit(1);
});
