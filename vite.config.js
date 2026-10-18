import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyHeaders = env.API_KEY ? { Authorization: env.API_KEY } : {}

  if (mode === 'development' && !env.API_KEY) {
    console.warn('API_KEY is not configured. Add it to .env.local to load events locally.')
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/events': {
          target: 'https://dane.um.warszawa.pl',
          changeOrigin: true,
          rewrite: () => '/api/action/get_bmm_kalendarz_wydarzen',
          headers: proxyHeaders,
        },
      },
    },
  }
})
