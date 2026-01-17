/**
 * NextAuth Mock
 * Provides mocked auth functions for unit testing
 */

import { vi } from 'vitest';

// Mock session data
export interface MockSession {
  user: {
    id: string;
    email: string;
    name: string;
    companyId?: string;
    companyName?: string;
    companyRole?: string;
    industryProfile?: string;
  };
  expires: string;
}

// Factory to create different session types
export function createMockSession(overrides: Partial<MockSession['user']> = {}): MockSession {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      companyId: 'test-company-id',
      companyName: 'Test Company',
      companyRole: 'MEMBER',
      industryProfile: 'GENERIC',
      ...overrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Pre-defined session templates
export const mockSessions = {
  owner: createMockSession({
    id: 'owner-user-id',
    email: 'owner@example.com',
    name: 'Company Owner',
    companyRole: 'OWNER',
  }),
  admin: createMockSession({
    id: 'admin-user-id',
    email: 'admin@example.com',
    name: 'Org Admin',
    companyRole: 'ORG_ADMIN',
  }),
  member: createMockSession({
    id: 'member-user-id',
    email: 'member@example.com',
    name: 'Regular Member',
    companyRole: 'MEMBER',
  }),
  viewer: createMockSession({
    id: 'viewer-user-id',
    email: 'viewer@example.com',
    name: 'Viewer User',
    companyRole: 'VIEWER',
  }),
  mandateAdmin: createMockSession({
    id: 'mandate-admin-id',
    email: 'mandate-admin@example.com',
    name: 'Mandate Admin',
    companyRole: 'MANDATE_ADMIN',
  }),
  differentCompany: createMockSession({
    id: 'other-user-id',
    email: 'other@example.com',
    name: 'Other Company User',
    companyId: 'other-company-id',
    companyName: 'Other Company',
    companyRole: 'MEMBER',
  }),
  unauthenticated: null,
};

// Mock auth function that returns the specified session
export function createMockAuth(session: MockSession | null = mockSessions.member) {
  return vi.fn().mockResolvedValue(session);
}

// Default mock auth
export const mockAuth = createMockAuth();
