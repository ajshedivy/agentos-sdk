import type { AgentOSClient } from "../client";

/**
 * Options for database migration with optional target version
 */
export interface MigrateOptions {
  /** Target migration version */
  targetVersion?: string;
}

/**
 * Resource class for database operations
 *
 * Provides methods to trigger database migrations for individual
 * databases or all databases at once.
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // Migrate a specific database
 * await client.databases.migrate('my-database');
 *
 * // Migrate to a specific version
 * await client.databases.migrate('my-database', {
 *   targetVersion: '3',
 * });
 *
 * // Migrate all databases
 * await client.databases.migrateAll();
 * ```
 */
export class DatabaseResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * Migrate a specific database
   *
   * @param dbId - The unique identifier for the database
   * @param options - Migration options including optional target version
   * @returns Resolves when the migration completes
   *
   * @example
   * ```typescript
   * // Migrate to latest version
   * await client.databases.migrate('my-database');
   *
   * // Migrate to a specific version
   * await client.databases.migrate('my-database', {
   *   targetVersion: '5',
   * });
   * ```
   */
  async migrate(dbId: string, options?: MigrateOptions): Promise<void> {
    const params = new URLSearchParams();

    if (options?.targetVersion) {
      params.append("target_version", options.targetVersion);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/databases/${encodeURIComponent(dbId)}/migrate?${queryString}`
      : `/databases/${encodeURIComponent(dbId)}/migrate`;

    await this.client.request<void>("POST", path);
  }

  /**
   * Migrate all databases
   *
   * @param options - Migration options including optional target version
   * @returns Resolves when all migrations complete
   *
   * @example
   * ```typescript
   * // Migrate all databases to latest
   * await client.databases.migrateAll();
   *
   * // Migrate all databases to a specific version
   * await client.databases.migrateAll({ targetVersion: '3' });
   * ```
   */
  async migrateAll(options?: MigrateOptions): Promise<void> {
    const params = new URLSearchParams();

    if (options?.targetVersion) {
      params.append("target_version", options.targetVersion);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/databases/all/migrate?${queryString}`
      : "/databases/all/migrate";

    await this.client.request<void>("POST", path);
  }
}
