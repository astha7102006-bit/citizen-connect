import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // AI extraction server (port 5050)
      '/api/ai': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
      // Backend Express server (port 4000) for all /api endpoints
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        // Forward cookies and set origin header for session-based auth
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', 'http://127.0.0.1:5173');
          });
          // Graceful handling when backend is down/restarting: return JSON instead of empty response
          proxy.on('error', (_err, _req, res) => {
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  error: {
                    code: 'BACKEND_OFFLINE',
                    message:
                      'The CitizenConnect backend API is offline or starting up on port 4000. Please ensure "npm run server" is running.',
                  },
                })
              );
            }
          });
        },
      },
    },
  },
})
