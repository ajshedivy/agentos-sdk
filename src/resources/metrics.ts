import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type MetricsResponse = components["schemas"]["MetricsResponse"];
type DayAggregatedMetrics = components["schemas"]["DayAggregatedMetrics"];
type MetricsRefreshResponse = components["schemas"]["MetricsRefreshResponse"];
type MetricsRefreshStatusResponse =
  components["schemas"]["MetricsRefreshStatusResponse"];

/**
 * Options for retrieving metrics with date filtering
 */
export interface GetMetricsOptions {
  /** Start date in YYYY-MM-DD format */
  startingDate?: string;
  /** End date in YYYY-MM-DD format */
  endingDate?: string;
  /** Filter metrics to a single user */
  userId?: string;
  /** Database ID */
  dbId?: string;
}

/**
 * Options for triggering a metrics refresh
 */
export interface RefreshMetricsOptions {
  /** Database ID */
  dbId?: string;
  /**
   * Run the refresh in the background. The server answers 202 immediately
   * with `{ status: "started" | "already_running", message }`; poll
   * {@link MetricsResource.refreshStatus} (or `get()`) for the result.
   */
  background?: boolean;
}

/**
 * Options for reading the metrics refresh status
 */
export interface RefreshStatusOptions {
  /** Database ID */
  dbId?: string;
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
 * // Recalculate metrics and get the refreshed day list back
 * const days = await client.metrics.refresh();
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
    if (options?.userId !== undefined) {
      params.append("user_id", options.userId);
    }
    if (options?.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }

    const queryString = params.toString();
    const path = queryString ? `/metrics?${queryString}` : "/metrics";

    return this.client.request<MetricsResponse>("GET", path);
  }

  /**
   * Trigger metrics refresh
   *
   * Recalculates metrics from source data. By default the server runs the
   * refresh synchronously and returns the refreshed `DayAggregatedMetrics[]`.
   * With `background: true` it returns 202 immediately with a
   * `MetricsRefreshResponse` (`status: "started"`). Either mode answers
   * `{ status: "already_running" }` instead of starting a second refresh for
   * the same database, so discriminate with `Array.isArray()`.
   *
   * @param options - Database ID and background flag
   * @returns The refreshed day list, or a status object
   *
   * @example
   * ```typescript
   * const result = await client.metrics.refresh();
   * if (Array.isArray(result)) {
   *   console.log(`${result.length} days refreshed`);
   * } else {
   *   console.log(result.status); // "already_running"
   * }
   *
   * const started = await client.metrics.refresh({ background: true });
   * console.log(started.status); // "started" | "already_running"
   * ```
   */
  async refresh(
    options?: RefreshMetricsOptions,
  ): Promise<DayAggregatedMetrics[] | MetricsRefreshResponse> {
    const params = new URLSearchParams();
    if (options?.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }
    if (options?.background) {
      params.append("background", "true");
    }
    const queryString = params.toString();
    const path = queryString
      ? `/metrics/refresh?${queryString}`
      : "/metrics/refresh";

    return this.client.request<DayAggregatedMetrics[] | MetricsRefreshResponse>(
      "POST",
      path,
    );
  }

  /**
   * Get the status of the most recent metrics refresh
   *
   * `status` is `"idle"` when no refresh has run since the server started,
   * `"running"` while one is in progress, then `"completed"` or `"failed"`
   * (with `error` set). Intended for polling after
   * `refresh({ background: true })`.
   *
   * @param options - Database ID
   * @returns Refresh status with `started_at` / `finished_at` timestamps
   *
   * @example
   * ```typescript
   * const status = await client.metrics.refreshStatus();
   * console.log(status.status, status.finished_at);
   * ```
   */
  async refreshStatus(
    options?: RefreshStatusOptions,
  ): Promise<MetricsRefreshStatusResponse> {
    const params = new URLSearchParams();
    if (options?.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }
    const queryString = params.toString();
    const path = queryString
      ? `/metrics/refresh/status?${queryString}`
      : "/metrics/refresh/status";

    return this.client.request<MetricsRefreshStatusResponse>("GET", path);
  }
}
