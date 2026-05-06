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
    proxy: {
      '/api': 'http://127.0.0.1:4301',
    },
  },
});
