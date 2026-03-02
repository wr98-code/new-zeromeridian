/**
 * NewsTickerTile.tsx — ZERØ MERIDIAN push135
 * AUDIT FIX: Replace dark/neon colors with Bloomberg Light
 *   - rgba(255,68,136,x) → rgba(208,35,75,x)   [neon pink → Bloomberg red]
 *   - rgba(52,211,153,x) → rgba(0,155,95,x)     [emerald → Bloomberg green]
 *   - rgba(5,5,14,x)     → rgba(248,249,252,x)  [dark overlay → light]
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - JetBrains Mono ✓  useCallback + useMemo ✓  mountedRef + AbortController ✓
 * - Object.freeze ✓  will-change ✓
 */

import { memo, useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../shared/GlassCard';

const FONT = "'JetBrains Mono', monospace";

const C = Object.freeze({
  accent:       'rgba(15,40,180,1)',
  positive:     'rgba(0,155,95,1)',
  negative:     'rgba(208,35,75,1)',
  warning:      'rgba(195,125,0,1)',
  textPrimary:  'rgba(8,12,40,1)',
  textFaint:    'rgba(110,120,160,1)',
  cardBg:       'rgba(255,255,255,1)',
  accentBg:     'rgba(15,40,180,0.07)',
  accentBorder: 'rgba(15,40,180,0.22)',
  glassBorder:  'rgba(15,40,100,0.10)',
  positiveBg:   'rgba(0,155,95,0.08)',
  negativeBg:   'rgba(208,35,75,0.08)',
  negativeBorder: 'rgba(208,35,75,0.25)',
});

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: number;
  categories: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  tags: string[];
}

interface NewsRaw {
  id: string | number;
  title: string;
  source_info?: { name?: string };
  source?: string;
  url: string;
  published_on: number;
  categories?: string;
  sentiment?: string;
  tags?: string;
}

const SENTIMENT_COLOR = Object.freeze({
  positive: C.positive,
  negative: C.negative,
  neutral:  C.textFaint,
});

const TAG_COLOR = Object.freeze({
  BTC:     'rgba(195,125,0,0.9)',
  ETH:     'rgba(15,40,180,0.85)',
  SOL:     'rgba(100,60,200,0.85)',
  DEFI:    'rgba(0,155,95,0.8)',
  ETF:     'rgba(0,140,200,0.8)',
  L2:      'rgba(15,40,180,0.7)',
  LIQ:     'rgba(208,35,75,0.8)',
  BULL:    'rgba(0,155,95,0.85)',
  BEAR:    'rgba(208,35,75,0.85)',
  default: C.textFaint,
});

function getTagColor(tag: string): string {
  return (TAG_COLOR as Record<string, string>)[tag] ?? TAG_COLOR.default;
}

function formatAge(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000)   return Math.floor(diff / 1000) + 's ago';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  return Math.floor(diff / 3600000) + 'h ago';
}

interface NewsState { items: NewsItem[]; loading: boolean; error: string | null; }

