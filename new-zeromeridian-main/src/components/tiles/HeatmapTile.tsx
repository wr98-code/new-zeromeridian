/**
 * HeatmapTile.tsx — ZERØ MERIDIAN push135
 * AUDIT FIX: Replaced ALL dark/neon palette with Bloomberg Light
 *   - rgba(34,255,170,x) → rgba(0,155,95,x)   [neon green → Bloomberg green]
 *   - rgba(255,68,136,x) → rgba(208,35,75,x)   [neon pink → Bloomberg red]
 *   - rgba(0,238,255,x)  → rgba(15,40,180,x)   [cyan → Bloomberg navy]
 *   - rgba(5,5,16,x)     → rgba(255,255,255,x)  [dark bg → white card]
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - JetBrains Mono ✓  useCallback + useMemo ✓  AbortController ✓
 * - Object.freeze ✓  mountedRef ✓  will-change ✓
 */

import { memo, useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../shared/GlassCard';

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
});

interface HM { id: string; symbol: string; name: string; price: number; change: number; marketCap: number; }
interface TN extends HM { x: number; y: number; w: number; h: number; }
type TF = '1h' | '24h' | '7d';

function pctToColor(p: number): string {
  if (p > 10)  return 'rgba(0,130,80,0.95)';
  if (p > 5)   return 'rgba(0,145,88,0.85)';
  if (p > 2)   return 'rgba(0,155,95,0.70)';
  if (p > 0.5) return 'rgba(0,155,95,0.40)';
  if (p > -0.5)return 'rgba(200,205,220,0.80)';
  if (p > -2)  return 'rgba(208,35,75,0.38)';
  if (p > -5)  return 'rgba(208,35,75,0.72)';
  if (p > -10) return 'rgba(185,25,65,0.88)';
  return 'rgba(165,15,50,0.96)';
}

function squarify(items: HM[], x: number, y: number, w: number, h: number): TN[] {
  const res: TN[] = [];
  function lay(it: HM[], x: number, y: number, w: number, h: number) {
    if (!it.length) return;
    if (it.length === 1) { res.push({ ...it[0], x, y, w, h }); return; }
    const tot = it.reduce((s, c) => s + c.marketCap, 0);
    let acc = 0, si = 0;
    for (let i = 0; i < it.length; i++) {
      acc += it[i].marketCap;
      if (acc / tot >= 0.5) { si = i + 1; break; }
    }
    si = Math.max(1, Math.min(si, it.length - 1));
    const g1 = it.slice(0, si), g2 = it.slice(si);
    const r1 = g1.reduce((s, c) => s + c.marketCap, 0) / tot;
    if (w >= h) { lay(g1, x, y, w * r1, h); lay(g2, x + w * r1, y, w * (1 - r1), h); }
    else        { lay(g1, x, y, w, h * r1); lay(g2, x, y + h * r1, w, h * (1 - r1)); }
  }
  lay(items, x, y, w, h);
  return res;
}

function draw(ctx: CanvasRenderingContext2D, nodes: TN[], hoverIdx: number | null, dpr: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i], g = 2;
    const nx = n.x + g, ny = n.y + g, nw = n.w - g * 2, nh = n.h - g * 2;
    if (nw < 4 || nh < 4) continue;
    const col = pctToColor(n.change);
    const hover = hoverIdx === i;
    ctx.fillStyle = hover ? col.replace(/[\d.]+\)$/, v => String(Math.min(1, parseFloat(v) + 0.22)) + ')') : col;
    ctx.beginPath(); ctx.roundRect(nx, ny, nw, nh, 5); ctx.fill();
    ctx.strokeStyle = hover
      ? 'rgba(8,12,40,0.4)'
      : (n.change >= 0 ? 'rgba(0,155,95,0.2)' : 'rgba(208,35,75,0.2)');
    ctx.lineWidth = hover ? 1.5 / dpr : 0.8 / dpr; ctx.stroke();
    if (nw > 32 && nh > 20) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const cx2 = nx + nw / 2, cy2 = ny + nh / 2;
      const fs = Math.min(13, Math.max(7, nw / 6));
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = 'bold ' + fs + 'px "JetBrains Mono",monospace';
      ctx.fillText(n.symbol.toUpperCase(), cx2, nh > 38 ? cy2 - fs * 0.6 : cy2);
      if (nh > 38) {
        const chg = (n.change >= 0 ? '+' : '') + n.change.toFixed(2) + '%';
        ctx.fillStyle = n.change >= 0 ? 'rgba(200,240,220,0.95)' : 'rgba(250,200,210,0.95)';
        ctx.font = (fs * 0.8) + 'px "JetBrains Mono",monospace';
        ctx.fillText(chg, cx2, cy2 + fs * 0.7);
      }
    }
  }
}

