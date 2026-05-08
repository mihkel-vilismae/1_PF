/*
 * Configures the dashboard Vite dev server and production build.
 * Runtime truth persistence is mutable, so dev-server watch rules keep it
 * from forcing browser reloads during operator actions.
 */
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const appVersion = readFileSync(new URL('./VERSION', import.meta.url), 'utf8').trim();

export default defineConfig({
  root: 'dashboard',
  publicDir: false,
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    open: false,
    watch: {
      ignored: ['**/conf/runtime-truth.json'],
    },
    proxy: {
      '/api': 'http://127.0.0.1:4301',
    },
  },
});
