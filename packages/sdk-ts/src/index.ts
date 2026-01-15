/**
 * JURIS-AGI TypeScript SDK
 *
 * Generated clients for Evidence API and JURIS-AGI API.
 *
 * @example
 * ```typescript
 * import { EvidenceApiClient, JurisAgiClient } from '@juris-agi/sdk';
 *
 * const evidenceClient = new EvidenceApiClient({
 *   baseUrl: process.env.EVIDENCE_API_URL,
 *   apiKey: process.env.EVIDENCE_API_KEY
 * });
 *
 * const context = await evidenceClient.createContext({
 *   deal_id: 'my-deal',
 *   question: 'Should we invest?'
 * });
 * ```
 */

export * from './evidence-client';
export * from './juris-agi-client';
export * from './types';
