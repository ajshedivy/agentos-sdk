import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type UserMemorySchema = components["schemas"]["UserMemorySchema"];
type PaginatedResponse =
  components["schemas"]["PaginatedResponse_UserMemorySchema_"];

/**
 * Options for listing memories
 */
export interface ListMemoriesOptions {
  /** Filter memories by user ID */
  userId?: string;
  /** Filter memories by team ID */
  teamId?: string;
  /** Filter memories by agent ID */
  agentId?: string;
  /** Fuzzy search within memory content */
  searchContent?: string;
  /** Number of memories to return per page */
  limit?: number;
  /** Page number for pagination */
  page?: number;
  /** Field to sort memories by */
  sortBy?: string;
  /** Sort order (asc or desc) */
  sortOrder?: "asc" | "desc";
  /** Database ID to query memories from */
  dbId?: string;
  /** Table to use for memory storage */
  table?: string;
  /** Comma-separated list of topics to filter by */
  topics?: string[];
}

/**
 * Options for creating a memory
 */
export interface CreateMemoryOptions {
  /** Memory content text */
  memory: string;
  /** User ID who owns this memory */
  userId?: string;
  /** Optional topics for categorizing the memory */
  topics?: string[];
  /** Database ID to use for memory storage */
  dbId?: string;
  /** Table to use for memory storage */
  table?: string;
}

/**
 * Options for updating a memory
 */
export interface UpdateMemoryOptions {
  /** Memory content text */
  memory?: string;
  /** Optional topics for categorizing the memory */
  topics?: string[];
  /** Database ID to use for update */
  dbId?: string;
  /** Table to use for update */
  table?: string;
}

/**
 * Options for getting a memory by ID
 */
export interface GetMemoryOptions {
  /** Database ID to query memory from */
  dbId?: string;
  /** Table to query memory from */
  table?: string;
}

/**
 * Options for deleting a memory
 */
export interface DeleteMemoryOptions {
  /** Database ID to use for deletion */
  dbId?: string;
  /** Table to use for deletion */
  table?: string;
}

/**
 * Options for deleting all memories
 */
export interface DeleteAllMemoriesOptions {
  /** Memory IDs to delete */
  memoryIds: string[];
  /** User ID filter */
  userId?: string;
  /** Database ID */
  dbId?: string;
  /** Table name */
  table?: string;
}

/**
 * Options for getting memory topics
 */
export interface GetTopicsOptions {
  /** User ID filter */
  userId?: string;
  /** Database ID */
  dbId?: string;
  /** Table name */
  table?: string;
}

/**
 * Options for getting memory stats
 */
export interface GetMemoryStatsOptions {
  /** User ID filter */
  userId?: string;
  /** Results per page */
  limit?: number;
  /** Page number */
  page?: number;
  /** Database ID */
  dbId?: string;
  /** Table name */
  table?: string;
}

/**
 * Options for optimizing memories
 */
export interface OptimizeMemoriesOptions {
  /** User ID (required) */
  userId: string;
  /** Model to use for optimization */
  model?: string;
  /** Apply the optimization (vs dry run) */
  apply?: boolean;
  /** Database ID */
  dbId?: string;
  /** Table name */
  table?: string;
}

/**
 * Resource class for memory operations
 *
 * Provides methods to:
 * - List memories with filtering and pagination
 * - Get memory details by ID
 * - Create new memories
 * - Update existing memories
 * - Delete memories
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List memories for a user
 * const memories = await client.memories.list({ userId: 'user-123' });
 *
 * // Create a new memory
 * const memory = await client.memories.create({
 *   memory: 'User prefers technical explanations',
 *   userId: 'user-123',
 *   topics: ['preferences'],
 * });
 *
 * // Update a memory
 * await client.memories.update('mem-456', {
 *   memory: 'Updated content',
 *   topics: ['updated'],
 * });
 * ```
 */
