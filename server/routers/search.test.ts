import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchRouter } from "./search";
import * as db from "../db";

// Mock les fonctions de base de données
vi.mock("../db", () => ({
  getAllMembers: vi.fn(),
  getAllDocuments: vi.fn(),
}));

describe("searchRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("global search", () => {
    it("should search members by name", async () => {
      const mockMembers = [
        {
          id: 1,
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean@example.com",
          phone: "0612345678",
          role: "member",
          status: "active",
          userId: 1,
          function: "Président",
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          firstName: "Marie",
          lastName: "Martin",
          email: "marie@example.com",
          phone: "0687654321",
          role: "member",
          status: "active",
          userId: 2,
          function: "Trésorier",
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getAllMembers).mockResolvedValue(mockMembers);
      vi.mocked(db.getAllDocuments).mockResolvedValue([]);

      const caller = searchRouter.createCaller({
        user: {
          id: 1,
          openId: "test-user",
          email: "test@example.com",
          name: "Test User",
          loginMethod: "google",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.global({ query: "jean" });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.title).toBe("Jean Dupont");
      expect(result.results[0]?.type).toBe("member");
    });

    it("should search documents by title", async () => {
      const mockDocuments = [
        {
          id: 1,
          title: "Rapport Annuel 2024",
          description: "Rapport financier annuel",
          categoryId: 1,
          status: "completed",
          priority: "high",
          fileUrl: "https://example.com/file.pdf",
          fileKey: "file-key",
          fileName: "rapport.pdf",
          fileType: "pdf",
          fileSize: 1024,
          createdBy: 1,
          updatedBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          dueDate: null,
          isArchived: false,
        },
      ];

      vi.mocked(db.getAllMembers).mockResolvedValue([]);
      vi.mocked(db.getAllDocuments).mockResolvedValue(mockDocuments);

      const caller = searchRouter.createCaller({
        user: {
          id: 1,
          openId: "test-user",
          email: "test@example.com",
          name: "Test User",
          loginMethod: "google",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.global({ query: "rapport" });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.title).toBe("Rapport Annuel 2024");
      expect(result.results[0]?.type).toBe("document");
    });

    it("should search by email", async () => {
      const mockMembers = [
        {
          id: 1,
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean.dupont@example.com",
          phone: "0612345678",
          role: "member",
          status: "active",
          userId: 1,
          function: "Président",
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getAllMembers).mockResolvedValue(mockMembers);
      vi.mocked(db.getAllDocuments).mockResolvedValue([]);

      const caller = searchRouter.createCaller({
        user: {
          id: 1,
          openId: "test-user",
          email: "test@example.com",
          name: "Test User",
          loginMethod: "google",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.global({ query: "jean.dupont" });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.subtitle).toBe("jean.dupont@example.com");
    });

    it("should return empty results for no matches", async () => {
      vi.mocked(db.getAllMembers).mockResolvedValue([]);
      vi.mocked(db.getAllDocuments).mockResolvedValue([]);

      const caller = searchRouter.createCaller({
        user: {
          id: 1,
          openId: "test-user",
          email: "test@example.com",
          name: "Test User",
          loginMethod: "google",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.global({ query: "nonexistent" });

      expect(result.results).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should respect limit parameter", async () => {
      const mockMembers = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        firstName: "Member",
        lastName: `${i + 1}`,
        email: `member${i + 1}@example.com`,
        phone: `061234567${i}`,
        role: "member",
        status: "active",
        userId: i + 1,
        function: "Member",
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      vi.mocked(db.getAllMembers).mockResolvedValue(mockMembers);
      vi.mocked(db.getAllDocuments).mockResolvedValue([]);

      const caller = searchRouter.createCaller({
        user: {
          id: 1,
          openId: "test-user",
          email: "test@example.com",
          name: "Test User",
          loginMethod: "google",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.global({ query: "member", limit: 5 });

      expect(result.results.length).toBeLessThanOrEqual(5);
    });
  });
});
