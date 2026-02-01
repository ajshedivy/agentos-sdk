import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { KnowledgeResource } from "../../src/resources/knowledge";

describe("KnowledgeResource", () => {
  let resource: KnowledgeResource;
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

    resource = new KnowledgeResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getConfig()", () => {
    it("retrieves knowledge configuration", async () => {
      const configResponse = {
        readers: { pdf: { id: "pdf", name: "PDFReader" } },
        chunkers: ["RecursiveChunker"],
      };
      requestSpy.mockResolvedValueOnce(configResponse);

      const result = await resource.getConfig();

      expect(result).toEqual(configResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/knowledge/config");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("includes db_id query param when provided", async () => {
      requestSpy.mockResolvedValueOnce({});

      await resource.getConfig("db-123");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/knowledge/config?db_id=db-123",
      );
    });
  });

  describe("list()", () => {
    it("lists content with default parameters", async () => {
      const listResponse = {
        data: [{ id: "content-1", name: "doc.pdf" }],
        meta: { page: 1, limit: 20, total_pages: 1, total_count: 1 },
      };
      requestSpy.mockResolvedValueOnce(listResponse);

      const result = await resource.list();

      expect(result.data).toHaveLength(1);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/knowledge/content");
    });

    it("includes pagination and sorting params", async () => {
      requestSpy.mockResolvedValueOnce({ data: [], meta: {} });

      await resource.list({
        limit: 50,
        page: 2,
        sortBy: "name",
        sortOrder: "asc",
        dbId: "db-123",
      });

      const callPath = requestSpy.mock.calls[0][1];
      expect(callPath).toContain("limit=50");
      expect(callPath).toContain("page=2");
      expect(callPath).toContain("sort_by=name");
      expect(callPath).toContain("sort_order=asc");
      expect(callPath).toContain("db_id=db-123");
    });
  });

  describe("upload()", () => {
    it("uploads file with FormData", async () => {
      requestSpy.mockResolvedValueOnce({
        id: "content-123",
        status: "processing",
      });

      const buffer = Buffer.from("file content");
      await resource.upload({
        file: buffer,
        name: "document.txt",
        description: "Test document",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/knowledge/content",
        expect.objectContaining({
          body: expect.any(FormData),
        }),
      );

      const formData = requestSpy.mock.calls[0][2].body as FormData;
      expect(formData.get("name")).toBe("document.txt");
      expect(formData.get("description")).toBe("Test document");
    });

    it("uploads URL content", async () => {
      requestSpy.mockResolvedValueOnce({ id: "content-456" });

      await resource.upload({
        url: "https://example.com/document.pdf",
        name: "Remote Doc",
      });

      const formData = requestSpy.mock.calls[0][2].body as FormData;
      expect(formData.get("url")).toBe("https://example.com/document.pdf");
    });

    it("uploads text content", async () => {
      requestSpy.mockResolvedValueOnce({ id: "content-789" });

      await resource.upload({
        textContent: "This is my knowledge content",
        name: "Text Note",
      });

      const formData = requestSpy.mock.calls[0][2].body as FormData;
      expect(formData.get("text_content")).toBe("This is my knowledge content");
    });

    it("includes metadata as JSON string", async () => {
      requestSpy.mockResolvedValueOnce({ id: "content-1" });

      await resource.upload({
        textContent: "content",
        metadata: { category: "docs", priority: 1 },
      });

      const formData = requestSpy.mock.calls[0][2].body as FormData;
      expect(formData.get("metadata")).toBe('{"category":"docs","priority":1}');
    });

    it("includes chunker settings", async () => {
      requestSpy.mockResolvedValueOnce({ id: "content-1" });

      await resource.upload({
        textContent: "content",
        chunker: "SemanticChunker",
        chunkSize: 500,
        chunkOverlap: 50,
      });

      const formData = requestSpy.mock.calls[0][2].body as FormData;
      expect(formData.get("chunker")).toBe("SemanticChunker");
      expect(formData.get("chunk_size")).toBe("500");
      expect(formData.get("chunk_overlap")).toBe("50");
    });

    it("includes dbId as query param", async () => {
      requestSpy.mockResolvedValueOnce({ id: "content-1" });

      await resource.upload({
        textContent: "content",
        dbId: "db-123",
      });

      const callPath = requestSpy.mock.calls[0][1];
      expect(callPath).toContain("db_id=db-123");
    });
  });

  describe("get()", () => {
    it("retrieves content by ID", async () => {
      const mockContent = { id: "content-123", name: "doc.pdf" };
      requestSpy.mockResolvedValueOnce(mockContent);

      const result = await resource.get("content-123");

      expect(result).toEqual(mockContent);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/knowledge/content/content-123",
      );
    });

    it("includes db_id query param when provided", async () => {
      requestSpy.mockResolvedValueOnce({});

      await resource.get("content-123", "db-456");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/knowledge/content/content-123?db_id=db-456",
      );
    });
  });

  describe("getStatus()", () => {
    it("retrieves content processing status", async () => {
      const statusResponse = { status: "completed", progress: 100 };
      requestSpy.mockResolvedValueOnce(statusResponse);

      const result = await resource.getStatus("content-123");

      expect(result).toEqual(statusResponse);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/knowledge/content/content-123/status",
      );
    });

    it("includes db_id query param when provided", async () => {
      requestSpy.mockResolvedValueOnce({ status: "processing" });

      await resource.getStatus("content-123", "db-456");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/knowledge/content/content-123/status?db_id=db-456",
      );
    });
  });

  describe("update()", () => {
    it("updates content properties", async () => {
      requestSpy.mockResolvedValueOnce({
        id: "content-123",
        name: "Updated Name",
      });

      await resource.update("content-123", {
        name: "Updated Name",
        description: "New description",
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/knowledge/content/content-123",
        expect.objectContaining({
          body: expect.any(FormData),
        }),
      );

      const formData = requestSpy.mock.calls[0][2].body as FormData;
      expect(formData.get("name")).toBe("Updated Name");
      expect(formData.get("description")).toBe("New description");
    });

    it("includes metadata as JSON string", async () => {
      requestSpy.mockResolvedValueOnce({});

      await resource.update("content-123", {
        metadata: { category: "updated" },
      });

      const formData = requestSpy.mock.calls[0][2].body as FormData;
      expect(formData.get("metadata")).toBe('{"category":"updated"}');
    });
  });

  describe("delete()", () => {
    it("deletes content by ID", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("content-123");

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/knowledge/content/content-123",
      );
    });

    it("includes db_id query param when provided", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("content-123", "db-456");

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/knowledge/content/content-123?db_id=db-456",
      );
    });
  });

  describe("deleteAll()", () => {
    it("deletes all content", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.deleteAll();

      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/knowledge/content");
    });

    it("scopes deletion to database ID", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.deleteAll("db-123");

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/knowledge/content?db_id=db-123",
      );
    });
  });

  describe("search()", () => {
    it("searches knowledge base with query", async () => {
      const searchResponse = {
        data: [
          { id: "doc-1", content: "Result content", reranking_score: 0.95 },
        ],
        meta: { page: 1, limit: 20, total_pages: 1, total_count: 1 },
      };
      requestSpy.mockResolvedValueOnce(searchResponse);

      const result = await resource.search("JavaScript best practices");

      expect(result).toEqual(searchResponse);
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/knowledge/search",
        expect.objectContaining({
          body: expect.any(String),
          headers: { "Content-Type": "application/json" },
        }),
      );

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.query).toBe("JavaScript best practices");
    });

    it("includes search options", async () => {
      requestSpy.mockResolvedValueOnce({ data: [], meta: {} });

      await resource.search("query", {
        dbId: "db-123",
        searchType: "hybrid",
        maxResults: 50,
        filters: { category: "docs" },
        page: 2,
        limit: 25,
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.db_id).toBe("db-123");
      expect(body.search_type).toBe("hybrid");
      expect(body.max_results).toBe(50);
      expect(body.filters).toEqual({ category: "docs" });
      expect(body.meta).toEqual({ page: 2, limit: 25 });
    });

    it("includes vectorDbIds array", async () => {
      requestSpy.mockResolvedValueOnce({ data: [], meta: {} });

      await resource.search("test", {
        vectorDbIds: ["db-1", "db-2"],
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.vector_db_ids).toEqual(["db-1", "db-2"]);
    });
  });
});
