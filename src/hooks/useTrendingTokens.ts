/**
 * useTrendingTokens.ts — ZERØ MERIDIAN 2026 push82
 * Real data: CoinGecko free public API — no key required.
 * Fetches:
 *   - /search/trending   → top 15 trending coins (last 24h searches)
 *   - /coins/markets     → full data for trending + top gainers/losers
 * Zero JSX. mountedRef + AbortController. useCallback/useMemo.
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';

export interface TrendingToken {
  id: string;
  symbol: string;
  name: string;
  thumb: string;
  marketCapRank: number | null;
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  volume24h: number;
  marketCap: number;
  trendingRank: number; // 1–15 from CoinGecko trending
}

export interface TokensState {
  trending: TrendingToken[];
  gainers: TrendingToken[];
  losers: TrendingToken[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const CG_TRENDING  = 'https://api.coingecko.com/api/v3/search/trending';
const CG_MARKETS   = 'https://api.coingecko.com/api/v3/coins/markets';
const REFRESH_MS   = 60_000; // 1 min — respect free tier rate limit

const INITIAL_STATE: TokensState = Object.freeze({
  trending: [],
  gainers: [],
  losers: [],
  loading: true,
  error: null,
  lastUpdated: null,
});

export function useTrendingTokens() {
  const [state, setState]   = useState<TokensState>(INITIAL_STATE);
  const mountedRef          = useRef(true);
  const abortRef            = useRef(new AbortController());
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    if (!mountedRef.current) return;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Step 1: get trending list
      const trendRes = await fetch(CG_TRENDING, { signal });
      if (!trendRes.ok) throw new Error('Trending fetch failed: ' + trendRes.status);
      const trendJson = await trendRes.json();

      const trendingCoins: Array<{ id: string; rank: number }> =
        (trendJson?.coins ?? []).slice(0, 15).map((c: any, i: number) => ({
          id: c.item?.id ?? '',
          rank: i + 1,
        })).filter((c: { id: string; rank: number }) => c.id);

      if (!mountedRef.current) return;

      // Step 2: get market data for trending coins
      const ids = trendingCoins.map(c => c.id).join(',');
      const marketsUrl = CG_MARKETS +
        '?vs_currency=usd' +
        '&ids=' + ids +
        '&order=market_cap_desc' +
        '&per_page=50' +
        '&page=1' +
        '&sparkline=false' +
        '&price_change_percentage=7d';

      const markRes = await fetch(marketsUrl, { signal });
      if (!markRes.ok) throw new Error('Markets fetch failed: ' + markRes.status);
      const markJson: any[] = await markRes.json();

      if (!mountedRef.current) return;

      // Step 3: also fetch top 100 for gainers/losers
      const top100Url = CG_MARKETS +
        '?vs_currency=usd' +
        '&order=market_cap_desc' +
        '&per_page=100' +
        '&page=1' +
        '&sparkline=false' +
        '&price_change_percentage=7d';

      const top100Res = await fetch(top100Url, { signal });
      if (!top100Res.ok) throw new Error('Top100 fetch failed: ' + top100Res.status);
      const top100Json: any[] = await top100Res.json();

      if (!mountedRef.current) return;

      // Build trending list with rank
      const rankMap = new Map(trendingCoins.map(c => [c.id, c.rank]));

      const toToken = (c: any, rank?: number): TrendingToken => ({
        id:             c.id,
        symbol:         (c.symbol ?? '').toUpperCase(),
        name:           c.name ?? '',
        thumb:          c.image ?? '',
        marketCapRank:  c.market_cap_rank ?? null,
        price:          c.current_price ?? 0,
        priceChange24h: c.price_change_percentage_24h ?? 0,
        priceChange7d:  c.price_change_percentage_7d_in_currency ?? 0,
        volume24h:      c.total_volume ?? 0,
        marketCap:      c.market_cap ?? 0,
        trendingRank:   rank ?? 99,
      });

      const trending = markJson
        .map(c => toToken(c, rankMap.get(c.id)))
        .sort((a, b) => a.trendingRank - b.trendingRank);

      const sorted24h = [...top100Json].sort(
        (a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
      );
      const gainers = sorted24h.slice(0, 10).map(c => toToken(c));
      const losers  = sorted24h.slice(-10).reverse().map(c => toToken(c));

      setState({
        trending,
        gainers,
        losers,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        loading: false,
        error: err?.message ?? 'Unknown error',
      }));
    }

    // Schedule next refresh
    if (mountedRef.current) {
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) fetchData();
      }, REFRESH_MS);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
      abortRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    fetchData();
  }, [fetchData]);

  return useMemo(() => ({ ...state, refetch }), [state, refetch]);
}
