/**
 * Watchlist.tsx — ZERØ MERIDIAN
 * localStorage watchlist: add/remove coins, sort, notes, custom alerts
 * - localStorage key: 'zm_watchlist_v1'
 * - Live prices via CryptoContext (WS-fed)
 * - Pure SVG sparkline, zero recharts
 * - React.memo + displayName semua components
 * - useReducer state, useCallback + useMemo semua handlers
 * - Object.freeze() semua static data
 * - rgba() only, zero hsl() ✓
 * - Zero className ✓ ← push26
 * - var(--zm-*) migration ← push26
 * - Zero template literals di JSX attrs
 * - will-change: transform pada animated elements
 */

import {
  memo, useReducer, useCallback, useMemo, useEffect, useRef, useState,
} from 'react';
import { useCrypto } from '@/contexts/CryptoContext';
import SparklineChart from '@/components/shared/SparklineChart';
import { formatPrice, formatChange, formatCompact } from '@/lib/formatters';
import type { CryptoAsset } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  Star, StarOff, Search, Trash2, Plus, TrendingUp, TrendingDown,
  Minus, StickyNote, X, ArrowUpDown, ArrowUp, ArrowDown, Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WatchlistEntry {
  id: string;       // CryptoAsset.id
  addedAt: number;  // epoch ms
  note: string;
}

interface WatchlistState {
  entries: WatchlistEntry[];
  sortKey: string;
  sortAsc: boolean;
  noteEditId: string | null;
  search: string;
}

type WatchlistAction =
  | { type: 'ADD';         id: string }
  | { type: 'REMOVE';      id: string }
  | { type: 'SET_SORT';    key: string }
  | { type: 'SET_NOTE';    id: string; note: string }
  | { type: 'EDIT_NOTE';   id: string | null }
  | { type: 'SET_SEARCH';  q: string }
  | { type: 'LOAD';        entries: WatchlistEntry[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'zm_watchlist_v1';
const MAX_WATCHLIST = 50;

const SORT_COLS = Object.freeze([
  { key: 'added',     label: 'Added',   sortable: true,  align: 'left'  },
  { key: 'name',      label: 'Name',    sortable: false, align: 'left'  },
  { key: 'price',     label: 'Price',   sortable: true,  align: 'right' },
  { key: 'change24h', label: '24H%',    sortable: true,  align: 'right' },
  { key: 'change7d',  label: '7D%',     sortable: true,  align: 'right' },
  { key: 'marketCap', label: 'MCAP',    sortable: true,  align: 'right' },
  { key: 'volume24h', label: 'Volume',  sortable: true,  align: 'right' },
  { key: 'sparkline', label: '7D',      sortable: false, align: 'right' },
  { key: 'note',      label: 'Note',    sortable: false, align: 'left'  },
  { key: 'actions',   label: '',        sortable: false, align: 'right' },
] as const);

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadFromStorage(): WatchlistEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WatchlistEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: WatchlistEntry[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch { /* quota exceeded, ignore */ }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

const INITIAL: WatchlistState = Object.freeze({
  entries: [],
  sortKey: 'added',
  sortAsc: false,
  noteEditId: null,
  search: '',
} as WatchlistState);

function reducer(state: WatchlistState, action: WatchlistAction): WatchlistState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, entries: action.entries };
    case 'ADD': {
      if (state.entries.length >= MAX_WATCHLIST) return state;
      if (state.entries.some(e => e.id === action.id)) return state;
      const next = [...state.entries, { id: action.id, addedAt: Date.now(), note: '' }];
      saveToStorage(next);
      return { ...state, entries: next };
    }
    case 'REMOVE': {
      const next = state.entries.filter(e => e.id !== action.id);
      saveToStorage(next);
      return { ...state, entries: next, noteEditId: state.noteEditId === action.id ? null : state.noteEditId };
    }
    case 'SET_SORT':
      return {
        ...state,
        sortAsc: state.sortKey === action.key ? !state.sortAsc : action.key === 'added',
        sortKey: action.key,
      };
    case 'SET_NOTE': {
      const next = state.entries.map(e => e.id === action.id ? { ...e, note: action.note } : e);
      saveToStorage(next);
      return { ...state, entries: next };
    }
    case 'EDIT_NOTE':
      return { ...state, noteEditId: action.id };
    case 'SET_SEARCH':
      return { ...state, search: action.q };
    default:
      return state;
  }
}

