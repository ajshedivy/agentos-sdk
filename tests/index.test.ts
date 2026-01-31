import { describe, expect, it } from "vitest";
import {
  APIError,
  AgentOSClient,
  AgentStream,
  AgentsResource,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
  RemoteServerUnavailableError,
  UnprocessableEntityError,
  VERSION,
} from "../src/index";
import type {
  AgentRunEvent,
  ContinueOptions,
  MemoryUpdateCompletedEvent,
  MemoryUpdateStartedEvent,
  RunCompletedEvent,
  RunContentEvent,
  RunOptions,
  RunStartedEvent,
  StreamRunOptions,
  components,
  paths,
} from "../src/index";

describe("Package Exports", () => {
  it("should export VERSION", () => {
    expect(VERSION).toBe("0.1.0");
  });

  it("should export AgentOSClient", () => {
    expect(AgentOSClient).toBeDefined();
    expect(typeof AgentOSClient).toBe("function");
  });

  it("should export AgentsResource", () => {
    expect(AgentsResource).toBeDefined();
    expect(typeof AgentsResource).toBe("function");
  });

  it("should export generated types namespace", () => {
    // Type-level check - if this compiles, exports work
    // Runtime: just verify the import doesn't throw
    const _typeCheck: RunOptions = { message: "test" };
    const _componentCheck: components = {} as components;
    const _pathsCheck: paths = {} as paths;
    expect(true).toBe(true);
  });

  it("should export all error classes", () => {
    expect(APIError).toBeDefined();
    expect(BadRequestError).toBeDefined();
    expect(AuthenticationError).toBeDefined();
    expect(NotFoundError).toBeDefined();
    expect(UnprocessableEntityError).toBeDefined();
    expect(RateLimitError).toBeDefined();
    expect(InternalServerError).toBeDefined();
    expect(RemoteServerUnavailableError).toBeDefined();
  });

  it("should allow instantiation of AgentOSClient", () => {
    const client = new AgentOSClient({
      baseUrl: "https://api.example.com",
    });
    expect(client.version).toBe("0.1.0");
  });

  it("should allow error class inheritance checks", () => {
    const error = new BadRequestError("test");
    expect(error instanceof BadRequestError).toBe(true);
    expect(error instanceof APIError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  describe("Error classes", () => {
    it("should create APIError with correct status", () => {
      const error = new APIError(418, "I'm a teapot", "req-123");
      expect(error.status).toBe(418);
      expect(error.message).toBe("I'm a teapot");
      expect(error.requestId).toBe("req-123");
    });

    it("should create BadRequestError with status 400", () => {
      const error = new BadRequestError("Invalid input");
      expect(error.status).toBe(400);
      expect(error.name).toBe("BadRequestError");
    });

    it("should create AuthenticationError with status 401", () => {
      const error = new AuthenticationError("Invalid API key");
      expect(error.status).toBe(401);
      expect(error.name).toBe("AuthenticationError");
    });

    it("should create NotFoundError with status 404", () => {
      const error = new NotFoundError("Resource not found");
      expect(error.status).toBe(404);
      expect(error.name).toBe("NotFoundError");
    });

    it("should create UnprocessableEntityError with status 422", () => {
      const error = new UnprocessableEntityError("Validation failed");
      expect(error.status).toBe(422);
      expect(error.name).toBe("UnprocessableEntityError");
    });

    it("should create RateLimitError with status 429", () => {
      const error = new RateLimitError("Too many requests");
      expect(error.status).toBe(429);
      expect(error.name).toBe("RateLimitError");
    });

    it("should create InternalServerError with status 500", () => {
      const error = new InternalServerError("Server error");
      expect(error.status).toBe(500);
      expect(error.name).toBe("InternalServerError");
    });

    it("should create RemoteServerUnavailableError with status 503", () => {
      const error = new RemoteServerUnavailableError("Service unavailable");
      expect(error.status).toBe(503);
      expect(error.name).toBe("RemoteServerUnavailableError");
    });
  });

  describe("streaming exports", () => {
    it("exports AgentStream class", () => {
      expect(AgentStream).toBeDefined();
      expect(typeof AgentStream).toBe("function");
    });

    it("exports streaming option types", () => {
      // Type-level test - if these compile, types are exported
      const streamOpts: StreamRunOptions = { message: "test" };
      const continueOpts: ContinueOptions = { tools: "[]" };
      expect(streamOpts.message).toBe("test");
      expect(continueOpts.tools).toBe("[]");
    });

    it("exports event types", () => {
      // Type-level test - if these compile, types are exported
      const runStarted: RunStartedEvent = {
        event: "RunStarted",
        run_id: "run-123",
        agent_id: "agent-1",
        timestamp: "2026-01-31T00:00:00Z",
      };
      const runContent: RunContentEvent = {
        event: "RunContent",
        content: "Hello",
        timestamp: "2026-01-31T00:00:00Z",
      };
      const runCompleted: RunCompletedEvent = {
        event: "RunCompleted",
        status: "success",
        timestamp: "2026-01-31T00:00:00Z",
      };
      const memUpdateStarted: MemoryUpdateStartedEvent = {
        event: "MemoryUpdateStarted",
        timestamp: "2026-01-31T00:00:00Z",
      };
      const memUpdateCompleted: MemoryUpdateCompletedEvent = {
        event: "MemoryUpdateCompleted",
        timestamp: "2026-01-31T00:00:00Z",
      };

      expect(runStarted.event).toBe("RunStarted");
      expect(runContent.event).toBe("RunContent");
      expect(runCompleted.event).toBe("RunCompleted");
      expect(memUpdateStarted.event).toBe("MemoryUpdateStarted");
      expect(memUpdateCompleted.event).toBe("MemoryUpdateCompleted");
    });

    it("exports discriminated union AgentRunEvent", () => {
      // Type-level test - verify union discriminates correctly
      const event: AgentRunEvent = {
        event: "RunContent",
        content: "test",
        timestamp: "2026-01-31T00:00:00Z",
      };

      // TypeScript should narrow the type based on discriminator
      if (event.event === "RunContent") {
        expect(event.content).toBe("test");
      } else {
        throw new Error("Union discriminator failed");
      }
    });
  });
});
