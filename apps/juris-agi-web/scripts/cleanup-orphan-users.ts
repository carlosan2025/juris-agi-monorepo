/**
 * Cleanup script to delete users without a company assignment
 * Preserves Juris platform admin users (identified by email domain or specific emails)
 *
 * Run with: npx ts-node scripts/cleanup-orphan-users.ts
 * Or: npx tsx scripts/cleanup-orphan-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Platform admin email patterns - users matching these won't be deleted
const PLATFORM_ADMIN_PATTERNS = [
  '@juris.ai',
  '@jurisagi.com',
  // Add specific admin emails here if needed
];

function isPlatformAdmin(email: string): boolean {
  return PLATFORM_ADMIN_PATTERNS.some(pattern =>
    email.toLowerCase().includes(pattern.toLowerCase())
  );
}

async function cleanupOrphanUsers() {
  console.log('🔍 Finding users without company assignment...\n');

  // Find all users without a companyId
  const orphanUsers = await prisma.user.findMany({
    where: {
      companyId: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (orphanUsers.length === 0) {
    console.log('✅ No orphan users found. All users are assigned to a company.');
    return;
  }

  console.log(`Found ${orphanUsers.length} user(s) without company:\n`);

  // Categorize users
  const toDelete: typeof orphanUsers = [];
  const toPreserve: typeof orphanUsers = [];

  for (const user of orphanUsers) {
    if (isPlatformAdmin(user.email)) {
      toPreserve.push(user);
    } else {
      toDelete.push(user);
    }
  }

  // Show preserved users
  if (toPreserve.length > 0) {
    console.log('🛡️  Platform admins (will be PRESERVED):');
    toPreserve.forEach(user => {
      console.log(`   - ${user.email} (${user.name || 'No name'})`);
    });
    console.log('');
  }

  // Show users to delete
  if (toDelete.length > 0) {
    console.log('🗑️  Users to DELETE:');
    toDelete.forEach(user => {
      console.log(`   - ${user.email} (${user.name || 'No name'}) - Created: ${user.createdAt.toISOString()}`);
    });
    console.log('');

    // Delete the users
    console.log(`Deleting ${toDelete.length} user(s)...`);

    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: {
          in: toDelete.map(u => u.id),
        },
      },
    });

    console.log(`✅ Deleted ${deleteResult.count} user(s).`);
  } else {
    console.log('✅ No users to delete (all orphan users are platform admins).');
  }
}

async function main() {
  console.log('================================================');
  console.log('  Cleanup Orphan Users Script');
  console.log('================================================\n');

  try {
    await cleanupOrphanUsers();
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
