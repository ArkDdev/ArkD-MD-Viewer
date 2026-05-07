import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/*
 * Tauri expects a fixed port; the dev server fails if that port is taken.
 *
 * The previous version wrapped this config in `async () => (...)`, which
 * was historically necessary in Vite 4 for some plugin scenarios. In Vite 5
 * with our setup it's not needed and the async wrapper confuses strict
 * TypeScript builds (the `Plugin[][]` type bubbles up). Plain object form
 * is fine.
 */
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // Don't watch the Rust workspace — Tauri's dev server handles those
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    target: ['es2022', 'chrome120', 'safari16'],
    minify: 'esbuild',
    sourcemap: false,
  },
});
