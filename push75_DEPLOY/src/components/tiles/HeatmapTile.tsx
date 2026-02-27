/**
 * HeatmapTile.tsx — ZERØ MERIDIAN push75
 *
 * FIX H-03 (push75): /api/heatmap proxy DIHAPUS.
 *   SEBELUM: fetch('/api/heatmap?limit=40') — proxy tidak ada di Vercel → 404 di production
 *   SESUDAH: fetch langsung ke CoinGecko free public API
 *            + diqueue via coingeckoQueue (1 concurrent, 2s gap → aman di free tier)
 *            + timeframe parameter di-map ke field CoinGecko yang benar
 *
 * Squarified treemap — pure Canvas, zero recharts.
 * useWebGPU backend detection + canvas hints ✓
 * React.memo + displayName ✓  rgba() only ✓
 * Zero template literals in JSX ✓  Object.freeze() ✓
 * mountedRef + AbortController ✓  useCallback/useMemo ✓
 */

import { memo, useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../shared/GlassCard';
import { useWebGPU } from '@/hooks/useWebGPU';
import { coingeckoQueue } from '@/lib/apiQueue';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeatmapCoin {
  id: string; symbol: string; name: string;
  price: number; change: number; marketCap: number; image?: string;
}

interface TreeNode extends HeatmapCoin { x: number; y: number; w: number; h: number; }

type TimeFrame = '1h' | '24h' | '7d';

// ─── Constants ────────────────────────────────────────────────────────────────

const COINS_LIMIT = 40;

// CoinGecko free public API — no key needed, langsung dari browser
// price_change_percentage_1h_in_currency + 7d_in_currency harus di-include via query param
const buildCoinGeckoUrl = (timeframe: TimeFrame): string => {
  const base = 'https://api.coingecko.com/api/v3/coins/markets'
    + '?vs_currency=usd'
    + '&order=market_cap_desc'
    + '&per_page=' + COINS_LIMIT
    + '&page=1'
    + '&sparkline=false';

  if (timeframe === '1h') {
    return base + '&price_change_percentage=1h';
  }
  if (timeframe === '7d') {
    return base + '&price_change_percentage=7d';
  }
  // 24h — default field price_change_percentage_24h sudah selalu ada
  return base;
};

// ─── Color helpers ────────────────────────────────────────────────────────────

function changeToColor(pct: number): string {
  if (pct > 10)   return 'rgba(5,150,105,0.95)';
  if (pct > 5)    return 'rgba(16,185,129,0.85)';
  if (pct > 2)    return 'rgba(52,211,153,0.75)';
  if (pct > 0.5)  return 'rgba(52,211,153,0.45)';
  if (pct > -0.5) return 'rgba(30,41,59,0.8)';
  if (pct > -2)   return 'rgba(251,113,133,0.45)';
  if (pct > -5)   return 'rgba(251,113,133,0.75)';
  if (pct > -10)  return 'rgba(244,63,94,0.85)';
  return 'rgba(225,29,72,0.95)';
}

function changeToBorder(pct: number): string {
  if (pct > 2)  return 'rgba(52,211,153,0.5)';
  if (pct > 0)  return 'rgba(52,211,153,0.2)';
  if (pct > -2) return 'rgba(251,113,133,0.2)';
  return 'rgba(251,113,133,0.5)';
}

// ─── Squarified treemap ───────────────────────────────────────────────────────

function squarify(items: HeatmapCoin[], x: number, y: number, w: number, h: number): TreeNode[] {
  if (items.length === 0) return [];
  const results: TreeNode[] = [];
  function layout(items: HeatmapCoin[], x: number, y: number, w: number, h: number) {
    if (items.length === 0) return;
    if (items.length === 1) { results.push({ ...items[0], x, y, w, h }); return; }
    const totalVal = items.reduce((s, c) => s + c.marketCap, 0);
    let accum = 0, splitIdx = 0;
    for (let i = 0; i < items.length; i++) {
      accum += items[i].marketCap;
      if (accum / totalVal >= 0.5) { splitIdx = i + 1; break; }
    }
    splitIdx = Math.max(1, Math.min(splitIdx, items.length - 1));
    const group1 = items.slice(0, splitIdx), group2 = items.slice(splitIdx);
    const ratio1 = group1.reduce((s, c) => s + c.marketCap, 0) / totalVal;
    if (w >= h) {
      layout(group1, x, y, w * ratio1, h);
      layout(group2, x + w * ratio1, y, w * (1 - ratio1), h);
    } else {
      layout(group1, x, y, w, h * ratio1);
      layout(group2, x, y + h * ratio1, w, h * (1 - ratio1));
    }
  }
  layout(items, x, y, w, h);
  return results;
}

// ─── Canvas draw ──────────────────────────────────────────────────────────────

function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  nodes: TreeNode[],
  w: number,
  h: number,
  hoverIdx: number | null,
  dpr: number,
): void {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]; const gap = 2;
    const nx = n.x + gap, ny = n.y + gap, nw = n.w - gap * 2, nh = n.h - gap * 2;
    if (nw < 4 || nh < 4) continue;
    const color  = changeToColor(n.change);
    const border = changeToBorder(n.change);
    const isHover = hoverIdx === i;
    ctx.fillStyle   = isHover ? color.replace(/[\d.]+\)$/, m => String(Math.min(1, parseFloat(m) + 0.2)) + ')') : color;
    ctx.beginPath(); ctx.roundRect(nx, ny, nw, nh, 4); ctx.fill();
    ctx.strokeStyle = isHover ? 'rgba(255,255,255,0.4)' : border;
    ctx.lineWidth   = isHover ? 1.5 / dpr : 1 / dpr; ctx.stroke();
    if (nw > 36 && nh > 24) {
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      const cx = nx + nw / 2, cy = ny + nh / 2;
      const fontSize = Math.min(14, Math.max(8, nw / 6));
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font      = 'bold ' + fontSize + 'px JetBrains Mono, monospace';
      ctx.fillText(n.symbol.toUpperCase(), cx, nh > 40 ? cy - fontSize * 0.6 : cy);
      if (nh > 40) {
        const chg = (n.change >= 0 ? '+' : '') + n.change.toFixed(2) + '%';
        ctx.fillStyle = n.change >= 0 ? 'rgba(167,243,208,0.9)' : 'rgba(254,202,202,0.9)';
        ctx.font      = (fontSize * 0.8) + 'px JetBrains Mono, monospace';
        ctx.fillText(chg, cx, cy + fontSize * 0.7);
      }
    }
  }
}

