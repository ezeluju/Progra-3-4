import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4321', // ← debe coincidir con el puerto donde corre Astro
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
