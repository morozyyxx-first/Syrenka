import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/events': {
          target: 'https://dane.um.warszawa.pl',
          changeOrigin: true,
          rewrite: () => '/api/action/get_bmm_kalendarz_wydarzen',
          headers: {
            Authorization: env.VITE_API_KEY,
          },
        },
      },
    },
  }
})
