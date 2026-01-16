/**
 * Seed Script: Mandate Templates
 *
 * This script populates the MandateTemplate table with system-level
 * templates from the existing mandate-templates.ts file.
 *
 * Run with: npx ts-node prisma/seed-templates.ts
 * Or add to your existing seed.ts file
 */

import { PrismaClient, IndustryProfile, MandateTemplateType } from '@prisma/client';

const prisma = new PrismaClient();

// Type for the template structure from mandate-templates.ts
interface MandateTemplateInput {
  id: string;
  name: string;
  type: 'PRIMARY' | 'THEMATIC' | 'CARVEOUT';
  description: string;
  industry: string;
  isDefault: boolean;
  mandate: Record<string, unknown>;
}

// Function to map industry string to enum
function mapIndustryToEnum(industry: string): IndustryProfile {
  switch (industry) {
    case 'VENTURE_CAPITAL':
      return IndustryProfile.VENTURE_CAPITAL;
    case 'INSURANCE':
      return IndustryProfile.INSURANCE;
    case 'PHARMA':
      return IndustryProfile.PHARMA;
    default:
      return IndustryProfile.GENERIC;
  }
}

// Function to map type string to enum
function mapTypeToEnum(type: string): MandateTemplateType {
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

// Extract category from template for grouping
function extractCategory(template: MandateTemplateInput): string | null {
  // Try to extract category from the mandate name or description
  const domains = (template.mandate.scope as { domains?: { included?: string[] } })?.domains?.included;
  if (domains && domains.length > 0) {
    // Use the first domain as a rough category
    return domains[0];
  }
  return null;
}

// Extract tags from template
function extractTags(template: MandateTemplateInput): string[] {
  const tags: string[] = [];

  // Add type as a tag
  tags.push(template.type.toLowerCase());

  // Add industry
  tags.push(template.industry.toLowerCase().replace('_', '-'));

  // Add domains as tags
  const domains = (template.mandate.scope as { domains?: { included?: string[] } })?.domains?.included;
  if (domains) {
    tags.push(...domains.map((d) => d.toLowerCase().replace(/\s+/g, '-')));
  }

  // Add stages as tags
  const stages = (template.mandate.scope as { stages?: { included?: string[] } })?.stages?.included;
  if (stages) {
    tags.push(...stages.map((s) => s.toLowerCase().replace(/\s+/g, '-')));
  }

  return [...new Set(tags)]; // Dedupe
}

// System templates data - importing from the existing mandate-templates.ts
async function loadTemplates(): Promise<MandateTemplateInput[]> {
  // Dynamic import to get the templates
  const templateModule = await import('../lib/baseline/mandate-templates');

  // The templates are exported as MANDATE_TEMPLATES array
  if (templateModule.MANDATE_TEMPLATES && Array.isArray(templateModule.MANDATE_TEMPLATES)) {
    return templateModule.MANDATE_TEMPLATES as MandateTemplateInput[];
  }

  console.warn('No MANDATE_TEMPLATES export found, returning empty array');
  return [];
}

async function seedTemplates() {
  console.log('Starting template seeding...');

  try {
    // Load templates from the TypeScript file
    const templates = await loadTemplates();
    console.log(`Loaded ${templates.length} templates from mandate-templates.ts`);

    // Delete existing system templates (to allow re-seeding)
    const deleteResult = await prisma.mandateTemplate.deleteMany({
      where: { isSystem: true },
    });
    console.log(`Deleted ${deleteResult.count} existing system templates`);

    // Insert templates
    let successCount = 0;
    let errorCount = 0;

    for (const template of templates) {
      try {
        await prisma.mandateTemplate.create({
          data: {
            name: template.name,
            type: mapTypeToEnum(template.type),
            description: template.description,
            industry: mapIndustryToEnum(template.industry),
            isDefault: template.isDefault,
            isSystem: true,
            mandateData: template.mandate,
            version: 1,
            category: extractCategory(template),
            tags: extractTags(template),
            companyId: null, // System templates have no company
            createdById: null, // System templates have no creator
          },
        });
        successCount++;
        console.log(`  ✓ Created: ${template.name}`);
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Failed: ${template.name}`, error);
      }
    }

    console.log(`\nSeeding complete: ${successCount} created, ${errorCount} errors`);

    // Print summary by industry
    const summary = await prisma.mandateTemplate.groupBy({
      by: ['industry'],
      where: { isSystem: true },
      _count: true,
    });

    console.log('\nTemplates by industry:');
    for (const row of summary) {
      console.log(`  ${row.industry}: ${row._count}`);
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

// Main execution
seedTemplates()
  .then(() => {
    console.log('\nTemplate seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTemplate seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
