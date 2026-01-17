# JURIS UI Master Rebuild Plan

## Current Status Assessment

### Already Implemented (Phases 1-5)
- ✅ 10-step workflow pages (Steps 1-10)
- ✅ Project management (list, detail, constitution, schema)
- ✅ Case management (intake through monitoring)
- ✅ Basic layout components (Sidebar, WorkflowRail, AppLayout)
- ✅ Domain types and ActiveContext

### Missing from Master Prompt Requirements

#### Prompt 1 - UI Architecture & Core Objects
- [ ] Organization (tenant) - `backend_pending`
- [ ] Users management - `backend_pending`
- [ ] Roles & permissions - `backend_pending`
- [ ] Workspaces (Funds/Divisions/Lines of Business)
- [ ] Portfolios as first-class entity (separate from case workflow)
- [ ] Global top bar with context awareness
- [ ] Inspector drawer pattern

#### Prompt 2 - Design System
- [ ] Formalize typography scale
- [ ] Formalize color system documentation
- [ ] Standard component patterns (inspector drawers, wizards)

#### Prompt 3 - Admin & Configuration
- [ ] Admin section with settings
- [ ] Industry profile selection (VC/Pharma/Insurance)
- [ ] Evaluation parameter defaults
- [ ] Benchmark template management
- [ ] User management placeholders

#### Prompt 4 - Document Management
- [ ] Dedicated Documents area (not just per-case)
- [ ] Document inbox for unassigned documents
- [ ] Trust/provenance indicators
- [ ] Bulk operations

#### Prompt 5 - Projects Enhancement
- [ ] Under Evaluation vs In Portfolio separation
- [ ] Project lifecycle status
- [ ] Completeness indicators
- [ ] Change detection vs previous run

#### Prompt 6 - Evaluation Wizard
- [ ] Formal wizard flow for evaluations
- [ ] Parameter override UI
- [ ] Benchmark selection
- [ ] Delta comparison

#### Prompt 7 - Claims & Evidence
- [ ] Dedicated Claims table view
- [ ] Graph view (optional/advanced)
- [ ] Inspector drawer for claim details
- [ ] Conflict highlighting

#### Prompt 8 - Portfolios (First-Class)
- [ ] Portfolio list and detail pages
- [ ] Composition management
- [ ] Distribution metrics
- [ ] Industry-parameterized views

#### Prompt 9 - Process Awareness
- [ ] Persistent process bar/breadcrumb
- [ ] "What's next" guidance
- [ ] State change protection

#### Prompt 10 - Integration
- [ ] Backend dependency map
- [ ] Mock adapters
- [ ] TODO consolidation

---

## Implementation Order

### Phase A: Foundation Enhancement
1. Enhanced domain types for new entities
2. Global navigation restructure
3. Top bar with context awareness
4. Inspector drawer component

### Phase B: Admin & Configuration
1. Admin layout and navigation
2. Organization settings
3. Industry profile configuration
4. Evaluation parameter defaults
5. User management (placeholder)
6. Benchmark templates

### Phase C: Document Management
1. Documents list page
2. Document detail/inspector
3. Unassigned inbox
4. Bulk operations UI
5. Trust indicators

### Phase D: Enhanced Projects & Portfolios
1. Project lifecycle states
2. Under Evaluation vs In Portfolio views
3. Portfolio as first-class entity
4. Portfolio composition UI
5. Distribution metrics

### Phase E: Evaluation Wizard & Claims
1. Run wizard component
2. Parameter configuration
3. Claims table view
4. Claims inspector drawer
5. Graph view (optional)

### Phase F: Process Awareness & Polish
1. Process awareness bar
2. Breadcrumb system
3. State protection
4. Final integration

---

## Route Map (Complete)

```
/                                    → Dashboard/Home
/admin                               → Admin overview
/admin/organization                  → Organization settings
/admin/users                         → User management (placeholder)
/admin/roles                         → Roles & permissions (placeholder)
/admin/benchmarks                    → Benchmark templates
/admin/parameters                    → Default evaluation parameters

/workspaces                          → Workspaces list
/workspaces/[id]                     → Workspace detail

/documents                           → All documents
/documents/inbox                     → Unassigned documents
/documents/[id]                      → Document detail

/projects                            → Projects list (existing)
/projects/[id]                       → Project detail (existing)
/projects/[id]/constitution          → Constitution management (existing)
/projects/[id]/constitution/new      → New constitution (existing)
/projects/[id]/schema                → Schema management (existing)
/projects/[id]/schema/new            → New schema (existing)
/projects/[id]/cases/new             → Case intake (existing)

/cases                               → Cases list (existing)
/cases/[id]                          → Case detail (existing)
/cases/[id]/evidence                 → Evidence ingestion (existing)
/cases/[id]/evaluation               → Policy evaluation (existing)
/cases/[id]/exceptions               → Exception analysis (existing)
/cases/[id]/decision                 → Decision & precedent (existing)
/cases/[id]/portfolio                → Portfolio integration (existing)
/cases/[id]/reporting                → Certified reporting (existing)
/cases/[id]/monitoring               → Monitoring & drift (existing)

/portfolios                          → Portfolios list
/portfolios/[id]                     → Portfolio detail
/portfolios/[id]/composition         → Portfolio composition
/portfolios/[id]/metrics             → Distribution metrics

/claims                              → Global claims view
/claims/[id]                         → Claim detail (inspector)
```

---

## Backend Dependency Map

| Feature | Backend Status | Mock Strategy |
|---------|---------------|---------------|
| Organization | `backend_pending` | Local state |
| Users | `backend_pending` | Mock user list |
| Roles | `backend_pending` | Static role definitions |
| Workspaces | `backend_pending` | Mock workspace data |
| Documents | `partial` | Evidence API exists |
| Projects | `partial` | Mock with domain types |
| Cases | `partial` | Mock with workflow |
| Portfolios | `backend_pending` | UI-level composition |
| Benchmarks | `backend_pending` | Static templates |
| Evaluations | `partial` | Mock run history |
| Claims | `partial` | Mock extraction data |

---

## Component Hierarchy

```
App
├── Providers
│   ├── ActiveContextProvider
│   ├── ThemeProvider
│   └── ToastProvider (to add)
├── Layout
│   ├── GlobalTopBar
│   │   ├── OrganizationSwitcher
│   │   ├── WorkspaceSwitcher
│   │   ├── ProcessAwarenessBar
│   │   ├── SearchCommand
│   │   └── UserMenu
│   ├── Sidebar
│   │   ├── Navigation
│   │   └── QuickActions
│   └── MainContent
│       ├── PageHeader
│       ├── PageContent
│       └── InspectorDrawer
├── Pages
│   ├── Admin/*
│   ├── Documents/*
│   ├── Projects/*
│   ├── Cases/*
│   ├── Portfolios/*
│   └── Claims/*
└── Shared
    ├── DataTable
    ├── InspectorDrawer
    ├── WizardFlow
    ├── StatusBadge
    ├── RiskIndicator
    └── ProcessBar
```
