import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
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

    it("returns void", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      const result = await resource.migrate("my-db");

      expect(result).toBeUndefined();
    });

    it("propagates errors", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Database not found"));

      await expect(resource.migrate("nonexistent")).rejects.toThrow(
        "Database not found",
      );
    });
  });

  describe("migrateAll()", () => {
    it("calls POST /databases/all/migrate", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.migrateAll();

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/databases/all/migrate",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds target_version query param when provided", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.migrateAll({ targetVersion: "3" });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/databases/all/migrate?target_version=3",
      );
    });

    it("propagates errors", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Migration failed"));

      await expect(resource.migrateAll()).rejects.toThrow("Migration failed");
    });
  });
});
