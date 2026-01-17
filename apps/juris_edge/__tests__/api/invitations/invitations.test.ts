/**
 * Unit Tests: /api/invitations
 * Tests invitation GET and POST endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStandardRequest, parseResponse } from '../../helpers/testHelpers';
import { testUsers, testCompanies, testInvitations } from '../../fixtures/testData';

// Mock modules with inline factories (vi.mock is hoisted)
vi.mock('@/lib/prisma', () => {
  const mockFn = () => ({
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  });
  return { default: mockFn() };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'email-id' }),
    },
  })),
}));

// Import after mocks
import { GET, POST } from '@/app/api/invitations/route';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

const mockPrisma = vi.mocked(prisma);
const mockAuth = vi.mocked(auth);

// Mock sessions
const mockSessions = {
  owner: {
    user: { id: 'user-owner-123', email: 'owner@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  admin: {
    user: { id: 'user-admin-123', email: 'admin@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  member: {
    user: { id: 'user-member-123', email: 'member@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
};

describe('/api/invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/invitations', () => {
    describe('Authentication', () => {
      it('should return 401 if not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = createMockStandardRequest(
          'GET',
          '/api/invitations?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Validation', () => {
      it('should return 400 if companyId is missing', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);

        const request = createMockStandardRequest('GET', '/api/invitations');

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('companyId is required');
      });
    });

    describe('Authorization', () => {
      it('should return 403 if user belongs to different company', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          ...testUsers.member,
          companyId: 'different-company',
        } as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/invitations?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Access denied');
      });
    });

    describe('Successful Requests', () => {
      it('should return invitations for the company', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);

        const invitations = [
          testInvitations.pending,
          testInvitations.accepted,
        ];
        mockPrisma.invitation.findMany.mockResolvedValue(invitations as any);
        mockPrisma.invitation.updateMany.mockResolvedValue({ count: 0 });

        const request = createMockStandardRequest(
          'GET',
          '/api/invitations?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.invitations).toHaveLength(2);
      });

      it('should auto-expire pending invitations past expiry date', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);

        const invitations = [
          testInvitations.expired, // This has expiresAt in the past
        ];
        mockPrisma.invitation.findMany.mockResolvedValue(invitations as any);
        mockPrisma.invitation.updateMany.mockResolvedValue({ count: 1 });

        const request = createMockStandardRequest(
          'GET',
          '/api/invitations?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.invitations[0].status).toBe('EXPIRED');
      });

      it('should return invitation fields correctly', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);

        mockPrisma.invitation.findMany.mockResolvedValue([testInvitations.pending] as any);
        mockPrisma.invitation.updateMany.mockResolvedValue({ count: 0 });

        const request = createMockStandardRequest(
          'GET',
          '/api/invitations?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.invitations[0]).toEqual({
          id: testInvitations.pending.id,
          email: testInvitations.pending.email,
          name: testInvitations.pending.name,
          role: testInvitations.pending.role,
          portfolioAccess: testInvitations.pending.portfolioAccess,
          status: 'PENDING',
          createdAt: testInvitations.pending.createdAt.toISOString(),
          expiresAt: testInvitations.pending.expiresAt.toISOString(),
          acceptedAt: testInvitations.pending.acceptedAt,
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
        mockPrisma.invitation.findMany.mockRejectedValue(new Error('Database error'));

        const request = createMockStandardRequest(
          'GET',
          '/api/invitations?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch invitations');
      });
    });
  });

  describe('POST /api/invitations', () => {
    describe('Authentication', () => {
      it('should return 401 if not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newuser@example.com',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Validation', () => {
      it('should return 400 if companyId is missing', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          email: 'newuser@example.com',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('companyId and email are required');
      });

      it('should return 400 if email is missing', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('companyId and email are required');
      });
    });

    describe('Authorization', () => {
      it('should return 403 if user belongs to different company', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          ...testUsers.member,
          companyId: 'different-company',
          company: { id: 'different-company', name: 'Different' },
        } as any);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newuser@example.com',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Access denied');
      });

      it('should return 403 if user is not admin', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          ...testUsers.member,
          companyId: 'company-123',
          companyRole: 'MEMBER', // Not admin
          company: { id: 'company-123', name: 'Test Company' },
        } as any);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newuser@example.com',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Only admins can invite users');
      });
    });

    describe('Duplicate Checks', () => {
      it('should return 400 if user already exists in company', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          ...testUsers.owner,
          companyId: 'company-123',
          companyRole: 'OWNER',
          company: { id: 'company-123', name: 'Test Company' },
        } as any);
        mockPrisma.user.findFirst.mockResolvedValue(testUsers.member as any); // User exists

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'member@testcompany.com',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('already exists');
      });

      it('should return 400 if pending invitation already exists', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          ...testUsers.owner,
          companyId: 'company-123',
          companyRole: 'OWNER',
          company: { id: 'company-123', name: 'Test Company' },
        } as any);
        mockPrisma.user.findFirst.mockResolvedValue(null); // No existing user
        mockPrisma.invitation.findFirst.mockResolvedValue(testInvitations.pending as any); // Pending invite exists

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newuser@example.com',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('invitation has already been sent');
        expect(data.code).toBe('INVITE_EXISTS');
      });
    });

    describe('Successful Invitation', () => {
      beforeEach(() => {
        mockPrisma.user.findUnique.mockResolvedValue({
          ...testUsers.owner,
          companyId: 'company-123',
          companyRole: 'OWNER',
          name: 'Test Owner',
          company: { id: 'company-123', name: 'Test Company' },
        } as any);
        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.invitation.findFirst.mockResolvedValue(null);
      });

      it('should create invitation successfully', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);

        const newInvitation = {
          ...testInvitations.pending,
          id: 'new-invite-id',
          email: 'newuser@example.com',
        };
        mockPrisma.invitation.create.mockResolvedValue(newInvitation as any);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newuser@example.com',
          name: 'New User',
          role: 'member',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.invitation).toBeDefined();
        expect(data.invitation.email).toBe('newuser@example.com');
      });

      it('should convert email to lowercase', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.invitation.create.mockResolvedValue({
          ...testInvitations.pending,
          email: 'newuser@example.com',
        } as any);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'NewUser@Example.COM', // Mixed case
        });

        await POST(request);

        expect(mockPrisma.invitation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              email: 'newuser@example.com', // Should be lowercase
            }),
          })
        );
      });

      it('should map admin role correctly', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.invitation.create.mockResolvedValue({
          ...testInvitations.pending,
          role: 'ORG_ADMIN',
        } as any);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newadmin@example.com',
          role: 'admin',
        });

        await POST(request);

        expect(mockPrisma.invitation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              role: 'ORG_ADMIN',
            }),
          })
        );
      });

      it('should map member role correctly', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.invitation.create.mockResolvedValue({
          ...testInvitations.pending,
          role: 'MEMBER',
        } as any);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newmember@example.com',
          role: 'member',
        });

        await POST(request);

        expect(mockPrisma.invitation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              role: 'MEMBER',
            }),
          })
        );
      });

      it('should set expiration to 7 days', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.invitation.create.mockResolvedValue(testInvitations.pending as any);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newuser@example.com',
        });

        await POST(request);

        expect(mockPrisma.invitation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              expiresAt: expect.any(Date),
            }),
          })
        );

        // Verify it's approximately 7 days from now
        const callArg = mockPrisma.invitation.create.mock.calls[0][0];
        const expiresAt = callArg.data.expiresAt as Date;
        const now = new Date();
        const daysDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBeGreaterThan(6.9);
        expect(daysDiff).toBeLessThan(7.1);
      });

      it('should include portfolioAccess if provided', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.invitation.create.mockResolvedValue({
          ...testInvitations.pending,
          portfolioAccess: [
            { portfolioId: 'portfolio-1', accessLevel: 'MAKER' },
          ],
        } as any);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newuser@example.com',
          portfolioAccess: [{ portfolioId: 'portfolio-1', accessLevel: 'MAKER' }],
        });

        await POST(request);

        expect(mockPrisma.invitation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              portfolioAccess: [{ portfolioId: 'portfolio-1', accessLevel: 'MAKER' }],
            }),
          })
        );
      });

      it('should return inviteUrl in response', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.invitation.create.mockResolvedValue({
          ...testInvitations.pending,
          token: 'test-token-123',
        } as any);

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newuser@example.com',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.invitation.inviteUrl).toContain('/invite/');
        expect(data.invitation.inviteUrl).toContain('test-token-123');
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.user.findUnique.mockResolvedValue({
          ...testUsers.owner,
          companyId: 'company-123',
          companyRole: 'OWNER',
          company: { id: 'company-123', name: 'Test Company' },
        } as any);
        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.invitation.findFirst.mockResolvedValue(null);
        mockPrisma.invitation.create.mockRejectedValue(new Error('Database error'));

        const request = createMockStandardRequest('POST', '/api/invitations', {
          companyId: 'company-123',
          email: 'newuser@example.com',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to create invitation');
      });
    });
  });
});
