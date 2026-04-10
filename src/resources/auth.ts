import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

// Extract types from generated schemas
type MeResponse = components["schemas"]["MeResponse"];
type KeyResponse = components["schemas"]["KeyResponse"];
type CreateKeyRequest = components["schemas"]["CreateKeyRequest"];
type CreateKeyResponse = components["schemas"]["CreateKeyResponse"];
type ConnectionResponse = components["schemas"]["ConnectionResponse"];
type AdminConnectionResponse = components["schemas"]["AdminConnectionResponse"];
type CreateConnectionRequest = components["schemas"]["CreateConnectionRequest"];
type UpdateConnectionRequest = components["schemas"]["UpdateConnectionRequest"];
type TestConnectionResponse = components["schemas"]["TestConnectionResponse"];

/**
 * Options for creating an API key
 */
export interface CreateKeyOptions {
  /** Name for the API key */
  name: string;
  /** Optional scopes to restrict key permissions */
  scopes?: string[];
  /** Optional ISO 8601 expiration timestamp */
  expiresAt?: string;
}

/**
 * Options for creating a connection
 */
export interface CreateConnectionOptions {
  /** Connection display name */
  name: string;
  /** Hostname or IP address */
  host: string;
  /** Port number */
  port: number;
  /** Username for authentication */
  user: string;
  /** Password for authentication */
  password: string;
  /** Whether this connection should be the default */
  isDefault?: boolean;
}

/**
 * Options for updating a connection
 */
export interface UpdateConnectionOptions {
  /** Updated connection name */
  name?: string;
  /** Updated hostname or IP address */
  host?: string;
  /** Updated port number */
  port?: number;
  /** Updated username */
  user?: string;
  /** Updated password */
  password?: string;
}

/**
 * Resource class for API key operations
 *
 * Provides methods to manage API keys: list, create, get, revoke, and rotate.
 */
class AuthKeysResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List all API keys
   *
   * @returns Array of API key records
   *
   * @example
   * ```typescript
   * const keys = await client.auth.keys.list();
   * console.log(keys.map(k => k.name));
   * ```
   */
  async list(): Promise<KeyResponse[]> {
    return this.client.request<KeyResponse[]>("GET", "/auth/keys");
  }

  /**
   * Create a new API key
   *
   * @param options - Key creation options including name, optional scopes, and expiration
   * @returns The newly created key with its secret value (only returned once)
   *
   * @example
   * ```typescript
   * const key = await client.auth.keys.create({
   *   name: 'CI Pipeline Key',
   *   scopes: ['agents:read', 'agents:run'],
   *   expiresAt: '2025-12-31T23:59:59Z',
   * });
   * console.log(key.key); // Store this securely - not shown again
   * ```
   */
  async create(options: CreateKeyOptions): Promise<CreateKeyResponse> {
    const body: CreateKeyRequest = {
      name: options.name,
    };

    if (options.scopes !== undefined) {
      body.scopes = options.scopes;
    }
    if (options.expiresAt !== undefined) {
      body.expires_at = options.expiresAt;
    }

    return this.client.request<CreateKeyResponse>("POST", "/auth/keys", {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Get an API key by ID
   *
   * @param keyId - The unique identifier for the API key
   * @returns API key details
   *
   * @example
   * ```typescript
   * const key = await client.auth.keys.get('key-abc-123');
   * console.log(key.name, key.created_at);
   * ```
   */
  async get(keyId: string): Promise<KeyResponse> {
    return this.client.request<KeyResponse>(
      "GET",
      `/auth/keys/${encodeURIComponent(keyId)}`,
    );
  }

  /**
   * Revoke an API key
   *
   * Permanently invalidates the key. This action cannot be undone.
   *
   * @param keyId - The unique identifier for the API key to revoke
   *
   * @example
   * ```typescript
   * await client.auth.keys.revoke('key-abc-123');
   * ```
   */
  async revoke(keyId: string): Promise<void> {
    await this.client.request<void>(
      "DELETE",
      `/auth/keys/${encodeURIComponent(keyId)}`,
    );
  }

  /**
   * Rotate an API key
   *
   * Generates a new secret for the key while preserving its ID and settings.
   * The old secret is immediately invalidated.
   *
   * @param keyId - The unique identifier for the API key to rotate
   * @returns The rotated key with its new secret value (only returned once)
   *
   * @example
   * ```typescript
   * const rotated = await client.auth.keys.rotate('key-abc-123');
   * console.log(rotated.key); // New secret - store securely
   * ```
   */
  async rotate(keyId: string): Promise<CreateKeyResponse> {
    return this.client.request<CreateKeyResponse>(
      "POST",
      `/auth/keys/${encodeURIComponent(keyId)}/rotate`,
    );
  }
}

/**
 * Resource class for connection operations
 *
 * Provides methods to manage connections: list, create, get, update, delete,
 * set default, and test connectivity.
 */
class AuthConnectionsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List connections for the current user
   *
   * @returns Array of connection records
   *
   * @example
   * ```typescript
   * const connections = await client.auth.connections.list();
   * console.log(connections.map(c => c.name));
   * ```
   */
  async list(): Promise<ConnectionResponse[]> {
    return this.client.request<ConnectionResponse[]>(
      "GET",
      "/auth/connections",
    );
  }

  /**
   * List all connections across all users (admin only)
   *
   * @returns Array of admin connection records with user information
   *
   * @example
   * ```typescript
   * const allConnections = await client.auth.connections.listAll();
   * console.log(allConnections.map(c => `${c.name} (${c.user})`));
   * ```
   */
  async listAll(): Promise<AdminConnectionResponse[]> {
    return this.client.request<AdminConnectionResponse[]>(
      "GET",
      "/auth/connections/admin/all",
    );
  }

  /**
   * Create a new connection
   *
   * @param options - Connection creation options
   * @returns The newly created connection
   *
   * @example
   * ```typescript
   * const connection = await client.auth.connections.create({
   *   name: 'Production Server',
   *   host: '10.0.1.50',
   *   port: 8471,
   *   user: 'QUSER',
   *   password: 'secret',
   *   isDefault: true,
   * });
   * ```
   */
  async create(options: CreateConnectionOptions): Promise<ConnectionResponse> {
    const body: CreateConnectionRequest = {
      name: options.name,
      host: options.host,
      port: options.port,
      user: options.user,
      password: options.password,
      is_default: options.isDefault ?? false,
    };

    return this.client.request<ConnectionResponse>(
      "POST",
      "/auth/connections",
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Get a connection by ID
   *
   * @param connectionId - The unique identifier for the connection
   * @returns Connection details
   *
   * @example
   * ```typescript
   * const connection = await client.auth.connections.get('conn-abc-123');
   * console.log(connection.name, connection.host);
   * ```
   */
  async get(connectionId: string): Promise<ConnectionResponse> {
    return this.client.request<ConnectionResponse>(
      "GET",
      `/auth/connections/${encodeURIComponent(connectionId)}`,
    );
  }

  /**
   * Update a connection
   *
   * @param connectionId - The unique identifier for the connection
   * @param options - Fields to update (all optional)
   * @returns Updated connection details
   *
   * @example
   * ```typescript
   * const updated = await client.auth.connections.update('conn-abc-123', {
   *   name: 'Renamed Server',
   *   port: 9471,
   * });
   * ```
   */
  async update(
    connectionId: string,
    options: UpdateConnectionOptions,
  ): Promise<ConnectionResponse> {
    const body: UpdateConnectionRequest = {};

    if (options.name !== undefined) {
      body.name = options.name;
    }
    if (options.host !== undefined) {
      body.host = options.host;
    }
    if (options.port !== undefined) {
      body.port = options.port;
    }
    if (options.user !== undefined) {
      body.user = options.user;
    }
    if (options.password !== undefined) {
      body.password = options.password;
    }

    return this.client.request<ConnectionResponse>(
      "PUT",
      `/auth/connections/${encodeURIComponent(connectionId)}`,
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Delete a connection
   *
   * @param connectionId - The unique identifier for the connection to delete
   *
   * @example
   * ```typescript
   * await client.auth.connections.delete('conn-abc-123');
   * ```
   */
  async delete(connectionId: string): Promise<void> {
    await this.client.request<void>(
      "DELETE",
      `/auth/connections/${encodeURIComponent(connectionId)}`,
    );
  }

  /**
   * Set a connection as the default
   *
   * @param connectionId - The unique identifier for the connection
   * @returns Updated connection details with is_default set to true
   *
   * @example
   * ```typescript
   * const connection = await client.auth.connections.setDefault('conn-abc-123');
   * ```
   */
  async setDefault(connectionId: string): Promise<ConnectionResponse> {
    return this.client.request<ConnectionResponse>(
      "PUT",
      `/auth/connections/${encodeURIComponent(connectionId)}/default`,
    );
  }

  /**
   * Test connectivity for a connection
   *
   * @param connectionId - The unique identifier for the connection to test
   * @returns Test result indicating success or failure with details
   *
   * @example
   * ```typescript
   * const result = await client.auth.connections.test('conn-abc-123');
   * if (result.success) {
   *   console.log('Connection is healthy');
   * } else {
   *   console.error('Connection failed:', result.message);
   * }
   * ```
   */
  async test(connectionId: string): Promise<TestConnectionResponse> {
    return this.client.request<TestConnectionResponse>(
      "POST",
      `/auth/connections/${encodeURIComponent(connectionId)}/test`,
    );
  }
}

/**
 * Resource class for authentication operations
 *
 * Provides methods for:
 * - Current user info via `auth.me()`
 * - API key management via `auth.keys.*`
 * - Connection management via `auth.connections.*`
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // Get current user
 * const me = await client.auth.me();
 *
 * // Manage API keys
 * const keys = await client.auth.keys.list();
 * const newKey = await client.auth.keys.create({ name: 'My Key' });
 *
 * // Manage connections
 * const connections = await client.auth.connections.list();
 * const result = await client.auth.connections.test('conn-id');
 * ```
 */
export class AuthResource {
  /** API key management */
  readonly keys: AuthKeysResource;
  /** Connection management */
  readonly connections: AuthConnectionsResource;

  constructor(private readonly client: AgentOSClient) {
    this.keys = new AuthKeysResource(client);
    this.connections = new AuthConnectionsResource(client);
  }

  /**
   * Get the current authenticated user's information
   *
   * @returns Current user details
   *
   * @example
   * ```typescript
   * const me = await client.auth.me();
   * console.log(me.user_id, me.email);
   * ```
   */
  async me(): Promise<MeResponse> {
    return this.client.request<MeResponse>("GET", "/auth/me");
  }
}
