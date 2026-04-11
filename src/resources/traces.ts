import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type TraceDetail = components["schemas"]["TraceDetail"];
type PaginatedResponse_TraceSummary_ =
  components["schemas"]["PaginatedResponse_TraceSummary_"];

/**
 * Options for listing traces with filtering
 */
export interface ListTracesOptions {
  /** Filter by run ID */
  runId?: string;
  /** Filter by session ID */
  sessionId?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by agent ID */
  agentId?: string;
  /** Filter by status */
  status?: string;
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Database ID */
  dbId?: string;
}

/**
 * Options for getting trace statistics
 */
export interface GetTraceStatsOptions {
  /** User ID filter */
  userId?: string;
  /** Agent ID filter */
  agentId?: string;
  /** Team ID filter */
  teamId?: string;
  /** Workflow ID filter */
  workflowId?: string;
  /** Start time filter */
  startTime?: string;
  /** End time filter */
  endTime?: string;
  /** Page number */
  page?: number;
  /** Results per page */
  limit?: number;
  /** Database ID */
  dbId?: string;
}

/**
 * Options for searching traces
 */
export interface SearchTracesOptions {
  /** Filter expression */
  filter?: Record<string, unknown>;
  /** Group by field */
  groupBy?: string;
  /** Page number */
  page?: number;
  /** Results per page */
  limit?: number;
  /** Database ID */
  dbId?: string;
}

/**
 * Resource class for trace operations
 *
 * Provides read-only access to trace data for monitoring and debugging.
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all traces
 * const traces = await client.traces.list();
 *
 * // Filter traces by run ID
 * const runTraces = await client.traces.list({ runId: 'run-123' });
 *
 * // Get trace details
 * const trace = await client.traces.get('trace-id');
 * ```
 */
export class TracesResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List traces with optional filtering
   *
   * @param options - Filter and pagination options
   * @returns Paginated list of trace summaries
   *
   * @example
   * ```typescript
   * // Get all traces
   * const all = await client.traces.list();
   *
   * // Filter by agent and session
   * const filtered = await client.traces.list({
   *   agentId: 'agent-123',
   *   sessionId: 'session-456',
   *   page: 1,
   *   limit: 20,
   * });
   * ```
   */
  async list(
    options?: ListTracesOptions,
  ): Promise<PaginatedResponse_TraceSummary_> {
    const params = new URLSearchParams();

    if (options?.runId) {
      params.append("run_id", options.runId);
    }
    if (options?.sessionId) {
      params.append("session_id", options.sessionId);
    }
    if (options?.userId) {
      params.append("user_id", options.userId);
    }
    if (options?.agentId) {
      params.append("agent_id", options.agentId);
    }
    if (options?.status) {
      params.append("status", options.status);
    }
    if (options?.page !== undefined) {
      params.append("page", String(options.page));
    }
    if (options?.limit !== undefined) {
      params.append("limit", String(options.limit));
    }
    if (options?.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }

    const queryString = params.toString();
    const path = queryString ? `/traces?${queryString}` : "/traces";

    return this.client.request<PaginatedResponse_TraceSummary_>("GET", path);
  }

  /**
   * Get detailed trace information by ID
   *
   * @param traceId - The unique identifier for the trace
   * @returns Detailed trace with hierarchical span tree
   *
   * @example
   * ```typescript
   * const trace = await client.traces.get('trace-123');
   * console.log(trace.spans);
   * ```
   */
  async get(
    traceId: string,
    options?: { dbId?: string },
  ): Promise<TraceDetail> {
    const params = new URLSearchParams();
    if (options?.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }
    const queryString = params.toString();
    const path = queryString
      ? `/traces/${encodeURIComponent(traceId)}?${queryString}`
      : `/traces/${encodeURIComponent(traceId)}`;
    return this.client.request<TraceDetail>("GET", path);
  }

  /**
   * Get trace session statistics
   *
   * @param options - Optional filtering and pagination options
   * @returns Trace statistics
   *
   * @example
   * ```typescript
   * const stats = await client.traces.getStats({
   *   agentId: 'agent-123',
   *   startTime: '2025-01-01T00:00:00Z',
   * });
   * ```
   */
  async getStats(options?: GetTraceStatsOptions): Promise<unknown> {
    const params = new URLSearchParams();

    if (options?.userId) params.append("user_id", options.userId);
    if (options?.agentId) params.append("agent_id", options.agentId);
    if (options?.teamId) params.append("team_id", options.teamId);
    if (options?.workflowId) params.append("workflow_id", options.workflowId);
    if (options?.startTime) params.append("start_time", options.startTime);
    if (options?.endTime) params.append("end_time", options.endTime);
    if (options?.page !== undefined)
      params.append("page", String(options.page));
    if (options?.limit !== undefined)
      params.append("limit", String(options.limit));
    if (options?.dbId) params.append("db_id", options.dbId);

    const queryString = params.toString();
    const path = queryString
      ? `/trace_session_stats?${queryString}`
      : "/trace_session_stats";

    return this.client.request<unknown>("GET", path);
  }

  /**
   * Search traces with filters
   *
   * @param options - Search options with filter expression and pagination
   * @returns Search results
   *
   * @example
   * ```typescript
   * const results = await client.traces.search({
   *   filter: { status: 'error' },
   *   groupBy: 'agent_id',
   *   limit: 50,
   * });
   * ```
   */
  async search(options: SearchTracesOptions): Promise<unknown> {
    const params = new URLSearchParams();
    if (options.dbId) params.append("db_id", options.dbId);

    const body: Record<string, unknown> = {};
    if (options.filter) body.filter = options.filter;
    if (options.groupBy) body.group_by = options.groupBy;
    if (options.page !== undefined) body.page = options.page;
    if (options.limit !== undefined) body.limit = options.limit;

    const queryString = params.toString();
    const path = queryString
      ? `/traces/search?${queryString}`
      : "/traces/search";

    return this.client.request<unknown>("POST", path, { body });
  }

  /**
   * Get the filter schema for trace searches
   *
   * Returns the available filter fields and operators for use with search().
   *
   * @returns Filter schema definition
   *
   * @example
   * ```typescript
   * const schema = await client.traces.getFilterSchema();
   * ```
   */
  async getFilterSchema(): Promise<unknown> {
    return this.client.request<unknown>("GET", "/traces/filter-schema");
  }
}
