import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
export type LearningResponse = components["schemas"]["LearningResponse"];
export type LearningCreate = components["schemas"]["LearningCreate"];
export type LearningUpdate = components["schemas"]["LearningUpdate"];
export type LearningUserStats = components["schemas"]["LearningUserStats"];
type PaginatedLearningResponse =
  components["schemas"]["PaginatedResponse_LearningResponse_"];
type PaginatedLearningUserStats =
  components["schemas"]["PaginatedResponse_LearningUserStats_"];

/**
 * Options for listing learnings
 */
export interface ListLearningsOptions {
  /** Filter by learning type (e.g. `user_profile`, `learned_knowledge`) */
  learningType?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by agent ID */
  agentId?: string;
  /** Filter by team ID */
  teamId?: string;
  /** Filter by session ID */
  sessionId?: string;
  /** Filter by namespace */
  namespace?: string;
  /** Filter by entity ID */
  entityId?: string;
  /** Filter by entity type */
  entityType?: string;
  /** Number of learnings to return per page */
  limit?: number;
  /** Page number for pagination (1-indexed) */
  page?: number;
  /** Field to sort by, e.g. `created_at` or `updated_at` (the default) */
  sortBy?: string;
  /** Sort order (asc or desc) */
  sortOrder?: "asc" | "desc";
  /** Database ID to query learnings from */
  dbId?: string;
  /** Table to use for learning storage (requires dbId) */
  table?: string;
}

/**
 * Options for getting a learning by ID
 */
export interface GetLearningOptions {
  /** Database ID to query learning from */
  dbId?: string;
  /** Table to query learning from */
  table?: string;
}

/**
 * Options for creating a learning
 */
export interface CreateLearningOptions {
  /** Type of learning (e.g. `user_profile`, `entity_memory`, `learned_knowledge`) */
  learningType: string;
  /** The learning content payload */
  content: Record<string, unknown>;
  /** Namespace for scoping (`user`, `global`, or custom) */
  namespace?: string;
  /** Associated user ID */
  userId?: string;
  /** Associated agent ID */
  agentId?: string;
  /** Associated team ID */
  teamId?: string;
  /** Associated session ID */
  sessionId?: string;
  /** Associated entity ID */
  entityId?: string;
  /** Entity type (e.g. `person`, `company`) */
  entityType?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown> | null;
  /** Database ID to use for learning storage */
  dbId?: string;
  /** Table to use for learning storage (requires dbId) */
  table?: string;
}

/**
 * Options for updating a learning
 *
 * Only `content` and `metadata` may be modified; identity fields are
 * immutable. Provided fields fully replace the existing values.
 */
export interface UpdateLearningOptions {
  /** Replacement content payload */
  content?: Record<string, unknown>;
  /** Replacement metadata */
  metadata?: Record<string, unknown> | null;
  /** Database ID to use for update */
  dbId?: string;
  /** Table to use for update */
  table?: string;
}

/**
 * Options for deleting a learning
 */
export interface DeleteLearningOptions {
  /** Database ID to use for deletion */
  dbId?: string;
  /** Table to use for deletion */
  table?: string;
}

/**
 * Options for listing learning users
 */
export interface ListLearningUsersOptions {
  /** Restrict the grouping to a single learning type */
  learningType?: string;
  /** Restrict the result to a single user */
  userId?: string;
  /** Number of users to return per page */
  limit?: number;
  /** Page number for pagination (1-indexed) */
  page?: number;
  /** Field to sort by: `user_id` or `last_learning_updated_at` (the default) */
  sortBy?: string;
  /** Sort order (asc or desc) */
  sortOrder?: "asc" | "desc";
  /** Database ID to query */
  dbId?: string;
  /** Table to use (requires dbId) */
  table?: string;
}

/**
 * Options for deleting a user's learnings
 */
export interface DeleteLearningUserOptions {
  /** Restrict deletion to a single learning type; omit to delete all of the user's learnings */
  learningType?: string;
  /** Database ID to use for deletion */
  dbId?: string;
  /** Table to use for deletion */
  table?: string;
}

