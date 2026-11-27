import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths work both on GitHub Pages project URLs and root-domain hosts.
  base: './',
  plugins: [react()],
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' }
});
