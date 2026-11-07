import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backend = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: backend, changeOrigin: true },
      '/sanctum': { target: backend, changeOrigin: true },
      '/storage': { target: backend, changeOrigin: true },
      '/build': { target: backend, changeOrigin: true },
    },
  },
})
