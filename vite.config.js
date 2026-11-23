import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import { resolve } from "path"
import airtableDev from "./server/airtable-dev.js"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    airtableDev(),
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
    sourcemap: true,
  },
  server: {
    historyApiFallback: true,
  },
})
