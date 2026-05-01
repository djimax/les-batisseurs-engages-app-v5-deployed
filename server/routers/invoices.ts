import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

/**
 * Invoices Router - Manage invoices and billing
 * Note: This router uses mock data since the invoices table is not yet in the Drizzle schema
 */
export const invoicesRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async () => {
      try {
        // Return empty array - table not yet implemented
        return [];
      } catch (error) {
        console.error("[Invoices] Error listing:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list invoices",
        });
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        invoiceNumber: z.string(),
        invoiceDate: z.string(),
        dueDate: z.string(),
        totalAmount: z.number(),
        description: z.string().optional(),
        supplierId: z.number().optional(),
      })
    )
    .mutation(async () => {
      try {
        // Return mock response - table not yet implemented
        return { success: true, id: 1 };
      } catch (error) {
        console.error("[Invoices] Error creating:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create invoice",
        });
      }
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]) }))
    .mutation(async () => {
      try {
        // Return mock response - table not yet implemented
        return { success: true };
      } catch (error) {
        console.error("[Invoices] Error updating status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update invoice status",
        });
      }
    }),
});