// ─── Data hook — direct CoinGecko via coingeckoQueue ─────────────────────────

function useHeatmapData(timeframe: TimeFrame) {
  const [coins,   setCoins]   = useState<HeatmapCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (signal: AbortSignal) => {
    try {
      const url = buildCoinGeckoUrl(timeframe);
      const data = await coingeckoQueue.enqueue(async () => {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error('CoinGecko ' + res.status);
        return res.json() as Promise<Record<string, unknown>[]>;
      });
      if (!mountedRef.current) return;

      const mapped: HeatmapCoin[] = data.map(c => ({
        id:        String(c['id']    ?? ''),
        symbol:    String(c['symbol']  ?? ''),
        name:      String(c['name']    ?? ''),
        price:     Number(c['current_price'] ?? 0),
        change:    timeframe === '1h'
          ? Number(c['price_change_percentage_1h_in_currency']  ?? 0)
          : timeframe === '7d'
          ? Number(c['price_change_percentage_7d_in_currency']  ?? 0)
          : Number(c['price_change_percentage_24h'] ?? 0),
        marketCap: Number(c['market_cap'] ?? 1),
        image:     String(c['image']   ?? ''),
      }));

      if (mountedRef.current) {
        setCoins(mapped);
        setLoading(false);
      }
    } catch {
      // AbortError expected on cleanup — keep existing data
      if (mountedRef.current) setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    mountedRef.current = true;
    const ctrl = new AbortController();
    setLoading(true);
    void fetchData(ctrl.signal);
    // Refresh setiap 60s — sesuai CoinGecko free tier rate
    const t = setInterval(() => { void fetchData(ctrl.signal); }, 60_000);
    return () => {
      mountedRef.current = false;
      ctrl.abort();
      clearInterval(t);
    };
  }, [fetchData]);

  return { coins, loading };
}

// ─── Component ────────────────────────────────────────────────────────────────

