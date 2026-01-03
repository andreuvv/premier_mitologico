import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/premier_mitologico/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'recharts': ['recharts'],
          'react-icons': ['react-icons'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
