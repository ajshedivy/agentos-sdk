import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { MigrationFailedError } from "../../src/errors";
import { DatabaseResource } from "../../src/resources/database";

describe("DatabaseResource", () => {
  let resource: DatabaseResource;
  let mockClient: AgentOSClient;
  let requestSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClient = new AgentOSClient({
      baseUrl: "https://api.example.com",
      apiKey: "test-key",
    });
    requestSpy = vi.fn();
    // biome-ignore lint/suspicious/noExplicitAny: Need to mock public request method for testing
    (mockClient as any).request = requestSpy;
    resource = new DatabaseResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("migrate()", () => {
    it("calls POST with encoded dbId path param", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.migrate("my/database");

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/databases/my%2Fdatabase/migrate",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds target_version query param when provided", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.migrate("my-db", { targetVersion: "5" });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/databases/my-db/migrate?target_version=5",
      );
    });

    it("returns the server's migration summary", async () => {
      requestSpy.mockResolvedValueOnce({
        message: "Database migrated successfully to latest version",
      });

      const result = await resource.migrate("my-db");

      expect(result).toEqual({
        message: "Database migrated successfully to latest version",
      });
    });

    it("propagates errors", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Database not found"));

      await expect(resource.migrate("nonexistent")).rejects.toThrow(
        "Database not found",
      );
    });
  });

  describe("migrateAll()", () => {
    const ok = { message: "All databases migrated successfully to latest version" };

    it("calls POST /databases/all/migrate", async () => {
      requestSpy.mockResolvedValueOnce(ok);

      await resource.migrateAll();

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/databases/all/migrate",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds target_version query param when provided", async () => {
      requestSpy.mockResolvedValueOnce(ok);

      await resource.migrateAll({ targetVersion: "3" });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/databases/all/migrate?target_version=3",
      );
    });

    it("resolves the 200 body, including skipped remote databases", async () => {
      requestSpy.mockResolvedValueOnce({ ...ok, skipped: ["remote-db"] });

      const result = await resource.migrateAll();

      expect(result).toEqual({ ...ok, skipped: ["remote-db"] });
    });

    it("rejects with MigrationFailedError on a 207 body with failed databases", async () => {
      // 207 Multi-Status satisfies response.ok, so the transport resolves it
      requestSpy.mockResolvedValueOnce({
        message: "Migrated 0/1 databases to latest version",
        failed: { "agentos-db": "relation already exists" },
        skipped: ["remote-db"],
      });

      const promise = resource.migrateAll();

      await expect(promise).rejects.toThrow(MigrationFailedError);
      await expect(promise).rejects.toMatchObject({
        status: 207,
        message: "Migrated 0/1 databases to latest version",
        failed: { "agentos-db": "relation already exists" },
        skipped: ["remote-db"],
      });
    });

    it("does not throw on an empty failed map", async () => {
      requestSpy.mockResolvedValueOnce({ ...ok, failed: {} });

      await expect(resource.migrateAll()).resolves.toEqual({
        ...ok,
        failed: {},
      });
    });

    it("propagates errors", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Migration failed"));

      await expect(resource.migrateAll()).rejects.toThrow("Migration failed");
    });
  });
});
