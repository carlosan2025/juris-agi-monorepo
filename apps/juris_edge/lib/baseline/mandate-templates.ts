/**
 * Mandate Templates and Industry Guidance
 *
 * This file contains:
 * 1. Industry-specific mandate templates with pre-filled data
 * 2. Guidance on typical mandate counts per industry
 * 3. Field explanations and hints per industry
 * 4. Default mandate sets for quick setup
 *
 * Templates are UI-only helpers - they create valid MandateDefinition objects
 * but don't change the underlying baseline schema.
 */

import { MandateDefinition, MandateType } from './types';

// =============================================================================
// MANDATE TYPE DESCRIPTIONS (Universal across industries)
// =============================================================================

export const MANDATE_TYPE_INFO: Record<MandateType, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  PRIMARY: {
    label: 'Primary',
    description: 'Core mandate defining the main investment/underwriting strategy. Every portfolio should have exactly one.',
    icon: 'Target',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  THEMATIC: {
    label: 'Thematic',
    description: 'Specialized focus area within the primary mandate. Used to concentrate on specific sectors, themes, or strategies.',
    icon: 'Layers',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  CARVEOUT: {
    label: 'Carveout',
    description: 'Specific allocation carved out from the main mandate. Used for follow-ons, special situations, or separate governance.',
    icon: 'Scissors',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

// =============================================================================
// INDUSTRY GUIDANCE
// =============================================================================

export interface IndustryMandateGuidance {
  recommendedCount: {
    default: number;
    min: number;
    max: number;
    typical: string;
    complex: string;
  };
  mandatePatterns: {
    type: MandateType;
    name: string;
    description: string;
    whenToUse: string;
  }[];
  fieldHints: {
    geography: string;
    domains: string;
    stages: string;
    sizing: string;
    hardConstraints: string;
  };
  sizingLabels: {
    min: string;
    max: string;
    target?: string;
    unit: string;
    currency?: string;
    additionalFields?: { key: string; label: string; hint: string }[];
  };
  commonHardConstraints: string[];
}

export const INDUSTRY_MANDATE_GUIDANCE: Record<string, IndustryMandateGuidance> = {
  VENTURE_CAPITAL: {
    recommendedCount: {
      default: 1,
      min: 1,
      max: 8,
      typical: '2-4 mandates (PRIMARY + 1-3 THEMATIC/CARVEOUT)',
      complex: '5-8 mandates for multi-strategy or multiple verticals',
    },
    mandatePatterns: [
      {
        type: 'PRIMARY',
        name: 'Core Fund Mandate',
        description: 'Broad investment strategy covering target stages, geography, and themes',
        whenToUse: 'Every fund should have exactly one PRIMARY mandate defining the core strategy',
      },
      {
        type: 'THEMATIC',
        name: 'Sector/Theme Focus',
        description: 'AI/Robotics/Climate/Defense - narrow scope within primary',
        whenToUse: 'When you want to concentrate allocation on specific verticals or themes',
      },
      {
        type: 'CARVEOUT',
        name: 'Follow-on Reserve / Opportunities',
        description: 'Separate entry vs follow-on, or special situations',
        whenToUse: 'To manage follow-on reserves separately, or for bridge rounds and secondaries',
      },
    ],
    fieldHints: {
      geography: 'Target regions/countries for investments (e.g., North America, Europe, Global)',
      domains: 'Sectors and themes (e.g., Enterprise SaaS, FinTech, Climate Tech, AI/ML)',
      stages: 'Investment stages (e.g., Seed, Series A, Series B, Growth)',
      sizing: 'Check sizes and ownership targets. Include ticketMin/Max, ownershipMin/Max%, reserve policy',
      hardConstraints: 'Deal-level rules that cannot be violated (e.g., no sanctioned entities, min revenue thresholds)',
    },
    sizingLabels: {
      min: 'Min Check Size',
      max: 'Max Check Size',
      target: 'Target Check',
      unit: 'USD',
      currency: 'USD',
      additionalFields: [
        { key: 'ownershipMinPct', label: 'Min Ownership %', hint: 'Target minimum ownership stake' },
        { key: 'ownershipMaxPct', label: 'Max Ownership %', hint: 'Maximum ownership stake' },
        { key: 'reservePolicyPct', label: 'Reserve Policy %', hint: 'Follow-on reserve allocation' },
      ],
    },
    commonHardConstraints: [
      'No sanctioned entities or individuals',
      'No tobacco, weapons, or gambling',
      'No pure services businesses',
      'No consumer social media',
      'Minimum revenue threshold',
      'Maximum valuation cap',
      'Required founder commitment',
    ],
  },

  INSURANCE: {
    recommendedCount: {
      default: 1,
      min: 1,
      max: 15,
      typical: '2-6 programs (segmented by LOB and/or territory)',
      complex: '7-15 programs for multi-LOB carrier with multiple products',
    },
    mandatePatterns: [
      {
        type: 'PRIMARY',
        name: 'Book-wide Underwriting Policy',
        description: 'Overall underwriting envelope defining risk appetite and limits',
        whenToUse: 'Every book should have exactly one PRIMARY defining the overall policy',
      },
      {
        type: 'THEMATIC',
        name: 'Line of Business Program',
        description: 'Cyber, Property, D&O - specific line with own limits and criteria',
        whenToUse: 'To define specific underwriting rules for each line of business',
      },
      {
        type: 'CARVEOUT',
        name: 'Delegated Authority / Special Program',
        description: 'Programs, affinity, delegated authority, new product pilots',
        whenToUse: 'For special distribution channels or new product testing under separate governance',
      },
    ],
    fieldHints: {
      geography: 'Target territories for underwriting (e.g., US, EU, Lloyd\'s Markets)',
      domains: 'Lines of business / product types (e.g., Cyber, D&O, Property, Casualty)',
      stages: 'Product variants or risk class tiers (e.g., SME, Mid-Market, Enterprise)',
      sizing: 'Limits and premium thresholds. Include limitMax, premiumMin/Max, attachmentPoint',
      hardConstraints: 'Underwriting rules that cannot be violated (e.g., max limit, prohibited territories)',
    },
    sizingLabels: {
      min: 'Min Premium',
      max: 'Max Limit',
      unit: 'USD',
      currency: 'USD',
      additionalFields: [
        { key: 'limitMax', label: 'Max Limit', hint: 'Maximum policy limit' },
        { key: 'attachmentPoint', label: 'Attachment Point', hint: 'For excess coverage' },
        { key: 'premiumMin', label: 'Min Premium', hint: 'Minimum acceptable premium' },
        { key: 'premiumMax', label: 'Max Premium', hint: 'Maximum premium per risk' },
      ],
    },
    commonHardConstraints: [
      'Maximum limit per risk',
      'Maximum aggregated event exposure',
      'Prohibited territories',
      'Minimum security controls (cyber)',
      'Maximum CAT exposure',
      'Prohibited industries',
      'Required attachment point',
      'Minimum premium threshold',
    ],
  },

  PHARMA: {
    recommendedCount: {
      default: 1,
      min: 1,
      max: 12,
      typical: '2-5 programs (by therapeutic area or modality)',
      complex: '6-12 programs for platform + multiple TAs/modalities',
    },
    mandatePatterns: [
      {
        type: 'PRIMARY',
        name: 'Pipeline Strategy',
        description: 'Overall R&D investment strategy defining focus areas and criteria',
        whenToUse: 'Every pipeline should have exactly one PRIMARY defining the overall strategy',
      },
      {
        type: 'THEMATIC',
        name: 'Therapeutic Area Focus',
        description: 'Oncology, CNS, Immunology - specific TA with own criteria',
        whenToUse: 'To define specific criteria for each therapeutic area or modality',
      },
      {
        type: 'CARVEOUT',
        name: 'In-licensing / Platform Bet',
        description: 'In-licensing vs internal R&D, or platform technology bets',
        whenToUse: 'To separate external deals from internal R&D, or isolate platform investments',
      },
    ],
    fieldHints: {
      geography: 'Target markets or where trials/rights apply (e.g., FDA Markets, EMA Markets, Global)',
      domains: 'Therapeutic areas and/or modalities (e.g., Oncology, Gene Therapy, mRNA)',
      stages: 'Development stages (e.g., Preclinical, Phase 1, Phase 2, Phase 3)',
      sizing: 'Program budgets and deal values. Include budgetMin/Max, dealValueMin/Max, maxYearsToPoC',
      hardConstraints: 'R&D rules that cannot be violated (e.g., required TPP elements, excluded safety profiles)',
    },
    sizingLabels: {
      min: 'Min Budget',
      max: 'Max Budget',
      unit: 'USD',
      currency: 'USD',
      additionalFields: [
        { key: 'dealValueMin', label: 'Min Deal Value', hint: 'For in-licensing deals' },
        { key: 'dealValueMax', label: 'Max Deal Value', hint: 'Maximum deal value' },
        { key: 'maxYearsToPoC', label: 'Max Years to PoC', hint: 'Maximum time to proof of concept' },
      ],
    },
    commonHardConstraints: [
      'Required target product profile elements',
      'Maximum CMC complexity',
      'Excluded safety profiles',
      'Excluded trial designs',
      'Required regulatory pathway feasibility',
      'Minimum patent runway',
      'Required competitive positioning',
      'Maximum development timeline',
    ],
  },

  GENERIC: {
    recommendedCount: {
      default: 1,
      min: 1,
      max: 10,
      typical: '1-3 mandates',
      complex: '4-10 mandates for complex portfolios',
    },
    mandatePatterns: [
      {
        type: 'PRIMARY',
        name: 'Core Mandate',
        description: 'Primary investment or operational strategy',
        whenToUse: 'Every portfolio should have exactly one PRIMARY mandate',
      },
      {
        type: 'THEMATIC',
        name: 'Focus Area',
        description: 'Specialized focus within the primary mandate',
        whenToUse: 'When you want to concentrate on specific areas',
      },
      {
        type: 'CARVEOUT',
        name: 'Special Allocation',
        description: 'Carved out allocation with separate governance',
        whenToUse: 'For special situations or separate oversight requirements',
      },
    ],
    fieldHints: {
      geography: 'Geographic scope for the mandate',
      domains: 'Areas of focus or specialization',
      stages: 'Lifecycle stages or maturity levels',
      sizing: 'Size parameters and thresholds',
      hardConstraints: 'Rules that cannot be violated',
    },
    sizingLabels: {
      min: 'Minimum',
      max: 'Maximum',
      unit: 'USD',
    },
    commonHardConstraints: [
      'Compliance requirements',
      'Risk limits',
      'Excluded categories',
    ],
  },
};

// =============================================================================
// MANDATE TEMPLATES
// =============================================================================

export interface MandateTemplate {
  id: string;
  name: string;
  type: MandateType;
  description: string;
  industry: string;
  isDefault: boolean;
  mandate: Omit<MandateDefinition, 'id'>;
}

// -----------------------------------------------------------------------------
// VC MANDATE TEMPLATES
// -----------------------------------------------------------------------------

const VC_TEMPLATES: MandateTemplate[] = [
  {
    id: 'tpl_vc_primary_core',
    name: 'Core Fund Mandate',
    type: 'PRIMARY',
    description: 'Invest in early-stage European deeptech companies with defensible technology and category-scale potential',
    industry: 'VENTURE_CAPITAL',
    isDefault: true,
    mandate: {
      name: 'Core Fund Mandate',
      type: 'PRIMARY',
      status: 'ACTIVE',
      priority: 1,
      description: 'Primary investment mandate focused on early-stage European deeptech companies with defensible technology and category-scale potential.',
      objective: {
        primary: 'Invest in early-stage European deeptech companies with defensible technology and category-scale potential.',
        secondary: [
          'Prioritize proprietary IP or durable technical moat',
          'Back founders with exceptional execution capacity',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU', 'Switzerland', 'Nordics'],
        },
        domains: {
          included: ['AI', 'Robotics', 'Future Compute', 'Applied Industrial Tech'],
        },
        stages: {
          included: ['Pre-Seed', 'Seed', 'Series A'],
        },
        sizing: {
          min: 500000,
          max: 5000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 5,
            ownershipTargetMaxPct: 20,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_1',
          name: 'No Sanctioned Jurisdictions',
          description: 'No sanctioned jurisdictions or sanctioned counterparties.',
          dimension: 'jurisdiction',
          operator: 'NOT_IN',
          values: ['sanctioned'],
          severity: 'BLOCKING',
          rationale: 'Compliance',
        },
        {
          id: 'HC_VC_2',
          name: 'No Regulatory Arbitrage',
          description: 'No businesses primarily dependent on regulatory arbitrage.',
          dimension: 'businessModel',
          operator: 'NOT_EQUALS',
          values: ['regulatory_arbitrage'],
          severity: 'BLOCKING',
          rationale: 'Fragile defensibility',
        },
        {
          id: 'HC_VC_3',
          name: 'No Deceptive Practices',
          description: 'No products whose core value proposition relies on deceptive user practices.',
          dimension: 'ethics',
          operator: 'NOT_EQUALS',
          values: ['deceptive'],
          severity: 'BLOCKING',
          rationale: 'Reputation and sustainability risk',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_vc_thematic_ai_infra',
    name: 'AI Infrastructure & Tooling',
    type: 'THEMATIC',
    description: 'Invest in infrastructure that enables reliable, secure, efficient deployment and operations of AI systems',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'AI Infrastructure & Tooling',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 10,
      description: 'Thematic focus on infrastructure enabling reliable, secure, and efficient deployment of AI systems.',
      objective: {
        primary: 'Invest in infrastructure that enables reliable, secure, efficient deployment and operations of AI systems.',
        secondary: [
          'Prefer enterprise buyers with compliance-driven pain',
          'Avoid commodity wrappers without durable moat',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['AI Infrastructure', 'MLOps', 'Inference Optimization', 'Model Security', 'Data Governance'],
        },
        stages: {
          included: ['Seed', 'Series A'],
        },
        sizing: {
          min: 750000,
          max: 4000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 7,
            ownershipTargetMaxPct: 18,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_AIINF_1',
          name: 'Durable Moat Required',
          description: 'Must demonstrate moat beyond prompt-wrapping (data, integrations, IP, distribution).',
          dimension: 'defensibility',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Commodity risk',
        },
        {
          id: 'HC_VC_AIINF_2',
          name: 'Clear Enterprise Buyer',
          description: 'Must have a clear enterprise buyer and willingness-to-pay evidence (pilots, LOIs, pipeline).',
          dimension: 'gtm',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'GTM clarity',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_vc_thematic_robotics',
    name: 'Robotics & Autonomous Systems',
    type: 'THEMATIC',
    description: 'Invest in robotics and autonomy delivering measurable productivity gains in industrial and logistics environments',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Robotics & Autonomous Systems',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 11,
      description: 'Thematic focus on robotics and autonomy for industrial and logistics productivity gains.',
      objective: {
        primary: 'Invest in robotics and autonomy delivering measurable productivity gains in industrial and logistics environments.',
        secondary: [
          'Prefer deployments in constrained environments',
          'Prioritize safety and reliability engineering',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU', 'Nordics'],
        },
        domains: {
          included: ['Industrial Robotics', 'Logistics Automation', 'Autonomous Systems', 'Perception', 'Safety Systems'],
        },
        stages: {
          included: ['Seed', 'Series A', 'Series B'],
        },
        sizing: {
          min: 1000000,
          max: 6000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 6,
            ownershipTargetMaxPct: 18,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_ROB_1',
          name: 'Path to Paid Pilots',
          description: 'Must have a credible path to paid pilots with industrial/logistics customers within 12-18 months.',
          dimension: 'deployment',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Time-to-validation',
        },
        {
          id: 'HC_VC_ROB_2',
          name: 'Unit Economics Model',
          description: 'Must present a coherent unit economics model (hardware margin, service, utilization).',
          dimension: 'unitEconomics',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Capital intensity control',
        },
      ],
      riskPosture: 'AGGRESSIVE',
    },
  },
  {
    id: 'tpl_vc_thematic_future_compute',
    name: 'Future Compute',
    type: 'THEMATIC',
    description: 'Invest in next-generation compute architectures and systems that materially improve performance, efficiency, or cost',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Future Compute',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 12,
      description: 'Thematic focus on next-generation compute architectures with material performance improvements.',
      objective: {
        primary: 'Invest in next-generation compute architectures and systems that materially improve performance, efficiency, or cost.',
        secondary: [
          'Prefer strong IP positions and defensible engineering advantage',
          'Target compute bottlenecks in AI/edge/industrial',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'Switzerland'],
        },
        domains: {
          included: ['AI Accelerators', 'Edge Compute', 'Photonic', 'Neuromorphic', 'Systems Software for Compute'],
        },
        stages: {
          included: ['Seed', 'Series A'],
        },
        sizing: {
          min: 1000000,
          max: 7000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 7,
            ownershipTargetMaxPct: 20,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_COMP_1',
          name: 'IP Strategy Required',
          description: 'Must have filed or defensible IP strategy (patents/trade secrets) with clear novelty claims.',
          dimension: 'ip',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Defensibility',
        },
        {
          id: 'HC_VC_COMP_2',
          name: 'Benchmark Plan',
          description: 'Must have a verifiable benchmark plan (targets, workloads, baseline comparisons).',
          dimension: 'validation',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Measurability',
        },
      ],
      riskPosture: 'AGGRESSIVE',
    },
  },
  {
    id: 'tpl_vc_thematic_devtools',
    name: 'Developer Platforms & Tooling',
    type: 'THEMATIC',
    description: 'Invest in developer tools that become durable workflow primitives and support strong product-led adoption',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Developer Platforms & Tooling',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 13,
      description: 'Thematic focus on developer tools with durable workflow integration and PLG motion.',
      objective: {
        primary: 'Invest in developer tools that become durable workflow primitives and support strong product-led adoption.',
        secondary: [
          'Prefer high-frequency usage and deep integration into stacks',
          'Avoid shallow productivity apps',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['DevTools', 'Observability', 'Testing', 'Security Tooling', 'CI/CD'],
        },
        stages: {
          included: ['Seed', 'Series A'],
        },
        sizing: {
          min: 750000,
          max: 4000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 6,
            ownershipTargetMaxPct: 15,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_DEV_1',
          name: 'Developer Adoption Mechanism',
          description: 'Must show credible developer adoption mechanism (open-source, PLG, integrations) and retention signals.',
          dimension: 'adoption',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Distribution',
        },
        {
          id: 'HC_VC_DEV_2',
          name: 'Lock-in Drivers',
          description: 'Must articulate lock-in drivers (data, workflow depth, ecosystem, community).',
          dimension: 'moat',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Durability',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_vc_thematic_data_gov',
    name: 'Data Infrastructure & Governance',
    type: 'THEMATIC',
    description: 'Invest in data infrastructure enabling secure, compliant, high-quality data use across enterprises',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Data Infrastructure & Governance',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 14,
      description: 'Thematic focus on data infrastructure for secure, compliant enterprise data use.',
      objective: {
        primary: 'Invest in data infrastructure enabling secure, compliant, high-quality data use across enterprises.',
        secondary: [
          'Prefer products aligned with privacy-by-design and governance automation',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK'],
        },
        domains: {
          included: ['Data Platforms', 'Data Governance', 'Privacy Tech', 'Synthetic Data', 'Data Security'],
        },
        stages: {
          included: ['Seed', 'Series A'],
        },
        sizing: {
          min: 750000,
          max: 5000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 6,
            ownershipTargetMaxPct: 18,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_DATA_1',
          name: 'GDPR Compliance Support',
          description: 'Must support GDPR-aligned workflows and auditability (policies, lineage, access controls).',
          dimension: 'compliance',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Regulatory fit',
        },
        {
          id: 'HC_VC_DATA_2',
          name: 'Measurable Value',
          description: 'Must demonstrate measurable reduction in compliance/ops burden or material improvement in data utility.',
          dimension: 'value',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'ROI clarity',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_vc_thematic_climate_industrial',
    name: 'Climate & Industrial Decarbonisation',
    type: 'THEMATIC',
    description: 'Invest in technologies that reduce industrial emissions or improve efficiency with credible adoption pathways',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Climate & Industrial Decarbonisation',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 15,
      description: 'Thematic focus on industrial decarbonisation with clear payback and adoption pathways.',
      objective: {
        primary: 'Invest in technologies that reduce industrial emissions or improve efficiency with credible adoption pathways.',
        secondary: [
          'Prefer solutions with clear payback periods and scalable go-to-market',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'Nordics'],
        },
        domains: {
          included: ['Industrial Efficiency', 'Electrification', 'Materials', 'Grid & Storage (Software/Controls)', 'Carbon Measurement'],
        },
        stages: {
          included: ['Seed', 'Series A', 'Series B'],
        },
        sizing: {
          min: 1000000,
          max: 7000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 5,
            ownershipTargetMaxPct: 15,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_CLIM_1',
          name: 'Emissions Impact Quantified',
          description: 'Must quantify emissions reduction mechanism and measurement approach (even if modeled).',
          dimension: 'impact',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Impact integrity',
        },
        {
          id: 'HC_VC_CLIM_2',
          name: 'Industrial Adoption Pathway',
          description: 'Must show adoption pathway with industrial buyers (pilot partners or clear channel strategy).',
          dimension: 'adoption',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Commercial feasibility',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_vc_thematic_defense_dual_use',
    name: 'Defence, Dual-Use & Resilience Tech',
    type: 'THEMATIC',
    description: 'Invest in dual-use and resilience technologies with strong security demand and scalable civil spillover markets',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Defence, Dual-Use & Resilience Tech',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 16,
      description: 'Thematic focus on dual-use technologies with security demand and civil market potential.',
      objective: {
        primary: 'Invest in dual-use and resilience technologies with strong security demand and scalable civil spillover markets.',
        secondary: [
          'Maintain strict compliance and export-control awareness',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'NATO-aligned'],
        },
        domains: {
          included: ['Sensing', 'Autonomy', 'Secure Communications', 'Supply Chain Resilience', 'Cyber Defense'],
        },
        stages: {
          included: ['Seed', 'Series A', 'Series B'],
        },
        sizing: {
          min: 1000000,
          max: 6000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 5,
            ownershipTargetMaxPct: 15,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_DEF_1',
          name: 'Export Control Compliance',
          description: 'Must pass export-control and sanctions screening; no prohibited end users.',
          dimension: 'compliance',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Legal compliance',
        },
        {
          id: 'HC_VC_DEF_2',
          name: 'Ethics Policy Alignment',
          description: 'Requires explicit policy alignment for any lethal-use adjacent applications.',
          dimension: 'ethics',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Governance and reputation',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_vc_thematic_healthtech',
    name: 'HealthTech (non-biotech)',
    type: 'THEMATIC',
    description: 'Invest in healthcare technology that improves delivery, diagnostics workflows, or operational efficiency without drug development risk',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'HealthTech (non-biotech)',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 17,
      description: 'Thematic focus on healthcare technology improving delivery and operations without drug risk.',
      objective: {
        primary: 'Invest in healthcare technology that improves delivery, diagnostics workflows, or operational efficiency without drug development risk.',
        secondary: [
          'Prefer reimbursed pathways or direct ROI for providers/payers',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['Clinical Workflow', 'Diagnostics Platforms', 'Digital Health Infrastructure', 'Revenue Cycle', 'Remote Monitoring (Software)'],
        },
        stages: {
          included: ['Seed', 'Series A'],
        },
        sizing: {
          min: 750000,
          max: 5000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 6,
            ownershipTargetMaxPct: 18,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_HEALTH_1',
          name: 'Regulatory Plan Required',
          description: 'If classified as medical device software, must have credible regulatory plan (UKCA/CE) and QMS trajectory.',
          dimension: 'regulatory',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Execution feasibility',
        },
        {
          id: 'HC_VC_HEALTH_2',
          name: 'Health Data Compliance',
          description: 'Must demonstrate compliant handling of health data (privacy, security, consent).',
          dimension: 'data',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Trust',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_vc_thematic_regtech_fininfra',
    name: 'Financial Infrastructure & RegTech',
    type: 'THEMATIC',
    description: 'Invest in financial infrastructure and compliance technology with durable regulatory tailwinds and enterprise adoption',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Financial Infrastructure & RegTech',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 18,
      description: 'Thematic focus on financial infrastructure and compliance tech with regulatory tailwinds.',
      objective: {
        primary: 'Invest in financial infrastructure and compliance technology with durable regulatory tailwinds and enterprise adoption.',
        secondary: [
          'Prefer solutions that reduce cost of compliance or enable new compliant products',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU', 'Switzerland'],
        },
        domains: {
          included: ['RegTech', 'Payments Infrastructure', 'Identity & KYC', 'Risk & Compliance Automation'],
        },
        stages: {
          included: ['Seed', 'Series A'],
        },
        sizing: {
          min: 750000,
          max: 5000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 5,
            ownershipTargetMaxPct: 15,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_REG_1',
          name: 'Secure-by-Design Controls',
          description: 'Must demonstrate secure-by-design controls appropriate for financial institutions.',
          dimension: 'compliance',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Enterprise procurement',
        },
        {
          id: 'HC_VC_REG_2',
          name: 'Route to Regulated Buyers',
          description: 'Must show credible route to regulated buyers (pilots, partners, or domain team).',
          dimension: 'sales',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'GTM feasibility',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_vc_thematic_industrial_saas',
    name: 'Industrial SaaS / Vertical Software',
    type: 'THEMATIC',
    description: 'Invest in vertical software businesses serving industrial sectors with high switching costs and clear ROI',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Industrial SaaS / Vertical Software',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 19,
      description: 'Thematic focus on vertical software for industrial sectors with high switching costs.',
      objective: {
        primary: 'Invest in vertical software businesses serving industrial sectors with high switching costs and clear ROI.',
        secondary: [
          'Prefer data capture flywheels and integration depth',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK'],
        },
        domains: {
          included: ['Manufacturing Software', 'Construction Tech', 'Logistics SaaS', 'Energy Ops Software', 'Field Service'],
        },
        stages: {
          included: ['Seed', 'Series A', 'Series B'],
        },
        sizing: {
          min: 750000,
          max: 6000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 5,
            ownershipTargetMaxPct: 15,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_VERT_1',
          name: 'Measurable ROI Case',
          description: 'Must present measurable ROI case (cost reduction, throughput gains, compliance).',
          dimension: 'roi',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Buyer adoption',
        },
        {
          id: 'HC_VC_VERT_2',
          name: 'Switching Cost Drivers',
          description: 'Must show switching-cost drivers (workflow, integrations, data, regulatory).',
          dimension: 'defensibility',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Durable retention',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_vc_carveout_followon',
    name: 'Follow-on & Reserves Mandate',
    type: 'CARVEOUT',
    description: 'Allocate follow-on capital to protect ownership in winners and fund high-conviction pro-rata opportunities',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Follow-on & Reserves Mandate',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 3,
      description: 'Carveout to allocate follow-on capital to protect ownership in winners and fund high-conviction pro-rata opportunities.',
      objective: {
        primary: 'Allocate follow-on capital to protect ownership in winners and fund high-conviction pro-rata opportunities.',
        secondary: [
          'Prioritize cases with evidence of momentum and improved risk profile vs entry',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU', 'Switzerland', 'Nordics'],
        },
        domains: {
          included: [],
          notes: 'All (Portfolio)',
        },
        stages: {
          included: ['Series A', 'Series B', 'Extension'],
        },
        sizing: {
          min: 500000,
          max: 10000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 5,
            ownershipTargetMaxPct: 25,
            isFollowOnOnly: true,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_FO_1',
          name: 'Existing Portfolio Only',
          description: 'Only applicable to existing portfolio companies.',
          dimension: 'eligibility',
          operator: 'EQUALS',
          values: ['EXISTING'],
          severity: 'BLOCKING',
          rationale: 'Carve-out purpose',
        },
        {
          id: 'HC_VC_FO_2',
          name: 'Updated KPI Pack Required',
          description: 'Requires updated KPI pack and refreshed downside case prior to approval.',
          dimension: 'governance',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Decision hygiene',
        },
      ],
      riskPosture: 'ALIGNED',
    },
  },
  {
    id: 'tpl_vc_carveout_secondaries',
    name: 'Secondaries / Liquidity Carve-out',
    type: 'CARVEOUT',
    description: 'Pursue selective secondary transactions to acquire stakes in high-conviction companies with de-risked fundamentals',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Secondaries / Liquidity Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 30,
      description: 'Carveout for selective secondary transactions to acquire stakes in de-risked companies.',
      objective: {
        primary: 'Pursue selective secondary transactions to acquire stakes in high-conviction companies with de-risked fundamentals.',
        secondary: [
          'Prioritize clean cap tables and strong lead sponsor support',
          'Avoid adverse selection and complex structures',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU', 'Switzerland', 'Nordics'],
        },
        domains: {
          included: ['Secondaries', 'Liquidity'],
        },
        stages: {
          included: ['Series B', 'Series C', 'Growth', 'Pre-IPO'],
        },
        sizing: {
          min: 1000000,
          max: 15000000,
          currency: 'EUR',
          parameters: {
            ownershipTargetMinPct: 1,
            ownershipTargetMaxPct: 10,
            isSecondaryOnly: true,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_SEC_1',
          name: 'Valuation Documentation',
          description: 'Must document valuation basis and discount rationale vs last round and current fundamentals.',
          dimension: 'pricing',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Avoid overpaying / adverse selection',
        },
        {
          id: 'HC_VC_SEC_2',
          name: 'Time-to-Liquidity Thesis',
          description: 'Requires a credible time-to-liquidity thesis (18-48 months) with identifiable catalysts.',
          dimension: 'liquidity',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Portfolio pacing',
        },
        {
          id: 'HC_VC_SEC_3',
          name: 'Transfer Restrictions Review',
          description: 'Must pass transfer restrictions review (ROFR/ROFO, consents) and include clean title/assignment protections.',
          dimension: 'legal',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Execution risk',
        },
      ],
      riskPosture: 'CONSERVATIVE',
    },
  },
  {
    id: 'tpl_vc_carveout_bridges',
    name: 'Bridge / Extension Rounds Carve-out',
    type: 'CARVEOUT',
    description: 'Provide structured bridge or extension financing where it materially increases probability of successful next round or revenue milestone',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Bridge / Extension Rounds Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 31,
      description: 'Carveout for bridge or extension financing with tight conditions and milestone-based structure.',
      objective: {
        primary: 'Provide structured bridge or extension financing where it materially increases probability of successful next round or revenue milestone.',
        secondary: [
          'Use tight conditions, milestones, and downside protection where possible',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['Bridge Financing', 'Extensions'],
        },
        stages: {
          included: ['Seed Extension', 'Series A Extension', 'Bridge'],
        },
        sizing: {
          min: 250000,
          max: 5000000,
          currency: 'EUR',
          parameters: {
            isBridgeOnly: true,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_BR_1',
          name: 'Milestone Plan Required',
          description: 'Must define financing-to-milestone plan (runway, KPI targets, next-round plan) and objective success criteria.',
          dimension: 'milestones',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Avoid bridge to nowhere',
        },
        {
          id: 'HC_VC_BR_2',
          name: 'Structured Terms Preferred',
          description: 'Prefer structured terms (discount/cap, seniority, information rights); if priced, require downside justification.',
          dimension: 'structure',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Downside protection',
        },
        {
          id: 'HC_VC_BR_3',
          name: 'Portfolio Impact Assessment',
          description: 'Must assess portfolio impact and avoid concentration breaches; escalation required if support increases exposure > defined limit.',
          dimension: 'portfolio',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Portfolio risk control',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_vc_carveout_opportunistic',
    name: 'Opportunistic / Special Situations Carve-out',
    type: 'CARVEOUT',
    description: 'Pursue high-upside out-of-pattern opportunities that require explicit exceptions and enhanced governance',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Opportunistic / Special Situations Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 32,
      description: 'Carveout for high-upside opportunities requiring explicit exceptions and enhanced governance.',
      objective: {
        primary: 'Pursue high-upside out-of-pattern opportunities that require explicit exceptions and enhanced governance.',
        secondary: [
          'Use sparingly; every deal must document which baseline rules are being overridden and why',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU', 'US (exceptional)'],
        },
        domains: {
          included: ['Special Situations', 'Opportunistic'],
        },
        stages: {
          included: ['Any'],
        },
        sizing: {
          min: 500000,
          max: 7000000,
          currency: 'EUR',
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_OPP_1',
          name: 'Exception Register Required',
          description: 'Requires explicit exception register entries for every violated baseline rule and IC Chair approval.',
          dimension: 'governance',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Prevent silent strategy drift',
        },
        {
          id: 'HC_VC_OPP_2',
          name: 'Allocation Cap',
          description: 'Cumulative allocation to this carve-out must not exceed 10% of portfolio.',
          dimension: 'portfolio',
          operator: 'LESS_THAN',
          values: [10],
          severity: 'BLOCKING',
          rationale: 'Contain strategy risk',
        },
      ],
      allocation: {
        maxPct: 10,
      },
      riskPosture: 'AGGRESSIVE',
    },
  },
  {
    id: 'tpl_vc_carveout_geo_expansion',
    name: 'Geographic Expansion Carve-out',
    type: 'CARVEOUT',
    description: 'Allow selective investments outside core geography when strategic rationale and network advantage are clear',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    mandate: {
      name: 'Geographic Expansion Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 33,
      description: 'Carveout for investments outside core geography with clear strategic rationale.',
      objective: {
        primary: 'Allow selective investments outside core geography when strategic rationale and network advantage are clear.',
        secondary: [
          'Ensure legal, tax, and operational feasibility for non-core jurisdictions',
        ],
      },
      scope: {
        geography: {
          regions: ['US', 'Canada', 'Israel'],
        },
        domains: {
          included: [],
          notes: 'All (Non-Core Geography)',
        },
        stages: {
          included: ['Seed', 'Series A', 'Series B'],
        },
        sizing: {
          min: 500000,
          max: 5000000,
          currency: 'EUR',
        },
      },
      hardConstraints: [
        {
          id: 'HC_VC_GEO_1',
          name: 'Strategic Rationale Required',
          description: 'Must document strategic rationale (edge, co-investor quality, sourcing advantage) and why it cannot be achieved in-core.',
          dimension: 'rationale',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Avoid mandate dilution',
        },
        {
          id: 'HC_VC_GEO_2',
          name: 'Legal/Tax Feasibility',
          description: 'Requires jurisdictional legal/tax feasibility check before approval.',
          dimension: 'legal',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Operational risk',
        },
      ],
      allocation: {
        maxPct: 15,
      },
      riskPosture: 'MODERATE',
    },
  },
];

// -----------------------------------------------------------------------------
// INSURANCE MANDATE TEMPLATES
// -----------------------------------------------------------------------------

const INSURANCE_TEMPLATES: MandateTemplate[] = [
  {
    id: 'tpl_ins_primary_book',
    name: 'Book-wide Underwriting Envelope',
    type: 'PRIMARY',
    description: 'Underwrite specialty commercial risks with disciplined risk selection and prudent aggregation management across key territories',
    industry: 'INSURANCE',
    isDefault: true,
    mandate: {
      name: 'Book-wide Underwriting Envelope',
      type: 'PRIMARY',
      status: 'ACTIVE',
      priority: 1,
      description: 'Primary underwriting mandate defining the overall risk appetite and limits across the specialty commercial book.',
      objective: {
        primary: 'Underwrite specialty commercial risks with disciplined risk selection and prudent aggregation management across key territories.',
        secondary: [
          'Maintain combined ratio below 95% across the book',
          'Diversify across industries, geographies, and lines of business',
        ],
      },
      scope: {
        geography: {
          regions: ['US', 'UK', 'EU'],
        },
        domains: {
          included: ['Cyber', 'D&O', 'E&O', 'Property (Cat-Light)'],
        },
        stages: {
          included: ['Primary layer', 'First excess'],
          notes: 'Attachment above $1M SIR preferred',
        },
        sizing: {
          min: 25000,
          max: 25000000,
          currency: 'USD',
          parameters: {
            limitMax: 25000000,
            aggregateMax: 250000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_1',
          name: 'Prohibited Territories',
          description: 'No coverage for risks domiciled in sanctioned territories.',
          dimension: 'territory',
          operator: 'NOT_IN',
          values: ['sanctioned'],
          severity: 'BLOCKING',
          rationale: 'Regulatory compliance',
        },
        {
          id: 'HC_INS_2',
          name: 'Aggregate CAT Exposure',
          description: 'Do not exceed 10% of gross written premium in CAT-exposed zones.',
          dimension: 'cat_exposure',
          operator: 'LESS_THAN',
          values: [10],
          severity: 'BLOCKING',
          rationale: 'Capital protection',
        },
        {
          id: 'HC_INS_3',
          name: 'Single-Risk PML Cap',
          description: 'Single-risk PML must not exceed reinsurance treaty attachment.',
          dimension: 'pml',
          operator: 'LESS_THAN',
          values: ['treaty_attachment'],
          severity: 'BLOCKING',
          rationale: 'Reinsurance alignment',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_ins_thematic_cyber_sme',
    name: 'Cyber SME Mandate',
    type: 'THEMATIC',
    description: 'Expand profitable cyber footprint in the SME segment with streamlined underwriting and strong risk controls',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Cyber SME Mandate',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 2,
      description: 'Thematic mandate focused on cyber coverage for small and medium enterprises with simplified underwriting.',
      objective: {
        primary: 'Expand profitable cyber footprint in the SME segment with streamlined underwriting and strong risk controls.',
        secondary: [
          'Target loss ratio below 55%',
          'Prioritize accounts with verified baseline security controls',
        ],
      },
      scope: {
        geography: {
          regions: ['US', 'Canada'],
        },
        domains: {
          included: ['Cyber Liability', 'Network Security', 'Privacy'],
        },
        stages: {
          included: ['Primary layer'],
          notes: 'SME: <$250M revenue',
        },
        sizing: {
          min: 5000,
          max: 5000000,
          currency: 'USD',
          parameters: {
            limitMax: 5000000,
            premiumMin: 5000,
            premiumMax: 150000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_CYBER_1',
          name: 'Minimum Security Controls',
          description: 'Account must verify MFA, endpoint protection, and offline backups.',
          dimension: 'security_controls',
          operator: 'CONTAINS',
          values: ['MFA', 'EDR', 'BACKUP'],
          severity: 'BLOCKING',
          rationale: 'Baseline insurability',
        },
        {
          id: 'HC_INS_CYBER_2',
          name: 'Excluded Industries',
          description: 'Do not write crypto exchanges, adult content platforms, or critical infrastructure operators.',
          dimension: 'industry',
          operator: 'NOT_IN',
          values: ['crypto', 'adult', 'critical_infrastructure'],
          severity: 'BLOCKING',
          rationale: 'Elevated aggregation or reputational risk',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_ins_thematic_cyber_enterprise',
    name: 'Cyber Insurance - Enterprise',
    type: 'THEMATIC',
    description: 'Underwrite enterprise cyber with strict minimum controls and explicit systemic-risk management',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Cyber Insurance - Enterprise',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 11,
      description: 'Thematic mandate focused on enterprise cyber with strict controls and systemic risk management.',
      objective: {
        primary: 'Underwrite enterprise cyber with strict minimum controls and explicit systemic-risk management.',
        secondary: [
          'Prefer well-instrumented environments and strong vendor risk management',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['Cyber'],
        },
        stages: {
          included: ['New Business', 'Renewal'],
        },
        sizing: {
          min: 100000,
          max: 20000000,
          currency: 'GBP',
          parameters: {
            limitMax: 20000000,
            premiumMin: 100000,
            premiumMax: 5000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_CYENT_1',
          name: 'EDR and Logging Required',
          description: 'EDR and centralized logging required across critical assets.',
          dimension: 'controls',
          operator: 'CONTAINS',
          values: ['EDR', 'CENTRALIZED_LOGGING'],
          severity: 'BLOCKING',
          rationale: 'Detection/response',
        },
        {
          id: 'HC_INS_CYENT_2',
          name: 'Systemic Risk Assessment',
          description: 'Must assess key vendor/system dependencies; decline if systemic exposure unquantifiable.',
          dimension: 'aggregation',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Systemic risk',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_ins_thematic_property_cat_light',
    name: 'Property - Cat-Light',
    type: 'THEMATIC',
    description: 'Underwrite property risks with limited catastrophe exposure and conservative accumulation controls',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Property - Cat-Light',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 12,
      description: 'Thematic mandate for property risks with controlled cat exposure.',
      objective: {
        primary: 'Underwrite property risks with limited catastrophe exposure and conservative accumulation controls.',
        secondary: [
          'Prefer diversified locations and robust protection measures',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU (non-peak CAT zones)'],
        },
        domains: {
          included: ['Property'],
        },
        stages: {
          included: ['New Business', 'Renewal'],
        },
        sizing: {
          min: 50000,
          max: 25000000,
          currency: 'GBP',
          parameters: {
            limitMax: 25000000,
            premiumMin: 50000,
            premiumMax: 8000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_PROP_1',
          name: 'CAT Zone Restrictions',
          description: 'No peak-zone exposures beyond defined accumulation thresholds.',
          dimension: 'cat',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Cat control',
        },
        {
          id: 'HC_INS_PROP_2',
          name: 'Risk Engineering Review',
          description: 'Requires risk engineering review for large limits or high-hazard occupancies.',
          dimension: 'riskEngineering',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Loss prevention',
        },
      ],
      riskPosture: 'CONSERVATIVE',
    },
  },
  {
    id: 'tpl_ins_thematic_do_midmarket',
    name: 'D&O / Management Liability - Mid-Market',
    type: 'THEMATIC',
    description: 'Underwrite D&O and management liability for mid-market firms with prudent financial and governance screening',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'D&O / Management Liability - Mid-Market',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 13,
      description: 'Thematic mandate for D&O coverage targeting mid-market firms.',
      objective: {
        primary: 'Underwrite D&O and management liability for mid-market firms with prudent financial and governance screening.',
        secondary: [
          'Avoid high-litigation profiles and opaque governance',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['D&O', 'Management Liability'],
        },
        stages: {
          included: ['New Business', 'Renewal'],
        },
        sizing: {
          min: 25000,
          max: 10000000,
          currency: 'GBP',
          parameters: {
            limitMax: 10000000,
            premiumMin: 25000,
            premiumMax: 2000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_DO_1',
          name: 'Financial Assessment Required',
          description: 'Requires recent financials and solvency assessment; decline if going-concern doubts unresolved.',
          dimension: 'financials',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Claims propensity',
        },
        {
          id: 'HC_INS_DO_2',
          name: 'Governance Screening',
          description: 'Requires governance screening (board composition, controls) for higher limits.',
          dimension: 'governance',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Risk selection',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_ins_thematic_prof_indemnity',
    name: 'Professional Indemnity',
    type: 'THEMATIC',
    description: 'Underwrite professional indemnity with disciplined controls around service scope, contract terms, and claims history',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Professional Indemnity',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 14,
      description: 'Thematic mandate for professional indemnity coverage.',
      objective: {
        primary: 'Underwrite professional indemnity with disciplined controls around service scope, contract terms, and claims history.',
        secondary: [
          'Prefer insureds with strong QA and documented delivery processes',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['Professional Indemnity'],
        },
        stages: {
          included: ['New Business', 'Renewal'],
        },
        sizing: {
          min: 15000,
          max: 5000000,
          currency: 'GBP',
          parameters: {
            limitMax: 5000000,
            premiumMin: 15000,
            premiumMax: 1500000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_PI_1',
          name: 'Contractual Liability Review',
          description: 'Contractual liability expansion must be reviewed; decline if uncapped liabilities cannot be mitigated.',
          dimension: 'contracts',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Severity control',
        },
        {
          id: 'HC_INS_PI_2',
          name: 'Claims Trend Assessment',
          description: 'Material adverse claims trends require escalation and pricing action or decline.',
          dimension: 'claims',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Loss trend control',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_ins_thematic_eo_tech',
    name: 'Errors & Omissions - Tech / SaaS',
    type: 'THEMATIC',
    description: 'Underwrite E&O for technology and SaaS firms with focus on product risk, contracts, and incident track record',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Errors & Omissions - Tech / SaaS',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 15,
      description: 'Thematic mandate for E&O coverage for tech and SaaS companies.',
      objective: {
        primary: 'Underwrite E&O for technology and SaaS firms with focus on product risk, contracts, and incident track record.',
        secondary: [
          'Prefer mature SDLC and security posture',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['Tech E&O', 'SaaS E&O'],
        },
        stages: {
          included: ['New Business', 'Renewal'],
        },
        sizing: {
          min: 25000,
          max: 10000000,
          currency: 'GBP',
          parameters: {
            limitMax: 10000000,
            premiumMin: 25000,
            premiumMax: 3000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_EO_1',
          name: 'High-Risk Contract Review',
          description: 'High-risk contractual commitments (SLA penalties, consequential damages) require escalation.',
          dimension: 'contracts',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Severity',
        },
        {
          id: 'HC_INS_EO_2',
          name: 'Security Posture Review',
          description: 'Material security deficiencies require remediation plan or decline.',
          dimension: 'security',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Claims frequency',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_ins_thematic_product_liability',
    name: 'Product Liability',
    type: 'THEMATIC',
    description: 'Underwrite product liability with strict controls on hazardous products, recalls, and distribution footprint',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Product Liability',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 16,
      description: 'Thematic mandate for product liability coverage.',
      objective: {
        primary: 'Underwrite product liability with strict controls on hazardous products, recalls, and distribution footprint.',
        secondary: [
          'Prefer robust QA, traceability, and compliance certifications',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['Product Liability'],
        },
        stages: {
          included: ['New Business', 'Renewal'],
        },
        sizing: {
          min: 25000,
          max: 15000000,
          currency: 'GBP',
          parameters: {
            limitMax: 15000000,
            premiumMin: 25000,
            premiumMax: 4000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_PROD_1',
          name: 'Hazard Category Exclusions',
          description: 'Exclude prohibited high-hazard categories unless explicitly approved via exception.',
          dimension: 'hazard',
          operator: 'NOT_IN',
          values: ['prohibited_high_hazard'],
          severity: 'BLOCKING',
          rationale: 'Tail risk',
        },
        {
          id: 'HC_INS_PROD_2',
          name: 'QA/QC Evidence Required',
          description: 'Requires evidence of QA/QC and product traceability for higher limits.',
          dimension: 'qa',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Recall/defect control',
        },
      ],
      riskPosture: 'CONSERVATIVE',
    },
  },
  {
    id: 'tpl_ins_thematic_environmental',
    name: 'Environmental Liability',
    type: 'THEMATIC',
    description: 'Underwrite environmental liabilities with conservative exposure assumptions and clear remediation/monitoring plans',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Environmental Liability',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 17,
      description: 'Thematic mandate for environmental liability coverage.',
      objective: {
        primary: 'Underwrite environmental liabilities with conservative exposure assumptions and clear remediation/monitoring plans.',
        secondary: [
          'Prefer insureds with strong compliance management and incident history transparency',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['Environmental Liability'],
        },
        stages: {
          included: ['New Business', 'Renewal'],
        },
        sizing: {
          min: 30000,
          max: 10000000,
          currency: 'GBP',
          parameters: {
            limitMax: 10000000,
            premiumMin: 30000,
            premiumMax: 3000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_ENV_1',
          name: 'Environmental Survey Required',
          description: 'High-risk sites require specialist environmental survey prior to binding.',
          dimension: 'site',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Risk quantification',
        },
        {
          id: 'HC_INS_ENV_2',
          name: 'Contamination Remediation Plan',
          description: 'Known contamination without credible remediation plan triggers decline or escalation.',
          dimension: 'history',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Loss certainty',
        },
      ],
      riskPosture: 'CONSERVATIVE',
    },
  },
  {
    id: 'tpl_ins_thematic_construction',
    name: 'Construction / Engineering Risks',
    type: 'THEMATIC',
    description: 'Underwrite construction/engineering risks with disciplined controls on contractor quality, project complexity, and contract terms',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Construction / Engineering Risks',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 18,
      description: 'Thematic mandate for construction and engineering risks.',
      objective: {
        primary: 'Underwrite construction/engineering risks with disciplined controls on contractor quality, project complexity, and contract terms.',
        secondary: [
          'Prefer projects with strong safety record and experienced principals',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['Construction', 'Engineering', 'CAR/EAR'],
        },
        stages: {
          included: ['New Business', 'Renewal'],
        },
        sizing: {
          min: 50000,
          max: 25000000,
          currency: 'GBP',
          parameters: {
            limitMax: 25000000,
            premiumMin: 50000,
            premiumMax: 6000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_CONST_1',
          name: 'Contract Terms Escalation',
          description: 'Non-standard contract terms (LDs, indemnities) require legal/underwriting escalation.',
          dimension: 'contracts',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Contract risk',
        },
        {
          id: 'HC_INS_CONST_2',
          name: 'Safety Record Review',
          description: 'Poor safety record or unresolved major incidents triggers decline.',
          dimension: 'safety',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Frequency indicator',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_ins_thematic_parametric',
    name: 'Parametric Products',
    type: 'THEMATIC',
    description: 'Develop and underwrite parametric products with transparent triggers, robust data sources, and basis-risk controls',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Parametric Products',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 19,
      description: 'Thematic mandate for parametric insurance products.',
      objective: {
        primary: 'Develop and underwrite parametric products with transparent triggers, robust data sources, and basis-risk controls.',
        secondary: [
          'Prefer independent verifiable data feeds and clear dispute mechanisms',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['Parametric', 'Specialty'],
        },
        stages: {
          included: ['New Business'],
        },
        sizing: {
          min: 50000,
          max: 20000000,
          currency: 'GBP',
          parameters: {
            limitMax: 20000000,
            premiumMin: 50000,
            premiumMax: 5000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_PARAM_1',
          name: 'Verifiable Data Source',
          description: 'Trigger must be based on verifiable data source with uptime SLAs or redundancy.',
          dimension: 'data',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Operational integrity',
        },
        {
          id: 'HC_INS_PARAM_2',
          name: 'Basis Risk Analysis',
          description: 'Basis risk analysis required; product must include clear terms for disputes.',
          dimension: 'basisRisk',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Customer trust',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_ins_carveout_delegated',
    name: 'Delegated Authority Program Carve-out',
    type: 'CARVEOUT',
    description: 'Provide binding authority to vetted MGAs under strict audit and aggregation controls',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Delegated Authority Program Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 3,
      description: 'Carve-out for delegated authority arrangements with approved MGAs, with enhanced governance and monitoring.',
      objective: {
        primary: 'Provide binding authority to vetted MGAs under strict audit and aggregation controls.',
        secondary: [
          'Track bordereaux monthly; audit partners annually',
          'Cap GWP contribution from any single MGA at 15% of book',
        ],
      },
      scope: {
        geography: {
          regions: ['US', 'UK'],
        },
        domains: {
          included: ['Cyber', 'Professional Liability'],
          notes: 'Classes approved per binder agreement only',
        },
        stages: {
          included: ['Primary layer'],
        },
        sizing: {
          min: 1000,
          max: 2000000,
          currency: 'USD',
          parameters: {
            limitMax: 2000000,
            mgaGwpCap: 15,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_DA_1',
          name: 'Approved MGA List',
          description: 'MGA must be on the current approved binder list.',
          dimension: 'mga_status',
          operator: 'EQUALS',
          values: ['APPROVED'],
          severity: 'BLOCKING',
          rationale: 'Compliance',
        },
        {
          id: 'HC_INS_DA_2',
          name: 'MGA Binding Limit',
          description: 'MGA cannot bind risks above $2M limit without referral.',
          dimension: 'binding_limit',
          operator: 'LESS_THAN',
          values: [2000001],
          severity: 'BLOCKING',
          rationale: 'Authority controls',
        },
      ],
      allocation: {
        maxPct: 15,
      },
      riskPosture: 'ALIGNED',
    },
  },
  {
    id: 'tpl_ins_carveout_new_business_only',
    name: 'New Business Only Carve-out',
    type: 'CARVEOUT',
    description: 'Segregate fresh underwriting from renewal portfolio to protect book quality during growth phase',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'New Business Only Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 12,
      description: 'Carve-out for new business underwriting to maintain discipline during growth periods while protecting the renewal book.',
      objective: {
        primary: 'Segregate fresh underwriting from renewal portfolio to protect book quality during growth phase.',
        secondary: [
          'Apply stricter hit-ratios and pricing floor for new risks',
          'Review broker-submitted new business quarterly',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['Cyber', 'Professional Liability', 'D&O'],
          notes: 'Growth classes only',
        },
        stages: {
          included: ['SME', 'Mid-Market'],
        },
        sizing: {
          min: 5000,
          max: 500000,
          currency: 'GBP',
          parameters: {
            limitMax: 10000000,
            newBusinessGwpCap: 30,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_NB_1',
          name: 'New Business Only',
          description: 'Risk must be new to the book (not renewal or midterm).',
          dimension: 'business_type',
          operator: 'EQUALS',
          values: ['NEW'],
          severity: 'BLOCKING',
          rationale: 'Carve-out scope',
        },
        {
          id: 'HC_INS_NB_2',
          name: 'Pricing Floor',
          description: 'Premium must meet or exceed technical price.',
          dimension: 'pricing_adequacy',
          operator: 'GREATER_THAN_OR_EQUAL',
          values: [1.0],
          severity: 'BLOCKING',
          rationale: 'Profitability discipline',
        },
        {
          id: 'HC_INS_NB_3',
          name: 'Hit Ratio Monitoring',
          description: 'Broker must maintain ≤40% hit ratio on submissions.',
          dimension: 'hit_ratio_pct',
          operator: 'LESS_THAN_OR_EQUAL',
          values: [40],
          severity: 'WARNING',
          rationale: 'Selection quality control',
        },
      ],
      allocation: {
        maxPct: 30,
      },
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_ins_carveout_renewals_only',
    name: 'Renewals Only Stabilisation Carve-out',
    type: 'CARVEOUT',
    description: 'Retain quality renewals with controlled rate change and minimal coverage drift',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Renewals Only Stabilisation Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 13,
      description: 'Carve-out for managing renewals with focus on retention of profitable business and controlled rate changes.',
      objective: {
        primary: 'Retain quality renewals with controlled rate change and minimal coverage drift.',
        secondary: [
          'Target ≥85% retention on satisfactory loss performers',
          'Enforce minimum rate change on under-priced risks',
        ],
      },
      scope: {
        geography: {
          regions: ['UK', 'EU'],
        },
        domains: {
          included: ['All Lines'],
          notes: 'All classes on renewing basis',
        },
        stages: {
          included: ['All Segments'],
        },
        sizing: {
          min: 5000,
          max: 5000000,
          currency: 'GBP',
          parameters: {
            limitMax: 50000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_REN_1',
          name: 'Renewal Only',
          description: 'Risk must be an existing policy renewal.',
          dimension: 'business_type',
          operator: 'EQUALS',
          values: ['RENEWAL'],
          severity: 'BLOCKING',
          rationale: 'Carve-out scope',
        },
        {
          id: 'HC_INS_REN_2',
          name: 'Coverage Drift Check',
          description: 'No material broadening without corresponding premium uplift.',
          dimension: 'coverage_change',
          operator: 'NOT_EQUALS',
          values: ['BROADENED_UNPAID'],
          severity: 'BLOCKING',
          rationale: 'Maintain underwriting integrity',
        },
        {
          id: 'HC_INS_REN_3',
          name: 'Loss Performer Review',
          description: 'Adverse loss performers must receive ≥15% rate increase or non-renew.',
          dimension: 'adverse_renewal_action',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Book remediation',
        },
      ],
      allocation: {
        maxPct: 70,
      },
      riskPosture: 'CONSERVATIVE',
    },
  },
  {
    id: 'tpl_ins_carveout_large_risk_referral',
    name: 'Large Risk Referral Unit Carve-out',
    type: 'CARVEOUT',
    description: 'Handle outsized or complex risks requiring senior sign-off and facultative reinsurance review',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Large Risk Referral Unit Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 14,
      description: 'Carve-out for large and complex risks that exceed standard authority and require senior approval and reinsurance consideration.',
      objective: {
        primary: 'Handle outsized or complex risks requiring senior sign-off and facultative reinsurance review.',
        secondary: [
          'Mandatory pricing committee review above threshold',
          'Secure facultative support before binding where aggregate threatened',
        ],
      },
      scope: {
        geography: {
          regions: ['Global'],
        },
        domains: {
          included: ['All Lines'],
          notes: 'Risks exceeding standard authority thresholds',
        },
        stages: {
          included: ['Enterprise', 'Complex'],
        },
        sizing: {
          min: 500000,
          max: 50000000,
          currency: 'USD',
          parameters: {
            limitMin: 25000000,
            limitMax: 100000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_LR_1',
          name: 'Exceeds Standard Authority',
          description: 'Risk limit or premium exceeds normal underwriter authority.',
          dimension: 'authority_breach',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Referral trigger',
        },
        {
          id: 'HC_INS_LR_2',
          name: 'Senior Sign-off Required',
          description: 'Must have sign-off from Head of Underwriting or CUO.',
          dimension: 'senior_approval',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Governance',
        },
        {
          id: 'HC_INS_LR_3',
          name: 'Facultative Review',
          description: 'Facultative reinsurance consideration required above $50M limit.',
          dimension: 'fac_review',
          operator: 'EQUALS',
          values: [true],
          severity: 'WARNING',
          rationale: 'Capacity management',
        },
      ],
      allocation: {
        maxPct: 15,
      },
      riskPosture: 'CONSERVATIVE',
    },
  },
  {
    id: 'tpl_ins_carveout_nonstandard_terms',
    name: 'Non-Standard Terms / Manuscript Wordings Carve-out',
    type: 'CARVEOUT',
    description: 'Govern bespoke policy wordings requiring legal review and enhanced documentation',
    industry: 'INSURANCE',
    isDefault: false,
    mandate: {
      name: 'Non-Standard Terms / Manuscript Wordings Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 15,
      description: 'Carve-out for non-standard policy wordings that require legal review, enhanced documentation, and special approval processes.',
      objective: {
        primary: 'Govern bespoke policy wordings requiring legal review and enhanced documentation.',
        secondary: [
          'Require wordings sign-off from legal team',
          'Maintain a central repository of approved deviations',
        ],
      },
      scope: {
        geography: {
          regions: ['Global'],
        },
        domains: {
          included: ['All Lines'],
          notes: 'Non-standard wordings only',
        },
        stages: {
          included: ['All Segments'],
        },
        sizing: {
          min: 25000,
          max: 10000000,
          currency: 'USD',
          parameters: {
            limitMax: 50000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_INS_NS_1',
          name: 'Non-Standard Wording',
          description: 'Policy uses non-approved or manuscript wordings.',
          dimension: 'wording_type',
          operator: 'EQUALS',
          values: ['MANUSCRIPT', 'NON_STANDARD'],
          severity: 'BLOCKING',
          rationale: 'Carve-out scope',
        },
        {
          id: 'HC_INS_NS_2',
          name: 'Legal Sign-off',
          description: 'Legal team must review and approve non-standard terms.',
          dimension: 'legal_approval',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Contractual risk management',
        },
        {
          id: 'HC_INS_NS_3',
          name: 'Deviation Documentation',
          description: 'All deviations from standard wording must be documented.',
          dimension: 'deviation_documented',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Audit trail',
        },
      ],
      allocation: {
        maxPct: 10,
      },
      riskPosture: 'CONSERVATIVE',
    },
  },
];

// -----------------------------------------------------------------------------
// PHARMA MANDATE TEMPLATES
// -----------------------------------------------------------------------------

const PHARMA_TEMPLATES: MandateTemplate[] = [
  {
    id: 'tpl_pharma_primary_pipeline',
    name: 'Pipeline Strategy Mandate',
    type: 'PRIMARY',
    description: 'Advance a differentiated pipeline in high-unmet-need therapeutic areas with clear regulatory paths and strong commercial rationale',
    industry: 'PHARMA',
    isDefault: true,
    mandate: {
      name: 'Pipeline Strategy Mandate',
      type: 'PRIMARY',
      status: 'ACTIVE',
      priority: 1,
      description: 'Primary R&D investment mandate defining the overall pipeline strategy, therapeutic focus, and development criteria.',
      objective: {
        primary: 'Advance a differentiated pipeline in high-unmet-need therapeutic areas with clear regulatory paths and strong commercial rationale.',
        secondary: [
          'Prioritize first-in-class or best-in-class mechanisms with durable IP',
          'Maintain stage-diverse portfolio to balance near-term and long-term value',
        ],
      },
      scope: {
        geography: {
          regions: ['FDA (US)', 'EMA (EU)', 'MHRA (UK)'],
        },
        domains: {
          included: ['Oncology', 'Immunology', 'Rare Disease', 'Neurology'],
        },
        stages: {
          included: ['Preclinical', 'Phase 1', 'Phase 2', 'Phase 3'],
        },
        sizing: {
          min: 5000000,
          max: 250000000,
          currency: 'USD',
          parameters: {
            maxYearsToPoC: 5,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PHARMA_1',
          name: 'Target Product Profile',
          description: 'Program must have an approved TPP demonstrating differentiated efficacy or safety versus standard of care.',
          dimension: 'tpp',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Foundation for development investment',
        },
        {
          id: 'HC_PHARMA_2',
          name: 'Regulatory Feasibility',
          description: 'Regulatory pathway must be feasible in at least one major market (FDA, EMA).',
          dimension: 'regulatory',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Approvability requirement',
        },
        {
          id: 'HC_PHARMA_3',
          name: 'Patent Runway',
          description: 'Patent protection must extend at least 8 years post-projected launch.',
          dimension: 'patent_years',
          operator: 'GREATER_THAN',
          values: [8],
          severity: 'WARNING',
          rationale: 'Commercial viability',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_pharma_thematic_oncology',
    name: 'Oncology (Preclinical–Phase 2) Mandate',
    type: 'THEMATIC',
    description: 'Invest in early-stage oncology programs with novel mechanisms and biomarker-driven development strategies',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Oncology (Preclinical–Phase 2) Mandate',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 2,
      description: 'Thematic mandate focused on early-stage oncology programs with novel mechanisms and precision medicine approaches.',
      objective: {
        primary: 'Invest in early-stage oncology programs with novel mechanisms and biomarker-driven development strategies.',
        secondary: [
          'Prioritize solid tumors with high unmet need; hematological malignancies selectively',
          'Target indication selection decisions by end of Phase 1b',
        ],
      },
      scope: {
        geography: {
          regions: ['FDA (US)', 'EMA (EU)'],
        },
        domains: {
          included: ['Solid Tumors', 'Immuno-Oncology', 'Targeted Therapy'],
        },
        stages: {
          included: ['Preclinical', 'Phase 1', 'Phase 2'],
        },
        sizing: {
          min: 3000000,
          max: 80000000,
          currency: 'USD',
          parameters: {
            maxYearsToPoC: 4,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PHARMA_ONC_1',
          name: 'Novel Mechanism',
          description: 'Must target a novel or differentiated mechanism; no me-too compounds.',
          dimension: 'mechanism',
          operator: 'EQUALS',
          values: ['NOVEL', 'DIFFERENTIATED'],
          severity: 'BLOCKING',
          rationale: 'Competitive positioning',
        },
        {
          id: 'HC_PHARMA_ONC_2',
          name: 'Biomarker Hypothesis',
          description: 'Program must have a credible biomarker hypothesis for patient selection.',
          dimension: 'biomarker',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Precision medicine requirement',
        },
      ],
      riskPosture: 'AGGRESSIVE',
    },
  },
  {
    id: 'tpl_pharma_thematic_cns',
    name: 'CNS / Neurology',
    type: 'THEMATIC',
    description: 'Develop CNS/neurology assets with robust target validation and clinically meaningful endpoints',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'CNS / Neurology',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 11,
      description: 'Thematic mandate for CNS and neurology programs.',
      objective: {
        primary: 'Develop CNS/neurology assets with robust target validation and clinically meaningful endpoints.',
        secondary: [
          'Prefer de-risked mechanisms or strong human genetics/biomarker rationale',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'US'],
        },
        domains: {
          included: ['CNS', 'Neurology', 'Psychiatry (where applicable)'],
        },
        stages: {
          included: ['Preclinical', 'Phase 1', 'Phase 2'],
        },
        sizing: {
          min: 5000000,
          max: 35000000,
          currency: 'EUR',
          parameters: {
            maxYearsToPoC: 5,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PH_CNS_1',
          name: 'Biomarker/PD Strategy',
          description: 'Must define a biomarker/PD strategy or objective surrogate supporting MoA translation.',
          dimension: 'biomarkers',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Translational risk',
        },
        {
          id: 'HC_PH_CNS_2',
          name: 'Regulatory Endpoints',
          description: 'Endpoints must be acceptable to regulators and clinically meaningful for target indication.',
          dimension: 'endpoints',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Regulatory viability',
        },
      ],
      riskPosture: 'AGGRESSIVE',
    },
  },
  {
    id: 'tpl_pharma_thematic_immunology',
    name: 'Immunology & Inflammation',
    type: 'THEMATIC',
    description: 'Advance immunology/inflammation programs with clear pathway modulation and differentiation vs existing biologics/small molecules',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Immunology & Inflammation',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 12,
      description: 'Thematic mandate for immunology and inflammation programs.',
      objective: {
        primary: 'Advance immunology/inflammation programs with clear pathway modulation and differentiation vs existing biologics/small molecules.',
        secondary: [
          'Prefer mechanisms with strong safety rationale',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'US'],
        },
        domains: {
          included: ['Immunology', 'Inflammation', 'Autoimmune'],
        },
        stages: {
          included: ['Preclinical', 'Phase 1', 'Phase 2'],
        },
        sizing: {
          min: 5000000,
          max: 30000000,
          currency: 'EUR',
          parameters: {
            maxYearsToPoC: 4,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PH_IMM_1',
          name: 'Differentiation Required',
          description: 'Must demonstrate differentiation vs standard immunomodulators (efficacy, safety, dosing, convenience).',
          dimension: 'differentiation',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Competitive intensity',
        },
        {
          id: 'HC_PH_IMM_2',
          name: 'Immunosuppression Risk Assessment',
          description: 'Must include immunosuppression risk assessment and mitigation plan.',
          dimension: 'safety',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Safety',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_pharma_thematic_cardiometabolic',
    name: 'Cardio-Metabolic Diseases',
    type: 'THEMATIC',
    description: 'Develop cardio-metabolic programs with clear clinical differentiation and scalable development plans',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Cardio-Metabolic Diseases',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 13,
      description: 'Thematic mandate for cardiovascular and metabolic disease programs.',
      objective: {
        primary: 'Develop cardio-metabolic programs with clear clinical differentiation and scalable development plans.',
        secondary: [
          'Prefer endpoints with shorter trial durations or well-established surrogates',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'US'],
        },
        domains: {
          included: ['Cardiology', 'Metabolic', 'Obesity', 'Diabetes'],
        },
        stages: {
          included: ['Preclinical', 'Phase 1', 'Phase 2'],
        },
        sizing: {
          min: 5000000,
          max: 35000000,
          currency: 'EUR',
          parameters: {
            maxYearsToPoC: 4,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PH_CM_1',
          name: 'Trial Feasibility',
          description: 'Must provide realistic trial feasibility (site availability, recruitment assumptions, duration).',
          dimension: 'trialFeasibility',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Execution',
        },
        {
          id: 'HC_PH_CM_2',
          name: 'Differentiation Required',
          description: 'Must show credible differentiation vs incumbents (efficacy, safety, convenience, adherence).',
          dimension: 'differentiation',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Crowded market',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_pharma_thematic_derm_sexual',
    name: 'Dermatology & Sexual Health',
    type: 'THEMATIC',
    description: 'Advance dermatology and sexual health assets with clear patient benefit and pragmatic clinical pathways',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Dermatology & Sexual Health',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 14,
      description: 'Thematic mandate for dermatology and sexual health programs.',
      objective: {
        primary: 'Advance dermatology and sexual health assets with clear patient benefit and pragmatic clinical pathways.',
        secondary: [
          'Prefer topical/local delivery and favorable safety profiles where possible',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'US'],
        },
        domains: {
          included: ['Dermatology', 'Sexual Health', 'Urology', "Women's Health"],
        },
        stages: {
          included: ['Preclinical', 'Phase 1', 'Phase 2', 'Phase 3'],
        },
        sizing: {
          min: 3000000,
          max: 25000000,
          currency: 'EUR',
          parameters: {
            maxYearsToPoC: 3,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PH_DERM_1',
          name: 'Target Product Profile',
          description: 'Must define Target Product Profile with measurable differentiation (speed of onset, tolerability, convenience).',
          dimension: 'tpp',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Commercial viability',
        },
        {
          id: 'HC_PH_DERM_2',
          name: 'Regulatory Strategy',
          description: 'Must have clear regulatory strategy and precedent for primary endpoint selection.',
          dimension: 'regulatory',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Regulatory feasibility',
        },
      ],
      riskPosture: 'CONSERVATIVE',
    },
  },
  {
    id: 'tpl_pharma_thematic_small_molecule',
    name: 'Small Molecules',
    type: 'THEMATIC',
    description: 'Advance small-molecule programs with strong medicinal chemistry rationale and scalable CMC route',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Small Molecules',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 15,
      description: 'Thematic mandate for small molecule drug programs.',
      objective: {
        primary: 'Advance small-molecule programs with strong medicinal chemistry rationale and scalable CMC route.',
        secondary: [
          'Prefer oral dosing and manufacturability advantages',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'US'],
        },
        domains: {
          included: ['Small Molecule'],
        },
        stages: {
          included: ['Discovery', 'Preclinical', 'Phase 1', 'Phase 2'],
        },
        sizing: {
          min: 3000000,
          max: 30000000,
          currency: 'EUR',
          parameters: {
            maxYearsToPoC: 4,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PH_SM_1',
          name: 'Developability Assessment',
          description: 'Must provide developability assessment (solubility, stability, ADME, off-target risk).',
          dimension: 'chemistry',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'CMC/PK risk',
        },
        {
          id: 'HC_PH_SM_2',
          name: 'IP Strategy',
          description: 'Must have credible composition-of-matter IP or defensible alternatives.',
          dimension: 'ip',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Exclusivity',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_pharma_thematic_peptides',
    name: 'Peptides & Macrocycles',
    type: 'THEMATIC',
    description: 'Advance peptide and macrocycle programs with clear delivery strategy and scalable manufacturing approach',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Peptides & Macrocycles',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 16,
      description: 'Thematic mandate for peptide and macrocycle programs.',
      objective: {
        primary: 'Advance peptide and macrocycle programs with clear delivery strategy and scalable manufacturing approach.',
        secondary: [
          'Prefer differentiated targets not addressable by small molecules',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'US'],
        },
        domains: {
          included: ['Peptide', 'Macrocycle'],
        },
        stages: {
          included: ['Preclinical', 'Phase 1', 'Phase 2'],
        },
        sizing: {
          min: 5000000,
          max: 30000000,
          currency: 'EUR',
          parameters: {
            maxYearsToPoC: 4,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PH_PEP_1',
          name: 'Delivery Strategy',
          description: 'Must define delivery route and feasibility (bioavailability, formulation, device if needed).',
          dimension: 'delivery',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Practicality',
        },
        {
          id: 'HC_PH_PEP_2',
          name: 'Scalable Synthesis',
          description: 'Must provide scalable synthesis and impurity/control strategy.',
          dimension: 'cmc',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'CMC risk',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_pharma_thematic_biologics',
    name: 'Biologics / Antibodies',
    type: 'THEMATIC',
    description: 'Advance biologics/antibody programs with clear target validation and manageable immunogenicity and CMC complexity',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Biologics / Antibodies',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 17,
      description: 'Thematic mandate for biologics and antibody programs.',
      objective: {
        primary: 'Advance biologics/antibody programs with clear target validation and manageable immunogenicity and CMC complexity.',
        secondary: [
          'Prefer strong binding/functional differentiation and clear developability',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'US'],
        },
        domains: {
          included: ['Biologics', 'Antibodies'],
        },
        stages: {
          included: ['Preclinical', 'Phase 1', 'Phase 2'],
        },
        sizing: {
          min: 10000000,
          max: 50000000,
          currency: 'EUR',
          parameters: {
            maxYearsToPoC: 5,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PH_BIO_1',
          name: 'Developability Screen',
          description: 'Must include developability screen (aggregation, stability, immunogenicity risk).',
          dimension: 'developability',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'CMC risk',
        },
        {
          id: 'HC_PH_BIO_2',
          name: 'Manufacturing Plan',
          description: 'Must have realistic manufacturing and comparability plan (CMO, process).',
          dimension: 'manufacturing',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Scale-up risk',
        },
      ],
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_pharma_thematic_gene_cell',
    name: 'Gene & Cell Therapy',
    type: 'THEMATIC',
    description: 'Advance gene/cell therapy programs with strong benefit-risk profile and credible manufacturing/commercialization path',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Gene & Cell Therapy',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 18,
      description: 'Thematic mandate for gene and cell therapy programs.',
      objective: {
        primary: 'Advance gene/cell therapy programs with strong benefit-risk profile and credible manufacturing/commercialization path.',
        secondary: [
          'Prefer rare disease or high unmet need with clear clinical endpoints',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'US'],
        },
        domains: {
          included: ['Gene Therapy', 'Cell Therapy'],
        },
        stages: {
          included: ['Preclinical', 'Phase 1', 'Phase 2'],
        },
        sizing: {
          min: 15000000,
          max: 80000000,
          currency: 'EUR',
          parameters: {
            maxYearsToPoC: 5,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PH_GCT_1',
          name: 'CMC/Manufacturing Plan',
          description: 'Requires credible CMC/manufacturing plan (vector, release assays, capacity).',
          dimension: 'cmc',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Manufacturing bottleneck',
        },
        {
          id: 'HC_PH_GCT_2',
          name: 'Long-term Safety Plan',
          description: 'Requires explicit long-term safety and follow-up plan consistent with regulator expectations.',
          dimension: 'safety',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Safety/regulatory',
        },
      ],
      riskPosture: 'AGGRESSIVE',
    },
  },
  {
    id: 'tpl_pharma_thematic_rna',
    name: 'RNA-based Therapeutics',
    type: 'THEMATIC',
    description: 'Advance RNA therapeutics with robust delivery strategy and clinically relevant target selection',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'RNA-based Therapeutics',
      type: 'THEMATIC',
      status: 'ACTIVE',
      priority: 19,
      description: 'Thematic mandate for RNA therapeutic programs.',
      objective: {
        primary: 'Advance RNA therapeutics with robust delivery strategy and clinically relevant target selection.',
        secondary: [
          'Prefer platforms with repeatability across targets',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'UK', 'US'],
        },
        domains: {
          included: ['RNA Therapeutics', 'siRNA', 'mRNA', 'ASO'],
        },
        stages: {
          included: ['Preclinical', 'Phase 1', 'Phase 2'],
        },
        sizing: {
          min: 10000000,
          max: 60000000,
          currency: 'EUR',
          parameters: {
            maxYearsToPoC: 5,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PH_RNA_1',
          name: 'Delivery Strategy Evidence',
          description: 'Must present delivery strategy evidence and tox risk assessment for delivery vehicle.',
          dimension: 'delivery',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Delivery is primary risk',
        },
        {
          id: 'HC_PH_RNA_2',
          name: 'Manufacturing Feasibility',
          description: 'Must present manufacturing feasibility (scale, QC assays, stability).',
          dimension: 'manufacturing',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'CMC risk',
        },
      ],
      riskPosture: 'AGGRESSIVE',
    },
  },
  {
    id: 'tpl_pharma_carveout_inlicensing',
    name: 'In-Licensing Carve-out',
    type: 'CARVEOUT',
    description: 'Acquire external clinical-stage assets that fill pipeline gaps with favorable deal economics',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'In-Licensing Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 3,
      description: 'Carve-out for acquiring external assets through licensing agreements to fill pipeline gaps.',
      objective: {
        primary: 'Acquire external clinical-stage assets that fill pipeline gaps with favorable deal economics.',
        secondary: [
          'Require human PoC data before acquisition',
          'Target back-loaded milestone structures and single-digit royalties where feasible',
        ],
      },
      scope: {
        geography: {
          regions: ['Global'],
        },
        domains: {
          included: [],
          notes: 'Cross-TA; aligned with Pipeline Strategy',
        },
        stages: {
          included: ['Phase 1', 'Phase 2'],
          excluded: ['Preclinical', 'Discovery'],
        },
        sizing: {
          min: 10000000,
          max: 300000000,
          currency: 'USD',
          parameters: {
            dealValueMin: 10000000,
            dealValueMax: 300000000,
            upfrontMax: 50000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PHARMA_LIC_1',
          name: 'Human Clinical Data',
          description: 'Asset must have human clinical data demonstrating proof of mechanism or preliminary efficacy.',
          dimension: 'clinical_data',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'De-risk external assets',
        },
        {
          id: 'HC_PHARMA_LIC_2',
          name: 'Clean IP',
          description: 'Asset must have freedom-to-operate opinion and unencumbered IP.',
          dimension: 'ip_status',
          operator: 'EQUALS',
          values: ['CLEAR'],
          severity: 'BLOCKING',
          rationale: 'Legal and commercial requirement',
        },
      ],
      allocation: {
        maxPct: 25,
      },
      riskPosture: 'MODERATE',
    },
  },
  {
    id: 'tpl_pharma_carveout_repurposing',
    name: 'Repurposing / Accelerated Pathways Carve-out',
    type: 'CARVEOUT',
    description: 'Pursue fast-to-market opportunities by repurposing existing compounds for new indications',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Repurposing / Accelerated Pathways Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 12,
      description: 'Carve-out for repurposing known compounds or leveraging accelerated regulatory pathways to reduce time-to-market.',
      objective: {
        primary: 'Pursue fast-to-market opportunities by repurposing existing compounds for new indications.',
        secondary: [
          'Prioritize assets with existing human safety data',
          'Target orphan, breakthrough, or accelerated designations',
        ],
      },
      scope: {
        geography: {
          regions: ['FDA (US)', 'EMA (EU)'],
        },
        domains: {
          included: ['Rare Disease', 'Oncology', 'Unmet Need'],
          notes: 'Indications eligible for special regulatory pathways',
        },
        stages: {
          included: ['Phase 2', 'Phase 3'],
        },
        sizing: {
          min: 5000000,
          max: 100000000,
          currency: 'USD',
          parameters: {
            maxYearsToPoC: 2,
            maxYearsToApproval: 4,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PHARMA_REP_1',
          name: 'Existing Safety Data',
          description: 'Compound must have established human safety profile from prior development.',
          dimension: 'safety_data',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'De-risk repurposing',
        },
        {
          id: 'HC_PHARMA_REP_2',
          name: 'Regulatory Pathway Eligibility',
          description: 'Indication must be eligible for accelerated, breakthrough, or orphan designation.',
          dimension: 'regulatory_pathway',
          operator: 'IN',
          values: ['ACCELERATED', 'BREAKTHROUGH', 'ORPHAN', 'FAST_TRACK'],
          severity: 'WARNING',
          rationale: 'Speed to market',
        },
        {
          id: 'HC_PHARMA_REP_3',
          name: 'Time to Approval',
          description: 'Projected approval within 4 years from program initiation.',
          dimension: 'years_to_approval',
          operator: 'LESS_THAN_OR_EQUAL',
          values: [4],
          severity: 'BLOCKING',
          rationale: 'Fast-to-market focus',
        },
      ],
      allocation: {
        maxPct: 15,
      },
      riskPosture: 'AGGRESSIVE',
    },
  },
  {
    id: 'tpl_pharma_carveout_late_stage_derisked',
    name: 'Late-Stage De-Risked Assets Carve-out',
    type: 'CARVEOUT',
    description: 'Acquire or partner on Phase 3-ready assets with validated efficacy signals to accelerate near-term launches',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Late-Stage De-Risked Assets Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 13,
      description: 'Carve-out for late-stage assets that have cleared major development hurdles and offer lower-risk path to approval.',
      objective: {
        primary: 'Acquire or partner on Phase 3-ready assets with validated efficacy signals to accelerate near-term launches.',
        secondary: [
          'Focus on assets with Phase 2 data meeting primary endpoints',
          'Target 3-4 year horizon to first commercial revenue',
        ],
      },
      scope: {
        geography: {
          regions: ['FDA (US)', 'EMA (EU)', 'Global'],
        },
        domains: {
          included: [],
          notes: 'Cross-TA; de-risked assets with clear development path',
        },
        stages: {
          included: ['Phase 2b', 'Phase 3'],
          excluded: ['Discovery', 'Preclinical', 'Phase 1'],
        },
        sizing: {
          min: 50000000,
          max: 500000000,
          currency: 'USD',
          parameters: {
            dealValueMin: 50000000,
            dealValueMax: 500000000,
            maxYearsToLaunch: 4,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PHARMA_LS_1',
          name: 'Phase 2 Data Available',
          description: 'Asset must have Phase 2 data meeting primary efficacy endpoints.',
          dimension: 'clinical_data',
          operator: 'EQUALS',
          values: ['PHASE_2_POSITIVE'],
          severity: 'BLOCKING',
          rationale: 'De-risk requirement',
        },
        {
          id: 'HC_PHARMA_LS_2',
          name: 'Clear Regulatory Path',
          description: 'Regulatory pathway and endpoint discussions with FDA/EMA must be complete.',
          dimension: 'regulatory_clarity',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Reduce approval uncertainty',
        },
        {
          id: 'HC_PHARMA_LS_3',
          name: 'Manufacturing Readiness',
          description: 'CMC package must be Phase 3-ready with commercial-scale path defined.',
          dimension: 'cmc_readiness',
          operator: 'EQUALS',
          values: ['PHASE_3_READY'],
          severity: 'BLOCKING',
          rationale: 'Execution risk mitigation',
        },
      ],
      allocation: {
        maxPct: 30,
      },
      riskPosture: 'CONSERVATIVE',
    },
  },
  {
    id: 'tpl_pharma_carveout_regional_rights',
    name: 'Regional Rights / Territory-Limited Deals Carve-out',
    type: 'CARVEOUT',
    description: 'Acquire limited geographic rights to external assets for targeted market entry',
    industry: 'PHARMA',
    isDefault: false,
    mandate: {
      name: 'Regional Rights / Territory-Limited Deals Carve-out',
      type: 'CARVEOUT',
      status: 'ACTIVE',
      priority: 14,
      description: 'Carve-out for acquiring limited territorial rights to external assets, enabling market-specific portfolio building.',
      objective: {
        primary: 'Acquire limited geographic rights to external assets for targeted market entry.',
        secondary: [
          'Focus on EU or Asia-Pacific rights where global originator lacks presence',
          'Leverage local regulatory and commercial capabilities',
        ],
      },
      scope: {
        geography: {
          regions: ['EU', 'Japan', 'China', 'Asia-Pacific'],
          notes: 'Non-US territories where we have commercial infrastructure',
        },
        domains: {
          included: [],
          notes: 'Cross-TA; depends on regional portfolio gaps',
        },
        stages: {
          included: ['Phase 2', 'Phase 3', 'Approved'],
        },
        sizing: {
          min: 10000000,
          max: 200000000,
          currency: 'USD',
          parameters: {
            dealValueMin: 10000000,
            dealValueMax: 200000000,
            upfrontMax: 30000000,
          },
        },
      },
      hardConstraints: [
        {
          id: 'HC_PHARMA_RR_1',
          name: 'Territory-Limited Scope',
          description: 'Deal must be for specific territories, not global rights.',
          dimension: 'deal_scope',
          operator: 'EQUALS',
          values: ['REGIONAL'],
          severity: 'BLOCKING',
          rationale: 'Carve-out scope',
        },
        {
          id: 'HC_PHARMA_RR_2',
          name: 'Local Commercial Capability',
          description: 'We must have commercial infrastructure in the target territory.',
          dimension: 'commercial_capability',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Execution capability',
        },
        {
          id: 'HC_PHARMA_RR_3',
          name: 'Regulatory Alignment',
          description: 'Asset must have clear regulatory path in target territory.',
          dimension: 'regional_regulatory',
          operator: 'EQUALS',
          values: [true],
          severity: 'BLOCKING',
          rationale: 'Approval feasibility',
        },
      ],
      allocation: {
        maxPct: 20,
      },
      riskPosture: 'MODERATE',
    },
  },
];

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

export const MANDATE_TEMPLATES: MandateTemplate[] = [
  ...VC_TEMPLATES,
  ...INSURANCE_TEMPLATES,
  ...PHARMA_TEMPLATES,
];

/**
 * Get templates filtered by industry
 */
export function getTemplatesForIndustry(industryProfile: string): MandateTemplate[] {
  return MANDATE_TEMPLATES.filter(t => t.industry === industryProfile);
}

/**
 * Get default templates for an industry (for quick setup)
 */
export function getDefaultTemplatesForIndustry(industryProfile: string): MandateTemplate[] {
  return MANDATE_TEMPLATES.filter(t => t.industry === industryProfile && t.isDefault);
}

/**
 * Get a template by ID
 */
export function getTemplateById(templateId: string): MandateTemplate | undefined {
  return MANDATE_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Create a mandate from a template with a unique ID
 */
export function createMandateFromTemplate(template: MandateTemplate): MandateDefinition {
  return {
    ...template.mandate,
    id: `mandate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Get recommended default mandate set for an industry
 * Returns the default templates ready to use
 */
export function getRecommendedDefaultMandates(industryProfile: string): MandateDefinition[] {
  const defaults = getDefaultTemplatesForIndustry(industryProfile);
  return defaults.map(createMandateFromTemplate);
}

/**
 * Get guidance for an industry
 */
export function getIndustryGuidance(industryProfile: string): IndustryMandateGuidance {
  return INDUSTRY_MANDATE_GUIDANCE[industryProfile] || INDUSTRY_MANDATE_GUIDANCE.GENERIC;
}
