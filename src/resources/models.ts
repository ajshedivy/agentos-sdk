import type { AgentOSClient } from "../client";
import { NotFoundError } from "../errors";
import type { components } from "../generated/types";

// Extract types from generated schemas
type Model = components["schemas"]["Model"];

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
 * console.log(models.map(m => m.id));
 * ```
 */
export class ModelsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List all available models
   *
   * Calls `GET /models` first. agno removed that route in 3.0, so a vanilla
   * agno >= 3.0 server answers 404 and this falls back to `available_models`
   * on `GET /config` — the models actually in use by the registered agents and
   * teams. ixora keeps its own `/models` route and serves the full catalog, so
   * the fallback never runs against an ixora stack.
   *
   * @returns Array of model configurations
   *
   * @example
   * ```typescript
   * const models = await client.models.list();
   * console.log(models.map(m => m.id));
   * ```
   */
  async list(): Promise<Model[]> {
    try {
      return await this.client.request<Model[]>("GET", "/models");
    } catch (error) {
      if (error instanceof NotFoundError) {
        return (await this.client.getConfig()).available_models ?? [];
      }
      throw error;
    }
  }
}