const CG_URL = (tf: TF) => 'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd&order=market_cap_desc&per_page=40&page=1' +
  (tf === '1h' ? '&price_change_percentage=1h' : tf === '7d' ? '&price_change_percentage=7d' : '');

function useHeatmapData(tf: TF) {
  const [coins, setCoins] = useState<HM[]>([]);
  const [loading, setLoading] = useState(true);
  const m = useRef(true);

  const fetch_ = useCallback(async (sig: AbortSignal) => {
    try {
      const res = await fetch(CG_URL(tf), { signal: sig });
      if (!res.ok || !m.current) return;
      const data = await res.json() as Record<string, unknown>[];
      if (!m.current) return;
      setCoins(data.map(c => ({
        id: String(c.id ?? ''), symbol: String(c.symbol ?? ''), name: String(c.name ?? ''),
        price: Number(c.current_price ?? 0),
        change: tf === '1h' ? Number(c.price_change_percentage_1h_in_currency ?? 0)
              : tf === '7d' ? Number(c.price_change_percentage_7d_in_currency ?? 0)
              : Number(c.price_change_percentage_24h ?? 0),
        marketCap: Number(c.market_cap ?? 1),
      })));
      setLoading(false);
    } catch { /* noop */ }
  }, [tf]);

  useEffect(() => {
    m.current = true;
    const ctrl = new AbortController();
    setLoading(true);
    fetch_(ctrl.signal);
    const t = setInterval(() => fetch_(ctrl.signal), 60_000);
    return () => { m.current = false; ctrl.abort(); clearInterval(t); };
  }, [fetch_]);

  return { coins, loading };
}

