/**
 * JURIS Domain Types
 * Based on UI_REBUILD_SPEC.md - Part 3: UI Object Model
 */

// =============================================================================
// Enums & Constants
// =============================================================================

export type IndustryProfile = 'vc' | 'insurance' | 'pharma';

export type MandateStatus = 'draft' | 'active' | 'archived';

export type VersionStatus = 'draft' | 'proposed' | 'approved' | 'active' | 'superseded';

export type CaseType = 'deal' | 'underwriting' | 'asset_gating';

export type CaseStatus =
  | 'intake'
  | 'evidence'
  | 'evaluation'
  | 'exceptions'
  | 'decision'
  | 'integrated'
  | 'reported'
  | 'monitoring';

export type ClaimStatus = 'proposed' | 'approved' | 'rejected';

export type ClaimPolarity = 'supportive' | 'risk' | 'neutral';

export type ExceptionStatus = 'pending' | 'resolved' | 'justified';

export type DecisionType = 'approve' | 'reject' | 'conditional' | 'defer';

export type DecisionClassification = 'standard' | 'exception' | 'provisional_precedent';

export type PrecedentWeight = 'binding' | 'persuasive' | 'informational';

export type PortfolioType = 'fund' | 'book' | 'pipeline';

export type ReportType = 'ic_memo' | 'risk_report' | 'lp_pack' | 'regulator_pack';

export type ReportStatus = 'draft' | 'pending_certification' | 'certified';

export type RevisionStatus = 'proposed' | 'under_review' | 'approved' | 'rejected';

// =============================================================================
// Workflow Types
// =============================================================================

export type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type StepStatus = 'completed' | 'current' | 'pending' | 'locked';

export interface WorkflowStepInfo {
  step: WorkflowStep;
  name: string;
  shortName: string;
  status: StepStatus;
  completedAt?: Date;
  lockedVersion?: string;
  unmetConditions?: string[];
}

export const WORKFLOW_STEPS: Record<WorkflowStep, { name: string; shortName: string }> = {
  1: { name: 'Mandate Constitution', shortName: 'Constitution' },
  2: { name: 'Evidence Schema', shortName: 'Schema' },
  3: { name: 'Case Intake', shortName: 'Intake' },
  4: { name: 'Evidence Ingestion', shortName: 'Evidence' },
  5: { name: 'Policy Evaluation', shortName: 'Evaluation' },
  6: { name: 'Exception Analysis', shortName: 'Exceptions' },
  7: { name: 'Decision & Precedent', shortName: 'Decision' },
  8: { name: 'Portfolio Integration', shortName: 'Portfolio' },
  9: { name: 'Reporting', shortName: 'Reports' },
  10: { name: 'Monitoring & Drift', shortName: 'Monitoring' },
};

// =============================================================================
// Mandate & Constitution
// =============================================================================

