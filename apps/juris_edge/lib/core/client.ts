/**
 * Core API Client
 * Client for communicating with the Juris Core API.
 */

import {
  SolveRequest,
  SolveResponse,
  JobResult,
  EventsResponse,
  ReasoningEvent,
  HealthResponse,
} from './types';
import { coreConfig } from './config';

/**
 * Convert camelCase to snake_case for API requests
 */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = toSnakeCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map((item) =>
        typeof item === 'object' ? toSnakeCase(item as Record<string, unknown>) : item
      );
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}

/**
 * Convert snake_case to camelCase for API responses
 */
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        typeof item === 'object' ? toCamelCase(item as Record<string, unknown>) : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

export class CoreApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || coreConfig.baseUrl;
    this.apiKey = apiKey || coreConfig.apiKey;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API error: ${response.status}`);
    }

    const data = await response.json();
    return toCamelCase(data) as T;
  }

  /**
   * Submit a solve request to the Core API.
   */
  async solve(request: SolveRequest): Promise<SolveResponse> {
    const snakeCaseRequest = toSnakeCase(request as unknown as Record<string, unknown>);

    return this.fetch<SolveResponse>('/api/v1/solve', {
      method: 'POST',
      body: JSON.stringify(snakeCaseRequest),
    });
  }

  /**
   * Get the status and results of a job.
   */
  async getJob(jobId: string): Promise<JobResult> {
    return this.fetch<JobResult>(`/api/v1/jobs/${jobId}`);
  }

  /**
   * Get reasoning events for a job.
   */
  async getEvents(jobId: string, cursor?: string): Promise<EventsResponse> {
    const params = cursor ? `?after=${cursor}` : '';
    return this.fetch<EventsResponse>(`/api/v1/jobs/${jobId}/events${params}`);
  }

  /**
   * Poll until a job completes, optionally receiving events.
   */
  async pollUntilComplete(
    jobId: string,
    onEvent?: (event: ReasoningEvent) => void,
    pollInterval = 1000
  ): Promise<JobResult> {
    let cursor: string | undefined;

    while (true) {
      const result = await this.getJob(jobId);

      if (onEvent) {
        try {
          const events = await this.getEvents(jobId, cursor);
          events.events.forEach(onEvent);
          cursor = events.cursor;
        } catch (e) {
          // Events may not be available yet
        }
      }

      if (result.status === 'completed' || result.status === 'failed' || result.status === 'cancelled') {
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Cancel a running or pending job.
   */
  async cancelJob(jobId: string): Promise<{ message: string; jobId: string }> {
    return this.fetch<{ message: string; jobId: string }>(`/api/v1/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
  }

  /**
   * Check the health of the Core API.
   */
  async health(): Promise<HealthResponse> {
    return this.fetch<HealthResponse>('/health');
  }
}

// Singleton instance
let coreClient: CoreApiClient | null = null;

/**
 * Get the Core API client singleton.
 */
export function getCoreClient(): CoreApiClient {
  if (!coreClient) {
    coreClient = new CoreApiClient();
  }
  return coreClient;
}

/**
 * Reset the Core API client (useful for testing).
 */
export function resetCoreClient(): void {
  coreClient = null;
}
