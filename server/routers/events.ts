import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const eventSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  location: z.string().optional(),
  eventType: z.enum(["reunion", "formation", "collecte", "autre"]),
  startDate: z.date(),
  endDate: z.date(),
  color: z.string().default("#3b82f6"),
  organizer: z.string().optional(),
  attendees: z.number().int().min(0).optional(),
});

// Données d'exemple en mémoire
type Event = z.infer<typeof eventSchema> & { id: number };
const sampleEvents: Event[] = [
  {
    id: 1,
    title: "Réunion mensuelle",
    description: "Réunion du bureau de l'association",
    location: "Salle de réunion",
    eventType: "reunion",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    color: "#3b82f6",
    organizer: "Admin",
    attendees: 12,
  },
  {
    id: 2,
    title: "Formation Excel",
    description: "Formation sur les bases d'Excel",
    location: "Salle informatique",
    eventType: "formation",
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
    color: "#10b981",
    organizer: "Secrétaire",
    attendees: 8,
  },
];

export const eventsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
        search: z.string().optional(),
        eventType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let filtered = sampleEvents;

      if (input.search) {
        filtered = filtered.filter(
          (e) =>
            e.title.toLowerCase().includes(input.search!.toLowerCase()) ||
            e.description?.toLowerCase().includes(input.search!.toLowerCase())
        );
      }

      if (input.eventType) {
        filtered = filtered.filter((e) => e.eventType === input.eventType);
      }

      return filtered.slice(input.offset, input.offset + input.limit);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const event = sampleEvents.find((e) => e.id === input.id);
      if (!event) {
        throw new Error("Événement non trouvé");
      }
      return event;
    }),

  create: protectedProcedure
    .input(eventSchema)
    .mutation(async ({ input }) => {
      const newEvent = {
        id: Math.max(...sampleEvents.map((e) => e.id), 0) + 1,
        ...input,
      };
      sampleEvents.push(newEvent);
      return { id: newEvent.id };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), ...eventSchema.shape }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const index = sampleEvents.findIndex((e) => e.id === id);
      if (index === -1) {
        throw new Error("Événement non trouvé");
      }
      sampleEvents[index] = { ...sampleEvents[index], ...data };
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const index = sampleEvents.findIndex((e) => e.id === input.id);
      if (index === -1) {
        throw new Error("Événement non trouvé");
      }
      sampleEvents.splice(index, 1);
      return { success: true };
    }),

  getUpcoming: protectedProcedure.query(async () => {
    const now = new Date();
    return sampleEvents
      .filter((e) => e.startDate >= now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 10);
  }),

  getByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return sampleEvents.filter(
        (e) =>
          e.startDate >= input.startDate &&
          e.endDate <= input.endDate
      );
    }),
});
