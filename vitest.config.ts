import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    testTimeout: 10000,
    // Running every jsdom environment at full CPU-core concurrency causes sporadic
    // 5s-timeout failures under load (Template 6 test-infrastructure investigation) —
    // capping the worker pool trades a little wall-clock time for a deterministic run.
    // Vitest 4 moved these to top-level options (poolOptions.threads.* is deprecated).
    maxWorkers: 4,
    minWorkers: 1,
  },
});
