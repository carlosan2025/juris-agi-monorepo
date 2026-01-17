/**
 * Platform Database Client
 *
 * Manages connection to the Juris AGI platform database.
 * This database contains:
 * - Platform administrators (JurisAdmin)
 * - Tenant management (companies registered on platform)
 * - Subscription & billing data
 * - Platform-level API configurations
 * - Email templates and logs
 */

// Note: In production, this would import from the generated platform client
// import { PrismaClient } from '.prisma/platform-client';

// For now, we use a placeholder that will be replaced when platform DB is set up
import { PrismaClient } from '@prisma/client';

const globalForPlatformPrisma = globalThis as unknown as {
  platformPrisma: PrismaClient | undefined;
};

/**
 * Get the Platform Database client
 * This is a singleton that manages the Juris AGI platform database connection.
 */
export function getPlatformClient(): PrismaClient {
  if (!globalForPlatformPrisma.platformPrisma) {
    // In production, use PLATFORM_DATABASE_URL
    // For now, fallback to DATABASE_URL for development
    const url = process.env.PLATFORM_DATABASE_URL || process.env.DATABASE_URL;

    if (!url) {
      throw new Error(
        'Platform database URL not configured. Set PLATFORM_DATABASE_URL environment variable.'
      );
    }

    globalForPlatformPrisma.platformPrisma = new PrismaClient({
      datasources: {
        db: { url },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  return globalForPlatformPrisma.platformPrisma;
}

/**
 * Disconnect from the platform database
 * Call this during graceful shutdown.
 */
export async function disconnectPlatform(): Promise<void> {
  if (globalForPlatformPrisma.platformPrisma) {
    await globalForPlatformPrisma.platformPrisma.$disconnect();
    globalForPlatformPrisma.platformPrisma = undefined;
  }
}

// Export singleton for convenience
export const platformDb = getPlatformClient();

export default platformDb;