const HeatmapTile = memo(() => {
  const [tf, setTf] = useState<TF>('24h');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverCoin, setHoverCoin] = useState<TN | null>(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contRef   = useRef<HTMLDivElement>(null);
  const animRef   = useRef(0);
  const nodesRef  = useRef<TN[]>([]);
  const { coins, loading } = useHeatmapData(tf);

  const nodes = useMemo(() => {
    if (!coins.length || !contRef.current) return [];
    const w = contRef.current.clientWidth;
    const h = contRef.current.clientHeight || 220;
    const r = squarify(coins, 0, 0, w, h);
    nodesRef.current = r;
    return r;
  }, [coins]);

  const render = useCallback(() => {
    const canvas = canvasRef.current, cont = contRef.current;
    if (!canvas || !cont) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cont.clientWidth, h = cont.clientHeight || 220;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save(); ctx.scale(dpr, dpr);
    draw(ctx, nodes, hoverIdx, dpr);
    ctx.restore();
  }, [nodes, hoverIdx]);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(render);
  }, [render]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(render);
    });
    if (contRef.current) ro.observe(contRef.current);
    return () => ro.disconnect();
  }, [render]);

  const onMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const ns = nodesRef.current;
    let found = -1;
    for (let i = 0; i < ns.length; i++) {
      const n = ns[i];
      if (mx >= n.x && mx <= n.x + n.w && my >= n.y && my <= n.y + n.h) {
        found = i; setHoverCoin(n); setTipPos({ x: mx, y: my }); break;
      }
    }
    setHoverIdx(found >= 0 ? found : null);
    if (found < 0) setHoverCoin(null);
  }, []);

  const onLeave = useCallback(() => { setHoverIdx(null); setHoverCoin(null); }, []);

  const btnStyle = useCallback((active: boolean) => ({
    fontFamily: FONT, fontSize: 9, padding: '2px 8px', borderRadius: 3,
    cursor: 'pointer' as const,
    background: active ? C.accentBg : 'transparent',
    border: '1px solid ' + (active ? C.accentBorder : 'rgba(15,40,100,0.12)'),
    color: active ? C.accent : C.textFaint,
  }), []);

  const headerStyle = useMemo(() => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  }), []);

  const titleStyle = useMemo(() => ({
    fontFamily: FONT, fontSize: 11, color: C.textPrimary,
    fontWeight: 600, letterSpacing: '0.05em',
  }), []);

  const legendStyle = useMemo(() => ({
    display: 'flex', gap: 8, marginTop: 5, alignItems: 'center',
    fontFamily: FONT, fontSize: 7, color: 'rgba(15,40,100,0.25)',
  }), []);

  const tooltipStyle = useMemo(() => ({
    position: 'absolute' as const,
    background: C.cardBg,
    border: '1px solid ' + C.accentBorder,
    borderRadius: 8, padding: '8px 12px', fontFamily: FONT,
    fontSize: 10, pointerEvents: 'none' as const, zIndex: 10, minWidth: 140,
    boxShadow: '0 4px 20px rgba(15,40,100,0.12)',
  }), []);

  const LEGEND_ITEMS = Object.freeze([
    [-10, 'rgba(165,15,50,0.85)'],
    [-2, 'rgba(208,35,75,0.55)'],
    ['0', 'rgba(200,205,220,0.70)'],
    ['+2', 'rgba(0,155,95,0.55)'],
    ['+10', 'rgba(0,130,80,0.90)'],
  ]);

  return (
    <GlassCard style={{ height: 300, display: 'flex', flexDirection: 'column' as const, padding: '10px 10px 8px' }}>
      <div style={headerStyle}>
        <span style={titleStyle}>MARKET HEATMAP</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {(['1h', '24h', '7d'] as TF[]).map(t => (
            <button key={t} type="button" style={btnStyle(tf === t)} onClick={() => setTf(t)} aria-pressed={tf === t}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div ref={contRef} style={{ flex: 1, position: 'relative' as const, minHeight: 0 }}>
        {loading && (
          <div style={{ position: 'absolute' as const, inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity }}
              style={{ fontFamily: FONT, fontSize: 10, color: C.textFaint, letterSpacing: '0.1em' }}>
              LOADING HEATMAP…
            </motion.span>
          </div>
        )}
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', willChange: 'transform' }}
          onMouseMove={onMove} onMouseLeave={onLeave} aria-label="Market heatmap" role="img" />
        {hoverCoin && (
          <div style={{
            ...tooltipStyle,
            left: Math.min(tipPos.x + 8, (contRef.current?.clientWidth ?? 300) - 150),
            top:  Math.max(tipPos.y - 70, 0),
          }}>
            <div style={{ color: C.textPrimary, fontWeight: 700, marginBottom: 3 }}>{hoverCoin.name}</div>
            <div style={{ color: C.textFaint, marginBottom: 3 }}>
              {'$' + (hoverCoin.price >= 1000 ? hoverCoin.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : hoverCoin.price >= 1 ? hoverCoin.price.toFixed(4) : hoverCoin.price.toFixed(8))}
            </div>
            <div style={{ color: hoverCoin.change >= 0 ? C.positive : C.negative, fontWeight: 600 }}>
              {(hoverCoin.change >= 0 ? '+' : '') + hoverCoin.change.toFixed(2) + '% (' + tf + ')'}
            </div>
          </div>
        )}
      </div>
      <div style={legendStyle}>
        <span>SIZE = MARKET CAP</span>
        <span style={{ flex: 1 }} />
        {LEGEND_ITEMS.map(([l, c]) => (
          <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: String(c) }} />
            <span>{l}%</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
});
HeatmapTile.displayName = 'HeatmapTile';
export default HeatmapTile;
