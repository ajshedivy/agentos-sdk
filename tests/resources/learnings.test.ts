import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { LearningsResource } from "../../src/resources/learnings";

const JSON_HEADERS = { headers: { "Content-Type": "application/json" } };

const emptyPage = { data: [], meta: { page: 1, limit: 50, total_count: 0 } };

const sampleLearning = {
  learning_id: "lrn-123",
  learning_type: "learned_knowledge",
  namespace: "global",
  content: {
    title: "Prefer QSYS2 services",
    learning: "Use QSYS2.OBJECT_STATISTICS instead of DSPOBJD output files",
    context: "IBM i object queries",
    tags: ["ibmi", "sql"],
  },
  created_at: 1700000000,
  updated_at: 1700000000,
};

describe("LearningsResource", () => {
  let resource: LearningsResource;
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

    resource = new LearningsResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /learnings with no params when options empty", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      const result = await resource.list();

      expect(result).toEqual(emptyPage);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/learnings");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds learning_type query param", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      await resource.list({ learningType: "user_profile" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings?learning_type=user_profile",
      );
    });

    it("adds user_id query param", async () => {
      requestSpy.mockResolvedValueOnce({
        ...emptyPage,
        data: [sampleLearning],
      });

      await resource.list({ userId: "user-123" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings?user_id=user-123",
      );
    });

    it("adds agent_id, team_id and session_id query params", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      await resource.list({
        agentId: "agent-1",
        teamId: "team-2",
        sessionId: "sess-3",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings?agent_id=agent-1&team_id=team-2&session_id=sess-3",
      );
    });

    it("adds namespace, entity_id and entity_type query params", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      await resource.list({
        namespace: "global",
        entityId: "acme",
        entityType: "company",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings?namespace=global&entity_id=acme&entity_type=company",
      );
    });

    it("adds pagination params", async () => {
      requestSpy.mockResolvedValueOnce({
        ...emptyPage,
        meta: { page: 2, limit: 10, total_count: 0 },
      });

      await resource.list({ page: 2, limit: 10 });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings?limit=10&page=2",
      );
    });

    it("adds sortBy and sortOrder params", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      await resource.list({ sortBy: "created_at", sortOrder: "desc" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings?sort_by=created_at&sort_order=desc",
      );
    });

    it("adds db_id and table params", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      await resource.list({ dbId: "db-1", table: "custom_learnings" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings?db_id=db-1&table=custom_learnings",
      );
    });

    it("only includes defined params", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      await resource.list({ userId: "user-123", teamId: undefined });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings?user_id=user-123",
      );
    });

    it("URL-encodes query values", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      await resource.list({ userId: "user@example.com" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings?user_id=user%40example.com",
      );
    });

    it("handles empty array response", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      const result = await resource.list();

      expect(result.data).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("combines multiple filter params in a stable order", async () => {
      requestSpy.mockResolvedValueOnce({
        ...emptyPage,
        meta: { page: 1, limit: 20, total_count: 0 },
      });

      await resource.list({
        learningType: "learned_knowledge",
        userId: "user-123",
        agentId: "agent-456",
        limit: 20,
        page: 1,
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings?learning_type=learned_knowledge&user_id=user-123&agent_id=agent-456&limit=20&page=1",
      );
    });
  });

  describe("get()", () => {
    it("returns learning by ID with correct path", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      const result = await resource.get("lrn-123");

      expect(result).toEqual(sampleLearning);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/learnings/lrn-123");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes learningId with slash", async () => {
      requestSpy.mockResolvedValueOnce({ learning_id: "lrn/123" });

      await resource.get("lrn/123");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/learnings/lrn%2F123");
    });

    it("URL-encodes learningId with space", async () => {
      requestSpy.mockResolvedValueOnce({ learning_id: "my learning" });

      await resource.get("my learning");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings/my%20learning",
      );
    });

    it("URL-encodes learningId with @ symbol", async () => {
      requestSpy.mockResolvedValueOnce({ learning_id: "lrn@123" });

      await resource.get("lrn@123");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/learnings/lrn%40123");
    });

    it("adds db_id query param when provided", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.get("lrn-123", { dbId: "db-1" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings/lrn-123?db_id=db-1",
      );
    });

    it("adds table query param when provided", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.get("lrn-123", { table: "custom_learnings" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings/lrn-123?table=custom_learnings",
      );
    });

    it("adds both db_id and table query params", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.get("lrn-123", { dbId: "db-1", table: "custom_learnings" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings/lrn-123?db_id=db-1&table=custom_learnings",
      );
    });
  });

  describe("create()", () => {
    it("sends POST /learnings with learning_type and content", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      const result = await resource.create({
        learningType: "learned_knowledge",
        content: sampleLearning.content,
      });

      expect(result).toEqual(sampleLearning);
      expect(requestSpy).toHaveBeenCalledWith("POST", "/learnings", {
        body: JSON.stringify({
          learning_type: "learned_knowledge",
          content: sampleLearning.content,
        }),
        ...JSON_HEADERS,
      });
    });

    it("includes namespace and identity fields in body when provided", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.create({
        learningType: "entity_memory",
        content: { summary: "Acme is a customer" },
        namespace: "global",
        userId: "user-1",
        agentId: "agent-2",
        teamId: "team-3",
        sessionId: "sess-4",
        entityId: "acme",
        entityType: "company",
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/learnings", {
        body: JSON.stringify({
          learning_type: "entity_memory",
          content: { summary: "Acme is a customer" },
          namespace: "global",
          user_id: "user-1",
          agent_id: "agent-2",
          team_id: "team-3",
          session_id: "sess-4",
          entity_id: "acme",
          entity_type: "company",
        }),
        ...JSON_HEADERS,
      });
    });

    it("includes metadata in body when provided", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.create({
        learningType: "learned_knowledge",
        content: { title: "t", learning: "l" },
        metadata: { source: "sdk-test" },
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/learnings", {
        body: JSON.stringify({
          learning_type: "learned_knowledge",
          content: { title: "t", learning: "l" },
          metadata: { source: "sdk-test" },
        }),
        ...JSON_HEADERS,
      });
    });

    it("passes metadata: null through to the body", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.create({
        learningType: "learned_knowledge",
        content: { title: "t" },
        metadata: null,
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/learnings", {
        body: JSON.stringify({
          learning_type: "learned_knowledge",
          content: { title: "t" },
          metadata: null,
        }),
        ...JSON_HEADERS,
      });
    });

    it("adds db_id to query string when provided", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.create({
        learningType: "learned_knowledge",
        content: { title: "t" },
        dbId: "db-1",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/learnings?db_id=db-1",
        {
          body: JSON.stringify({
            learning_type: "learned_knowledge",
            content: { title: "t" },
          }),
          ...JSON_HEADERS,
        },
      );
    });

    it("adds table to query string when provided", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.create({
        learningType: "learned_knowledge",
        content: { title: "t" },
        table: "custom_learnings",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/learnings?table=custom_learnings",
        {
          body: JSON.stringify({
            learning_type: "learned_knowledge",
            content: { title: "t" },
          }),
          ...JSON_HEADERS,
        },
      );
    });

    it("adds both db_id and table to query string", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.create({
        learningType: "learned_knowledge",
        content: { title: "t" },
        dbId: "db-1",
        table: "custom_learnings",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/learnings?db_id=db-1&table=custom_learnings",
        {
          body: JSON.stringify({
            learning_type: "learned_knowledge",
            content: { title: "t" },
          }),
          ...JSON_HEADERS,
        },
      );
    });

    it("does not add query params when db_id/table undefined", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.create({
        learningType: "learned_knowledge",
        content: { title: "t" },
        dbId: undefined,
        table: undefined,
      });

      expect(requestSpy).toHaveBeenCalledWith("POST", "/learnings", {
        body: JSON.stringify({
          learning_type: "learned_knowledge",
          content: { title: "t" },
        }),
        ...JSON_HEADERS,
      });
    });

    it("body is a string (JSON.stringify), not FormData", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.create({
        learningType: "learned_knowledge",
        content: { title: "t" },
      });

      const callArgs = requestSpy.mock.calls[0];
      expect(typeof callArgs[2].body).toBe("string");
      expect(callArgs[2].body).not.toBeInstanceOf(FormData);
    });
  });

  describe("update()", () => {
    it("sends PATCH /learnings/{id} with content", async () => {
      const updated = {
        ...sampleLearning,
        content: { title: "Updated" },
      };
      requestSpy.mockResolvedValueOnce(updated);

      const result = await resource.update("lrn-123", {
        content: { title: "Updated" },
      });

      expect(result).toEqual(updated);
      expect(requestSpy).toHaveBeenCalledWith("PATCH", "/learnings/lrn-123", {
        body: JSON.stringify({ content: { title: "Updated" } }),
        ...JSON_HEADERS,
      });
    });

    it("can update only metadata", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.update("lrn-123", {
        metadata: { reviewed: true },
      });

      expect(requestSpy).toHaveBeenCalledWith("PATCH", "/learnings/lrn-123", {
        body: JSON.stringify({ metadata: { reviewed: true } }),
        ...JSON_HEADERS,
      });
    });

    it("can update both content and metadata", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.update("lrn-123", {
        content: { title: "Updated" },
        metadata: { reviewed: true },
      });

      expect(requestSpy).toHaveBeenCalledWith("PATCH", "/learnings/lrn-123", {
        body: JSON.stringify({
          content: { title: "Updated" },
          metadata: { reviewed: true },
        }),
        ...JSON_HEADERS,
      });
    });

    it("sends an empty body when no fields provided", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.update("lrn-123", {});

      expect(requestSpy).toHaveBeenCalledWith("PATCH", "/learnings/lrn-123", {
        body: JSON.stringify({}),
        ...JSON_HEADERS,
      });
    });

    it("URL-encodes learningId", async () => {
      requestSpy.mockResolvedValueOnce({ learning_id: "lrn/123" });

      await resource.update("lrn/123", { content: { title: "Updated" } });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/learnings/lrn%2F123",
        {
          body: JSON.stringify({ content: { title: "Updated" } }),
          ...JSON_HEADERS,
        },
      );
    });

    it("adds db_id and table to query string when provided", async () => {
      requestSpy.mockResolvedValueOnce(sampleLearning);

      await resource.update("lrn-123", {
        content: { title: "Updated" },
        dbId: "db-1",
        table: "custom_learnings",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/learnings/lrn-123?db_id=db-1&table=custom_learnings",
        {
          body: JSON.stringify({ content: { title: "Updated" } }),
          ...JSON_HEADERS,
        },
      );
    });
  });

  describe("delete()", () => {
    it("sends DELETE /learnings/{id} and resolves void", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      const result = await resource.delete("lrn-123");

      expect(result).toBeUndefined();
      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/learnings/lrn-123");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes learningId", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("lrn/123");

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/learnings/lrn%2F123",
      );
    });

    it("adds db_id and table to query string when provided", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("lrn-123", {
        dbId: "db-1",
        table: "custom_learnings",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/learnings/lrn-123?db_id=db-1&table=custom_learnings",
      );
    });

    it("propagates errors from the client", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.delete("missing")).rejects.toThrow("Not found");
    });
  });

  describe("listUsers()", () => {
    it("calls GET /learnings/users with no params when options empty", async () => {
      const mockResponse = {
        data: [{ user_id: "user-1", last_learning_updated_at: 1700000000 }],
        meta: { page: 1, limit: 50, total_count: 1 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.listUsers();

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/learnings/users");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds learning_type and user_id query params", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      await resource.listUsers({
        learningType: "user_profile",
        userId: "user-1",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings/users?learning_type=user_profile&user_id=user-1",
      );
    });

    it("adds pagination and sort params", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      await resource.listUsers({
        limit: 10,
        page: 2,
        sortBy: "user_id",
        sortOrder: "asc",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings/users?limit=10&page=2&sort_by=user_id&sort_order=asc",
      );
    });

    it("adds db_id and table params", async () => {
      requestSpy.mockResolvedValueOnce(emptyPage);

      await resource.listUsers({ dbId: "db-1", table: "custom_learnings" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/learnings/users?db_id=db-1&table=custom_learnings",
      );
    });
  });

  describe("deleteUser()", () => {
    it("sends DELETE /learnings/users/{user_id} and resolves void", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      const result = await resource.deleteUser("user-1");

      expect(result).toBeUndefined();
      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/learnings/users/user-1",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes userId", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.deleteUser("user@example.com");

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/learnings/users/user%40example.com",
      );
    });

    it("adds learning_type query param when provided", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.deleteUser("user-1", { learningType: "user_memory" });

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/learnings/users/user-1?learning_type=user_memory",
      );
    });

    it("adds db_id and table query params when provided", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.deleteUser("user-1", {
        learningType: "user_profile",
        dbId: "db-1",
        table: "custom_learnings",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/learnings/users/user-1?learning_type=user_profile&db_id=db-1&table=custom_learnings",
      );
    });

    it("propagates errors from the client", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Forbidden"));

      await expect(resource.deleteUser("other-user")).rejects.toThrow(
        "Forbidden",
      );
    });
  });
});
