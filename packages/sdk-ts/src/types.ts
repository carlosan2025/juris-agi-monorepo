/**
 * Shared types for JURIS-AGI SDK
 *
 * These types are derived from the OpenAPI specs in @juris-agi/contracts
 */

// ============================================================================
// Evidence API Types
// ============================================================================

export type ClaimPolarity = 'supportive' | 'risk' | 'neutral';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ConflictType = 'contradiction' | 'inconsistency' | 'temporal' | 'source_disagreement';
export type DocumentType = 'pitch_deck' | 'financial_model' | 'legal' | 'other';
export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface Citation {
  citation_id: string;
  claim_id: string;
  document_id: string;
  document_type: string;
  locator: string;
  quote: string;
  extraction_date?: string;
}

export interface TimeSeriesPoint {
  t: string;
  value: number;
  confidence?: number;
}

export interface Claim {
  claim_id: string;
  claim_type: string;
  field: string;
  value: unknown;
  confidence: number;
  polarity: ClaimPolarity;
  unit?: string;
  as_of_date?: string;
  citations?: Citation[];
  timeseries?: TimeSeriesPoint[];
}

export interface Conflict {
  conflict_id: string;
  conflict_type: ConflictType;
  claim_ids: string[];
  description: string;
  severity: number;
  resolution_hint?: string;
}

export interface ContextConstraints {
  max_claims?: number;
  per_bucket_cap?: number;
  min_confidence?: number;
  include_conflicts?: boolean;
  include_citations?: boolean;
  claim_types?: string[];
  exclude_claim_types?: string[];
}

export interface ContextRequest {
  deal_id: string;
  question?: string;
  constraints?: ContextConstraints;
}

export interface ContextSummary {
  total_claims: number;
  claims_by_type?: Record<string, number>;
  claims_by_polarity?: Record<string, number>;
  avg_confidence: number;
  conflict_count?: number;
  document_count?: number;
}

export interface ContextResponse {
  context_id: string;
  claims: Claim[];
  conflicts?: Conflict[];
  citations?: Citation[];
  summary: ContextSummary;
}

export interface ClaimResponse {
  claim: Claim;
  related_claims?: string[];
  conflicts?: Conflict[];
}

export interface Document {
  document_id: string;
  filename: string;
  project_id: string;
  document_type?: DocumentType;
  status: DocumentStatus;
  created_at?: string;
  updated_at?: string;
  page_count?: number;
  file_size?: number;
}

export interface SearchRequest {
  query: string;
  project_id?: string;
  document_types?: string[];
  limit?: number;
  min_score?: number;
}

export interface SearchResult {
  document_id: string;
  chunk_id: string;
  score: number;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  total_count?: number;
  query?: string;
}

// ============================================================================
// JURIS-AGI Types
// ============================================================================

export type AnalysisType = 'full' | 'quick' | 'targeted';
export type ReasoningStepType = 'observation' | 'hypothesis' | 'verification' | 'conclusion' | 'warning';
export type FindingCategory = 'strength' | 'weakness' | 'opportunity' | 'threat' | 'neutral';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Recommendation = 'strong_invest' | 'invest' | 'neutral' | 'caution' | 'strong_avoid';
export type ReportFormat = 'pdf' | 'markdown' | 'json';

export interface AnalysisConstraints {
  max_claims?: number;
  min_confidence?: number;
  focus_areas?: string[];
}

export interface AnalyzeRequest {
  deal_id: string;
  question?: string;
  claims?: Record<string, unknown>[];
  analysis_type?: AnalysisType;
  include_reasoning?: boolean;
  constraints?: AnalysisConstraints;
}

export interface ReasoningStep {
  step_id: string;
  type: ReasoningStepType;
  content: string;
  confidence?: number;
  supporting_claims?: string[];
  timestamp?: string;
}

export interface Finding {
  finding_id: string;
  category: FindingCategory;
  title: string;
  description: string;
  severity: FindingSeverity;
  confidence?: number;
  supporting_claims?: string[];
  reasoning_trace?: ReasoningStep[];
}

export interface AnalyzeResponse {
  analysis_id: string;
  deal_id: string;
  status: 'completed' | 'partial' | 'failed';
  summary?: string;
  recommendation?: Recommendation;
  confidence?: number;
  findings?: Finding[];
  reasoning_trace?: ReasoningStep[];
  conflicts_detected?: Record<string, unknown>[];
  claims_analyzed?: number;
  created_at?: string;
}

export interface BuildContextRequest {
  deal_id: string;
  question?: string;
  max_claims?: number;
  min_confidence?: number;
}

export interface BuildContextResponse {
  context_id: string;
  claims_count: number;
  summary?: Record<string, unknown>;
}

export interface GenerateReportRequest {
  analysis_id: string;
  format?: ReportFormat;
  include_sections?: Array<'executive_summary' | 'findings' | 'reasoning' | 'recommendations' | 'appendix'>;
}

export interface GenerateReportResponse {
  report_id: string;
  format: string;
  content?: string;
  download_url?: string;
}
