import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { MemoriesResource } from "../../src/resources/memories";

describe("MemoriesResource", () => {
  let resource: MemoriesResource;
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

    resource = new MemoriesResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /memories with no params when options empty", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds user_id query param", async () => {
      const mockResponse = {
        data: [{ memory_id: "mem-1", memory: "test" }],
        meta: { page: 1, limit: 50, total: 1 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ userId: "user-123" });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories?user_id=user-123");
    });

    it("adds team_id query param", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ teamId: "team-456" });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories?team_id=team-456");
    });

    it("adds agent_id query param", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ agentId: "agent-789" });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories?agent_id=agent-789");
    });

    it("adds searchContent query param", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ searchContent: "preferences" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/memories?search_content=preferences",
      );
    });

    it("adds pagination params", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 2, limit: 10, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ page: 2, limit: 10 });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories?limit=10&page=2");
    });

    it("adds sortBy and sortOrder params", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ sortBy: "created_at", sortOrder: "desc" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/memories?sort_by=created_at&sort_order=desc",
      );
    });

    it("adds db_id and table params", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ dbId: "db-1", table: "custom_memories" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/memories?db_id=db-1&table=custom_memories",
      );
    });

    it("adds topics array as multiple params", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ topics: ["preferences", "technical"] });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/memories?topics=preferences&topics=technical",
      );
    });

    it("only includes defined params", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ userId: "user-123", teamId: undefined });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories?user_id=user-123");
    });

    it("handles empty topics array", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({ topics: [] });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories");
    });

    it("handles empty array response", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result.data).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("combines multiple filter params", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 20, total: 0 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({
        userId: "user-123",
        agentId: "agent-456",
        limit: 20,
        page: 1,
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/memories?user_id=user-123&agent_id=agent-456&limit=20&page=1",
      );
    });
  });

  describe("get()", () => {
    it("returns memory by ID with correct path", async () => {
      const mockMemory = {
        memory_id: "mem-123",
        memory: "User prefers technical explanations",
        topics: ["preferences"],
      };
      requestSpy.mockResolvedValueOnce(mockMemory);

      const result = await resource.get("mem-123");

      expect(result).toEqual(mockMemory);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories/mem-123");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes memoryId with slash", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem/123" });

      await resource.get("mem/123");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories/mem%2F123");
    });

    it("URL-encodes memoryId with space", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "my memory" });

      await resource.get("my memory");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories/my%20memory");
    });

    it("URL-encodes memoryId with @ symbol", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem@123" });

      await resource.get("mem@123");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories/mem%40123");
    });

    it("adds db_id query param when provided", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.get("mem-123", { dbId: "db-1" });

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories/mem-123?db_id=db-1");
    });

    it("adds table query param when provided", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.get("mem-123", { table: "custom_memories" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/memories/mem-123?table=custom_memories",
      );
    });

    it("adds both db_id and table query params", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.get("mem-123", { dbId: "db-1", table: "custom_memories" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/memories/mem-123?db_id=db-1&table=custom_memories",
      );
    });

    it("works without options parameter", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.get("mem-123");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/memories/mem-123");
    });
  });

  describe("create()", () => {
    it("sends POST /memories with JSON body", async () => {
      const mockMemory = {
        memory_id: "mem-123",
        memory: "User prefers technical explanations",
        topics: ["preferences"],
      };
      requestSpy.mockResolvedValueOnce(mockMemory);

      const result = await resource.create({
        memory: "User prefers technical explanations",
      });

      expect(result).toEqual(mockMemory);
      expect(requestSpy).toHaveBeenCalledWith("POST", "/memories", {
        body: JSON.stringify({ memory: "User prefers technical explanations" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("includes user_id in body when provided", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.create({
        memory: "Test content",
        userId: "user-456",
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/memories", {
        body: JSON.stringify({
          memory: "Test content",
          user_id: "user-456",
        }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("includes topics in body when provided", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.create({
        memory: "Test content",
        topics: ["preferences", "technical"],
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/memories", {
        body: JSON.stringify({
          memory: "Test content",
          topics: ["preferences", "technical"],
        }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("includes user_id and topics in body", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.create({
        memory: "Test content",
        userId: "user-456",
        topics: ["preferences"],
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/memories", {
        body: JSON.stringify({
          memory: "Test content",
          user_id: "user-456",
          topics: ["preferences"],
        }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("adds db_id to query string when provided", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.create({
        memory: "Test content",
        dbId: "db-1",
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/memories?db_id=db-1", {
        body: JSON.stringify({ memory: "Test content" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("adds table to query string when provided", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.create({
        memory: "Test content",
        table: "custom_memories",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/memories?table=custom_memories",
        {
          body: JSON.stringify({ memory: "Test content" }),
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    it("adds both db_id and table to query string", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.create({
        memory: "Test content",
        dbId: "db-1",
        table: "custom_memories",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/memories?db_id=db-1&table=custom_memories",
        {
          body: JSON.stringify({ memory: "Test content" }),
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    it("does not add query params when db_id/table undefined", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.create({
        memory: "Test content",
        dbId: undefined,
        table: undefined,
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/memories", {
        body: JSON.stringify({ memory: "Test content" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("does not include topics when empty array", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.create({
        memory: "Test content",
        topics: [],
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/memories", {
        body: JSON.stringify({ memory: "Test content" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("body is a string (JSON.stringify), not FormData", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.create({ memory: "Test" });

      const callArgs = requestSpy.mock.calls[0];
      expect(typeof callArgs[2].body).toBe("string");
      expect(callArgs[2].body).not.toBeInstanceOf(FormData);
    });
  });

  describe("update()", () => {
    it("sends PATCH /memories/{id} with JSON body", async () => {
      const mockMemory = {
        memory_id: "mem-123",
        memory: "Updated content",
      };
      requestSpy.mockResolvedValueOnce(mockMemory);

      const result = await resource.update("mem-123", {
        memory: "Updated content",
      });

      expect(result).toEqual(mockMemory);
      expect(requestSpy).toHaveBeenCalledWith("PATCH", "/memories/mem-123", {
        body: JSON.stringify({ memory: "Updated content" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("can update only topics", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.update("mem-123", {
        topics: ["updated", "new"],
      });

      expect(requestSpy).toHaveBeenCalledWith("PATCH", "/memories/mem-123", {
        body: JSON.stringify({ topics: ["updated", "new"] }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("can update both memory and topics", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.update("mem-123", {
        memory: "Updated content",
        topics: ["updated"],
      });

      expect(requestSpy).toHaveBeenCalledWith("PATCH", "/memories/mem-123", {
        body: JSON.stringify({
          memory: "Updated content",
          topics: ["updated"],
        }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("URL-encodes memoryId", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem/123" });

      await resource.update("mem/123", { memory: "Updated" });

      expect(requestSpy).toHaveBeenCalledWith("PATCH", "/memories/mem%2F123", {
        body: JSON.stringify({ memory: "Updated" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("adds db_id to query string when provided", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.update("mem-123", {
        memory: "Updated",
        dbId: "db-1",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/memories/mem-123?db_id=db-1",
        {
          body: JSON.stringify({ memory: "Updated" }),
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    it("adds table to query string when provided", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.update("mem-123", {
        memory: "Updated",
        table: "custom_memories",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/memories/mem-123?table=custom_memories",
        {
          body: JSON.stringify({ memory: "Updated" }),
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    it("adds both db_id and table to query string", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.update("mem-123", {
        memory: "Updated",
        dbId: "db-1",
        table: "custom_memories",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/memories/mem-123?db_id=db-1&table=custom_memories",
        {
          body: JSON.stringify({ memory: "Updated" }),
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    it("body is a string (JSON.stringify), not FormData", async () => {
      requestSpy.mockResolvedValueOnce({ memory_id: "mem-123" });

      await resource.update("mem-123", { memory: "Test" });

      const callArgs = requestSpy.mock.calls[0];
      expect(typeof callArgs[2].body).toBe("string");
      expect(callArgs[2].body).not.toBeInstanceOf(FormData);
    });
  });

  describe("delete()", () => {
    it("sends DELETE /memories/{id}", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("mem-123");

      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/memories/mem-123");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes memoryId", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("mem/123");

      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/memories/mem%2F123");
    });

    it("adds db_id query param when provided", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("mem-123", { dbId: "db-1" });

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/memories/mem-123?db_id=db-1",
      );
    });

    it("adds table query param when provided", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("mem-123", { table: "custom_memories" });

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/memories/mem-123?table=custom_memories",
      );
    });

    it("adds both db_id and table query params", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("mem-123", {
        dbId: "db-1",
        table: "custom_memories",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/memories/mem-123?db_id=db-1&table=custom_memories",
      );
    });

    it("works without options parameter", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("mem-123");

      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/memories/mem-123");
    });
  });
});
