import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const adhesionSchema = z.object({
  memberId: z.number(),
  adhesionType: z.enum(["simple", "benefacteur", "partenaire"]),
  startDate: z.date(),
  endDate: z.date().optional(),
  amount: z.number().min(0),
  status: z.enum(["active", "expired", "cancelled"]).default("active"),
  notes: z.string().optional(),
});

type Adhesion = z.infer<typeof adhesionSchema> & { id: number };
const sampleAdhesions: Adhesion[] = [
  {
    id: 1,
    memberId: 1,
    adhesionType: "simple",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    amount: 50,
    status: "active",
    notes: "Adhésion annuelle",
  },
  {
    id: 2,
    memberId: 2,
    adhesionType: "benefacteur",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    amount: 200,
    status: "active",
    notes: "Adhésion bénéfacteur",
  },
];

export const adhesionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
        status: z.string().optional(),
        memberId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      let filtered = sampleAdhesions;

      if (input.status) {
        filtered = filtered.filter((a) => a.status === input.status);
      }

      if (input.memberId) {
        filtered = filtered.filter((a) => a.memberId === input.memberId);
      }

      return filtered.slice(input.offset, input.offset + input.limit);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const adhesion = sampleAdhesions.find((a) => a.id === input.id);
      if (!adhesion) {
        throw new Error("Adhésion non trouvée");
      }
      return adhesion;
    }),

  create: protectedProcedure
    .input(adhesionSchema)
    .mutation(async ({ input }) => {
      const newAdhesion = {
        id: Math.max(...sampleAdhesions.map((a) => a.id), 0) + 1,
        ...input,
      };
      sampleAdhesions.push(newAdhesion);
      return { id: newAdhesion.id };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), ...adhesionSchema.shape }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const index = sampleAdhesions.findIndex((a) => a.id === id);
      if (index === -1) {
        throw new Error("Adhésion non trouvée");
      }
      sampleAdhesions[index] = { ...sampleAdhesions[index], ...data };
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const index = sampleAdhesions.findIndex((a) => a.id === input.id);
      if (index === -1) {
        throw new Error("Adhésion non trouvée");
      }
      sampleAdhesions.splice(index, 1);
      return { success: true };
    }),

  getByMember: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ input }) => {
      return sampleAdhesions.filter((a) => a.memberId === input.memberId);
    }),

  getStats: protectedProcedure.query(async () => {
    return {
      total: sampleAdhesions.length,
      active: sampleAdhesions.filter((a) => a.status === "active").length,
      expired: sampleAdhesions.filter((a) => a.status === "expired").length,
      cancelled: sampleAdhesions.filter((a) => a.status === "cancelled").length,
      totalRevenue: sampleAdhesions.reduce((sum, a) => sum + a.amount, 0),
    };
  }),
});
