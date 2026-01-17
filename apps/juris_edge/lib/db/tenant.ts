/**
 * Tenant Database Client Factory
 *
 * Each tenant (company) has their own isolated PostgreSQL database.
 * This module provides a factory to get the correct client for a tenant.
 *
 * Database naming convention: juris_tenant_{tenant_slug}
 * Example: juris_tenant_acme_capital
 */

// Note: In production, this would import from the generated tenant client
// import { PrismaClient } from '.prisma/tenant-client';

import { PrismaClient } from '@prisma/client';

// Cache of tenant database connections
// Key: tenantId, Value: PrismaClient
const tenantClients = new Map<string, PrismaClient>();

// Maximum number of cached connections (LRU-style eviction)
const MAX_CACHED_CONNECTIONS = 50;

// Track connection order for LRU eviction
const connectionOrder: string[] = [];

export interface TenantConnectionConfig {
  tenantId: string;
  tenantSlug: string;
  databaseName?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

/**
 * Build connection URL from config
 */
function buildConnectionUrl(config: TenantConnectionConfig): string {
  const host = config.host || process.env.TENANT_DATABASE_HOST || 'localhost';
  const port = config.port || parseInt(process.env.TENANT_DATABASE_PORT || '5432');
  const username = config.username || process.env.TENANT_DATABASE_USER || 'postgres';
  const password = config.password || process.env.TENANT_DATABASE_PASSWORD || '';
  const database = config.databaseName || `juris_tenant_${config.tenantSlug.replace(/-/g, '_')}`;

  return `postgresql://${username}:${password}@${host}:${port}/${database}?schema=public`;
}

/**
 * Get a Prisma client for a specific tenant
 *
 * @param config - Tenant connection configuration
 * @returns PrismaClient connected to the tenant's database
 */
export function getTenantClient(config: TenantConnectionConfig): PrismaClient {
  const { tenantId } = config;

  // Check if we already have a cached connection
  if (tenantClients.has(tenantId)) {
    // Move to end of connection order (most recently used)
    const index = connectionOrder.indexOf(tenantId);
    if (index > -1) {
      connectionOrder.splice(index, 1);
    }
    connectionOrder.push(tenantId);

    return tenantClients.get(tenantId)!;
  }

  // Evict oldest connection if at capacity
  if (tenantClients.size >= MAX_CACHED_CONNECTIONS && connectionOrder.length > 0) {
    const oldestTenantId = connectionOrder.shift()!;
    const oldClient = tenantClients.get(oldestTenantId);
    if (oldClient) {
      // Disconnect asynchronously (don't wait)
      oldClient.$disconnect().catch(console.error);
      tenantClients.delete(oldestTenantId);
    }
  }

  // Create new connection
  const url = buildConnectionUrl(config);

  const client = new PrismaClient({
    datasources: {
      db: { url },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

  // Cache the connection
  tenantClients.set(tenantId, client);
  connectionOrder.push(tenantId);

  return client;
}

/**
 * Get a tenant client from the request context
 * This is typically called from middleware that has already resolved the tenant.
 *
 * @param tenantId - The tenant ID from request context
 * @param tenantSlug - The tenant slug from request context
 */
export function getTenantClientFromContext(
  tenantId: string,
  tenantSlug: string
): PrismaClient {
  return getTenantClient({ tenantId, tenantSlug });
}

/**
 * Disconnect a specific tenant's database connection
 *
 * @param tenantId - The tenant ID to disconnect
 */
export async function disconnectTenant(tenantId: string): Promise<void> {
  const client = tenantClients.get(tenantId);
  if (client) {
    await client.$disconnect();
    tenantClients.delete(tenantId);
    const index = connectionOrder.indexOf(tenantId);
    if (index > -1) {
      connectionOrder.splice(index, 1);
    }
  }
}

/**
 * Disconnect all cached tenant connections
 * Call this during graceful shutdown.
 */
export async function disconnectAllTenants(): Promise<void> {
  const disconnectPromises = Array.from(tenantClients.values()).map((client) =>
    client.$disconnect()
  );
  await Promise.all(disconnectPromises);
  tenantClients.clear();
  connectionOrder.length = 0;
}

/**
 * Get the number of active tenant connections
 */
export function getActiveConnectionCount(): number {
  return tenantClients.size;
}

/**
 * Health check for a tenant's database connection
 */
export async function checkTenantConnection(
  config: TenantConnectionConfig
): Promise<{ connected: boolean; error?: string }> {
  try {
    const client = getTenantClient(config);
    await client.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
