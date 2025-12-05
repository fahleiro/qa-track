import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.P_INTERFACE) || 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.P_API || 3000}`,
        changeOrigin: true
      }
    }
  }
})

