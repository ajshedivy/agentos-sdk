import { requestWithRetry } from "./http";
import type {
  AgentOSClientOptions,
  HealthStatus,
  OSConfig,
  RequestOptions,
} from "./types";

/**
 * AgentOS API client
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({
 *   baseUrl: 'https://api.agentos.example.com',
 *   apiKey: 'your-api-key',
 * });
 *
 * const config = await client.getConfig();
 * const health = await client.health();
 * ```
 */
export class AgentOSClient {
  readonly version = "0.1.0";

  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: AgentOSClientOptions) {
    if (!options.baseUrl) {
      throw new Error("baseUrl is required");
    }

    // Remove trailing slash for consistent URL joining
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeout = options.timeout ?? 30000;
    this.maxRetries = options.maxRetries ?? 2;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "User-Agent": `agentos-sdk/${this.version}`,
      ...options.headers,
    };
  }

  /**
   * Get OS configuration
   */
  async getConfig(): Promise<OSConfig> {
    return this.request<OSConfig>("GET", "/config");
  }

  /**
   * Check API health status
   */
  async health(): Promise<HealthStatus> {
    return this.request<HealthStatus>("GET", "/health");
  }

  /**
   * Make an authenticated request to the API
   */
  private async request<T>(
    method: RequestOptions["method"],
    path: string,
    options: Omit<RequestOptions, "method"> = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.buildHeaders(options.headers);

    return requestWithRetry<T>(
      url,
      {
        method,
        headers,
        body: options.body,
        signal: options.signal,
      },
      this.maxRetries,
      this.timeout,
    );
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(
    overrideHeaders?: Record<string, string>,
  ): Record<string, string> {
    const headers = { ...this.defaultHeaders };

    // Add Bearer token if API key is configured
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    // Apply per-request header overrides
    if (overrideHeaders) {
      Object.assign(headers, overrideHeaders);
    }

    return headers;
  }
}
