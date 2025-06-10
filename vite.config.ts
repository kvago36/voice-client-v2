import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
  },
    // Или динамически из переменной окружения
  base: process.env.NODE_ENV === 'production' ? 'voice-client-v2/' : '/',
  
  plugins: [react(), tailwindcss()],
})
