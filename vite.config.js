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
  },
});
