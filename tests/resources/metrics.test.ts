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

    it("adds user_id query param when userId provided", async () => {
      const mockResponse = { metrics: [] };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.get({ userId: "u1" });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/metrics?user_id=u1");
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

    it("adds db_id query param when dbId provided", async () => {
      const mockResponse = { metrics: [] };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.get({ dbId: "mydb" });

      const callPath = requestSpy.mock.calls[0][1];
      expect(callPath).toContain("db_id=mydb");
    });

    it("does not include db_id when dbId not provided", async () => {
      const mockResponse = { metrics: [] };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.get();

      expect(requestSpy).toHaveBeenCalledWith("GET", "/metrics");
    });
  });

  describe("refresh()", () => {
    const dayList = [
      {
        id: "2025-08-12_daily",
        agent_runs_count: 2,
        agent_sessions_count: 2,
        team_runs_count: 0,
        team_sessions_count: 0,
        workflow_runs_count: 0,
        workflow_sessions_count: 0,
        users_count: 1,
        token_metrics: { input_tokens: 256, output_tokens: 441 },
        model_metrics: [],
        date: "2025-08-12T00:00:00Z",
        created_at: "2025-08-12T08:01:47Z",
        updated_at: "2025-08-12T08:01:47Z",
      },
    ];

    it("calls POST /metrics/refresh with no params", async () => {
      requestSpy.mockResolvedValueOnce(dayList);

      await resource.refresh();

      expect(requestSpy).toHaveBeenCalledWith("POST", "/metrics/refresh");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("returns the refreshed DayAggregatedMetrics list", async () => {
      requestSpy.mockResolvedValueOnce(dayList);

      const result = await resource.refresh();

      expect(result).toEqual(dayList);
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result[0]?.agent_runs_count).toBe(2);
      }
    });

    it("returns already_running when a sync refresh is already in flight", async () => {
      const body = {
        status: "already_running",
        message: "A metrics refresh is already in progress",
      };
      requestSpy.mockResolvedValueOnce(body);

      const result = await resource.refresh();

      expect(result).toEqual(body);
      expect(Array.isArray(result)).toBe(false);
    });

    it("appends background=true and returns the 202 status body", async () => {
      const body = {
        status: "started",
        message: "Metrics refresh started in background",
      };
      requestSpy.mockResolvedValueOnce(body);

      const result = await resource.refresh({ background: true });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/metrics/refresh?background=true",
      );
      expect(result).toEqual(body);
    });

    it("combines db_id and background query params", async () => {
      requestSpy.mockResolvedValueOnce({ status: "started" });

      await resource.refresh({ dbId: "mydb", background: true });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/metrics/refresh?db_id=mydb&background=true",
      );
    });

    it("omits background when false", async () => {
      requestSpy.mockResolvedValueOnce([]);

      await resource.refresh({ background: false });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/metrics/refresh");
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Service unavailable"));

      await expect(resource.refresh()).rejects.toThrow("Service unavailable");
    });

    it("adds db_id query param when dbId provided", async () => {
      requestSpy.mockResolvedValueOnce([]);

      await resource.refresh({ dbId: "mydb" });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/metrics/refresh?db_id=mydb",
      );
    });
  });

  describe("refreshStatus()", () => {
    it("calls GET /metrics/refresh/status with no params", async () => {
      const body = {
        status: "idle",
        started_at: null,
        finished_at: null,
        error: null,
      };
      requestSpy.mockResolvedValueOnce(body);

      const result = await resource.refreshStatus();

      expect(result).toEqual(body);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/metrics/refresh/status");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("returns the completed status shape", async () => {
      const body = {
        status: "completed",
        started_at: "2025-08-12T08:01:47Z",
        finished_at: "2025-08-12T08:01:49Z",
        error: null,
      };
      requestSpy.mockResolvedValueOnce(body);

      const result = await resource.refreshStatus();

      expect(result.status).toBe("completed");
      expect(result.started_at).toBe("2025-08-12T08:01:47Z");
      expect(result.finished_at).toBe("2025-08-12T08:01:49Z");
      expect(result.error).toBeNull();
    });

    it("adds db_id query param when dbId provided", async () => {
      requestSpy.mockResolvedValueOnce({ status: "running" });

      await resource.refreshStatus({ dbId: "mydb" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/metrics/refresh/status?db_id=mydb",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Database not found"));

      await expect(resource.refreshStatus()).rejects.toThrow(
        "Database not found",
      );
    });
  });
});
