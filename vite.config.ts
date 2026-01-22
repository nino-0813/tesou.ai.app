import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: env.API_BASE_URL || 'http://localhost:8787',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      // NOTE: Do not expose secret keys to the browser. The API key must live on the server.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
