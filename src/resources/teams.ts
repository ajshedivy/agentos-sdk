import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";
import { AgentStream } from "../streaming";

// Extract types from generated schemas
type TeamResponse = components["schemas"]["TeamResponse"];

/**
 * Options for running a team
 */
export interface TeamRunOptions {
  /** The message to send to the team */
  message: string;
  /** Optional session ID for conversation continuity */
  sessionId?: string;
  /** Optional user ID for user context */
  userId?: string;
  /** Streaming mode (only non-streaming supported in Phase 3) */
  stream?: false;
}

/**
 * Options for streaming team run
 */
export interface TeamStreamRunOptions {
  /** The message to send to the team */
  message: string;
  /** Optional session ID for conversation continuity */
  sessionId?: string;
  /** Optional user ID for user context */
  userId?: string;
}

/**
 * Options for continuing a paused team run
 */
export interface TeamContinueOptions {
  /** JSON string containing array of tool execution results */
  tools: string;
  /** Optional session ID */
  sessionId?: string;
  /** Optional user ID */
  userId?: string;
  /** Whether to stream the response (default: true) */
  stream?: boolean;
}

/**
 * Resource class for team operations
 *
 * Provides methods to:
 * - List all teams
 * - Get team details by ID
 * - Run a team with a message
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all teams
 * const teams = await client.teams.list();
 *
 * // Get specific team
 * const team = await client.teams.get('team-id');
 *
 * // Run team
 * const result = await client.teams.run('team-id', {
 *   message: 'Hello!',
 *   sessionId: 'session-123',
 * });
 * ```
 */
export class TeamsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List all teams
   *
   * @returns Array of team configurations
   *
   * @example
   * ```typescript
   * const teams = await client.teams.list();
   * console.log(teams.map(t => t.name));
   * ```
   */
  async list(): Promise<TeamResponse[]> {
    return this.client.request<TeamResponse[]>("GET", "/teams");
  }

  /**
   * Get team details by ID
   *
   * @param teamId - The unique identifier for the team
   * @returns Team configuration
   *
   * @example
   * ```typescript
   * const team = await client.teams.get('my-team-id');
   * console.log(team.name, team.model);
   * ```
   */
  async get(teamId: string): Promise<TeamResponse> {
    return this.client.request<TeamResponse>(
      "GET",
      `/teams/${encodeURIComponent(teamId)}`,
    );
  }

  /**
   * Run a team (non-streaming)
   *
   * Executes a team with a message and optional context.
   * Returns the team's response as a Promise.
   *
   * @param teamId - The unique identifier for the team
   * @param options - Run configuration including message and optional session/user context
   * @returns Team run result
   *
   * @example
   * ```typescript
   * const result = await client.teams.run('team-id', {
   *   message: 'What is the weather today?',
   *   sessionId: 'session-456',
   *   userId: 'user-789',
   * });
   * ```
   */
  async run(teamId: string, options: TeamRunOptions): Promise<unknown> {
    // Build FormData for multipart request
    const formData = new FormData();
    formData.append("message", options.message);
    formData.append("stream", "false"); // Force non-streaming

    if (options.sessionId) {
      formData.append("session_id", options.sessionId);
    }
    if (options.userId) {
      formData.append("user_id", options.userId);
    }

    // Pass FormData as body, client.request handles Content-Type removal for FormData
    return this.client.request<unknown>(
      "POST",
      `/teams/${encodeURIComponent(teamId)}/runs`,
      { body: formData },
    );
  }

  /**
   * Run a team with streaming response.
   *
   * Returns an AgentStream that can be consumed via:
   * - Async iteration: `for await (const event of stream) { ... }`
   * - Event handlers: `stream.on('RunContent', handler).start()`
   *
   * @param teamId - The unique identifier for the team
   * @param options - Run configuration including message and optional context
   * @returns AgentStream for consuming events
   *
   * @example Async iteration
   * ```typescript
   * const stream = await client.teams.runStream('team-id', {
   *   message: 'Hello!',
   * });
   * for await (const event of stream) {
   *   if (event.event === 'RunContent') {
   *     process.stdout.write(event.content);
   *   }
   * }
   * ```
   */
  async runStream(
    teamId: string,
    options: TeamStreamRunOptions,
  ): Promise<AgentStream> {
    const formData = new FormData();
    formData.append("message", options.message);
    formData.append("stream", "true");

    if (options.sessionId) {
      formData.append("session_id", options.sessionId);
    }
    if (options.userId) {
      formData.append("user_id", options.userId);
    }

    const controller = new AbortController();
    const response = await this.client.requestStream(
      "POST",
      `/teams/${encodeURIComponent(teamId)}/runs`,
      { body: formData, signal: controller.signal },
    );

    return AgentStream.fromSSEResponse(response, controller);
  }

  /**
   * Continue a paused team run with tool results.
   *
   * @param teamId - The team identifier
   * @param runId - The run identifier to continue
   * @param options - Continue options including tool results
   * @returns AgentStream if streaming, otherwise the run result
   */
  async continue(
    teamId: string,
    runId: string,
    options: TeamContinueOptions,
  ): Promise<AgentStream | unknown> {
    const formData = new FormData();
    formData.append("tools", options.tools);
    formData.append("stream", String(options.stream ?? true));

    if (options.sessionId) {
      formData.append("session_id", options.sessionId);
    }
    if (options.userId) {
      formData.append("user_id", options.userId);
    }

    const path = `/teams/${encodeURIComponent(teamId)}/runs/${encodeURIComponent(runId)}/continue`;

    if (options.stream !== false) {
      const controller = new AbortController();
      const response = await this.client.requestStream("POST", path, {
        body: formData,
        signal: controller.signal,
      });
      return AgentStream.fromSSEResponse(response, controller);
    }
    return this.client.request<unknown>("POST", path, { body: formData });
  }

  /**
   * Cancel a running team.
   *
   * @param teamId - The team identifier
   * @param runId - The run identifier to cancel
   */
  async cancel(teamId: string, runId: string): Promise<void> {
    await this.client.request<void>(
      "POST",
      `/teams/${encodeURIComponent(teamId)}/runs/${encodeURIComponent(runId)}/cancel`,
    );
  }
}
