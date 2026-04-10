import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type ApprovalResponse = components["schemas"]["ApprovalResponse"];
type ApprovalCountResponse = components["schemas"]["ApprovalCountResponse"];
type ApprovalStatusResponse = components["schemas"]["ApprovalStatusResponse"];
type PaginatedApprovalResponse =
  components["schemas"]["PaginatedResponse_ApprovalResponse_"];

/**
 * Options for listing approvals
 */
export interface ListApprovalsOptions {
  /** Filter by approval status */
  status?: string;
  /** Filter by source type */
  sourceType?: string;
  /** Filter by approval type */
  approvalType?: string;
  /** Filter by pause type */
  pauseType?: string;
  /** Filter by agent ID */
  agentId?: string;
  /** Filter by team ID */
  teamId?: string;
  /** Filter by workflow ID */
  workflowId?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by schedule ID */
  scheduleId?: string;
  /** Filter by run ID */
  runId?: string;
  /** Number of items per page */
  limit?: number;
  /** Page number for pagination */
  page?: number;
}

/**
 * Options for counting approvals
 */
export interface CountApprovalsOptions {
  /** Filter count by user ID */
  userId?: string;
}

/**
 * Options for resolving an approval
 */
export interface ResolveApprovalOptions {
  /** Resolution status */
  status: string;
  /** Who resolved the approval */
  resolvedBy?: string;
  /** Additional resolution data */
  resolutionData?: Record<string, unknown>;
}

/**
 * Resource class for approval operations
 *
 * Provides methods to:
 * - List approvals with filtering and pagination
 * - Count pending approvals
 * - Get approval details by ID
 * - Delete approvals
 * - Resolve approvals
 * - Get approval status
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all approvals
 * const approvals = await client.approvals.list();
 *
 * // List pending approvals for an agent
 * const pending = await client.approvals.list({
 *   status: 'pending',
 *   agentId: 'agent-123',
 * });
 *
 * // Get approval count
 * const count = await client.approvals.count();
 *
 * // Resolve an approval
 * const resolved = await client.approvals.resolve('approval-id', {
 *   status: 'approved',
 *   resolvedBy: 'user-456',
 * });
 * ```
 */
export class ApprovalsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List approvals with optional filtering and pagination
   *
   * @param options - Optional filters and pagination parameters
   * @returns Paginated response with approvals and metadata
   *
   * @example
   * ```typescript
   * const response = await client.approvals.list({
   *   status: 'pending',
   *   agentId: 'agent-123',
   *   page: 1,
   *   limit: 20,
   * });
   * ```
   */
  async list(
    options?: ListApprovalsOptions,
  ): Promise<PaginatedApprovalResponse> {
    const params = new URLSearchParams();

    if (options?.status) {
      params.append("status", options.status);
    }
    if (options?.sourceType) {
      params.append("source_type", options.sourceType);
    }
    if (options?.approvalType) {
      params.append("approval_type", options.approvalType);
    }
    if (options?.pauseType) {
      params.append("pause_type", options.pauseType);
    }
    if (options?.agentId) {
      params.append("agent_id", options.agentId);
    }
    if (options?.teamId) {
      params.append("team_id", options.teamId);
    }
    if (options?.workflowId) {
      params.append("workflow_id", options.workflowId);
    }
    if (options?.userId) {
      params.append("user_id", options.userId);
    }
    if (options?.scheduleId) {
      params.append("schedule_id", options.scheduleId);
    }
    if (options?.runId) {
      params.append("run_id", options.runId);
    }
    if (options?.limit !== undefined) {
      params.append("limit", String(options.limit));
    }
    if (options?.page !== undefined) {
      params.append("page", String(options.page));
    }

    const queryString = params.toString();
    const path = queryString ? `/approvals?${queryString}` : "/approvals";

    return this.client.request<PaginatedApprovalResponse>("GET", path);
  }

  /**
   * Get count of approvals
   *
   * @param options - Optional user ID filter
   * @returns Approval count response
   *
   * @example
   * ```typescript
   * const count = await client.approvals.count();
   * console.log(count);
   *
   * // Count for specific user
   * const userCount = await client.approvals.count({ userId: 'user-123' });
   * ```
   */
  async count(options?: CountApprovalsOptions): Promise<ApprovalCountResponse> {
    const params = new URLSearchParams();

    if (options?.userId) {
      params.append("user_id", options.userId);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/approvals/count?${queryString}`
      : "/approvals/count";

    return this.client.request<ApprovalCountResponse>("GET", path);
  }

  /**
   * Get approval details by ID
   *
   * @param approvalId - The unique identifier for the approval
   * @returns Approval details
   *
   * @example
   * ```typescript
   * const approval = await client.approvals.get('approval-123');
   * console.log(approval.status);
   * ```
   */
  async get(approvalId: string): Promise<ApprovalResponse> {
    return this.client.request<ApprovalResponse>(
      "GET",
      `/approvals/${encodeURIComponent(approvalId)}`,
    );
  }

  /**
   * Delete an approval
   *
   * @param approvalId - The unique identifier for the approval
   *
   * @example
   * ```typescript
   * await client.approvals.delete('approval-123');
   * ```
   */
  async delete(approvalId: string): Promise<void> {
    await this.client.request<void>(
      "DELETE",
      `/approvals/${encodeURIComponent(approvalId)}`,
    );
  }

  /**
   * Resolve an approval
   *
   * @param approvalId - The unique identifier for the approval
   * @param options - Resolution options including status
   * @returns Resolved approval details
   *
   * @example
   * ```typescript
   * const resolved = await client.approvals.resolve('approval-123', {
   *   status: 'approved',
   *   resolvedBy: 'user-456',
   *   resolutionData: { reason: 'Looks good' },
   * });
   * ```
   */
  async resolve(
    approvalId: string,
    options: ResolveApprovalOptions,
  ): Promise<ApprovalResponse> {
    const body: Record<string, unknown> = {
      status: options.status,
    };

    if (options.resolvedBy) {
      body.resolved_by = options.resolvedBy;
    }
    if (options.resolutionData) {
      body.resolution_data = options.resolutionData;
    }

    return this.client.request<ApprovalResponse>(
      "POST",
      `/approvals/${encodeURIComponent(approvalId)}/resolve`,
      {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  /**
   * Get the status of an approval
   *
   * @param approvalId - The unique identifier for the approval
   * @returns Approval status response
   *
   * @example
   * ```typescript
   * const status = await client.approvals.getStatus('approval-123');
   * console.log(status);
   * ```
   */
  async getStatus(approvalId: string): Promise<ApprovalStatusResponse> {
    return this.client.request<ApprovalStatusResponse>(
      "GET",
      `/approvals/${encodeURIComponent(approvalId)}/status`,
    );
  }
}
