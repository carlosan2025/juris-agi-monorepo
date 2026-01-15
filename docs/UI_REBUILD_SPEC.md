# JURIS UI REBUILD SPECIFICATION

## Executive Summary

This document defines the complete UI rebuild for Juris - an enterprise-grade, audit-first controlled reasoning pipeline. The UI implements a canonical 10-step operating sequence that cannot be reordered or skipped.

**Governing Principles:**
- Nothing is evaluated before rules are explicit
- Nothing is learned before deviations are recorded
- Nothing is reported that is not causally traceable

---

## PART 1: GLOBAL CONTRACTS

### 1.1 Feature Preservation Contract

The rebuilt UI must be a **strict superset** of the existing UI:
- No capability can be lost
- Where backend is missing, build full UI with mocked state
- Annotate missing backend as `// backend_pending`

### 1.2 Look & Feel Contract (Enterprise, High-Density, Auditable)

| Aspect | Specification |
|--------|---------------|
| Typography | Compact 12-13px body |
| Tables | Dense rows 28-32px |
| Color | Neutral slate/charcoal; color only for status/risk/actions |
| Layout | Table-first; graphs as secondary inspectors |
| Headers | Persistent context headers |
| Panels | Right-side inspector drawers |
| Motion | Minimal; no consumer/marketing styling |

**Target audience:** ICs, regulators, auditors, legal/compliance

---

## PART 2: THE 10-STEP CONTROL LOOP

### State Machine Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        JURIS 10-STEP WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1] Constitution  →  [2] Evidence Schema  →  [3] Case Intake              │
│        ↓                     ↓                      ↓                       │
│   (baseline v1)        (schema v1)           (envelope locked)             │
│                                                                             │
│  [4] Evidence Ingestion  →  [5] Policy Evaluation  →  [6] Exception Analysis│
│        ↓                          ↓                         ↓               │
│   (claims approved)         (fit/misfit map)         (exceptions justified)│
│                                                                             │
│  [7] Decision & Precedent  →  [8] Portfolio Integration  →  [9] Reporting  │
│        ↓                            ↓                           ↓           │
│   (decision recorded)        (portfolio delta)          (certified report) │
│                                                                             │
│  [10] Monitoring & Drift  →  [Propose Baseline Revision]  →  [1] ...       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step Details

#### Step 1: Project Constitution (Normative Baseline)
| Aspect | Detail |
|--------|--------|
| **Required Inputs** | Industry profile, mandate, exclusions, risk appetite, governance thresholds, reporting obligations |
| **Produced Artifacts** | `ProjectConstitution` (versioned) |
| **Gating Conditions** | Baseline must be `active` to create cases |
| **Allowed Roles** | Admin, Governance Lead |
| **UI Screens** | `/projects/new`, `/projects/[id]/constitution`, `/projects/[id]/constitution/versions` |
| **Cannot proceed until** | Constitution version is approved and active |

#### Step 2: Evidence Model Setup (Admissibility Schema)
| Aspect | Detail |
|--------|--------|
| **Required Inputs** | Evidence types, confidence weights, decay rules, forbidden evidence classes |
| **Produced Artifacts** | `EvidenceAdmissibilitySchema` (versioned) |
| **Gating Conditions** | Schema must be `active` to ingest evidence |
| **Allowed Roles** | Admin, Schema Editor |
| **UI Screens** | `/projects/[id]/schema`, `/projects/[id]/schema/versions` |
| **Cannot proceed until** | Schema version is approved and active |

#### Step 3: Case Intake (Decision Envelope)
| Aspect | Detail |
|--------|--------|
| **Required Inputs** | Case type, binding to baseline version, binding to schema version |
| **Produced Artifacts** | `Case` with `DecisionEnvelope` |
| **Gating Conditions** | Active baseline + active schema required |
| **Allowed Roles** | Analyst, Case Manager |
| **UI Screens** | `/projects/[id]/cases/new`, `/projects/[id]/cases/[caseId]` |
| **Cannot proceed until** | Decision envelope is bound and locked |

#### Step 4: Evidence Ingestion & Structuring
| Aspect | Detail |
|--------|--------|
| **Required Inputs** | Documents, extraction proposals, claim approvals |
| **Produced Artifacts** | `Documents`, `Claims` (approved), `StructuredEvidenceGraph` |
| **Gating Conditions** | Locked decision envelope required |
| **Allowed Roles** | Analyst, Evidence Reviewer |
| **UI Screens** | `/cases/[id]/evidence`, `/cases/[id]/claims`, `/cases/[id]/evidence-graph` |
| **Cannot proceed until** | Minimum evidence completeness rules met |

#### Step 5: Policy Evaluation (Fit/Misfit Map)
| Aspect | Detail |
|--------|--------|
| **Required Inputs** | Approved claims, active baseline rules |
| **Produced Artifacts** | `FitMisfitMap` |
| **Gating Conditions** | Minimum claims approved |
| **Allowed Roles** | Analyst, Reviewer |
| **UI Screens** | `/cases/[id]/evaluation`, `/cases/[id]/fit-misfit` |
| **Cannot proceed until** | Fit/Misfit map generated and reviewed (sign-off) |

#### Step 6: Exception Analysis
| Aspect | Detail |
|--------|--------|
| **Required Inputs** | Violated rules, justifications for overrides |
| **Produced Artifacts** | `ExceptionRegister` |
| **Gating Conditions** | Fit/Misfit map must exist |
| **Allowed Roles** | Senior Analyst, Exception Approver |
| **UI Screens** | `/cases/[id]/exceptions`, `/cases/[id]/overrides` |
| **Cannot proceed until** | Every exception resolved or justified with sign-off |

#### Step 7: Decision & Precedent Creation
| Aspect | Detail |
|--------|--------|
| **Required Inputs** | Decision entry, precedent classification, weight assignment |
| **Produced Artifacts** | `DecisionRecord`, `CaseLawEntry` |
| **Gating Conditions** | All exceptions resolved/justified |
| **Allowed Roles** | Committee, Decision Authority |
| **UI Screens** | `/cases/[id]/decision`, `/cases/[id]/precedent` |
| **Cannot proceed until** | Decision artifact recorded |

