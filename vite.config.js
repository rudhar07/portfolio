import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
  },
  build: {
    // the repo is public anyway; maps make production errors readable
    sourcemap: true,
    // three.js is the one big chunk, and it is lazy-loaded after first paint on purpose
    chunkSizeWarningLimit: 600,
  },
})
