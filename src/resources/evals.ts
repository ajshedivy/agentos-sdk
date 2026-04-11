import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type EvalSchema = components["schemas"]["EvalSchema"];
type PaginatedEvalResponse =
  components["schemas"]["PaginatedResponse_EvalSchema_"];

/**
 * Options for listing eval runs
 */
export interface ListEvalsOptions {
  /** Filter by agent ID */
  agentId?: string;
  /** Filter by team ID */
  teamId?: string;
  /** Filter by workflow ID */
  workflowId?: string;
  /** Filter by model ID */
  modelId?: string;
  /** Eval filter type */
  type?: string;
  /** Number of items per page */
  limit?: number;
  /** Page number for pagination */
  page?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort order */
  sortOrder?: "asc" | "desc";
  /** Database ID to query from */
  dbId?: string;
  /** Table to query from */
  table?: string;
  /** Comma-separated list of eval types to filter by */
  evalTypes?: string;
}

/**
 * Options for creating an eval run
 */
export interface CreateEvalOptions {
  /** Agent ID to evaluate */
  agentId?: string;
  /** Team ID to evaluate */
  teamId?: string;
  /** Model ID to use */
  modelId?: string;
  /** Model provider */
  modelProvider?: string;
  /** Type of evaluation */
  evalType?: string;
  /** Input for the eval run */
  input?: string;
  /** Expected output for comparison */
  expectedOutput?: string;
  /** Evaluation criteria */
  criteria?: string;
  /** Scoring strategy */
  scoringStrategy?: string;
  /** Score threshold */
  threshold?: number;
  /** Number of warmup runs */
  warmupRuns?: number;
  /** Expected tool calls */
  expectedToolCalls?: string[];
  /** Database ID */
  dbId?: string;
  /** Table to use */
  table?: string;
}

/**
 * Options for updating an eval run
 */
export interface UpdateEvalOptions {
  /** New name for the eval run */
  name: string;
}

/**
 * Options for deleting eval runs
 */
export interface DeleteEvalsOptions {
  /** Array of eval run IDs to delete */
  ids: string[];
  /** Database ID */
  dbId?: string;
  /** Table to use */
  table?: string;
}

/**
 * Resource class for eval operations
 *
 * Provides methods to:
 * - List eval runs with filtering and pagination
 * - Get eval run details by ID
 * - Create new eval runs
 * - Update eval run metadata
 * - Delete eval runs
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all eval runs
 * const evals = await client.evals.list();
 *
 * // List with filtering
 * const agentEvals = await client.evals.list({
 *   agentId: 'agent-123',
 *   page: 1,
 *   limit: 20,
 * });
 *
 * // Get specific eval run
 * const evalRun = await client.evals.get('eval-run-id');
 *
 * // Create eval run
 * const newEval = await client.evals.create({
 *   agentId: 'agent-123',
 *   evalType: 'accuracy',
 *   input: 'What is 2+2?',
 *   expectedOutput: '4',
 * });
 * ```
 */