function useNewsData() {
  const [state, setState] = useState<NewsState>({ items: [], loading: true, error: null });
  const mountedRef = useRef(true);

  const fetchNews = useCallback(async (signal: AbortSignal) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest',
        { signal }
      );
      if (!mountedRef.current) return;
      if (!res.ok) {
        setState({ items: [], loading: false, error: 'News API error: ' + res.status });
        return;
      }
      const data = await res.json();
      if (!mountedRef.current) return;
      if (!data.Data || !Array.isArray(data.Data)) {
        setState({ items: [], loading: false, error: 'Invalid response from news API' });
        return;
      }
      const mapped: NewsItem[] = data.Data.slice(0, 20).map((n: NewsRaw) => ({
        id:          String(n.id),
        title:       n.title,
        source:      n.source_info?.name ?? n.source ?? 'Unknown',
        url:         n.url,
        publishedAt: n.published_on * 1000,
        categories:  (n.categories ?? '').split('|').filter(Boolean),
        sentiment:   n.sentiment === 'Positive' ? 'positive' :
                     n.sentiment === 'Negative' ? 'negative' : 'neutral',
        tags:        (n.tags ?? '').split('|').filter(Boolean).slice(0, 3),
      }));
      if (mapped.length === 0) {
        setState({ items: [], loading: false, error: 'No news articles returned' });
        return;
      }
      setState({ items: mapped, loading: false, error: null });
    } catch (err) {
      if (!mountedRef.current) return;
      if ((err as Error).name === 'AbortError') return;
      setState({ items: [], loading: false, error: 'Failed to load news feed' });
    }
  }, []);

  const refetch = useCallback(() => {
    const ctrl = new AbortController();
    fetchNews(ctrl.signal);
    return ctrl;
  }, [fetchNews]);

  useEffect(() => {
    mountedRef.current = true;
    const ctrl = new AbortController();
    fetchNews(ctrl.signal);
    const t = setInterval(() => fetchNews(ctrl.signal), 120_000);
    return () => {
      mountedRef.current = false;
      ctrl.abort();
      clearInterval(t);
    };
  }, [fetchNews]);

  return { ...state, refetch };
}

const TickerNewsItem = memo(({ item, isActive }: { item: NewsItem; isActive: boolean }) => {
  const sentColor = item.sentiment ? SENTIMENT_COLOR[item.sentiment] : SENTIMENT_COLOR.neutral;

  const handleClick = useCallback(() => {
    if (item.url && item.url !== '#') window.open(item.url, '_blank', 'noopener,noreferrer');
  }, [item.url]);

  const containerStyle = useMemo(() => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 20px', whiteSpace: 'nowrap' as const, cursor: 'pointer',
  }), []);

  const titleStyle = useMemo(() => ({
    fontFamily: FONT, fontSize: 11,
    color: isActive ? C.textPrimary : C.textFaint,
    letterSpacing: '0.01em',
  }), [isActive]);

  return (
    <div onClick={handleClick} style={containerStyle}>
      <span style={{ fontSize: 8, color: sentColor, flexShrink: 0 }}>●</span>
      {item.tags.slice(0, 2).map(tag => (
        <span key={tag} style={{
          fontFamily: FONT, fontSize: 8, padding: '1px 5px', borderRadius: 3,
          border: '1px solid ' + getTagColor(tag).replace('0.8', '0.3').replace('0.85', '0.3').replace('0.9', '0.3'),
          color: getTagColor(tag), flexShrink: 0,
        }}>
          {tag}
        </span>
      ))}
      <span style={titleStyle}>{item.title}</span>
      <span style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(15,40,180,0.45)', flexShrink: 0 }}>
        {item.source}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(15,40,100,0.25)', flexShrink: 0 }}>
        {formatAge(item.publishedAt)}
      </span>
      <span style={{ color: 'rgba(15,40,180,0.15)', flexShrink: 0, margin: '0 8px' }}>◆</span>
    </div>
  );
});
TickerNewsItem.displayName = 'TickerNewsItem';

const NewsError = memo(({ message, onRetry }: { message: string; onRetry: () => void }) => {
  const containerStyle = useMemo(() => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', height: 36,
  }), []);

  const labelStyle = useMemo(() => ({
    fontFamily: FONT, fontSize: 9, color: C.negative,
  }), []);

  const btnStyle = useMemo(() => ({
    fontFamily: FONT, fontSize: 9, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
    background: C.negativeBg, border: '1px solid ' + C.negativeBorder, color: C.negative,
  }), []);

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>⚠ {message}</span>
      <button onClick={onRetry} style={btnStyle}>RETRY</button>
    </div>
  );
});
NewsError.displayName = 'NewsError';

