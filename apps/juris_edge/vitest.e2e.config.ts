/**
 * Vitest E2E Test Configuration
 *
 * Separate config for e2e tests that connect to real services:
 * - Evidence API on Vercel
 * - Core API locally (docker-compose)
 *
 * Run with: npm run test:e2e
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Only run e2e tests
    include: ['__tests__/e2e/**/*.e2e.test.ts'],
    exclude: ['node_modules', 'dist'],
    // Longer timeouts for network requests
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run tests sequentially to avoid rate limiting
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Don't use the mock setup
    setupFiles: [],
    // Report more details
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
