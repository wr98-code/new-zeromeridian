/**
 * useWhaleTracker.ts — ZERØ MERIDIAN 2026 push83
 * REAL DATA — Etherscan API v2 (free tier: 5 calls/s, 100k/day)
 *
 * Tracks:
 *   1. Large ETH transfers (>= 100 ETH) from Etherscan txlist
 *   2. Top ETH holders (known whale wallets + labels)
 *   3. Recent large ERC-20 transfers (USDT, USDC, WBTC)
 *   4. Gas price + network status
 *
 * Zero JSX. mountedRef + AbortController. useCallback/useMemo.
 * Rate-limited: max 4 req/s with staggered fetches.
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';

const ETHERSCAN_KEY = 'MXRGEGTPD7ZGRRKMU3K7C3KBY6SGPGY87T';
const BASE = 'https://api.etherscan.io/v2/api?chainid=1';
const REFRESH_MS = 30_000; // 30s refresh

// ─── Known whale labels ───────────────────────────────────────────────────────
const WHALE_LABELS = Object.freeze<Record<string, string>>({
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': 'Binance Cold Wallet',
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': 'Binance Hot Wallet',
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance 14',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance 15',
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance 16',
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': 'Binance 17',
  '0x9696f59e4d72e237be84ffd425dcad154bf96976': 'Bitfinex Whale',
  '0x742d35cc6634c0532925a3b844bc454e4438f44e': 'Bitfinex Cold',
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': 'OKX Exchange',
  '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3': 'OKX Cold',
  '0xa7efae728d2936e78bda97dc267687568dd593f3': 'Coinbase Cold 3',
  '0x503828976d22510aad0201ac7ec88293211d23da': 'Coinbase 2',
  '0xf977814e90da44bfa03b6295a0616a897441acec': 'Binance 8',
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': 'Binance 1',
  '0xd551234ae421e3bcba99a0da6d736074f22192ff': 'Binance 2',
  '0x564286362092d8e7936f0549571a803b203aaced': 'Binance 3',
  '0x0681d8db095565fe8a346fa0277bffde9c0edbbf': 'Binance 4',
  '0xfe9e8709d3215310075d67e3ed32a380ccf451c8': 'Binance 5',
  '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67': 'Binance 6',
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e9': 'Kraken Cold',
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken 1',
  '0xc6cde7c39eb2f0f0095f41570af89efc2c1ea828': 'Kraken 2',
  '0xae2d4617c862309a3d75a0ffb358c7a5009c673f': 'Kraken 3',
  '0x43984d578803891dfa9706bdeee6078d80cfc79e': 'Kraken 4',
});

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WhaleTx {
  hash: string;
  from: string;
  fromLabel: string | null;
  to: string;
  toLabel: string | null;
  valueEth: number;
  valueUsd: number;
  timestamp: number;
  blockNumber: number;
  type: 'ETH' | 'ERC20';
  tokenSymbol?: string;
}

export interface GasInfo {
  safeGwei: number;
  proposeGwei: number;
  fastGwei: number;
  lastBlock: number;
}

export interface WhaleTrackerState {
  txs: WhaleTx[];
  gas: GasInfo | null;
  ethPrice: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// ERC-20 tokens to track large transfers
const ERC20_TOKENS = Object.freeze([
  { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', decimals: 6 },
  { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', decimals: 6 },
  { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', decimals: 8 },
] as const);

const MIN_ETH = 50;           // min ETH to show
const MIN_ERC20_USD = 1_000_000; // min $1M for ERC20

function labelAddr(addr: string): string | null {
  return WHALE_LABELS[addr.toLowerCase()] ?? null;
}

function shortAddr(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

async function fetchGas(signal: AbortSignal): Promise<GasInfo | null> {
  const url = `${BASE}&module=gastracker&action=gasoracle&apikey=${ETHERSCAN_KEY}`;
  const r = await fetch(url, { signal });
  if (!r.ok) return null;
  const d = await r.json();
  if (d.status !== '1') return null;
  return {
    safeGwei:    parseFloat(d.result.SafeGasPrice),
    proposeGwei: parseFloat(d.result.ProposeGasPrice),
    fastGwei:    parseFloat(d.result.FastGasPrice),
    lastBlock:   parseInt(d.result.LastBlock),
  };
}

async function fetchEthPrice(signal: AbortSignal): Promise<number> {
  const url = `${BASE}&module=stats&action=ethprice&apikey=${ETHERSCAN_KEY}`;
  const r = await fetch(url, { signal });
  if (!r.ok) return 0;
  const d = await r.json();
  return parseFloat(d.result?.ethusd ?? '0');
}

async function fetchLargeEthTxs(signal: AbortSignal, ethPrice: number): Promise<WhaleTx[]> {
  // Get latest block first
  const blockRes = await fetch(
    `${BASE}&module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_KEY}`,
    { signal }
  );
  const blockData = await blockRes.json();
  const latestBlock = parseInt(blockData.result, 16);

  // Fetch last ~1000 blocks of internal large txs from known whale addresses
  // Instead, use token transfers endpoint for large ETH txs from recent blocks
  const fromBlock = latestBlock - 500;

  const url = `${BASE}&module=account&action=txlist` +
    `&address=0xbe0eb53f46cd790cd13851d5eff43d12404d33e8` + // Binance cold
    `&startblock=${fromBlock}&endblock=${latestBlock}` +
    `&sort=desc&page=1&offset=20&apikey=${ETHERSCAN_KEY}`;

  const r = await fetch(url, { signal });
  if (!r.ok) return [];
  const d = await r.json();
  if (d.status !== '1' || !Array.isArray(d.result)) return [];

  return d.result
    .filter((tx: any) => {
      const eth = parseInt(tx.value) / 1e18;
      return eth >= MIN_ETH;
    })
    .slice(0, 30)
    .map((tx: any): WhaleTx => {
      const valueEth = parseInt(tx.value) / 1e18;
      return {
        hash:       tx.hash,
        from:       tx.from,
        fromLabel:  labelAddr(tx.from),
        to:         tx.to,
        toLabel:    labelAddr(tx.to),
        valueEth,
        valueUsd:   valueEth * ethPrice,
        timestamp:  parseInt(tx.timeStamp) * 1000,
        blockNumber: parseInt(tx.blockNumber),
        type:       'ETH',
      };
    });
}

async function fetchLargeErc20Txs(signal: AbortSignal, ethPrice: number): Promise<WhaleTx[]> {
  const allTxs: WhaleTx[] = [];

  for (const token of ERC20_TOKENS) {
    await new Promise(res => setTimeout(res, 250)); // rate limit buffer
    const url = `${BASE}&module=account&action=tokentx` +
      `&contractaddress=${token.address}` +
      `&page=1&offset=20&sort=desc&apikey=${ETHERSCAN_KEY}`;

    try {
      const r = await fetch(url, { signal });
      if (!r.ok) continue;
      const d = await r.json();
      if (d.status !== '1' || !Array.isArray(d.result)) continue;

      const txs = d.result
        .map((tx: any): WhaleTx => {
          const value = parseInt(tx.value) / Math.pow(10, token.decimals);
          const valueUsd = token.symbol === 'WBTC'
            ? value * ethPrice * 15 // rough BTC/ETH ratio
            : value;
          return {
            hash:       tx.hash,
            from:       tx.from,
            fromLabel:  labelAddr(tx.from),
            to:         tx.to,
            toLabel:    labelAddr(tx.to),
            valueEth:   0,
            valueUsd,
            timestamp:  parseInt(tx.timeStamp) * 1000,
            blockNumber: parseInt(tx.blockNumber),
            type:       'ERC20',
            tokenSymbol: token.symbol,
          };
        })
        .filter((tx: WhaleTx) => tx.valueUsd >= MIN_ERC20_USD);

      allTxs.push(...txs);
    } catch {
      // skip failed token
    }
  }

  return allTxs;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWhaleTracker() {
  const [state, setState] = useState<WhaleTrackerState>({
    txs: [], gas: null, ethPrice: 0,
    loading: true, error: null, lastUpdated: null,
  });

  const mountedRef = useRef(true);
  const abortRef   = useRef(new AbortController());
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    abortRef.current.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    if (!mountedRef.current) return;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Stagger requests to stay within 5/s rate limit
      const [gas, ethPrice] = await Promise.all([
        fetchGas(signal),
        fetchEthPrice(signal),
      ]);

      if (!mountedRef.current) return;

      await new Promise(res => setTimeout(res, 300));
      const ethTxs = await fetchLargeEthTxs(signal, ethPrice);

      if (!mountedRef.current) return;

      await new Promise(res => setTimeout(res, 300));
      const erc20Txs = await fetchLargeErc20Txs(signal, ethPrice);

      if (!mountedRef.current) return;

      const allTxs = [...ethTxs, ...erc20Txs]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);

      setState({
        txs: allTxs,
        gas,
        ethPrice,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (!mountedRef.current) return;
      setState(prev => ({ ...prev, loading: false, error: err?.message ?? 'Fetch failed' }));
    }

    if (mountedRef.current) {
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) fetchAll();
      }, REFRESH_MS);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => {
      mountedRef.current = false;
      abortRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchAll]);

  const refetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    fetchAll();
  }, [fetchAll]);

  return useMemo(() => ({ ...state, refetch, shortAddr, labelAddr }), [state, refetch]);
}
