import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { TracesResource } from "../../src/resources/traces";

describe("TracesResource", () => {
  let resource: TracesResource;
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

    resource = new TracesResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /traces with no params when options empty", async () => {
      const mockResponse = {
        data: [
          { trace_id: "trace-1", status: "completed" },
          { trace_id: "trace-2", status: "running" },
        ],
        meta: { page: 1, limit: 20, total: 2 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/traces");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds run_id query param when provided", async () => {
      const mockResponse = { data: [], meta: { page: 1, limit: 20, total: 0 } };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ runId: "run-123" });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/traces?run_id=run-123");
    });

    it("adds session_id query param when provided", async () => {
      const mockResponse = { data: [], meta: { page: 1, limit: 20, total: 0 } };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ sessionId: "session-456" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/traces?session_id=session-456",
      );
    });

    it("adds user_id query param when provided", async () => {
      const mockResponse = { data: [], meta: { page: 1, limit: 20, total: 0 } };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ userId: "user-789" });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/traces?user_id=user-789");
    });

    it("adds agent_id query param when provided", async () => {
      const mockResponse = { data: [], meta: { page: 1, limit: 20, total: 0 } };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ agentId: "agent-abc" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/traces?agent_id=agent-abc",
      );
    });

    it("adds status query param when provided", async () => {
      const mockResponse = { data: [], meta: { page: 1, limit: 20, total: 0 } };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ status: "completed" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/traces?status=completed",
      );
    });

    it("adds page query param when provided", async () => {
      const mockResponse = { data: [], meta: { page: 2, limit: 20, total: 0 } };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ page: 2 });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/traces?page=2");
    });

    it("adds limit query param when provided", async () => {
      const mockResponse = { data: [], meta: { page: 1, limit: 50, total: 0 } };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ limit: 50 });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/traces?limit=50");
    });

    it("adds multiple query params together", async () => {
      const mockResponse = { data: [], meta: { page: 2, limit: 10, total: 0 } };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({
        runId: "run-123",
        sessionId: "session-456",
        status: "completed",
        page: 2,
        limit: 10,
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/traces?run_id=run-123&session_id=session-456&status=completed&page=2&limit=10",
      );
    });

    it("only includes defined params", async () => {
      const mockResponse = { data: [], meta: { page: 1, limit: 20, total: 0 } };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({
        runId: "run-123",
        sessionId: undefined,
        status: "completed",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/traces?run_id=run-123&status=completed",
      );
    });

    it("handles empty array response", async () => {
      const mockResponse = { data: [], meta: { page: 1, limit: 20, total: 0 } };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result).toEqual(mockResponse);
      expect(result.data).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(resource.list()).rejects.toThrow("Unauthorized");
    });
  });

  describe("get()", () => {
    it("returns trace by ID with correct path", async () => {
      const mockTrace = {
        trace_id: "trace-123",
        status: "completed",
        spans: [],
      };
      requestSpy.mockResolvedValueOnce(mockTrace);

      const result = await resource.get("trace-123");

      expect(result).toEqual(mockTrace);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/traces/trace-123");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes traceId with slash", async () => {
      requestSpy.mockResolvedValueOnce({ trace_id: "trace/special" });

      await resource.get("trace/special");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/traces/trace%2Fspecial");
    });

    it("URL-encodes traceId with spaces", async () => {
      requestSpy.mockResolvedValueOnce({ trace_id: "my trace" });

      await resource.get("my trace");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/traces/my%20trace");
    });

    it("URL-encodes traceId with @ symbol", async () => {
      requestSpy.mockResolvedValueOnce({ trace_id: "trace@123" });

      await resource.get("trace@123");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/traces/trace%40123");
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.get("trace-123")).rejects.toThrow("Not found");
    });
  });
});
