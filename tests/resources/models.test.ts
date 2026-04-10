import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { ModelsResource } from "../../src/resources/models";

describe("ModelsResource", () => {
  let resource: ModelsResource;
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
    resource = new ModelsResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /models", async () => {
      requestSpy.mockResolvedValueOnce([]);

      await resource.list();

      expect(requestSpy).toHaveBeenCalledWith("GET", "/models");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("returns response passthrough", async () => {
      const mockModels = [
        { name: "gpt-4", provider: "openai" },
        { name: "claude-3", provider: "anthropic" },
      ];
      requestSpy.mockResolvedValueOnce(mockModels);

      const result = await resource.list();

      expect(result).toEqual(mockModels);
    });

    it("propagates errors", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(resource.list()).rejects.toThrow("Unauthorized");
    });
  });
});
