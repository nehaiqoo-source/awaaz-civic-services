import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/awaaz-overlay.js', 'extension/dist/**', 'mobile/App.tsx', 'mobile/index.ts', 'mobile/src/generated/**']),
])
