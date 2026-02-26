/**
 * App.tsx — ZERØ MERIDIAN 2026 Phase 13 (push23)
 * push23: ThemeProvider (next-themes) dipasang di sini.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - QueryClient optimized ✓
 * - ThemeProvider ← NEW push23
 */

import { memo, lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './src/components/ui/toaster';
import { Toaster as Sonner } from './src/components/ui/sonner';
import { TooltipProvider } from './src/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CryptoProvider } from '@/contexts/CryptoContext';
import { useCryptoData } from '@/hooks/useCryptoData';
import Skeleton from './src/components/shared/Skeleton';
import {
  Landmark, ShieldCheck,
  Coins, Gem, DollarSign, Brain, Bot,
  Target, Radio, Map, Image, Bitcoin, Vote,
  Wrench, Timer,
} from 'lucide-react';

// ─── Lazy Pages ───────────────────────────────────────────────────────────────

const Portal        = lazy(() => import('./src/pages/Portal'));
const Dashboard     = lazy(() => import('./src/pages/Dashboard'));
const Markets       = lazy(() => import('./src/pages/Markets'));
const OrderBook     = lazy(() => import('./src/pages/OrderBook'));
const Derivatives   = lazy(() => import('./src/pages/Derivatives'));
const Alerts        = lazy(() => import('./src/pages/Alerts'));
const Watchlist     = lazy(() => import('./src/pages/Watchlist'));
const Converter     = lazy(() => import('./src/pages/Converter'));
const Defi          = lazy(() => import('./src/pages/Defi'));
const PageStub      = lazy(() => import('./src/components/shared/PageStub'));
const OnChain       = lazy(() => import('./src/pages/OnChain'));
const Intelligence  = lazy(() => import('./src/pages/Intelligence'));
const Charts        = lazy(() => import('./src/pages/Charts'));
const Fundamentals  = lazy(() => import('./src/pages/Fundamentals'));
const Portfolio     = lazy(() => import('./src/pages/Portfolio'));
const Networks      = lazy(() => import('./src/pages/Networks'));
const Tokens        = lazy(() => import('./src/pages/Tokens'));
const NotFound      = lazy(() => import('./src/pages/NotFound'));
import AppShell     from './src/components/layout/AppShell';

// ─── QueryClient ──────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30_000,
      gcTime:               5 * 60 * 1000,
      retry:                1,
      refetchOnWindowFocus: false,
      refetchOnReconnect:   true,
    },
  },
});

// ─── Fallback ─────────────────────────────────────────────────────────────────

const PageFallback = memo(() => (
  <div style={{ padding: '20px' }}>
    <Skeleton.Page />
  </div>
));
PageFallback.displayName = 'PageFallback';

// ─── DataLoaderShell ─────────────────────────────────────────────────────────

const DataLoaderShell = memo(() => {
  useCryptoData();
  return (
    <AppShell>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/markets"       element={<Markets />} />
          <Route path="/orderbook"     element={<OrderBook />} />
          <Route path="/derivatives"   element={<Derivatives />} />
          <Route path="/alerts"        element={<Alerts />} />
          <Route path="/watchlist"     element={<Watchlist />} />
          <Route path="/converter"     element={<Converter />} />
          <Route path="/defi"          element={<Defi />} />
          <Route path="/intelligence"  element={<Intelligence />} />
          <Route path="/charts"        element={<Charts />} />
          <Route path="/fundamentals"  element={<Fundamentals />} />
          <Route path="/networks"      element={<Networks />} />
          <Route path="/onchain"       element={<OnChain />} />
          <Route path="/tokens"        element={<Tokens />} />
          <Route path="/bridges"       element={<PageStub title="Bridge Monitor"          description="Cross-chain bridge volume, security scores, and TVL tracking."                    icon={Landmark} />} />
          <Route path="/security"      element={<PageStub title="Security & Risk"         description="Smart contract audits, exploit history, rug pull indicators."                     icon={ShieldCheck} />} />
          <Route path="/lending"       element={<PageStub title="Lending Deep Dive"       description="Supply/borrow APY across Aave, Compound, Morpho with liquidation risk."         icon={Coins} />} />
          <Route path="/staking"       element={<PageStub title="Staking & Yield"         description="ETH staking comparison, restaking, liquid staking peg health."                   icon={Gem} />} />
          <Route path="/stablecoins"   element={<PageStub title="Stablecoin Center"       description="Supply tracking, peg health, dominance, and yield rates."                        icon={DollarSign} />} />
          <Route path="/ai-signals"    element={<PageStub title="AI Signals ULTRA"        description="15-asset technical analysis with RSI, MACD, Bollinger Bands, pattern detection." icon={Brain} />} />
          <Route path="/ai-research"   element={<PageStub title="AI Research"             description="AI-generated market reports, macro analysis, narrative tracking."                icon={Bot} />} />
          <Route path="/smart-money"   element={<PageStub title="Smart Money Tracker"     description="Wallet profiling, copy signals, on-chain PnL for tracked wallets."              icon={Target} />} />
          <Route path="/sentiment"     element={<PageStub title="Sentiment Intelligence"  description="Overall sentiment gauge, narrative trending, social velocity."                   icon={Radio} />} />
          <Route path="/ecosystem"     element={<PageStub title="Ecosystem Map"           description="Interactive force graph of protocol relationships and funding."                  icon={Map} />} />
          <Route path="/nft"           element={<PageStub title="NFT Intelligence"        description="Top collections, wash trading detection, whale tracker."                         icon={Image} />} />
          <Route path="/ordinals"      element={<PageStub title="Ordinals & BRC-20"       description="Inscription activity, BRC-20 tokens, rare sat tracking."                        icon={Bitcoin} />} />
          <Route path="/governance"    element={<PageStub title="Governance"              description="Active proposals, voting power, treasury balances."                              icon={Vote} />} />
          <Route path="/portfolio"     element={<Portfolio />} />
          <Route path="/productivity"  element={<PageStub title="Productivity Suite"      description="Tasks, notes, Pomodoro timer, trade journal, market calendar."                  icon={Timer} />} />
          <Route path="/devtools"      element={<PageStub title="Developer Tools"         description="JSON formatter, Base64, regex tester, hash generator, JWT decoder."             icon={Wrench} />} />
          <Route path="*"              element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
});
DataLoaderShell.displayName = 'DataLoaderShell';

// ─── App ──────────────────────────────────────────────────────────────────────

const App = memo(() => (
  <ThemeProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem={false}
    disableTransitionOnChange={false}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CryptoProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/"  element={<Portal />} />
                <Route path="/*" element={<DataLoaderShell />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CryptoProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
));
App.displayName = 'App';

export default App;