export class EvalsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List eval runs with optional filtering and pagination
   *
   * @param options - Optional filters and pagination parameters
   * @returns Paginated response with eval runs and metadata
   *
   * @example
   * ```typescript
   * const response = await client.evals.list({
   *   agentId: 'agent-123',
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'created_at',
   *   sortOrder: 'desc',
   * });
   * ```
   */
  async list(options?: ListEvalsOptions): Promise<PaginatedEvalResponse> {
    const params = new URLSearchParams();

    if (options?.agentId) {
      params.append("agent_id", options.agentId);
    }
    if (options?.teamId) {
      params.append("team_id", options.teamId);
    }
    if (options?.workflowId) {
      params.append("workflow_id", options.workflowId);
    }
    if (options?.modelId) {
      params.append("model_id", options.modelId);
    }
    if (options?.type) {
      params.append("type", options.type);
    }
    if (options?.limit !== undefined) {
      params.append("limit", String(options.limit));
    }
    if (options?.page !== undefined) {
      params.append("page", String(options.page));
    }
    if (options?.sortBy) {
      params.append("sort_by", options.sortBy);
    }
    if (options?.sortOrder) {
      params.append("sort_order", options.sortOrder);
    }
    if (options?.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options?.table) {
      params.append("table", options.table);
    }
    if (options?.evalTypes) {
      params.append("eval_types", options.evalTypes);
    }

    const queryString = params.toString();
    const path = queryString ? `/eval-runs?${queryString}` : "/eval-runs";

    return this.client.request<PaginatedEvalResponse>("GET", path);
  }

  /**
   * Create a new eval run
   *
   * @param options - Eval run creation options
   * @returns Created eval run
   *
   * @example
   * ```typescript
   * const evalRun = await client.evals.create({
   *   agentId: 'agent-123',
   *   evalType: 'accuracy',
   *   input: 'What is 2+2?',
   *   expectedOutput: '4',
   *   scoringStrategy: 'exact_match',
   *   threshold: 0.9,
   * });
   * ```
   */
  async create(options: CreateEvalOptions): Promise<EvalSchema> {
    const params = new URLSearchParams();

    if (options.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options.table) {
      params.append("table", options.table);
    }

    // Build JSON body matching EvalRunInput schema
    const body: Record<string, unknown> = {};

    if (options.agentId) {
      body.agent_id = options.agentId;
    }
    if (options.teamId) {
      body.team_id = options.teamId;
    }
    if (options.modelId) {
      body.model_id = options.modelId;
    }
    if (options.modelProvider) {
      body.model_provider = options.modelProvider;
    }
    if (options.evalType) {
      body.eval_type = options.evalType;
    }
    if (options.input) {
      body.input = options.input;
    }
    if (options.expectedOutput) {
      body.expected_output = options.expectedOutput;
    }
    if (options.criteria) {
      body.criteria = options.criteria;
    }
    if (options.scoringStrategy) {
      body.scoring_strategy = options.scoringStrategy;
    }
    if (options.threshold !== undefined) {
      body.threshold = options.threshold;
    }
    if (options.warmupRuns !== undefined) {
      body.warmup_runs = options.warmupRuns;
    }
    if (options.expectedToolCalls) {
      body.expected_tool_calls = options.expectedToolCalls;
    }

    const queryString = params.toString();
    const path = queryString ? `/eval-runs?${queryString}` : "/eval-runs";

    return this.client.request<EvalSchema>("POST", path, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get eval run details by ID
   *
   * @param evalRunId - The unique identifier for the eval run
   * @returns Eval run details
   *
   * @example
   * ```typescript
   * const evalRun = await client.evals.get('eval-run-123');
   * console.log(evalRun.eval_type, evalRun.input);
   * ```
   */
  async get(
    evalRunId: string,
    options?: { dbId?: string },
  ): Promise<EvalSchema> {
    const params = new URLSearchParams();
    if (options?.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }
    const queryString = params.toString();
    const path = queryString
      ? `/eval-runs/${encodeURIComponent(evalRunId)}?${queryString}`
      : `/eval-runs/${encodeURIComponent(evalRunId)}`;
    return this.client.request<EvalSchema>("GET", path);
  }

  /**
   * Update an eval run
   *
   * @param evalRunId - The unique identifier for the eval run
   * @param options - Update options
   * @returns Updated eval run
   *
   * @example
   * ```typescript
   * const updated = await client.evals.update('eval-run-123', {
   *   name: 'Accuracy Eval v2',
   * });
   * ```
   */
  async update(
    evalRunId: string,
    options: UpdateEvalOptions,
  ): Promise<EvalSchema> {
    const body: Record<string, unknown> = {
      name: options.name,
    };

    return this.client.request<EvalSchema>(
      "PATCH",
      `/eval-runs/${encodeURIComponent(evalRunId)}`,
      {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  /**
   * Delete eval runs
   *
   * @param options - Delete options including IDs and optional database routing
   *
   * @example
   * ```typescript
   * await client.evals.delete({
   *   ids: ['eval-run-123', 'eval-run-456'],
   * });
   * ```
   */
  async delete(options: DeleteEvalsOptions): Promise<void> {
    const params = new URLSearchParams();

    if (options.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options.table) {
      params.append("table", options.table);
    }

    const body: Record<string, unknown> = {
      ids: options.ids,
    };

    const queryString = params.toString();
    const path = queryString ? `/eval-runs?${queryString}` : "/eval-runs";

    await this.client.request<void>("DELETE", path, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