export class MemoriesResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List memories with filtering and pagination
   *
   * @param options - Filtering and pagination options
   * @returns Paginated response with memories and metadata
   *
   * @example
   * ```typescript
   * // List all memories for a user
   * const response = await client.memories.list({ userId: 'user-123' });
   *
   * // Search memories with pagination
   * const response = await client.memories.list({
   *   searchContent: 'preferences',
   *   page: 1,
   *   limit: 20,
   * });
   * ```
   */
  async list(options?: ListMemoriesOptions): Promise<PaginatedResponse> {
    const params = new URLSearchParams();

    if (options?.userId) {
      params.append("user_id", options.userId);
    }
    if (options?.teamId) {
      params.append("team_id", options.teamId);
    }
    if (options?.agentId) {
      params.append("agent_id", options.agentId);
    }
    if (options?.searchContent) {
      params.append("search_content", options.searchContent);
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
    if (options?.topics && options.topics.length > 0) {
      // Topics is an array, append each one
      for (const topic of options.topics) {
        params.append("topics", topic);
      }
    }

    const queryString = params.toString();
    const path = queryString ? `/memories?${queryString}` : "/memories";

    return this.client.request<PaginatedResponse>("GET", path);
  }

  /**
   * Get memory details by ID
   *
   * @param memoryId - The unique identifier for the memory
   * @param options - Optional database routing parameters
   * @returns Memory details
   *
   * @example
   * ```typescript
   * const memory = await client.memories.get('mem-123');
   * console.log(memory.memory, memory.topics);
   * ```
   */
  async get(
    memoryId: string,
    options?: GetMemoryOptions,
  ): Promise<UserMemorySchema> {
    const params = new URLSearchParams();

    if (options?.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options?.table) {
      params.append("table", options.table);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/memories/${encodeURIComponent(memoryId)}?${queryString}`
      : `/memories/${encodeURIComponent(memoryId)}`;

    return this.client.request<UserMemorySchema>("GET", path);
  }

  /**
   * Create a new memory
   *
   * @param options - Memory creation options
   * @returns Created memory
   *
   * @example
   * ```typescript
   * const memory = await client.memories.create({
   *   memory: 'User prefers technical explanations',
   *   userId: 'user-123',
   *   topics: ['preferences', 'technical'],
   * });
   * ```
   */
  async create(options: CreateMemoryOptions): Promise<UserMemorySchema> {
    const params = new URLSearchParams();

    if (options.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options.table) {
      params.append("table", options.table);
    }

    // Build JSON body
    const body: Record<string, unknown> = {
      memory: options.memory,
    };

    if (options.userId) {
      body.user_id = options.userId;
    }
    if (options.topics && options.topics.length > 0) {
      body.topics = options.topics;
    }

    const queryString = params.toString();
    const path = queryString ? `/memories?${queryString}` : "/memories";

    return this.client.request<UserMemorySchema>("POST", path, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Update an existing memory
   *
   * @param memoryId - The unique identifier for the memory
   * @param options - Memory update options
   * @returns Updated memory
   *
   * @example
   * ```typescript
   * const memory = await client.memories.update('mem-123', {
   *   memory: 'Updated preference information',
   *   topics: ['preferences', 'updated'],
   * });
   * ```
   */
  async update(
    memoryId: string,
    options: UpdateMemoryOptions,
  ): Promise<UserMemorySchema> {
    const params = new URLSearchParams();

    if (options.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options.table) {
      params.append("table", options.table);
    }

    // Build JSON body with only provided fields
    const body: Record<string, unknown> = {};

    if (options.memory !== undefined) {
      body.memory = options.memory;
    }
    if (options.topics !== undefined) {
      body.topics = options.topics;
    }

    const queryString = params.toString();
    const path = queryString
      ? `/memories/${encodeURIComponent(memoryId)}?${queryString}`
      : `/memories/${encodeURIComponent(memoryId)}`;

    return this.client.request<UserMemorySchema>("PATCH", path, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Delete a memory
   *
   * @param memoryId - The unique identifier for the memory
   * @param options - Optional database routing parameters
   *
   * @example
   * ```typescript
   * await client.memories.delete('mem-123');
   * ```
   */
  async delete(memoryId: string, options?: DeleteMemoryOptions): Promise<void> {
    const params = new URLSearchParams();

    if (options?.dbId) {
      params.append("db_id", options.dbId);
    }
    if (options?.table) {
      params.append("table", options.table);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/memories/${encodeURIComponent(memoryId)}?${queryString}`
      : `/memories/${encodeURIComponent(memoryId)}`;

    await this.client.request<void>("DELETE", path);
  }

  /**
   * Delete all memories matching the given IDs
   *
   * @param options - Memory IDs to delete and optional query params
   * @returns void
   *
   * @example
   * ```typescript
   * await client.memories.deleteAll({
   *   memoryIds: ['mem-1', 'mem-2'],
   *   userId: 'user-123',
   * });
   * ```
   */
  async deleteAll(options: DeleteAllMemoriesOptions): Promise<void> {
    const params = new URLSearchParams();

    if (options.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }
    if (options.table !== undefined) {
      params.append("table", options.table);
    }

    const body: Record<string, unknown> = {
      memory_ids: options.memoryIds,
    };

    if (options.userId !== undefined) {
      body.user_id = options.userId;
    }

    const queryString = params.toString();
    const path = queryString ? `/memories?${queryString}` : "/memories";

    await this.client.request<void>("DELETE", path, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get memory topics
   *
   * @param options - Optional filtering parameters
   * @returns Topics response
   *
   * @example
   * ```typescript
   * const topics = await client.memories.getTopics({ userId: 'user-123' });
   * console.log(topics);
   * ```
   */
  async getTopics(options?: GetTopicsOptions): Promise<unknown> {
    const params = new URLSearchParams();

    if (options?.userId !== undefined) {
      params.append("user_id", options.userId);
    }
    if (options?.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }
    if (options?.table !== undefined) {
      params.append("table", options.table);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/memory_topics?${queryString}`
      : "/memory_topics";

    return this.client.request<unknown>("GET", path);
  }

  /**
   * Get user memory stats
   *
   * @param options - Optional filtering and pagination parameters
   * @returns Memory stats response
   *
   * @example
   * ```typescript
   * const stats = await client.memories.getStats({
   *   userId: 'user-123',
   *   limit: 10,
   *   page: 1,
   * });
   * console.log(stats);
   * ```
   */
  async getStats(options?: GetMemoryStatsOptions): Promise<unknown> {
    const params = new URLSearchParams();

    if (options?.userId !== undefined) {
      params.append("user_id", options.userId);
    }
    if (options?.limit !== undefined) {
      params.append("limit", String(options.limit));
    }
    if (options?.page !== undefined) {
      params.append("page", String(options.page));
    }
    if (options?.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }
    if (options?.table !== undefined) {
      params.append("table", options.table);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/user_memory_stats?${queryString}`
      : "/user_memory_stats";

    return this.client.request<unknown>("GET", path);
  }

  /**
   * Optimize memories for a user
   *
   * @param options - Optimization options including required userId
   * @returns Optimization response
   *
   * @example
   * ```typescript
   * const result = await client.memories.optimize({
   *   userId: 'user-123',
   *   model: 'gpt-4',
   *   apply: true,
   * });
   * console.log(result);
   * ```
   */
  async optimize(options: OptimizeMemoriesOptions): Promise<unknown> {
    const params = new URLSearchParams();

    if (options.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }
    if (options.table !== undefined) {
      params.append("table", options.table);
    }

    const body: Record<string, unknown> = {
      user_id: options.userId,
    };

    if (options.model !== undefined) {
      body.model = options.model;
    }
    if (options.apply !== undefined) {
      body.apply = options.apply;
    }

    const queryString = params.toString();
    const path = queryString
      ? `/optimize-memories?${queryString}`
      : "/optimize-memories";

    return this.client.request<unknown>("POST", path, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
