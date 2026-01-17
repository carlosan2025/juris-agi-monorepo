/**
 * Seed Script: All Template Types
 *
 * This script populates all template tables with system-level
 * templates from the existing template files:
 * - MandateTemplate
 * - GovernanceTemplate
 * - ExclusionTemplate
 * - RiskAppetiteTemplate
 *
 * Run with: npx ts-node prisma/seed-templates.ts
 * Or add to your existing seed.ts file
 */

import { PrismaClient, IndustryProfile, MandateTemplateType, ExclusionType } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface MandateTemplateInput {
  id: string;
  name: string;
  type: 'PRIMARY' | 'THEMATIC' | 'CARVEOUT';
  description: string;
  industry: string;
  isDefault: boolean;
  mandate: Record<string, unknown>;
}

interface GovernanceTemplateInput {
  id: string;
  name: string;
  description: string;
  industry: string;
  isDefault: boolean;
  governance: Record<string, unknown>;
}

interface ExclusionTemplateInput {
  id: string;
  name: string;
  type: 'HARD' | 'CONDITIONAL';
  description: string;
  industry: string;
  isDefault: boolean;
  exclusion: Record<string, unknown>;
}

interface RiskAppetiteTemplateInput {
  id: string;
  name: string;
  description: string;
  industry: string;
  isDefault: boolean;
  riskAppetite: Record<string, unknown>;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapIndustryToEnum(industry: string): IndustryProfile {
  switch (industry.toUpperCase()) {
    case 'VENTURE_CAPITAL':
    case 'VC':
      return IndustryProfile.VENTURE_CAPITAL;
    case 'INSURANCE':
    case 'INS':
      return IndustryProfile.INSURANCE;
    case 'PHARMA':
    case 'PHARMACEUTICAL':
      return IndustryProfile.PHARMA;
    default:
      return IndustryProfile.GENERIC;
  }
}

function mapMandateTypeToEnum(type: string): MandateTemplateType {
  switch (type) {
    case 'PRIMARY':
      return MandateTemplateType.PRIMARY;
    case 'THEMATIC':
      return MandateTemplateType.THEMATIC;
    case 'CARVEOUT':
      return MandateTemplateType.CARVEOUT;
    default:
      return MandateTemplateType.PRIMARY;
  }
}

function mapExclusionTypeToEnum(type: string): ExclusionType {
  switch (type) {
    case 'HARD':
      return ExclusionType.HARD;
    case 'CONDITIONAL':
      return ExclusionType.CONDITIONAL;
    default:
      return ExclusionType.HARD;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractMandateCategory(template: MandateTemplateInput): string | null {
  const domains = (template.mandate.scope as { domains?: { included?: string[] } })?.domains?.included;
  if (domains && domains.length > 0) {
    return domains[0];
  }
  return null;
}

function extractMandateTags(template: MandateTemplateInput): string[] {
  const tags: string[] = [];
  tags.push(template.type.toLowerCase());
  tags.push(template.industry.toLowerCase().replace('_', '-'));

  const domains = (template.mandate.scope as { domains?: { included?: string[] } })?.domains?.included;
  if (domains) {
    tags.push(...domains.map((d) => d.toLowerCase().replace(/\s+/g, '-')));
  }

  const stages = (template.mandate.scope as { stages?: { included?: string[] } })?.stages?.included;
  if (stages) {
    tags.push(...stages.map((s) => s.toLowerCase().replace(/\s+/g, '-')));
  }

  return [...new Set(tags)];
}

function extractGovernanceTags(template: GovernanceTemplateInput): string[] {
  const tags: string[] = [];
  tags.push('governance');
  tags.push(template.industry.toLowerCase().replace('_', '-'));

  // Extract from governance data
  const governance = template.governance as { committees?: { name?: string }[] };
  if (governance.committees) {
    for (const committee of governance.committees) {
      if (committee.name) {
        tags.push(committee.name.toLowerCase().replace(/\s+/g, '-'));
      }
    }
  }

  return [...new Set(tags)];
}

function extractExclusionTags(template: ExclusionTemplateInput): string[] {
  const tags: string[] = [];
  tags.push(template.type.toLowerCase());
  tags.push(template.industry.toLowerCase().replace('_', '-'));
  tags.push('exclusion');

  const exclusion = template.exclusion as { dimension?: string };
  if (exclusion.dimension) {
    tags.push(exclusion.dimension.toLowerCase().replace(/\s+/g, '-'));
  }

  return [...new Set(tags)];
}

function extractRiskAppetiteTags(template: RiskAppetiteTemplateInput): string[] {
  const tags: string[] = [];
  tags.push('risk-appetite');
  tags.push(template.industry.toLowerCase().replace('_', '-'));

  const risk = template.riskAppetite as { dimensions?: { id?: string }[] };
  if (risk.dimensions) {
    for (const dim of risk.dimensions) {
      if (dim.id) {
        tags.push(dim.id.toLowerCase().replace(/\s+/g, '-'));
      }
    }
  }

  return [...new Set(tags)];
}

// ============================================================================
// LOADER FUNCTIONS
// ============================================================================

async function loadMandateTemplates(): Promise<MandateTemplateInput[]> {
  try {
    const templateModule = await import('../lib/baseline/mandate-templates');
    if (templateModule.MANDATE_TEMPLATES && Array.isArray(templateModule.MANDATE_TEMPLATES)) {
      return templateModule.MANDATE_TEMPLATES as MandateTemplateInput[];
    }
  } catch (error) {
    console.warn('Failed to load mandate templates:', error);
  }
  return [];
}

async function loadGovernanceTemplates(): Promise<GovernanceTemplateInput[]> {
  try {
    const templateModule = await import('../lib/baseline/governance-templates');
    if (templateModule.ALL_GOVERNANCE_TEMPLATES && Array.isArray(templateModule.ALL_GOVERNANCE_TEMPLATES)) {
      return templateModule.ALL_GOVERNANCE_TEMPLATES as GovernanceTemplateInput[];
    }
  } catch (error) {
    console.warn('Failed to load governance templates:', error);
  }
  return [];
}

async function loadExclusionTemplates(): Promise<ExclusionTemplateInput[]> {
  try {
    const templateModule = await import('../lib/baseline/exclusion-templates');
    if (templateModule.ALL_EXCLUSION_TEMPLATES && Array.isArray(templateModule.ALL_EXCLUSION_TEMPLATES)) {
      return templateModule.ALL_EXCLUSION_TEMPLATES as ExclusionTemplateInput[];
    }
    // Try alternative export name
    if (templateModule.EXCLUSION_TEMPLATES && Array.isArray(templateModule.EXCLUSION_TEMPLATES)) {
      return templateModule.EXCLUSION_TEMPLATES as ExclusionTemplateInput[];
    }
  } catch (error) {
    console.warn('Failed to load exclusion templates:', error);
  }
  return [];
}

async function loadRiskAppetiteTemplates(): Promise<RiskAppetiteTemplateInput[]> {
  try {
    const templateModule = await import('../lib/baseline/risk-appetite-templates');
    // Use the getAllTemplates() function which returns ALL_TEMPLATES
    if (templateModule.getAllTemplates && typeof templateModule.getAllTemplates === 'function') {
      const templates = templateModule.getAllTemplates();
      if (Array.isArray(templates)) {
        return templates as RiskAppetiteTemplateInput[];
      }
    }
    // Try array exports
    if (templateModule.ALL_RISK_APPETITE_TEMPLATES && Array.isArray(templateModule.ALL_RISK_APPETITE_TEMPLATES)) {
      return templateModule.ALL_RISK_APPETITE_TEMPLATES as RiskAppetiteTemplateInput[];
    }
    if (templateModule.RISK_APPETITE_TEMPLATES && Array.isArray(templateModule.RISK_APPETITE_TEMPLATES)) {
      return templateModule.RISK_APPETITE_TEMPLATES as RiskAppetiteTemplateInput[];
    }
  } catch (error) {
    console.warn('Failed to load risk appetite templates:', error);
  }
  return [];
}

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

async function seedMandateTemplates() {
  console.log('\n📋 Seeding Mandate Templates...');

  const templates = await loadMandateTemplates();
  console.log(`  Loaded ${templates.length} templates from mandate-templates.ts`);

  const deleteResult = await prisma.mandateTemplate.deleteMany({
    where: { isSystem: true },
  });
  console.log(`  Deleted ${deleteResult.count} existing system templates`);

  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      await prisma.mandateTemplate.create({
        data: {
          name: template.name,
          type: mapMandateTypeToEnum(template.type),
          description: template.description,
          industry: mapIndustryToEnum(template.industry),
          isDefault: template.isDefault,
          isSystem: true,
          mandateData: template.mandate,
          version: 1,
          category: extractMandateCategory(template),
          tags: extractMandateTags(template),
          companyId: null,
          createdById: null,
        },
      });
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Failed: ${template.name}`, error);
    }
  }

  console.log(`  ✓ Created ${successCount} mandate templates (${errorCount} errors)`);
  return { success: successCount, errors: errorCount };
}

async function seedGovernanceTemplates() {
  console.log('\n⚖️ Seeding Governance Templates...');

  const templates = await loadGovernanceTemplates();
  console.log(`  Loaded ${templates.length} templates from governance-templates.ts`);

  const deleteResult = await prisma.governanceTemplate.deleteMany({
    where: { isSystem: true },
  });
  console.log(`  Deleted ${deleteResult.count} existing system templates`);

  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      await prisma.governanceTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          industry: mapIndustryToEnum(template.industry),
          isDefault: template.isDefault,
          isSystem: true,
          governanceData: template.governance,
          version: 1,
          category: null,
          tags: extractGovernanceTags(template),
          companyId: null,
          createdById: null,
        },
      });
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Failed: ${template.name}`, error);
    }
  }

