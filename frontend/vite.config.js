import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@imgs': path.resolve(__dirname, 'src/assets/imgs'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@workers': path.resolve(__dirname, 'src/workers'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/relatorios': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/estacoes': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/estacoes/, '/api/ana/estacoes')
      }
    },
    allowedHosts: [
      'democrats-til-borough-xi.trycloudflare.com'
    ]
  }
})