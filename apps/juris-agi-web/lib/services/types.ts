/**
 * Service Layer Types
 *
 * Type definitions for the multi-level service architecture:
 * - Platform: Juris AGI's own services (AI, Email, Storage)
 * - Tenant: Company overrides for general services (optional)
 * - Evidence: Evidence App services with infrastructure evolution:
 *   - MULTI_TENANT: Uses Juris AGI's shared infrastructure (default)
 *   - HYBRID: Mix of shared and tenant-dedicated services
 *   - DEDICATED: All tenant-owned infrastructure
 */

// =============================================================================
// Infrastructure & Service Mode Types
// =============================================================================

/**
 * Infrastructure evolution mode for a tenant
 * - MULTI_TENANT: Default - uses Juris AGI's shared infrastructure
 * - HYBRID: Transitional - some services dedicated, some shared
 * - DEDICATED: Enterprise - all tenant-owned infrastructure
 */
export type InfrastructureMode = 'MULTI_TENANT' | 'HYBRID' | 'DEDICATED';

/**
 * Service-specific mode within a tenant
 * - SHARED: Uses platform's shared infrastructure (multi-tenant isolation)
 * - PLATFORM: Uses platform's default API keys (for general services)
 * - DEDICATED: Uses tenant's own infrastructure/API keys
 */
export type ServiceMode = 'SHARED' | 'PLATFORM' | 'DEDICATED';

/**
 * Tenant infrastructure configuration
 */
export interface InfrastructureConfig {
  id: string;
  mode: InfrastructureMode;
  databaseMode: ServiceMode;
  storageMode: ServiceMode;
  vectorDbMode: ServiceMode;
  aiMode: ServiceMode;
  emailMode: ServiceMode;
  migrationInProgress: boolean;
  migrationStep?: string;
  migratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Common Types
// =============================================================================

export type ServiceOwnership = 'platform' | 'tenant' | 'evidence';

export type ServiceTestStatus = 'success' | 'failed' | 'untested';

export interface ServiceHealth {
  status: ServiceTestStatus;
  lastTestedAt: Date | null;
  errorMessage?: string;
}

export interface BaseServiceConfig {
  id: string;
  isActive: boolean;
  isPrimary: boolean;
  lastTestedAt: Date | null;
  testStatus: ServiceTestStatus;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// AI Provider Types
// =============================================================================

export type AIProviderType = 'openai' | 'anthropic' | 'azure_openai' | 'google_vertex' | 'cohere' | 'voyage';

export interface AIConfig extends BaseServiceConfig {
  provider: AIProviderType;
  ownership: ServiceOwnership;
  apiKey: string; // Decrypted for use
  organizationId?: string;
  defaultModel?: string;
  embeddingModel?: string;
  maxTokensPerRequest: number;
  rateLimitPerMinute: number;
}

export interface AICompletionRequest {
  model?: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface AIEmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface AIEmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
  tokensUsed: number;
}

export interface AIProvider {
  readonly provider: AIProviderType;
  readonly ownership: ServiceOwnership;

  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse>;
  testConnection(): Promise<ServiceHealth>;
}

// =============================================================================
// Email Provider Types
// =============================================================================

export type EmailProviderType = 'smtp' | 'sendgrid' | 'ses' | 'mailgun' | 'postmark';

export interface EmailConfig extends BaseServiceConfig {
  provider: EmailProviderType;
  ownership: ServiceOwnership;
  // SMTP
  host?: string;
  port?: number;
  username?: string;
  password?: string; // Decrypted
  secure?: boolean;
  // API-based
  apiKey?: string; // Decrypted
  domain?: string;
  // From settings
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  readonly provider: EmailProviderType;
  readonly ownership: ServiceOwnership;

  send(message: EmailMessage): Promise<EmailSendResult>;
  sendBatch(messages: EmailMessage[]): Promise<EmailSendResult[]>;
  testConnection(): Promise<ServiceHealth>;
}

// =============================================================================
// Storage Provider Types
// =============================================================================

export type StorageProviderType = 'aws_s3' | 'cloudflare_r2' | 'gcs' | 'azure_blob' | 'minio';

export interface StorageConfig extends BaseServiceConfig {
  provider: StorageProviderType;
  ownership: ServiceOwnership;
  bucket: string;
  region: string;
  endpoint?: string;
  accessKey?: string; // Decrypted
  secretKey?: string; // Decrypted
  accountId?: string; // For Cloudflare
  cdnDomain?: string;
  maxFileSizeMb: number;
}

export interface StorageUploadOptions {
  key: string;
  body: Buffer | ReadableStream;
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
}

export interface StorageUploadResult {
  success: boolean;
  key: string;
  url?: string;
  etag?: string;
  error?: string;
}

export interface StorageDownloadResult {
  success: boolean;
  body?: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
  error?: string;
}

export interface StorageSignedUrlOptions {
  key: string;
  expiresIn?: number; // seconds
  operation: 'get' | 'put';
}

export interface StorageProvider {
  readonly provider: StorageProviderType;
  readonly ownership: ServiceOwnership;