#### Step 8: Portfolio Integration
| Aspect | Detail |
|--------|--------|
| **Required Inputs** | Decision record, portfolio selection |
| **Produced Artifacts** | `PortfolioStateDelta` |
| **Gating Conditions** | Decision must be recorded |
| **Allowed Roles** | Portfolio Manager |
| **UI Screens** | `/portfolios/[id]`, `/portfolios/[id]/integration`, `/portfolios/[id]/diagnostics` |
| **Cannot proceed until** | Portfolio delta computed |

#### Step 9: Reporting & Certification
| Aspect | Detail |
|--------|--------|
| **Required Inputs** | All prior artifacts, sign-off authorities |
| **Produced Artifacts** | `CertifiedReport`, `SignOffArtifacts` |
| **Gating Conditions** | Complete causal chain required |
| **Allowed Roles** | Report Author, Certifier |
| **UI Screens** | `/cases/[id]/reports`, `/reports/[id]/certify` |
| **Cannot proceed until** | Every statement traceable; report certified |

#### Step 10: Monitoring & Drift Detection
| Aspect | Detail |
|--------|--------|
| **Required Inputs** | Outcomes, monitoring signals |
| **Produced Artifacts** | `DriftReport`, `BaselineRevisionProposal` |
| **Gating Conditions** | Active cases/portfolios to monitor |
| **Allowed Roles** | Monitor, Governance Lead |
| **UI Screens** | `/monitoring`, `/monitoring/drift`, `/baselines/revisions` |
| **Cannot proceed until** | Revision proposals reviewed and approved |

---

## PART 3: UI OBJECT MODEL

### 3.1 Core Domain Objects

```typescript
// Project & Constitution
interface Project {
  id: string;
  name: string;
  industryProfile: 'vc' | 'insurance' | 'pharma';
  status: 'draft' | 'active' | 'archived';
  activeBaselineVersion: string | null;
  activeSchemaVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectConstitution {
  id: string;
  projectId: string;
  version: string;
  status: 'draft' | 'proposed' | 'approved' | 'active' | 'superseded';
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

// Evidence Schema
interface EvidenceAdmissibilitySchema {
  id: string;
  projectId: string;
  version: string;
  status: 'draft' | 'proposed' | 'approved' | 'active' | 'superseded';
  admissibleTypes: EvidenceTypeConfig[];
  confidenceWeights: ConfidenceWeightConfig;
  decayRules: DecayRule[];
  forbiddenClasses: string[];
  coverageChecklist: CoverageItem[];
  createdAt: Date;
}

// Case & Decision Envelope
interface Case {
  id: string;
  projectId: string;
  type: 'deal' | 'underwriting' | 'asset_gating'; // varies by industry
  name: string;
  status: CaseStatus;
  decisionEnvelope: DecisionEnvelope;
  currentStep: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  createdAt: Date;
}

interface DecisionEnvelope {
  caseId: string;
  baselineVersionId: string;
  schemaVersionId: string;
  lockedAt: Date;
  isLocked: boolean;
}

// Evidence & Claims
interface Document {
  id: string;
  caseId: string;
  filename: string;
  type: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  metadata: DocumentMetadata;
  uploadedAt: Date;
}

interface Claim {
  id: string;
  caseId: string;
  documentId: string;
  claimType: string;
  field: string;
  value: any;
  unit: string | null;
  confidence: number;
  polarity: 'supportive' | 'risk' | 'neutral';
  status: 'proposed' | 'approved' | 'rejected';
  approvedBy: string | null;
  notes: string | null;
  uncertaintyFlags: string[];
  provenance: ClaimProvenance;
  createdAt: Date;
}

interface StructuredEvidenceGraph {
  caseId: string;
  claims: Claim[];
  relationships: ClaimRelationship[];
  generatedAt: Date;
  // Explicitly: "No conclusions. Facts + confidence only."
}

// Evaluation Outputs
interface FitMisfitMap {
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

interface ExceptionRegister {
  id: string;
  caseId: string;
  exceptions: Exception[];
  createdAt: Date;
}

interface Exception {
  id: string;
  ruleId: string;
  ruleName: string;
  status: 'pending' | 'resolved' | 'justified';
  justification: string | null;
  justifiedBy: string | null;
  scope: string | null;
  conditions: string | null;
  signedOffAt: Date | null;
}

// Decision & Precedent
interface DecisionRecord {
  id: string;
  caseId: string;
  decision: 'approve' | 'reject' | 'conditional' | 'defer';
  classification: 'standard' | 'exception' | 'provisional_precedent';
  rationale: string;
  decidedBy: string[];
  decidedAt: Date;
  auditTrail: AuditTrailEntry[];
}

interface CaseLawEntry {
  id: string;
  decisionRecordId: string;
  precedentLabel: string;
  weight: 'binding' | 'persuasive' | 'informational';
  applicableConditions: string[];
  createdAt: Date;
}

// Portfolio
interface Portfolio {
  id: string;
  projectId: string;
  name: string;
  type: 'fund' | 'book' | 'pipeline'; // varies by industry
  cases: string[]; // case IDs
  currentState: PortfolioState;
}

interface PortfolioStateDelta {
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

// Reporting
interface CertifiedReport {
  id: string;
  caseId: string;
  type: 'ic_memo' | 'risk_report' | 'lp_pack' | 'regulator_pack';
  status: 'draft' | 'pending_certification' | 'certified';
  content: ReportContent;
  traceLinks: TraceLink[];
  signOffArtifacts: SignOffArtifact[];
  certifiedBy: string | null;
  certifiedAt: Date | null;
}

// Monitoring
interface DriftReport {
  id: string;
  projectId: string;
  detectedDrifts: DriftItem[];
  ruleErosions: RuleErosion[];
  silentPolicyShifts: PolicyShift[];
  generatedAt: Date;
}

interface BaselineRevisionProposal {
  id: string;
  projectId: string;
  currentBaselineVersion: string;
  proposedChanges: BaselineChange[];
  status: 'proposed' | 'under_review' | 'approved' | 'rejected';
  proposedBy: string;
  proposedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
}

// Reasoning & Trace
interface ReasoningRun {
  id: string;
  caseId: string;
  step: number;
  input: any;
  output: any;
  trace: TraceEntry[];
  startedAt: Date;
  completedAt: Date;
}
```

