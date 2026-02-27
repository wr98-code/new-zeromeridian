/**
 * GlobalStatsBar.tsx — ZERØ MERIDIAN 2026 push85
 * push85: WS disconnect warning yang eksplisit + status indicator
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - useCallback + useMemo + mountedRef ✓
 */

import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { formatCompact } from '@/lib/formatters';

const FG_COLORS = Object.freeze([
  { max: 25,  color: 'rgba(255,102,102,1)',  bg: 'rgba(255,102,102,0.12)' },
  { max: 45,  color: 'rgba(255,187,0,1)',    bg: 'rgba(255,187,0,0.12)'   },
  { max: 55,  color: 'rgba(138,138,158,1)',  bg: 'rgba(138,138,158,0.10)' },
  { max: 75,  color: 'rgba(61,214,140,1)',   bg: 'rgba(61,214,140,0.10)'  },
  { max: 100, color: 'rgba(79,127,255,1)',   bg: 'rgba(79,127,255,0.10)'  },
]);

const FearGreedBadge = memo(({ value, label }: { value: number; label: string }) => {
  const cfg = useMemo(() => FG_COLORS.find(c => value <= c.max) ?? FG_COLORS[FG_COLORS.length - 1], [value]);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:'rgba(80,80,100,1)' }}>F&G</span>
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'1px 6px', borderRadius:4, background:cfg.bg }}>
        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, fontWeight:700, color:cfg.color }}>{value}</span>
        <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:cfg.color }}>{label}</span>
      </div>
    </div>
  );
});
FearGreedBadge.displayName = 'FearGreedBadge';

const Div = memo(() => <div style={{ width:1, height:14, background:'rgba(79,127,255,0.1)', flexShrink:0 }} />);
Div.displayName = 'Div';

const StatItem = memo(({ label, value, change, accent }: { label:string; value:string; change?:number; accent?:string }) => {
  const changeColor = change != null ? (change >= 0 ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)') : undefined;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
      <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:'rgba(80,80,100,1)' }}>{label}</span>
      <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, fontWeight:600, color: accent ?? 'rgba(240,240,248,1)' }}>{value}</span>
      {change != null && <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:changeColor }}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>}
    </div>
  );
});
StatItem.displayName = 'StatItem';

// ─── Live Ticker with WS status tracking ──────────────────────────────────────

type WsStatus = 'connected' | 'disconnected' | 'reconnecting';

const WS_SYMBOLS = Object.freeze(['btcusdt','ethusdt','solusdt','bnbusdt','xrpusdt']);

interface TickerItem { symbol: string; price: string; change: number; }

const LiveTickerWithStatus = memo(({ onStatus }: { onStatus: (s: WsStatus) => void }) => {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const wsRef    = useRef<WebSocket|null>(null);
  const mountRef = useRef(true);

  useEffect(() => {
    mountRef.current = true;

    function connect() {
      if (!mountRef.current) return;
      onStatus('reconnecting');
      const streams = WS_SYMBOLS.map(s => s + '@miniTicker').join('/');
      const ws = new WebSocket('wss://stream.binance.com:9443/stream?streams=' + streams);
      wsRef.current = ws;

      ws.onopen = () => { if (mountRef.current) onStatus('connected'); };
      ws.onmessage = (e) => {
        if (!mountRef.current) return;
        try {
          const d = JSON.parse(e.data).data;
          if (!d?.s) return;
          const sym = d.s.replace('USDT','');
          const price = parseFloat(d.c);
          const open  = parseFloat(d.o);
          const change = open > 0 ? ((price - open) / open) * 100 : 0;
          const fmt = price >= 1000 ? '$' + price.toLocaleString('en-US',{maximumFractionDigits:0}) : price >= 1 ? '$' + price.toFixed(2) : '$' + price.toFixed(4);
          setTickers(prev => {
            const next = prev.filter(t => t.symbol !== sym);
            next.push({ symbol: sym, price: fmt, change });
            return next.sort((a,b) => WS_SYMBOLS.indexOf(a.symbol.toLowerCase()+'usdt') - WS_SYMBOLS.indexOf(b.symbol.toLowerCase()+'usdt'));
          });
        } catch { /* ignore */ }
      };
      ws.onerror = () => {};
      ws.onclose = () => {
        if (mountRef.current) {
          onStatus('disconnected');
          setTimeout(connect, 3000);
        }
      };
    }

    connect();
    return () => { mountRef.current = false; wsRef.current?.close(); };
  }, []); // eslint-disable-line

  if (tickers.length === 0) return null;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, overflow:'hidden' }}>
      {tickers.map(t => {
        const pos = t.change >= 0;
        return (
          <div key={t.symbol} style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
            <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:'rgba(138,138,158,1)', letterSpacing:'0.05em' }}>{t.symbol}</span>
            <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:'rgba(240,240,248,1)' }}>{t.price}</span>
            <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color: pos ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)' }}>{pos ? '+' : ''}{t.change.toFixed(2)}%</span>
          </div>
        );
      })}
    </div>
  );
});
LiveTickerWithStatus.displayName = 'LiveTickerWithStatus';

