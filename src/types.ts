import type { components } from "./generated/types";

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
 * Health status response from `GET /health`
 *
 * Mirrors the server's `HealthResponse` schema: `status` (`"ok"` on a healthy
 * instance) and `instantiated_at` (ISO-8601 timestamp of process start).
 */
export type HealthStatus = components["schemas"]["HealthResponse"];
