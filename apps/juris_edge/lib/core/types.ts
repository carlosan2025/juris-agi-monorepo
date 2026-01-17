/**
 * Core API Types
 * TypeScript interfaces matching the Core API Pydantic models.
 */

export type IndustryMode = 'vc' | 'insurance' | 'pharma';

export interface Claim {
  id: string;
  text: string;
  source: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface Conflict {
  id: string;
  claimIds: string[];
  description: string;
  resolutionStrategy?: string;
}

export interface WorkingSetSummary {
  totalClaims: number;
  claimsByBucket: Record<string, number>;
  conflictCount: number;
  coverageScore: number;
}

export interface WorkingSet {
  claims: Claim[];
  conflicts: Conflict[];
  summary: WorkingSetSummary;
}

export interface Dials {
  maxPolicies?: number;
  uncertaintyThreshold?: number;
  refinementIterations?: number;
  counterfactualCount?: number;
  robustnessSamples?: number;
  customDials?: Record<string, unknown>;
}

export interface SolveRequest {
  tenantId: string;
  projectId: string;
  dealId?: string;
  question: string;
  workingSet: WorkingSet;
  dials?: Dials;
  mode?: IndustryMode;
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface SolveResponse {
  jobId: string;
  status: JobStatus;
  statusUrl: string;
  eventsUrl: string;
  createdAt: string;
}

export interface PolicyDecision {
  policyId: string;
  decision: 'approve' | 'reject' | 'escalate' | 'defer';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
}

export interface UncertaintyScore {
  overall: number;
  byFactor: Record<string, number>;
  reasons: string[];
  recommendations: string[];
}

export interface Counterfactual {
  id: string;
  description: string;
  changedInputs: Record<string, unknown>;
  originalDecision: string;
  counterfactualDecision: string;
  impactScore: number;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  rules: Record<string, unknown>[];
  mdlScore: number;
  decision: PolicyDecision;
  uncertainty: UncertaintyScore;
}

export interface JobResult {
  jobId: string;
  status: JobStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  policies?: Policy[];
  counterfactuals?: Counterfactual[];
  traceUrl?: string;
  eventsUrl?: string;
  error?: string;
  errorDetails?: Record<string, unknown>;
}

export interface ReasoningEvent {
  id: string;
  timestamp: string;
  eventType: string;
  phase: string;
  message: string;
  details?: Record<string, unknown>;
  durationMs?: number;
}

export interface EventsResponse {
  jobId: string;
  events: ReasoningEvent[];
  cursor?: string;
  hasMore: boolean;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  redisConnected: boolean;
}
