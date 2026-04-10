import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type PaginatedRegistryResponse =
  components["schemas"]["PaginatedResponse_RegistryContentResponse_"];

/**
 * Options for listing registry contents with filtering and pagination
 */
export interface ListRegistryOptions {
  /** Filter by resource type */
  resourceType?: string;
  /** Filter by name */
  name?: string;
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  limit?: number;
}

/**
 * Resource class for registry operations
 *
 * Provides access to the content registry with filtering and pagination.
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all registry contents
 * const registry = await client.registry.list();
 *
 * // List with filters
 * const filtered = await client.registry.list({
 *   resourceType: 'agent',
 *   page: 1,
 *   limit: 10,
 * });
 * ```
 */
export class RegistryResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List registry contents with optional filtering and pagination
   *
   * @param options - Filtering and pagination options
   * @returns Paginated registry content response
   *
   * @example
   * ```typescript
   * // List all registry contents
   * const all = await client.registry.list();
   *
   * // List with filtering and pagination
   * const page = await client.registry.list({
   *   resourceType: 'agent',
   *   name: 'my-agent',
   *   page: 2,
   *   limit: 25,
   * });
   * ```
   */
  async list(
    options?: ListRegistryOptions,
  ): Promise<PaginatedRegistryResponse> {
    const params = new URLSearchParams();

    if (options?.resourceType) {
      params.append("resource_type", options.resourceType);
    }
    if (options?.name) {
      params.append("name", options.name);
    }
    if (options?.page !== undefined) {
      params.append("page", String(options.page));
    }
    if (options?.limit !== undefined) {
      params.append("limit", String(options.limit));
    }

    const queryString = params.toString();
    const path = queryString ? `/registry?${queryString}` : "/registry";

    return this.client.request<PaginatedRegistryResponse>("GET", path);
  }
}
