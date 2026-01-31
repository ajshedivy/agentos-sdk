/**
 * Configuration options for the AgentOSClient
 */
export interface AgentOSClientOptions {
  /**
   * Base URL for the AgentOS API (required)
   * @example "https://api.agentos.example.com"
   */
  baseUrl: string;

  /**
   * API key for Bearer token authentication (optional)
   * Can also be provided per-request via headers
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts for transient failures
   * @default 2
   */
  maxRetries?: number;

  /**
   * Additional headers to include in all requests
   */
  headers?: Record<string, string>;
}

/**
 * Internal request options for HTTP calls
 */
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * OS configuration response from /config endpoint
 */
export interface OSConfig {
  version: string;
  environment: string;
  features: Record<string, boolean>;
}

/**
 * Health status response from /health endpoint
 */
export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  details?: Record<string, unknown>;
}
