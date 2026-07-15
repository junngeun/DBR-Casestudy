import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 터널 배포용: 같은 출처로 묶어 CORS 없이 백엔드/AI서버로 전달
const proxy = {
  "/api": {
    target: "http://localhost:3000",
    changeOrigin: true,
  },
  "/ai": {
    target: "http://localhost:8000",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/ai/, ""),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 개발 서버 (npm run dev) — 수정하면 즉시 반영됨
  server: {
    allowedHosts: true,
    proxy,
  },

  // 빌드 결과 서빙 (npm run preview) — 소스를 고쳐도 반영되지 않음(빌드해야 반영)
  preview: {
    allowedHosts: true,
    proxy,
  },
})
