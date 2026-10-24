import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Auth endpoints (Phase 3)
      '/api/auth': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        // Forward cookies for session-based auth
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', 'http://127.0.0.1:5173');
          });
        },
      },
      // Complaints endpoints (Phase 4)
      '/api/complaints': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', 'http://127.0.0.1:5173');
          });
        },
      },
      // Health endpoints (Phase 1)
      '/api/health': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
      // Future API v1 routes (Phase 4+)
      '/api/v1': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
      // AI extraction server (existing aiServer.mjs — port 5050)
      '/api/ai': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
    },
  },
})
