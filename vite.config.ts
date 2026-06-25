import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { lumenRealtimePlugin } from './server/realtimePlugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      lumenRealtimePlugin({
        apiKey: env.INWORLD_API_KEY,
        model: env.INWORLD_REALTIME_MODEL,
        voice: env.INWORLD_REALTIME_VOICE,
        sttModel: env.INWORLD_STT_MODEL,
        ttsModel: env.INWORLD_TTS_MODEL,
      }),
    ],
    // Excalidraw reads process.env.IS_PREACT at runtime; in a browser/Vite build
    // `process` is undefined, so we statically replace it to avoid a crash.
    define: {
      'process.env.IS_PREACT': JSON.stringify('false'),
    },
    server: {
      port: 5180,
      host: true,
    },
  }
})
