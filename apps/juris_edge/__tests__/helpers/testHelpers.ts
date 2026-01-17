/**
 * Test Helpers
 * Utility functions for API endpoint testing
 */

import { NextRequest } from 'next/server';
import { vi } from 'vitest';

// ================================
// REQUEST HELPERS
// ================================

/**
 * Creates a mock NextRequest for testing API routes
 */
export function createMockRequest(
  method: string,
  url: string,
  body?: object,
  headers?: Record<string, string>
): NextRequest {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), requestInit);
}

/**
 * Creates a mock Request for testing API routes (standard Request)
 */
export function createMockStandardRequest(
  method: string,
  url: string,
  body?: object,
  headers?: Record<string, string>
): Request {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(new URL(url, 'http://localhost:3000'), requestInit);
}

// ================================
// RESPONSE HELPERS
// ================================

/**
 * Parses JSON response from NextResponse
 */
export async function parseResponse<T = unknown>(response: Response): Promise<{
  status: number;
  data: T;
}> {
  const data = await response.json();
  return {
    status: response.status,
    data,
  };
}

/**
 * Asserts a successful response
 */
export function assertSuccessResponse(response: { status: number; data: { success?: boolean } }) {
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Expected success status (200/201), got ${response.status}`);
  }
  if (response.data.success === false) {
    throw new Error(`Response indicates failure: ${JSON.stringify(response.data)}`);
  }
}

/**
 * Asserts an error response with expected status
 */
export function assertErrorResponse(
  response: { status: number; data: { success?: boolean; error?: string } },
  expectedStatus: number,
  expectedErrorContains?: string
) {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }
  if (response.data.success !== false) {
    throw new Error('Expected response.success to be false');
  }
  if (expectedErrorContains && !response.data.error?.includes(expectedErrorContains)) {
    throw new Error(
      `Expected error to contain "${expectedErrorContains}", got "${response.data.error}"`
    );
  }
}

// ================================
// MOCK SETUP HELPERS
// ================================

/**
 * Sets up common mocks for authenticated endpoint testing
 */
export function setupAuthenticatedMocks(
  mockPrisma: any,
  mockAuth: any,
  session: any,
  userData: any
) {
  mockAuth.mockResolvedValue(session);
  mockPrisma.user.findUnique.mockResolvedValue(userData);
}

/**
 * Sets up mocks for unauthenticated requests
 */
export function setupUnauthenticatedMocks(mockAuth: any) {
  mockAuth.mockResolvedValue(null);
}

// ================================
// DATA GENERATORS
// ================================

/**
 * Generates a unique ID for testing
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a valid email for testing
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}@example.com`;
}

/**
 * Creates mock params object for dynamic routes
 */
export function createMockParams(params: Record<string, string>): { params: Promise<Record<string, string>> } {
  return {
    params: Promise.resolve(params),
  };
}

// ================================
// WORKFLOW TESTING HELPERS
// ================================

/**
 * Baseline workflow states for testing transitions
 */
export const BASELINE_WORKFLOW_STATES = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
} as const;

/**
 * Valid baseline state transitions
 */
export const VALID_BASELINE_TRANSITIONS = {
  DRAFT: ['PENDING_APPROVAL'],
  PENDING_APPROVAL: ['PUBLISHED', 'REJECTED'],
  REJECTED: ['PENDING_APPROVAL'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [],
} as const;

/**
 * Company roles for authorization testing
 */
export const COMPANY_ROLES = {
  OWNER: 'OWNER',
  ORG_ADMIN: 'ORG_ADMIN',
  MANDATE_ADMIN: 'MANDATE_ADMIN',
  MEMBER: 'MEMBER',
  COMPLIANCE: 'COMPLIANCE',
  RISK: 'RISK',
  FINANCE: 'FINANCE',
  IC_MEMBER: 'IC_MEMBER',
  IC_CHAIR: 'IC_CHAIR',
  VIEWER: 'VIEWER',
} as const;

/**
 * Portfolio access levels
 */
export const PORTFOLIO_ACCESS_LEVELS = {
  MAKER: 'MAKER',
  CHECKER: 'CHECKER',
  VIEWER: 'VIEWER',
} as const;

/**
 * Admin roles that have elevated permissions
 */
export const ADMIN_ROLES = ['OWNER', 'ORG_ADMIN'] as const;

/**
 * Checks if a role has admin privileges
 */
export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number]);
}
