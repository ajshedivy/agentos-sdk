import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../src/client";
import { AuthenticationError } from "../src/errors";

// Mock the http module
vi.mock("../src/http", () => ({
  requestWithRetry: vi.fn(),
}));

import { requestWithRetry } from "../src/http";

const mockRequestWithRetry = vi.mocked(requestWithRetry);

describe("AgentOSClient", () => {
  beforeEach(() => {
    mockRequestWithRetry.mockReset();
  });

  describe("constructor", () => {
    it("should require baseUrl", () => {
      expect(() => new AgentOSClient({} as AgentOSClientOptions)).toThrow(
        "baseUrl is required",
      );
      expect(() => new AgentOSClient({ baseUrl: "" })).toThrow(
        "baseUrl is required",
      );
    });

    it("should accept valid options", () => {
      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        apiKey: "test-key",
        timeout: 5000,
        maxRetries: 3,
      });

      expect(client.version).toBe("0.1.0");
    });

    it("should remove trailing slash from baseUrl", async () => {
      const client = new AgentOSClient({
        baseUrl: "https://api.example.com/",
      });

      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });
      await client.health();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        "https://api.example.com/health",
        expect.any(Object),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("should handle baseUrl without trailing slash", async () => {
      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });
      await client.health();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        "https://api.example.com/health",
        expect.any(Object),
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe("getConfig", () => {
    it("should fetch config from /config endpoint", async () => {
      const mockConfig = {
        version: "1.0.0",
        environment: "production",
        features: { streaming: true },
      };
      mockRequestWithRetry.mockResolvedValueOnce(mockConfig);

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      const config = await client.getConfig();

      expect(config).toEqual(mockConfig);
      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        "https://api.example.com/config",
        expect.objectContaining({ method: "GET" }),
        2, // default maxRetries
        30000, // default timeout
      );
    });

    it("should include default headers in getConfig request", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ version: "1.0.0" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      await client.getConfig();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "User-Agent": "agentos-sdk/0.1.0",
          }),
        }),
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe("health", () => {
    it("should fetch health from /health endpoint", async () => {
      const mockHealth = {
        status: "healthy",
        timestamp: "2026-01-31T00:00:00Z",
      };
      mockRequestWithRetry.mockResolvedValueOnce(mockHealth);

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      const health = await client.health();

      expect(health).toEqual(mockHealth);
      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        "https://api.example.com/health",
        expect.objectContaining({ method: "GET" }),
        2, // default maxRetries
        30000, // default timeout
      );
    });

    it("should handle degraded health status", async () => {
      const mockHealth = {
        status: "degraded",
        timestamp: "2026-01-31T00:00:00Z",
        details: { database: "slow" },
      };
      mockRequestWithRetry.mockResolvedValueOnce(mockHealth);

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      const health = await client.health();

      expect(health.status).toBe("degraded");
      expect(health.details).toEqual({ database: "slow" });
    });
  });

  describe("authentication", () => {
    it("should include Bearer token when apiKey is set", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        apiKey: "my-secret-key",
      });

      await client.health();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-secret-key",
          }),
        }),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("should not include Authorization header when apiKey is not set", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      await client.health();

      const call = mockRequestWithRetry.mock.calls[0];
      const headers = call?.[1]?.headers as Record<string, string>;
      expect(headers.Authorization).toBeUndefined();
    });

    it("should work with empty string apiKey (treated as not set)", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        apiKey: "",
      });

      await client.health();

      const call = mockRequestWithRetry.mock.calls[0];
      const headers = call?.[1]?.headers as Record<string, string>;
      // Empty string is falsy, so no Authorization header
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe("custom options", () => {
    it("should use custom timeout", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        timeout: 5000,
      });

      await client.health();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        2,
        5000, // custom timeout
      );
    });

    it("should use custom maxRetries", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        maxRetries: 5,
      });

      await client.health();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        5, // custom maxRetries
        30000,
      );
    });

    it("should use zero maxRetries when explicitly set", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        maxRetries: 0,
      });

      await client.health();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        0, // zero maxRetries
        30000,
      );
    });

    it("should include custom headers", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        headers: { "X-Custom-Header": "custom-value" },
      });

      await client.health();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Custom-Header": "custom-value",
          }),
        }),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("should allow custom headers to override defaults", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        headers: { "Content-Type": "application/xml" },
      });

      await client.health();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/xml",
          }),
        }),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("should combine multiple custom options", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        apiKey: "test-key",
        timeout: 10000,
        maxRetries: 3,
        headers: { "X-Trace-Id": "abc123" },
      });

      await client.health();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        "https://api.example.com/health",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-key",
            "X-Trace-Id": "abc123",
            "Content-Type": "application/json",
            "User-Agent": "agentos-sdk/0.1.0",
          }),
        }),
        3, // custom maxRetries
        10000, // custom timeout
      );
    });
  });

  describe("error handling", () => {
    it("should propagate AuthenticationError from requestWithRetry", async () => {
      mockRequestWithRetry.mockRejectedValueOnce(
        new AuthenticationError("Invalid API key", "req-123"),
      );

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        apiKey: "invalid-key",
      });

      const healthPromise = client.health();
      await expect(healthPromise).rejects.toThrow(AuthenticationError);
      await expect(healthPromise).rejects.toThrow("Invalid API key");
    });

    it("should propagate generic Error from requestWithRetry", async () => {
      mockRequestWithRetry.mockRejectedValueOnce(new Error("Network failure"));

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      await expect(client.health()).rejects.toThrow("Network failure");
    });

    it("should propagate errors for getConfig", async () => {
      mockRequestWithRetry.mockRejectedValueOnce(
        new AuthenticationError("Unauthorized", "req-456"),
      );

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      await expect(client.getConfig()).rejects.toThrow(AuthenticationError);
    });
  });

  describe("version", () => {
    it("should expose version as readonly property", () => {
      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      expect(client.version).toBe("0.1.0");
    });

    it("should include version in User-Agent header", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ status: "healthy" });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      await client.health();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "User-Agent": "agentos-sdk/0.1.0",
          }),
        }),
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe("request() FormData handling", () => {
    it("should remove Content-Type header when body is FormData", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ success: true });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        apiKey: "test-key",
      });

      // Access protected method via any cast for testing
      const formData = new FormData();
      formData.append("message", "test");

      // biome-ignore lint/suspicious/noExplicitAny: Need to access protected method for testing
      await (client as any).request("POST", "/test", { body: formData });

      const call = mockRequestWithRetry.mock.calls[0];
      const headers = call?.[1]?.headers as Record<string, string>;
      // Content-Type should NOT be set - fetch auto-sets for FormData
      expect(headers["Content-Type"]).toBeUndefined();
    });

    it("should keep Content-Type header for non-FormData bodies", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({ success: true });

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      // biome-ignore lint/suspicious/noExplicitAny: Need to access protected method for testing
      await (client as any).request("POST", "/test", {
        body: '{"data": "test"}',
      });

      const call = mockRequestWithRetry.mock.calls[0];
      const headers = call?.[1]?.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });

  describe("agents property", () => {
    it("exposes AgentsResource instance", () => {
      const client = new AgentOSClient({ baseUrl: "https://api.example.com" });
      expect(client.agents).toBeDefined();
      expect(typeof client.agents.list).toBe("function");
      expect(typeof client.agents.get).toBe("function");
      expect(typeof client.agents.run).toBe("function");
    });

    it("agents resource uses client.request for API calls", async () => {
      mockRequestWithRetry.mockResolvedValueOnce([]);

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        apiKey: "test-key",
      });

      await client.agents.list();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        "https://api.example.com/agents",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
            "User-Agent": "agentos-sdk/0.1.0",
          }),
        }),
        2, // default maxRetries
        30000, // default timeout
      );
    });

    it("agents resource respects custom client configuration", async () => {
      mockRequestWithRetry.mockResolvedValueOnce({
        id: "agent-1",
        name: "Test Agent",
      });

      const client = new AgentOSClient({
        baseUrl: "https://custom.api.com",
        apiKey: "custom-key",
        timeout: 5000,
        maxRetries: 5,
      });

      await client.agents.get("agent-1");

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        "https://custom.api.com/agents/agent-1",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer custom-key",
          }),
        }),
        5, // custom maxRetries
        5000, // custom timeout
      );
    });
  });

  describe("requestStream()", () => {
    beforeEach(() => {
      // Reset fetch mock
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            headers: new Headers(),
            body: null,
          }),
        ),
      );
    });

    it("should return Response object for successful request", async () => {
      const mockResponse = new Response("data: event", {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });

      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.resolve(mockResponse)),
      );

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      // biome-ignore lint/suspicious/noExplicitAny: Need to access internal method for testing
      const response = await (client as any).requestStream("POST", "/stream");

      expect(response).toBe(mockResponse);
    });

    it("should set Accept: text/event-stream header", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          new Response("data: event", {
            status: 200,
          }),
        ),
      );

      vi.stubGlobal("fetch", mockFetch);

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      // biome-ignore lint/suspicious/noExplicitAny: Need to access internal method for testing
      await (client as any).requestStream("POST", "/stream");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/stream",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "text/event-stream",
          }),
        }),
      );
    });

    it("should remove Content-Type header for FormData", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          new Response("data: event", {
            status: 200,
          }),
        ),
      );

      vi.stubGlobal("fetch", mockFetch);

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      const formData = new FormData();
      formData.append("message", "test");

      // biome-ignore lint/suspicious/noExplicitAny: Need to access internal method for testing
      await (client as any).requestStream("POST", "/stream", {
        body: formData,
      });

      const call = mockFetch.mock.calls[0];
      const headers = call?.[1]?.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBeUndefined();
      expect(headers.Accept).toBe("text/event-stream");
    });

    it("should throw appropriate error on non-2xx status", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          new Response("Unauthorized", {
            status: 401,
            headers: { "x-request-id": "req-123" },
          }),
        ),
      );

      vi.stubGlobal("fetch", mockFetch);

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        apiKey: "invalid-key",
      });

      // biome-ignore lint/suspicious/noExplicitAny: Need to access internal method for testing
      const promise = (client as any).requestStream("POST", "/stream");

      await expect(promise).rejects.toThrow(AuthenticationError);
    });

    it("should include Authorization header when apiKey is set", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          new Response("data: event", {
            status: 200,
          }),
        ),
      );

      vi.stubGlobal("fetch", mockFetch);

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
        apiKey: "test-key",
      });

      // biome-ignore lint/suspicious/noExplicitAny: Need to access internal method for testing
      await (client as any).requestStream("POST", "/stream");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-key",
            Accept: "text/event-stream",
          }),
        }),
      );
    });

    it("should pass AbortSignal for cancellation support", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          new Response("data: event", {
            status: 200,
          }),
        ),
      );

      vi.stubGlobal("fetch", mockFetch);

      const client = new AgentOSClient({
        baseUrl: "https://api.example.com",
      });

      const controller = new AbortController();

      // biome-ignore lint/suspicious/noExplicitAny: Need to access internal method for testing
      await (client as any).requestStream("POST", "/stream", {
        signal: controller.signal,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal,
        }),
      );
    });
  });
});

// Type import for testing
import type { AgentOSClientOptions } from "../src/types";
