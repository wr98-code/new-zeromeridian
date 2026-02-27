/**
 * vite.config.ts — ZERØ MERIDIAN push75
 *
 * push75 changes:
 * - Proxy /api/heatmap dan /api/klines DIHAPUS — tidak dibutuhkan lagi.
 *   TradingViewChart dan HeatmapTile sekarang hit Binance/CoinGecko langsung dari browser.
 * - lovable-tagger: hanya development mode (tidak berubah, tapi diperjelas).
 * - vite-plugin-compression: tetap Brotli + Gzip.
 * - COEP headers DIHAPUS dari dev server — tidak dibutuhkan karena tidak ada SharedArrayBuffer.
 *   (COEP hanya dibutuhkan jika pakai SharedArrayBuffer/Atomics — push74 sudah tidak pakai.)
 * - manualChunks: lightweight-charts ditambahkan sebagai chunk terpisah.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    hmr: { overlay: false },
    // COEP dihapus — tidak dibutuhkan, malah menyebabkan masalah CORS
    // dengan CoinGecko dan Binance yang tidak serve CORP header
  },

  plugins: [
    react(),
    // lovable-tagger: development only
    mode === 'development' && componentTagger(),

    // Brotli compression — primary
    compression({
      algorithm:  'brotliCompress',
      ext:        '.br',
      threshold:  1024,
    }),

    // Gzip fallback — untuk browser/CDN yang tidak support Brotli
    compression({
      algorithm:  'gzip',
      ext:        '.gz',
      threshold:  1024,
    }),
  ].filter(Boolean),

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  // WASM support
  assetsInclude: ['**/*.wasm'],

  worker: {
    format: 'es',
  },

  build: {
    target:                 'esnext',
    minify:                 'esbuild',
    sourcemap:              false,
    chunkSizeWarningLimit:  600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':   ['@tanstack/react-query'],
          'vendor-motion':  ['framer-motion'],
          'vendor-three':   ['three'],
          // push75: lightweight-charts masuk npm bundle (bukan CDN lagi)
          'vendor-charts':  ['lightweight-charts'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
          ],
          'vendor-icons':   ['lucide-react'],
          'vendor-utils':   ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
  },

  optimizeDeps: {
    exclude: ['@/workers/marketWorker'],
  },
}));