  upload(options: StorageUploadOptions): Promise<StorageUploadResult>;
  download(key: string): Promise<StorageDownloadResult>;
  delete(key: string): Promise<{ success: boolean; error?: string }>;
  getSignedUrl(options: StorageSignedUrlOptions): Promise<string>;
  listObjects(prefix: string): Promise<{ keys: string[]; error?: string }>;
  testConnection(): Promise<ServiceHealth>;
}

// =============================================================================
// Document Processing Types (Evidence App only)
// =============================================================================

export type DocumentProviderType = 'ilovepdf' | 'adobe_pdf' | 'docparser' | 'internal';

export interface DocumentConfig extends BaseServiceConfig {
  provider: DocumentProviderType;
  ownership: 'evidence';
  publicKey?: string; // Decrypted
  secretKey?: string; // Decrypted
  apiKey?: string; // Decrypted
  ocrEnabled: boolean;
  ocrLanguages: string[];
  maxFileSizeMb: number;
  supportedFormats: string[];
}

export interface DocumentExtractionRequest {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  options?: {
    extractImages?: boolean;
    extractTables?: boolean;
    ocrEnabled?: boolean;
    language?: string;
  };
}

export interface DocumentExtractionResult {
  success: boolean;
  text?: string;
  pages?: Array<{
    pageNumber: number;
    text: string;
    images?: Array<{ url: string; alt?: string }>;
    tables?: Array<string[][]>;
  }>;
  metadata?: {
    pageCount: number;
    author?: string;
    title?: string;
    createdAt?: Date;
  };
  error?: string;
}

export interface DocumentProvider {
  readonly provider: DocumentProviderType;
  readonly ownership: 'evidence';

  extract(request: DocumentExtractionRequest): Promise<DocumentExtractionResult>;
  convertToPdf(fileBuffer: Buffer, mimeType: string): Promise<Buffer>;
  testConnection(): Promise<ServiceHealth>;
}

// =============================================================================
// Vector Database Types (Evidence App only)
// =============================================================================

export type VectorProviderType = 'pinecone' | 'weaviate' | 'qdrant' | 'pgvector' | 'chroma';

export interface VectorConfig extends BaseServiceConfig {
  provider: VectorProviderType;
  ownership: 'evidence';
  apiKey?: string; // Decrypted
  host?: string;
  environment?: string;
  indexName: string;
  namespace?: string;
  dimensions: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
}

export interface VectorUpsertRequest {
  vectors: Array<{
    id: string;
    values: number[];
    metadata?: Record<string, unknown>;
  }>;
  namespace?: string;
}

export interface VectorQueryRequest {
  vector: number[];
  topK: number;
  namespace?: string;
  filter?: Record<string, unknown>;
  includeMetadata?: boolean;
}

export interface VectorQueryResult {
  matches: Array<{
    id: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
}

export interface VectorProvider {
  readonly provider: VectorProviderType;
  readonly ownership: 'evidence';

  upsert(request: VectorUpsertRequest): Promise<{ success: boolean; upsertedCount: number; error?: string }>;
  query(request: VectorQueryRequest): Promise<VectorQueryResult>;
  delete(ids: string[], namespace?: string): Promise<{ success: boolean; error?: string }>;
  testConnection(): Promise<ServiceHealth>;
}

// =============================================================================
// Service Resolution Types
// =============================================================================

export interface ServiceResolutionContext {
  tenantId?: string;
  tenantSlug?: string;
  /**
   * When true, resolves Evidence App services based on tenant's infrastructure mode:
   * - MULTI_TENANT/HYBRID with SHARED: Uses platform's shared Evidence configs
   * - DEDICATED or HYBRID with DEDICATED for specific service: Uses tenant's Evidence configs
   */
  forEvidence?: boolean;
}

/**
 * Source of the resolved service configuration
 * - tenant_override: Tenant's own API keys/config for general services
 * - platform_default: Juris AGI's default platform services
 * - shared_infrastructure: Platform's shared multi-tenant Evidence infrastructure
 * - tenant_evidence: Tenant's dedicated Evidence infrastructure
 */
export type ServiceSource =
  | 'tenant_override'
  | 'platform_default'
  | 'shared_infrastructure'
  | 'tenant_evidence';

export interface ResolvedService<T> {
  config: T;
  ownership: ServiceOwnership;
  source: ServiceSource;
  /** For Evidence services, indicates the isolation context */
  tenantIsolation?: {
    tenantId: string;
    storagePrefix?: string;
    vectorNamespace?: string;
  };
}
