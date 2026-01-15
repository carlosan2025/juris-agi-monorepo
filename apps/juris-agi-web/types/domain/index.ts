/**
 * JURIS Domain Types
 * Based on UI_REBUILD_SPEC.md - Part 3: UI Object Model
 */

// =============================================================================
// Enums & Constants
// =============================================================================

export type IndustryProfile = 'vc' | 'insurance' | 'pharma';

export type ProjectStatus = 'draft' | 'active' | 'archived';

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
  1: { name: 'Project Constitution', shortName: 'Constitution' },
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
// Project & Constitution
// =============================================================================

export interface Project {
  id: string;
  name: string;
  industryProfile: IndustryProfile;
  status: ProjectStatus;
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

export interface ProjectConstitution {
  id: string;
  projectId: string;
  version: string;
  status: VersionStatus;
  mandate: string;
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
  projectId: string;
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
  projectId: string;
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
  projectId: string;
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
  projectId: string;
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
  projectId: string;
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
  project: Project | null;
  baselineVersion: string | null;
  schemaVersion: string | null;
  case: Case | null;
}

export type UserRole = 'admin' | 'partner' | 'risk_officer' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  projectAccess: string[];
}
