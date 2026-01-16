/**
 * Database Router
 *
 * Central routing logic for determining which database to use.
 * Handles the multi-database architecture:
 * - Platform database: Juris AGI administration
 * - Tenant databases: Per-company isolated data
 * - Evidence database: Shared legal repository (separate app)
 */

import { PrismaClient } from '@prisma/client';
import { getPlatformClient, disconnectPlatform } from './platform';
import {
  getTenantClient,
  getTenantClientFromContext,
  disconnectAllTenants,
  disconnectTenant,
  TenantConnectionConfig,
} from './tenant';

export type DatabaseType = 'platform' | 'tenant' | 'evidence';

export interface RequestContext {
  tenantId?: string;
  tenantSlug?: string;
  isAdminRequest?: boolean;
}

/**
 * Database Router class
 * Provides the correct database client based on the request context.
 */
export class DatabaseRouter {
  /**
   * Get the Platform database client
   * Use for Juris Admin operations.
   */
  getPlatform(): PrismaClient {
    return getPlatformClient();
  }

  /**
   * Get a Tenant database client
   * Use for all tenant-specific operations.
   */
  getTenant(config: TenantConnectionConfig): PrismaClient {
    return getTenantClient(config);
  }

  /**
   * Get the appropriate database client based on request context
   *
   * @param context - Request context containing tenant info
   * @returns The appropriate PrismaClient
   */
  getClientFromContext(context: RequestContext): PrismaClient {
    // Admin requests go to platform database
    if (context.isAdminRequest) {
      return this.getPlatform();
    }

    // Tenant requests need tenant ID and slug
    if (context.tenantId && context.tenantSlug) {
      return getTenantClientFromContext(context.tenantId, context.tenantSlug);
    }

    // Fallback to platform for requests without tenant context
    // This might happen for public pages, auth flows, etc.
    return this.getPlatform();
  }

  /**
   * Resolve tenant connection config from platform database
   *
   * @param tenantId - The tenant ID to look up
   * @returns Connection configuration for the tenant
   */
  async resolveTenantConfig(
    tenantId: string
  ): Promise<TenantConnectionConfig | null> {
    const platform = this.getPlatform();

    // Look up tenant database config from platform database
    // Note: This uses the platform schema's TenantDatabaseConfig model
    try {
      // In production, this would query the actual TenantDatabaseConfig table
      // For now, we construct from environment variables
      const tenant = await platform.company.findUnique({
        where: { id: tenantId },
        select: { id: true, slug: true },
      });

      if (!tenant) {
        return null;
      }

      return {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        // Additional config would come from TenantDatabaseConfig in production
      };
    } catch {
      return null;
    }
  }

  /**
   * Disconnect from a specific tenant database
   */
  async disconnectTenant(tenantId: string): Promise<void> {
    await disconnectTenant(tenantId);
  }

  /**
   * Disconnect from all databases
   * Call during graceful shutdown.
   */
  async disconnectAll(): Promise<void> {
    await Promise.all([disconnectPlatform(), disconnectAllTenants()]);
  }
}

// Singleton instance
const router = new DatabaseRouter();

/**
 * Get the database router singleton
 */
export function getRouter(): DatabaseRouter {
  return router;
}

/**
 * Convenience function to get the platform client
 */
export function platform(): PrismaClient {
  return router.getPlatform();
}

/**
 * Convenience function to get a tenant client
 */
export function tenant(config: TenantConnectionConfig): PrismaClient {
  return router.getTenant(config);
}

/**
 * Convenience function to get client from context
 */
export function fromContext(context: RequestContext): PrismaClient {
  return router.getClientFromContext(context);
}

export default router;
