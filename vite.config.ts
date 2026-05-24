import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

/** Локальный HTTPS: `npm run dev:https` или `npm run dev:https:host` (телефон в Wi‑Fi). */
export default defineConfig(({ mode }) => {
  const devHttps = mode === 'https';

  return {
  plugins: [react(), ...(devHttps ? [basicSsl()] : [])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    https: devHttps,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
};
});
