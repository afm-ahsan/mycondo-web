import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Reserved in the multi-project local port registry — see docs/local-development-ports.md.
// Override with MYCONDO_WEB_PORT if 4219 is ever needed for something else on this machine.
// strictPort makes Vite fail loudly instead of silently picking another port on conflict.
const DEV_SERVER_PORT = Number(process.env.MYCONDO_WEB_PORT) || 4219;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: DEV_SERVER_PORT,
    strictPort: true,
  },
  preview: {
    port: DEV_SERVER_PORT,
    strictPort: true,
  },
  build: {
    // UX-6: raised from Vite's 500 kB default (not left at the old 3000, which was masking the
    // pre-split single 3.48 MB bundle rather than reflecting a real ceiling). After route-level
    // code splitting, the largest legitimate chunks are the shared entry (~910 kB raw, React +
    // Redux + RTK Query + Router + Radix UI baseline) and the apexcharts vendor chunk (~580 kB,
    // isolated to report pages that actually render charts) — 1000 kB gives headroom for those
    // without hiding a regression back toward one giant bundle.
    chunkSizeWarningLimit: 1000,
  },
});
