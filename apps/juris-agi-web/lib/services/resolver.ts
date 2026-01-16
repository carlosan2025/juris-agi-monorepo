/**
 * Service Resolver
 *
 * Resolves the appropriate service configuration based on context:
 *
 * GENERAL SERVICES (AI, Email, Storage):
 * 1. Check tenant DB for override → fallback to platform default
 *
 * EVIDENCE SERVICES (AI, Storage, Vector, Document):
 * 1. Check tenant's InfrastructureConfig to determine mode
 * 2. If MULTI_TENANT or service mode is SHARED → use platform's shared Evidence configs
 *    with tenant isolation (storage prefixes, vector namespaces)
 * 3. If DEDICATED or service mode is DEDICATED → use tenant's own Evidence configs
 *
 * This allows tenants to start with shared infrastructure and migrate to dedicated
 * as their needs grow.
 */

import { getPlatformClient } from '@/lib/db/platform';
import { getTenantClient, TenantConnectionConfig } from '@/lib/db/tenant';
import type {
  ServiceOwnership,
  ServiceResolutionContext,
  ResolvedService,
  ServiceSource,
  InfrastructureConfig,
  ServiceMode,
  AIConfig,
  EmailConfig,
  StorageConfig,
  DocumentConfig,
  VectorConfig,
} from './types';

// =============================================================================
// Infrastructure Mode Resolution
// =============================================================================

/**
 * Get the tenant's infrastructure configuration
 * Returns null if tenant is not found or using default (MULTI_TENANT)
 */
