import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type MetricsResponse = components["schemas"]["MetricsResponse"];

/**
 * Options for retrieving metrics with date filtering
 */
export interface GetMetricsOptions {
  /** Start date in YYYY-MM-DD format */
  startingDate?: string;
  /** End date in YYYY-MM-DD format */
  endingDate?: string;
}

/**
 * Resource class for metrics operations
 *
 * Provides read-only access to metrics data with refresh capability.
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // Get all metrics
 * const metrics = await client.metrics.get();
 *
 * // Get metrics for date range
 * const filtered = await client.metrics.get({
 *   startingDate: '2024-01-01',
 *   endingDate: '2024-01-31',
 * });
 *
 * // Trigger metrics refresh
 * await client.metrics.refresh();
 * ```
 */
export class MetricsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * Get metrics with optional date filtering
   *
   * @param options - Date range options
   * @returns Metrics response with daily aggregated data
   *
   * @example
   * ```typescript
   * // Get all metrics
   * const all = await client.metrics.get();
   *
   * // Get metrics for specific date range
   * const january = await client.metrics.get({
   *   startingDate: '2024-01-01',
   *   endingDate: '2024-01-31',
   * });
   * ```
   */
  async get(options?: GetMetricsOptions): Promise<MetricsResponse> {
    const params = new URLSearchParams();

    if (options?.startingDate) {
      params.append("starting_date", options.startingDate);
    }
    if (options?.endingDate) {
      params.append("ending_date", options.endingDate);
    }

    const queryString = params.toString();
    const path = queryString ? `/metrics?${queryString}` : "/metrics";

    return this.client.request<MetricsResponse>("GET", path);
  }

  /**
   * Trigger metrics refresh
   *
   * Initiates recalculation of metrics from source data.
   *
   * @example
   * ```typescript
   * await client.metrics.refresh();
   * console.log('Metrics refresh triggered');
   * ```
   */
  async refresh(): Promise<void> {
    await this.client.request<void>("POST", "/metrics/refresh");
  }
}
