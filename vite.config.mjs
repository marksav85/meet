import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [react(), VitePWA({
    manifest: false,
    injectRegister: false,
    filename: 'service-worker.js',
    devOptions: { enabled: false },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,json,ttf}'],
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/\?(?:.*&)?(?:code|state|error)=/, /^\/_/],
      skipWaiting: true,
      clientsClaim: false,
      cleanupOutdatedCaches: true,
    },
  })],
  server: { host: 'localhost', port: 3000, strictPort: true, watch: { ignored: ['**/playbook/**'] } },
  preview: { host: 'localhost', port: 4173, strictPort: true },
});
