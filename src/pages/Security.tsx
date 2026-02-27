/**
 * Security.tsx — ZERØ MERIDIAN 2026 push84
 * push84: REAL DATA — GoPlus Security API (free, no API key).
 * Features: token security scan, honeypot detection, tax check, risk score.
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo ✓
 */

import React, { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenSecurity, FEATURED_TOKENS, type TokenSecurityResult } from '@/hooks/useTokenSecurity';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const CHAIN_OPTIONS = Object.freeze([
  { id: 1,     label: 'Ethereum'  },
  { id: 56,    label: 'BSC'       },
  { id: 137,   label: 'Polygon'   },
  { id: 42161, label: 'Arbitrum'  },
  { id: 8453,  label: 'Base'      },
  { id: 43114, label: 'Avalanche' },
] as const);

// ─── Risk badge ───────────────────────────────────────────────────────────────
const RiskBadge = React.memo(({ level, score }: { level: TokenSecurityResult['riskLevel']; score: number }) => {
  const cfg = useMemo(() => {
    if (level === 'LOW')      return { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  color: 'rgba(52,211,153,1)' };
    if (level === 'MEDIUM')   return { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', color: 'rgba(251,191,36,1)' };
    if (level === 'HIGH')     return { bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.3)', color: 'rgba(251,113,133,1)' };
    return { bg: 'rgba(200,0,0,0.15)', border: 'rgba(200,0,0,0.4)', color: 'rgba(255,60,60,1)' };
  }, [level]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
      <div style={{ background: cfg.bg, border: '1px solid ' + cfg.border, borderRadius: '10px', padding: '6px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: cfg.color, letterSpacing: '0.1em' }}>
        {level}
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
        Risk {score}/100
      </span>
    </div>
  );
});
RiskBadge.displayName = 'RiskBadge';

// ─── Flag chip ────────────────────────────────────────────────────────────────
const FlagChip = React.memo(({ flag }: { flag: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '5px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 700, background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.25)', color: 'rgba(251,113,133,0.9)', letterSpacing: '0.05em' }}>
    ⚠ {flag}
  </span>
));
FlagChip.displayName = 'FlagChip';

// ─── Check row ────────────────────────────────────────────────────────────────
const CheckRow = React.memo(({ label, value, danger }: { label: string; value: string | boolean; danger?: boolean }) => {
  const isBad = danger && (value === true || value === 'Yes');
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, color: isBad ? 'rgba(251,113,133,1)' : typeof value === 'boolean' ? (value ? 'rgba(52,211,153,1)' : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.8)' }}>
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
      </span>
    </div>
  );
});
CheckRow.displayName = 'CheckRow';

// ─── Result card ─────────────────────────────────────────────────────────────
const ResultCard = React.memo(({ result }: { result: TokenSecurityResult }) => {
  const cardStyle = useMemo(() => Object.freeze({
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '20px',
    marginTop: '16px',
  }), []);

  return (
    <motion.div style={cardStyle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Token header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '12px' }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
            {result.tokenName}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            {result.tokenSymbol} · {result.contractAddress.slice(0, 10)}...
          </div>
        </div>
        <RiskBadge level={result.riskLevel} score={result.riskScore} />
      </div>

      {/* Risk flags */}
      {result.riskFlags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '16px' }}>
          {result.riskFlags.map(f => <FlagChip key={f} flag={f} />)}
        </div>
      )}
      {result.riskFlags.length === 0 && (
        <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(52,211,153,0.9)' }}>
          ✓ No risk flags detected
        </div>
      )}

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Contract</div>
          <CheckRow label="Open Source"   value={result.isOpenSource} />
          <CheckRow label="Proxy"         value={result.isProxy} danger />
          <CheckRow label="Mintable"      value={result.isMintable} danger />
          <CheckRow label="Self Destruct" value={result.selfDestruct} danger />
          <CheckRow label="External Call" value={result.externalCall} danger />
        </div>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Ownership & Tax</div>
          <CheckRow label="Hidden Owner"  value={result.hiddenOwner} danger />
          <CheckRow label="Owner Mint"    value={result.ownerChangeBalance} danger />
          <CheckRow label="Blacklist"     value={result.isBlacklisted} danger />
          <CheckRow label="Buy Tax"       value={(result.buyTax * 100).toFixed(1) + '%'} />
          <CheckRow label="Sell Tax"      value={(result.sellTax * 100).toFixed(1) + '%'} />
        </div>
      </div>

      {/* Holders */}
      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Holders', val: result.holderCount > 0 ? result.holderCount.toLocaleString() : '—' },
          { label: 'LP Holders', val: result.lpHolderCount > 0 ? result.lpHolderCount.toLocaleString() : '—' },
          { label: 'Creator %', val: result.creatorPercent > 0 ? (result.creatorPercent * 100).toFixed(1) + '%' : '—' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: '3px' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* DEX info */}
      {result.dexInfo.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
          {result.dexInfo.slice(0, 4).map((dex, i) => (
            <div key={i} style={{ background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.14)', borderRadius: '6px', padding: '4px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(0,200,255,0.7)' }}>
              {dex.name}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>
        Powered by GoPlus Security API
      </div>
    </motion.div>
  );
});
ResultCard.displayName = 'ResultCard';

// ─── Featured token button ────────────────────────────────────────────────────
const FeaturedBtn = React.memo(({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s' }}>
    {label}
  </button>
));
FeaturedBtn.displayName = 'FeaturedBtn';

// ─── Main page ────────────────────────────────────────────────────────────────
const Security: React.FC = () => {
  const { result, loading, error, scan } = useTokenSecurity();
  const { isMobile } = useBreakpoint();
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(1);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    // Auto-scan USDT on load as demo
    scan('0xdac17f958d2ee523a2206206994597c13d831ec7', 1);
    return () => { mountedRef.current = false; };
  }, [scan]);

  const handleScan = useCallback(() => {
    if (address.trim()) scan(address.trim(), chainId);
  }, [address, chainId, scan]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleScan();
  }, [handleScan]);

  const handleFeatured = useCallback((addr: string, cid: number) => {
    setAddress(addr);
    scan(addr, cid);
  }, [scan]);

  const inputStyle = useMemo(() => Object.freeze({
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'rgba(255,255,255,0.9)',
    outline: 'none',
    minWidth: 0,
  }), []);

  const selectStyle = useMemo(() => Object.freeze({
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 12px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: 'rgba(255,255,255,0.8)',
    outline: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  }), []);

  const scanBtnStyle = useMemo(() => Object.freeze({
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: loading ? 'rgba(0,200,255,0.1)' : 'rgba(0,200,255,0.15)',
    border: '1px solid rgba(0,200,255,0.3)',
    color: 'rgba(0,200,255,1)',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
  }), [loading]);

  return (
    <div style={{ padding: isMobile ? '16px 12px' : '24px', maxWidth: '800px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: '0 0 20px' }}>
        🛡️ Security Scanner
      </h1>

      {/* Search box */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: isMobile ? 'wrap' as const : 'nowrap' as const }}>
          <input
            style={inputStyle}
            placeholder="0x contract address..."
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={handleKey}
            spellCheck={false}
            autoComplete="off"
          />
          <select
            style={selectStyle}
            value={chainId}
            onChange={e => setChainId(Number(e.target.value))}
          >
            {CHAIN_OPTIONS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <button style={scanBtnStyle} onClick={handleScan} disabled={loading}>
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </div>

        {/* Featured tokens */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>QUICK:</span>
          {FEATURED_TOKENS.map(t => (
            <FeaturedBtn key={t.address} label={t.label} onClick={() => handleFeatured(t.address, t.chainId)} />
          ))}
        </div>
      </div>

      {/* Source badge */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
        <div style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.12)', borderRadius: '8px', padding: '5px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(0,200,255,0.6)' }}>
          GoPlus Security API · free · no key
        </div>
      </div>

      {/* Result / loading / error */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ marginTop: '20px', display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {Array.from({ length: 4 }, (_, i) => (
              <motion.div key={i} style={{ height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}
                animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }} />
            ))}
          </motion.div>
        )}
        {error && !loading && (
          <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: 'rgba(251,113,133,0.9)' }}>
            ⚠ {error}
          </motion.div>
        )}
        {result && !loading && (
          <ResultCard key={result.contractAddress + result.chainId} result={result} />
        )}
      </AnimatePresence>
    </div>
  );
};

Security.displayName = 'Security';
export default memo(Security);
