import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";
import { AgentStream } from "../streaming";
import type { Image, Audio, Video, FileType } from "../types/files";
import { normalizeFileInput } from "../utils/files";

// Extract types from generated schemas
type WorkflowResponse = components["schemas"]["WorkflowResponse"];

/**
 * Options for running a workflow
 */
export interface WorkflowRunOptions {
  /** The message to send to the workflow */
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
 * Options for streaming workflow run
 */
export interface WorkflowStreamRunOptions {
  /** The message to send to the workflow */
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
 * Options for continuing a paused workflow run
 */
export interface WorkflowContinueOptions {
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
 * Resource class for workflow operations
 *
 * Provides methods to:
 * - List all workflows
 * - Get workflow details by ID
 * - Run a workflow with a message
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all workflows
 * const workflows = await client.workflows.list();
 *
 * // Get specific workflow
 * const workflow = await client.workflows.get('workflow-id');
 *
 * // Run workflow
 * const result = await client.workflows.run('workflow-id', {
 *   message: 'Hello!',
 *   sessionId: 'session-123',
 * });
 * ```
 */
export class WorkflowsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List all workflows
   *
   * @returns Array of workflow configurations
   *
   * @example
   * ```typescript
   * const workflows = await client.workflows.list();
   * console.log(workflows.map(w => w.name));
   * ```
   */
  async list(): Promise<WorkflowResponse[]> {
    return this.client.request<WorkflowResponse[]>("GET", "/workflows");
  }

  /**
   * Get workflow details by ID
   *
   * @param workflowId - The unique identifier for the workflow
   * @returns Workflow configuration
   *
   * @example
   * ```typescript
   * const workflow = await client.workflows.get('my-workflow-id');
   * console.log(workflow.name, workflow.model);
   * ```
   */
  async get(workflowId: string): Promise<WorkflowResponse> {
    return this.client.request<WorkflowResponse>(
      "GET",
      `/workflows/${encodeURIComponent(workflowId)}`,
    );
  }

  /**
   * Run a workflow (non-streaming)
   *
   * Executes a workflow with a message and optional context.
   * Returns the workflow's response as a Promise.
   *
   * @param workflowId - The unique identifier for the workflow
   * @param options - Run configuration including message and optional session/user context
   * @returns Workflow run result
   *
   * @example
   * ```typescript
   * const result = await client.workflows.run('workflow-id', {
   *   message: 'What is the weather today?',
   *   sessionId: 'session-456',
   *   userId: 'user-789',
   * });
   * ```
   */
  async run(workflowId: string, options: WorkflowRunOptions): Promise<unknown> {
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
    return this.client.request<unknown>(
      "POST",
      `/workflows/${encodeURIComponent(workflowId)}/runs`,
      { body: formData },
    );
  }

  /**
   * Run a workflow with streaming response.
   *
   * Returns an AgentStream that can be consumed via:
   * - Async iteration: `for await (const event of stream) { ... }`
   * - Event handlers: `stream.on('RunContent', handler).start()`
   *
   * @param workflowId - The unique identifier for the workflow
   * @param options - Run configuration including message and optional context
   * @returns AgentStream for consuming events
   *
   * @example Async iteration
   * ```typescript
   * const stream = await client.workflows.runStream('workflow-id', {
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
    workflowId: string,
    options: WorkflowStreamRunOptions,
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
      `/workflows/${encodeURIComponent(workflowId)}/runs`,
      { body: formData, signal: controller.signal },
    );

    return AgentStream.fromSSEResponse(response, controller);
  }

  /**
   * Continue a paused workflow run with tool results.
   *
   * @param workflowId - The workflow identifier
   * @param runId - The run identifier to continue
   * @param options - Continue options including tool results
   * @returns AgentStream if streaming, otherwise the run result
   */
  async continue(
    workflowId: string,
    runId: string,
    options: WorkflowContinueOptions,
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

    const path = `/workflows/${encodeURIComponent(workflowId)}/runs/${encodeURIComponent(runId)}/continue`;

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
   * Cancel a running workflow.
   *
   * @param workflowId - The workflow identifier
   * @param runId - The run identifier to cancel
   */
  async cancel(workflowId: string, runId: string): Promise<void> {
    await this.client.request<void>(
      "POST",
      `/workflows/${encodeURIComponent(workflowId)}/runs/${encodeURIComponent(runId)}/cancel`,
    );
  }
}
