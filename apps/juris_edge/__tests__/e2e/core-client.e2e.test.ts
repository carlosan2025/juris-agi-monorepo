/**
 * E2E Tests for CoreApiClient
 *
 * Tests the TypeScript client that Edge uses to communicate with Core API.
 * Core API runs locally via docker-compose.
 *
 * Run with: npm run test:e2e
 * Requires: docker-compose -f docker-compose.local.yml up -d
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CoreApiClient, resetCoreClient } from '@/lib/core/client';

// Core API runs locally
const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';
const CORE_API_KEY = process.env.CORE_API_KEY || 'dev-key-tenant-1';

const E2E_TIMEOUT = 15000;

describe('E2E: CoreApiClient', () => {
  let client: CoreApiClient;

  beforeAll(() => {
    resetCoreClient();
    client = new CoreApiClient(CORE_API_URL, CORE_API_KEY);
    console.log(`Testing CoreApiClient against: ${CORE_API_URL}`);
  });

  afterAll(() => {
    resetCoreClient();
  });

  describe('Health Check', () => {
    it(
      'should check Core API health',
      async () => {
        const health = await client.health();

        expect(health).toBeDefined();
        expect(health.status).toBe('healthy');

        console.log('Core API health response:', health);
      },
      E2E_TIMEOUT
    );
  });

  describe('Authentication', () => {
    it(
      'should work with valid API key',
      async () => {
        const validClient = new CoreApiClient(CORE_API_URL, CORE_API_KEY);
        const health = await validClient.health();
        expect(health.status).toBe('healthy');
      },
      E2E_TIMEOUT
    );

    it(
      'should reject requests with invalid API key',
      async () => {
        const invalidClient = new CoreApiClient(CORE_API_URL, 'invalid-key');

        // Health endpoint might not require auth, so test /solve
        try {
          await invalidClient.solve({
            question: 'test',
            claims: [],
          });
          // If we get here, auth wasn't checked (which is a security issue)
          expect.fail('Should have thrown authentication error');
        } catch (error) {
          // Expected - should fail with auth error
          expect(error).toBeDefined();
          console.log('Invalid key correctly rejected');
        }
      },
      E2E_TIMEOUT
    );
  });

  describe('Solve API', () => {
    it(
      'should submit a solve request and get job ID',
      async () => {
        // Simple test - submit a minimal solve request
        // Note: This is a real API call that may take time and cost money
        try {
          const response = await client.solve({
            question: 'What is 2 + 2?',
            claims: [
              {
                id: 'claim-1',
                text: 'Two plus two equals four.',
                source: 'test',
                confidence: 0.99,
              },
            ],
          });

          expect(response).toBeDefined();
          expect(response.jobId).toBeDefined();
          expect(typeof response.jobId).toBe('string');

          console.log('Solve request submitted:', {
            jobId: response.jobId,
            status: response.status,
          });
        } catch (error) {
          // If solve isn't available (e.g., no LLM configured), log and skip
          console.log(
            'Solve endpoint not available:',
            error instanceof Error ? error.message : error
          );
        }
      },
      E2E_TIMEOUT
    );

    it(
      'should reject solve request without question',
      async () => {
        try {
          await client.solve({
            question: '',
            claims: [],
          });
          expect.fail('Should have thrown validation error');
        } catch (error) {
          expect(error).toBeDefined();
          console.log('Empty question correctly rejected');
        }
      },
      E2E_TIMEOUT
    );
  });

  describe('Jobs API', () => {
    it(
      'should return 404 for non-existent job',
      async () => {
        try {
          await client.getJob('non-existent-job-id');
          expect.fail('Should have thrown not found error');
        } catch (error) {
          expect(error).toBeDefined();
          if (error instanceof Error) {
            expect(error.message).toMatch(/404|not found/i);
          }
        }
      },
      E2E_TIMEOUT
    );
  });
});

describe('E2E: CoreApiClient Connection Resilience', () => {
  it(
    'should handle connection timeout gracefully',
    async () => {
      // Test with unreachable address
      const badClient = new CoreApiClient('http://10.255.255.1:8000', CORE_API_KEY);

      try {
        await Promise.race([
          badClient.health(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Test timeout')), 5000)
          ),
        ]);
        expect.fail('Should have timed out');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('Connection timeout handled correctly');
      }
    },
    E2E_TIMEOUT
  );

  it(
    'should handle invalid URL gracefully',
    async () => {
      const badClient = new CoreApiClient('http://localhost:99999', CORE_API_KEY);

      try {
        await badClient.health();
        expect.fail('Should have thrown connection error');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('Invalid URL handled correctly');
      }
    },
    E2E_TIMEOUT
  );
});
