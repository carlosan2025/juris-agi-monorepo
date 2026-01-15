/**
 * Evidence API Client
 */

import type {
  ContextRequest,
  ContextResponse,
  Document,
  SearchRequest,
  SearchResponse,
  ClaimResponse,
} from './types';

export interface EvidenceApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export class EvidenceApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: EvidenceApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30000;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new EvidenceApiError(
          error.message || `HTTP ${response.status}`,
          response.status
        );
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; version?: string }> {
    return this.fetch('/api/v1/health');
  }

  /**
   * List documents
   */
  async listDocuments(params?: {
    project_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<Document[]> {
    const query = new URLSearchParams();
    if (params?.project_id) query.set('project_id', params.project_id);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const queryStr = query.toString();
    return this.fetch(`/api/v1/documents${queryStr ? `?${queryStr}` : ''}`);
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<Document> {
    return this.fetch(`/api/v1/documents/${documentId}`);
  }

  /**
   * Create evidence context for a deal/question
   */
  async createContext(request: ContextRequest): Promise<ContextResponse> {
    return this.fetch('/api/v1/context', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get claim by ID
   */
  async getClaim(claimId: string): Promise<ClaimResponse> {
    return this.fetch(`/api/v1/claims/${claimId}`);
  }

  /**
   * Semantic search
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    return this.fetch('/api/v1/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export class EvidenceApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'EvidenceApiError';
  }
}