async function getInfrastructureConfig(
  tenantId: string,
  tenantSlug: string
): Promise<InfrastructureConfig | null> {
  try {
    const tenantClient = getTenantClient({ tenantId, tenantSlug });
    const config = await tenantClient.infrastructureConfig?.findFirst();

    if (config) {
      return {
        id: config.id,
        mode: config.mode as InfrastructureConfig['mode'],
        databaseMode: config.databaseMode as ServiceMode,
        storageMode: config.storageMode as ServiceMode,
        vectorDbMode: config.vectorDbMode as ServiceMode,
        aiMode: config.aiMode as ServiceMode,
        emailMode: config.emailMode as ServiceMode,
        migrationInProgress: config.migrationInProgress,
        migrationStep: config.migrationStep || undefined,
        migratedAt: config.migratedAt || undefined,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    }
  } catch {
    // Tenant not found or no config, use default (MULTI_TENANT)
  }
  return null;
}

/**
 * Determine if a specific Evidence service should use dedicated infrastructure
 */
function shouldUseDedicatedService(
  infraConfig: InfrastructureConfig | null,
  serviceType: 'ai' | 'storage' | 'vectorDb' | 'document' | 'database'
): boolean {
  if (!infraConfig) return false;

  // If fully dedicated mode, all services are dedicated
  if (infraConfig.mode === 'DEDICATED') return true;

  // In HYBRID mode, check the specific service mode
  if (infraConfig.mode === 'HYBRID') {
    switch (serviceType) {
      case 'ai':
        return infraConfig.aiMode === 'DEDICATED';
      case 'storage':
        return infraConfig.storageMode === 'DEDICATED';
      case 'vectorDb':
        return infraConfig.vectorDbMode === 'DEDICATED';
      case 'database':
        return infraConfig.databaseMode === 'DEDICATED';
      case 'document':
        // Document processing follows storage mode
        return infraConfig.storageMode === 'DEDICATED';
    }
  }

  // MULTI_TENANT mode: always use shared
  return false;
}

/**
 * Generate tenant isolation context for shared infrastructure
 */
function getTenantIsolation(tenantId: string): {
  tenantId: string;
  storagePrefix: string;
  vectorNamespace: string;
} {
  return {
    tenantId,
    storagePrefix: `tenant_${tenantId}/`,
    vectorNamespace: `tenant_${tenantId}`,
  };
}

// =============================================================================
// Service Resolution Functions
// =============================================================================

/**
 * Resolve AI provider for a given context
 *
 * For general use: tenant override → platform default
 * For Evidence App:
 *   - Check tenant's infrastructure mode
 *   - SHARED/MULTI_TENANT → platform's shared Evidence AI config
 *   - DEDICATED → tenant's own Evidence AI config
 */
export async function resolveAIProvider(
  context: ServiceResolutionContext
): Promise<ResolvedService<AIConfig> | null> {
  const platform = getPlatformClient();

  // For Evidence App, resolve based on tenant's infrastructure mode
  if (context.forEvidence && context.tenantId && context.tenantSlug) {
    const infraConfig = await getInfrastructureConfig(context.tenantId, context.tenantSlug);
    const useDedicated = shouldUseDedicatedService(infraConfig, 'ai');

    if (useDedicated) {
      // Use tenant's dedicated Evidence AI config
      const tenantClient = getTenantClient({
        tenantId: context.tenantId,
        tenantSlug: context.tenantSlug,
      });

      try {
        const tenantEvidenceAI = await tenantClient.evidenceAIConfig?.findFirst({
          where: { isActive: true, isPrimary: true },
        });

        if (tenantEvidenceAI) {
          return {
            config: mapTenantEvidenceAIConfig(tenantEvidenceAI),
            ownership: 'tenant',
            source: 'tenant_evidence',
          };
        }
      } catch {
        // Fall through to error - dedicated mode requires config
      }

      // In dedicated mode, missing config is an error
      console.error(`Tenant ${context.tenantId} is in DEDICATED mode but has no Evidence AI config`);
      return null;
    }

    // Use platform's shared Evidence AI config (with tenant isolation)
    const sharedConfig = await platform.evidenceAIConfig?.findFirst({
      where: { isPrimary: true, isActive: true },
    });

    if (sharedConfig) {
      return {
        config: mapEvidenceAIConfig(sharedConfig),
        ownership: 'evidence',
        source: 'shared_infrastructure',
        tenantIsolation: getTenantIsolation(context.tenantId),
      };
    }
    return null;
  }

  // For general AI (not Evidence): tenant override → platform default
  if (context.tenantId && context.tenantSlug) {
    const tenantClient = getTenantClient({
      tenantId: context.tenantId,
      tenantSlug: context.tenantSlug,
    });

    try {
      const tenantConfig = await tenantClient.tenantAIConfig?.findFirst({
        where: { isActive: true },
      });

      if (tenantConfig) {
        return {
          config: mapTenantAIConfig(tenantConfig),
          ownership: 'tenant',
          source: 'tenant_override',
        };
      }
    } catch {
      // Tenant config not found, fall through to platform
    }
  }

  // Fallback to platform config
  const platformConfig = await platform.aIProviderConfig?.findFirst({
    where: { isPrimary: true, isActive: true },
  });

  if (platformConfig) {
    return {
      config: mapPlatformAIConfig(platformConfig),
      ownership: 'platform',
      source: 'platform_default',
    };
  }

  return null;
}

/**
 * Resolve email provider for a given context
 * Priority: tenant override → platform default
 */
export async function resolveEmailProvider(
  context: ServiceResolutionContext
): Promise<ResolvedService<EmailConfig> | null> {
  const platform = getPlatformClient();

  // Try tenant override first
  if (context.tenantId && context.tenantSlug) {
    const tenantClient = getTenantClient({
      tenantId: context.tenantId,
      tenantSlug: context.tenantSlug,
    });

    try {
      const tenantConfig = await tenantClient.tenantEmailConfig?.findFirst({
        where: { isActive: true },
      });

      if (tenantConfig) {
        return {
          config: mapTenantEmailConfig(tenantConfig),
          ownership: 'tenant',
          source: 'tenant_override',
        };
      }
    } catch {
      // Tenant config not found, fall through to platform
    }
  }

  // Fallback to platform config
  const platformConfig = await platform.emailProviderConfig?.findFirst({
    where: { isPrimary: true, isActive: true },
  });

  if (platformConfig) {
    return {
      config: mapPlatformEmailConfig(platformConfig),
      ownership: 'platform',
      source: 'platform_default',
    };
  }

  return null;
}

/**
 * Resolve storage provider for a given context
 *
 * For general use: tenant override → platform default
 * For Evidence App:
 *   - Check tenant's infrastructure mode
 *   - SHARED/MULTI_TENANT → platform's shared Evidence storage (with tenant prefix)
 *   - DEDICATED → tenant's own Evidence storage config
 */
export async function resolveStorageProvider(
  context: ServiceResolutionContext
): Promise<ResolvedService<StorageConfig> | null> {
  const platform = getPlatformClient();

  // For Evidence App, resolve based on tenant's infrastructure mode
  if (context.forEvidence && context.tenantId && context.tenantSlug) {
    const infraConfig = await getInfrastructureConfig(context.tenantId, context.tenantSlug);
    const useDedicated = shouldUseDedicatedService(infraConfig, 'storage');

    if (useDedicated) {
      // Use tenant's dedicated Evidence storage config
      const tenantClient = getTenantClient({
        tenantId: context.tenantId,
        tenantSlug: context.tenantSlug,
      });

      try {
        const tenantEvidenceStorage = await tenantClient.evidenceStorageConfig?.findFirst({
          where: { isActive: true, isPrimary: true },
        });

        if (tenantEvidenceStorage) {
          return {
            config: mapTenantEvidenceStorageConfig(tenantEvidenceStorage),
            ownership: 'tenant',
            source: 'tenant_evidence',
          };
        }
      } catch {
        // Fall through to error - dedicated mode requires config
      }

      console.error(`Tenant ${context.tenantId} is in DEDICATED mode but has no Evidence storage config`);
      return null;
    }

    // Use platform's shared Evidence storage (with tenant prefix isolation)
    const sharedConfig = await platform.evidenceStorageConfig?.findFirst({
      where: { isPrimary: true, isActive: true },
    });

    if (sharedConfig) {
      return {
        config: mapEvidenceStorageConfig(sharedConfig),
        ownership: 'evidence',
        source: 'shared_infrastructure',
        tenantIsolation: getTenantIsolation(context.tenantId),
      };
    }
    return null;
  }

  // For general storage (not Evidence): tenant override → platform default
  if (context.tenantId && context.tenantSlug) {
    const tenantClient = getTenantClient({
      tenantId: context.tenantId,
      tenantSlug: context.tenantSlug,
    });

    try {
      const tenantConfig = await tenantClient.tenantStorageConfig?.findFirst({
        where: { isActive: true },
      });

      if (tenantConfig) {
        return {
          config: mapTenantStorageConfig(tenantConfig),
          ownership: 'tenant',
          source: 'tenant_override',
        };
      }
    } catch {
      // Tenant config not found, fall through to platform
    }
  }

  // Fallback to platform config
  const platformConfig = await platform.storageProviderConfig?.findFirst({
    where: { isPrimary: true, isActive: true },
  });

  if (platformConfig) {
    return {
      config: mapPlatformStorageConfig(platformConfig),
      ownership: 'platform',
      source: 'platform_default',
    };
  }

  return null;
}

/**
 * Resolve document processing provider (Evidence App only)
 *
 * Document processing follows the storage infrastructure mode:
 * - SHARED/MULTI_TENANT → platform's shared document config
 * - DEDICATED → tenant's own document config
 */
export async function resolveDocumentProvider(
  context: ServiceResolutionContext
): Promise<ResolvedService<DocumentConfig> | null> {
  const platform = getPlatformClient();

  // Evidence document provider requires tenant context
  if (context.tenantId && context.tenantSlug) {
    const infraConfig = await getInfrastructureConfig(context.tenantId, context.tenantSlug);
    const useDedicated = shouldUseDedicatedService(infraConfig, 'document');

    if (useDedicated) {
      // Use tenant's dedicated document processing config
      const tenantClient = getTenantClient({
        tenantId: context.tenantId,
        tenantSlug: context.tenantSlug,
      });

      try {
        const tenantDocConfig = await tenantClient.evidenceDocumentConfig?.findFirst({
          where: { isActive: true, isPrimary: true },
        });

        if (tenantDocConfig) {
          return {
            config: mapTenantEvidenceDocumentConfig(tenantDocConfig),
            ownership: 'tenant',
            source: 'tenant_evidence',
          };
        }
      } catch {
        // Fall through to error
      }

      console.error(`Tenant ${context.tenantId} is in DEDICATED mode but has no Evidence document config`);
      return null;
    }

    // Use platform's shared document processing
    const sharedConfig = await platform.evidenceDocumentConfig?.findFirst({
      where: { isPrimary: true, isActive: true },
    });

    if (sharedConfig) {
      return {
        config: mapEvidenceDocumentConfig(sharedConfig),
        ownership: 'evidence',
        source: 'shared_infrastructure',
        tenantIsolation: getTenantIsolation(context.tenantId),
      };
    }
  }

  return null;
}

/**
 * Resolve vector database provider (Evidence App only)
 *
 * Vector DB resolution based on tenant's infrastructure mode:
 * - SHARED/MULTI_TENANT → platform's shared vector config (with tenant namespace)
 * - DEDICATED → tenant's own vector config
 */
export async function resolveVectorProvider(
  context: ServiceResolutionContext
): Promise<ResolvedService<VectorConfig> | null> {
  const platform = getPlatformClient();

  // Evidence vector provider requires tenant context
  if (context.tenantId && context.tenantSlug) {
    const infraConfig = await getInfrastructureConfig(context.tenantId, context.tenantSlug);
    const useDedicated = shouldUseDedicatedService(infraConfig, 'vectorDb');

    if (useDedicated) {
      // Use tenant's dedicated vector DB config
      const tenantClient = getTenantClient({
        tenantId: context.tenantId,
        tenantSlug: context.tenantSlug,
      });

      try {
        const tenantVectorConfig = await tenantClient.evidenceVectorConfig?.findFirst({
          where: { isActive: true, isPrimary: true },
        });

        if (tenantVectorConfig) {
          return {
            config: mapTenantEvidenceVectorConfig(tenantVectorConfig),
            ownership: 'tenant',
            source: 'tenant_evidence',
          };
        }
      } catch {
        // Fall through to error
      }

      console.error(`Tenant ${context.tenantId} is in DEDICATED mode but has no Evidence vector config`);
      return null;
    }

    // Use platform's shared vector DB (with tenant namespace isolation)
    const sharedConfig = await platform.evidenceVectorConfig?.findFirst({
      where: { isPrimary: true, isActive: true },
    });

    if (sharedConfig) {
      return {
        config: mapEvidenceVectorConfig(sharedConfig),
        ownership: 'evidence',
        source: 'shared_infrastructure',
        tenantIsolation: getTenantIsolation(context.tenantId),
      };
    }
  }

  return null;
}

// =============================================================================
// Config Mappers (convert DB records to typed configs)
// =============================================================================

// Note: These are placeholder implementations. In production:
// 1. Decrypt encrypted fields using encryption service
// 2. Validate all required fields are present
// 3. Handle type conversions properly

function mapPlatformAIConfig(record: any): AIConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'platform',
    apiKey: decryptField(record.apiKeyEncrypted),
    organizationId: record.organizationId,
    defaultModel: record.defaultModel,
    maxTokensPerRequest: record.maxTokensPerRequest,
    rateLimitPerMinute: record.rateLimitPerMinute,
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: record.lastTestedAt,
    testStatus: 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapEvidenceAIConfig(record: any): AIConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'evidence',
    apiKey: decryptField(record.apiKeyEncrypted),
    organizationId: record.organizationId,
    defaultModel: record.chatModel,
    embeddingModel: record.embeddingModel,
    maxTokensPerRequest: record.maxTokensPerRequest,
    rateLimitPerMinute: record.rateLimitPerMinute,
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: record.lastTestedAt,
    testStatus: record.testStatus?.toLowerCase() || 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapTenantAIConfig(record: any): AIConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'tenant',
    apiKey: decryptField(record.apiKeyEncrypted),
    organizationId: record.organizationId,
    defaultModel: record.defaultModel,
    maxTokensPerRequest: 4096, // Default
    rateLimitPerMinute: 60, // Default
    isActive: record.isActive,
    isPrimary: true, // Tenant configs are always primary for that tenant
    lastTestedAt: record.lastTestedAt || null,
    testStatus: 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapPlatformEmailConfig(record: any): EmailConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'platform',
    host: record.host,
    port: record.port,
    username: record.username,
    password: record.passwordEncrypted ? decryptField(record.passwordEncrypted) : undefined,
    secure: record.secure,
    apiKey: record.apiKeyEncrypted ? decryptField(record.apiKeyEncrypted) : undefined,
    domain: record.domain,
    fromEmail: record.fromEmail,
    fromName: record.fromName,
    replyToEmail: record.replyToEmail,
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: null,
    testStatus: 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapTenantEmailConfig(record: any): EmailConfig {
  return {
    id: record.id,
    provider: 'smtp',
    ownership: 'tenant',
    host: record.host,
    port: record.port,
    username: record.username,
    password: decryptField(record.passwordEncrypted),
    secure: record.secure,
    fromEmail: record.fromEmail,
    fromName: record.fromName,
    replyToEmail: record.replyToEmail,
    isActive: record.isActive,
    isPrimary: true,
    lastTestedAt: null,
    testStatus: 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapPlatformStorageConfig(record: any): StorageConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase().replace('_', '_'),
    ownership: 'platform',
    bucket: record.bucket,
    region: record.region,
    endpoint: record.endpoint,
    accessKey: record.accessKeyEncrypted ? decryptField(record.accessKeyEncrypted) : undefined,
    secretKey: record.secretKeyEncrypted ? decryptField(record.secretKeyEncrypted) : undefined,
    maxFileSizeMb: record.maxFileSizeMb,
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: null,
    testStatus: 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapEvidenceStorageConfig(record: any): StorageConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'evidence',
    bucket: record.bucket,
    region: record.region,
    endpoint: record.endpoint,
    accessKey: record.accessKeyEncrypted ? decryptField(record.accessKeyEncrypted) : undefined,
    secretKey: record.secretKeyEncrypted ? decryptField(record.secretKeyEncrypted) : undefined,
    accountId: record.accountId,
    cdnDomain: record.cdnDomain,
    maxFileSizeMb: record.maxFileSizeMb,
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: record.lastTestedAt,
    testStatus: record.testStatus?.toLowerCase() || 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapTenantStorageConfig(record: any): StorageConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'tenant',
    bucket: record.bucket,
    region: record.region,
    endpoint: record.endpoint,
    accessKey: record.accessKeyEncrypted ? decryptField(record.accessKeyEncrypted) : undefined,
    secretKey: record.secretKeyEncrypted ? decryptField(record.secretKeyEncrypted) : undefined,
    maxFileSizeMb: 100, // Default
    isActive: record.isActive,
    isPrimary: true,
    lastTestedAt: null,
    testStatus: 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapEvidenceDocumentConfig(record: any): DocumentConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'evidence',
    publicKey: record.publicKeyEncrypted ? decryptField(record.publicKeyEncrypted) : undefined,
    secretKey: record.secretKeyEncrypted ? decryptField(record.secretKeyEncrypted) : undefined,
    apiKey: record.apiKeyEncrypted ? decryptField(record.apiKeyEncrypted) : undefined,
    ocrEnabled: record.ocrEnabled,
    ocrLanguages: record.ocrLanguages || ['en'],
    maxFileSizeMb: record.maxFileSizeMb,
    supportedFormats: record.supportedFormats || ['pdf', 'docx'],
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: record.lastTestedAt,
    testStatus: record.testStatus?.toLowerCase() || 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapEvidenceVectorConfig(record: any): VectorConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'evidence',
    apiKey: record.apiKeyEncrypted ? decryptField(record.apiKeyEncrypted) : undefined,
    host: record.host,
    environment: record.environment,
    indexName: record.indexName,
    namespace: record.namespace,
    dimensions: record.dimensions,
    metric: record.metric.toLowerCase(),
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: record.lastTestedAt,
    testStatus: record.testStatus?.toLowerCase() || 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// =============================================================================
// Tenant Evidence Config Mappers (for DEDICATED infrastructure mode)
// =============================================================================

function mapTenantEvidenceAIConfig(record: any): AIConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'tenant',
    apiKey: decryptField(record.apiKeyEncrypted),
    organizationId: record.organizationId,
    defaultModel: record.chatModel,
    embeddingModel: record.embeddingModel,
    maxTokensPerRequest: record.maxTokensPerRequest || 4096,
    rateLimitPerMinute: record.rateLimitPerMinute || 60,
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: record.lastTestedAt,
    testStatus: record.testStatus?.toLowerCase() || 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapTenantEvidenceStorageConfig(record: any): StorageConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'tenant',
    bucket: record.bucket,
    region: record.region,
    endpoint: record.endpoint,
    accessKey: record.accessKeyEncrypted ? decryptField(record.accessKeyEncrypted) : undefined,
    secretKey: record.secretKeyEncrypted ? decryptField(record.secretKeyEncrypted) : undefined,
    accountId: record.accountId,
    cdnDomain: record.cdnDomain,
    maxFileSizeMb: record.maxFileSizeMb || 100,
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: record.lastTestedAt,
    testStatus: record.testStatus?.toLowerCase() || 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapTenantEvidenceDocumentConfig(record: any): DocumentConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'tenant',
    publicKey: record.publicKeyEncrypted ? decryptField(record.publicKeyEncrypted) : undefined,
    secretKey: record.secretKeyEncrypted ? decryptField(record.secretKeyEncrypted) : undefined,
    apiKey: record.apiKeyEncrypted ? decryptField(record.apiKeyEncrypted) : undefined,
    ocrEnabled: record.ocrEnabled,
    ocrLanguages: record.ocrLanguages || ['en'],
    maxFileSizeMb: record.maxFileSizeMb || 50,
    supportedFormats: record.supportedFormats || ['pdf', 'docx'],
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: record.lastTestedAt,
    testStatus: record.testStatus?.toLowerCase() || 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapTenantEvidenceVectorConfig(record: any): VectorConfig {
  return {
    id: record.id,
    provider: record.provider.toLowerCase(),
    ownership: 'tenant',
    apiKey: record.apiKeyEncrypted ? decryptField(record.apiKeyEncrypted) : undefined,
    host: record.host,
    environment: record.environment,
    indexName: record.indexName,
    namespace: record.namespace,
    dimensions: record.dimensions,
    metric: record.metric.toLowerCase(),
    isActive: record.isActive,
    isPrimary: record.isPrimary,
    lastTestedAt: record.lastTestedAt,
    testStatus: record.testStatus?.toLowerCase() || 'untested',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// =============================================================================
// Encryption Utilities (placeholder)
// =============================================================================

/**
 * Decrypt an encrypted field
 * TODO: Implement proper envelope encryption with ENCRYPTION_KEY
 */
function decryptField(encryptedValue: string): string {
  // Placeholder: In production, use proper decryption
  // For now, assume values are stored as-is (not recommended for production)
  if (!encryptedValue) return '';

  // Check if value looks encrypted (base64 with prefix)
  if (encryptedValue.startsWith('enc:')) {
    // Would decrypt here
    console.warn('Encrypted field detected but decryption not implemented');
    return '';
  }

  // Return as-is for development
  return encryptedValue;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Get AI provider for a tenant (general use), with platform fallback
 */
export async function getAIProviderForTenant(
  tenantId: string,
  tenantSlug: string
): Promise<ResolvedService<AIConfig> | null> {
  return resolveAIProvider({ tenantId, tenantSlug });
}

/**
 * Get AI provider for Evidence App
 * Uses shared or dedicated infrastructure based on tenant's InfrastructureConfig
 */
export async function getAIProviderForEvidence(
  tenantId: string,
  tenantSlug: string
): Promise<ResolvedService<AIConfig> | null> {
  return resolveAIProvider({ tenantId, tenantSlug, forEvidence: true });
}

/**
 * Get email provider for a tenant, with platform fallback
 */
export async function getEmailProviderForTenant(
  tenantId: string,
  tenantSlug: string
): Promise<ResolvedService<EmailConfig> | null> {
  return resolveEmailProvider({ tenantId, tenantSlug });
}

/**
 * Get storage provider for a tenant (general use), with platform fallback
 */
export async function getStorageProviderForTenant(
  tenantId: string,
  tenantSlug: string
): Promise<ResolvedService<StorageConfig> | null> {
  return resolveStorageProvider({ tenantId, tenantSlug });
}

/**
 * Get storage provider for Evidence App
 * Uses shared or dedicated infrastructure based on tenant's InfrastructureConfig
 */
export async function getStorageProviderForEvidence(
  tenantId: string,
  tenantSlug: string
): Promise<ResolvedService<StorageConfig> | null> {
  return resolveStorageProvider({ tenantId, tenantSlug, forEvidence: true });
}

/**
 * Get document processing provider for Evidence App
 * Uses shared or dedicated infrastructure based on tenant's InfrastructureConfig
 */
export async function getDocumentProviderForEvidence(
  tenantId: string,
  tenantSlug: string
): Promise<ResolvedService<DocumentConfig> | null> {
  return resolveDocumentProvider({ tenantId, tenantSlug });
}

/**
 * Get vector database provider for Evidence App
 * Uses shared or dedicated infrastructure based on tenant's InfrastructureConfig
 */
export async function getVectorProviderForEvidence(
  tenantId: string,
  tenantSlug: string
): Promise<ResolvedService<VectorConfig> | null> {
  return resolveVectorProvider({ tenantId, tenantSlug });
}

/**
 * Get the infrastructure configuration for a tenant
 * Returns the current mode (MULTI_TENANT, HYBRID, DEDICATED) and service-specific modes
 */
export async function getTenantInfrastructureConfig(
  tenantId: string,
  tenantSlug: string
): Promise<InfrastructureConfig | null> {
  return getInfrastructureConfig(tenantId, tenantSlug);
}
