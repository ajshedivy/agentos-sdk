import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type TraceSummary = components["schemas"]["TraceSummary"];
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
  async get(traceId: string): Promise<TraceDetail> {
    return this.client.request<TraceDetail>(
      "GET",
      `/traces/${encodeURIComponent(traceId)}`,
    );
  }
}
