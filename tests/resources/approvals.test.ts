import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { ApprovalsResource } from "../../src/resources/approvals";

describe("ApprovalsResource", () => {
  let resource: ApprovalsResource;
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
    resource = new ApprovalsResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /approvals with no params when called without options", async () => {
      const mockResponse = { items: [], total: 0, page: 1, limit: 20 };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/approvals");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("appends all optional query params when provided", async () => {
      const mockResponse = { items: [], total: 0 };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.list({
        status: "pending",
        sourceType: "agent",
        approvalType: "tool_call",
        pauseType: "manual",
        agentId: "agent-1",
        teamId: "team-2",
        workflowId: "wf-3",
        userId: "user-4",
        scheduleId: "sched-5",
        runId: "run-6",
        limit: 10,
        page: 2,
      });

      const calledPath = requestSpy.mock.calls[0][1] as string;
      expect(calledPath).toContain("/approvals?");
      expect(calledPath).toContain("status=pending");
      expect(calledPath).toContain("source_type=agent");
      expect(calledPath).toContain("approval_type=tool_call");
      expect(calledPath).toContain("pause_type=manual");
      expect(calledPath).toContain("agent_id=agent-1");
      expect(calledPath).toContain("team_id=team-2");
      expect(calledPath).toContain("workflow_id=wf-3");
      expect(calledPath).toContain("user_id=user-4");
      expect(calledPath).toContain("schedule_id=sched-5");
      expect(calledPath).toContain("run_id=run-6");
      expect(calledPath).toContain("limit=10");
      expect(calledPath).toContain("page=2");
    });

    it("passes through the response from client.request", async () => {
      const mockResponse = {
        items: [{ id: "approval-1", status: "pending" }],
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

      await resource.list({ status: "pending" });

      const calledPath = requestSpy.mock.calls[0][1] as string;
      expect(calledPath).toBe("/approvals?status=pending");
    });
  });

  describe("count()", () => {
    it("calls GET /approvals/count with no params when called without options", async () => {
      const mockResponse = { count: 5 };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.count();

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/approvals/count");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("appends user_id query param when provided", async () => {
      const mockResponse = { count: 3 };
      requestSpy.mockResolvedValueOnce(mockResponse);

      await resource.count({ userId: "user-123" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/approvals/count?user_id=user-123",
      );
    });

    it("passes through the response from client.request", async () => {
      const mockResponse = { count: 42 };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.count();

      expect(result).toEqual(mockResponse);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Server Error"));

      await expect(resource.count()).rejects.toThrow("Server Error");
    });
  });

  describe("get()", () => {
    it("calls GET /approvals/{approval_id}", async () => {
      const mockApproval = { id: "approval-1", status: "pending" };
      requestSpy.mockResolvedValueOnce(mockApproval);

      const result = await resource.get("approval-1");

      expect(result).toEqual(mockApproval);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/approvals/approval-1",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes the approval ID with slashes", async () => {
      requestSpy.mockResolvedValueOnce({ id: "approval/special" });

      await resource.get("approval/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/approvals/approval%2Fspecial",
      );
    });

    it("URL-encodes spaces in approval ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "my approval" });

      await resource.get("my approval");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/approvals/my%20approval",
      );
    });

    it("URL-encodes special characters in approval ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "approval@123" });

      await resource.get("approval@123");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/approvals/approval%40123",
      );
    });

    it("passes through the response from client.request", async () => {
      const mockApproval = {
        id: "approval-1",
        status: "approved",
        resolved_by: "user-1",
      };
      requestSpy.mockResolvedValueOnce(mockApproval);

      const result = await resource.get("approval-1");

      expect(result).toEqual(mockApproval);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.get("nonexistent")).rejects.toThrow("Not found");
    });
  });

  describe("delete()", () => {
    it("calls DELETE /approvals/{approval_id}", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("approval-1");

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/approvals/approval-1",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes the approval ID", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("approval/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/approvals/approval%2Fspecial",
      );
    });

    it("returns void on success", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      const result = await resource.delete("approval-1");

      expect(result).toBeUndefined();
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Forbidden"));

      await expect(resource.delete("approval-1")).rejects.toThrow("Forbidden");
    });
  });

  describe("resolve()", () => {
    it("sends POST /approvals/{approval_id}/resolve with required status", async () => {
      const mockApproval = { id: "approval-1", status: "approved" };
      requestSpy.mockResolvedValueOnce(mockApproval);

      const result = await resource.resolve("approval-1", {
        status: "approved",
      });

      expect(result).toEqual(mockApproval);
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/approvals/approval-1/resolve",
        {
          body: JSON.stringify({ status: "approved" }),
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    it("includes all optional fields in the JSON body", async () => {
      const mockApproval = { id: "approval-1", status: "rejected" };
      requestSpy.mockResolvedValueOnce(mockApproval);

      await resource.resolve("approval-1", {
        status: "rejected",
        resolvedBy: "user-456",
        resolutionData: { reason: "Not appropriate", code: 42 },
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/approvals/approval-1/resolve",
        {
          body: JSON.stringify({
            status: "rejected",
            resolved_by: "user-456",
            resolution_data: { reason: "Not appropriate", code: 42 },
          }),
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    it("URL-encodes the approval ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "approval/special" });

      await resource.resolve("approval/special", { status: "approved" });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/approvals/approval%2Fspecial/resolve",
        expect.any(Object),
      );
    });

    it("passes through the response from client.request", async () => {
      const mockApproval = {
        id: "approval-1",
        status: "approved",
        resolved_by: "user-1",
        resolution_data: { note: "LGTM" },
      };
      requestSpy.mockResolvedValueOnce(mockApproval);

      const result = await resource.resolve("approval-1", {
        status: "approved",
      });

      expect(result).toEqual(mockApproval);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Conflict"));

      await expect(
        resource.resolve("approval-1", { status: "approved" }),
      ).rejects.toThrow("Conflict");
    });
  });

  describe("getStatus()", () => {
    it("calls GET /approvals/{approval_id}/status", async () => {
      const mockStatus = { status: "pending" };
      requestSpy.mockResolvedValueOnce(mockStatus);

      const result = await resource.getStatus("approval-1");

      expect(result).toEqual(mockStatus);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/approvals/approval-1/status",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes the approval ID", async () => {
      requestSpy.mockResolvedValueOnce({ status: "approved" });

      await resource.getStatus("approval/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/approvals/approval%2Fspecial/status",
      );
    });

    it("URL-encodes spaces in approval ID", async () => {
      requestSpy.mockResolvedValueOnce({ status: "pending" });

      await resource.getStatus("my approval");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/approvals/my%20approval/status",
      );
    });

    it("passes through the response from client.request", async () => {
      const mockStatus = { status: "rejected", reason: "Policy violation" };
      requestSpy.mockResolvedValueOnce(mockStatus);

      const result = await resource.getStatus("approval-1");

      expect(result).toEqual(mockStatus);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.getStatus("nonexistent")).rejects.toThrow(
        "Not found",
      );
    });
  });
});