const HeatmapTile = memo(() => {
  const [timeframe,   setTimeframe]   = useState<TimeFrame>('24h');
  const [hoverIdx,    setHoverIdx]    = useState<number | null>(null);
  const [hoverCoin,   setHoverCoin]   = useState<TreeNode | null>(null);
  const [tooltipPos,  setTooltipPos]  = useState({ x: 0, y: 0 });

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef      = useRef<number>(0);
  const nodesRef     = useRef<TreeNode[]>([]);

  const { coins, loading }     = useHeatmapData(timeframe);
  const { backend, isWebGL2 }  = useWebGPU();

  const nodes = useMemo(() => {
    if (coins.length === 0 || !containerRef.current) return [];
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight || 220;
    const result = squarify(coins, 0, 0, w, h);
    nodesRef.current = result;
    return result;
  }, [coins]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current, container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight || 220;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width        = w * dpr;
      canvas.height       = h * dpr;
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;
    if (isWebGL2) ctx.imageSmoothingQuality = 'high';
    ctx.save(); ctx.scale(dpr, dpr);
    drawHeatmap(ctx, nodes, w, h, hoverIdx, dpr);
    ctx.restore();
  }, [nodes, hoverIdx, isWebGL2]);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(draw);
  }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(draw);
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const n = nodesRef.current;
    let found = -1;
    for (let i = 0; i < n.length; i++) {
      const nd = n[i];
      if (mx >= nd.x && mx <= nd.x + nd.w && my >= nd.y && my <= nd.y + nd.h) {
        found = i;
        setHoverCoin(nd);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        break;
      }
    }
    setHoverIdx(found >= 0 ? found : null);
    if (found < 0) setHoverCoin(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverIdx(null);
    setHoverCoin(null);
  }, []);

  const handleTimeframe = useCallback((t: TimeFrame) => setTimeframe(t), []);

  const btnBase = useMemo<React.CSSProperties>(() => Object.freeze({
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '2px 8px', borderRadius: 3,
    border: '1px solid rgba(96,165,250,0.12)', background: 'transparent',
    color: 'rgba(148,163,184,0.5)', cursor: 'pointer',
  }), []);

  const btnActive = useMemo<React.CSSProperties>(() => Object.freeze({
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '2px 8px', borderRadius: 3,
    border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(96,165,250,0.1)',
    color: 'rgba(226,232,240,0.9)', cursor: 'pointer',
  }), []);

  const backendLabel = useMemo(() => {
    if (backend === 'webgpu') return '⚡ GPU';
    if (backend === 'webgl2') return '▣ GL2';
    return '□ 2D';
  }, [backend]);

  const backendColor = useMemo(() => {
    if (backend === 'webgpu') return 'rgba(167,139,250,0.6)';
    if (backend === 'webgl2') return 'rgba(96,165,250,0.5)';
    return 'rgba(148,163,184,0.3)';
  }, [backend]);

  const LEGEND_VALS   = Object.freeze([-10, -5, -2, 0, 2, 5, 10]);
  const LEGEND_LABELS = Object.freeze(['-10%', '-5%', '-2%', '0%', '+2%', '+5%', '+10%']);

  return (
    <GlassCard style={{ height: 300, display: 'flex', flexDirection: 'column', padding: '10px 10px 8px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(226,232,240,0.7)', fontWeight: 600, letterSpacing: '0.05em' }}>
            MARKET HEATMAP
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: backendColor }}>
            {backendLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {(['1h', '24h', '7d'] as TimeFrame[]).map(t => (
            <button
              key={t}
              type="button"
              style={timeframe === t ? btnActive : btnBase}
              onClick={() => handleTimeframe(t)}
              aria-label={'Timeframe ' + t}
              aria-pressed={timeframe === t}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(96,165,250,0.4)' }}>
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
              LOADING HEATMAP...
            </motion.span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', willChange: 'transform' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          aria-label="Market heatmap treemap"
          role="img"
        />
        {hoverCoin && (
          <div style={{
            position:   'absolute',
            left:       Math.min(tooltipPos.x + 8, (containerRef.current?.clientWidth ?? 300) - 140),
            top:        Math.max(tooltipPos.y - 60, 0),
            background: 'rgba(5,5,14,0.95)',
            border:     '1px solid rgba(96,165,250,0.2)',
            borderRadius: 6, padding: '6px 10px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, pointerEvents: 'none', zIndex: 10, minWidth: 130,
          }}>
            <div style={{ color: 'rgba(226,232,240,0.9)', fontWeight: 700, marginBottom: 2 }}>{hoverCoin.name}</div>
            <div style={{ color: 'rgba(148,163,184,0.6)', marginBottom: 2 }}>
              {'$' + (hoverCoin.price >= 1000
                ? hoverCoin.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                : hoverCoin.price >= 1
                ? hoverCoin.price.toFixed(4)
                : hoverCoin.price.toFixed(8))}
            </div>
            <div style={{ color: hoverCoin.change >= 0 ? 'rgba(52,211,153,0.9)' : 'rgba(251,113,133,0.9)' }}>
              {(hoverCoin.change >= 0 ? '+' : '') + hoverCoin.change.toFixed(2) + '% (' + timeframe + ')'}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'rgba(148,163,184,0.3)' }}>
        <span>SIZE = MARKET CAP</span>
        <span style={{ flex: 1 }} />
        {LEGEND_LABELS.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: changeToColor(LEGEND_VALS[i]) }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

    </GlassCard>
  );
});

HeatmapTile.displayName = 'HeatmapTile';
export default HeatmapTile;
