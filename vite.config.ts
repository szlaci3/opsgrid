import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.ts',
    css: false,
    tags: [
      { name: 'tier-1', description: 'Fast high-risk checks run on every commit and pull request.' },
      { name: 'tier-2', description: 'Broader integration checks run for CI builds and main merges.' },
      { name: 'tier-3', description: 'Extended regression checks run weekly or on demand.' },
    ],
    strictTags: true,
  },
})
