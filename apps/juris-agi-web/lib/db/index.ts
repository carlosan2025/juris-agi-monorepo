/**
 * Database Layer
 *
 * Multi-database architecture for Juris AGI:
 *
 * 1. Platform Database (juris_platform)
 *    - JurisAdmin users
 *    - Tenant management
 *    - Subscriptions & billing
 *    - Platform API keys
 *    - Email templates & logs
 *
 * 2. Tenant Databases (juris_tenant_{slug})
 *    - Company data (one per company)
 *    - Users & authentication
 *    - Mandates & baselines
 *    - Cases & decisions
 *    - Documents & evidence
 *    - Portfolios
 *
 * 3. Evidence Repository (evidence_repository)
 *    - Shared legal knowledge base
 *    - Case law & regulations
 *    - (Separate application)
 */

// Platform database
export {
  getPlatformClient,
  disconnectPlatform,
  platformDb,
} from './platform';

// Tenant database factory
export {
  getTenantClient,
  getTenantClientFromContext,
  disconnectTenant,
  disconnectAllTenants,
  getActiveConnectionCount,
  checkTenantConnection,
  type TenantConnectionConfig,
} from './tenant';

// Database router
export {
  DatabaseRouter,
  getRouter,
  platform,
  tenant,
  fromContext,
  type DatabaseType,
  type RequestContext,
} from './router';

// Re-export router as default
export { default } from './router';
