
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    allowedHosts: [
      'vediocall-site-node-js.onrender.com',
      '.onrender.com',
      'localhost'
    ],
    port: 10000,
    host: '0.0.0.0'
  }
});
