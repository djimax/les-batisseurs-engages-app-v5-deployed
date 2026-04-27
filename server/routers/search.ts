import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getAllMembers, getAllDocuments, getAllCategories } from "../db";

// Fonction pour extraire un extrait de texte autour du terme recherché
function extractSnippet(text: string, query: string, maxLength = 120): string {
  if (!text) return '';
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return text.slice(0, maxLength) + (text.length > maxLength ? '…' : '');
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 80);
  const snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  return snippet;
}

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
        // Récupérer membres, documents et catégories en parallèle
        const [members, documents, categories] = await Promise.all([
          getAllMembers(),
          getAllDocuments(),
          getAllCategories(),
        ]);

        // Construire un index des catégories pour lookup rapide
        const categoryMap = new Map(
          (categories || []).map((c) => [c.id, c])
        );

        // ---- Membres ----
        const matchedMembers = (members || [])
          .filter((member) => {
            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
            const email = (member.email || '').toLowerCase();
            const phone = (member.phone || '').toLowerCase();
            const fn = (member.function || '').toLowerCase();
            return (
              fullName.includes(query) ||
              email.includes(query) ||
              phone.includes(query) ||
              fn.includes(query)
            );
          })
          .slice(0, limit)
          .map((member) => ({
            id: member.id,
            type: 'member' as const,
            title: `${member.firstName} ${member.lastName}`,
            subtitle: member.email || member.phone || 'N/A',
            snippet: null as string | null,
            // Métadonnées membres
            meta: {
              status: member.status || null,
              role: member.role || null,
              function: member.function || null,
              joinedAt: member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('fr-FR') : null,
              // Champs document — null pour les membres
              priority: null as string | null,
              category: null as string | null,
              dueDate: null as string | null,
              fileType: null as string | null,
            },
            link: `/members`,
          }));

        // ---- Documents ----
        const matchedDocuments = (documents || [])
          .filter((doc) => {
            const title = (doc.title || '').toLowerCase();
            const description = (doc.description || '').toLowerCase();
            return title.includes(query) || description.includes(query);
          })
          .slice(0, limit)
          .map((doc) => {
            const category = doc.categoryId ? categoryMap.get(doc.categoryId) : null;
            return {
              id: doc.id,
              type: 'document' as const,
              title: doc.title || 'Sans titre',
              subtitle: category?.name || 'Document',
              snippet: extractSnippet(doc.description || '', query),
              // Métadonnées documents
              meta: {
                status: doc.status || null,
                priority: doc.priority || null,
                category: category?.name || null,
                dueDate: doc.dueDate ? new Date(doc.dueDate).toLocaleDateString('fr-FR') : null,
                fileType: doc.fileType || null,
                // Champs membres — null pour les documents
                role: null as string | null,
                function: null as string | null,
                joinedAt: null as string | null,
              },
              link: `/documents`,
            };
          });

        // Combiner et trier par pertinence (correspondances exactes en premier)
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
