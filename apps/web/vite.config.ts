import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const listenAll =
  process.env.VITE_DEV_HOST === '0.0.0.0' || process.env.VITE_DEV_HOST === 'true'

export default defineConfig({
  plugins: [react()],
  server: {
    host: listenAll ? '0.0.0.0' : 'localhost',
    port: 5173,
    strictPort: true,
    ...(listenAll
      ? {
          hmr: {
            protocol: 'ws',
            host: 'localhost',
            clientPort: 5173,
          },
        }
      : {}),
  },
})
