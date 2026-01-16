/**
 * Reset script to delete ALL users and companies
 * WARNING: This is destructive and cannot be undone!
 *
 * Run with: npx ts-node scripts/reset-users-companies.ts
 * Or: npx tsx scripts/reset-users-companies.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetUsersAndCompanies() {
  console.log('================================================');
  console.log('  DELETE ALL USERS AND COMPANIES');
  console.log('================================================\n');

  // Count before deletion
  const userCount = await prisma.user.count();
  const companyCount = await prisma.company.count();

  console.log(`Current counts:`);
  console.log(`  - Users: ${userCount}`);
  console.log(`  - Companies: ${companyCount}\n`);

  if (userCount === 0 && companyCount === 0) {
    console.log('✅ Database is already empty.');
    return;
  }

  console.log('Deleting all data...\n');

  // Delete in correct order due to foreign key constraints
  // 1. Delete sessions first (references users)
  const sessionsDeleted = await prisma.session.deleteMany({});
  console.log(`  - Deleted ${sessionsDeleted.count} sessions`);

  // 2. Delete accounts (references users)
  const accountsDeleted = await prisma.account.deleteMany({});
  console.log(`  - Deleted ${accountsDeleted.count} accounts`);

  // 3. Delete users
  const usersDeleted = await prisma.user.deleteMany({});
  console.log(`  - Deleted ${usersDeleted.count} users`);

  // 4. Delete portfolios (references companies)
  const portfoliosDeleted = await prisma.portfolio.deleteMany({});
  console.log(`  - Deleted ${portfoliosDeleted.count} portfolios`);

  // 5. Delete mandates and related data
  const mandatesDeleted = await prisma.mandate.deleteMany({});
  console.log(`  - Deleted ${mandatesDeleted.count} mandates`);

  // 6. Delete companies
  const companiesDeleted = await prisma.company.deleteMany({});
  console.log(`  - Deleted ${companiesDeleted.count} companies`);

  console.log('\n✅ All users and companies have been deleted.');
  console.log('   You can now register a new user to start fresh.');
}

async function main() {
  try {
    await resetUsersAndCompanies();
  } catch (error) {
    console.error('❌ Error during reset:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
