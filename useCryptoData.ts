/**
 * useCryptoData.ts — ZERØ MERIDIAN v31 push91
 * FIX CRITICAL: Skip WebTransport sepenuhnya — langsung connectWS()
 * Binance tidak punya WebTransport endpoint. WT attempt hanya buang waktu
 * dan trigger race condition dengan leader election.
 * mountedRef + AbortController ✓
 */

import { useEffect, useRef, useCallback } from 'react';
import { useCrypto, useCryptoDispatch } from '@/contexts/CryptoContext';
import { getReconnectDelay, type CryptoAsset } from '@/lib/formatters';
import { useIndexedDB } from '@/hooks/useIndexedDB';

const SYMBOLS = Object.freeze([
  'btcusdt','ethusdt','solusdt','bnbusdt','xrpusdt',
  'adausdt','avaxusdt','dogeusdt','dotusdt','maticusdt',
  'linkusdt','uniusdt','ltcusdt','atomusdt','nearusdt',
  'trxusdt','shibusdt','tonusdt','arbusdt','opusdt',
] as const);

const WS_URL = 'wss://stream.binance.com:9443/stream?streams=' +
  SYMBOLS.map(s => s + '@ticker').join('/');

const EDGE_MARKETS = '/api/markets';
const EDGE_GLOBAL  = '/api/global?t=global';
const EDGE_FNG     = '/api/global?t=fng';
const CG_MARKETS   = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=7d,30d';
const CG_GLOBAL    = 'https://api.coingecko.com/api/v3/global';
const FNG_URL      = 'https://api.alternative.me/fng/?limit=1';

const PERSIST_SYMBOLS = Object.freeze(['btcusdt', 'ethusdt', 'solusdt'] as const);

async function fetchWithFallback(primary: string, fallback: string, signal: AbortSignal): Promise<Response> {
  try {
    const res = await fetch(primary, { signal });
    if (res.ok) return res;
    throw new Error('primary failed');
  } catch {
    return fetch(fallback, { signal });
  }
}

