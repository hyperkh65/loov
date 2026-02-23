import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/danawa': {
        target: 'https://search.danawa.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/danawa/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.danawa.com/',
        }
      }
    }
  },
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
