import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { sessionsApiPlugin } from './server/sessions-api'
import { insightsApiPlugin } from './server/insights-api'
import { facetsApiPlugin } from './server/facets-api'

export default defineConfig({
  plugins: [
    react(),
    sessionsApiPlugin(),
    insightsApiPlugin(),
    facetsApiPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