const NewsTickerTile = memo(() => {
  const { items, loading, error, refetch } = useNewsData();
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused]       = useState(false);

  useEffect(() => {
    if (paused || items.length === 0) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  const onMouseEnter  = useCallback(() => setPaused(true),  []);
  const onMouseLeave  = useCallback(() => setPaused(false), []);
  const handleRetry   = useCallback(() => { refetch(); },   [refetch]);
  const doubledItems  = useMemo(() => [...items, ...items], [items]);

  const headerStyle = useMemo(() => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
    borderBottom: '1px solid ' + C.glassBorder,
    background: C.accentBg,
  }), []);

  const headerLabelStyle = useMemo(() => ({
    fontFamily: FONT, fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: '0.12em',
  }), []);

  const fadeLeft = useMemo(() => ({
    position: 'absolute' as const, left: 0, top: 0, bottom: 0, width: 60,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.95), transparent)',
    zIndex: 2, pointerEvents: 'none' as const,
  }), []);

  const fadeRight = useMemo(() => ({
    position: 'absolute' as const, right: 0, top: 0, bottom: 0, width: 60,
    background: 'linear-gradient(270deg, rgba(255,255,255,0.95), transparent)',
    zIndex: 2, pointerEvents: 'none' as const,
  }), []);

  return (
    <GlassCard style={{ height: 'auto', padding: 0, overflow: 'hidden' }} accentColor={C.accent}>

      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontSize: 8, color: error ? C.negative : C.positive }}>●</span>
        <span style={headerLabelStyle}>CRYPTO INTELLIGENCE FEED</span>
        <span style={{ flex: 1 }} />
        {loading && (
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontFamily: FONT, fontSize: 9, color: C.textFaint }}
          >
            UPDATING...
          </motion.span>
        )}
        {!loading && !error && (
          <span style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(15,40,100,0.28)' }}>
            {items.length} STORIES
          </span>
        )}
        <span style={{ fontFamily: FONT, fontSize: 9, color: paused ? C.warning : 'rgba(15,40,100,0.25)' }}>
          {paused ? '⏸ PAUSED' : '▶ LIVE'}
        </span>
      </div>

      {/* Body */}
      {loading && (
        <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ fontFamily: FONT, fontSize: 9, color: C.textFaint, letterSpacing: '0.1em' }}
          >
            LOADING LIVE NEWS FEED...
          </motion.div>
        </div>
      )}

      {!loading && error && <NewsError message={error} onRetry={handleRetry} />}

      {!loading && !error && items.length > 0 && (
        <div
          style={{ overflow: 'hidden', position: 'relative' }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div style={fadeLeft} />
          <div style={fadeRight} />

          <div style={{
            display: 'flex', alignItems: 'center', height: 36,
            animation: paused ? 'none' : 'zm-ticker-scroll 60s linear infinite',
            willChange: 'transform',
          }}>
            <style>{`@keyframes zm-ticker-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
            {doubledItems.map((item, i) => (
              <TickerNewsItem
                key={item.id + '_' + i}
                item={item}
                isActive={i % items.length === activeIdx}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active story detail */}
      <AnimatePresence>
        {!loading && !error && items[activeIdx] && (
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ padding: '6px 12px 8px', borderTop: '1px solid ' + C.glassBorder, display: 'flex', alignItems: 'flex-start', gap: 8 }}
          >
            <div style={{
              width: 2, minHeight: 20, flexShrink: 0, marginTop: 2, borderRadius: 1,
              background: items[activeIdx].sentiment
                ? SENTIMENT_COLOR[items[activeIdx].sentiment!]
                : SENTIMENT_COLOR.neutral,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontSize: 10, color: C.textPrimary, lineHeight: 1.4 }}>
                {items[activeIdx].title}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, fontFamily: FONT, fontSize: 8, color: 'rgba(15,40,100,0.35)' }}>
                <span style={{ color: 'rgba(15,40,180,0.55)' }}>{items[activeIdx].source}</span>
                <span>{formatAge(items[activeIdx].publishedAt)}</span>
                {items[activeIdx].tags.map(tag => (
                  <span key={tag} style={{ color: getTagColor(tag) }}>{tag}</span>
                ))}
              </div>
            </div>
            <div style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(15,40,100,0.25)', flexShrink: 0 }}>
              {activeIdx + 1}/{items.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </GlassCard>
  );
});

NewsTickerTile.displayName = 'NewsTickerTile';
export default NewsTickerTile;
