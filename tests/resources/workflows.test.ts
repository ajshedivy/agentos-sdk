import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { WorkflowsResource } from "../../src/resources/workflows";
import { AgentStream } from "../../src/streaming";

describe("WorkflowsResource", () => {
  let resource: WorkflowsResource;
  let mockClient: AgentOSClient;
  let requestSpy: ReturnType<typeof vi.fn>;
  let requestStreamSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create a real client, then spy on its request method
    mockClient = new AgentOSClient({
      baseUrl: "https://api.example.com",
      apiKey: "test-key",
    });
    requestSpy = vi.fn();
    requestStreamSpy = vi.fn();
    // Mock the request methods
    // biome-ignore lint/suspicious/noExplicitAny: Need to mock public request method for testing
    (mockClient as any).request = requestSpy;
    // biome-ignore lint/suspicious/noExplicitAny: Need to mock requestStream method for testing
    (mockClient as any).requestStream = requestStreamSpy;

    resource = new WorkflowsResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("returns array of workflows", async () => {
      const mockWorkflows = [
        { id: "workflow-1", name: "Workflow One" },
        { id: "workflow-2", name: "Workflow Two" },
      ];
      requestSpy.mockResolvedValueOnce(mockWorkflows);

      const result = await resource.list();

      expect(result).toEqual(mockWorkflows);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/workflows");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(resource.list()).rejects.toThrow("Unauthorized");
    });

    it("returns empty array when no workflows exist", async () => {
      requestSpy.mockResolvedValueOnce([]);

      const result = await resource.list();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("get()", () => {
    it("returns workflow by ID", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Workflow One",
        model: { name: "gpt-4" },
      };
      requestSpy.mockResolvedValueOnce(mockWorkflow);

      const result = await resource.get("workflow-1");

      expect(result).toEqual(mockWorkflow);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/workflows/workflow-1");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes workflow ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "workflow/special" });

      await resource.get("workflow/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/workflows/workflow%2Fspecial",
      );
    });

    it("URL-encodes spaces in workflow ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "my workflow" });

      await resource.get("my workflow");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/workflows/my%20workflow",
      );
    });

    it("URL-encodes special characters in workflow ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "workflow@123" });

      await resource.get("workflow@123");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/workflows/workflow%40123",
      );
    });

    it("propagates NotFoundError from client", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.get("nonexistent")).rejects.toThrow("Not found");
    });

    it("handles empty string workflow ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "" });

      await resource.get("");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/workflows/");
    });
  });

  describe("run()", () => {
    it("sends message via client.request with FormData", async () => {
      requestSpy.mockResolvedValueOnce({
        run_id: "run-123",
        content: "Hello!",
      });

      const result = await resource.run("workflow-1", { message: "Hi there" });

      expect(result).toEqual({ run_id: "run-123", content: "Hello!" });
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/workflows/workflow-1/runs",
        expect.objectContaining({ body: expect.any(FormData) }),
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);

      // Verify FormData contents
      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe("Hi there");
      expect(formData.get("stream")).toBe("false");
    });

    it("includes session_id when provided", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("workflow-1", {
        message: "Hi",
        sessionId: "session-456",
      });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("session_id")).toBe("session-456");
    });

    it("includes user_id when provided", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("workflow-1", {
        message: "Hi",
        userId: "user-789",
      });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("user_id")).toBe("user-789");
    });

    it("includes session_id and user_id when both provided", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("workflow-1", {
        message: "Hi",
        sessionId: "session-456",
        userId: "user-789",
      });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("session_id")).toBe("session-456");
      expect(formData.get("user_id")).toBe("user-789");
    });

    it("forces stream to false", async () => {
      requestSpy.mockResolvedValueOnce({});

      await resource.run("workflow-1", { message: "Hi" });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("stream")).toBe("false");
    });

    it("forces stream to false even when explicitly set to false", async () => {
      requestSpy.mockResolvedValueOnce({});

      await resource.run("workflow-1", { message: "Hi", stream: false });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("stream")).toBe("false");
    });

    it("URL-encodes workflow ID in run", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("workflow/special", { message: "Hi" });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/workflows/workflow%2Fspecial/runs",
        expect.any(Object),
      );
    });

    it("handles long messages", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });
      const longMessage = "a".repeat(10000);

      await resource.run("workflow-1", { message: longMessage });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe(longMessage);
    });

    it("handles empty message", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("workflow-1", { message: "" });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe("");
    });

    it("handles multiline messages", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });
      const multilineMessage = "Line 1\nLine 2\nLine 3";

      await resource.run("workflow-1", { message: multilineMessage });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe(multilineMessage);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Workflow not found"));

      await expect(
        resource.run("nonexistent", { message: "Hi" }),
      ).rejects.toThrow("Workflow not found");
    });

    it("does not include session_id when not provided", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("workflow-1", { message: "Hi" });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("session_id")).toBeNull();
    });

    it("does not include user_id when not provided", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("workflow-1", { message: "Hi" });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("user_id")).toBeNull();
    });
  });

  describe("runStream()", () => {
    it("returns AgentStream instance", async () => {
      const mockResponse = new Response("data: event", {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.runStream("workflow-1", { message: "Hi" });

      expect(result).toBeInstanceOf(AgentStream);
    });

    it("builds FormData with stream=true", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);

      await resource.runStream("workflow-1", { message: "Hi there" });

      expect(requestStreamSpy).toHaveBeenCalledWith(
        "POST",
        "/workflows/workflow-1/runs",
        expect.objectContaining({
          body: expect.any(FormData),
          signal: expect.any(AbortSignal),
        }),
      );

      const callArgs = requestStreamSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe("Hi there");
      expect(formData.get("stream")).toBe("true");
    });

    it("includes session_id when provided", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);

      await resource.runStream("workflow-1", {
        message: "Hi",
        sessionId: "session-456",
      });

      const callArgs = requestStreamSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("session_id")).toBe("session-456");
    });

    it("includes user_id when provided", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);

      await resource.runStream("workflow-1", {
        message: "Hi",
        userId: "user-789",
      });

      const callArgs = requestStreamSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("user_id")).toBe("user-789");
    });

    it("passes AbortController to stream", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);

      const stream = await resource.runStream("workflow-1", { message: "Hi" });

      expect(stream.controller).toBeInstanceOf(AbortController);
    });
  });

  describe("continue()", () => {
    it("returns AgentStream when streaming (default)", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.continue("workflow-1", "run-123", {
        tools: "[]",
      });

      expect(result).toBeInstanceOf(AgentStream);
      expect(requestStreamSpy).toHaveBeenCalledWith(
        "POST",
        "/workflows/workflow-1/runs/run-123/continue",
        expect.objectContaining({
          body: expect.any(FormData),
          signal: expect.any(AbortSignal),
        }),
      );

      const callArgs = requestStreamSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("stream")).toBe("true");
    });

    it("returns AgentStream when stream=true explicitly", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.continue("workflow-1", "run-123", {
        tools: "[]",
        stream: true,
      });

      expect(result).toBeInstanceOf(AgentStream);
    });

    it("returns result when stream=false", async () => {
      const mockResult = { run_id: "run-123", content: "Done!" };
      requestSpy.mockResolvedValueOnce(mockResult);

      const result = await resource.continue("workflow-1", "run-123", {
        tools: "[]",
        stream: false,
      });

      expect(result).toEqual(mockResult);
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/workflows/workflow-1/runs/run-123/continue",
        expect.objectContaining({ body: expect.any(FormData) }),
      );

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("stream")).toBe("false");
    });

    it("includes tools parameter", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);

      const toolsJSON = '[{"name":"get_weather","result":"sunny"}]';
      await resource.continue("workflow-1", "run-123", { tools: toolsJSON });

      const callArgs = requestStreamSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("tools")).toBe(toolsJSON);
    });

    it("includes session_id when provided", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);

      await resource.continue("workflow-1", "run-123", {
        tools: "[]",
        sessionId: "session-456",
      });

      const callArgs = requestStreamSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("session_id")).toBe("session-456");
    });

    it("includes user_id when provided", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mock.calls[0];

      await resource.continue("workflow-1", "run-123", {
        tools: "[]",
        userId: "user-789",
      });

      const callArgs = requestStreamSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("user_id")).toBe("user-789");
    });

    it("URL-encodes workflow ID and run ID", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);

      await resource.continue("workflow/special", "run/123", { tools: "[]" });

      expect(requestStreamSpy).toHaveBeenCalledWith(
        "POST",
        "/workflows/workflow%2Fspecial/runs/run%2F123/continue",
        expect.any(Object),
      );
    });
  });

  describe("cancel()", () => {
    it("calls cancel endpoint", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.cancel("workflow-1", "run-123");

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/workflows/workflow-1/runs/run-123/cancel",
      );
    });

    it("URL-encodes workflow ID and run ID", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.cancel("workflow/special", "run/123");

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/workflows/workflow%2Fspecial/runs/run%2F123/cancel",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Run not found"));

      await expect(resource.cancel("workflow-1", "run-123")).rejects.toThrow(
        "Run not found",
      );
    });
  });

  describe("run() with media files", () => {
    it("appends images to FormData", async () => {
      requestSpy.mockResolvedValueOnce({ content: "response" });
      const imageBuffer = Buffer.from("fake-image-data");

      await resource.run("workflow-1", {
        message: "Describe this image",
        images: [imageBuffer],
      });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe("Describe this image");
      const images = formData.getAll("images");
      expect(images.length).toBe(1);
    });

    it("appends multiple files of each type", async () => {
      requestSpy.mockResolvedValueOnce({ content: "response" });
      const buffer1 = Buffer.from("image-1");
      const buffer2 = Buffer.from("image-2");
      const audioBuffer = Buffer.from("audio-data");

      await resource.run("workflow-1", {
        message: "Process these",
        images: [buffer1, buffer2],
        audio: [audioBuffer],
      });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.getAll("images").length).toBe(2);
      expect(formData.getAll("audio").length).toBe(1);
    });

    it("handles all media types together", async () => {
      requestSpy.mockResolvedValueOnce({ content: "response" });
      const imageBuffer = Buffer.from("image");
      const audioBuffer = Buffer.from("audio");
      const videoBuffer = Buffer.from("video");
      const fileBuffer = Buffer.from("file");

      await resource.run("workflow-1", {
        message: "Process all media",
        images: [imageBuffer],
        audio: [audioBuffer],
        videos: [videoBuffer],
        files: [fileBuffer],
      });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.getAll("images").length).toBe(1);
      expect(formData.getAll("audio").length).toBe(1);
      expect(formData.getAll("videos").length).toBe(1);
      expect(formData.getAll("files").length).toBe(1);
    });

    it("works without any media files", async () => {
      requestSpy.mockResolvedValueOnce({ content: "response" });

      await resource.run("workflow-1", {
        message: "Just text",
      });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe("Just text");
      expect(formData.getAll("images").length).toBe(0);
      expect(formData.getAll("audio").length).toBe(0);
      expect(formData.getAll("videos").length).toBe(0);
      expect(formData.getAll("files").length).toBe(0);
    });
  });

  describe("runStream() with media files", () => {
    it("appends images to FormData in streaming mode", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);
      const imageBuffer = Buffer.from("fake-image-data");

      await resource.runStream("workflow-1", {
        message: "Describe this image",
        images: [imageBuffer],
      });

      const callArgs = requestStreamSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe("Describe this image");
      const images = formData.getAll("images");
      expect(images.length).toBe(1);
    });

    it("handles all media types in streaming mode", async () => {
      const mockResponse = new Response("data: event", { status: 200 });
      requestStreamSpy.mockResolvedValueOnce(mockResponse);
      const imageBuffer = Buffer.from("image");
      const audioBuffer = Buffer.from("audio");

      await resource.runStream("workflow-1", {
        message: "Process these",
        images: [imageBuffer],
        audio: [audioBuffer],
      });

      const callArgs = requestStreamSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.getAll("images").length).toBe(1);
      expect(formData.getAll("audio").length).toBe(1);
    });
  });
});
