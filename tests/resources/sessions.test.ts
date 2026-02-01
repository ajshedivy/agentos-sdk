import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { SessionsResource } from "../../src/resources/sessions";

describe("SessionsResource", () => {
  let resource: SessionsResource;
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

    resource = new SessionsResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /sessions with no params when options empty", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/sessions");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("handles empty array response", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result.data).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("adds query param for type", async () => {
      const mockResponse = {
        data: [{ session_id: "s1", session_name: "Session 1" }],
        meta: { total: 1, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ type: "agent" });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/sessions?type=agent");
    });

    it("adds query param for component_id", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ componentId: "agent-123" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions?component_id=agent-123",
      );
    });

    it("adds query param for user_id", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ userId: "user-456" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions?user_id=user-456",
      );
    });

    it("adds query param for name", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ name: "My Session" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions?name=My+Session",
      );
    });

    it("adds pagination params page and limit", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 2, limit: 10 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ page: 2, limit: 10 });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions?page=2&limit=10",
      );
    });

    it("adds sort params sort_by and sort_order", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ sortBy: "created_at", sortOrder: "desc" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions?sort_by=created_at&sort_order=desc",
      );
    });

    it("only includes defined params (no undefined in query)", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({
        type: "agent",
        componentId: undefined,
        page: 1,
      });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/sessions?type=agent&page=1");
      // Verify undefined params are not included
      const callArgs = requestSpy.mock.calls[0][1];
      expect(callArgs).not.toContain("undefined");
      expect(callArgs).not.toContain("component_id");
    });

    it("combines multiple filter and pagination params", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 2, limit: 10 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({
        type: "team",
        componentId: "team-789",
        page: 2,
        limit: 10,
        sortBy: "updated_at",
        sortOrder: "asc",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions?type=team&component_id=team-789&page=2&limit=10&sort_by=updated_at&sort_order=asc",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Network error"));

      await expect(resource.list()).rejects.toThrow("Network error");
    });
  });

  describe("get()", () => {
    it("returns session by ID with correct path", async () => {
      const mockSession = {
        session_id: "session-1",
        session_name: "Test Session",
        created_at: "2024-01-01",
      };
      requestSpy.mockResolvedValueOnce(mockSession);

      const result = await resource.get("session-1");

      expect(result).toEqual(mockSession);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/sessions/session-1");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes sessionId with forward slash", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "session/special" });

      await resource.get("session/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions/session%2Fspecial",
      );
    });

    it("URL-encodes sessionId with space", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "my session" });

      await resource.get("my session");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/sessions/my%20session");
    });

    it("URL-encodes sessionId with @ symbol", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "session@123" });

      await resource.get("session@123");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions/session%40123",
      );
    });

    it("adds db_id query param when provided", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "session-1" });

      await resource.get("session-1", { dbId: "db-456" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions/session-1?db_id=db-456",
      );
    });

    it("does not add query params when dbId is undefined", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "session-1" });

      await resource.get("session-1", { dbId: undefined });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/sessions/session-1");
    });

    it("propagates errors", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.get("session-1")).rejects.toThrow("Not found");
    });
  });

  describe("create()", () => {
    it("sends POST /sessions with FormData", async () => {
      const mockSession = {
        session_id: "new-session",
        session_name: "New Session",
      };
      requestSpy.mockResolvedValueOnce(mockSession);

      const result = await resource.create({
        type: "agent",
        componentId: "agent-123",
      });

      expect(result).toEqual(mockSession);
      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith("POST", "/sessions", {
        body: expect.any(FormData),
      });

      // Verify FormData contents
      const formData = requestSpy.mock.calls[0][2].body;
      expect(formData.get("type")).toBe("agent");
      expect(formData.get("component_id")).toBe("agent-123");
    });

    it("includes type and component_id in FormData", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "s1" });

      await resource.create({
        type: "team",
        componentId: "team-456",
      });

      const formData = requestSpy.mock.calls[0][2].body;
      expect(formData.get("type")).toBe("team");
      expect(formData.get("component_id")).toBe("team-456");
    });

    it("includes optional name when provided", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "s1" });

      await resource.create({
        type: "workflow",
        componentId: "workflow-789",
        name: "My Workflow Session",
      });

      const formData = requestSpy.mock.calls[0][2].body;
      expect(formData.get("name")).toBe("My Workflow Session");
    });

    it("includes optional user_id when provided", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "s1" });

      await resource.create({
        type: "agent",
        componentId: "agent-123",
        userId: "user-999",
      });

      const formData = requestSpy.mock.calls[0][2].body;
      expect(formData.get("user_id")).toBe("user-999");
    });

    it("includes optional db_id when provided", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "s1" });

      await resource.create({
        type: "agent",
        componentId: "agent-123",
        dbId: "db-888",
      });

      const formData = requestSpy.mock.calls[0][2].body;
      expect(formData.get("db_id")).toBe("db-888");
    });

    it("does not include optional fields when undefined", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "s1" });

      await resource.create({
        type: "agent",
        componentId: "agent-123",
        name: undefined,
        userId: undefined,
        dbId: undefined,
      });

      const formData = requestSpy.mock.calls[0][2].body;
      expect(formData.get("type")).toBe("agent");
      expect(formData.get("component_id")).toBe("agent-123");
      expect(formData.get("name")).toBeNull();
      expect(formData.get("user_id")).toBeNull();
      expect(formData.get("db_id")).toBeNull();
    });
  });

  describe("rename()", () => {
    it("sends POST /sessions/{id}/rename with FormData", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.rename("session-123", "Updated Name");

      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/sessions/session-123/rename",
        { body: expect.any(FormData) },
      );

      const formData = requestSpy.mock.calls[0][2].body;
      expect(formData.get("name")).toBe("Updated Name");
    });

    it("FormData contains name field", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.rename("session-456", "New Session Name");

      const formData = requestSpy.mock.calls[0][2].body;
      expect(formData.get("name")).toBe("New Session Name");
    });

    it("URL-encodes sessionId", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.rename("session/special", "Name");

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/sessions/session%2Fspecial/rename",
        expect.any(Object),
      );
    });
  });

  describe("delete()", () => {
    it("sends DELETE /sessions/{id}", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("session-123");

      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/sessions/session-123");
    });

    it("adds db_id query param when provided", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("session-123", { dbId: "db-456" });

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/sessions/session-123?db_id=db-456",
      );
    });

    it("does not add query params when dbId is undefined", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("session-123", { dbId: undefined });

      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/sessions/session-123");
    });

    it("URL-encodes sessionId", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("session@special");

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/sessions/session%40special",
      );
    });
  });

  describe("getRuns()", () => {
    it("calls GET /sessions/{id}/runs", async () => {
      const mockRuns = [
        { run_id: "run-1", status: "completed" },
        { run_id: "run-2", status: "running" },
      ];
      requestSpy.mockResolvedValueOnce(mockRuns);

      const result = await resource.getRuns("session-123");

      expect(result).toEqual(mockRuns);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions/session-123/runs",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes sessionId", async () => {
      requestSpy.mockResolvedValueOnce([]);

      await resource.getRuns("session/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions/session%2Fspecial/runs",
      );
    });

    it("returns array", async () => {
      const mockRuns = [{ run_id: "run-1" }];
      requestSpy.mockResolvedValueOnce(mockRuns);

      const result = await resource.getRuns("session-123");

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockRuns);
    });

    it("handles empty array response", async () => {
      requestSpy.mockResolvedValueOnce([]);

      const result = await resource.getRuns("session-123");

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
