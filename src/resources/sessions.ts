import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type SessionSchema = components["schemas"]["SessionSchema"];
type PaginatedResponse = components["schemas"]["PaginatedResponse_SessionSchema_"];

/**
 * Options for listing sessions
 */
export interface ListSessionsOptions {
  /** Session type filter */
  type?: string;
  /** Component ID filter */
  componentId?: string;
  /** User ID filter */
  userId?: string;
  /** Session name filter */
  name?: string;
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort order */
  sortOrder?: "asc" | "desc";
}

/**
 * Options for creating a session
 */
export interface CreateSessionOptions {
  /** Session type (agent, team, or workflow) */
  type: string;
  /** Component ID to associate with session */
  componentId: string;
  /** Optional session name */
  name?: string;
  /** Optional user ID */
  userId?: string;
  /** Optional database ID */
  dbId?: string;
}

/**
 * Resource class for session operations
 *
 * Provides methods to:
 * - List sessions with filtering and pagination
 * - Get session details by ID
 * - Create new sessions
 * - Rename sessions
 * - Delete sessions
 * - Get runs for a session
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all sessions
 * const sessions = await client.sessions.list();
 *
 * // List with filtering
 * const agentSessions = await client.sessions.list({
 *   type: 'agent',
 *   componentId: 'agent-123',
 *   page: 1,
 *   limit: 20,
 * });
 *
 * // Get specific session
 * const session = await client.sessions.get('session-id');
 *
 * // Create session
 * const newSession = await client.sessions.create({
 *   type: 'agent',
 *   componentId: 'agent-123',
 *   name: 'My Session',
 * });
 * ```
 */
export class SessionsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List sessions with optional filtering and pagination
   *
   * @param options - Optional filters and pagination parameters
   * @returns Paginated response with sessions and metadata
   *
   * @example
   * ```typescript
   * const response = await client.sessions.list({
   *   type: 'agent',
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'created_at',
   *   sortOrder: 'desc',
   * });
   * console.log(response.data); // Array of sessions
   * console.log(response.meta); // Pagination info
   * ```
   */
  async list(options?: ListSessionsOptions): Promise<PaginatedResponse> {
    const params = new URLSearchParams();

    if (options?.type !== undefined) {
      params.append("type", options.type);
    }
    if (options?.componentId !== undefined) {
      params.append("component_id", options.componentId);
    }
    if (options?.userId !== undefined) {
      params.append("user_id", options.userId);
    }
    if (options?.name !== undefined) {
      params.append("name", options.name);
    }
    if (options?.page !== undefined) {
      params.append("page", String(options.page));
    }
    if (options?.limit !== undefined) {
      params.append("limit", String(options.limit));
    }
    if (options?.sortBy !== undefined) {
      params.append("sort_by", options.sortBy);
    }
    if (options?.sortOrder !== undefined) {
      params.append("sort_order", options.sortOrder);
    }

    const queryString = params.toString();
    const path = queryString ? `/sessions?${queryString}` : "/sessions";

    return this.client.request<PaginatedResponse>("GET", path);
  }

  /**
   * Get session details by ID
   *
   * @param sessionId - The unique identifier for the session
   * @param options - Optional database ID
   * @returns Session details
   *
   * @example
   * ```typescript
   * const session = await client.sessions.get('session-123');
   * console.log(session.session_name, session.created_at);
   * ```
   */
  async get(
    sessionId: string,
    options?: { dbId?: string },
  ): Promise<SessionSchema> {
    const params = new URLSearchParams();

    if (options?.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/sessions/${encodeURIComponent(sessionId)}?${queryString}`
      : `/sessions/${encodeURIComponent(sessionId)}`;

    return this.client.request<SessionSchema>("GET", path);
  }

  /**
   * Create a new session
   *
   * @param options - Session creation options
   * @returns Created session details
   *
   * @example
   * ```typescript
   * const session = await client.sessions.create({
   *   type: 'agent',
   *   componentId: 'agent-123',
   *   name: 'Customer Support Session',
   *   userId: 'user-456',
   * });
   * ```
   */
  async create(options: CreateSessionOptions): Promise<SessionSchema> {
    const formData = new FormData();
    formData.append("type", options.type);
    formData.append("component_id", options.componentId);

    if (options.name !== undefined) {
      formData.append("name", options.name);
    }
    if (options.userId !== undefined) {
      formData.append("user_id", options.userId);
    }
    if (options.dbId !== undefined) {
      formData.append("db_id", options.dbId);
    }

    return this.client.request<SessionSchema>("POST", "/sessions", {
      body: formData,
    });
  }

  /**
   * Rename a session
   *
   * @param sessionId - The unique identifier for the session
   * @param name - New name for the session
   *
   * @example
   * ```typescript
   * await client.sessions.rename('session-123', 'New Session Name');
   * ```
   */
  async rename(sessionId: string, name: string): Promise<void> {
    const formData = new FormData();
    formData.append("name", name);

    await this.client.request<void>(
      "POST",
      `/sessions/${encodeURIComponent(sessionId)}/rename`,
      { body: formData },
    );
  }

  /**
   * Delete a session
   *
   * @param sessionId - The unique identifier for the session
   * @param options - Optional database ID
   *
   * @example
   * ```typescript
   * await client.sessions.delete('session-123');
   * ```
   */
  async delete(sessionId: string, options?: { dbId?: string }): Promise<void> {
    const params = new URLSearchParams();

    if (options?.dbId !== undefined) {
      params.append("db_id", options.dbId);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/sessions/${encodeURIComponent(sessionId)}?${queryString}`
      : `/sessions/${encodeURIComponent(sessionId)}`;

    await this.client.request<void>("DELETE", path);
  }

  /**
   * Get runs for a session
   *
   * @param sessionId - The unique identifier for the session
   * @returns Array of runs for the session
   *
   * @example
   * ```typescript
   * const runs = await client.sessions.getRuns('session-123');
   * console.log(runs.length);
   * ```
   */
  async getRuns(sessionId: string): Promise<unknown[]> {
    return this.client.request<unknown[]>(
      "GET",
      `/sessions/${encodeURIComponent(sessionId)}/runs`,
    );
  }
}
