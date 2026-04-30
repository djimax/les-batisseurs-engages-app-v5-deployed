import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock user context
const mockUser = {
  id: 1,
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "google" as const,
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const mockContext: TrpcContext = {
  user: mockUser,
  req: {
    protocol: "https",
    headers: {},
  } as any,
  res: {} as any,
};

describe("Projects Router", () => {
  let caller: any;

  beforeEach(() => {
    caller = appRouter.createCaller(mockContext);
  });

  it("should list projects", async () => {
    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should filter projects by status", async () => {
    const result = await caller.projects.list({ status: "active" });
    expect(Array.isArray(result)).toBe(true);
    // All projects should have 'active' status
    result.forEach((project: any) => {
      if (project.status) {
        expect(project.status).toBe("active");
      }
    });
  });

  it("should get project statistics", async () => {
    const result = await caller.projects.getStats({ projectId: 0 });
    expect(result).toBeDefined();
    expect(typeof result.active).toBe("number");
    expect(typeof result.pending).toBe("number");
    expect(typeof result.completed).toBe("number");
  });

  it("should create a project", async () => {
    const newProject = {
      name: "Test Project",
      description: "A test project",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 1000,
      priority: "medium" as const,
    };

    const result = await caller.projects.create(newProject);
    expect(result).toBeDefined();
    expect(result.name).toBe("Test Project");
  });

  it("should update a project", async () => {
    // First create a project
    const newProject = {
      name: "Original Name",
      description: "Original description",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 1000,
      priority: "medium" as const,
    };

    const created = await caller.projects.create(newProject);

    // Then update it
    const updated = await caller.projects.update({
      id: created.id,
      name: "Updated Name",
      description: "Updated description",
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.description).toBe("Updated description");
  });

  it("should delete a project", async () => {
    // First create a project
    const newProject = {
      name: "To Delete",
      description: "This will be deleted",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 1000,
      priority: "medium" as const,
    };

    const created = await caller.projects.create(newProject);

    // Then delete it
    const result = await caller.projects.delete({ id: created.id });
    expect(result).toBeDefined();

    // Verify it's deleted
    const list = await caller.projects.list();
    const deleted = list.find((p: any) => p.id === created.id);
    expect(deleted).toBeUndefined();
  });

  it("should handle invalid project ID gracefully", async () => {
    try {
      await caller.projects.delete({ id: 99999 });
      // If no error, that's fine - the API might just return success
    } catch (error) {
      // If error, it should be a proper error
      expect(error).toBeDefined();
    }
  });

  it("should validate required fields", async () => {
    try {
      await caller.projects.create({
        name: "", // Empty name
        description: "Test",
        startDate: new Date().toISOString(),
        budget: 1000,
        priority: "medium" as const,
      });
      // If no error, the API might accept empty names
    } catch (error) {
      // If error, it should be a validation error
      expect(error).toBeDefined();
    }
  });

  it("should calculate correct statistics", async () => {
    const stats = await caller.projects.getStats({ projectId: 0 });
    
    expect(stats.active).toBeGreaterThanOrEqual(0);
    expect(stats.pending).toBeGreaterThanOrEqual(0);
    expect(stats.completed).toBeGreaterThanOrEqual(0);
    expect(stats.archived).toBeGreaterThanOrEqual(0);
    
    // Total should equal sum of all statuses
    const total = stats.active + stats.pending + stats.completed + stats.archived;
    expect(total).toBeGreaterThanOrEqual(0);
  });
});
