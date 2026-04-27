import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getAllMembers, getAllDocuments } from "../db";

export const searchRouter = router({
  global: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().int().positive().default(10),
      })
    )
    .query(async ({ input }) => {
      const query = input.query.toLowerCase();
      const limit = input.limit;

      try {
        // Récupérer tous les membres et documents
        const members = await getAllMembers();
        const documents = await getAllDocuments();

        // Filtrer les membres par nom, email ou téléphone
        const matchedMembers = (members || [])
          .filter((member) => {
            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
            const email = (member.email || '').toLowerCase();
            const phone = (member.phone || '').toLowerCase();
            
            return (
              fullName.includes(query) ||
              email.includes(query) ||
              phone.includes(query)
            );
          })
          .slice(0, limit)
          .map((member) => ({
            id: member.id,
            type: 'member' as const,
            title: `${member.firstName} ${member.lastName}`,
            subtitle: member.email || member.phone || 'N/A',
            icon: 'Users',
            link: `/members/${member.id}`,
          }));

        // Filtrer les documents par titre ou description
        const matchedDocuments = (documents || [])
          .filter((doc) => {
            const title = (doc.title || '').toLowerCase();
            const description = (doc.description || '').toLowerCase();
            
            return title.includes(query) || description.includes(query);
          })
          .slice(0, limit)
          .map((doc) => ({
            id: doc.id,
            type: 'document' as const,
            title: doc.title || 'Sans titre',
            subtitle: doc.description || 'Aucune description',
            icon: 'FileText',
            link: `/documents/${doc.id}`,
          }));

        // Combiner et trier par pertinence (résultats exacts en premier)
        const results = [
          ...matchedMembers.filter((m) => m.title.toLowerCase().startsWith(query)),
          ...matchedDocuments.filter((d) => d.title.toLowerCase().startsWith(query)),
          ...matchedMembers.filter((m) => !m.title.toLowerCase().startsWith(query)),
          ...matchedDocuments.filter((d) => !d.title.toLowerCase().startsWith(query)),
        ].slice(0, limit);

        return {
          results,
          total: results.length,
          query,
        };
      } catch (error) {
        console.error("[Search] Error:", error);
        throw new Error("Erreur lors de la recherche");
      }
    }),
});
