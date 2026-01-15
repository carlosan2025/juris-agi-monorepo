/**
 * JURIS-AGI Client
 */

import type {
  AnalyzeRequest,
  AnalyzeResponse,
  BuildContextRequest,
  BuildContextResponse,
  GenerateReportRequest,
  GenerateReportResponse,
} from './types';

export interface JurisAgiConfig {
  baseUrl: string;
  authToken?: string;
  timeout?: number;
}

export class JurisAgiClient {
  private baseUrl: string;
  private authToken?: string;
  private timeout: number;

  constructor(config: JurisAgiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.authToken = config.authToken;
    this.timeout = config.timeout ?? 60000;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
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
        throw new JurisAgiError(
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
  async health(): Promise<{ status: string; service: string; version?: string }> {
    return this.fetch('/api/health');
  }

  /**
   * Run analysis on a deal
   */
  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    return this.fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Stream analysis results
   */
  async analyzeStream(
    request: AnalyzeRequest,
    onEvent: (event: string) => void
  ): Promise<void> {
    const url = `${this.baseUrl}/api/analyze/stream`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new JurisAgiError(`HTTP ${response.status}`, response.status);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new JurisAgiError('No response body', 500);

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onEvent(decoder.decode(value));
    }
  }

  /**
   * Build evidence context
   */
  async buildContext(request: BuildContextRequest): Promise<BuildContextResponse> {
    return this.fetch('/api/context/build', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Generate report
   */
  async generateReport(request: GenerateReportRequest): Promise<GenerateReportResponse> {
    return this.fetch('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export class JurisAgiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'JurisAgiError';
  }
}