### 3.2 Lifecycle Statuses

| Object | Statuses |
|--------|----------|
| Project | `draft` → `active` → `archived` |
| Constitution | `draft` → `proposed` → `approved` → `active` → `superseded` |
| Schema | `draft` → `proposed` → `approved` → `active` → `superseded` |
| Case | `intake` → `evidence` → `evaluation` → `exceptions` → `decision` → `integrated` → `reported` → `monitoring` |
| Claim | `proposed` → `approved` / `rejected` |
| Exception | `pending` → `resolved` / `justified` |
| Report | `draft` → `pending_certification` → `certified` |
| Revision | `proposed` → `under_review` → `approved` / `rejected` |

### 3.3 Immutable Artifacts

These artifacts, once created, cannot be modified:
- Locked `DecisionEnvelope`
- Approved `Claim` (value frozen)
- `FitMisfitMap` (once generated)
- `DecisionRecord` (once recorded)
- `CertifiedReport` (once certified)
- `CaseLawEntry` (once created)

---

## PART 4: NAVIGATION & WORKFLOW RAIL

### 4.1 Global Navigation (Left Sidebar)

```
┌──────────────────────┐
│ 🏛️ JURIS            │
├──────────────────────┤
│ 📁 Projects          │
│ 📋 Cases             │
│ 📊 Portfolios        │
│ 📄 Reports           │
│ 📡 Monitoring        │
├──────────────────────┤
│ ⚙️ Admin             │
│   └─ Users & Roles   │
│   └─ Settings        │
└──────────────────────┘
```

### 4.2 Workflow Rail (Per Case)

The Workflow Rail appears on all Case pages, showing:

```
┌─────────────────────────────────────────────────────────────────────┐
│ WORKFLOW PROGRESS                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✅ 1. Constitution      v1.2 locked                               │
│  ✅ 2. Evidence Schema   v2.0 locked                               │
│  ✅ 3. Case Intake       Envelope locked 2024-01-15                │
│  🔵 4. Evidence          12/15 claims approved                     │
│  ⬜ 5. Evaluation        ⚠️ Requires: 15 approved claims           │
│  ⬜ 6. Exceptions        Locked until Step 5                       │
│  ⬜ 7. Decision          Locked until Step 6                       │
│  ⬜ 8. Portfolio         Locked until Step 7                       │
│  ⬜ 9. Reporting         Locked until Step 8                       │
│  ⬜ 10. Monitoring       Locked until Step 9                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**States:**
- ✅ Completed (locked with version/date)
- 🔵 Current (in progress)
- ⬜ Locked (shows unmet conditions)
- ⚠️ Warning (approaching but not met)

### 4.3 Active Context Header (Persistent)

Always visible at top of screen:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Project: Acme Fund III  │  Baseline: v1.2  │  Schema: v2.0  │  Case: Deal-047│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 5: SCREEN SPECIFICATIONS

### 5.1 Step 1 - Project Constitution

#### Routes
- `/projects` - Project list
- `/projects/new` - Create project
- `/projects/[id]` - Project overview
- `/projects/[id]/constitution` - Constitution editor
- `/projects/[id]/constitution/versions` - Version history
- `/projects/[id]/constitution/diff/[v1]/[v2]` - Diff viewer

#### UI Components

**Constitution Editor:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PROJECT CONSTITUTION                                          v1.2 (draft)  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ MANDATE                                                          [Edit]    │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Series A-B enterprise SaaS investments in North America, $2-10M check  ││
│ │ sizes, targeting 3x net MOIC within 7-year fund life.                  ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ EXCLUSIONS                                                       [Edit]    │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ • No consumer companies                                                ││
│ │ • No pre-revenue investments                                           ││
│ │ • No crypto/blockchain core business                                   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ RISK APPETITE                                                    [Edit]    │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Max single position: 8% of fund                                        ││
│ │ Max sector concentration: 30%                                          ││
│ │ Min revenue threshold: $500K ARR                                       ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ GOVERNANCE THRESHOLDS                                            [Edit]    │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Check size > $5M: Full IC approval required                            ││
│ │ Follow-on > 50% of original: IC notification required                  ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ REPORTING OBLIGATIONS                                            [Edit]    │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ • Quarterly LP reports (within 45 days of quarter end)                 ││
│ │ • Annual audited financials (within 90 days of year end)               ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Save Draft]  [Propose for Approval]  [Export JSON]  [Export PDF]          │
│                                                                             │
│ ⚠️ Cannot create cases until baseline is approved and active               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Version Workflow:**
```
draft → [Propose] → proposed → [Approve] → approved → [Activate] → active
                        ↓                      ↓
                   [Reject]              [Supersede]
