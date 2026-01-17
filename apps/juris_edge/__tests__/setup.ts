/**
 * Vitest Test Setup
 * Global setup file for all unit tests
 */

import { afterEach, afterAll, vi } from 'vitest';

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing';
process.env.RESEND_API_KEY = 'test-resend-api-key';

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  vi.resetAllMocks();
});
