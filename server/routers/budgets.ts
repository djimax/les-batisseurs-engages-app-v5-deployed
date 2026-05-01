import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

/**
 * Budgets Router - Manage project budgets
 * Note: This router uses mock data since the budgets table is not yet fully implemented
 */
export const budgetsRouter = router({
  list: protectedProcedure
    .input(z.object({ year: z.number().optional() }).optional())
    .query(async () => {
      try {
        // Return empty array - table not yet fully implemented
        return [];
      } catch (error) {
        console.error("[Budgets] Error listing:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list budgets",
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async () => {
      try {
        // Return null - table not yet fully implemented
        return null;
      } catch (error) {
        console.error("[Budgets] Error getting by ID:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get budget",
        });
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        year: z.number(),
        totalAmount: z.number(),
      })
    )
    .mutation(async () => {
      try {
        // Return mock response - table not yet fully implemented
        return { success: true, id: 1 };
      } catch (error) {
        console.error("[Budgets] Error creating:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create budget",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        totalAmount: z.number().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async () => {
      try {
        // Return mock response - table not yet fully implemented
        return { success: true };
      } catch (error) {
        console.error("[Budgets] Error updating:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update budget",
        });
      }
    }),
});