```

### 5.2 Step 2 - Evidence Admissibility Schema

#### Routes
- `/projects/[id]/schema` - Schema editor
- `/projects/[id]/schema/versions` - Version history

#### UI Components

**Schema Editor:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVIDENCE ADMISSIBILITY SCHEMA                                 v2.0 (active) │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ADMISSIBLE EVIDENCE TYPES                                                   │
│ ┌───────────────────┬────────────────┬────────────────┬───────────────────┐│
│ │ Type              │ Weight (0-1)   │ Decay Rule     │ Required          ││
│ ├───────────────────┼────────────────┼────────────────┼───────────────────┤│
│ │ Financial Model   │ 0.9            │ -0.1/quarter   │ ✓                 ││
│ │ Pitch Deck        │ 0.7            │ -0.05/quarter  │ ✓                 ││
│ │ Customer Refs     │ 0.8            │ -0.2/quarter   │ ○                 ││
│ │ Expert Opinion    │ 0.6            │ -0.1/quarter   │ ○                 ││
│ │ Management Call   │ 0.5            │ -0.15/quarter  │ ○                 ││
│ └───────────────────┴────────────────┴────────────────┴───────────────────┘│
│ [+ Add Type]                                                                │
│                                                                             │
│ FORBIDDEN EVIDENCE CLASSES                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ • Post-hoc rationalizations                                            ││
│ │ • Unverified third-party rumors                                        ││
│ │ • Outdated data (>18 months without revalidation)                      ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│ [+ Add Forbidden Class]                                                     │
│                                                                             │
│ COVERAGE CHECKLIST (minimum for case completion)                            │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ ☑ Financial projections                                                ││
│ │ ☑ Team background verification                                         ││
│ │ ☑ Market size validation                                               ││
│ │ ☑ Competitive analysis                                                 ││
│ │ ☐ Customer reference calls (recommended)                               ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⚠️ Cannot ingest evidence into cases unless schema version is active        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Step 3 - Case Intake (Decision Envelope)

#### Routes
- `/projects/[id]/cases` - Case list
- `/projects/[id]/cases/new` - Create case
- `/projects/[id]/cases/[caseId]` - Case overview

#### UI Components

**Case Creation:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CREATE NEW CASE                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Case Name: [_____________________]                                          │
│                                                                             │
│ Case Type: [Deal ▼]  (VC) / [Underwriting Case ▼] (Insurance)              │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────  │
│ DECISION ENVELOPE (will be locked upon creation)                            │
│ ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│ Baseline Version:  v1.2 (active) ✓                                         │
│   Mandate: Series A-B enterprise SaaS...                                    │
│   [View Full Baseline]                                                      │
│                                                                             │
│ Schema Version:    v2.0 (active) ✓                                         │
│   Required: Financial Model, Pitch Deck                                     │
│   [View Full Schema]                                                        │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│ ⚠️ Once created, the Decision Envelope cannot be changed.                   │
│    All evaluation will be against these locked versions.                    │
│                                                                             │
│ [Cancel]                                        [Create Case & Lock Envelope]│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Step 4 - Evidence Ingestion & Structuring

#### Routes
- `/cases/[id]/evidence` - Document management
- `/cases/[id]/evidence/[docId]` - Document preview
- `/cases/[id]/claims` - Claims management
- `/cases/[id]/evidence-graph` - Structured evidence graph

#### UI Components

**Claims Review Table:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLAIMS REVIEW                                          12 approved / 18 total│
├─────────────────────────────────────────────────────────────────────────────┤
│ [Filter: All ▼]  [Status: All ▼]  [Type: All ▼]              [Search...]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ │ Status   │ Type        │ Field     │ Value      │ Conf │ Source    │ Act ││
│ ├──────────┼─────────────┼───────────┼────────────┼──────┼───────────┼─────┤│
│ │ ✓ Appr   │ Traction    │ ARR       │ $2.4M      │ 0.92 │ Fin Model │ 👁️  ││
│ │ ✓ Appr   │ Traction    │ Growth    │ 180% YoY   │ 0.88 │ Fin Model │ 👁️  ││
│ │ ⏳ Pend  │ Team        │ Exp Years │ 12 avg     │ 0.75 │ Pitch     │ ✓ ✗ ││
│ │ ⏳ Pend  │ Market      │ TAM       │ $4.2B      │ 0.65 │ Pitch     │ ✓ ✗ ││
│ │ ✗ Rej   │ Traction    │ NRR       │ 140%       │ 0.45 │ Unverified│ 🔄  ││
│ └──────────┴─────────────┴───────────┴────────────┴──────┴───────────┴─────┘│
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────  │
│ CLAIM INSPECTOR (right drawer)                                              │
│ ─────────────────────────────────────────────────────────────────────────  │
│ │ Claim: ARR = $2.4M                                                      │ │
│ │ Source: Financial Model Q4 2024, Page 3, Cell B12                       │ │
│ │ Confidence: 0.92 (High)                                                 │ │
│ │ Polarity: Supportive                                                    │ │
│ │ Uncertainty Flags: None                                                 │ │
│ │                                                                         │ │
│ │ [Edit Claim]  [Add Note]  [Flag Uncertainty]                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⚠️ Cannot proceed to evaluation until 15 claims approved (currently: 12)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Evidence Graph Display:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STRUCTURED EVIDENCE GRAPH                                                   │
│ ─────────────────────────────────────────────────────────────────────────  │
│ ⚠️ NO CONCLUSIONS. FACTS + CONFIDENCE ONLY.                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                │
│   │  TRACTION   │      │    TEAM     │      │   MARKET    │                │
│   │  (4 claims) │      │  (3 claims) │      │  (2 claims) │                │
│   └──────┬──────┘      └──────┬──────┘      └──────┬──────┘                │
│          │                    │                    │                        │
│   ┌──────┴──────┐      ┌──────┴──────┐      ┌──────┴──────┐                │
│   │ ARR: $2.4M  │      │ CEO: 12 yrs │      │ TAM: $4.2B  │                │
│   │ conf: 0.92  │      │ conf: 0.75  │      │ conf: 0.65  │                │
│   └─────────────┘      └─────────────┘      └─────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Step 5 - Policy Evaluation (Fit/Misfit Map)

#### Routes
- `/cases/[id]/evaluation` - Run evaluation
- `/cases/[id]/fit-misfit` - View Fit/Misfit Map

#### UI Components

**Fit/Misfit Map:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FIT/MISFIT MAP                                    Generated: 2024-01-15 14:32│
│ ─────────────────────────────────────────────────────────────────────────  │
│ ⚠️ NO RECOMMENDATIONS AT THIS STEP. COMPLIANCE STATUS ONLY.                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ COMPLIANCE (5 rules)                                                   ✓    │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Rule                          │ Evidence              │ Status          ││
│ ├───────────────────────────────┼───────────────────────┼─────────────────┤│
│ │ Min ARR > $500K               │ ARR: $2.4M (0.92)     │ ✓ COMPLIANT     ││
│ │ Enterprise focus              │ Customer mix (0.85)   │ ✓ COMPLIANT     ││
│ │ North America HQ              │ HQ: SF, CA (0.99)     │ ✓ COMPLIANT     ││
│ └───────────────────────────────┴───────────────────────┴─────────────────┘│
│                                                                             │
│ VIOLATIONS (2 rules)                                                   ✗    │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Rule                          │ Evidence              │ Gap             ││
│ ├───────────────────────────────┼───────────────────────┼─────────────────┤│
│ │ Max check size 8% of fund     │ Requested: $12M       │ Exceeds by $2M  ││
│ │ No pre-revenue                │ Revenue started Q3    │ <12mo history   ││
│ └───────────────────────────────┴───────────────────────┴─────────────────┘│
│ [→ These violations require exception handling in Step 6]                   │
│                                                                             │
│ UNDERSPECIFIED (1 area)                                                ⚠️   │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Area                          │ Missing Evidence      │ Action          ││
│ ├───────────────────────────────┼───────────────────────┼─────────────────┤│
│ │ Competitive moat              │ No patent/IP data     │ [Add Evidence]  ││
│ └───────────────────────────────┴───────────────────────┴─────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ TRACEABILITY: Each finding links to Evidence → Baseline Rule               │
│ [View Full Trace]                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ I have reviewed the Fit/Misfit Map                                       │
│ [Sign Off & Proceed to Exception Analysis]                                  │
│                                                                             │
│ ⚠️ Cannot proceed until Fit/Misfit Map is reviewed and signed off           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Step 6 - Exception Analysis

#### Routes
- `/cases/[id]/exceptions` - Exception register
- `/cases/[id]/overrides` - Override management

#### UI Components

**Exception Register:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXCEPTION REGISTER                                         2 pending / 2 total│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ VIOLATION #1: Max check size exceeded                          [PENDING]   │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Rule: Max single position 8% of fund ($10M)                             ││
│ │ Actual: Requested $12M (9.6% of fund)                                   ││
│ │ Gap: $2M over limit                                                     ││
│ │                                                                         ││
│ │ RESOLUTION OPTIONS:                                                     ││
│ │ ○ Reduce check size to $10M                    [Mark as Resolved]      ││
│ │ ○ Request exception with justification:                                 ││
│ │   ┌───────────────────────────────────────────────────────────────────┐││
│ │   │ Justification: [                                                 ]│││
│ │   │ Scope/Limits: [                                                  ]│││
│ │   │ Conditions: [                                                    ]│││
│ │   └───────────────────────────────────────────────────────────────────┘││
│ │   [Submit Exception for Approval]                                       ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ VIOLATION #2: Revenue history < 12 months                      [PENDING]   │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Rule: No pre-revenue investments                                        ││
│ │ Actual: Revenue started Q3 2024 (6 months ago)                          ││
│ │                                                                         ││
│ │ RESOLUTION OPTIONS:                                                     ││
│ │ ○ Add additional evidence of revenue sustainability                     ││
│ │ ○ Request exception with justification:                                 ││
│ │   [Justification required]                                              ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⚠️ Cannot proceed to Decision until ALL exceptions are either:              │
│    • Resolved (evidence added/action taken), OR                            │
│    • Justified and signed off by authorized role                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Step 7 - Decision & Precedent Creation

#### Routes
- `/cases/[id]/decision` - Decision entry
- `/cases/[id]/precedent` - Precedent management

#### UI Components

**Decision Entry:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECISION RECORD                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ DECISION                                                                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ ○ Approve    ○ Reject    ○ Conditional    ○ Defer                      ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ CLASSIFICATION                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ ○ Standard (follows baseline without exceptions)                        ││
│ │ ○ Exception (approved with justified exceptions)                        ││
│ │ ○ Provisional Precedent (creates new case law)                          ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ PRECEDENT WEIGHT (if provisional precedent)                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ ○ Binding (must be followed in similar cases)                           ││
│ │ ○ Persuasive (should be considered)                                     ││
│ │ ○ Informational (for reference only)                                    ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ RATIONALE                                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ [                                                                      ]││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────  │
│ AUDIT TRAIL SUMMARY                                                         │
│ ─────────────────────────────────────────────────────────────────────────  │
│ Evidence: 18 claims (12 approved) → Rules: 8 evaluated →                    │
│ Exceptions: 2 (both justified) → Decision: [pending]                        │
│ [View Full Causal Chain]                                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ COMMITTEE SIGN-OFF                                                          │
│ ☐ Partner A (required)                                                     │
│ ☐ Partner B (required)                                                     │
│ ☐ Risk Officer (required for exceptions)                                   │
│                                                                             │
│ [Record Decision]                                                           │
│                                                                             │
│ ⚠️ Decision is immutable once recorded                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.8 Step 8 - Portfolio Integration

#### Routes
- `/portfolios` - Portfolio list
- `/portfolios/[id]` - Portfolio overview
- `/portfolios/[id]/integration` - Case integration
- `/portfolios/[id]/diagnostics` - Diagnostics

#### UI Components

**Portfolio State Delta:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PORTFOLIO INTEGRATION: Fund III + Deal-047                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PORTFOLIO STATE DELTA                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Metric              │ Before      │ After       │ Change    │ Status   ││
│ ├─────────────────────┼─────────────┼─────────────┼───────────┼──────────┤│
│ │ Total Deployed      │ $78M        │ $90M        │ +$12M     │ ✓        ││
│ │ Largest Position    │ 7.2%        │ 9.6%        │ +2.4%     │ ⚠️ BREACH ││
│ │ SaaS Concentration  │ 28%         │ 31%         │ +3%       │ ⚠️ WATCH  ││
│ │ Avg Check Size      │ $6.5M       │ $6.9M       │ +$0.4M    │ ✓        ││
│ └─────────────────────┴─────────────┴─────────────┴───────────┴──────────┘│
│                                                                             │
│ CONCENTRATION DIAGNOSTICS                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ • Position size breach: Deal-047 at 9.6% exceeds 8% limit              ││
│ │   → Approved via exception (see Exception Register)                     ││
│ │ • Sector approaching limit: SaaS at 31% (limit: 35%)                   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ PORTFOLIO-LEVEL BREACHES (distinct from case-level)                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ ⚠️ Position concentration breach requires LP disclosure in next report  ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Acknowledge & Proceed to Reporting]                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.9 Step 9 - Reporting & Certification

#### Routes
- `/cases/[id]/reports` - Report list
- `/cases/[id]/reports/new` - Create report
- `/reports/[id]` - Report editor
- `/reports/[id]/certify` - Certification

#### UI Components

**Report Certification:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REPORT CERTIFICATION                                                        │
│ IC Memo: Deal-047 - Acme Corp Series A                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ TRACEABILITY VERIFICATION                                             ✓ ALL │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Statement                        │ Evidence  │ Rule      │ Decision    ││
│ ├──────────────────────────────────┼───────────┼───────────┼─────────────┤│
│ │ "ARR of $2.4M demonstrates..."   │ Claim #12 │ Rule 3.1  │ Dec #1      ││
│ │ "Team has 12 years average..."   │ Claim #8  │ Rule 4.2  │ Dec #1      ││
│ │ "Exception granted for size..."  │ Exc #1    │ Rule 2.1  │ Dec #1      ││
│ └──────────────────────────────────┴───────────┴───────────┴─────────────┘│
│                                                                             │
│ ⚠️ All statements must be traceable. Untraceable claims cannot be published.│
│                                                                             │
│ SIGN-OFF REQUIREMENTS                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ ☑ Deal Lead: J. Smith (signed 2024-01-15 15:30)                        ││
│ │ ☑ Risk Officer: M. Johnson (signed 2024-01-15 16:00)                   ││
│ │ ☐ IC Chair: [pending]                                                  ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ EXPORTS                                                                     │
│ [Download PDF]  [Download JSON Bundle]  [Download Trace Links]              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Certify Report]                                                            │
│                                                                             │
│ ⚠️ Certified reports are immutable and legally binding                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.10 Step 10 - Monitoring & Drift Detection

#### Routes
- `/monitoring` - Monitoring dashboard
- `/monitoring/drift` - Drift reports
- `/monitoring/cases/[id]` - Case monitoring
- `/baselines/revisions` - Revision proposals

#### UI Components

**Drift Detection:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DRIFT DETECTION REPORT                              Generated: 2024-01-15   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ RULE EROSION DETECTED                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Rule: "Max position 8%"                                                 ││
│ │ Original enforcement: Strict (0 exceptions in first 2 years)           ││
│ │ Current pattern: 3 exceptions in last 6 months                         ││
│ │ Drift indicator: Rule may be effectively obsolete                       ││
│ │                                                                         ││
│ │ [Propose Baseline Revision]  [Acknowledge & Document]                   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ SILENT POLICY SHIFTS                                                        │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Pattern: Increasing pre-revenue exceptions                              ││
│ │ Baseline says: "No pre-revenue investments"                             ││
│ │ Actual practice: 4 of last 10 deals had <12mo revenue                  ││
│ │                                                                         ││
│ │ [Propose Baseline Revision]  [Acknowledge & Document]                   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ BASELINE REVISION WORKFLOW                                                  │
│ ─────────────────────────────────────────────────────────────────────────  │
│ ⚠️ Learning is CONTROLLED. No auto-apply.                                   │
│                                                                             │
│ Propose → Diff Review → Committee Approval → Activate New Version           │
│                                                                             │
│ [View Pending Proposals]                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Baseline Revision Proposal:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BASELINE REVISION PROPOSAL                                                  │
│ Current: v1.2 → Proposed: v1.3                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ DIFF VIEW                                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ RISK APPETITE                                                           ││
│ │ - Max single position: 8% of fund                                       ││
│ │ + Max single position: 10% of fund (with IC approval for >8%)           ││
│ │                                                                         ││
│ │ EXCLUSIONS                                                              ││
│ │ - No pre-revenue investments                                            ││
│ │ + No pre-revenue investments (exception: >$100K MRR with signed LOIs)   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ JUSTIFICATION                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Based on 3 successful exceptions in past 6 months, market conditions   ││
│ │ and fund strategy evolution support relaxing these constraints with    ││
│ │ appropriate governance controls.                                        ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ APPROVAL                                                                    │
│ ☐ Governance Lead: [pending]                                               │
│ ☐ IC Chair: [pending]                                                      │
│ ☐ LP Advisory (if material): [not required]                                │
│                                                                             │
│ [Approve & Activate v1.3]  [Reject]  [Request Changes]                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 6: CROSS-CUTTING SYSTEMS

### 6.1 Versioning & Audit Trail

**Global Audit Trail Viewer:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AUDIT TRAIL: Deal-047                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────┐    ┌─────────┐    ┌──────────┐    ┌────────┐    ┌─────────┐       │
│ │ ENV │ → │ EVIDENCE│ → │ FIT/MIS  │ → │ EXCEPT │ → │DECISION │       │
│ │ v1.2│    │ 18 clms │    │ 5✓ 2✗ 1⚠│    │ 2 just │    │ Approve │       │
│ └──┬──┘    └────┬────┘    └────┬─────┘    └───┬────┘    └────┬────┘       │
│    │            │              │              │              │             │
│    ▼            ▼              ▼              ▼              ▼             │
│ ┌─────┐    ┌─────────┐    ┌──────────┐    ┌────────┐    ┌─────────┐       │
│ │PORT │ → │ DELTA   │ → │ REPORT   │ → │ CERTFY │ → │MONITOR │       │
│ │ Int │    │ +$12M   │    │ IC Memo  │    │ 3 sign │    │ Active  │       │
│ └─────┘    └─────────┘    └──────────┘    └────────┘    └─────────┘       │
│                                                                             │
│ [Click any node to inspect provenance]                                      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ CHRONOLOGICAL LOG                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ 2024-01-10 09:00  Case created, envelope locked (v1.2/v2.0)            ││
│ │ 2024-01-10 09:15  Document uploaded: Financial Model Q4.xlsx            ││
│ │ 2024-01-10 10:30  12 claims extracted, 8 approved                       ││
│ │ 2024-01-12 14:00  Fit/Misfit map generated                              ││
│ │ 2024-01-12 15:00  2 exceptions justified by J. Smith                    ││
│ │ 2024-01-15 11:00  Decision recorded: Approve (Exception)                ││
│ │ 2024-01-15 11:30  Portfolio integration: +$12M deployed                 ││
│ │ 2024-01-15 15:30  IC Memo certified                                     ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Configuration (Dials & Presets)

**Configuration Panel:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ANALYSIS CONFIGURATION                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PRESET: [Balanced ▼]                                                        │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ • Fast: Minimum evidence, quick evaluation                              ││
│ │ • Balanced: Standard evidence requirements (recommended)                ││
│ │ • Thorough: Comprehensive evidence, detailed evaluation                 ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ADVANCED DIALS (Expert Mode)                                   [Expand ▼]  │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Min claims for evaluation:     [15____] (range: 5-50)                   ││
│ │ Confidence threshold:          [0.7___] (range: 0.5-0.95)               ││
│ │ Exception approval level:      [Senior ▼]                               ││
│ │ Auto-flag low confidence:      [✓] below 0.6                            ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ⚠️ WORKFLOW INTEGRITY                                                       │
│ These settings CANNOT:                                                      │
│ • Skip any of the 10 steps                                                  │
│ • Produce decisions before fit/misfit and exceptions                        │
│ • Bypass sign-off requirements                                              │
│                                                                             │
│ EFFECTIVE SETTINGS FOR THIS RUN                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Preset: Balanced | Min Claims: 15 | Confidence: 0.7 | Level: Senior    ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Industry Adaptation

| Aspect | VC | Insurance | Pharma |
|--------|----|-----------| -------|
| Case label | Deal | Underwriting Case | Asset Gating Case |
| Portfolio label | Fund Portfolio | Book of Business | Division Pipeline |
| Evidence focus | Financials, Team, Market | Risk factors, Actuarial | Clinical, Regulatory |
| Report templates | IC Memo, LP Report | Underwriting Report | Stage Gate Report |

**The workflow (10 steps) remains identical across all industries.**

### 6.4 Admin UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN: USERS & ROLES                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ USERS                                                          [+ Add User] │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ User            │ Role              │ Projects        │ Status          ││
│ ├─────────────────┼───────────────────┼─────────────────┼─────────────────┤│
│ │ j.smith@acme    │ Partner           │ Fund III, IV    │ Active          ││
│ │ m.johnson@acme  │ Risk Officer      │ All             │ Active          ││
│ │ a.williams@acme │ Analyst           │ Fund III        │ Active          ││
│ └─────────────────┴───────────────────┴─────────────────┴─────────────────┘│
│                                                                             │
│ ROLES & PERMISSIONS                                       // backend_pending│
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Role            │ Create │ Approve │ Decide │ Certify │ Admin          ││
│ ├─────────────────┼────────┼─────────┼────────┼─────────┼────────────────┤│
│ │ Admin           │ ✓      │ ✓       │ ✓      │ ✓       │ ✓              ││
│ │ Partner         │ ✓      │ ✓       │ ✓      │ ✓       │ -              ││
│ │ Risk Officer    │ -      │ ✓       │ -      │ ✓       │ -              ││
│ │ Analyst         │ ✓      │ -       │ -      │ -       │ -              ││
│ │ Viewer          │ -      │ -       │ -      │ -       │ -              ││
│ └─────────────────┴────────┴─────────┴────────┴─────────┴────────────────┘│
│                                                                             │
│ PROJECT ACCESS BOUNDARIES                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Users can only access projects they are assigned to.                    ││
│ │ Cross-project data is isolated.                                         ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 7: ROUTE MAP

### Complete Route Structure

```
/
├── /projects
│   ├── /projects/new
│   ├── /projects/[id]
│   ├── /projects/[id]/constitution
│   ├── /projects/[id]/constitution/versions
│   ├── /projects/[id]/constitution/diff/[v1]/[v2]
│   ├── /projects/[id]/schema
│   ├── /projects/[id]/schema/versions
│   ├── /projects/[id]/cases
│   └── /projects/[id]/cases/new
│
├── /cases
│   ├── /cases/[id]
│   ├── /cases/[id]/evidence
│   ├── /cases/[id]/evidence/[docId]
│   ├── /cases/[id]/claims
│   ├── /cases/[id]/evidence-graph
│   ├── /cases/[id]/evaluation
│   ├── /cases/[id]/fit-misfit
│   ├── /cases/[id]/exceptions
│   ├── /cases/[id]/overrides
│   ├── /cases/[id]/decision
│   ├── /cases/[id]/precedent
│   └── /cases/[id]/reports
│
├── /portfolios
│   ├── /portfolios/[id]
│   ├── /portfolios/[id]/integration
│   └── /portfolios/[id]/diagnostics
│
├── /reports
│   ├── /reports/[id]
│   └── /reports/[id]/certify
│
├── /monitoring
│   ├── /monitoring/drift
│   ├── /monitoring/cases/[id]
│   └── /baselines/revisions
│
└── /admin
    ├── /admin/users
    ├── /admin/roles
    └── /admin/settings