// ─── WS Status Badge ──────────────────────────────────────────────────────────

const WsStatusBadge = memo(({ status }: { status: WsStatus }) => {
  const cfg = useMemo(() => {
    if (status === 'connected')    return { color:'rgba(52,211,153,0.85)', bg:'rgba(52,211,153,0.06)',  border:'rgba(52,211,153,0.14)', dot:'rgba(52,211,153,0.9)',  label:'LIVE',   pulse:true  };
    if (status === 'reconnecting') return { color:'rgba(255,187,0,0.9)',   bg:'rgba(255,187,0,0.06)',   border:'rgba(255,187,0,0.18)',  dot:'rgba(255,187,0,0.9)',   label:'SYNC…',  pulse:true  };
    return                                { color:'rgba(255,68,68,0.9)',   bg:'rgba(255,68,68,0.07)',   border:'rgba(255,68,68,0.2)',   dot:'rgba(255,68,68,0.9)',   label:'OFFLINE', pulse:false };
  }, [status]);

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'5px', background:cfg.bg, border:'1px solid '+cfg.border, borderRadius:'16px', padding:'4px 10px', fontSize:'10px', fontFamily:"'Space Mono', monospace", color:cfg.color, letterSpacing:'0.08em', flexShrink:0 }}
      role="status" aria-label={'WebSocket status: '+status}
    >
      <motion.div style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot, flexShrink:0 }}
        animate={cfg.pulse ? { opacity:[1,0.35,1] } : { opacity:1 }}
        transition={{ duration:1.8, repeat:Infinity }}
        aria-hidden="true"
      />
      {cfg.label}
    </div>
  );
});
WsStatusBadge.displayName = 'WsStatusBadge';

// ─── GlobalStatsBar ───────────────────────────────────────────────────────────

const GlobalStatsBar = memo(() => {
  const stats = useGlobalStats();
  const [wsStatus, setWsStatus] = useState<WsStatus>('reconnecting');

  const mcapStr = useMemo(() => formatCompact(stats.totalMarketCap),  [stats.totalMarketCap]);
  const volStr  = useMemo(() => formatCompact(stats.totalVolume24h),  [stats.totalVolume24h]);

  const barStyle = useMemo(() => ({
    position: 'fixed' as const, top:0, left:0, right:0, zIndex:200, height:28,
    background: 'rgba(5,6,12,1)', borderBottom: '1px solid rgba(255,255,255,0.05)',
    backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
    display:'flex', alignItems:'center', padding:'0 16px', gap:12, overflow:'hidden',
  }), []);

  if (stats.loading && stats.lastUpdate === 0) {
    return (
      <div style={barStyle}>
        <div style={{ width:160, height:8, borderRadius:4, background:'rgba(79,127,255,0.08)' }} />
      </div>
    );
  }

  return (
    <div style={barStyle} aria-label="Global market stats bar">
      {/* Brand */}
      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
        <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(79,127,255,0.8)', boxShadow:'0 0 6px rgba(79,127,255,0.6)' }} />
        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, fontWeight:700, letterSpacing:'0.18em', color:'rgba(79,127,255,0.7)' }}>ZERØ</span>
      </div>
      <Div />
      <StatItem label="MCAP" value={mcapStr} change={stats.marketCapChange24h} />
      <Div />
      <StatItem label="VOL" value={volStr} />
      <Div />
      <StatItem label="BTC.D" value={stats.btcDominance.toFixed(1)+'%'} accent="rgba(255,187,0,1)" />
      <Div />
      <StatItem label="ETH.D" value={stats.ethDominance.toFixed(1)+'%'} accent="rgba(176,130,255,1)" />
      <Div />
      <FearGreedBadge value={stats.fearGreedValue} label={stats.fearGreedLabel} />

      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
        <Div />
        <LiveTickerWithStatus onStatus={setWsStatus} />
        <Div />
        {/* WS Status — eksplisit, bukan cuma dot */}
        <WsStatusBadge status={wsStatus} />
      </div>
    </div>
  );
});

GlobalStatsBar.displayName = 'GlobalStatsBar';
export default GlobalStatsBar;
