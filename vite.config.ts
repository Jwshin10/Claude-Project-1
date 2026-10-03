/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// `npm run build:artifact` makes a copy that can be hosted as a claude.ai
// artifact: relative asset paths and no service worker (artifacts can't run one).
const artifact = process.env.BUILD_TARGET === 'artifact'

// https://vite.dev/config/
export default defineConfig({
  base: artifact ? './' : '/',
  // Fonts are inlined too: the artifact viewer only allows font files from Google Fonts.
  build: artifact ? { outDir: 'dist-artifact', assetsInlineLimit: 200_000 } : {},
  plugins: [
    react(),
    tailwindcss(),
    !artifact &&
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Planvoice',
          short_name: 'Planvoice',
          description: 'Plans, groups and to-dos — with voice input.',
          theme_color: '#1c2541',
          background_color: '#fbfcfd',
          display: 'standalone',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
  ],
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
  },
})
