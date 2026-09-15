import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";
import { AgentStream } from "../streaming";
import type { Audio, FileType, Image, Video } from "../types/files";
import { normalizeFileInput } from "../utils/files";

// Extract types from generated schemas
type TeamResponse = components["schemas"]["TeamResponse"];

/**
 * Result of a non-streaming team run
 */
export type TeamRunResult = components["schemas"]["TeamRunSchema"];

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
  /** Image files to include with the request */
  images?: Image[];
  /** Audio files to include with the request */
  audio?: Audio[];
  /** Video files to include with the request */
  videos?: Video[];
  /** Generic files to include with the request */
  files?: FileType[];
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
  /** Image files to include with the request */
  images?: Image[];
  /** Audio files to include with the request */
  audio?: Audio[];
  /** Video files to include with the request */
  videos?: Video[];
  /** Generic files to include with the request */
  files?: FileType[];
}

/**
 * Options for continuing a paused team run
 *
 * The team continue route resolves human-in-the-loop pauses from the
 * `requirements` form field (the agent route's `tools` field is ignored
 * here). Send the `requirements[]` entries from the RunPaused event back
 * with the decision stamped: `tool_execution.confirmed: true | false`
 * (optionally `tool_execution.confirmation_note`), or the requirement-level
 * `confirmation`. Keep each entry's `id` and `tool_execution.tool_call_id`
 * so the server can bind it to the stored requirement.
 */
export interface TeamContinueOptions {
  /**
   * JSON string containing an array of RunRequirement entries with their
   * resolution (see interface doc). May be empty when an admin-required
   * approval has already been resolved server-side.
   */
  requirements?: string;
  /** Optional follow-up user message appended to the run before resuming */
  input?: string;
  /**
   * @deprecated Use `requirements`. JSON string containing an array of tool
   * executions; each entry is wrapped as `{ tool_execution: entry }` and sent
   * as `requirements`. Ignored when `requirements` is provided.
   */
  tools?: string;
  /** Optional session ID */
  sessionId?: string;
  /** Optional user ID */
  userId?: string;
  /** Whether to stream the response (default: true) */
  stream?: boolean;
}

/**
 * Wrap a legacy `tools` payload (array of tool executions) into the
 * `requirements` shape the team route reads: `[{ tool_execution: entry }]`.
 * The server binds each entry to the stored requirement by `tool_call_id`.
 */
function wrapToolsAsRequirements(tools: string): string {
  const entries: unknown = JSON.parse(tools);
  if (!Array.isArray(entries)) {
    throw new TypeError(
      "TeamContinueOptions.tools must be a JSON array of tool executions",
    );
  }
  return JSON.stringify(
    entries.map((tool_execution: unknown) => ({ tool_execution })),
  );
}

/**
 * Options for listing team runs
 */
export interface ListTeamRunsOptions {
  /** Filter by run status */
  status?: string;
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
  async run(teamId: string, options: TeamRunOptions): Promise<TeamRunResult> {
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

    // Append media files
    if (options.images) {
      for (const image of options.images) {
        formData.append("images", normalizeFileInput(image));
      }
    }
    if (options.audio) {
      for (const audio of options.audio) {
        formData.append("audio", normalizeFileInput(audio));
      }
    }
    if (options.videos) {
      for (const video of options.videos) {
        formData.append("videos", normalizeFileInput(video));
      }
    }
    if (options.files) {
      for (const file of options.files) {
        formData.append("files", normalizeFileInput(file));
      }
    }

    // Pass FormData as body, client.request handles Content-Type removal for FormData
    return this.client.request<TeamRunResult>(
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

    // Append media files
    if (options.images) {
      for (const image of options.images) {
        formData.append("images", normalizeFileInput(image));
      }
    }
    if (options.audio) {
      for (const audio of options.audio) {
        formData.append("audio", normalizeFileInput(audio));
      }
    }
    if (options.videos) {
      for (const video of options.videos) {
        formData.append("videos", normalizeFileInput(video));
      }
    }
    if (options.files) {
      for (const file of options.files) {
        formData.append("files", normalizeFileInput(file));
      }
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
   * Continue a paused team run with resolved requirements.
   *
   * @param teamId - The team identifier
   * @param runId - The run identifier to continue
   * @param options - Continue options including the resolved requirements
   * @returns AgentStream if streaming, otherwise the run result
   *
   * @example
   * ```typescript
   * // `paused` is the RunPaused event; approve every requirement
   * const requirements = JSON.stringify(
   *   paused.requirements.map((r) => ({
   *     ...r,
   *     tool_execution: { ...r.tool_execution, confirmed: true },
   *   })),
   * );
   * const stream = await client.teams.continue('team-id', paused.run_id, {
   *   requirements,
   *   sessionId: paused.session_id,
   * });
   * ```
   */
  async continue(
    teamId: string,
    runId: string,
    options: TeamContinueOptions,
  ): Promise<AgentStream | unknown> {
    const formData = new FormData();
    const requirements =
      options.requirements ??
      (options.tools !== undefined
        ? wrapToolsAsRequirements(options.tools)
        : undefined);
    if (requirements !== undefined) {
      formData.append("requirements", requirements);
    }
    if (options.input !== undefined) {
      formData.append("input", options.input);
    }
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

  /**
   * List runs for a team within a session
   *
   * @param teamId - The unique identifier for the team
   * @param sessionId - The session ID to filter runs by
   * @param options - Optional filters for the run list
   * @returns Array of run results
   *
   * @example
   * ```typescript
   * const runs = await client.teams.listRuns('team-id', 'session-123');
   * console.log(runs.length);
   * ```
   */
  async listRuns(
    teamId: string,
    sessionId: string,
    options?: ListTeamRunsOptions,
  ): Promise<unknown[]> {
    const params = new URLSearchParams();
    params.append("session_id", sessionId);
    if (options?.status) {
      params.append("status", options.status);
    }
    return this.client.request<unknown[]>(
      "GET",
      `/teams/${encodeURIComponent(teamId)}/runs?${params.toString()}`,
    );
  }

  /**
   * Get a specific run for a team
   *
   * @param teamId - The unique identifier for the team
   * @param runId - The unique identifier for the run
   * @param sessionId - The session ID the run belongs to
   * @returns The run result
   *
   * @example
   * ```typescript
   * const run = await client.teams.getRun('team-id', 'run-id', 'session-123');
   * console.log(run);
   * ```
   */
  async getRun(
    teamId: string,
    runId: string,
    sessionId: string,
  ): Promise<unknown> {
    const params = new URLSearchParams();
    params.append("session_id", sessionId);
    return this.client.request<unknown>(
      "GET",
      `/teams/${encodeURIComponent(teamId)}/runs/${encodeURIComponent(runId)}?${params.toString()}`,
    );
  }
}