/**
 * Resource class for learning operations
 *
 * Provides methods to:
 * - List learnings with filtering and pagination
 * - Get learning details by ID
 * - Create new learnings
 * - Update existing learnings
 * - Delete learnings
 * - List the users that own learnings, and delete a user's learnings
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List learnings for an agent
 * const learnings = await client.learnings.list({ agentId: 'agent-123' });
 *
 * // Create a learned-knowledge record
 * const learning = await client.learnings.create({
 *   learningType: 'learned_knowledge',
 *   namespace: 'global',
 *   content: {
 *     title: 'Prefer QSYS2 services',
 *     learning: 'Use QSYS2.OBJECT_STATISTICS instead of DSPOBJD output files',
 *     context: 'IBM i object queries',
 *     tags: ['ibmi', 'sql'],
 *   },
 * });
 *
 * // Update a learning
 * await client.learnings.update(learning.learning_id, {
 *   content: { ...learning.content, tags: ['ibmi', 'sql', 'qsys2'] },
 * });
 * ```
 */
export class LearningsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List learnings with filtering and pagination
   *
   * @param options - Filtering and pagination options
   * @returns Paginated response with learnings and metadata
   *
   * @example
   * ```typescript
   * // List all learnings for a user
   * const response = await client.learnings.list({ userId: 'user-123' });
   *
   * // List a single learning type with pagination
   * const response = await client.learnings.list({
   *   learningType: 'learned_knowledge',
   *   page: 1,
   *   limit: 20,
   * });
   * ```
   */
  async list(
    options?: ListLearningsOptions,
  ): Promise<PaginatedLearningResponse> {
    const params = new URLSearchParams();

    if (options?.learningType) {
      params.append("learning_type", options.learningType);
    }
    if (options?.userId) {
      params.append("user_id", options.userId);
    }
    if (options?.agentId) {
      params.append("agent_id", options.agentId);
    }
    if (options?.teamId) {
      params.append("team_id", options.teamId);
    }
    if (options?.sessionId) {
      params.append("session_id", options.sessionId);
    }
    if (options?.namespace) {
      params.append("namespace", options.namespace);
    }
    if (options?.entityId) {
      params.append("entity_id", options.entityId);
    }
    if (options?.entityType) {
      params.append("entity_type", options.entityType);
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

    const queryString = params.toString();
    const path = queryString ? `/learnings?${queryString}` : "/learnings";

    return this.client.request<PaginatedLearningResponse>("GET", path);
  }

  /**
   * Get learning details by ID
   *
   * @param learningId - The unique identifier for the learning
   * @param options - Optional database routing parameters
   * @returns Learning details
   *
   * @example
   * ```typescript
   * const learning = await client.learnings.get('lrn-123');
   * console.log(learning.learning_type, learning.content);
   * ```
   */
  async get(
    learningId: string,
    options?: GetLearningOptions,
  ): Promise<LearningResponse> {
    const params = new URLSearchParams();

    if (options?.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options?.table) {
      params.append("table", options.table);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/learnings/${encodeURIComponent(learningId)}?${queryString}`
      : `/learnings/${encodeURIComponent(learningId)}`;

    return this.client.request<LearningResponse>("GET", path);
  }

  /**
   * Create a new learning
   *
   * For the identity-keyed learning types (`user_profile`, `user_memory`,
   * `session_context`, `entity_memory`) the record id is derived from the
   * identity fields, so provide them, and a duplicate create is rejected
   * with 409 (use {@link update} instead). Other types get a generated id.
   *
   * @param options - Learning creation options
   * @returns Created learning
   *
   * @example
   * ```typescript
   * const learning = await client.learnings.create({
   *   learningType: 'learned_knowledge',
   *   namespace: 'global',
   *   content: {
   *     title: 'Prefer QSYS2 services',
   *     learning: 'Use QSYS2.OBJECT_STATISTICS instead of DSPOBJD output files',
   *     context: 'IBM i object queries',
   *     tags: ['ibmi', 'sql'],
   *   },
   * });
   * ```
   */
  async create(options: CreateLearningOptions): Promise<LearningResponse> {
    const params = new URLSearchParams();

    if (options.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options.table) {
      params.append("table", options.table);
    }

    // Build JSON body
    const body: Record<string, unknown> = {
      learning_type: options.learningType,
      content: options.content,
    };

    if (options.namespace) {
      body.namespace = options.namespace;
    }
    if (options.userId) {
      body.user_id = options.userId;
    }
    if (options.agentId) {
      body.agent_id = options.agentId;
    }
    if (options.teamId) {
      body.team_id = options.teamId;
    }
    if (options.sessionId) {
      body.session_id = options.sessionId;
    }
    if (options.entityId) {
      body.entity_id = options.entityId;
    }
    if (options.entityType) {
      body.entity_type = options.entityType;
    }
    if (options.metadata !== undefined) {
      body.metadata = options.metadata;
    }

    const queryString = params.toString();
    const path = queryString ? `/learnings?${queryString}` : "/learnings";

    return this.client.request<LearningResponse>("POST", path, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Update an existing learning
   *
   * Only `content` and `metadata` may be modified; identity fields
   * (user_id, agent_id, team_id, ...) are immutable. Provided fields fully
   * replace the existing values.
   *
   * @param learningId - The unique identifier for the learning
   * @param options - Learning update options
   * @returns Updated learning
   *
   * @example
   * ```typescript
   * const learning = await client.learnings.update('lrn-123', {
   *   content: { title: 'Updated title', learning: 'Updated learning' },
   * });
   * ```
   */
  async update(
    learningId: string,
    options: UpdateLearningOptions,
  ): Promise<LearningResponse> {
    const params = new URLSearchParams();

    if (options.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options.table) {
      params.append("table", options.table);
    }

    // Build JSON body with only provided fields
    const body: Record<string, unknown> = {};

    if (options.content !== undefined) {
      body.content = options.content;
    }
    if (options.metadata !== undefined) {
      body.metadata = options.metadata;
    }

    const queryString = params.toString();
    const path = queryString
      ? `/learnings/${encodeURIComponent(learningId)}?${queryString}`
      : `/learnings/${encodeURIComponent(learningId)}`;

    return this.client.request<LearningResponse>("PATCH", path, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Delete a learning
   *
   * @param learningId - The unique identifier for the learning
   * @param options - Optional database routing parameters
   *
   * @example
   * ```typescript
   * await client.learnings.delete('lrn-123');
   * ```
   */
  async delete(
    learningId: string,
    options?: DeleteLearningOptions,
  ): Promise<void> {
    const params = new URLSearchParams();

    if (options?.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options?.table) {
      params.append("table", options.table);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/learnings/${encodeURIComponent(learningId)}?${queryString}`
      : `/learnings/${encodeURIComponent(learningId)}`;

    await this.client.request<void>("DELETE", path);
  }

  /**
   * List the users that own learning records
   *
   * Entry point for a per-user view: list users here, then drill into a
   * single user's learnings via `list({ userId })`. Records with no owner
   * are excluded.
   *
   * @param options - Filtering and pagination options
   * @returns Paginated response with user stats and metadata
   *
   * @example
   * ```typescript
   * const users = await client.learnings.listUsers({
   *   learningType: 'user_profile',
   *   limit: 20,
   * });
   * for (const user of users.data) {
   *   console.log(user.user_id, user.last_learning_updated_at);
   * }
   * ```
   */
  async listUsers(
    options?: ListLearningUsersOptions,
  ): Promise<PaginatedLearningUserStats> {
    const params = new URLSearchParams();

    if (options?.learningType) {
      params.append("learning_type", options.learningType);
    }
    if (options?.userId) {
      params.append("user_id", options.userId);
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

    const queryString = params.toString();
    const path = queryString
      ? `/learnings/users?${queryString}`
      : "/learnings/users";

    return this.client.request<PaginatedLearningUserStats>("GET", path);
  }

  /**
   * Delete the learning records owned by a user
   *
   * By default removes every learning type for the user; pass
   * `learningType` to restrict deletion to a single store. Resolves even if
   * the user had no matching records.
   *
   * @param userId - The user whose learnings should be deleted
   * @param options - Optional learning-type filter and database routing parameters
   *
   * @example
   * ```typescript
   * await client.learnings.deleteUser('user-123', {
   *   learningType: 'user_memory',
   * });
   * ```
   */
  async deleteUser(
    userId: string,
    options?: DeleteLearningUserOptions,
  ): Promise<void> {
    const params = new URLSearchParams();

    if (options?.learningType) {
      params.append("learning_type", options.learningType);
    }
    if (options?.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options?.table) {
      params.append("table", options.table);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/learnings/users/${encodeURIComponent(userId)}?${queryString}`
      : `/learnings/users/${encodeURIComponent(userId)}`;

    await this.client.request<void>("DELETE", path);
  }
}
