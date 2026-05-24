import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'SBA MSME Portal',
        short_name: 'SBA Portal',
        description: 'SBA MSMEs Online Database and Reporting Portal — Liberia Ministry of Commerce',
        theme_color: '#1e3a5f',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/tile\.openstreetmap\.org/, handler: 'CacheFirst', options: { cacheName: 'map-tiles', expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 } } },
          { urlPattern: /\/api\/(?!auth)/, handler: 'NetworkFirst', options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 } },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'https://sba-backend-800876397176.us-central1.run.app', changeOrigin: true },
      '/uploads': { target: 'https://sba-backend-800876397176.us-central1.run.app', changeOrigin: true },
    },
  },
});