export function useCryptoData() {
  const dispatch = useCryptoDispatch();
  const { isLeader } = useCrypto();
  const { saveTick, loadTicks } = useIndexedDB();

  const mountedRef   = useRef(true);
  const abortRef     = useRef(new AbortController());
  const wsRef        = useRef<WebSocket | null>(null);
  const attemptRef   = useRef(0);
  const lastPriceRef = useRef<Record<string, number>>({});
  const isLeaderRef  = useRef(isLeader);

  useEffect(() => { isLeaderRef.current = isLeader; }, [isLeader]);

  const processTick = useCallback((
    symbol: string, price: number, pctChange: number,
    high24h: number, low24h: number, volume24h: number,
  ) => {
    if (!mountedRef.current || !isLeaderRef.current) return;
    const key      = symbol.toLowerCase();
    const prevPrice = lastPriceRef.current[key] ?? price;
    const direction: 'up' | 'down' | 'neutral' =
      price > prevPrice ? 'up' : price < prevPrice ? 'down' : 'neutral';
    lastPriceRef.current[key] = price;
    dispatch({
      type: 'UPDATE_PRICES',
      payload: { [key]: { price, change24h: pctChange, high24h, low24h, volume24h, direction } },
    });
    if ((PERSIST_SYMBOLS as readonly string[]).includes(key)) {
      saveTick(key, price).catch(() => {});
    }
  }, [dispatch, saveTick]);

  const connectWS = useCallback(() => {
    if (!mountedRef.current || !isLeaderRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    dispatch({ type: 'SET_WS_STATUS', payload: 'connecting' });

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      attemptRef.current = 0;
      dispatch({ type: 'SET_WS_STATUS', payload: 'connected' });
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      if (!mountedRef.current || !isLeaderRef.current) return;
      try {
        const msg = JSON.parse(event.data) as Record<string, unknown>;
        const d = msg.data as Record<string, unknown>;
        if (typeof d?.s !== 'string') return;
        processTick(
          String(d.s), parseFloat(String(d.c)), parseFloat(String(d.P)),
          parseFloat(String(d.h)), parseFloat(String(d.l)), parseFloat(String(d.v)),
        );
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      dispatch({ type: 'SET_WS_STATUS', payload: 'reconnecting' });
      if (attemptRef.current < 8) {
        const delay = getReconnectDelay(attemptRef.current++);
        setTimeout(connectWS, delay);
      }
    };

    ws.onerror = () => { ws.close(); };
  }, [dispatch, processTick]);

  const fetchMarkets = useCallback(async () => {
    if (!isLeaderRef.current) return;
    try {
      const res = await fetchWithFallback(EDGE_MARKETS, CG_MARKETS, abortRef.current.signal);
      if (!res.ok || !mountedRef.current) return;
      const data = await res.json() as Record<string, unknown>[];
      if (!mountedRef.current) return;
      const assets: CryptoAsset[] = data.map((c, i: number) => ({
        id:                String(c.id ?? ''),
        symbol:            String(c.symbol ?? ''),
        name:              String(c.name ?? ''),
        price:             Number(c.current_price ?? 0),
        change24h:         Number(c.price_change_percentage_24h ?? 0),
        change7d:          Number(c.price_change_percentage_7d_in_currency ?? 0),
        change30d:         Number(c.price_change_percentage_30d_in_currency ?? 0),
        marketCap:         Number(c.market_cap ?? 0),
        volume24h:         Number(c.total_volume ?? 0),
        circulatingSupply: Number(c.circulating_supply ?? 0),
        totalSupply:       c.total_supply != null ? Number(c.total_supply) : undefined,
        ath:               Number(c.ath ?? 0),
        athDate:           String(c.ath_date ?? ''),
        rank:              Number(c.market_cap_rank ?? i + 1),
        image:             String(c.image ?? ''),
        sparkline:         ((c.sparkline_in_7d as Record<string, number[]>)?.price) ?? [],
        lastUpdated:       String(c.last_updated ?? ''),
        priceDirection:    'neutral' as const,
      }));
      for (const a of assets) lastPriceRef.current[a.symbol.toLowerCase() + 'usdt'] = a.price;
      dispatch({ type: 'UPDATE_MARKETS', payload: assets });
    } catch (e: unknown) {
      if ((e as Error)?.name !== 'AbortError' && mountedRef.current) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch market data' });
      }
    }
  }, [dispatch]);

  const fetchGlobal = useCallback(async () => {
    if (!isLeaderRef.current) return;
    try {
      const res = await fetchWithFallback(EDGE_GLOBAL, CG_GLOBAL, abortRef.current.signal);
      if (!res.ok || !mountedRef.current) return;
      const json = await res.json() as { data: Record<string, unknown> };
      const d = json.data;
      if (!mountedRef.current) return;
      dispatch({
        type: 'UPDATE_GLOBAL',
        payload: {
          totalMcap:        Number((d.total_market_cap as Record<string, number>)?.usd ?? 0),
          totalVolume:      Number((d.total_volume as Record<string, number>)?.usd ?? 0),
          btcDominance:     Number((d.market_cap_percentage as Record<string, number>)?.btc ?? 0),
          ethDominance:     Number((d.market_cap_percentage as Record<string, number>)?.eth ?? 0),
          activeCurrencies: Number(d.active_cryptocurrencies ?? 0),
          mcapChange24h:    Number(d.market_cap_change_percentage_24h_usd ?? 0),
        },
      });
    } catch { /* ignore */ }
  }, [dispatch]);

  const fetchFearGreed = useCallback(async () => {
    if (!isLeaderRef.current) return;
    try {
      const res = await fetchWithFallback(EDGE_FNG, FNG_URL, abortRef.current.signal);
      if (!res.ok || !mountedRef.current) return;
      const json = await res.json() as { data: Record<string, string>[] };
      const d = json.data?.[0];
      if (!mountedRef.current || !d) return;
      dispatch({ type: 'UPDATE_FEAR_GREED', payload: { value: Number(d.value), label: d.value_classification } });
    } catch { /* ignore */ }
  }, [dispatch]);

  // Pre-warm price cache from IndexedDB
  useEffect(() => {
    if (!isLeader) return;
    void (async () => {
      for (const sym of PERSIST_SYMBOLS) {
        try {
          const ticks = await loadTicks(sym, 1);
          if (ticks.length > 0 && mountedRef.current) {
            lastPriceRef.current[sym] = ticks[ticks.length - 1].price;
          }
        } catch { /* ignore */ }
      }
    })();
  }, [isLeader, loadTicks]);

  useEffect(() => {
    if (!isLeader) return;
    mountedRef.current = true;
    abortRef.current   = new AbortController();

    fetchMarkets();
    fetchGlobal();
    fetchFearGreed();

    // FIX CRITICAL: Skip WebTransport sepenuhnya, langsung WS
    // Binance tidak support WebTransport — WT hanya buang waktu + trigger race condition
    connectWS();

    const t1 = setInterval(fetchMarkets,    30_000);
    const t2 = setInterval(fetchGlobal,     60_000);
    const t3 = setInterval(fetchFearGreed, 300_000);

    return () => {
      mountedRef.current = false;
      abortRef.current.abort();
      wsRef.current?.close();
      clearInterval(t1); clearInterval(t2); clearInterval(t3);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeader]);
}
