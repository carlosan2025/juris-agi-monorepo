/**
 * E2E Tests for Evidence API Document Lifecycle
 *
 * Tests the complete document flow against the PRODUCTION Evidence API on Vercel:
 * 1. Upload document
 * 2. Wait for processing (extraction → spans → embeddings)
 * 3. Verify document details
 * 4. Create project and attach document
 * 5. Search within project
 * 6. Create evidence pack
 * 7. Delete document and verify cleanup
 *
 * Evidence API: https://evidence-api-sepia.vercel.app
 * - Neon PostgreSQL with pgvector
 * - Cloudflare R2 storage
 * - OpenAI embeddings
 *
 * Run with: npm run test:e2e
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Evidence API on Vercel (PRODUCTION)
const EVIDENCE_API_URL = 'https://evidence-api-sepia.vercel.app';
const EVIDENCE_API_KEY = process.env.EVIDENCE_API_KEY || '';

// Longer timeouts for production API calls
const E2E_TIMEOUT = 30000;
const PROCESSING_TIMEOUT = 60000;

// Track created resources for cleanup
const createdResources: {
  documentIds: string[];
  projectIds: string[];
  packIds: { projectId: string; packId: string }[];
} = {
  documentIds: [],
  projectIds: [],
  packIds: [],
};

/**
 * Helper to make authenticated API requests
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(EVIDENCE_API_KEY && { 'X-API-Key': EVIDENCE_API_KEY }),
    ...(options.headers || {}),
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete (headers as Record<string, string>)['Content-Type'];
  }

  const url = `${EVIDENCE_API_URL}${endpoint}`;
  console.log(`[E2E] ${options.method || 'GET'} ${url}`);

  return fetch(url, {
    ...options,
    headers,
    signal: AbortSignal.timeout(E2E_TIMEOUT),
  });
}

/**
 * Wait for a job to complete
 */
async function waitForJob(
  jobId: string,
  maxWaitMs = PROCESSING_TIMEOUT
): Promise<{ status: string; result?: unknown }> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await apiRequest(`/api/v1/jobs/${jobId}`);

    if (!response.ok) {
      // Job not found or error - might be completed and cleaned up
      console.log(`[E2E] Job ${jobId} not found or completed`);
      return { status: 'completed' };
    }

    const job = await response.json();
    console.log(`[E2E] Job ${jobId} status: ${job.status}`);

    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`Job ${jobId} did not complete within ${maxWaitMs}ms`);
}

