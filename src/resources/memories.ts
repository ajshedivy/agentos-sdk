import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type UserMemorySchema = components["schemas"]["UserMemorySchema"];
type PaginatedResponse = components["schemas"]["PaginatedResponse_UserMemorySchema_"];

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
}