```

---

## PART 8: FEATURE PARITY MATRIX

| Feature | Screen | Component | Route | Backend Status |
|---------|--------|-----------|-------|----------------|
| Create Project | Project Creation | ProjectForm | `/projects/new` | ✓ Ready |
| Constitution Editor | Constitution | ConstitutionEditor | `/projects/[id]/constitution` | ✓ Ready |
| Constitution Versioning | Constitution Versions | VersionList, DiffViewer | `/projects/[id]/constitution/versions` | ✓ Ready |
| Schema Editor | Schema | SchemaEditor | `/projects/[id]/schema` | ✓ Ready |
| Create Case | Case Intake | CaseForm, EnvelopeLocker | `/projects/[id]/cases/new` | ✓ Ready |
| Document Upload | Evidence | DocumentUploader | `/cases/[id]/evidence` | ✓ Ready |
| Claims Review | Claims | ClaimsTable, ClaimInspector | `/cases/[id]/claims` | ✓ Ready |
| Evidence Graph | Evidence Graph | EvidenceGraphViewer | `/cases/[id]/evidence-graph` | // backend_pending |
| Policy Evaluation | Evaluation | EvaluationRunner | `/cases/[id]/evaluation` | ✓ Ready |
| Fit/Misfit Map | Fit/Misfit | FitMisfitMap | `/cases/[id]/fit-misfit` | ✓ Ready |
| Exception Register | Exceptions | ExceptionRegister | `/cases/[id]/exceptions` | ✓ Ready |
| Decision Entry | Decision | DecisionForm | `/cases/[id]/decision` | ✓ Ready |
| Precedent Creation | Precedent | PrecedentForm | `/cases/[id]/precedent` | // backend_pending |
| Portfolio Integration | Portfolio | PortfolioDelta | `/portfolios/[id]/integration` | // backend_pending |
| Report Generation | Reports | ReportEditor | `/cases/[id]/reports` | ✓ Ready |
| Report Certification | Certification | CertificationPanel | `/reports/[id]/certify` | // backend_pending |
| Drift Detection | Monitoring | DriftReport | `/monitoring/drift` | // backend_pending |
| Baseline Revision | Revisions | RevisionProposal | `/baselines/revisions` | // backend_pending |
| Audit Trail | Audit | AuditTrailViewer | (global component) | ✓ Ready |
| User Management | Admin | UserManager | `/admin/users` | // backend_pending |

---

## PART 9: BACKEND WIRING MAP

### APIs Required Per Screen

| Screen | API Endpoints | Status |
|--------|---------------|--------|
| Projects List | `GET /api/v1/projects` | ✓ |
| Project Create | `POST /api/v1/projects` | ✓ |
| Constitution | `GET/PUT /api/v1/projects/{id}/constitution` | ✓ |
| Constitution Versions | `GET /api/v1/projects/{id}/constitution/versions` | ✓ |
| Schema | `GET/PUT /api/v1/projects/{id}/schema` | ✓ |
| Cases List | `GET /api/v1/projects/{id}/cases` | ✓ |
| Case Create | `POST /api/v1/projects/{id}/cases` | ✓ |
| Documents | `GET/POST /api/v1/cases/{id}/documents` | ✓ |
| Claims | `GET/PUT /api/v1/cases/{id}/claims` | ✓ |
| Evidence Graph | `GET /api/v1/cases/{id}/evidence-graph` | // backend_pending |
| Evaluation | `POST /api/v1/cases/{id}/evaluate` | ✓ |
| Fit/Misfit | `GET /api/v1/cases/{id}/fit-misfit` | ✓ |
| Exceptions | `GET/PUT /api/v1/cases/{id}/exceptions` | ✓ |
| Decision | `POST /api/v1/cases/{id}/decision` | ✓ |
| Precedent | `POST /api/v1/cases/{id}/precedent` | // backend_pending |
| Portfolio | `GET /api/v1/portfolios/{id}` | // backend_pending |
| Portfolio Delta | `POST /api/v1/portfolios/{id}/integrate` | // backend_pending |
| Reports | `GET/POST /api/v1/cases/{id}/reports` | ✓ |
| Certification | `POST /api/v1/reports/{id}/certify` | // backend_pending |
| Drift | `GET /api/v1/monitoring/drift` | // backend_pending |
| Revisions | `GET/POST /api/v1/baselines/revisions` | // backend_pending |
| Users | `GET/POST /api/v1/admin/users` | // backend_pending |

---

## PART 10: IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Tailwind with enterprise theme
- [ ] Create base component library (tables, forms, badges)
- [ ] Implement global navigation
- [ ] Implement Active Context Header
- [ ] Implement Workflow Rail component

### Phase 2: Steps 1-3 (Setup)
- [ ] Project creation flow
- [ ] Constitution editor with versioning
- [ ] Schema editor with versioning
- [ ] Case intake with envelope locking

### Phase 3: Steps 4-6 (Evidence & Evaluation)
- [ ] Document upload and preview
- [ ] Claims extraction and review
- [ ] Evidence graph visualization
- [ ] Policy evaluation runner
- [ ] Fit/Misfit map display
- [ ] Exception register

### Phase 4: Steps 7-9 (Decision & Reporting)
- [ ] Decision entry form
- [ ] Precedent creation
- [ ] Portfolio integration
- [ ] Report editor
- [ ] Certification workflow

### Phase 5: Step 10 & Cross-cutting
- [ ] Monitoring dashboard
- [ ] Drift detection
- [ ] Baseline revision workflow
- [ ] Global audit trail viewer
- [ ] Admin UI

### Phase 6: Polish
- [ ] Gating validation tests
- [ ] Accessibility review
- [ ] Performance optimization
- [ ] Documentation

---

## APPENDIX: GATING CONDITIONS SUMMARY

| Step | Cannot Proceed Until |
|------|---------------------|
| 1→2 | Constitution version is `active` |
| 2→3 | Schema version is `active` |
| 3→4 | Decision envelope is locked |
| 4→5 | Minimum evidence completeness met |
| 5→6 | Fit/Misfit map generated and signed off |
| 6→7 | All exceptions resolved OR justified with sign-off |
| 7→8 | Decision artifact recorded |
| 8→9 | Portfolio delta computed |
| 9→10 | Report certified with all statements traceable |
| 10→1 | Revision proposals reviewed and approved |

**This is the investable-grade differentiator: enforced workflow integrity.**
