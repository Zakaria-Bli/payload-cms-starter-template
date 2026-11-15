import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Mirrors the `paths` in tsconfig.json. Inline projects inherit the root config.
  resolve: {
    alias: {
      '@payload-config': path.resolve(import.meta.dirname, 'src/payload.config.ts'),
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    reporters: process.env.CI ? ['default', 'github-actions'] : ['default'],
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          // Unit tests never touch the database; these values only satisfy env validation.
          env: {
            NODE_ENV: 'test',
            DATABASE_URL: 'postgresql://unit:unit@127.0.0.1:1/unit_test',
            PAYLOAD_SECRET: 'unit-test-secret-unit-test-secret-1234',
          },
        },
      },
      {
        test: {
          name: 'int',
          environment: 'node',
          include: ['src/tests/int/**/*.int.spec.ts'],
          setupFiles: ['./src/tests/loadTestEnv.ts'],
          // One shared database: run integration files one at a time.
          fileParallelism: false,
          hookTimeout: 60_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: process.env.CI
        ? ['text', 'text-summary', 'json-summary']
        : ['text', 'text-summary'],
      reportOnFailure: true,
      reportsDirectory: './coverage',
      include: ['src/lib/**/*.{ts,tsx}', 'src/payload/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/payload-types.ts'],
    },
  },
})
