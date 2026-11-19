import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  oxc: { tsconfig: false },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
