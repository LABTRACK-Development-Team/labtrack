import os from 'os';
import os from 'node:os';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function getLanIp() {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) return net.address;
      }
    }
  } catch (e) {}
  return 'localhost';
}

export default defineConfig({
  define: { __LAN_IP__: JSON.stringify(getLanIp()) },
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
        },
      },
    allowedHosts: ['.local', 'localhost', 'all'],
    port: 3000,
    host: '0.0.0.0',
    open: true,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            'lucide-react',
          ],
          query: ['@tanstack/react-query'],
          charts: ['recharts'],
        },
      },
    },
  },
});