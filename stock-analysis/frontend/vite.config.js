import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Inject API URL as a global so fetch calls can use it
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || ''),
  },
  server: {
    port: 5173,
    proxy: mode === 'development' ? {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    } : {},
  },
}));
