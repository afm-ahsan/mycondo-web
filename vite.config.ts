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
    chunkSizeWarningLimit: 3000,
  },
});
