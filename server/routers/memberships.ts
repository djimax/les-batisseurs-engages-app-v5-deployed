import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { adhesions, cotisations, members } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const membershipsRouter = router({
  // ============ LEGACY PROCEDURES (kept for compatibility) ============
  listTypes: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const result = await (db as any).$client.query(`
        SELECT id, name, monthlyAmount, yearlyAmount, benefits, isActive
        FROM membership_types
        WHERE isActive = TRUE
        ORDER BY name
      `);
      return result?.[0] || [];
    } catch (error) {
      console.error("[Memberships] Error listing types:", error);
      return [];
    }
  }),

  listMemberships: protectedProcedure
    .input(z.object({ memberId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const memberFilter = input?.memberId ? `AND memberId = ${input.memberId}` : "";
        const statusFilter = input?.status ? `AND paymentStatus = '${input.status}'` : "";
        
        const result = await (db as any).$client.query(`
          SELECT m.id, m.memberId, m.membershipTypeId, m.startDate, m.endDate, m.amount, 
                 m.paymentStatus, m.paymentDate, mt.name as typeName
          FROM memberships m
          JOIN membership_types mt ON m.membershipTypeId = mt.id
          WHERE 1=1 ${memberFilter} ${statusFilter}
          ORDER BY m.endDate DESC
        `);
        return result?.[0] || [];
      } catch (error) {
        console.error("[Memberships] Error listing:", error);
        return [];
      }
    }),

  createMembership: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        membershipTypeId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        amount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const result = await (db as any).$client.query(`
          INSERT INTO memberships (memberId, membershipTypeId, startDate, endDate, amount, paymentStatus)
          VALUES (${input.memberId}, ${input.membershipTypeId}, '${input.startDate}', '${input.endDate}', ${input.amount}, 'pending')
        `);
        return { success: true, id: result?.[0]?.insertId };
      } catch (error) {
        console.error("[Memberships] Error creating:", error);
        throw error;
      }
    }),

  recordContribution: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        amount: z.number(),
        contributionDate: z.string(),
        paymentMethod: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const result = await (db as any).$client.query(`
          INSERT INTO contributions (memberId, amount, contributionDate, paymentMethod, status)
          VALUES (${input.memberId}, ${input.amount}, '${input.contributionDate}', '${input.paymentMethod || ""}', 'completed')
        `);
        return { success: true, id: result?.[0]?.insertId };
      } catch (error) {
        console.error("[Memberships] Error recording contribution:", error);
        throw error;
      }
    }),

  // ============ NEW PROCEDURES FOR ADHESIONS ============
  listAdhesions: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "expired", "pending"]).optional(),
        year: z.number().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        let query = db
          .select({
            adhesion: adhesions,
            member: members,
          })
          .from(adhesions)
          .innerJoin(members, eq(adhesions.memberId, members.id));

        if (input.status) {
          query = query.where(eq(adhesions.status, input.status)) as any;
        }

        if (input.year) {
          query = query.where(eq(adhesions.annee, input.year)) as any;
        }

        const results = await query.limit(input.limit).offset(input.offset);

        return results.map((r) => ({
          ...r.adhesion,
          memberName: `${r.member.firstName} ${r.member.lastName}`,
          memberEmail: r.member.email,
          memberStatus: r.member.status,
        }));
      } catch (error) {
        console.error("[Memberships] Error listing adhesions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to list adhesions`,
        });
      }
    }),

  getAdhesionStats: protectedProcedure
    .input(z.object({ year: z.number().optional() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const year = input.year || new Date().getFullYear();

        const allAdhesions = await db
          .select()
          .from(adhesions)
          .where(eq(adhesions.annee, year));

        const active = allAdhesions.filter((a) => a.status === "active").length;
        const expired = allAdhesions.filter((a) => a.status === "expired").length;
        const pending = allAdhesions.filter((a) => a.status === "pending").length;
        const totalAmount = allAdhesions.reduce(
          (sum, a) => sum + (typeof a.montant === "number" ? a.montant : 0),
          0
        );

        return {
          year,
          total: allAdhesions.length,
          active,
          expired,
          pending,
          totalAmount,
          averageAmount: allAdhesions.length > 0 ? totalAmount / allAdhesions.length : 0,
        };
      } catch (error) {
        console.error("[Memberships] Error getting adhesion stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get adhesion stats`,
        });
      }
    }),

  createAdhesion: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        annee: z.number(),
        montant: z.number().positive(),
        dateAdhesion: z.date(),
        dateExpiration: z.date(),
        status: z.enum(["active", "expired", "pending"]).default("pending"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(adhesions).values({
          memberId: input.memberId,
          annee: input.annee,
          montant: input.montant.toString(),
          dateAdhesion: input.dateAdhesion,
          dateExpiration: input.dateExpiration,
          status: input.status,
        });

        return { success: true, id: result[0] };
      } catch (error) {
        console.error("[Memberships] Error creating adhesion:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create adhesion`,
        });
      }
    }),

  updateAdhesionStatus: protectedProcedure
    .input(
      z.object({
        adhesionId: z.number(),
        status: z.enum(["active", "expired", "pending"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(adhesions)
          .set({ status: input.status })
          .where(eq(adhesions.id, input.adhesionId));

        return { success: true };
      } catch (error) {
        console.error("[Memberships] Error updating adhesion:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update adhesion`,
        });
      }
    }),

  // ============ NEW PROCEDURES FOR COTISATIONS ============
  listCotisations: protectedProcedure
    .input(
      z.object({
        status: z.enum(["payée", "en attente", "en retard"]).optional(),
        memberId: z.number().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        let query = db
          .select({
            cotisation: cotisations,
            member: members,
          })
          .from(cotisations)
          .innerJoin(members, eq(cotisations.memberId, members.id));

        if (input.status) {
          query = query.where(eq(cotisations.statut, input.status)) as any;
        }

        if (input.memberId) {
          query = query.where(eq(cotisations.memberId, input.memberId)) as any;
        }

        const results = await query.limit(input.limit).offset(input.offset);

        return results.map((r) => ({
          ...r.cotisation,
          memberName: `${r.member.firstName} ${r.member.lastName}`,
          memberEmail: r.member.email,
          memberStatus: r.member.status,
        }));
      } catch (error) {
        console.error("[Memberships] Error listing cotisations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to list cotisations`,
        });
      }
    }),

  getCotisationsStats: protectedProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allCotisations = await db.select().from(cotisations);

      const paid = allCotisations.filter((c) => c.statut === "payée").length;
      const pending = allCotisations.filter((c) => c.statut === "en attente").length;
      const overdue = allCotisations.filter((c) => c.statut === "en retard").length;
      const totalAmount = allCotisations.reduce(
        (sum, c) => sum + (typeof c.montant === "number" ? c.montant : 0),
        0
      );
      const paidAmount = allCotisations
        .filter((c) => c.statut === "payée")
        .reduce((sum, c) => sum + (typeof c.montant === "number" ? c.montant : 0), 0);

      return {
        total: allCotisations.length,
        paid,
        pending,
        overdue,
        totalAmount,
        paidAmount,
        collectionRate: allCotisations.length > 0 ? (paid / allCotisations.length) * 100 : 0,
      };
    } catch (error) {
      console.error("[Memberships] Error getting cotisations stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get cotisations stats`,
      });
    }
  }),

  createCotisation: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        montant: z.number().positive(),
        dateDebut: z.date(),
        dateFin: z.date(),
        statut: z.enum(["payée", "en attente", "en retard"]).default("en attente"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(cotisations).values({
          memberId: input.memberId,
          montant: input.montant.toString(),
          dateDebut: input.dateDebut,
          dateFin: input.dateFin,
          statut: input.statut,
          notes: input.notes,
        });

        return { success: true, id: result[0] };
      } catch (error) {
        console.error("[Memberships] Error creating cotisation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create cotisation`,
        });
      }
    }),

  updateCotisationStatus: protectedProcedure
    .input(
      z.object({
        cotisationId: z.number(),
        statut: z.enum(["payée", "en attente", "en retard"]),
        datePayment: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const updateData: any = { statut: input.statut };
        if (input.datePayment && input.statut === "payée") {
          updateData.datePayment = input.datePayment;
        }

        await db
          .update(cotisations)
          .set(updateData)
          .where(eq(cotisations.id, input.cotisationId));

        return { success: true };
      } catch (error) {
        console.error("[Memberships] Error updating cotisation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update cotisation`,
        });
      }
    }),

  getOverdueCotisations: protectedProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const overdue = await db
        .select({
          cotisation: cotisations,
          member: members,
        })
        .from(cotisations)
        .innerJoin(members, eq(cotisations.memberId, members.id))
        .where(eq(cotisations.statut, "en retard"));

      return overdue.map((r) => ({
        ...r.cotisation,
        memberName: `${r.member.firstName} ${r.member.lastName}`,
        memberEmail: r.member.email,
        daysOverdue: Math.floor(
          (Date.now() - new Date(r.cotisation.dateFin).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));
    } catch (error) {
      console.error("[Memberships] Error getting overdue cotisations:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get overdue cotisations`,
      });
    }
  }),
});
