import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-fiber': ['@react-three/fiber', '@react-three/drei'],
          'framer-motion': ['framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