// ─── Price Cell ───────────────────────────────────────────────────────────────

const PriceCell = memo(({ price, direction }: { price: number; direction?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(price);

  useEffect(() => {
    if (price === prev.current || !ref.current) { prev.current = price; return; }
    const cls = direction === 'up' ? 'animate-flash-pos' : direction === 'down' ? 'animate-flash-neg' : '';
    if (cls) {
      ref.current.classList.remove('animate-flash-pos', 'animate-flash-neg');
      void ref.current.offsetWidth;
      ref.current.classList.add(cls);
      const t = setTimeout(() => ref.current?.classList.remove(cls), 300);
      prev.current = price;
      return () => clearTimeout(t);
    }
    prev.current = price;
  }, [price, direction]);

  return (
    <span
      ref={ref}
            style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, borderRadius: 4, padding: '0 4px', color: 'var(--zm-text-1)', willChange: 'transform' }}
    >
      {formatPrice(price)}
    </span>
  );
});
PriceCell.displayName = 'PriceCell';

// ─── Sort Icon ────────────────────────────────────────────────────────────────

const SortIcon = memo(({ colKey, sortKey, sortAsc }: { colKey: string; sortKey: string; sortAsc: boolean }) => {
  if (colKey !== sortKey) return <ArrowUpDown size={9} style={{ opacity: 0.3 }} />;
  return sortAsc
    ? <ArrowUp size={9} style={{ color: 'var(--zm-blue)' }} />
    : <ArrowDown size={9} style={{ color: 'var(--zm-blue)' }} />;
});
SortIcon.displayName = 'SortIcon';

// ─── Note Cell ────────────────────────────────────────────────────────────────

const NoteCell = memo(({ id, note, editing, onEdit, onSave }: {
  id: string;
  note: string;
  editing: boolean;
  onEdit: (id: string) => void;
  onSave: (id: string, note: string) => void;
}) => {
  const [draft, setDraft] = useState(note);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      setDraft(note);
      inputRef.current.focus();
    }
  }, [editing, note]);

  const handleBlur = useCallback(() => {
    onSave(id, draft);
    onEdit('');
  }, [id, draft, onSave, onEdit]);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { onSave(id, draft); onEdit(''); }
    if (e.key === 'Escape') { onEdit(''); }
  }, [id, draft, onSave, onEdit]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKey}
        maxLength={80}
        style={{ width: '100%', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--zm-font-data)', outline: 'none', boxSizing: 'border-box', background: 'var(--zm-blue-bg)', border: '1px solid rgba(96,165,250,0.3)', color: 'var(--zm-text-1)', minWidth: 120 }}
        placeholder="Add note..."
      />
    );
  }

  return (
    <button
      onClick={() => onEdit(id)}
      aria-label={note ? 'Edit note: ' + note : 'Add note'}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'var(--zm-font-data)', transition: 'color 0.15s,background 0.15s', color: note ? 'rgba(148,163,184,0.7)' : 'rgba(148,163,184,0.25)', maxWidth: 160, willChange: 'transform' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'rgba(96,165,250,0.8)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = note ? 'rgba(148,163,184,0.7)' : 'rgba(148,163,184,0.25)'; }}
    >
      <StickyNote size={11} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note || 'Add note...'}</span>
    </button>
  );
});
NoteCell.displayName = 'NoteCell';

// ─── Add Coin Panel ───────────────────────────────────────────────────────────