  console.log(`  ✓ Created ${successCount} governance templates (${errorCount} errors)`);
  return { success: successCount, errors: errorCount };
}

async function seedExclusionTemplates() {
  console.log('\n🚫 Seeding Exclusion Templates...');

  const templates = await loadExclusionTemplates();
  console.log(`  Loaded ${templates.length} templates from exclusion-templates.ts`);

  const deleteResult = await prisma.exclusionTemplate.deleteMany({
    where: { isSystem: true },
  });
  console.log(`  Deleted ${deleteResult.count} existing system templates`);

  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      await prisma.exclusionTemplate.create({
        data: {
          name: template.name,
          type: mapExclusionTypeToEnum(template.type),
          description: template.description,
          industry: mapIndustryToEnum(template.industry),
          isDefault: template.isDefault,
          isSystem: true,
          exclusionData: template.exclusion,
          version: 1,
          category: null,
          tags: extractExclusionTags(template),
          companyId: null,
          createdById: null,
        },
      });
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Failed: ${template.name}`, error);
    }
  }

  console.log(`  ✓ Created ${successCount} exclusion templates (${errorCount} errors)`);
  return { success: successCount, errors: errorCount };
}

async function seedRiskAppetiteTemplates() {
  console.log('\n📊 Seeding Risk Appetite Templates...');

  const templates = await loadRiskAppetiteTemplates();
  console.log(`  Loaded ${templates.length} templates from risk-appetite-templates.ts`);

  const deleteResult = await prisma.riskAppetiteTemplate.deleteMany({
    where: { isSystem: true },
  });
  console.log(`  Deleted ${deleteResult.count} existing system templates`);

  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      await prisma.riskAppetiteTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          industry: mapIndustryToEnum(template.industry),
          isDefault: template.isDefault,
          isSystem: true,
          riskData: template.riskAppetite,
          version: 1,
          category: null,
          tags: extractRiskAppetiteTags(template),
          companyId: null,
          createdById: null,
        },
      });
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Failed: ${template.name}`, error);
    }
  }

  console.log(`  ✓ Created ${successCount} risk appetite templates (${errorCount} errors)`);
  return { success: successCount, errors: errorCount };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function seedAllTemplates() {
  console.log('🌱 Starting template seeding...');
  console.log('='.repeat(50));

  try {
    const results = {
      mandate: await seedMandateTemplates(),
      governance: await seedGovernanceTemplates(),
      exclusion: await seedExclusionTemplates(),
      riskAppetite: await seedRiskAppetiteTemplates(),
    };

    console.log('\n' + '='.repeat(50));
    console.log('📈 Summary:');
    console.log(`  Mandate Templates:      ${results.mandate.success} created, ${results.mandate.errors} errors`);
    console.log(`  Governance Templates:   ${results.governance.success} created, ${results.governance.errors} errors`);
    console.log(`  Exclusion Templates:    ${results.exclusion.success} created, ${results.exclusion.errors} errors`);
    console.log(`  Risk Appetite Templates: ${results.riskAppetite.success} created, ${results.riskAppetite.errors} errors`);

    const totalSuccess =
      results.mandate.success +
      results.governance.success +
      results.exclusion.success +
      results.riskAppetite.success;
    const totalErrors =
      results.mandate.errors +
      results.governance.errors +
      results.exclusion.errors +
      results.riskAppetite.errors;

    console.log(`\n  Total: ${totalSuccess} templates created, ${totalErrors} errors`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

// Main execution
seedAllTemplates()
  .then(() => {
    console.log('\n✅ Template seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Template seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
