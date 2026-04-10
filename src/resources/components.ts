import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type ComponentResponse = components["schemas"]["ComponentResponse"];
type ComponentCreate = components["schemas"]["ComponentCreate"];
type ComponentUpdate = components["schemas"]["ComponentUpdate"];
type ComponentType = components["schemas"]["ComponentType"];
type ComponentConfigResponse = components["schemas"]["ComponentConfigResponse"];
type ConfigCreate = components["schemas"]["ConfigCreate"];
type ConfigUpdate = components["schemas"]["ConfigUpdate"];
type PaginatedComponentResponse =
  components["schemas"]["PaginatedResponse_ComponentResponse_"];

/**
 * Options for listing components
 */
export interface ListComponentsOptions {
  /** Filter by component type */
  componentType?: string;
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  limit?: number;
}

/**
 * Options for creating a component
 */
export interface CreateComponentOptions {
  /** Component name */
  name: string;
  /** Component type ('agent', 'team', or 'workflow') */
  componentType: ComponentType;
  /** Optional component ID (auto-generated from name if not provided) */
  componentId?: string;
  /** Optional description */
  description?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Optional initial configuration data */
  config?: Record<string, unknown>;
  /** Optional label (e.g. 'stable') */
  label?: string;
  /** Stage: 'draft' or 'published' (default: 'draft') */
  stage?: string;
  /** Optional notes */
  notes?: string;
  /** Set as current version (default: true) */
  setCurrent?: boolean;
}

/**
 * Options for updating a component
 */
export interface UpdateComponentOptions {
  /** Component name */
  name?: string;
  /** Component type */
  componentType?: string;
  /** Description */
  description?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Options for creating a component config
 */
export interface CreateConfigOptions {
  /** Configuration data */
  config: Record<string, unknown>;
  /** Optional version number */
  version?: number;
  /** Optional label (e.g. 'stable') */
  label?: string;
  /** Stage: 'draft' or 'published' (default: 'draft') */
  stage?: string;
  /** Optional notes */
  notes?: string;
  /** Optional links to child components */
  links?: Record<string, unknown>[];
  /** Set as current version (default: true) */
  setCurrent?: boolean;
}

/**
 * Options for updating a draft config
 */
export interface UpdateConfigOptions {
  /** Configuration data */
  config?: Record<string, unknown>;
  /** Label (e.g. 'stable') */
  label?: string;
  /** Stage: 'draft' or 'published' */
  stage?: string;
  /** Notes */
  notes?: string;
  /** Links to child components */
  links?: Record<string, unknown>[];
}

/**
 * Resource class for component operations
 *
 * Provides methods to:
 * - List, create, get, update, and delete components
 * - Manage component configurations and versioning
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // List all components
 * const components = await client.components.list();
 *
 * // Create a component
 * const component = await client.components.create({
 *   name: 'My Component',
 *   componentType: 'agent',
 * });
 *
 * // Get current config
 * const config = await client.components.getCurrentConfig('component-id');
 * ```
 */
export class ComponentsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List components with optional filtering and pagination
   *
   * @param options - Optional filters and pagination parameters
   * @returns Paginated response with components
   *
   * @example
   * ```typescript
   * const response = await client.components.list({
   *   componentType: 'agent',
   *   page: 1,
   *   limit: 20,
   * });
   * console.log(response.data);
   * ```
   */
  async list(
    options?: ListComponentsOptions,
  ): Promise<PaginatedComponentResponse> {
    const params = new URLSearchParams();

    if (options?.componentType !== undefined) {
      params.append("component_type", options.componentType);
    }
    if (options?.page !== undefined) {
      params.append("page", String(options.page));
    }
    if (options?.limit !== undefined) {
      params.append("limit", String(options.limit));
    }

    const queryString = params.toString();
    const path = queryString ? `/components?${queryString}` : "/components";

    return this.client.request<PaginatedComponentResponse>("GET", path);
  }

