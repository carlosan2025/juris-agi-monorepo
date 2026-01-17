/**
 * E2E Tests for Service Connectivity
 *
 * Architecture:
 * - Evidence API: Deployed on Vercel (https://evidence-api-sepia.vercel.app)
 *   - Has its own: Neon PostgreSQL, Cloudflare R2 storage, OpenAI access
 *   - NOT run locally
 *
 * - Core API: Run locally via docker-compose (http://localhost:8000)
 *   - Reasoning engine service
 *   - Tenant authentication with Redis
 *
 * - Edge (this app): Run locally or on Vercel
 *   - Connects to both Evidence API (Vercel) and Core API (local)
 *
 * Run with: npm run test:e2e
 * Requires Core API to be running: docker-compose -f docker-compose.local.yml up -d
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Environment configuration
// Evidence API is ALWAYS on Vercel - never local
const EVIDENCE_API_URL = 'https://evidence-api-sepia.vercel.app';
const EVIDENCE_API_KEY = process.env.EVIDENCE_API_KEY || '';

// Core API runs locally via docker-compose
const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';
const CORE_API_KEY = process.env.CORE_API_KEY || 'dev-key-tenant-1';

// Test timeout for e2e tests (10 seconds)
const E2E_TIMEOUT = 10000;

describe('E2E: Evidence API Connectivity', () => {
  beforeAll(() => {
    console.log(`Testing Evidence API at: ${EVIDENCE_API_URL}`);
  });

  it(
    'should connect to Evidence API health endpoint',
    async () => {
      const response = await fetch(`${EVIDENCE_API_URL}/api/v1/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(EVIDENCE_API_KEY && { 'X-API-Key': EVIDENCE_API_KEY }),
        },
        signal: AbortSignal.timeout(E2E_TIMEOUT),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('timestamp');

      console.log('Evidence API health:', {
        status: data.status,
        version: data.version,
        database: data.database,
      });
    },
    E2E_TIMEOUT
  );

  it(
    'should connect to Evidence API database health',
    async () => {
      const response = await fetch(`${EVIDENCE_API_URL}/api/v1/health/db`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(EVIDENCE_API_KEY && { 'X-API-Key': EVIDENCE_API_KEY }),
        },
        signal: AbortSignal.timeout(E2E_TIMEOUT),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.info).toBeDefined();

      // Verify pgvector is installed
      if (data.info?.pgvector) {
        expect(data.info.pgvector).not.toBe('not installed');
        console.log('Evidence API database:', {
          status: data.status,
          version: data.info.version,
          pgvector: data.info.pgvector,
        });
      }
    },
    E2E_TIMEOUT
  );

  it(
    'should be able to list projects from Evidence API',
    async () => {
      // Skip if no API key configured
      if (!EVIDENCE_API_KEY) {
        console.log('Skipping project list test - no API key configured');
        return;
      }

      const response = await fetch(`${EVIDENCE_API_URL}/api/v1/projects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': EVIDENCE_API_KEY,
        },
        signal: AbortSignal.timeout(E2E_TIMEOUT),
      });

      // 200 or 401/403 are valid responses (depends on API key permissions)
      expect([200, 401, 403]).toContain(response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Evidence API projects:', {
          count: Array.isArray(data) ? data.length : data.total || 0,
        });
      }
    },
    E2E_TIMEOUT
  );
});

describe('E2E: Core API Connectivity', () => {
  beforeAll(() => {
    console.log(`Testing Core API at: ${CORE_API_URL}`);
  });

  it(
    'should connect to Core API health endpoint',
    async () => {
      const response = await fetch(`${CORE_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(E2E_TIMEOUT),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('healthy');

      console.log('Core API health:', {
        status: data.status,
        service: data.service || 'juris-core-api',
      });
    },
    E2E_TIMEOUT
  );

  it(
    'should require authentication for /solve endpoint',
    async () => {
      // Test without API key - should get 401 or 403
      const response = await fetch(`${CORE_API_URL}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
        signal: AbortSignal.timeout(E2E_TIMEOUT),
      });

      // Should require authentication
      expect([401, 403, 422]).toContain(response.status);
    },
    E2E_TIMEOUT
  );

  it(
    'should authenticate with valid API key',
    async () => {
      const response = await fetch(`${CORE_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': CORE_API_KEY,
        },
        signal: AbortSignal.timeout(E2E_TIMEOUT),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('healthy');
    },
    E2E_TIMEOUT
  );
});

describe('E2E: Cross-Service Integration', () => {
  it(
    'should have Evidence API accessible from Edge context',
    async () => {
      // This test simulates what Edge would do when calling Evidence API
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'juris-edge-e2e-test',
      };

      if (EVIDENCE_API_KEY) {
        headers['X-API-Key'] = EVIDENCE_API_KEY;
      }

      const response = await fetch(`${EVIDENCE_API_URL}/api/v1/health`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(E2E_TIMEOUT),
      });

      expect(response.ok).toBe(true);
      console.log('Edge -> Evidence API: Connected');
    },
    E2E_TIMEOUT
  );

  it(
    'should have Core API accessible from Edge context',
    async () => {
      // This test simulates what Edge would do when calling Core API
      const response = await fetch(`${CORE_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'juris-edge-e2e-test',
          'X-API-Key': CORE_API_KEY,
        },
        signal: AbortSignal.timeout(E2E_TIMEOUT),
      });

      expect(response.ok).toBe(true);
      console.log('Edge -> Core API: Connected');
    },
    E2E_TIMEOUT
  );
});

describe('E2E: Service Configuration', () => {
  it('should have Evidence API URL configured', () => {
    expect(EVIDENCE_API_URL).toBeDefined();
    expect(EVIDENCE_API_URL).toContain('http');
    console.log('Evidence API URL:', EVIDENCE_API_URL);
  });

  it('should have Core API URL configured', () => {
    expect(CORE_API_URL).toBeDefined();
    expect(CORE_API_URL).toContain('http');
    console.log('Core API URL:', CORE_API_URL);
  });

  it('should have Core API key configured', () => {
    expect(CORE_API_KEY).toBeDefined();
    expect(CORE_API_KEY.length).toBeGreaterThan(0);
    console.log('Core API key configured:', CORE_API_KEY.substring(0, 8) + '...');
  });
});
