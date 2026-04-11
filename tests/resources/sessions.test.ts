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

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions?type=agent&page=1",
      );
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

    it("adds db_id query param when dbId provided", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ dbId: "mydb" });

      const callPath = requestSpy.mock.calls[0][1];
      expect(callPath).toContain("db_id=mydb");
    });

    it("does not include db_id when dbId not provided", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list();

      expect(requestSpy).toHaveBeenCalledWith("GET", "/sessions");
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

      expect(requestSpy).toHaveBeenCalledWith("GET", "/sessions/session%40123");
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
    it("sends POST /sessions with JSON body (not FormData)", async () => {
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
        body: { type: "agent", component_id: "agent-123" },
      });
    });

    it("includes type and component_id in body object", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "s1" });

      await resource.create({
        type: "team",
        componentId: "team-456",
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/sessions", {
        body: { type: "team", component_id: "team-456" },
      });
    });

    it("includes optional name when provided", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "s1" });

      await resource.create({
        type: "workflow",
        componentId: "workflow-789",
        name: "My Workflow Session",
      });

      const callBody = requestSpy.mock.calls[0][2].body;
      expect(callBody.name).toBe("My Workflow Session");
      expect(callBody.type).toBe("workflow");
      expect(callBody.component_id).toBe("workflow-789");
    });

    it("includes optional user_id when provided", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "s1" });

      await resource.create({
        type: "agent",
        componentId: "agent-123",
        userId: "user-999",
      });

      const callBody = requestSpy.mock.calls[0][2].body;
      expect(callBody.user_id).toBe("user-999");
    });

    it("includes optional db_id when provided", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "s1" });

      await resource.create({
        type: "agent",
        componentId: "agent-123",
        dbId: "db-888",
      });

      const callBody = requestSpy.mock.calls[0][2].body;
      expect(callBody.db_id).toBe("db-888");
    });

    it("includes name, user_id, db_id in body when all provided", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "s1" });

      await resource.create({
        type: "agent",
        componentId: "agent-123",
        name: "Test Session",
        userId: "user-999",
        dbId: "db-888",
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/sessions", {
        body: {
          type: "agent",
          component_id: "agent-123",
          name: "Test Session",
          user_id: "user-999",
          db_id: "db-888",
        },
      });
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

      const callBody = requestSpy.mock.calls[0][2].body;
      expect(callBody.type).toBe("agent");
      expect(callBody.component_id).toBe("agent-123");
      expect(callBody).not.toHaveProperty("name");
      expect(callBody).not.toHaveProperty("user_id");
      expect(callBody).not.toHaveProperty("db_id");
    });
  });

  describe("rename()", () => {
    it("sends POST /sessions/{id}/rename with JSON body (not FormData)", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.rename("session-123", "Updated Name");

      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/sessions/session-123/rename",
        { body: { name: "Updated Name" } },
      );
    });

    it("body contains name field as plain object", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.rename("session-456", "New Session Name");

      const callBody = requestSpy.mock.calls[0][2].body;
      expect(callBody).toEqual({ name: "New Session Name" });
    });

    it("URL-encodes sessionId", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.rename("session/special", "Name");

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/sessions/session%2Fspecial/rename",
        { body: { name: "Name" } },
      );
    });
  });

  describe("delete()", () => {
    it("sends DELETE /sessions/{id}", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("session-123");

      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/sessions/session-123",
      );
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

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/sessions/session-123",
      );
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

  describe("update()", () => {
    it("sends PATCH /sessions/{id} with plain object body (no pre-stringify, no explicit headers)", async () => {
      const mockSession = {
        session_id: "session-123",
        session_name: "Updated",
      };
      requestSpy.mockResolvedValueOnce(mockSession);

      const result = await resource.update("session-123", {
        sessionName: "Updated",
      });

      expect(result).toEqual(mockSession);
      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/sessions/session-123",
        {
          body: { session_name: "Updated" },
        },
      );
    });

    it("includes query params when provided", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "session-123" });

      await resource.update("session-123", {
        type: "agent",
        userId: "user-1",
        dbId: "db-1",
        table: "custom_table",
        sessionName: "New Name",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/sessions/session-123?type=agent&user_id=user-1&db_id=db-1&table=custom_table",
        {
          body: { session_name: "New Name" },
        },
      );
    });

    it("supports partial update with metadata and state", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "session-123" });

      await resource.update("session-123", {
        sessionState: { step: 2 },
        metadata: { key: "value" },
        summary: "A summary",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/sessions/session-123",
        {
          body: {
            session_state: { step: 2 },
            metadata: { key: "value" },
            summary: "A summary",
          },
        },
      );
    });

    it("URL-encodes sessionId", async () => {
      requestSpy.mockResolvedValueOnce({ session_id: "session/special" });

      await resource.update("session/special", { sessionName: "test" });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/sessions/session%2Fspecial",
        expect.any(Object),
      );
    });

    it("propagates errors", async () => {
      requestSpy.mockRejectedValueOnce(new Error("fail"));

      await expect(
        resource.update("session-123", { sessionName: "x" }),
      ).rejects.toThrow("fail");
    });
  });

  describe("deleteAll()", () => {
    it("sends DELETE /sessions with plain object body (no pre-stringify, no explicit headers)", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.deleteAll({
        sessionIds: ["s-1", "s-2"],
        sessionTypes: ["agent", "team"],
      });

      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/sessions", {
        body: {
          session_ids: ["s-1", "s-2"],
          session_types: ["agent", "team"],
        },
      });
    });

    it("includes query params when provided", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.deleteAll({
        sessionIds: ["s-1"],
        sessionTypes: ["agent"],
        userId: "user-1",
        dbId: "db-1",
        table: "custom_table",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/sessions?user_id=user-1&db_id=db-1&table=custom_table",
        {
          body: {
            session_ids: ["s-1"],
            session_types: ["agent"],
          },
        },
      );
    });

    it("propagates errors", async () => {
      requestSpy.mockRejectedValueOnce(new Error("fail"));

      await expect(
        resource.deleteAll({
          sessionIds: ["s-1"],
          sessionTypes: ["agent"],
        }),
      ).rejects.toThrow("fail");
    });
  });

  describe("getRun()", () => {
    it("calls GET /sessions/{sessionId}/runs/{runId}", async () => {
      const mockRun = { run_id: "run-1", status: "completed" };
      requestSpy.mockResolvedValueOnce(mockRun);

      const result = await resource.getRun("session-123", "run-1");

      expect(result).toEqual(mockRun);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions/session-123/runs/run-1",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes sessionId and runId", async () => {
      requestSpy.mockResolvedValueOnce({});

      await resource.getRun("session/special", "run/123");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/sessions/session%2Fspecial/runs/run%2F123",
      );
    });

    it("propagates errors", async () => {
      requestSpy.mockRejectedValueOnce(new Error("fail"));

      await expect(
        resource.getRun("session-123", "run-1"),
      ).rejects.toThrow("fail");
    });
  });
});
