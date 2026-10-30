import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_PORT = Number(process.env.STUDY_APP_PORT ?? 4611);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: { '/api': `http://127.0.0.1:${API_PORT}` },
  },
  build: { outDir: 'dist', chunkSizeWarningLimit: 2500 },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
} as any);
