import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy alt API-trafikk til daloy-backend på :3000. Da ser browseren én origin
// (5173), så better-auth-cookien flyter uten CORS-konfig.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',     // better-auth: /api/auth/*
      '/weather': 'http://localhost:3000', // daloy public
      '/stock': 'http://localhost:3000',   // daloy private
    },
  },
})
