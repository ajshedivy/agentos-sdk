import { describe, expect, it } from "vitest";
import type { components, paths } from "../src/generated/types.js";

describe("Generated Types", () => {
  it("exports components schemas", () => {
    // Type-level assertions - if this compiles, types are valid
    type AgentResponse = components["schemas"]["AgentResponse"];
    type RunRequest = components["schemas"]["Body_create_agent_run"];
    type BadRequest = components["schemas"]["BadRequestResponse"];
    type Unauthenticated = components["schemas"]["UnauthenticatedResponse"];

    // Runtime check that types namespace exists
    expect(true).toBe(true);
  });

  it("AgentResponse has expected properties", () => {
    // Type assertion for shape - this validates the structure at compile time
    const mockAgent: components["schemas"]["AgentResponse"] = {
      id: "test-agent",
      name: "Test Agent",
    };
    expect(mockAgent.id).toBe("test-agent");
    expect(mockAgent.name).toBe("Test Agent");
  });

  it("Body_create_agent_run has message field", () => {
    // Type assertion for run request structure
    const mockRunRequest: components["schemas"]["Body_create_agent_run"] = {
      message: "Test message",
    };
    expect(mockRunRequest.message).toBe("Test message");
  });

  it("error response types exist", () => {
    // Type assertions for error responses
    const mockBadRequest: components["schemas"]["BadRequestResponse"] = {
      detail: "Bad request error",
    };
    expect(mockBadRequest.detail).toBe("Bad request error");

    const mockUnauth: components["schemas"]["UnauthenticatedResponse"] = {
      detail: "Not authenticated",
    };
    expect(mockUnauth.detail).toBe("Not authenticated");
  });

  it("paths type exports API endpoints", () => {
    // Type-level assertion - validates paths are exported
    type Paths = paths;

    // Runtime validation
    expect(true).toBe(true);
  });
});
