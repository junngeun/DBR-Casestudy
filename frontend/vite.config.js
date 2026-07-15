import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

server: {
    allowedHosts: true,
    proxy: {
      // 터널 배포용: 같은 출처로 묶어 CORS 없이 백엔드/AI서버로 전달
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/ai": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai/, ""),
      },
    },
  }
  })