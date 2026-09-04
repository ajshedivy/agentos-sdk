import type { AgentOSClient } from "../client";
import { MigrationFailedError } from "../errors";

/**
 * Options for database migration with optional target version
 */
export interface MigrateOptions {
  /** Target migration version */
  targetVersion?: string;
}

/**
 * Outcome of a database migration.
 *
 * `POST /databases/{db_id}/migrate` answers 200 `{ message }`.
 * `POST /databases/all/migrate` answers 200 `{ message, skipped? }`, or
 * 207 Multi-Status `{ message, failed, skipped? }` when at least one
 * database failed - `migrateAll()` turns that into a `MigrationFailedError`.
 */
export interface MigrateResult {
  /** Human-readable summary, e.g. "All databases migrated successfully to latest version" */
  message: string;
  /** Database id -> failure reason; present only on a 207 Multi-Status */
  failed?: Record<string, string>;
  /** Remote database ids the server skipped (they migrate on their own AgentOS) */
  skipped?: string[];
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
 * await client.database.migrate('my-database');
 *
 * // Migrate to a specific version
 * await client.database.migrate('my-database', {
 *   targetVersion: '3',
 * });
 *
 * // Migrate all databases
 * await client.database.migrateAll();
 * ```
 */
export class DatabaseResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * Migrate a specific database
   *
   * @param dbId - The unique identifier for the database
   * @param options - Migration options including optional target version
   * @returns The server's migration summary
   *
   * @example
   * ```typescript
   * // Migrate to latest version
   * const { message } = await client.database.migrate('my-database');
   *
   * // Migrate to a specific version
   * await client.database.migrate('my-database', {
   *   targetVersion: '5',
   * });
   * ```
   */
  async migrate(
    dbId: string,
    options?: MigrateOptions,
  ): Promise<MigrateResult> {
    const params = new URLSearchParams();

    if (options?.targetVersion) {
      params.append("target_version", options.targetVersion);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/databases/${encodeURIComponent(dbId)}/migrate?${queryString}`
      : `/databases/${encodeURIComponent(dbId)}/migrate`;

    return this.client.request<MigrateResult>("POST", path);
  }

  /**
   * Migrate all databases
   *
   * @param options - Migration options including optional target version
   * @returns The server's migration summary, including any `skipped` remote databases
   * @throws {MigrationFailedError} When the server answers 207 Multi-Status
   *   because at least one database failed to migrate; `failed` maps each
   *   database id to its failure reason.
   *
   * @example
   * ```typescript
   * // Migrate all databases to latest
   * await client.database.migrateAll();
   *
   * // Migrate all databases to a specific version
   * await client.database.migrateAll({ targetVersion: '3' });
   * ```
   */
  async migrateAll(options?: MigrateOptions): Promise<MigrateResult> {
    const params = new URLSearchParams();

    if (options?.targetVersion) {
      params.append("target_version", options.targetVersion);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/databases/all/migrate?${queryString}`
      : "/databases/all/migrate";

    const result = await this.client.request<MigrateResult>("POST", path);

    // A 207 Multi-Status satisfies `response.ok`, so the transport never
    // throws for it; the non-empty `failed` map is the only signal.
    if (result.failed && Object.keys(result.failed).length > 0) {
      throw new MigrationFailedError(
        result.message,
        result.failed,
        result.skipped,
      );
    }

    return result;
  }
}
