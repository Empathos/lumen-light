import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { lumenRealtimePlugin } from './server/realtimePlugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      lumenRealtimePlugin({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_REALTIME_MODEL,
        voice: env.OPENAI_REALTIME_VOICE,
      }),
    ],
    server: {
      port: 5180,
      host: true,
    },
  }
})