export interface Mandate {
  id: string;
  name: string;
  industryProfile: IndustryProfile;
  status: MandateStatus;
  activeBaselineVersion: string | null;
  activeSchemaVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskAppetiteConfig {
  maxSinglePosition: number;
  maxSectorConcentration: number;
  minRevenueThreshold: number;
  [key: string]: number | string;
}

export interface GovernanceThreshold {
  condition: string;
  requirement: string;
}

export interface ReportingObligation {
  type: string;
  frequency: string;
  deadline: string;
}

export interface MandateConstitution {
  id: string;
  mandateId: string;
  version: string;
  status: VersionStatus;
  thesis: string;
  exclusions: string[];
  riskAppetite: RiskAppetiteConfig;
  governanceThresholds: GovernanceThreshold[];
  reportingObligations: ReportingObligation[];
  createdBy: string;
  approvedBy: string | null;
  createdAt: Date;
  activatedAt: Date | null;
}

// =============================================================================
// Evidence Schema
// =============================================================================

export interface EvidenceTypeConfig {
  type: string;
  weight: number;
  decayRule: string;
  required: boolean;
}

export interface ConfidenceWeightConfig {
  high: { min: number; max: number };
  medium: { min: number; max: number };
  low: { min: number; max: number };
}

export interface DecayRule {
  type: string;
  rate: number;
  period: string;
}

export interface CoverageItem {
  item: string;
  required: boolean;
}

export interface EvidenceAdmissibilitySchema {
  id: string;
  mandateId: string;
  version: string;
  status: VersionStatus;
  admissibleTypes: EvidenceTypeConfig[];
  confidenceWeights: ConfidenceWeightConfig;
  decayRules: DecayRule[];
  forbiddenClasses: string[];
  coverageChecklist: CoverageItem[];
  createdAt: Date;
}

// =============================================================================
// Case & Decision Envelope
// =============================================================================

export interface DecisionEnvelope {
  caseId: string;
  baselineVersionId: string;
  schemaVersionId: string;
  lockedAt: Date;
  isLocked: boolean;
}

export interface Case {
  id: string;
  mandateId: string;
  type: CaseType;
  name: string;
  status: CaseStatus;
  decisionEnvelope: DecisionEnvelope;
  currentStep: WorkflowStep;
  createdAt: Date;
}

// =============================================================================
// Evidence & Claims
// =============================================================================

export interface DocumentMetadata {
  pageCount?: number;
  fileSize?: number;
  extractedAt?: Date;
  [key: string]: unknown;
}

export interface Document {
  id: string;
  caseId: string;
  filename: string;
  type: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  metadata: DocumentMetadata;
  uploadedAt: Date;
}

export interface ClaimProvenance {
  documentId: string;
  page?: number;
  section?: string;
  quote?: string;
}

export interface Claim {
  id: string;
  caseId: string;
  documentId: string;
  claimType: string;
  field: string;
  value: unknown;
  unit: string | null;
  confidence: number;
  polarity: ClaimPolarity;
  status: ClaimStatus;
  approvedBy: string | null;
  notes: string | null;
  uncertaintyFlags: string[];
  provenance: ClaimProvenance;
  createdAt: Date;
}

export interface ClaimRelationship {
  sourceClaimId: string;
  targetClaimId: string;
  relationshipType: string;
}

export interface StructuredEvidenceGraph {
  caseId: string;
  claims: Claim[];
  relationships: ClaimRelationship[];
  generatedAt: Date;
}

// =============================================================================
// Evaluation Outputs
// =============================================================================

export interface ComplianceItem {
  ruleId: string;
  ruleName: string;
  evidenceId: string;
  evidenceValue: string;
  confidence: number;
}

export interface ViolationItem {
  ruleId: string;
  ruleName: string;
  evidenceId: string;
  evidenceValue: string;
  gap: string;
}

export interface UnderspecifiedItem {
  area: string;
  missingEvidence: string;
}

export interface FitMisfitMap {
  id: string;
  caseId: string;
  baselineVersionId: string;
  compliance: ComplianceItem[];
  violations: ViolationItem[];
  underspecified: UnderspecifiedItem[];
  generatedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
}

export interface Exception {
  id: string;
  ruleId: string;
  ruleName: string;
  status: ExceptionStatus;
  justification: string | null;
  justifiedBy: string | null;
  scope: string | null;
  conditions: string | null;
  signedOffAt: Date | null;
}

export interface ExceptionRegister {
  id: string;
  caseId: string;
  exceptions: Exception[];
  createdAt: Date;
}

// =============================================================================
// Decision & Precedent
// =============================================================================

export interface AuditTrailEntry {
  timestamp: Date;
  action: string;
  actor: string;
  details: string;
}

export interface DecisionRecord {
  id: string;
  caseId: string;
  decision: DecisionType;
  classification: DecisionClassification;
  rationale: string;
  decidedBy: string[];
  decidedAt: Date;
  auditTrail: AuditTrailEntry[];
}

export interface CaseLawEntry {
  id: string;
  decisionRecordId: string;
  precedentLabel: string;
  weight: PrecedentWeight;
  applicableConditions: string[];
  createdAt: Date;
}

// =============================================================================
// Portfolio
// =============================================================================

export interface PortfolioState {
  totalDeployed: number;
  largestPosition: number;
  sectorConcentrations: Record<string, number>;
  avgCheckSize: number;
}

export interface DiagnosticResult {
  metric: string;
  value: number;
  threshold: number;
  status: 'ok' | 'warning' | 'breach';
}

export interface PortfolioBreach {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  requiredAction: string;
}

export interface Portfolio {
  id: string;
  mandateId: string;
  name: string;
  type: PortfolioType;
  cases: string[];
  currentState: PortfolioState;
}

export interface PortfolioStateDelta {
  id: string;
  portfolioId: string;
  caseId: string;
  previousState: PortfolioState;
  newState: PortfolioState;
  concentrationDiagnostics: DiagnosticResult[];
  coherenceDiagnostics: DiagnosticResult[];
  breaches: PortfolioBreach[];
  computedAt: Date;
}

// =============================================================================
// Reporting
// =============================================================================

export interface TraceLink {
  statementId: string;
  evidenceId: string;
  ruleId: string;
  decisionId: string;
}

export interface SignOffArtifact {
  role: string;
  signedBy: string;
  signedAt: Date;
}

export interface ReportContent {
  sections: {
    id: string;
    title: string;
    content: string;
  }[];
}

export interface CertifiedReport {
  id: string;
  caseId: string;
  type: ReportType;
  status: ReportStatus;
  content: ReportContent;
  traceLinks: TraceLink[];
  signOffArtifacts: SignOffArtifact[];
  certifiedBy: string | null;
  certifiedAt: Date | null;
}

// =============================================================================
// Monitoring
// =============================================================================

export interface DriftItem {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
}

export interface RuleErosion {
  ruleId: string;
  ruleName: string;
  originalEnforcement: string;
  currentPattern: string;
  exceptionCount: number;
}

export interface PolicyShift {
  area: string;
  baselineSays: string;
  actualPractice: string;
  divergenceCount: number;
}

export interface DriftReport {
  id: string;
  mandateId: string;
  detectedDrifts: DriftItem[];
  ruleErosions: RuleErosion[];
  silentPolicyShifts: PolicyShift[];
  generatedAt: Date;
}

export interface BaselineChange {
  section: string;
  oldValue: string;
  newValue: string;
}

export interface BaselineRevisionProposal {
  id: string;
  mandateId: string;
  currentBaselineVersion: string;
  proposedChanges: BaselineChange[];
  status: RevisionStatus;
  proposedBy: string;
  proposedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
}

// =============================================================================
// Reasoning & Trace
// =============================================================================

export interface TraceEntry {
  timestamp: Date;
  step: string;
  input: unknown;
  output: unknown;
  duration: number;
}

export interface ReasoningRun {
  id: string;
  caseId: string;
  step: number;
  input: unknown;
  output: unknown;
  trace: TraceEntry[];
  startedAt: Date;
  completedAt: Date;
}

// =============================================================================
// Context Types (for UI state)
// =============================================================================

export interface ActiveContext {
  mandate: Mandate | null;
  baselineVersion: string | null;
  schemaVersion: string | null;
  case: Case | null;
}

// =============================================================================
// Navigation Level Types
// =============================================================================

export type NavigationLevel = 'company' | 'portfolio' | 'mandate' | 'case';

// =============================================================================
// Company & User Types
// =============================================================================

export type CompanyUserRole = 'owner' | 'admin' | 'member';

export type PortfolioAccessLevel = 'maker' | 'checker';

export interface PortfolioAccess {
  portfolioId: string;
  portfolioName: string;
  accessLevel: PortfolioAccessLevel;
  grantedAt: Date;
  grantedBy: string;
}

export interface CompanyUser {
  id: string;
  email: string;
  name: string;
  companyId: string;
  role: CompanyUserRole;
  portfolioAccess: PortfolioAccess[];
  inviteStatus: 'pending' | 'accepted' | 'expired';
  invitedAt: Date;
  invitedBy: string | null;
  acceptedAt: Date | null;
  lastActiveAt: Date | null;
  createdAt: Date;
}

export interface CompanyInvite {
  id: string;
  companyId: string;
  email: string;
  role: CompanyUserRole;
  portfolioAccess: { portfolioId: string; accessLevel: PortfolioAccessLevel }[];
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
  token: string;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  industryProfile: IndustryProfile;
  settings: CompanySettings;
  setupComplete: boolean;
  createdAt: Date;
  createdBy: string;
}

// =============================================================================
// Third-Party Integration Types
// =============================================================================

/**
 * Service ownership levels:
 * - platform: Juris AGI's own keys, managed in /administration
 * - tenant: Company overrides, managed in /company/settings
 * - evidence: Evidence App services, managed in /administration/evidence
 */
export type ServiceOwnership = 'platform' | 'tenant' | 'evidence';

/**
 * Service categories
 */
export type ServiceCategory = 'ai' | 'email' | 'storage' | 'document' | 'vector' | 'database' | 'billing';

// -----------------------------------------------------------------------------
// AI Provider Types
// -----------------------------------------------------------------------------

export type PlatformAIProvider = 'openai' | 'anthropic' | 'azure_openai' | 'google_vertex';

export type EvidenceAIProvider = 'openai' | 'anthropic' | 'cohere' | 'voyage';

export type TenantAIProvider = 'openai' | 'anthropic' | 'azure_openai';

export interface AIProviderConfig {
  id: string;
  provider: PlatformAIProvider | EvidenceAIProvider | TenantAIProvider;
  ownership: ServiceOwnership;
  apiKeyMasked: string; // Only show last 4 chars
  organizationId?: string;
  defaultModel?: string;
  embeddingModel?: string; // For Evidence App
  isPrimary: boolean;
  isActive: boolean;
  rateLimitPerMinute?: number;
  maxTokensPerRequest?: number;
  lastTestedAt: Date | null;
  testStatus: 'success' | 'failed' | 'untested';
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Email Provider Types
// -----------------------------------------------------------------------------

export type EmailProvider = 'smtp' | 'sendgrid' | 'ses' | 'mailgun' | 'postmark';

export interface EmailProviderConfig {
  id: string;
  provider: EmailProvider;
  ownership: ServiceOwnership;
  // SMTP config
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  // API-based config
  apiKeyMasked?: string;
  domain?: string;
  // From settings
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  isPrimary: boolean;
  isActive: boolean;
  lastTestedAt: Date | null;
  testStatus: 'success' | 'failed' | 'untested';
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Storage Provider Types
// -----------------------------------------------------------------------------

export type StorageProvider = 'aws_s3' | 'cloudflare_r2' | 'gcs' | 'azure_blob' | 'minio';

export interface StorageProviderConfig {
  id: string;
  provider: StorageProvider;
  ownership: ServiceOwnership;
  bucket: string;
  region: string;
  endpoint?: string; // For S3-compatible providers
  cdnDomain?: string; // For Evidence App
  accessKeyMasked: string;
  maxFileSizeMb: number;
  quotaGb?: number;
  isPrimary: boolean;
  isActive: boolean;
  lastTestedAt: Date | null;
  testStatus: 'success' | 'failed' | 'untested';
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Document Processing Provider Types (Evidence App only)
// -----------------------------------------------------------------------------

export type DocumentProvider = 'ilovepdf' | 'adobe_pdf' | 'docparser' | 'internal';

export interface DocumentProviderConfig {
  id: string;
  provider: DocumentProvider;
  ownership: 'evidence'; // Always Evidence App
  apiKeyMasked?: string;
  ocrEnabled: boolean;
  maxFileSizeMb: number;
  supportedFormats: string[];
  isPrimary: boolean;
  isActive: boolean;
  lastTestedAt: Date | null;
  testStatus: 'success' | 'failed' | 'untested';
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Vector Database Provider Types (Evidence App only)
// -----------------------------------------------------------------------------

export type VectorProvider = 'pinecone' | 'weaviate' | 'qdrant' | 'pgvector' | 'chroma';

export interface VectorProviderConfig {
  id: string;
  provider: VectorProvider;
  ownership: 'evidence'; // Always Evidence App
  apiKeyMasked?: string;
  environment?: string;
  indexName: string;
  dimensions: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  isPrimary: boolean;
  isActive: boolean;
  lastTestedAt: Date | null;
  testStatus: 'success' | 'failed' | 'untested';
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Database Provider Types (Evidence App only)
// -----------------------------------------------------------------------------

export type DatabaseProvider = 'postgresql' | 'neon' | 'supabase' | 'aws_rds' | 'cloud_sql';

export interface DatabaseProviderConfig {
  id: string;
  provider: DatabaseProvider;
  ownership: 'evidence'; // Always Evidence App
  host: string;
  port: number;
  databaseName: string;
  sslMode: 'disable' | 'require' | 'verify-ca' | 'verify-full';
  poolSize: number;
  isPrimary: boolean;
  isActive: boolean;
  lastHealthCheck: Date | null;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Unified Service Config (for UI display)
// -----------------------------------------------------------------------------

export interface ServiceConfig {
  id: string;
  category: ServiceCategory;
  ownership: ServiceOwnership;
  provider: string;
  displayName: string;
  description: string;
  isConnected: boolean;
  isPrimary: boolean;
  lastTestedAt: Date | null;
  testStatus: 'success' | 'failed' | 'untested';
  managedFrom: 'administration' | 'administration/evidence' | 'company/settings';
}

// -----------------------------------------------------------------------------
// Provider Metadata Registry
// -----------------------------------------------------------------------------

export const AI_PROVIDERS: Record<PlatformAIProvider | EvidenceAIProvider, {
  displayName: string;
  description: string;
  supportsPlatform: boolean;
  supportsEvidence: boolean;
  supportsTenant: boolean;
  requiredFields: string[];
}> = {
  openai: {
    displayName: 'OpenAI',
    description: 'GPT-4 and GPT-3.5 models for AI-powered analysis',
    supportsPlatform: true,
    supportsEvidence: true,
    supportsTenant: true,
    requiredFields: ['apiKey'],
  },
  anthropic: {
    displayName: 'Anthropic',
    description: 'Claude models for AI-powered analysis',
    supportsPlatform: true,
    supportsEvidence: true,
    supportsTenant: true,
    requiredFields: ['apiKey'],
  },
  azure_openai: {
    displayName: 'Azure OpenAI',
    description: 'OpenAI models hosted on Azure',
    supportsPlatform: true,
    supportsEvidence: false,
    supportsTenant: true,
    requiredFields: ['apiKey', 'endpoint', 'deploymentName'],
  },
  google_vertex: {
    displayName: 'Google Vertex AI',
    description: 'Gemini and PaLM models on Google Cloud',
    supportsPlatform: true,
    supportsEvidence: false,
    supportsTenant: false,
    requiredFields: ['projectId', 'location', 'serviceAccountKey'],
  },
  cohere: {
    displayName: 'Cohere',
    description: 'Specialized embedding and reranking models',
    supportsPlatform: false,
    supportsEvidence: true,
    supportsTenant: false,
    requiredFields: ['apiKey'],
  },
  voyage: {
    displayName: 'Voyage AI',
    description: 'Legal-specialized embedding models',
    supportsPlatform: false,
    supportsEvidence: true,
    supportsTenant: false,
    requiredFields: ['apiKey'],
  },
};

export const EMAIL_PROVIDERS: Record<EmailProvider, {
  displayName: string;
  description: string;
  supportsPlatform: boolean;
  supportsTenant: boolean;
  requiredFields: string[];
}> = {
  smtp: {
    displayName: 'SMTP',
    description: 'Generic SMTP server (Gmail, custom)',
    supportsPlatform: true,
    supportsTenant: true,
    requiredFields: ['host', 'port', 'username', 'password'],
  },
  sendgrid: {
    displayName: 'SendGrid',
    description: 'Twilio SendGrid email service',
    supportsPlatform: true,
    supportsTenant: true,
    requiredFields: ['apiKey'],
  },
  ses: {
    displayName: 'AWS SES',
    description: 'Amazon Simple Email Service',
    supportsPlatform: true,
    supportsTenant: true,
    requiredFields: ['accessKeyId', 'secretAccessKey', 'region'],
  },
  mailgun: {
    displayName: 'Mailgun',
    description: 'Mailgun email service',
    supportsPlatform: true,
    supportsTenant: true,
    requiredFields: ['apiKey', 'domain'],
  },
  postmark: {
    displayName: 'Postmark',
    description: 'Postmark transactional email',
    supportsPlatform: true,
    supportsTenant: true,
    requiredFields: ['serverToken'],
  },
};

export const STORAGE_PROVIDERS: Record<StorageProvider, {
  displayName: string;
  description: string;
  supportsPlatform: boolean;
  supportsEvidence: boolean;
  supportsTenant: boolean;
  requiredFields: string[];
}> = {
  aws_s3: {
    displayName: 'AWS S3',
    description: 'Amazon S3 cloud storage',
    supportsPlatform: true,
    supportsEvidence: true,
    supportsTenant: true,
    requiredFields: ['accessKeyId', 'secretAccessKey', 'bucket', 'region'],
  },
  cloudflare_r2: {
    displayName: 'Cloudflare R2',
    description: 'Cloudflare R2 with global CDN',
    supportsPlatform: true,
    supportsEvidence: true,
    supportsTenant: false,
    requiredFields: ['accessKeyId', 'secretAccessKey', 'bucket', 'accountId'],
  },
  gcs: {
    displayName: 'Google Cloud Storage',
    description: 'Google Cloud Storage buckets',
    supportsPlatform: true,
    supportsEvidence: true,
    supportsTenant: true,
    requiredFields: ['projectId', 'bucket', 'serviceAccountKey'],
  },
  azure_blob: {
    displayName: 'Azure Blob Storage',
    description: 'Microsoft Azure Blob containers',
    supportsPlatform: true,
    supportsEvidence: true,
    supportsTenant: true,
    requiredFields: ['accountName', 'accountKey', 'containerName'],
  },
  minio: {
    displayName: 'MinIO',
    description: 'Self-hosted S3-compatible storage',
    supportsPlatform: true,
    supportsEvidence: true,
    supportsTenant: true,
    requiredFields: ['endpoint', 'accessKeyId', 'secretAccessKey', 'bucket'],
  },
};

export const DOCUMENT_PROVIDERS: Record<DocumentProvider, {
  displayName: string;
  description: string;
  requiredFields: string[];
}> = {
  ilovepdf: {
    displayName: 'iLovePDF',
    description: 'PDF processing and extraction API',
    requiredFields: ['publicKey', 'secretKey'],
  },
  adobe_pdf: {
    displayName: 'Adobe PDF Services',
    description: 'Adobe PDF extraction and OCR',
    requiredFields: ['clientId', 'clientSecret'],
  },
  docparser: {
    displayName: 'Docparser',
    description: 'Document parsing and data extraction',
    requiredFields: ['apiKey'],
  },
  internal: {
    displayName: 'Internal (Tesseract)',
    description: 'Self-hosted OCR with Tesseract',
    requiredFields: [],
  },
};

export const VECTOR_PROVIDERS: Record<VectorProvider, {
  displayName: string;
  description: string;
  requiredFields: string[];
}> = {
  pinecone: {
    displayName: 'Pinecone',
    description: 'Managed vector database with fast queries',
    requiredFields: ['apiKey', 'environment', 'indexName'],
  },
  weaviate: {
    displayName: 'Weaviate',
    description: 'Open-source vector search engine',
    requiredFields: ['host', 'apiKey'],
  },
  qdrant: {
    displayName: 'Qdrant',
    description: 'High-performance vector similarity search',
    requiredFields: ['host', 'apiKey'],
  },
  pgvector: {
    displayName: 'pgvector',
    description: 'PostgreSQL extension for vectors',
    requiredFields: [], // Uses Evidence DB connection
  },
  chroma: {
    displayName: 'Chroma',
    description: 'Open-source embedding database',
    requiredFields: ['host'],
  },
};

// -----------------------------------------------------------------------------
// Legacy Integration Types (for backwards compatibility)
// -----------------------------------------------------------------------------

export type IntegrationProvider =
  | 'openai'
  | 'anthropic'
  | 'mailgun'
  | 'sendgrid'
  | 'ilovepdf'
  | 'cloudflare'
  | 'aws_s3'
  | 'google_drive';

export type IntegrationCategory = 'ai' | 'email' | 'document' | 'storage';

export interface IntegrationConfig {
  id: string;
  provider: IntegrationProvider;
  category: IntegrationCategory;
  displayName: string;
  description: string;
  isConnected: boolean;
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
  additionalConfig?: Record<string, string>;
  connectedAt: Date | null;
  connectedBy: string | null;
  lastTestedAt: Date | null;
  testStatus: 'success' | 'failed' | 'untested';
}

/** @deprecated Use AI_PROVIDERS, EMAIL_PROVIDERS, STORAGE_PROVIDERS instead */
export const INTEGRATION_PROVIDERS: Record<IntegrationProvider, {
  displayName: string;
  description: string;
  category: IntegrationCategory;
  source: 'juris_agi' | 'juris_evidence';
  requiredFields: string[];
}> = {
  openai: {
    displayName: 'OpenAI',
    description: 'GPT models for AI-powered analysis',
    category: 'ai',
    source: 'juris_agi',
    requiredFields: ['apiKey'],
  },
  anthropic: {
    displayName: 'Anthropic',
    description: 'Claude models for AI-powered analysis',
    category: 'ai',
    source: 'juris_agi',
    requiredFields: ['apiKey'],
  },
  mailgun: {
    displayName: 'Mailgun',
    description: 'Email service for notifications and invites',
    category: 'email',
    source: 'juris_agi',
    requiredFields: ['apiKey', 'domain'],
  },
  sendgrid: {
    displayName: 'SendGrid',
    description: 'Email service for notifications and invites',
    category: 'email',
    source: 'juris_agi',
    requiredFields: ['apiKey'],
  },
  ilovepdf: {
    displayName: 'iLovePDF',
    description: 'PDF processing and extraction',
    category: 'document',
    source: 'juris_evidence',
    requiredFields: ['apiKey'],
  },
  cloudflare: {
    displayName: 'Cloudflare',
    description: 'CDN and security services',
    category: 'storage',
    source: 'juris_evidence',
    requiredFields: ['apiKey', 'accountId'],
  },
  aws_s3: {
    displayName: 'AWS S3',
    description: 'Cloud storage for documents',
    category: 'storage',
    source: 'juris_evidence',
    requiredFields: ['accessKeyId', 'secretAccessKey', 'bucket', 'region'],
  },
  google_drive: {
    displayName: 'Google Drive',
    description: 'Cloud storage integration',
    category: 'storage',
    source: 'juris_evidence',
    requiredFields: ['clientId', 'clientSecret'],
  },
};

// Legacy type for backwards compatibility
export type UserRole = 'admin' | 'partner' | 'risk_officer' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mandateAccess: string[];
}

// =============================================================================
// Organization & Workspace (backend_pending)
// =============================================================================

/**
 * Organization represents a tenant in the system
 * @backend_pending - Full multi-tenancy not yet implemented
 */
export interface Organization {
  id: string;
  name: string;
  industryProfile: IndustryProfile;
  settings: OrganizationSettings;
  createdAt: Date;
}

export interface OrganizationSettings {
  defaultContextSize: 'small' | 'medium' | 'large' | 'enterprise';
  defaultClaimDensity: 'low' | 'medium' | 'high';
  defaultPrecisionRecall: 'precision' | 'balanced' | 'recall';
  dslStrictness: 'strict' | 'moderate' | 'lenient';
  requireApprovalForActivation: boolean;
  auditRetentionDays: number;
}

/**
 * Workspace represents a Fund (VC), Division (Pharma), or Line of Business (Insurance)
 * @backend_pending - Workspace isolation not yet implemented
 */
export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: WorkspaceType;
  members: WorkspaceMember[];
  createdAt: Date;
}

export type WorkspaceType = 'fund' | 'division' | 'line_of_business';

export interface WorkspaceMember {
  userId: string;
  role: UserRole;
  addedAt: Date;
}

// =============================================================================
// Benchmarks (backend_pending)
// =============================================================================

/**
 * Benchmark template for evaluation
 * @backend_pending - Benchmark management not yet implemented
 */
export interface BenchmarkTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  industryProfile: IndustryProfile;
  parameters: BenchmarkParameters;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BenchmarkParameters {
  contextSize: number;
  claimDensityTarget: number;
  precisionWeight: number;
  recallWeight: number;
  confidenceThreshold: number;
  requiredCoverage: string[];
  exclusionRules: string[];
}

// =============================================================================
// Enhanced Document (backend_pending enhancements)
// =============================================================================

export type DocumentTrustLevel = 'verified' | 'unverified' | 'disputed';

export interface EnhancedDocument {
  id: string;
  organizationId: string;
  workspaceId: string | null;
  filename: string;
  type: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  trustLevel: DocumentTrustLevel;
  provenance: DocumentProvenance;
  metadata: DocumentMetadata;
  assignedMandates: string[];
  assignedCases: string[];
  tags: string[];
  version: number;
  previousVersionId: string | null;
  uploadedBy: string;
  uploadedAt: Date;
  processedAt: Date | null;
}

export interface DocumentProvenance {
  source: string;
  sourceUrl: string | null;
  retrievedAt: Date | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
}

// =============================================================================
// Enhanced Portfolio (first-class entity)
// =============================================================================

export type PortfolioStatus = 'draft' | 'active' | 'paused' | 'archived';

// Legacy status mapping for backwards compatibility
export type LegacyPortfolioStatus = 'active' | 'closed' | 'frozen';

export interface EnhancedPortfolio {
  id: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  description: string;
  type: PortfolioType;
  status: PortfolioStatus;
  industryLabel: string; // "Fund III" for VC, "Oncology Pipeline" for Pharma, etc.
  constraints: PortfolioConstraints;
  composition: PortfolioComposition;
  metrics: PortfolioMetrics;
  userAccessLevel?: 'ADMIN' | 'MAKER' | 'CHECKER' | 'VIEWER' | null; // User's access level for this portfolio
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioConstraints {
  maxPositions: number;
  maxSinglePositionPct: number;
  maxSectorConcentrationPct: number;
  minDiversification: number;
  customConstraints: { name: string; threshold: number; operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' }[];
}

export interface PortfolioComposition {
  totalValue: number;
  totalCommitted: number;
  positions: PortfolioPosition[];
}

export interface PortfolioPosition {
  caseId: string;
  caseName: string;
  value: number;
  percentage: number;
  sector: string;
  addedAt: Date;
  status: 'active' | 'exited' | 'written_off';
}

export interface PortfolioMetrics {
  utilization: number;
  diversificationScore: number;
  riskScore: number;
  performanceIndex: number;
  lastCalculatedAt: Date;
}

/**
 * CreatePortfolioInput - fields provided by the user when creating a new portfolio
 * Backend will auto-fill: id, company_id, industry, status (DRAFT), created_at, created_by, updated_at, active_baseline_version_id
 */
export interface CreatePortfolioInput {
  name: string;
  code?: string | null;
  description?: string | null;
  baseCurrency: string; // ISO 4217
  timezone: string; // IANA timezone
  jurisdiction?: string | null;
  startDate?: string | null; // ISO date string
  endDate?: string | null; // ISO date string
  tags?: string[] | null;
  // AUM fields (primarily for VC)
  aumCurrent?: number | null; // Current AUM - mandatory for VC
  aumTarget?: number | null; // Target AUM - optional
}

/**
 * Full Portfolio entity as stored in the database
 * Aligns with the Portfolio model specification
 */
export interface PortfolioEntity {
  id: string;
  companyId: string; // tenant
  industry: IndustryProfile; // VC | INSURANCE | PHARMA
  name: string;
  code: string | null;
  description: string | null;
  status: PortfolioStatus; // DRAFT | ACTIVE | PAUSED | ARCHIVED
  baseCurrency: string; // ISO 4217
  timezone: string; // IANA timezone
  jurisdiction: string | null;
  startDate: Date | null;
  endDate: Date | null;
  tags: string[] | null;
  // AUM fields
  aumCurrent: number | null; // Current AUM
  aumTarget: number | null; // Target AUM
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  activeBaselineVersionId: string | null;
}

// =============================================================================
// Evaluation Run (backend_pending enhancements)
// =============================================================================

export type EvaluationRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface EvaluationRun {
  id: string;
  caseId: string;
  benchmarkId: string;
  benchmarkName: string;
  status: EvaluationRunStatus;
  parameters: EvaluationRunParameters;
  inputDocumentIds: string[];
  results: EvaluationRunResults | null;
  delta: EvaluationRunDelta | null;
  startedAt: Date;
  completedAt: Date | null;
  triggeredBy: string;
}

export interface EvaluationRunParameters {
  contextSize: number;
  claimDensity: number;
  precisionWeight: number;
  recallWeight: number;
  confidenceThreshold: number;
}

export interface EvaluationRunResults {
  totalClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  pendingClaims: number;
  complianceScore: number;
  coverageScore: number;
  conflicts: number;
}

export interface EvaluationRunDelta {
  previousRunId: string;
  newClaims: number;
  removedClaims: number;
  changedClaims: number;
  complianceScoreDelta: number;
  coverageScoreDelta: number;
  highlightedChanges: string[];
}

// =============================================================================
// Process Awareness State
// =============================================================================

export interface ProcessState {
  currentView: 'mandates' | 'cases' | 'documents' | 'portfolios' | 'admin';
  selectedOrganization: Organization | null;
  selectedWorkspace: Workspace | null;
  selectedMandate: Mandate | null;
  selectedCase: Case | null;
  selectedDocument: EnhancedDocument | null;
  selectedPortfolio: EnhancedPortfolio | null;
  activeBenchmark: BenchmarkTemplate | null;
  lastEvaluationRun: EvaluationRun | null;
  pendingActions: PendingAction[];
}

export interface PendingAction {
  id: string;
  type: 'approval' | 'review' | 'upload' | 'evaluation';
  title: string;
  description: string;
  targetId: string;
  targetType: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

// =============================================================================
// Industry Configuration
// =============================================================================

export const INDUSTRY_CONFIG: Record<IndustryProfile, IndustryConfiguration> = {
  vc: {
    label: 'Venture Capital',
    workspaceLabel: 'Fund',
    mandateLabel: 'Investment Mandate',
    caseLabel: 'Deal',
    portfolioLabel: 'Fund Portfolio',
    primaryMetrics: ['ARR', 'Growth Rate', 'Burn Rate', 'Runway'],
    decisionTypes: ['Invest', 'Pass', 'Follow-on'],
  },
  pharma: {
    label: 'Pharmaceutical',
    workspaceLabel: 'Division',
    mandateLabel: 'Evaluation Mandate',
    caseLabel: 'Assessment',
    portfolioLabel: 'Pipeline',
    primaryMetrics: ['Phase', 'Probability of Success', 'NPV', 'Peak Sales'],
    decisionTypes: ['Advance', 'Terminate', 'Partner'],
  },
  insurance: {
    label: 'Insurance',
    workspaceLabel: 'Line of Business',
    mandateLabel: 'Underwriting Mandate',
    caseLabel: 'Underwriting',
    portfolioLabel: 'Book of Business',
    primaryMetrics: ['Premium', 'Loss Ratio', 'Combined Ratio', 'Exposure'],
    decisionTypes: ['Bind', 'Decline', 'Refer'],
  },
};

export interface IndustryConfiguration {
  label: string;
  workspaceLabel: string;
  mandateLabel: string;
  caseLabel: string;
  portfolioLabel: string;
  primaryMetrics: string[];
  decisionTypes: string[];
}

// =============================================================================
// Baseline Module Payloads (JSON Schema Types)
// =============================================================================

/**
 * Base interface for all module payloads
 */
export interface BaseModulePayload {
  schemaVersion: string;
  updatedAt: string;  // ISO date string
}

/**
 * Module 1: Mandate
 * Defines the investment/underwriting thesis and strategic focus
 */
export interface MandateModulePayload extends BaseModulePayload {
  thesis: string;                    // Main investment/underwriting thesis
  geographicFocus: string[];         // e.g., ['North America', 'Europe']
  sectorFocus: string[];             // e.g., ['Enterprise SaaS', 'FinTech']
  stageFocus: string[];              // e.g., ['Series A', 'Series B'] or ['New Business', 'Renewal']
  checkSizeRange: {
    min: number;
    max: number;
    currency: string;
  };
  targetMetrics: MandateTargetMetric[];
  additionalCriteria: string[];      // Free-form additional criteria
}

export interface MandateTargetMetric {
  name: string;                      // e.g., 'ARR', 'Revenue', 'Premium'
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';
  value: number;
  maxValue?: number;                 // For 'between' operator
  unit?: string;                     // e.g., 'USD', '%'
}

/**
 * Module 2: Exclusions
 * Hard rules that automatically disqualify candidates
 */
export interface ExclusionsModulePayload extends BaseModulePayload {
  hardExclusions: ExclusionRule[];
  softExclusions: ExclusionRule[];   // Require exception approval
  industryExclusions: string[];      // Banned industries/sectors
  geographyExclusions: string[];     // Banned geographies
  entityExclusions: string[];        // Specific banned entities
  regulatoryExclusions: string[];    // Regulatory-driven exclusions
}

export interface ExclusionRule {
  id: string;
  name: string;
  description: string;
  condition: string;                 // Human-readable condition
  severity: 'hard' | 'soft';
  category: 'industry' | 'geography' | 'regulatory' | 'entity' | 'custom';
  autoReject: boolean;               // Automatically reject if triggered
}

/**
 * Module 3: Risk Appetite
 * Quantitative thresholds for acceptable risk levels
 */
export interface RiskAppetiteModulePayload extends BaseModulePayload {
  concentrationLimits: ConcentrationLimit[];
  exposureLimits: ExposureLimit[];
  qualityThresholds: QualityThreshold[];
  customMetrics: CustomRiskMetric[];
}

export interface ConcentrationLimit {
  id: string;
  name: string;
  dimension: 'sector' | 'geography' | 'vintage' | 'stage' | 'counterparty' | 'custom';
  maxPercentage: number;
  warningThreshold: number;          // Percentage at which to warn
  description?: string;
}

export interface ExposureLimit {
  id: string;
  name: string;
  type: 'single_position' | 'aggregate' | 'cumulative';
  maxAmount: number;
  currency: string;
  asPercentageOfFund?: number;       // Alternative: as % of total fund/book
}

export interface QualityThreshold {
  id: string;
  metric: string;                    // e.g., 'revenue_growth', 'loss_ratio'
  minValue?: number;
  maxValue?: number;
  targetValue?: number;
  unit?: string;
}

export interface CustomRiskMetric {
  id: string;
  name: string;
  formula?: string;                  // Optional DSL formula
  threshold: number;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  description: string;
}

/**
 * Module 4: Governance Thresholds
 * Escalation paths and approval requirements
 */
export interface GovernanceThresholdsModulePayload extends BaseModulePayload {
  approvalLevels: ApprovalLevel[];
  escalationRules: EscalationRule[];
  committeRequirements: CommitteeRequirement[];
  signOffChains: SignOffChain[];
}

export interface ApprovalLevel {
  id: string;
  name: string;                      // e.g., 'Partner Approval', 'IC Approval'
  triggerConditions: TriggerCondition[];
  requiredApprovers: string[];       // Role IDs
  quorum?: number;                   // Minimum approvers needed
  timeoutDays?: number;              // Auto-escalate after N days
}

export interface TriggerCondition {
  field: string;                     // e.g., 'check_size', 'risk_score'
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between' | 'in';
  value: number | string | string[];
  maxValue?: number;                 // For 'between'
}

export interface EscalationRule {
  id: string;
  name: string;
  fromLevel: string;                 // Approval level ID
  toLevel: string;                   // Escalation target
  triggerConditions: TriggerCondition[];
  autoEscalate: boolean;
  notifyRoles: string[];
}

export interface CommitteeRequirement {
  id: string;
  committeeName: string;             // e.g., 'Investment Committee', 'Risk Committee'
  triggerConditions: TriggerCondition[];
  requiredMembers: string[];         // Role IDs
  quorum: number;
  votingRule: 'unanimous' | 'majority' | 'supermajority';
  meetingRequired: boolean;
}

export interface SignOffChain {
  id: string;
  name: string;                      // e.g., 'Standard Deal Flow', 'Large Check Process'
  steps: SignOffStep[];
  parallelSteps?: string[][];        // Groups of step IDs that can run in parallel
}

export interface SignOffStep {
  id: string;
  order: number;
  name: string;
  requiredRole: string;
  optional: boolean;
  timeoutDays?: number;
}

/**
 * Module 5: Reporting Obligations
 * External and internal reporting requirements
 */
export interface ReportingObligationsModulePayload extends BaseModulePayload {
  internalReports: ReportDefinition[];
  externalReports: ReportDefinition[];
  regulatoryFilings: RegulatoryFiling[];
  dataRetentionRules: DataRetentionRule[];
  auditRequirements: AuditRequirement[];
}

export interface ReportDefinition {
  id: string;
  name: string;
  type: 'ic_memo' | 'risk_report' | 'lp_pack' | 'portfolio_summary' | 'custom';
  frequency: 'per_case' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
  recipients: string[];              // Role IDs or external entities
  requiredSections: string[];
  traceabilityRequired: boolean;     // Must link to evidence
  certificationRequired: boolean;    // Needs sign-off
  templateId?: string;               // Reference to report template
}

export interface RegulatoryFiling {
  id: string;
  name: string;
  regulator: string;                 // e.g., 'SEC', 'FCA', 'FDA'
  filingType: string;                // e.g., 'Form ADV', 'Solvency II'
  frequency: 'quarterly' | 'annually' | 'event_driven';
  deadline: string;                  // e.g., '45 days after quarter end'
  dataFields: string[];              // Required data fields
  automatable: boolean;
}

export interface DataRetentionRule {
  id: string;
  dataCategory: string;              // e.g., 'case_documents', 'decisions', 'communications'
  retentionPeriodYears: number;
  archiveAfterYears?: number;
  deleteAfterYears?: number;
  legalBasis: string;                // Regulatory reference
}

export interface AuditRequirement {
  id: string;
  name: string;
  scope: 'case' | 'mandate' | 'company';
  frequency: 'per_case' | 'quarterly' | 'annually';
  auditor: 'internal' | 'external' | 'both';
  trailRequirements: string[];       // What must be logged
}

// =============================================================================
// Company Settings (JSON payload for Company.settings)
// =============================================================================

export interface CompanySettings {
  // Branding
  brandColor?: string;
  logoUrl?: string;

  // Defaults for new mandates
  defaultContextSize: 'small' | 'medium' | 'large' | 'enterprise';
  defaultClaimDensity: 'low' | 'medium' | 'high';
  defaultPrecisionRecall: 'precision' | 'balanced' | 'recall';
  dslStrictness: 'strict' | 'moderate' | 'lenient';

  // Workflow settings
  requireApprovalForActivation: boolean;
  autoCreateDraftBaseline: boolean;

  // Audit settings
  auditRetentionDays: number;

  // Feature flags
  features: {
    caselaw: boolean;
    monitoring: boolean;
    portfolioIntegration: boolean;
    advancedReporting: boolean;
  };
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  defaultContextSize: 'medium',
  defaultClaimDensity: 'medium',
  defaultPrecisionRecall: 'balanced',
  dslStrictness: 'moderate',
  requireApprovalForActivation: true,
  autoCreateDraftBaseline: true,
  auditRetentionDays: 365 * 7,  // 7 years
  features: {
    caselaw: true,
    monitoring: true,
    portfolioIntegration: true,
    advancedReporting: true,
  },
};

// =============================================================================
// Baseline Module Defaults
// =============================================================================

export const DEFAULT_MANDATE_PAYLOAD: MandateModulePayload = {
  schemaVersion: '1.0',
  updatedAt: new Date().toISOString(),
  thesis: '',
  geographicFocus: [],
  sectorFocus: [],
  stageFocus: [],
  checkSizeRange: { min: 0, max: 0, currency: 'USD' },
  targetMetrics: [],
  additionalCriteria: [],
};

export const DEFAULT_EXCLUSIONS_PAYLOAD: ExclusionsModulePayload = {
  schemaVersion: '1.0',
  updatedAt: new Date().toISOString(),
  hardExclusions: [],
  softExclusions: [],
  industryExclusions: [],
  geographyExclusions: [],
  entityExclusions: [],
  regulatoryExclusions: [],
};

export const DEFAULT_RISK_APPETITE_PAYLOAD: RiskAppetiteModulePayload = {
  schemaVersion: '1.0',
  updatedAt: new Date().toISOString(),
  concentrationLimits: [],
  exposureLimits: [],
  qualityThresholds: [],
  customMetrics: [],
};

export const DEFAULT_GOVERNANCE_PAYLOAD: GovernanceThresholdsModulePayload = {
  schemaVersion: '1.0',
  updatedAt: new Date().toISOString(),
  approvalLevels: [],
  escalationRules: [],
  committeRequirements: [],
  signOffChains: [],
};

export const DEFAULT_REPORTING_PAYLOAD: ReportingObligationsModulePayload = {
  schemaVersion: '1.0',
  updatedAt: new Date().toISOString(),
  internalReports: [],
  externalReports: [],
  regulatoryFilings: [],
  dataRetentionRules: [],
  auditRequirements: [],
};

// =============================================================================
// Baseline Status Helpers
// =============================================================================

export type BaselineModuleType =
  | 'mandate'
  | 'exclusions'
  | 'risk_appetite'
  | 'governance_thresholds'
  | 'reporting_obligations';

export const BASELINE_MODULE_INFO: Record<BaselineModuleType, {
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}> = {
  mandate: {
    label: 'Investment Mandate',
    shortLabel: 'Mandate',
    description: 'Define your investment thesis, geographic focus, and target criteria',
    icon: 'Target',
  },
  exclusions: {
    label: 'Exclusion Rules',
    shortLabel: 'Exclusions',
    description: 'Set hard and soft exclusions that filter out candidates',
    icon: 'Ban',
  },
  risk_appetite: {
    label: 'Risk Appetite',
    shortLabel: 'Risk',
    description: 'Configure concentration limits, exposure caps, and quality thresholds',
    icon: 'Gauge',
  },
  governance_thresholds: {
    label: 'Governance Thresholds',
    shortLabel: 'Governance',
    description: 'Define approval levels, escalation paths, and committee requirements',
    icon: 'Users',
  },
  reporting_obligations: {
    label: 'Reporting Obligations',
    shortLabel: 'Reporting',
    description: 'Configure internal reports, regulatory filings, and audit requirements',
    icon: 'FileText',
  },
};

export type BaselineValidationResult = {
  isValid: boolean;
  moduleResults: Record<BaselineModuleType, {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
  canPublish: boolean;
  publishBlockers: string[];
};

// =============================================================================
// Industry-Specific Portfolio Profile Types
// =============================================================================

/**
 * VC (Fund) Profile Fields
 * Used when creating/editing a Fund portfolio
 */
export interface VCFundProfile {
  fundType: 'vc' | 'growth' | 'evergreen' | 'opportunity';
  targetFundSize: number | null;
  managementCompany: {
    name: string;
    entityId: string | null;
  } | null;
  fundTermYears: number | null;
  extensionOptions: string | null;
  investmentPeriodYears: number | null;
  targetCheckSizeMin: number | null;
  targetCheckSizeMax: number | null;
  reservePolicy: number | null; // follow-on % target
  targetOwnershipMin: number | null;
  targetOwnershipMax: number | null;
  recyclingAllowed: boolean;
  leverageAllowed: boolean;
}

/**
 * Insurance (Book) Profile Fields
 * Used when creating/editing a Book portfolio
 */
export interface InsuranceBookProfile {
  lineOfBusiness: string; // motor, property, cyber, etc.
  territory: string;
  policyTermStandard: string; // e.g., "12 months"
  reinsuranceProgram: string | null;
  capitalRegime: string; // Solvency II, NAIC, etc.
  limitsDefaults: {
    maxPerRisk: number | null;
    maxPerEvent: number | null;
  };
  claimsHandlingModel: 'tpa' | 'in_house';
}

/**
 * Pharma (Pipeline) Profile Fields
 * Used when creating/editing a Pipeline portfolio
 */
export interface PharmaPipelineProfile {
  therapeuticAreas: string[];
  modalities: string[]; // small molecule, biologic, peptide, gene therapy
  developmentStagesSupported: string[]; // preclinical, phase 1/2/3
  targetRegulators: string[]; // FDA, EMA, MHRA
  manufacturingStrategy: 'in_house' | 'cmo' | 'hybrid';
  clinicalStrategyNotes: string | null;
}

/**
 * Combined industry profile that can hold any industry-specific data
 */
export interface PortfolioIndustryProfile {
  vc?: VCFundProfile;
  insurance?: InsuranceBookProfile;
  pharma?: PharmaPipelineProfile;
}
