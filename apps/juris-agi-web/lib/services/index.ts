/**
 * Services Layer
 *
 * Multi-level service architecture for Juris AGI:
 *
 * 1. Platform Services (managed in /administration)
 *    - AI providers (OpenAI, Anthropic, etc.)
 *    - Email providers (SMTP, SendGrid, etc.)
 *    - Storage providers (S3, R2, etc.)
 *    - Billing (Stripe)
 *
 * 2. Tenant Services (managed in /company/settings)
 *    - Optional overrides for AI, Email, Storage (general use)
 *    - Falls back to Platform services if not configured
 *
 * 3. Evidence App Services (Infrastructure Evolution)
 *    - MULTI_TENANT (default): Uses Juris AGI's shared infrastructure
 *      - Managed in /administration/evidence
 *      - Tenant data isolated via storage prefixes, vector namespaces
 *    - HYBRID: Mix of shared and dedicated services
 *    - DEDICATED: Tenant's own infrastructure
 *      - Managed in /company/settings/evidence
 *      - Full data isolation on tenant's own services
 *
 * Resolution Order:
 * - General Services: Tenant Override → Platform Default
 * - Evidence Services: Check InfrastructureConfig → Shared or Dedicated
 */

// Types
export type {
  // Infrastructure
  InfrastructureMode,
  ServiceMode,
  InfrastructureConfig,

  // Common
  ServiceOwnership,
  ServiceTestStatus,
  ServiceHealth,
  BaseServiceConfig,
  ServiceResolutionContext,
  ServiceSource,
  ResolvedService,

  // AI
  AIProviderType,
  AIConfig,
  AICompletionRequest,
  AICompletionResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AIProvider,

  // Email
  EmailProviderType,
  EmailConfig,
  EmailMessage,
  EmailAttachment,
  EmailSendResult,
  EmailProvider,

  // Storage
  StorageProviderType,
  StorageConfig,
  StorageUploadOptions,
  StorageUploadResult,
  StorageDownloadResult,
  StorageSignedUrlOptions,
  StorageProvider,

  // Document (Evidence)
  DocumentProviderType,
  DocumentConfig,
  DocumentExtractionRequest,
  DocumentExtractionResult,
  DocumentProvider,

  // Vector (Evidence)
  VectorProviderType,
  VectorConfig,
  VectorUpsertRequest,
  VectorQueryRequest,
  VectorQueryResult,
  VectorProvider,
} from './types';

// Resolver functions
export {
  // Generic resolvers
  resolveAIProvider,
  resolveEmailProvider,
  resolveStorageProvider,
  resolveDocumentProvider,
  resolveVectorProvider,

  // General service convenience functions
  getAIProviderForTenant,
  getEmailProviderForTenant,
  getStorageProviderForTenant,

  // Evidence service convenience functions (require tenant context)
  getAIProviderForEvidence,
  getStorageProviderForEvidence,
  getDocumentProviderForEvidence,
  getVectorProviderForEvidence,

  // Infrastructure management
  getTenantInfrastructureConfig,
} from './resolver';
