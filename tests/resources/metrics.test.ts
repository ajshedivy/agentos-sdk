import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { MetricsResource } from "../../src/resources/metrics";

describe("MetricsResource", () => {
  let resource: MetricsResource;
  let mockClient: AgentOSClient;
  let requestSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create a real client, then spy on its request method
    mockClient = new AgentOSClient({
      baseUrl: "https://api.example.com",
      apiKey: "test-key",
    });
    requestSpy = vi.fn();
    // Mock the request method
    // biome-ignore lint/suspicious/noExplicitAny: Need to mock public request method for testing
    (mockClient as any).request = requestSpy;

    resource = new MetricsResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("get()", () => {
    it("calls GET /metrics with no params when options empty", async () => {
      const mockResponse = {
        metrics: [
          { date: "2024-01-01", total_runs: 10 },
          { date: "2024-01-02", total_runs: 15 },
        ],
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.get();

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/metrics");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds starting_date query param when provided", async () => {
      const mockResponse = { metrics: [] };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.get({ startingDate: "2024-01-01" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/metrics?starting_date=2024-01-01",
      );
    });

    it("adds ending_date query param when provided", async () => {
      const mockResponse = { metrics: [] };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.get({ endingDate: "2024-01-31" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/metrics?ending_date=2024-01-31",
      );
    });

    it("adds both date params together", async () => {
      const mockResponse = { metrics: [] };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.get({
        startingDate: "2024-01-01",
        endingDate: "2024-01-31",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/metrics?starting_date=2024-01-01&ending_date=2024-01-31",
      );
    });

    it("only includes defined params", async () => {
      const mockResponse = { metrics: [] };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.get({
        startingDate: "2024-01-01",
        endingDate: undefined,
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/metrics?starting_date=2024-01-01",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Invalid date range"));

      await expect(resource.get()).rejects.toThrow("Invalid date range");
    });
  });

  describe("refresh()", () => {
    it("calls POST /metrics/refresh", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.refresh();

      expect(requestSpy).toHaveBeenCalledWith("POST", "/metrics/refresh");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("returns void/undefined", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      const result = await resource.refresh();

      expect(result).toBeUndefined();
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Service unavailable"));

      await expect(resource.refresh()).rejects.toThrow("Service unavailable");
    });
  });
});
