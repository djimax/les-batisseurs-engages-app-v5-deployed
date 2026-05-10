import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const campaignSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  campaignType: z.enum(["email", "sms", "social", "autre"]),
  status: z.enum(["draft", "scheduled", "active", "completed"]).default("draft"),
  targetAudience: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  budget: z.number().optional(),
  goal: z.string().optional(),
});

type Campaign = z.infer<typeof campaignSchema> & { id: number };
const sampleCampaigns: Campaign[] = [
  {
    id: 1,
    title: "Campagne d'adhésion 2025",
    description: "Campagne pour augmenter les adhésions",
    campaignType: "email",
    status: "active",
    targetAudience: "Anciens membres",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-03-31"),
    budget: 500,
    goal: "100 nouvelles adhésions",
  },
  {
    id: 2,
    title: "Appel aux dons",
    description: "Campagne de collecte de fonds",
    campaignType: "social",
    status: "scheduled",
    targetAudience: "Tous",
    startDate: new Date("2025-05-01"),
    endDate: new Date("2025-06-30"),
    budget: 1000,
    goal: "5000 EUR collectés",
  },
];

export const campaignsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
        search: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let filtered = sampleCampaigns;

      if (input.search) {
        filtered = filtered.filter(
          (c) =>
            c.title.toLowerCase().includes(input.search!.toLowerCase()) ||
            c.description?.toLowerCase().includes(input.search!.toLowerCase())
        );
      }

      if (input.status) {
        filtered = filtered.filter((c) => c.status === input.status);
      }

      return filtered.slice(input.offset, input.offset + input.limit);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const campaign = sampleCampaigns.find((c) => c.id === input.id);
      if (!campaign) {
        throw new Error("Campagne non trouvée");
      }
      return campaign;
    }),

  create: protectedProcedure
    .input(campaignSchema)
    .mutation(async ({ input }) => {
      const newCampaign = {
        id: Math.max(...sampleCampaigns.map((c) => c.id), 0) + 1,
        ...input,
      };
      sampleCampaigns.push(newCampaign);
      return { id: newCampaign.id };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), ...campaignSchema.shape }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const index = sampleCampaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new Error("Campagne non trouvée");
      }
      sampleCampaigns[index] = { ...sampleCampaigns[index], ...data };
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const index = sampleCampaigns.findIndex((c) => c.id === input.id);
      if (index === -1) {
        throw new Error("Campagne non trouvée");
      }
      sampleCampaigns.splice(index, 1);
      return { success: true };
    }),

  getActive: protectedProcedure.query(async () => {
    return sampleCampaigns.filter((c) => c.status === "active");
  }),

  getStats: protectedProcedure.query(async () => {
    return {
      total: sampleCampaigns.length,
      active: sampleCampaigns.filter((c) => c.status === "active").length,
      completed: sampleCampaigns.filter((c) => c.status === "completed").length,
      draft: sampleCampaigns.filter((c) => c.status === "draft").length,
    };
  }),
});
