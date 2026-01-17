/**
 * Test Fixtures
 * Provides consistent test data for all unit tests
 */

// ================================
// USER FIXTURES
// ================================
export const testUsers = {
  owner: {
    id: 'user-owner-123',
    email: 'owner@testcompany.com',
    name: 'Test Owner',
    password: '$2a$12$hashedpassword123', // bcrypt hash of 'password123'
    companyId: 'company-123',
    companyRole: 'OWNER',
    legacyRole: 'analyst',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  admin: {
    id: 'user-admin-456',
    email: 'admin@testcompany.com',
    name: 'Test Admin',
    password: '$2a$12$hashedpassword456',
    companyId: 'company-123',
    companyRole: 'ORG_ADMIN',
    legacyRole: 'analyst',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  member: {
    id: 'user-member-789',
    email: 'member@testcompany.com',
    name: 'Test Member',
    password: '$2a$12$hashedpassword789',
    companyId: 'company-123',
    companyRole: 'MEMBER',
    legacyRole: 'analyst',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  otherCompanyUser: {
    id: 'user-other-999',
    email: 'user@othercompany.com',
    name: 'Other User',
    password: '$2a$12$hashedpassword999',
    companyId: 'company-other',
    companyRole: 'MEMBER',
    legacyRole: 'analyst',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
  // Maker-Checker workflow specific users
  maker: {
    id: 'user-maker-001',
    email: 'maker@testcompany.com',
    name: 'Portfolio Maker',
    password: '$2a$12$hashedpasswordmaker',
    companyId: 'company-123',
    companyRole: 'MEMBER',
    legacyRole: 'analyst',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  checker: {
    id: 'user-checker-001',
    email: 'checker@testcompany.com',
    name: 'Portfolio Checker',
    password: '$2a$12$hashedpasswordchecker',
    companyId: 'company-123',
    companyRole: 'MEMBER',
    legacyRole: 'analyst',
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
  },
  viewer: {
    id: 'user-viewer-001',
    email: 'viewer@testcompany.com',
    name: 'Portfolio Viewer',
    password: '$2a$12$hashedpasswordviewer',
    companyId: 'company-123',
    companyRole: 'VIEWER',
    legacyRole: 'analyst',
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07'),
  },
};

// ================================
// COMPANY FIXTURES
// ================================
export const testCompanies = {
  primary: {
    id: 'company-123',
    name: 'Test Company',
    slug: 'test-company',
    industryProfile: 'VENTURE_CAPITAL',
    settings: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  insurance: {
    id: 'company-insurance',
    name: 'Insurance Corp',
    slug: 'insurance-corp',
    industryProfile: 'INSURANCE',
    settings: {},
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  pharma: {
    id: 'company-pharma',
    name: 'Pharma Inc',
    slug: 'pharma-inc',
    industryProfile: 'PHARMA',
    settings: {},
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  other: {
    id: 'company-other',
    name: 'Other Company',
    slug: 'other-company',
    industryProfile: 'GENERIC',
    settings: {},
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
};

// ================================
// PORTFOLIO FIXTURES
// ================================
export const testPortfolios = {
  active: {
    id: 'portfolio-active-123',
    companyId: 'company-123',
    mandateId: 'mandate-123',
    name: 'Active Portfolio',
    description: 'An active test portfolio',
    portfolioType: 'FUND',
    status: 'ACTIVE',
    activeBaselineVersionId: 'baseline-v1',
    constraints: {
      maxPositions: 50,
      maxSinglePositionPct: 20,
      maxSectorConcentrationPct: 40,
      minDiversification: 5,
    },
    composition: {
      totalValue: 10000000,
      totalCommitted: 15000000,
      positions: [],
    },
    metrics: {
      utilization: 0.67,
      diversificationScore: 0.8,
      riskScore: 0.3,
      performanceIndex: 1.15,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  draft: {
    id: 'portfolio-draft-456',
    companyId: 'company-123',
    mandateId: null,
    name: 'Draft Portfolio',
    description: 'A draft portfolio',
    portfolioType: 'FUND',
    status: 'DRAFT',
    activeBaselineVersionId: null,
    constraints: {},
    composition: { totalValue: 0, totalCommitted: 0, positions: [] },
    metrics: { utilization: 0, diversificationScore: 0, riskScore: 0.3, performanceIndex: 1 },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  otherCompany: {
    id: 'portfolio-other-789',
    companyId: 'company-other',
    mandateId: null,
    name: 'Other Company Portfolio',
    description: 'Portfolio belonging to another company',
    portfolioType: 'FUND',
    status: 'ACTIVE',
    activeBaselineVersionId: null,
    constraints: {},
    composition: { totalValue: 5000000, totalCommitted: 5000000, positions: [] },
    metrics: { utilization: 1, diversificationScore: 0.5, riskScore: 0.5, performanceIndex: 1 },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
};

// ================================
// BASELINE VERSION FIXTURES
// ================================
export const testBaselineVersions = {
  draft: {
    id: 'baseline-draft-123',
    portfolioId: 'portfolio-active-123',
    versionNumber: 2,
    status: 'DRAFT',
    schemaVersion: 1,
    parentVersionId: 'baseline-v1',
    createdById: 'user-admin-456',
    changeSummary: 'Draft changes to baseline',
    submittedAt: null,
    submittedById: null,
    approvedAt: null,
    approvedById: null,
    rejectedAt: null,
    rejectedById: null,
    rejectionReason: null,
    publishedAt: null,
    publishedById: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  pendingApproval: {
    id: 'baseline-pending-456',
    portfolioId: 'portfolio-active-123',
    versionNumber: 3,
    status: 'PENDING_APPROVAL',
    schemaVersion: 1,
    parentVersionId: 'baseline-draft-123',
    createdById: 'user-admin-456',
    changeSummary: 'Submitted for approval',
    submittedAt: new Date('2024-02-10'),
    submittedById: 'user-member-789',
    approvedAt: null,
    approvedById: null,
    rejectedAt: null,
    rejectedById: null,
    rejectionReason: null,
    publishedAt: null,
    publishedById: null,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-10'),
  },
  published: {
    id: 'baseline-v1',
    portfolioId: 'portfolio-active-123',
    versionNumber: 1,
    status: 'PUBLISHED',
    schemaVersion: 1,
    parentVersionId: null,
    createdById: 'user-owner-123',
    changeSummary: 'Initial baseline',
    submittedAt: new Date('2024-01-05'),
    submittedById: 'user-owner-123',
    approvedAt: new Date('2024-01-06'),
    approvedById: 'user-owner-123',
    rejectedAt: null,
    rejectedById: null,
    rejectionReason: null,
    publishedAt: new Date('2024-01-06'),
    publishedById: 'user-owner-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-06'),
  },
  rejected: {
    id: 'baseline-rejected-789',
    portfolioId: 'portfolio-active-123',
    versionNumber: 4,
    status: 'REJECTED',
    schemaVersion: 1,
    parentVersionId: 'baseline-v1',
    createdById: 'user-member-789',
    changeSummary: 'Changes that were rejected',
    submittedAt: new Date('2024-02-15'),
    submittedById: 'user-member-789',
    approvedAt: null,
    approvedById: null,
    rejectedAt: new Date('2024-02-16'),
    rejectedById: 'user-owner-123',
    rejectionReason: 'Missing required data',
    publishedAt: null,
    publishedById: null,
    createdAt: new Date('2024-02-12'),
    updatedAt: new Date('2024-02-16'),
  },
};

// ================================
// BASELINE MODULE FIXTURES
// ================================
export const testBaselineModules = {
  investmentThesis: {
    id: 'module-thesis-123',
    baselineVersionId: 'baseline-draft-123',
    moduleType: 'INVESTMENT_THESIS',
    schemaVersion: 1,
    payload: {
      thesisStatement: 'Test thesis',
      investmentObjectives: ['Growth', 'Innovation'],
      targetSectors: ['Technology', 'Healthcare'],
    },
    isComplete: true,
    isValid: true,
    updatedById: 'user-admin-456',
    updatedAt: new Date('2024-02-01'),
    createdAt: new Date('2024-02-01'),
  },
  riskManagement: {
    id: 'module-risk-456',
    baselineVersionId: 'baseline-draft-123',
    moduleType: 'RISK_MANAGEMENT',
    schemaVersion: 1,
    payload: {
      riskTolerance: 'MODERATE',
      maxDrawdown: 20,
      hedgingStrategy: 'None',
    },
    isComplete: false,
    isValid: true,
    updatedById: 'user-admin-456',
    updatedAt: new Date('2024-02-01'),
    createdAt: new Date('2024-02-01'),
  },
};

// ================================
// INVITATION FIXTURES
// ================================
export const testInvitations = {
  pending: {
    id: 'invite-pending-123',
    companyId: 'company-123',
    email: 'newuser@example.com',
    name: 'New User',
    role: 'MEMBER',
    portfolioAccess: [],
    token: 'invite-token-abc123',
    status: 'PENDING',
    invitedById: 'user-owner-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    acceptedAt: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  expired: {
    id: 'invite-expired-456',
    companyId: 'company-123',
    email: 'expireduser@example.com',
    name: 'Expired User',
    role: 'MEMBER',
    portfolioAccess: [],
    token: 'invite-token-expired',
    status: 'PENDING',
    invitedById: 'user-owner-123',
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    acceptedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  accepted: {
    id: 'invite-accepted-789',
    companyId: 'company-123',
    email: 'accepteduser@example.com',
    name: 'Accepted User',
    role: 'MEMBER',
    portfolioAccess: [],
    token: 'invite-token-accepted',
    status: 'ACCEPTED',
    invitedById: 'user-owner-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    acceptedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
};

// ================================
// MANDATE FIXTURES
// ================================
export const testMandates = {
  primary: {
    id: 'mandate-123',
    companyId: 'company-123',
    name: 'Primary Fund Mandate',
    description: 'Main investment mandate',
    status: 'ACTIVE',
    mandateType: 'PRIMARY',
    mandateData: {
      investmentStrategy: 'Growth equity',
      targetSectors: ['Technology', 'Healthcare'],
      geographicFocus: ['North America', 'Europe'],
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  thematic: {
    id: 'mandate-thematic-456',
    companyId: 'company-123',
    name: 'Climate Tech Thematic',
    description: 'Thematic mandate for climate technology',
    status: 'ACTIVE',
    mandateType: 'THEMATIC',
    mandateData: {
      theme: 'Climate Technology',
      impactMetrics: ['Carbon reduction', 'Renewable energy'],
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
};

// ================================
// MANDATE TEMPLATE FIXTURES
// ================================
export const testMandateTemplates = {
  systemVC: {
    id: 'template-system-vc',
    name: 'VC Primary Fund Template',
    type: 'PRIMARY',
    description: 'System template for VC primary funds',
    industry: 'VENTURE_CAPITAL',
    mandateData: {
      defaultStrategy: 'Early stage',
      typicalCheckSize: { min: 500000, max: 5000000 },
    },
    isDefault: true,
    isSystem: true,
    companyId: null,
    createdById: null,
    version: 1,
    category: 'Investment',
    tags: ['VC', 'Primary'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  companyCustom: {
    id: 'template-company-custom',
    name: 'Custom Company Template',
    type: 'THEMATIC',
    description: 'Company-specific thematic template',
    industry: 'VENTURE_CAPITAL',
    mandateData: {
      theme: 'AI/ML',
      customFields: { specialRequirement: true },
    },
    isDefault: false,
    isSystem: false,
    companyId: 'company-123',
    createdById: 'user-owner-123',
    version: 1,
    category: 'Thematic',
    tags: ['Custom', 'AI'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
};

// ================================
// PORTFOLIO MEMBER FIXTURES
// ================================
export const testPortfolioMembers = {
  maker: {
    id: 'member-maker-123',
    portfolioId: 'portfolio-active-123',
    userId: 'user-maker-001',
    accessLevel: 'MAKER',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  checker: {
    id: 'member-checker-456',
    portfolioId: 'portfolio-active-123',
    userId: 'user-checker-001',
    accessLevel: 'CHECKER',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  viewer: {
    id: 'member-viewer-789',
    portfolioId: 'portfolio-active-123',
    userId: 'user-viewer-001',
    accessLevel: 'VIEWER',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  // Additional portfolio membership for second portfolio
  makerOnPortfolio2: {
    id: 'member-maker-p2-123',
    portfolioId: 'portfolio-draft-456',
    userId: 'user-maker-001',
    accessLevel: 'MAKER',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  checkerOnPortfolio2: {
    id: 'member-checker-p2-456',
    portfolioId: 'portfolio-draft-456',
    userId: 'user-checker-001',
    accessLevel: 'CHECKER',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
};

// ================================
// EXCLUSION TEMPLATE FIXTURES
// ================================
export const testExclusionTemplates = {
  // VC Industry Templates
  vcSanctions: {
    id: 'vc-excl-sanctions',
    name: 'Sanctioned Jurisdictions',
    type: 'HARD' as const,
    description: 'Investments in sanctioned countries are prohibited',
    industry: 'VENTURE_CAPITAL',
    isDefault: true,
    exclusion: {
      name: 'Sanctioned Jurisdictions',
      type: 'HARD' as const,
      dimension: 'jurisdiction',
      operator: 'IN' as const,
      values: ['RU', 'IR', 'KP', 'SY', 'CU'],
      rationale: 'OFAC/EU sanctions compliance - investments prohibited',
    },
  },
  vcCrypto: {
    id: 'vc-excl-crypto',
    name: 'Cryptocurrency (Conditional)',
    type: 'CONDITIONAL' as const,
    description: 'Crypto-related companies require additional review',
    industry: 'VENTURE_CAPITAL',
    isDefault: true,
    exclusion: {
      name: 'Cryptocurrency Investments',
      type: 'CONDITIONAL' as const,
      dimension: 'technology',
      operator: 'CONTAINS' as const,
      values: ['cryptocurrency', 'blockchain', 'defi'],
      rationale: 'Regulatory uncertainty - requires partner approval',
      condition: 'Partner committee approval required',
      approvalRequired: { roles: ['partner'], minApprovers: 1 },
    },
  },
  vcTobacco: {
    id: 'vc-excl-tobacco',
    name: 'Tobacco/Vaping',
    type: 'HARD' as const,
    description: 'No investments in tobacco or vaping companies',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    exclusion: {
      name: 'Tobacco/Vaping Exclusion',
      type: 'HARD' as const,
      dimension: 'sector',
      operator: 'IN' as const,
      values: ['tobacco', 'vaping', 'e-cigarettes'],
      rationale: 'ESG policy - excluded sector',
    },
  },

  // Insurance Industry Templates
  insuranceCatAccumulation: {
    id: 'ins-excl-cat-accumulation',
    name: 'CAT Accumulation Breach',
    type: 'HARD' as const,
    description: 'Risks that would exceed CAT accumulation limits',
    industry: 'INSURANCE',
    isDefault: true,
    exclusion: {
      name: 'CAT Accumulation Limit',
      type: 'HARD' as const,
      dimension: 'catZone',
      operator: 'IN' as const,
      values: ['ZONE_A', 'ZONE_B'],
      rationale: 'Reinsurance treaty CAT accumulation limits exceeded',
    },
  },
  insuranceCyberControls: {
    id: 'ins-excl-cyber-controls',
    name: 'Inadequate Cyber Controls',
    type: 'CONDITIONAL' as const,
    description: 'Risks with inadequate cyber security controls',
    industry: 'INSURANCE',
    isDefault: true,
    exclusion: {
      name: 'Cyber Security Controls',
      type: 'CONDITIONAL' as const,
      dimension: 'cyberMaturity',
      operator: 'LESS_THAN' as const,
      values: ['3'],
      rationale: 'Minimum cyber maturity score not met',
      condition: 'Underwriter sign-off with remediation plan',
      approvalRequired: { roles: ['underwriter', 'risk_manager'], minApprovers: 1 },
    },
  },
  insuranceSanctions: {
    id: 'ins-excl-sanctions',
    name: 'Sanctioned Entities',
    type: 'HARD' as const,
    description: 'Entities on sanctions lists',
    industry: 'INSURANCE',
    isDefault: true,
    exclusion: {
      name: 'Sanctions List',
      type: 'HARD' as const,
      dimension: 'sanctionsStatus',
      operator: 'EQUALS' as const,
      values: ['listed'],
      rationale: 'Regulatory compliance - sanctioned entity',
    },
  },

  // Pharma Industry Templates
  pharmaSafetySignal: {
    id: 'pharma-excl-safety',
    name: 'Safety Signal Detected',
    type: 'HARD' as const,
    description: 'Assets with unresolved safety signals',
    industry: 'PHARMA',
    isDefault: true,
    exclusion: {
      name: 'Safety Signal Exclusion',
      type: 'HARD' as const,
      dimension: 'safetyProfile',
      operator: 'IN' as const,
      values: ['black_box_warning', 'clinical_hold', 'safety_signal_unresolved'],
      rationale: 'Unacceptable safety risk profile',
    },
  },
  pharmaIPStatus: {
    id: 'pharma-excl-ip',
    name: 'IP Status Concerns',
    type: 'CONDITIONAL' as const,
    description: 'Assets with IP concerns require review',
    industry: 'PHARMA',
    isDefault: true,
    exclusion: {
      name: 'IP Status Review',
      type: 'CONDITIONAL' as const,
      dimension: 'ipStatus',
      operator: 'IN' as const,
      values: ['contested', 'expiring_soon', 'weak_protection'],
      rationale: 'IP protection concerns - requires legal review',
      condition: 'Legal and BD team review',
      approvalRequired: { roles: ['legal', 'bd_head'], minApprovers: 2 },
    },
  },
  pharmaRegulatoryPath: {
    id: 'pharma-excl-regulatory',
    name: 'No Clear Regulatory Path',
    type: 'HARD' as const,
    description: 'Assets without clear regulatory approval pathway',
    industry: 'PHARMA',
    isDefault: false,
    exclusion: {
      name: 'Regulatory Path Exclusion',
      type: 'HARD' as const,
      dimension: 'regulatoryPathway',
      operator: 'EQUALS' as const,
      values: ['unclear', 'blocked'],
      rationale: 'No viable regulatory approval pathway identified',
    },
  },
};

// ================================
// EXCLUSION ITEM FIXTURES
// ================================
export const testExclusionItems = {
  hardExclusion: {
    id: 'excl-item-hard-123',
    name: 'Sanctioned Countries',
    type: 'HARD' as const,
    dimension: 'jurisdiction',
    operator: 'IN' as const,
    values: ['RU', 'IR', 'KP'],
    rationale: 'OFAC sanctions compliance',
  },
  conditionalExclusion: {
    id: 'excl-item-cond-456',
    name: 'High Risk Sectors',
    type: 'CONDITIONAL' as const,
    dimension: 'sector',
    operator: 'IN' as const,
    values: ['gambling', 'adult_entertainment'],
    rationale: 'ESG concerns - requires committee review',
    condition: 'Investment committee approval with ESG assessment',
    approvalRequired: { roles: ['investment_committee'], minApprovers: 2 },
  },
  dateRestrictedExclusion: {
    id: 'excl-item-date-789',
    name: 'Temporary Market Exclusion',
    type: 'HARD' as const,
    dimension: 'market',
    operator: 'EQUALS' as const,
    values: ['emerging_markets'],
    rationale: 'Temporary exclusion during market volatility',
    effectiveFrom: new Date('2024-01-01'),
    effectiveUntil: new Date('2024-06-30'),
  },
};

// ================================
// EXCLUSIONS MODULE PAYLOAD FIXTURES
// ================================
export const testExclusionsModulePayloads = {
  vcPortfolio: {
    exclusions: [
      testExclusionItems.hardExclusion,
      testExclusionItems.conditionalExclusion,
    ],
    reviewSchedule: 'QUARTERLY',
    lastReviewDate: '2024-01-15',
    nextReviewDate: '2024-04-15',
  },
  insuranceBook: {
    exclusions: [
      {
        id: 'ins-excl-1',
        name: 'CAT Zone Limit',
        type: 'HARD' as const,
        dimension: 'catZone',
        operator: 'IN' as const,
        values: ['ZONE_A'],
        rationale: 'Reinsurance treaty limit',
      },
    ],
    reviewSchedule: 'MONTHLY',
    lastReviewDate: '2024-02-01',
    nextReviewDate: '2024-03-01',
  },
  pharmaPipeline: {
    exclusions: [
      {
        id: 'pharma-excl-1',
        name: 'Clinical Hold',
        type: 'HARD' as const,
        dimension: 'developmentStatus',
        operator: 'EQUALS' as const,
        values: ['clinical_hold'],
        rationale: 'FDA clinical hold - cannot proceed',
      },
    ],
    reviewSchedule: 'QUARTERLY',
    lastReviewDate: '2024-01-01',
    nextReviewDate: '2024-04-01',
  },
  empty: {
    exclusions: [],
    reviewSchedule: 'QUARTERLY',
    lastReviewDate: null,
    nextReviewDate: null,
  },
};
