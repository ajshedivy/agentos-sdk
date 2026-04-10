import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";
import { AgentStream } from "../streaming";
import type { Audio, FileType, Image, Video } from "../types/files";
import { normalizeFileInput } from "../utils/files";

// Extract types from generated schemas
type AgentResponse = components["schemas"]["AgentResponse"];

/**
 * Result of a non-streaming agent run
 */
export type AgentRunResult = components["schemas"]["RunSchema"];

/**
 * Options for running an agent
 */
export interface RunOptions {
  /** The message to send to the agent */
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
 * Options for streaming agent run
 */
export interface StreamRunOptions {
  /** The message to send to the agent */
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
 * Options for continuing a paused agent run
 */
export interface ContinueOptions {
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
 * Options for listing agent runs
 */
export interface ListAgentRunsOptions {
  /** Filter by run status */
  status?: string;
}

/**
 * Resource class for agent operations
 *
 * Provides methods to:
 * - List all agents
 * - Get agent details by ID
 * - Run an agent with a message
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all agents
 * const agents = await client.agents.list();
 *
 * // Get specific agent
 * const agent = await client.agents.get('agent-id');
 *
 * // Run agent
 * const result = await client.agents.run('agent-id', {
 *   message: 'Hello!',
 *   sessionId: 'session-123',
 * });
 * ```
 */
export class AgentsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List all agents
   *
   * @returns Array of agent configurations
   *
   * @example
   * ```typescript
   * const agents = await client.agents.list();
   * console.log(agents.map(a => a.name));
   * ```
   */
  async list(): Promise<AgentResponse[]> {
    return this.client.request<AgentResponse[]>("GET", "/agents");
  }

  /**
   * Get agent details by ID
   *
   * @param agentId - The unique identifier for the agent
   * @returns Agent configuration
   *
   * @example
   * ```typescript
   * const agent = await client.agents.get('my-agent-id');
   * console.log(agent.name, agent.model);
   * ```
   */
  async get(agentId: string): Promise<AgentResponse> {
    return this.client.request<AgentResponse>(
      "GET",
      `/agents/${encodeURIComponent(agentId)}`,
    );
  }

  /**
   * Run an agent (non-streaming)
   *
   * Executes an agent with a message and optional context.
   * Returns the agent's response as a Promise.
   *
   * @param agentId - The unique identifier for the agent
   * @param options - Run configuration including message and optional session/user context
   * @returns Agent run result
   *
   * @example
   * ```typescript
   * const result = await client.agents.run('agent-id', {
   *   message: 'What is the weather today?',
   *   sessionId: 'session-456',
   *   userId: 'user-789',
   * });
   * ```
   */
  async run(agentId: string, options: RunOptions): Promise<AgentRunResult> {
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
    return this.client.request<AgentRunResult>(
      "POST",
      `/agents/${encodeURIComponent(agentId)}/runs`,
      { body: formData },
    );
  }

  /**
   * Run an agent with streaming response.
   *
   * Returns an AgentStream that can be consumed via:
   * - Async iteration: `for await (const event of stream) { ... }`
   * - Event handlers: `stream.on('RunContent', handler).start()`
   *
   * @param agentId - The unique identifier for the agent
   * @param options - Run configuration including message and optional context
   * @returns AgentStream for consuming events
   *
   * @example Async iteration
   * ```typescript
   * const stream = await client.agents.runStream('agent-id', {
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
    agentId: string,
    options: StreamRunOptions,
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
      `/agents/${encodeURIComponent(agentId)}/runs`,
      { body: formData, signal: controller.signal },
    );

    return AgentStream.fromSSEResponse(response, controller);
  }

  /**
   * Continue a paused agent run with tool results.
   *
   * @param agentId - The agent identifier
   * @param runId - The run identifier to continue
   * @param options - Continue options including tool results
   * @returns AgentStream if streaming, otherwise the run result
   */
  async continue(
    agentId: string,
    runId: string,
    options: ContinueOptions,
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

    const path = `/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}/continue`;

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
   * Cancel a running agent.
   *
   * @param agentId - The agent identifier
   * @param runId - The run identifier to cancel
   */
  async cancel(agentId: string, runId: string): Promise<void> {
    await this.client.request<void>(
      "POST",
      `/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}/cancel`,
    );
  }

  /**
   * List runs for an agent within a session
   *
   * @param agentId - The unique identifier for the agent
   * @param sessionId - The session ID to filter runs by
   * @param options - Optional filters for the run list
   * @returns Array of run results
   *
   * @example
   * ```typescript
   * const runs = await client.agents.listRuns('agent-id', 'session-123');
   * console.log(runs.length);
   * ```
   */
  async listRuns(
    agentId: string,
    sessionId: string,
    options?: ListAgentRunsOptions,
  ): Promise<unknown[]> {
    const params = new URLSearchParams();
    params.append("session_id", sessionId);
    if (options?.status) {
      params.append("status", options.status);
    }
    return this.client.request<unknown[]>(
      "GET",
      `/agents/${encodeURIComponent(agentId)}/runs?${params.toString()}`,
    );
  }

  /**
   * Get a specific run for an agent
   *
   * @param agentId - The unique identifier for the agent
   * @param runId - The unique identifier for the run
   * @param sessionId - The session ID the run belongs to
   * @returns The run result
   *
   * @example
   * ```typescript
   * const run = await client.agents.getRun('agent-id', 'run-id', 'session-123');
   * console.log(run);
   * ```
   */
  async getRun(
    agentId: string,
    runId: string,
    sessionId: string,
  ): Promise<unknown> {
    const params = new URLSearchParams();
    params.append("session_id", sessionId);
    return this.client.request<unknown>(
      "GET",
      `/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}?${params.toString()}`,
    );
  }
}
