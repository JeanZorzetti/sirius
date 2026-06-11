import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './setup-tests.ts',
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'setup-tests.ts',
        '**/*.config.ts',
        '**/*.config.js',
        '**/types/**',
        '**/__tests__/**',
        '**/dist/**',
        '**/.next/**',
      ],
    },
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    // Globs — uma lista simples substitui os defaults e deixaria passar
    // node_modules aninhados (ex.: mcp-server/node_modules)
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**', 'mcp-server/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // Generated WA Prisma client — vite doesn't resolve the bare
      // '.prisma/client-wa' specifier that Node/webpack handle natively
      '.prisma/client-wa': path.resolve(__dirname, 'node_modules/.prisma/client-wa'),
    },
  },
})
