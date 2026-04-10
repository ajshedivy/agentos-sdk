import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { RegistryResource } from "../../src/resources/registry";

describe("RegistryResource", () => {
  let resource: RegistryResource;
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
    resource = new RegistryResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /registry with no params", async () => {
      requestSpy.mockResolvedValueOnce({ items: [], total: 0 });

      await resource.list();

      expect(requestSpy).toHaveBeenCalledWith("GET", "/registry");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds resource_type query param", async () => {
      requestSpy.mockResolvedValueOnce({ items: [], total: 0 });

      await resource.list({ resourceType: "agent" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/registry?resource_type=agent",
      );
    });

    it("adds name query param", async () => {
      requestSpy.mockResolvedValueOnce({ items: [], total: 0 });

      await resource.list({ name: "my-agent" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/registry?name=my-agent",
      );
    });

    it("adds pagination params (page, limit)", async () => {
      requestSpy.mockResolvedValueOnce({ items: [], total: 0 });

      await resource.list({ page: 2, limit: 25 });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/registry?page=2&limit=25",
      );
    });

    it("propagates errors", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Internal Server Error"));

      await expect(resource.list()).rejects.toThrow("Internal Server Error");
    });
  });
});