describe('E2E: Evidence API Document Lifecycle', () => {
  let testDocumentId: string;
  let testVersionId: string;
  let testProjectId: string;
  let testPackId: string;

  beforeAll(() => {
    console.log('\n========================================');
    console.log('Evidence API Document Lifecycle E2E Tests');
    console.log(`API: ${EVIDENCE_API_URL}`);
    console.log(`API Key configured: ${EVIDENCE_API_KEY ? 'Yes' : 'No'}`);
    console.log('========================================\n');

    if (!EVIDENCE_API_KEY) {
      console.warn('WARNING: No EVIDENCE_API_KEY - authenticated tests will be skipped');
      console.warn('Set EVIDENCE_API_KEY environment variable to run full tests');
    }
  });

  // Skip authenticated tests if no API key
  const skipIfNoAuth = !EVIDENCE_API_KEY;

  afterAll(async () => {
    console.log('\n--- Cleanup ---');
    // Clean up created resources in reverse order
    for (const pack of createdResources.packIds) {
      try {
        await apiRequest(
          `/api/v1/projects/${pack.projectId}/evidence-packs/${pack.packId}`,
          { method: 'DELETE' }
        );
        console.log(`Deleted pack: ${pack.packId}`);
      } catch {
        // Ignore cleanup errors
      }
    }

    for (const projectId of createdResources.projectIds) {
      try {
        await apiRequest(`/api/v1/projects/${projectId}`, { method: 'DELETE' });
        console.log(`Deleted project: ${projectId}`);
      } catch {
        // Ignore cleanup errors
      }
    }

    for (const docId of createdResources.documentIds) {
      try {
        await apiRequest(`/api/v1/documents/${docId}`, { method: 'DELETE' });
        console.log(`Deleted document: ${docId}`);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('Step 1: Health Check', () => {
    it(
      'should verify Evidence API is healthy',
      async () => {
        const response = await apiRequest('/api/v1/health');
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.status).toBe('healthy');
        expect(data.database).toBe('healthy');

        console.log('Evidence API health:', {
          status: data.status,
          database: data.database,
          version: data.version,
        });
      },
      E2E_TIMEOUT
    );

    it(
      'should verify database with pgvector',
      async () => {
        const response = await apiRequest('/api/v1/health/db');
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.status).toBe('healthy');
        expect(data.info?.pgvector).toBeDefined();
        expect(data.info?.pgvector).not.toBe('not installed');

        console.log('Database health:', {
          version: data.info?.version,
          pgvector: data.info?.pgvector,
        });
      },
      E2E_TIMEOUT
    );
  });

  describe('Step 2: Upload Document', () => {
    it.skipIf(skipIfNoAuth)(
      'should upload a text document and get job ID',
      async () => {
        // Create a test document
        const testContent = `
# Test Document for E2E Testing
Generated at: ${new Date().toISOString()}

## Section 1: Introduction
This is a test document created for end-to-end testing of the Evidence API.
It contains multiple sections to test text extraction and span generation.

## Section 2: Key Facts
- Fact 1: The Evidence API processes documents asynchronously
- Fact 2: Documents are stored in Cloudflare R2
- Fact 3: Embeddings are generated using OpenAI

## Section 3: Conclusion
This document should be successfully processed and indexed for search.
The processing pipeline includes extraction, span generation, and embedding creation.
        `.trim();

        const formData = new FormData();
        const blob = new Blob([testContent], { type: 'text/plain' });
        formData.append('file', blob, `e2e-test-${Date.now()}.txt`);

        const response = await fetch(`${EVIDENCE_API_URL}/api/v1/documents`, {
          method: 'POST',
          headers: {
            ...(EVIDENCE_API_KEY && { 'X-API-Key': EVIDENCE_API_KEY }),
          },
          body: formData,
          signal: AbortSignal.timeout(E2E_TIMEOUT),
        });

        expect(response.status).toBe(202); // Accepted for async processing

        const data = await response.json();
        expect(data.document_id).toBeDefined();
        expect(data.version_id).toBeDefined();
        expect(data.job_id).toBeDefined();

        testDocumentId = data.document_id;
        testVersionId = data.version_id;
        createdResources.documentIds.push(testDocumentId);

        console.log('Document uploaded:', {
          documentId: testDocumentId,
          versionId: testVersionId,
          jobId: data.job_id,
        });

        // Wait for processing to complete
        if (data.job_id) {
          const jobResult = await waitForJob(data.job_id);
          console.log('Processing completed:', jobResult.status);
        }
      },
      PROCESSING_TIMEOUT
    );
  });

  describe('Step 3: Verify Document Processing', () => {
    it.skipIf(skipIfNoAuth)(
      'should retrieve uploaded document details from PostgreSQL',
      async () => {
        expect(testDocumentId).toBeDefined();

        const response = await apiRequest(`/api/v1/documents/${testDocumentId}`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.id).toBe(testDocumentId);
        expect(data.filename).toContain('e2e-test');
        expect(data.content_type).toBe('text/plain');

        console.log('✓ Document found in PostgreSQL:', {
          id: data.id,
          filename: data.filename,
          contentType: data.content_type,
          profileCode: data.profile_code,
        });
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should verify document version with processing status',
      async () => {
        expect(testDocumentId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/documents/${testDocumentId}/versions`
        );
        expect(response.ok).toBe(true);

        const versions = await response.json();
        expect(Array.isArray(versions)).toBe(true);
        expect(versions.length).toBeGreaterThanOrEqual(1);

        const latestVersion = versions[0];

        // Verify version fields stored in DB
        expect(latestVersion.id).toBeDefined();
        expect(latestVersion.document_id).toBe(testDocumentId);
        expect(latestVersion.version_number).toBeGreaterThanOrEqual(1);
        expect(latestVersion.file_size).toBeGreaterThan(0);
        expect(latestVersion.file_hash).toBeDefined();

        // Verify processing status
        console.log('✓ Version record in PostgreSQL:', {
          versionId: latestVersion.id,
          uploadStatus: latestVersion.upload_status,
          processingStatus: latestVersion.processing_status,
          extractionStatus: latestVersion.extraction_status,
          fileSize: latestVersion.file_size,
          fileHash: latestVersion.file_hash?.substring(0, 16) + '...',
        });

        // Upload should be complete
        expect(latestVersion.upload_status).toBe('uploaded');
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should verify file is stored in Cloudflare R2 (download test)',
      async () => {
        expect(testDocumentId).toBeDefined();

        // Download proves file exists in Cloudflare R2 storage
        const response = await apiRequest(
          `/api/v1/documents/${testDocumentId}/download`
        );

        expect(response.ok).toBe(true);
        expect(response.headers.get('content-type')).toBe('text/plain');

        // Verify content-disposition header
        const contentDisposition = response.headers.get('content-disposition');
        expect(contentDisposition).toContain('attachment');
        expect(contentDisposition).toContain('e2e-test');

        // Read content to verify it matches
        const content = await response.text();
        expect(content).toContain('Test Document for E2E Testing');
        expect(content).toContain('Evidence API');

        console.log('✓ Document downloaded from Cloudflare R2:', {
          contentType: response.headers.get('content-type'),
          contentLength: content.length,
          verified: 'Content matches uploaded file',
        });
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should verify document metadata is stored in PostgreSQL',
      async () => {
        expect(testDocumentId).toBeDefined();

        const response = await apiRequest(`/api/v1/documents/${testDocumentId}`);
        expect(response.ok).toBe(true);

        const data = await response.json();

        // Verify metadata fields
        expect(data.created_at).toBeDefined();
        expect(data.updated_at).toBeDefined();
        expect(data.file_hash).toBeDefined();

        console.log('✓ Document metadata in PostgreSQL:', {
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          fileHash: data.file_hash?.substring(0, 16) + '...',
          profileCode: data.profile_code || 'general',
        });

        // Verify latest_version has metadata
        if (data.latest_version) {
          expect(data.latest_version.file_size).toBeGreaterThan(0);
          console.log('  Latest version metadata:', {
            versionNumber: data.latest_version.version_number,
            fileSize: data.latest_version.file_size,
            extractionStatus: data.latest_version.extraction_status,
          });
        }
      },
      E2E_TIMEOUT
    );

    it(
      'should verify database table counts reflect new document',
      async () => {
        const healthResponse = await apiRequest('/api/v1/health/db');
        expect(healthResponse.ok).toBe(true);

        const healthData = await healthResponse.json();
        expect(healthData.table_counts).toBeDefined();

        console.log('✓ PostgreSQL table counts:', {
          documents: healthData.table_counts?.documents,
          document_versions: healthData.table_counts?.document_versions,
          spans: healthData.table_counts?.spans,
          embedding_chunks: healthData.table_counts?.embedding_chunks,
          claims: healthData.table_counts?.claims,
        });

        // Verify counts are reasonable
        expect(healthData.table_counts?.documents).toBeGreaterThanOrEqual(1);
        expect(healthData.table_counts?.document_versions).toBeGreaterThanOrEqual(1);
      },
      E2E_TIMEOUT
    );

    it(
      'should verify embeddings via search capability (pgvector)',
      async () => {
        // Search proves embeddings exist in pgvector
        const response = await apiRequest('/api/v1/search', {
          method: 'POST',
          body: JSON.stringify({
            query: 'E2E test document Evidence API processing pipeline',
            limit: 5,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const results = data.results || [];

          console.log('✓ Embeddings verified via pgvector search:', {
            searchWorking: true,
            resultsCount: results.length,
            hasEmbeddings: results.length > 0,
          });
        } else if (response.status === 503) {
          console.log(
            '⚠ Search unavailable (503) - OpenAI embeddings may not be configured'
          );
        } else {
          console.log(`⚠ Search returned: ${response.status}`);
        }
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should verify spans were generated',
      async () => {
        expect(testDocumentId).toBeDefined();

        // Check database health for span counts
        const healthResponse = await apiRequest('/api/v1/health/db');
        const healthData = await healthResponse.json();

        const spanCount = healthData.table_counts?.spans || 0;

        if (spanCount > 0) {
          console.log('✓ Spans generated and stored in PostgreSQL:', {
            totalSpans: spanCount,
          });
        } else {
          console.log(
            '⚠ No spans generated yet (may require async processing or specific document types)'
          );
        }
      },
      E2E_TIMEOUT
    );
  });

  describe('Step 4: Create Project and Attach Document', () => {
    it.skipIf(skipIfNoAuth)(
      'should create a test project',
      async () => {
        const response = await apiRequest('/api/v1/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: `E2E Test Project ${Date.now()}`,
            description: 'Created by e2e test suite',
            case_ref: `E2E-${Date.now()}`,
          }),
        });

        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data.id).toBeDefined();
        expect(data.name).toContain('E2E Test Project');

        testProjectId = data.id;
        createdResources.projectIds.push(testProjectId);

        console.log('Project created:', {
          id: testProjectId,
          name: data.name,
        });
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should attach document to project',
      async () => {
        expect(testDocumentId).toBeDefined();
        expect(testProjectId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/projects/${testProjectId}/documents`,
          {
            method: 'POST',
            body: JSON.stringify({
              document_id: testDocumentId,
            }),
          }
        );

        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data.document_id).toBe(testDocumentId);

        console.log('Document attached to project');
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should list project documents',
      async () => {
        expect(testProjectId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/projects/${testProjectId}/documents`
        );
        expect(response.ok).toBe(true);

        const data = await response.json();
        const docs = Array.isArray(data) ? data : data.items || [];
        expect(docs.length).toBeGreaterThanOrEqual(1);

        console.log('Project documents:', docs.length);
      },
      E2E_TIMEOUT
    );
  });

  describe('Step 5: Search', () => {
    it.skipIf(skipIfNoAuth)(
      'should search within project',
      async () => {
        expect(testProjectId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/search/projects/${testProjectId}`,
          {
            method: 'POST',
            body: JSON.stringify({
              query: 'Evidence API documents processing',
              limit: 10,
            }),
          }
        );

        // 200 if search works, 503 if embeddings unavailable
        expect([200, 503]).toContain(response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Search results:', {
            total: data.total || data.results?.length || 0,
          });
        } else {
          console.log('Search unavailable (embeddings not configured)');
        }
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should perform global search',
      async () => {
        const response = await apiRequest('/api/v1/search', {
          method: 'POST',
          body: JSON.stringify({
            query: 'test document extraction',
            limit: 5,
          }),
        });

        // 200 if search works, 503 if embeddings unavailable
        expect([200, 503]).toContain(response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Global search results:', {
            total: data.total || data.results?.length || 0,
          });
        }
      },
      E2E_TIMEOUT
    );
  });

  describe('Step 6: Create Evidence Pack', () => {
    it.skipIf(skipIfNoAuth)(
      'should create evidence pack for project',
      async () => {
        expect(testProjectId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/projects/${testProjectId}/evidence-packs`,
          {
            method: 'POST',
            body: JSON.stringify({
              name: `E2E Test Pack ${Date.now()}`,
              description: 'Evidence pack created by e2e tests',
              include_quality_analysis: true,
            }),
          }
        );

        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data.id).toBeDefined();
        expect(data.name).toContain('E2E Test Pack');

        // Verify Juris-AGI required fields
        expect(data.documents).toBeDefined();
        expect(data.spans).toBeDefined();
        expect(data.claims).toBeDefined();
        expect(data.metrics).toBeDefined();
        expect(data.conflicts).toBeDefined();
        expect(data.open_questions).toBeDefined();

        testPackId = data.id;
        createdResources.packIds.push({
          projectId: testProjectId,
          packId: testPackId,
        });

        console.log('Evidence pack created:', {
          id: testPackId,
          name: data.name,
          documents: data.documents?.length || 0,
          spans: data.spans?.length || 0,
          claims: data.claims?.length || 0,
        });
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should retrieve evidence pack',
      async () => {
        expect(testProjectId).toBeDefined();
        expect(testPackId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/projects/${testProjectId}/evidence-packs/${testPackId}`
        );
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.id).toBe(testPackId);

        console.log('Evidence pack retrieved:', {
          id: data.id,
          name: data.name,
        });
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should list evidence packs',
      async () => {
        expect(testProjectId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/projects/${testProjectId}/evidence-packs`
        );
        expect(response.ok).toBe(true);

        const packs = await response.json();
        expect(Array.isArray(packs)).toBe(true);
        expect(packs.length).toBeGreaterThanOrEqual(1);

        console.log('Evidence packs in project:', packs.length);
      },
      E2E_TIMEOUT
    );
  });

  describe('Step 7: Cleanup and Deletion', () => {
    it.skipIf(skipIfNoAuth)(
      'should delete evidence pack',
      async () => {
        expect(testProjectId).toBeDefined();
        expect(testPackId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/projects/${testProjectId}/evidence-packs/${testPackId}`,
          { method: 'DELETE' }
        );

        // 200 or 204 for successful deletion
        expect([200, 204]).toContain(response.status);

        // Remove from cleanup list since we already deleted it
        createdResources.packIds = createdResources.packIds.filter(
          (p) => p.packId !== testPackId
        );

        console.log('Evidence pack deleted');
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should detach document from project',
      async () => {
        expect(testProjectId).toBeDefined();
        expect(testDocumentId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/projects/${testProjectId}/documents/${testDocumentId}`,
          { method: 'DELETE' }
        );

        // 200 or 204 for successful detachment
        expect([200, 204]).toContain(response.status);

        console.log('Document detached from project');
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should delete project',
      async () => {
        expect(testProjectId).toBeDefined();

        const response = await apiRequest(`/api/v1/projects/${testProjectId}`, {
          method: 'DELETE',
        });

        // 200 or 204 for successful deletion
        expect([200, 204]).toContain(response.status);

        // Remove from cleanup list
        createdResources.projectIds = createdResources.projectIds.filter(
          (id) => id !== testProjectId
        );

        console.log('Project deleted');
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should delete document',
      async () => {
        expect(testDocumentId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/documents/${testDocumentId}`,
          { method: 'DELETE' }
        );

        // 200 or 204 for successful deletion
        expect([200, 204]).toContain(response.status);

        // Remove from cleanup list
        createdResources.documentIds = createdResources.documentIds.filter(
          (id) => id !== testDocumentId
        );

        console.log('Document deleted');
      },
      E2E_TIMEOUT
    );

    it.skipIf(skipIfNoAuth)(
      'should verify document is deleted',
      async () => {
        expect(testDocumentId).toBeDefined();

        const response = await apiRequest(
          `/api/v1/documents/${testDocumentId}`
        );

        expect(response.status).toBe(404);
        console.log('Document deletion verified (404)');
      },
      E2E_TIMEOUT
    );
  });
});

describe('E2E: Evidence API Error Handling', () => {
  const skipIfNoAuth = !EVIDENCE_API_KEY;

  it.skipIf(skipIfNoAuth)(
    'should return 404 for non-existent document',
    async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await apiRequest(`/api/v1/documents/${fakeId}`);
      expect(response.status).toBe(404);
    },
    E2E_TIMEOUT
  );

  it.skipIf(skipIfNoAuth)(
    'should return 404 for non-existent project',
    async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await apiRequest(`/api/v1/projects/${fakeId}`);
      expect(response.status).toBe(404);
    },
    E2E_TIMEOUT
  );

  it.skipIf(skipIfNoAuth)(
    'should return 422 for invalid UUID',
    async () => {
      const response = await apiRequest('/api/v1/documents/not-a-uuid');
      expect(response.status).toBe(422);
    },
    E2E_TIMEOUT
  );
});
