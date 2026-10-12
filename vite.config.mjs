import { defineConfig, loadEnv } from 'vite';
import { validateFrontendBuild } from './scripts/check-frontend-build.cjs';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command, mode }) => {
  // Validate the same merged public variables Vite will embed, including shell overrides.
  if (command === 'build') validateFrontendBuild(loadEnv(mode, process.cwd(), 'VITE_'));
  return {
    base: '/',
    plugins: [react(), VitePWA({
      manifest: false,
      injectRegister: false,
      filename: 'service-worker.js',
      devOptions: { enabled: false },
      // Precache static assets, including lazy charts; keep OAuth/API responses out.
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,json,ttf}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/\?(?:.*&)?(?:code|state|error)=/, /^\/_/],
        skipWaiting: true,
        clientsClaim: false,
        cleanupOutdatedCaches: true,
      },
    })],
    server: { host: 'localhost', port: 3000, strictPort: true },
    preview: { host: 'localhost', port: 4173, strictPort: true },
  };
});
