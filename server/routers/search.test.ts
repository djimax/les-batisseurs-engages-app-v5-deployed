import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchRouter } from "./search";
import * as db from "../db";

vi.mock("../db", () => ({
  getAllMembers: vi.fn(),
  getAllDocuments: vi.fn(),
  getAllCategories: vi.fn(),
}));

const mockCtx = {
  user: {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "google",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

describe("searchRouter – enriched results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getAllCategories).mockResolvedValue([
      { id: 1, name: "Administratif", slug: "admin", description: null, color: null, icon: null, sortOrder: 1, createdAt: new Date() },
    ]);
  });

  it("retourne les métadonnées complètes d'un document", async () => {
    vi.mocked(db.getAllMembers).mockResolvedValue([]);
    vi.mocked(db.getAllDocuments).mockResolvedValue([
      {
        id: 1,
        title: "Rapport Annuel 2024",
        description: "Rapport financier détaillé de l'exercice 2024",
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
        dueDate: new Date("2024-12-31"),
        isArchived: false,
      },
    ]);

    const caller = searchRouter.createCaller(mockCtx);
    const result = await caller.global({ query: "rapport" });

    expect(result.results).toHaveLength(1);
    const doc = result.results[0];
    expect(doc?.type).toBe("document");
    expect(doc?.meta.status).toBe("completed");
    expect(doc?.meta.priority).toBe("high");
    expect(doc?.meta.category).toBe("Administratif");
    expect(doc?.meta.fileType).toBe("pdf");
    expect(doc?.meta.dueDate).toBeTruthy();
  });

  it("retourne un extrait (snippet) avec le terme recherché", async () => {
    vi.mocked(db.getAllMembers).mockResolvedValue([]);
    vi.mocked(db.getAllDocuments).mockResolvedValue([
      {
        id: 2,
        title: "Procès-verbal AG",
        description: "Ce document contient le compte-rendu détaillé de l'assemblée générale annuelle tenue en mars 2024.",
        categoryId: 1,
        status: "pending",
        priority: "medium",
        fileUrl: null,
        fileKey: null,
        fileName: null,
        fileType: null,
        fileSize: null,
        createdBy: 1,
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: null,
        isArchived: false,
      },
    ]);

    const caller = searchRouter.createCaller(mockCtx);
    const result = await caller.global({ query: "assemblée" });

    expect(result.results).toHaveLength(1);
    const doc = result.results[0];
    expect(doc?.snippet).toBeTruthy();
    expect(doc?.snippet?.toLowerCase()).toContain("assemblée");
  });

  it("retourne les métadonnées complètes d'un membre", async () => {
    vi.mocked(db.getAllDocuments).mockResolvedValue([]);
    vi.mocked(db.getAllMembers).mockResolvedValue([
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
        joinedAt: new Date("2022-01-15"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const caller = searchRouter.createCaller(mockCtx);
    const result = await caller.global({ query: "jean" });

    expect(result.results).toHaveLength(1);
    const member = result.results[0];
    expect(member?.type).toBe("member");
    expect(member?.meta.status).toBe("active");
    expect(member?.meta.function).toBe("Président");
    expect(member?.meta.joinedAt).toBeTruthy();
  });

  it("recherche dans la fonction du membre", async () => {
    vi.mocked(db.getAllDocuments).mockResolvedValue([]);
    vi.mocked(db.getAllMembers).mockResolvedValue([
      {
        id: 1,
        firstName: "Marie",
        lastName: "Martin",
        email: "marie@example.com",
        phone: "0687654321",
        role: "member",
        status: "active",
        userId: 2,
        function: "Trésorière",
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const caller = searchRouter.createCaller(mockCtx);
    const result = await caller.global({ query: "trésorière" });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.meta.function).toBe("Trésorière");
  });

  it("retourne les résultats exacts en premier", async () => {
    vi.mocked(db.getAllMembers).mockResolvedValue([]);
    vi.mocked(db.getAllDocuments).mockResolvedValue([
      {
        id: 1, title: "Rapport Annuel", description: "Rapport de l'exercice",
        categoryId: 1, status: "completed", priority: "high",
        fileUrl: null, fileKey: null, fileName: null, fileType: null, fileSize: null,
        createdBy: 1, updatedBy: 1, createdAt: new Date(), updatedAt: new Date(),
        dueDate: null, isArchived: false,
      },
      {
        id: 2, title: "Bilan du Rapport Trimestriel", description: "Rapport partiel",
        categoryId: 1, status: "pending", priority: "medium",
        fileUrl: null, fileKey: null, fileName: null, fileType: null, fileSize: null,
        createdBy: 1, updatedBy: 1, createdAt: new Date(), updatedAt: new Date(),
        dueDate: null, isArchived: false,
      },
    ]);

    const caller = searchRouter.createCaller(mockCtx);
    const result = await caller.global({ query: "rapport" });

    // "Rapport Annuel" commence par "rapport" → doit être en premier
    expect(result.results[0]?.title).toBe("Rapport Annuel");
  });

  it("retourne zéro résultat pour une requête sans correspondance", async () => {
    vi.mocked(db.getAllMembers).mockResolvedValue([]);
    vi.mocked(db.getAllDocuments).mockResolvedValue([]);

    const caller = searchRouter.createCaller(mockCtx);
    const result = await caller.global({ query: "zzznomatch" });

    expect(result.results).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
