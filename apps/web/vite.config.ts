import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy all API traffic to the daloy backend on :3000. The browser then sees a
// single origin (5173), so the better-auth cookie flows without CORS config.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',     // better-auth: /api/auth/*
      '/weather': 'http://localhost:3000', // daloy public endpoint
      '/stock': 'http://localhost:3000',   // daloy private endpoint
    },
  },
})
