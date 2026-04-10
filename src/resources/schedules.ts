import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type ScheduleResponse = components["schemas"]["ScheduleResponse"];
type ScheduleCreate = components["schemas"]["ScheduleCreate"];
type ScheduleUpdate = components["schemas"]["ScheduleUpdate"];
type ScheduleRunResponse = components["schemas"]["ScheduleRunResponse"];
type ScheduleStateResponse = components["schemas"]["ScheduleStateResponse"];
type PaginatedScheduleResponse =
  components["schemas"]["PaginatedResponse_ScheduleResponse_"];
type PaginatedScheduleRunResponse =
  components["schemas"]["PaginatedResponse_ScheduleRunResponse_"];

/**
 * Options for listing schedules
 */
export interface ListSchedulesOptions {
  /** Filter by enabled status */
  enabled?: boolean;
  /** Number of items per page */
  limit?: number;
  /** Page number for pagination */
  page?: number;
}

/**
 * Options for creating a schedule
 */
export interface CreateScheduleOptions {
  /** Schedule name */
  name: string;
  /** Cron expression defining the schedule */
  cronExpr: string;
  /** Endpoint to call when the schedule fires */
  endpoint: string;
  /** HTTP method to use */
  method: string;
  /** Optional description */
  description?: string;
  /** Optional JSON payload to send */
  payload?: Record<string, unknown>;
  /** Optional timezone (e.g. 'America/New_York') */
  timezone?: string;
  /** Optional timeout in seconds */
  timeoutSeconds?: number;
  /** Optional maximum number of retries */
  maxRetries?: number;
  /** Optional delay between retries in seconds */
  retryDelaySeconds?: number;
}

/**
 * Options for updating a schedule
 */
export interface UpdateScheduleOptions {
  /** Schedule name */
  name?: string;
  /** Cron expression defining the schedule */
  cronExpr?: string;
  /** Endpoint to call when the schedule fires */
  endpoint?: string;
  /** HTTP method to use */
  method?: string;
  /** Description */
  description?: string;
  /** JSON payload to send */
  payload?: Record<string, unknown>;
  /** Timezone (e.g. 'America/New_York') */
  timezone?: string;
  /** Timeout in seconds */
  timeoutSeconds?: number;
  /** Maximum number of retries */
  maxRetries?: number;
  /** Delay between retries in seconds */
  retryDelaySeconds?: number;
}

/**
 * Resource class for schedule operations
 *
 * Provides methods to:
 * - List, create, get, update, and delete schedules
 * - Enable and disable schedules
 * - List and get schedule runs
 * - Trigger a schedule manually
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all schedules
 * const schedules = await client.schedules.list();
 *
 * // Create a schedule
 * const schedule = await client.schedules.create({
 *   name: 'Daily Report',
 *   cronExpr: '0 9 * * *',
 *   endpoint: '/api/reports/generate',
 *   method: 'POST',
 * });
 *
 * // Trigger a schedule manually
 * const run = await client.schedules.trigger('schedule-id');
 * ```
 */