  /**
   * Create a new component
   *
   * @param options - Component creation options
   * @returns Created component
   *
   * @example
   * ```typescript
   * const component = await client.components.create({
   *   name: 'My Agent',
   *   componentType: 'agent',
   *   description: 'A helpful assistant',
   * });
   * ```
   */
  async create(options: CreateComponentOptions): Promise<ComponentResponse> {
    const body: ComponentCreate = {
      name: options.name,
      component_type: options.componentType,
      stage: options.stage ?? "draft",
      set_current: options.setCurrent ?? true,
    };

    if (options.componentId !== undefined) {
      body.component_id = options.componentId;
    }
    if (options.description !== undefined) {
      body.description = options.description;
    }
    if (options.metadata !== undefined) {
      body.metadata = options.metadata;
    }
    if (options.config !== undefined) {
      body.config = options.config;
    }
    if (options.label !== undefined) {
      body.label = options.label;
    }
    if (options.notes !== undefined) {
      body.notes = options.notes;
    }

    return this.client.request<ComponentResponse>("POST", "/components", {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Get component details by ID
   *
   * @param componentId - The unique identifier for the component
   * @returns Component details
   *
   * @example
   * ```typescript
   * const component = await client.components.get('component-123');
   * console.log(component.name, component.component_type);
   * ```
   */
  async get(componentId: string): Promise<ComponentResponse> {
    return this.client.request<ComponentResponse>(
      "GET",
      `/components/${encodeURIComponent(componentId)}`,
    );
  }

  /**
   * Update an existing component
   *
   * @param componentId - The unique identifier for the component
   * @param options - Fields to update (all optional)
   * @returns Updated component
   *
   * @example
   * ```typescript
   * const updated = await client.components.update('component-123', {
   *   name: 'Renamed Component',
   *   description: 'Updated description',
   * });
   * ```
   */
  async update(
    componentId: string,
    options: UpdateComponentOptions,
  ): Promise<ComponentResponse> {
    const body: ComponentUpdate = {};

    if (options.name !== undefined) {
      body.name = options.name;
    }
    if (options.componentType !== undefined) {
      body.component_type = options.componentType;
    }
    if (options.description !== undefined) {
      body.description = options.description;
    }
    if (options.metadata !== undefined) {
      body.metadata = options.metadata;
    }

    return this.client.request<ComponentResponse>(
      "PATCH",
      `/components/${encodeURIComponent(componentId)}`,
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Delete a component
   *
   * @param componentId - The unique identifier for the component
   *
   * @example
   * ```typescript
   * await client.components.delete('component-123');
   * ```
   */
  async delete(componentId: string): Promise<void> {
    await this.client.request<void>(
      "DELETE",
      `/components/${encodeURIComponent(componentId)}`,
    );
  }

  /**
   * List all configurations for a component
   *
   * @param componentId - The unique identifier for the component
   * @returns Array of component configurations
   *
   * @example
   * ```typescript
   * const configs = await client.components.listConfigs('component-123');
   * console.log(configs.map(c => c.version));
   * ```
   */
  async listConfigs(componentId: string): Promise<ComponentConfigResponse[]> {
    return this.client.request<ComponentConfigResponse[]>(
      "GET",
      `/components/${encodeURIComponent(componentId)}/configs`,
    );
  }

  /**
   * Create a new configuration for a component
   *
   * @param componentId - The unique identifier for the component
   * @param options - Configuration creation options
   * @returns Created configuration
   *
   * @example
   * ```typescript
   * const config = await client.components.createConfig('component-123', {
   *   config: { model: 'gpt-4', temperature: 0.7 },
   *   notes: 'Initial config',
   * });
   * ```
   */
  async createConfig(
    componentId: string,
    options: CreateConfigOptions,
  ): Promise<ComponentConfigResponse> {
    const body: ConfigCreate = {
      config: options.config,
      stage: options.stage ?? "draft",
      set_current: options.setCurrent ?? true,
    };

    if (options.version !== undefined) {
      body.version = options.version;
    }
    if (options.label !== undefined) {
      body.label = options.label;
    }
    if (options.notes !== undefined) {
      body.notes = options.notes;
    }
    if (options.links !== undefined) {
      body.links = options.links;
    }

    return this.client.request<ComponentConfigResponse>(
      "POST",
      `/components/${encodeURIComponent(componentId)}/configs`,
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Get the current active configuration for a component
   *
   * @param componentId - The unique identifier for the component
   * @returns Current active configuration
   *
   * @example
   * ```typescript
   * const current = await client.components.getCurrentConfig('component-123');
   * console.log(current.config, current.version);
   * ```
   */
  async getCurrentConfig(
    componentId: string,
  ): Promise<ComponentConfigResponse> {
    return this.client.request<ComponentConfigResponse>(
      "GET",
      `/components/${encodeURIComponent(componentId)}/configs/current`,
    );
  }

  /**
   * Get a specific configuration version for a component
   *
   * @param componentId - The unique identifier for the component
   * @param version - The configuration version number
   * @returns Configuration at the specified version
   *
   * @example
   * ```typescript
   * const config = await client.components.getConfigVersion('component-123', 2);
   * console.log(config.config, config.version);
   * ```
   */
  async getConfigVersion(
    componentId: string,
    version: number,
  ): Promise<ComponentConfigResponse> {
    return this.client.request<ComponentConfigResponse>(
      "GET",
      `/components/${encodeURIComponent(componentId)}/configs/${encodeURIComponent(String(version))}`,
    );
  }

  /**
   * Update a draft configuration version
   *
   * @param componentId - The unique identifier for the component
   * @param version - The draft configuration version number
   * @param options - Fields to update
   * @returns Updated configuration
   *
   * @example
   * ```typescript
   * const updated = await client.components.updateDraftConfig(
   *   'component-123',
   *   3,
   *   { config: { model: 'gpt-4', temperature: 0.5 } },
   * );
   * ```
   */
  async updateDraftConfig(
    componentId: string,
    version: number,
    options: UpdateConfigOptions,
  ): Promise<ComponentConfigResponse> {
    const body: ConfigUpdate = {};

    if (options.config !== undefined) {
      body.config = options.config;
    }
    if (options.label !== undefined) {
      body.label = options.label;
    }
    if (options.stage !== undefined) {
      body.stage = options.stage;
    }
    if (options.notes !== undefined) {
      body.notes = options.notes;
    }
    if (options.links !== undefined) {
      body.links = options.links;
    }

    return this.client.request<ComponentConfigResponse>(
      "PATCH",
      `/components/${encodeURIComponent(componentId)}/configs/${encodeURIComponent(String(version))}`,
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Delete a specific configuration version
   *
   * @param componentId - The unique identifier for the component
   * @param version - The configuration version number to delete
   *
   * @example
   * ```typescript
   * await client.components.deleteConfigVersion('component-123', 3);
   * ```
   */
  async deleteConfigVersion(
    componentId: string,
    version: number,
  ): Promise<void> {
    await this.client.request<void>(
      "DELETE",
      `/components/${encodeURIComponent(componentId)}/configs/${encodeURIComponent(String(version))}`,
    );
  }

  /**
   * Set a configuration version as the current active config
   *
   * @param componentId - The unique identifier for the component
   * @param version - The configuration version number to activate
   * @returns The activated configuration
   *
   * @example
   * ```typescript
   * const config = await client.components.setCurrentConfig('component-123', 2);
   * console.log(config.version); // 2
   * ```
   */
  async setCurrentConfig(
    componentId: string,
    version: number,
  ): Promise<ComponentConfigResponse> {
    return this.client.request<ComponentConfigResponse>(
      "POST",
      `/components/${encodeURIComponent(componentId)}/configs/${encodeURIComponent(String(version))}/set-current`,
    );
  }
}
