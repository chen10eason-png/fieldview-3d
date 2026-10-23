import { defineConfig } from 'vite';

// Relative URLs work on any GitHub Pages repository URL, regardless of repo name.
// The old hard-coded /fieldview-3d/ prefix is deliberately not used.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
