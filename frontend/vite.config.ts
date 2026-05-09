import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/static/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8300',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8300',
        ws: true,
      },
      '/static': {
        target: 'http://127.0.0.1:8300',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8300',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../static',
    emptyOutDir: true,
  },
})
