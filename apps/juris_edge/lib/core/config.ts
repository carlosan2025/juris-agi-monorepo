/**
 * Core API Configuration
 */

export const coreConfig = {
  /**
   * API key for authenticating with the Core API.
   * In production, this should come from environment variables.
   */
  apiKey: process.env.CORE_API_KEY || 'dev-key-tenant-1',

  /**
   * Base URL for the Core API.
   */
  baseUrl: process.env.CORE_API_URL || 'http://localhost:8000',

  /**
   * Mode of operation.
   * - 'local': Core logic runs directly in the Edge process (development)
   * - 'remote': Core logic runs in a separate Core API service (production)
   */
  mode: (process.env.CORE_MODE || 'remote') as 'local' | 'remote',
};