export class SchedulesResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List schedules with optional filtering and pagination
   *
   * @param options - Optional filters and pagination parameters
   * @returns Paginated response with schedules
   *
   * @example
   * ```typescript
   * const response = await client.schedules.list({
   *   enabled: true,
   *   page: 1,
   *   limit: 20,
   * });
   * console.log(response.data);
   * ```
   */
  async list(
    options?: ListSchedulesOptions,
  ): Promise<PaginatedScheduleResponse> {
    const params = new URLSearchParams();

    if (options?.enabled !== undefined) {
      params.append("enabled", String(options.enabled));
    }
    if (options?.limit !== undefined) {
      params.append("limit", String(options.limit));
    }
    if (options?.page !== undefined) {
      params.append("page", String(options.page));
    }

    const queryString = params.toString();
    const path = queryString ? `/schedules?${queryString}` : "/schedules";

    return this.client.request<PaginatedScheduleResponse>("GET", path);
  }

  /**
   * Create a new schedule
   *
   * @param options - Schedule creation options
   * @returns Created schedule
   *
   * @example
   * ```typescript
   * const schedule = await client.schedules.create({
   *   name: 'Hourly Sync',
   *   cronExpr: '0 * * * *',
   *   endpoint: '/api/sync',
   *   method: 'POST',
   *   timezone: 'UTC',
   *   timeoutSeconds: 60,
   * });
   * ```
   */
  async create(options: CreateScheduleOptions): Promise<ScheduleResponse> {
    const body: ScheduleCreate = {
      name: options.name,
      cron_expr: options.cronExpr,
      endpoint: options.endpoint,
      method: options.method,
      timezone: options.timezone ?? "UTC",
      timeout_seconds: options.timeoutSeconds ?? 3600,
      max_retries: options.maxRetries ?? 0,
      retry_delay_seconds: options.retryDelaySeconds ?? 60,
    };

    if (options.description !== undefined) {
      body.description = options.description;
    }
    if (options.payload !== undefined) {
      body.payload = options.payload;
    }

    return this.client.request<ScheduleResponse>("POST", "/schedules", {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Get schedule details by ID
   *
   * @param scheduleId - The unique identifier for the schedule
   * @returns Schedule details
   *
   * @example
   * ```typescript
   * const schedule = await client.schedules.get('schedule-123');
   * console.log(schedule.name, schedule.cron_expr);
   * ```
   */
  async get(scheduleId: string): Promise<ScheduleResponse> {
    return this.client.request<ScheduleResponse>(
      "GET",
      `/schedules/${encodeURIComponent(scheduleId)}`,
    );
  }

  /**
   * Update an existing schedule
   *
   * @param scheduleId - The unique identifier for the schedule
   * @param options - Fields to update (all optional)
   * @returns Updated schedule
   *
   * @example
   * ```typescript
   * const updated = await client.schedules.update('schedule-123', {
   *   cronExpr: '0 0/2 * * *',
   *   timeoutSeconds: 120,
   * });
   * ```
   */
  async update(
    scheduleId: string,
    options: UpdateScheduleOptions,
  ): Promise<ScheduleResponse> {
    const body: ScheduleUpdate = {};

    if (options.name !== undefined) {
      body.name = options.name;
    }
    if (options.cronExpr !== undefined) {
      body.cron_expr = options.cronExpr;
    }
    if (options.endpoint !== undefined) {
      body.endpoint = options.endpoint;
    }
    if (options.method !== undefined) {
      body.method = options.method;
    }
    if (options.description !== undefined) {
      body.description = options.description;
    }
    if (options.payload !== undefined) {
      body.payload = options.payload;
    }
    if (options.timezone !== undefined) {
      body.timezone = options.timezone;
    }
    if (options.timeoutSeconds !== undefined) {
      body.timeout_seconds = options.timeoutSeconds;
    }
    if (options.maxRetries !== undefined) {
      body.max_retries = options.maxRetries;
    }
    if (options.retryDelaySeconds !== undefined) {
      body.retry_delay_seconds = options.retryDelaySeconds;
    }

    return this.client.request<ScheduleResponse>(
      "PATCH",
      `/schedules/${encodeURIComponent(scheduleId)}`,
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Delete a schedule
   *
   * @param scheduleId - The unique identifier for the schedule
   *
   * @example
   * ```typescript
   * await client.schedules.delete('schedule-123');
   * ```
   */
  async delete(scheduleId: string): Promise<void> {
    await this.client.request<void>(
      "DELETE",
      `/schedules/${encodeURIComponent(scheduleId)}`,
    );
  }

  /**
   * Enable a schedule
   *
   * @param scheduleId - The unique identifier for the schedule
   * @returns Updated schedule state
   *
   * @example
   * ```typescript
   * const state = await client.schedules.enable('schedule-123');
   * console.log(state.enabled); // true
   * ```
   */
  async enable(scheduleId: string): Promise<ScheduleStateResponse> {
    return this.client.request<ScheduleStateResponse>(
      "POST",
      `/schedules/${encodeURIComponent(scheduleId)}/enable`,
    );
  }

  /**
   * Disable a schedule
   *
   * @param scheduleId - The unique identifier for the schedule
   * @returns Updated schedule state
   *
   * @example
   * ```typescript
   * const state = await client.schedules.disable('schedule-123');
   * console.log(state.enabled); // false
   * ```
   */
  async disable(scheduleId: string): Promise<ScheduleStateResponse> {
    return this.client.request<ScheduleStateResponse>(
      "POST",
      `/schedules/${encodeURIComponent(scheduleId)}/disable`,
    );
  }

  /**
   * List runs for a schedule
   *
   * @param scheduleId - The unique identifier for the schedule
   * @returns Paginated response with schedule runs
   *
   * @example
   * ```typescript
   * const runs = await client.schedules.listRuns('schedule-123');
   * console.log(runs.data);
   * ```
   */
  async listRuns(scheduleId: string): Promise<PaginatedScheduleRunResponse> {
    return this.client.request<PaginatedScheduleRunResponse>(
      "GET",
      `/schedules/${encodeURIComponent(scheduleId)}/runs`,
    );
  }

  /**
   * Get a specific run for a schedule
   *
   * @param scheduleId - The unique identifier for the schedule
   * @param runId - The unique identifier for the run
   * @returns Schedule run details
   *
   * @example
   * ```typescript
   * const run = await client.schedules.getRun('schedule-123', 'run-456');
   * console.log(run.status, run.started_at);
   * ```
   */
  async getRun(
    scheduleId: string,
    runId: string,
  ): Promise<ScheduleRunResponse> {
    return this.client.request<ScheduleRunResponse>(
      "GET",
      `/schedules/${encodeURIComponent(scheduleId)}/runs/${encodeURIComponent(runId)}`,
    );
  }

  /**
   * Manually trigger a schedule
   *
   * @param scheduleId - The unique identifier for the schedule
   * @returns The triggered run details
   *
   * @example
   * ```typescript
   * const run = await client.schedules.trigger('schedule-123');
   * console.log(run.status);
   * ```
   */
  async trigger(scheduleId: string): Promise<ScheduleRunResponse> {
    return this.client.request<ScheduleRunResponse>(
      "POST",
      `/schedules/${encodeURIComponent(scheduleId)}/trigger`,
    );
  }
}
