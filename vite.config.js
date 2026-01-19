import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": {
        target: "http://15.164.74.228",
        changeOrigin: true,
      },
      "/v1": {
        target: "http://15.164.74.228",
        changeOrigin: true,
      },
    },
  },
})