interface AddCoinPanelProps {
  assets: CryptoAsset[];
  watchlistIds: Set<string>;
  onAdd: (id: string) => void;
  onClose: () => void;
}

const AddCoinPanel = memo(({ assets, watchlistIds, onAdd, onClose }: AddCoinPanelProps) => {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return assets.slice(0, 20);
    const lower = q.toLowerCase();
    return assets.filter(a =>
      a.name.toLowerCase().includes(lower) || a.symbol.toLowerCase().includes(lower)
    ).slice(0, 20);
  }, [assets, q]);

  return (
    <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-label="Add coin to watchlist"
      aria-modal="true" 
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', width: 420, maxHeight: '70vh', background: 'var(--zm-bg)', border: '1px solid rgba(96,165,250,0.15)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', flexShrink: 0, borderBottom: '1px solid var(--zm-blue-bg)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={15} style={{ color: 'var(--zm-blue)' }} />
            <span style={{ fontFamily: 'var(--zm-font-data)', fontSize: 14, fontWeight: 600, color: 'var(--zm-text-1)' }}>
              Add to Watchlist
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add coin panel"
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, transition: 'color 0.15s,background 0.15s', cursor: 'pointer', background: 'transparent', border: 'none', willChange: 'transform' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={14} style={{ color: 'rgba(148,163,184,0.6)' }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', flexShrink: 0, borderBottom: '1px solid rgba(96,165,250,0.06)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--zm-text-3)' }} />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search coins..."
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, fontSize: 12, fontFamily: 'var(--zm-font-data)', outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(96,165,250,0.15)', color: 'var(--zm-text-1)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.35)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.15)'; }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4, paddingBottom: 4 }}>
          {filtered.map(a => {
            const inWatchlist = watchlistIds.has(a.id);
            const isPos = a.change24h >= 0;
            return (
              <button
                key={a.id}
                onClick={() => { if (!inWatchlist) { onAdd(a.id); onClose(); } }}
                disabled={inWatchlist}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', textAlign: 'left', transition: 'color 0.15s,background 0.15s', cursor: inWatchlist ? 'not-allowed' : 'pointer', border: 'none', background: 'transparent', opacity: inWatchlist ? 0.4 : 1 }}
                onMouseEnter={e => { if (!inWatchlist) e.currentTarget.style.background = 'rgba(96,165,250,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {a.image
                  ? <img src={a.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} loading="lazy" />
                  : <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'rgba(96,165,250,0.15)' }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--zm-font-data)', fontSize: 12, fontWeight: 600, color: 'var(--zm-text-1)' }}>{a.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-2)' }}>{a.symbol.toUpperCase()}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--zm-text-1)' }}>{formatPrice(a.price)}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: isPos ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)' }}>
                    {formatChange(a.change24h)}
                  </div>
                </div>
                {inWatchlist && (
                  <Star size={13} style={{ color: 'rgba(251,191,36,0.7)', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
AddCoinPanel.displayName = 'AddCoinPanel';

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = memo(({ onAdd }: { onAdd: () => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 0', gap: 16 }}>
    <div
            style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--zm-blue-bg)', border: '1px solid rgba(96,165,250,0.15)' }}
    >
      <Star size={28} style={{ color: 'rgba(96,165,250,0.5)' }} />
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--zm-font-data)', fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'rgba(226,232,240,0.7)' }}>
        Watchlist kosong
      </div>
      <div style={{ fontFamily: 'var(--zm-font-data)', fontSize: 12, color: 'var(--zm-text-2)' }}>
        Tambah coin yang mau kamu track
      </div>
    </div>
    <button
      onClick={onAdd}
      aria-label="Add coins to watchlist"
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, fontSize: 12, fontFamily: 'var(--zm-font-data)', transition: 'all 0.15s', cursor: 'pointer', background: 'var(--zm-blue-bg)', border: '1px solid var(--zm-blue-border)', color: 'var(--zm-blue)', willChange: 'transform' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--zm-blue-bg)'; }}
    >
      <Plus size={14} /> Add Coins
    </button>
  </div>
));
EmptyState.displayName = 'EmptyState';

// ─── Main Page ────────────────────────────────────────────────────────────────

const Watchlist = memo(() => {
  const { assets, loading, wsStatus } = useCrypto();
  const { isMobile } = useBreakpoint();
  const mountedRef = useRef(true);
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (mountedRef.current) dispatch({ type: 'LOAD', entries: stored });
  }, []);

  const watchlistIds = useMemo(
    () => new Set(state.entries.map(e => e.id)),
    [state.entries]
  );

  // Merge watchlist entries with live asset data
  const watchlistAssets = useMemo(() => {
    const assetMap = new Map(assets.map(a => [a.id, a]));
    return state.entries
      .map(entry => {
        const asset = assetMap.get(entry.id);
        return asset ? { entry, asset } : null;
      })
      .filter((x): x is { entry: WatchlistEntry; asset: CryptoAsset } => x !== null);
  }, [state.entries, assets]);

  const filtered = useMemo(() => {
    if (!state.search) return watchlistAssets;
    const q = state.search.toLowerCase();
    return watchlistAssets.filter(
      ({ asset }) => asset.name.toLowerCase().includes(q) || asset.symbol.toLowerCase().includes(q)
    );
  }, [watchlistAssets, state.search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va = 0; let vb = 0;
      const { sortKey, sortAsc } = state;
      if (sortKey === 'price')       { va = a.asset.price;          vb = b.asset.price; }
      else if (sortKey === 'change24h') { va = a.asset.change24h;   vb = b.asset.change24h; }
      else if (sortKey === 'change7d')  { va = a.asset.change7d ?? 0; vb = b.asset.change7d ?? 0; }
      else if (sortKey === 'marketCap') { va = a.asset.marketCap;   vb = b.asset.marketCap; }
      else if (sortKey === 'volume24h') { va = a.asset.volume24h;   vb = b.asset.volume24h; }
      else { va = a.entry.addedAt; vb = b.entry.addedAt; }
      return sortAsc ? va - vb : vb - va;
    });
  }, [filtered, state.sortKey, state.sortAsc]);

  const stats = useMemo(() => {
    const gainers = watchlistAssets.filter(x => x.asset.change24h > 0).length;
    const losers  = watchlistAssets.filter(x => x.asset.change24h < 0).length;
    const neutral = watchlistAssets.filter(x => x.asset.change24h === 0).length;
    return { gainers, losers, neutral };
  }, [watchlistAssets]);

  const handleAdd    = useCallback((id: string)   => dispatch({ type: 'ADD', id }), []);
  const handleRemove = useCallback((id: string)   => dispatch({ type: 'REMOVE', id }), []);
  const handleSort   = useCallback((key: string)  => dispatch({ type: 'SET_SORT', key }), []);
  const handleNote   = useCallback((id: string, note: string) => dispatch({ type: 'SET_NOTE', id, note }), []);
  const handleEditNote = useCallback((id: string | null) => dispatch({ type: 'EDIT_NOTE', id }), []);
  const handleSearch = useCallback((q: string) => dispatch({ type: 'SET_SEARCH', q }), []);

  const wsColor = wsStatus === 'connected'
    ? 'rgba(52,211,153,1)'
    : wsStatus === 'reconnecting'
    ? 'rgba(251,191,36,1)'
    : 'rgba(251,113,133,1)';

  if (loading && assets.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} style={{ color: 'var(--zm-blue)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--zm-font-data)', margin: 0, background: 'linear-gradient(90deg, var(--zm-blue) 0%, var(--zm-violet) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Watchlist</h1>
          <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 4, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}
          >
            <Star size={11} style={{ color: 'rgba(96,165,250,0.8)' }} />
            <span style={{ fontSize: 10, fontFamily: 'var(--zm-font-data)', color: 'rgba(96,165,250,0.85)' }}>
              {state.entries.length}/{MAX_WATCHLIST} tracked
            </span>
          </div>
          <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 4, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}
          >
            <span
                            style={{ width: 6, height: 6, borderRadius: '50%', background: wsColor, boxShadow: wsStatus === 'connected' ? '0 0 5px ' + wsColor : 'none' }}
            />
            <span style={{ fontSize: 10, fontFamily: 'var(--zm-font-data)', color: 'rgba(52,211,153,0.85)' }}>
              {wsStatus === 'connected' ? 'LIVE' : wsStatus.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Stats */}
          {watchlistAssets.length > 0 && (
            <>
              <div
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontFamily: 'var(--zm-font-data)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', color: 'rgba(52,211,153,1)' }}
              >
                <TrendingUp size={11} /> {stats.gainers}
              </div>
              <div
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontFamily: 'var(--zm-font-data)', background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.15)', color: 'rgba(251,113,133,1)' }}
              >
                <TrendingDown size={11} /> {stats.losers}
              </div>
              <div
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontFamily: 'var(--zm-font-data)', background: 'var(--zm-border)', border: '1px solid rgba(148,163,184,0.12)', color: 'rgba(148,163,184,0.6)' }}
              >
                <Minus size={11} /> {stats.neutral}
              </div>
            </>
          )}

          {/* Add button */}
          <button
            onClick={() => setShowAdd(true)}
            disabled={state.entries.length >= MAX_WATCHLIST}
            aria-label="Add coin to watchlist"
            aria-disabled={state.entries.length >= MAX_WATCHLIST}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, fontSize: 11, fontFamily: 'var(--zm-font-data)', transition: 'all 0.15s', background: 'var(--zm-blue-bg)', border: '1px solid var(--zm-blue-border)', color: 'var(--zm-blue)', opacity: state.entries.length >= MAX_WATCHLIST ? 0.4 : 1, willChange: 'transform' }}
            onMouseEnter={e => { if (state.entries.length < MAX_WATCHLIST) e.currentTarget.style.background = 'rgba(96,165,250,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--zm-blue-bg)'; }}
          >
            <Plus size={13} /> Add Coin
          </button>
        </div>
      </div>

      {/* Search bar (only if has entries) */}
      {state.entries.length > 0 && (
        <div style={{ position: 'relative', maxWidth: 280 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--zm-text-3)' }} />
          <input
            value={state.search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Filter watchlist..."
            aria-label="Filter watchlist coins"
                        style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, fontSize: 12, fontFamily: 'var(--zm-font-data)', outline: 'none', boxSizing: 'border-box', background: 'var(--zm-surface)', border: '1px solid var(--zm-border)', color: 'var(--zm-text-1)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.35)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--zm-border)'; }}
          />
        </div>
      )}

      {/* Table or empty */}
      {state.entries.length === 0 ? (
        <div style={{ background: 'var(--zm-surface)', border: '1px solid var(--zm-border)', borderRadius: '12px', position: 'relative' }}>
          <EmptyState onAdd={() => setShowAdd(true)} />
        </div>
      ) : (
        <div style={{ overflow: 'hidden', background: 'var(--zm-surface)', border: '1px solid var(--zm-border)', borderRadius: '12px', position: 'relative' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} role="grid" aria-label="Watchlist assets">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--zm-border)', background: 'var(--zm-surface)' }}>
                  {SORT_COLS.map(col => (
                    <th
                      key={col.key}
                      style={{ padding: 12, fontSize: 10, fontFamily: 'var(--zm-font-data)', textTransform: 'uppercase', letterSpacing: '0.1em', userSelect: 'none', textAlign: col.align as 'left' | 'right', color: state.sortKey === col.key ? 'var(--zm-blue)' : 'var(--zm-text-3)', cursor: col.sortable ? 'pointer' : 'default', paddingLeft: col.key === 'added' ? 16 : undefined }}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    >
                      <span
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}
                      >
                        {col.label}
                        {col.sortable && <SortIcon colKey={col.key} sortKey={state.sortKey} sortAsc={state.sortAsc} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={SORT_COLS.length} style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
                      <div style={{ fontFamily: 'var(--zm-font-data)', fontSize: 12, color: 'var(--zm-text-3)' }}>No results</div>
                    </td>
                  </tr>
                ) : sorted.map(({ entry, asset }) => {
                  const addedDate = new Date(entry.addedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                  return (
                    <tr
                      key={asset.id}
                                            style={{ transition: 'background 0.15s', borderBottom: '1px solid var(--zm-border)', willChange: 'transform' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Added date */}
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-3)', width: 60 }}>
                        {addedDate}
                      </td>

                      {/* Name */}
                      <td style={{ padding: '10px 12px', minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {asset.image
                            ? <img src={asset.image} alt="" style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }} loading="lazy" />
                            : <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'rgba(96,165,250,0.15)' }} />
                          }
                          <div>
                            <div style={{ fontFamily: 'var(--zm-font-data)', fontSize: 12, fontWeight: 600, color: 'var(--zm-text-1)' }}>{asset.name}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-3)' }}>{asset.symbol.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', width: 120 }}>
                        <PriceCell price={asset.price} direction={asset.priceDirection} />
                      </td>

                      {/* 24h */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', width: 90 }}>
                        <span
                          style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, padding: '2px 6px', borderRadius: 4, color: asset.change24h >= 0 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)', background: asset.change24h >= 0 ? 'rgba(52,211,153,0.08)' : 'rgba(251,113,133,0.08)' }}
                        >
                          {formatChange(asset.change24h)}
                        </span>
                      </td>

                      {/* 7d */}
                      <td
                                                style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, width: 80, color: (asset.change7d ?? 0) >= 0 ? 'rgba(52,211,153,0.85)' : 'rgba(251,113,133,0.85)' }}
                      >
                        {formatChange(asset.change7d ?? 0)}
                      </td>

                      {/* MCAP */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--zm-text-2)', width: 110 }}>
                        {formatCompact(asset.marketCap)}
                      </td>

                      {/* Volume */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--zm-text-2)', width: 110 }}>
                        {formatCompact(asset.volume24h)}
                      </td>

                      {/* Sparkline */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', width: 108 }}>
                        {asset.sparkline && asset.sparkline.length > 1 && (
                          <SparklineChart data={asset.sparkline} width={96} height={28} color="auto" showArea />
                        )}
                      </td>

                      {/* Note */}
                      <td style={{ padding: '10px 12px', minWidth: 140 }}>
                        <NoteCell
                          id={asset.id}
                          note={entry.note}
                          editing={state.noteEditId === asset.id}
                          onEdit={handleEditNote}
                          onSave={handleNote}
                        />
                      </td>

                      {/* Remove */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', width: 50 }}>
                        <button
                          onClick={() => handleRemove(asset.id)}
                                                    style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginLeft: 'auto', transition: 'all 0.15s', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--zm-text-3)' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(251,113,133,0.10)';
                            e.currentTarget.style.color = 'rgba(251,113,133,0.9)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--zm-text-3)';
                          }}
                          aria-label={"Remove " + asset.name + " from watchlist"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid var(--zm-border)', background: 'rgba(255,255,255,0.01)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StarOff size={10} style={{ color: 'var(--zm-text-3)' }} />
              <span style={{ fontSize: 10, fontFamily: 'var(--zm-font-data)', color: 'var(--zm-text-3)' }}>
                {sorted.length} dari {state.entries.length} coin · Klik ikon catatan untuk edit
              </span>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--zm-font-data)', color: 'var(--zm-text-3)' }}>
              Data via Binance WS · Disimpan di browser
            </span>
          </div>
        </div>
      )}

      {/* Add coin modal */}
      {showAdd && (
        <AddCoinPanel
          assets={assets}
          watchlistIds={watchlistIds}
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
});
Watchlist.displayName = 'Watchlist';

export default Watchlist;
