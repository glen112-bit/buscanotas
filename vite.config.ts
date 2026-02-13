import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  define: {
    global: 'window',
  },
  server: {
    proxy: {
      '/api_mvsep': {
        target: 'https://mvsep.com',
        changeOrigin: true,
        secure: false, // Permite certificados auto-firmados si los hay
        rewrite: (path) => path.replace(/^\/api_mvsep/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Cache-Control', 'no-cache'); // <--- AÑADE ESTO
            proxyReq.setHeader('Accept', 'application/json');
          });
          proxy.on('error', (err, _req, _res) => {
            console.log('Error en el Proxy:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forzar headers para que MVSep sepa que esperamos JSON
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setTimeout(600000); // 10 minutos
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Respuesta recibida del Servidor:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  plugins: [
    tailwindcss(),
    react(),
    nodePolyfills(),
  ],
})
