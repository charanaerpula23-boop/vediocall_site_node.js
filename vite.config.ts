
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Stringify the API key from the environment
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  },
  preview: {
    // Allows the Render host to access the preview server
    allowedHosts: [
      'vediocall-site-node-js.onrender.com',
      '.onrender.com'
    ],
    port: 10000,
    host: '0.0.0.0'
  }
});
