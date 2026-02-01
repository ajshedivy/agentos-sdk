import { createErrorFromResponse } from "./errors";
import { requestWithRetry } from "./http";
import { AgentsResource } from "./resources/agents";
import { TeamsResource } from "./resources/teams";
import { WorkflowsResource } from "./resources/workflows";
import { SessionsResource } from "./resources/sessions";
import { MemoriesResource } from "./resources/memories";
import { TracesResource } from "./resources/traces";
import { MetricsResource } from "./resources/metrics";
import { KnowledgeResource } from "./resources/knowledge";
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
  readonly agents: AgentsResource;
  readonly teams: TeamsResource;
  readonly workflows: WorkflowsResource;
  readonly sessions: SessionsResource;
  readonly memories: MemoriesResource;
  readonly traces: TracesResource;
  readonly metrics: MetricsResource;
  readonly knowledge: KnowledgeResource;

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

    // Initialize resource namespaces - pass client instance
    this.agents = new AgentsResource(this);
    this.teams = new TeamsResource(this);
    this.workflows = new WorkflowsResource(this);
    this.sessions = new SessionsResource(this);
    this.memories = new MemoriesResource(this);
    this.traces = new TracesResource(this);
    this.metrics = new MetricsResource(this);
    this.knowledge = new KnowledgeResource(this);
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
   *
   * @internal - Used by resource classes, not intended for direct SDK user access
   */
  async request<T>(
    method: RequestOptions["method"],
    path: string,
    options: Omit<RequestOptions, "method"> = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let headers = this.buildHeaders(options.headers);

    // Remove Content-Type for FormData - fetch auto-sets with boundary
    if (options.body instanceof FormData) {
      const { "Content-Type": _, ...headersWithoutContentType } = headers;
      headers = headersWithoutContentType;
    }

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
   * Make a streaming request that returns raw Response.
   *
   * Unlike request() which parses JSON, this returns the Response
   * for SSE streaming. Does NOT use retry logic - streaming requests
   * are not safely retryable.
   *
   * @internal - Used by resource classes for streaming endpoints
   */
  async requestStream(
    method: RequestOptions["method"],
    path: string,
    options: Omit<RequestOptions, "method"> = {},
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    let headers = this.buildHeaders(options.headers);

    // Remove Content-Type for FormData - fetch auto-sets with boundary
    if (options.body instanceof FormData) {
      const { "Content-Type": _, ...headersWithoutContentType } = headers;
      headers = headersWithoutContentType;
    }

    // Add Accept header for SSE
    headers.Accept = "text/event-stream";

    const fetchOptions: globalThis.RequestInit = {
      method,
      headers,
      body: options.body instanceof FormData ? options.body : undefined,
      signal: options.signal,
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const message = await response.text();
      const requestId = response.headers.get("x-request-id") ?? undefined;
      throw createErrorFromResponse(
        response.status,
        message,
        requestId,
        this.extractHeaders(response.headers),
      );
    }

    return response;
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

  /**
   * Extract headers from Headers object to plain record
   */
  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}
