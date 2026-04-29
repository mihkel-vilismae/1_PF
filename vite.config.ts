import { defineConfig } from 'vite';

export default defineConfig({
  root: 'dashboard',
  publicDir: false,
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
