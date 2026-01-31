import type { components } from "../generated/types";
import type { AgentOSClient } from "../client";

// Extract types from generated schemas
type AgentResponse = components["schemas"]["AgentResponse"];

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
  /** Streaming mode (only non-streaming supported in Phase 3) */
  stream?: false;
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
  async run(agentId: string, options: RunOptions): Promise<unknown> {
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
      `/agents/${encodeURIComponent(agentId)}/runs`,
      { body: formData },
    );
  }
}
