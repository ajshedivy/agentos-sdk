import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { EvalsResource } from "../../src/resources/evals";

describe("EvalsResource", () => {
  let resource: EvalsResource;
  let mockClient: AgentOSClient;
  let requestSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClient = new AgentOSClient({
      baseUrl: "https://api.example.com",
      apiKey: "test-key",
    });
    requestSpy = vi.fn();
    // biome-ignore lint/suspicious/noExplicitAny: Need to mock public request method for testing
    (mockClient as any).request = requestSpy;
    resource = new EvalsResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /eval-runs with no params when called without options", async () => {
      const mockResponse = { items: [], total: 0, page: 1, limit: 20 };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/eval-runs");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("appends all optional query params when provided", async () => {
      const mockResponse = { items: [], total: 0, page: 2, limit: 10 };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list({
        agentId: "agent-1",
        teamId: "team-2",
        workflowId: "wf-3",
        modelId: "model-4",
        type: "accuracy",
        limit: 10,
        page: 2,
        sortBy: "created_at",
        sortOrder: "desc",
        dbId: "db-5",
        table: "evals_table",
        evalTypes: "accuracy,latency",
      });

      expect(result).toEqual(mockResponse);
      const calledPath = requestSpy.mock.calls[0][1] as string;
      expect(calledPath).toContain("/eval-runs?");
      expect(calledPath).toContain("agent_id=agent-1");
      expect(calledPath).toContain("team_id=team-2");
      expect(calledPath).toContain("workflow_id=wf-3");
      expect(calledPath).toContain("model_id=model-4");
      expect(calledPath).toContain("type=accuracy");
      expect(calledPath).toContain("limit=10");
      expect(calledPath).toContain("page=2");
      expect(calledPath).toContain("sort_by=created_at");
      expect(calledPath).toContain("sort_order=desc");
      expect(calledPath).toContain("db_id=db-5");
      expect(calledPath).toContain("table=evals_table");
      expect(calledPath).toContain("eval_types=accuracy%2Clatency");
    });

    it("passes through the response from client.request", async () => {
      const mockResponse = {
        items: [{ id: "eval-1", eval_type: "accuracy" }],
        total: 1,
        page: 1,
        limit: 20,
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result).toEqual(mockResponse);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(resource.list()).rejects.toThrow("Unauthorized");
    });

    it("omits undefined optional params from query string", async () => {
      requestSpy.mockResolvedValueOnce({ items: [] });

      await resource.list({ agentId: "agent-1" });

      const calledPath = requestSpy.mock.calls[0][1] as string;
      expect(calledPath).toBe("/eval-runs?agent_id=agent-1");
    });
  });

  describe("create()", () => {
    it("sends POST /eval-runs with JSON body and no query params", async () => {
      const mockEval = { id: "eval-1", eval_type: "accuracy" };
      requestSpy.mockResolvedValueOnce(mockEval);

      const result = await resource.create({
        agentId: "agent-1",
        evalType: "accuracy",
        input: "What is 2+2?",
        expectedOutput: "4",
      });

      expect(result).toEqual(mockEval);
      expect(requestSpy).toHaveBeenCalledWith("POST", "/eval-runs", {
        body: JSON.stringify({
          agent_id: "agent-1",
          eval_type: "accuracy",
          input: "What is 2+2?",
          expected_output: "4",
        }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("includes all optional body fields when provided", async () => {
      const mockEval = { id: "eval-2" };
      requestSpy.mockResolvedValueOnce(mockEval);

      await resource.create({
        agentId: "agent-1",
        teamId: "team-2",
        modelId: "model-3",
        modelProvider: "openai",
        evalType: "tool_use",
        input: "test input",
        expectedOutput: "test output",
        criteria: "exact_match",
        scoringStrategy: "binary",
        threshold: 0.95,
        warmupRuns: 3,
        expectedToolCalls: ["get_weather", "search"],
      });

      const callArgs = requestSpy.mock.calls[0];
      const body = JSON.parse(callArgs[2].body);
      expect(body).toEqual({
        agent_id: "agent-1",
        team_id: "team-2",
        model_id: "model-3",
        model_provider: "openai",
        eval_type: "tool_use",
        input: "test input",
        expected_output: "test output",
        criteria: "exact_match",
        scoring_strategy: "binary",
        threshold: 0.95,
        warmup_runs: 3,
        expected_tool_calls: ["get_weather", "search"],
      });
    });

    it("appends db_id and table as query params", async () => {
      requestSpy.mockResolvedValueOnce({ id: "eval-3" });

      await resource.create({
        agentId: "agent-1",
        dbId: "db-1",
        table: "custom_table",
      });

      const calledPath = requestSpy.mock.calls[0][1] as string;
      expect(calledPath).toContain("/eval-runs?");
      expect(calledPath).toContain("db_id=db-1");
      expect(calledPath).toContain("table=custom_table");
    });

    it("passes through the response from client.request", async () => {
      const mockEval = {
        id: "eval-1",
        eval_type: "accuracy",
        input: "test",
        score: 0.9,
      };
      requestSpy.mockResolvedValueOnce(mockEval);

      const result = await resource.create({ agentId: "agent-1" });

      expect(result).toEqual(mockEval);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Bad Request"));

      await expect(resource.create({ agentId: "agent-1" })).rejects.toThrow(
        "Bad Request",
      );
    });

    it("sends empty body object when no optional fields provided", async () => {
      requestSpy.mockResolvedValueOnce({ id: "eval-4" });

      await resource.create({});

      expect(requestSpy).toHaveBeenCalledWith("POST", "/eval-runs", {
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
    });
  });

  describe("get()", () => {
    it("calls GET /eval-runs/{eval_run_id}", async () => {
      const mockEval = { id: "eval-1", eval_type: "accuracy" };
      requestSpy.mockResolvedValueOnce(mockEval);

      const result = await resource.get("eval-1");

      expect(result).toEqual(mockEval);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/eval-runs/eval-1");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes the eval run ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "eval/special" });

      await resource.get("eval/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/eval-runs/eval%2Fspecial",
      );
    });

    it("URL-encodes spaces in eval run ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "my eval" });

      await resource.get("my eval");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/eval-runs/my%20eval");
    });

    it("passes through the response from client.request", async () => {
      const mockEval = {
        id: "eval-1",
        eval_type: "accuracy",
        score: 0.95,
        input: "What is 2+2?",
      };
      requestSpy.mockResolvedValueOnce(mockEval);

      const result = await resource.get("eval-1");

      expect(result).toEqual(mockEval);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.get("nonexistent")).rejects.toThrow("Not found");
    });
  });

  describe("update()", () => {
    it("sends PATCH /eval-runs/{eval_run_id} with JSON body", async () => {
      const mockEval = { id: "eval-1", name: "New Name" };
      requestSpy.mockResolvedValueOnce(mockEval);

      const result = await resource.update("eval-1", { name: "New Name" });

      expect(result).toEqual(mockEval);
      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/eval-runs/eval-1",
        {
          body: JSON.stringify({ name: "New Name" }),
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    it("URL-encodes the eval run ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "eval/special" });

      await resource.update("eval/special", { name: "Updated" });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/eval-runs/eval%2Fspecial",
        expect.any(Object),
      );
    });

    it("passes through the response from client.request", async () => {
      const mockEval = { id: "eval-1", name: "Updated Name", score: 0.8 };
      requestSpy.mockResolvedValueOnce(mockEval);

      const result = await resource.update("eval-1", { name: "Updated Name" });

      expect(result).toEqual(mockEval);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Forbidden"));

      await expect(
        resource.update("eval-1", { name: "test" }),
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("delete()", () => {
    it("sends DELETE /eval-runs with JSON body containing ids", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete({ ids: ["eval-1", "eval-2"] });

      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/eval-runs", {
        body: JSON.stringify({ ids: ["eval-1", "eval-2"] }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("appends db_id and table as query params", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete({
        ids: ["eval-1"],
        dbId: "db-1",
        table: "custom_table",
      });

      const calledPath = requestSpy.mock.calls[0][1] as string;
      expect(calledPath).toContain("/eval-runs?");
      expect(calledPath).toContain("db_id=db-1");
      expect(calledPath).toContain("table=custom_table");
    });

    it("sends DELETE /eval-runs without query params when db_id and table are absent", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete({ ids: ["eval-1"] });

      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/eval-runs", {
        body: JSON.stringify({ ids: ["eval-1"] }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("returns void on success", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      const result = await resource.delete({ ids: ["eval-1"] });

      expect(result).toBeUndefined();
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Server Error"));

      await expect(resource.delete({ ids: ["eval-1"] })).rejects.toThrow(
        "Server Error",
      );
    });
  });
});
