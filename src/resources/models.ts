import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type ModelResponse = components["schemas"]["ModelResponse"];

/**
 * Resource class for model operations
 *
 * Provides read-only access to available models.
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all models
 * const models = await client.models.list();
 * console.log(models.map(m => m.name));
 * ```
 */
export class ModelsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List all available models
   *
   * @returns Array of model configurations
   *
   * @example
   * ```typescript
   * const models = await client.models.list();
   * console.log(models.map(m => m.name));
   * ```
   */
  async list(): Promise<ModelResponse[]> {
    return this.client.request<ModelResponse[]>("GET", "/models");
  }
}
