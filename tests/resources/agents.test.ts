import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AgentsResource } from "../../src/resources/agents";
import { AgentOSClient } from "../../src/client";

describe("AgentsResource", () => {
  let resource: AgentsResource;
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
    (mockClient as any).request = requestSpy;

    resource = new AgentsResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("returns array of agents", async () => {
      const mockAgents = [
        { id: "agent-1", name: "Agent One" },
        { id: "agent-2", name: "Agent Two" },
      ];
      requestSpy.mockResolvedValueOnce(mockAgents);

      const result = await resource.list();

      expect(result).toEqual(mockAgents);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/agents");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(resource.list()).rejects.toThrow("Unauthorized");
    });

    it("returns empty array when no agents exist", async () => {
      requestSpy.mockResolvedValueOnce([]);

      const result = await resource.list();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("get()", () => {
    it("returns agent by ID", async () => {
      const mockAgent = {
        id: "agent-1",
        name: "Agent One",
        model: { name: "gpt-4" },
      };
      requestSpy.mockResolvedValueOnce(mockAgent);

      const result = await resource.get("agent-1");

      expect(result).toEqual(mockAgent);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/agents/agent-1");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes agent ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "agent/special" });

      await resource.get("agent/special");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/agents/agent%2Fspecial");
    });

    it("URL-encodes spaces in agent ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "my agent" });

      await resource.get("my agent");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/agents/my%20agent");
    });

    it("URL-encodes special characters in agent ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "agent@123" });

      await resource.get("agent@123");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/agents/agent%40123");
    });

    it("propagates NotFoundError from client", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.get("nonexistent")).rejects.toThrow("Not found");
    });

    it("handles empty string agent ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "" });

      await resource.get("");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/agents/");
    });
  });

  describe("run()", () => {
    it("sends message via client.request with FormData", async () => {
      requestSpy.mockResolvedValueOnce({
        run_id: "run-123",
        content: "Hello!",
      });

      const result = await resource.run("agent-1", { message: "Hi there" });

      expect(result).toEqual({ run_id: "run-123", content: "Hello!" });
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/agents/agent-1/runs",
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

      await resource.run("agent-1", {
        message: "Hi",
        sessionId: "session-456",
      });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("session_id")).toBe("session-456");
    });

    it("includes user_id when provided", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("agent-1", {
        message: "Hi",
        userId: "user-789",
      });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("user_id")).toBe("user-789");
    });

    it("includes session_id and user_id when both provided", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("agent-1", {
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

      await resource.run("agent-1", { message: "Hi" });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("stream")).toBe("false");
    });

    it("forces stream to false even when explicitly set to false", async () => {
      requestSpy.mockResolvedValueOnce({});

      await resource.run("agent-1", { message: "Hi", stream: false });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("stream")).toBe("false");
    });

    it("URL-encodes agent ID in run", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("agent/special", { message: "Hi" });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/agents/agent%2Fspecial/runs",
        expect.any(Object),
      );
    });

    it("handles long messages", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });
      const longMessage = "a".repeat(10000);

      await resource.run("agent-1", { message: longMessage });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe(longMessage);
    });

    it("handles empty message", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("agent-1", { message: "" });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe("");
    });

    it("handles multiline messages", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });
      const multilineMessage = "Line 1\nLine 2\nLine 3";

      await resource.run("agent-1", { message: multilineMessage });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("message")).toBe(multilineMessage);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Agent not found"));

      await expect(
        resource.run("nonexistent", { message: "Hi" }),
      ).rejects.toThrow("Agent not found");
    });

    it("does not include session_id when not provided", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("agent-1", { message: "Hi" });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("session_id")).toBeNull();
    });

    it("does not include user_id when not provided", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-123" });

      await resource.run("agent-1", { message: "Hi" });

      const callArgs = requestSpy.mock.calls[0];
      const formData = callArgs[2].body as FormData;
      expect(formData.get("user_id")).toBeNull();
    });
  });
});
