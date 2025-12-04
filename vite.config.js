import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import { resolve } from "path"
import { VitePWA } from 'vite-plugin-pwa' // Optional but recommended

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Optional: PWA plugin for better user experience
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Swift Lore - Taylor Swift Timeline',
        short_name: 'Swift Lore',
        description: 'Interactive timeline of Taylor Swift\'s career',
        theme_color: '#8e3e3e',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ["@babel/runtime"],
    },
    // Generate sourcemaps for debugging
    sourcemap: true,
  },
  // Add this to help with routing
  server: {
    historyApiFallback: true,
  },
})