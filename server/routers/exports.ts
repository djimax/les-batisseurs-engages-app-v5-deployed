import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { eq, sql } from "drizzle-orm";
import { members, cotisations, depenses, projects } from "../../drizzle/schema";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

/**
 * Router for exporting data to PDF and Excel formats
 */
export const exportsRouter = router({
  /**
   * Export members list to Excel
   */
  exportMembersExcel: protectedProcedure
    .input(z.object({
      format: z.enum(["xlsx", "csv"]).default("xlsx"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection failed");
        }

        // Fetch all members with their memberships
        const membersData = await db.select().from(members).limit(1000);

        // Prepare data for export
        const exportData = membersData.map((member) => ({
          "ID": member.id,
          "Nom": `${member.firstName} ${member.lastName}`,
          "Email": member.email || "-",
          "Téléphone": member.phone || "-",
          "Rôle": member.role || "-",
          "Statut": member.status || "Actif",
          "Date d'adhésion": member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("fr-FR") : "-",
          "Dernière mise à jour": member.updatedAt ? new Date(member.updatedAt).toLocaleDateString("fr-FR") : "-",
        }));

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Adhérents");

        // Set column widths
        ws["!cols"] = [
          { wch: 8 },
          { wch: 20 },
          { wch: 25 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
        ];

        // Generate buffer
        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

        return {
          success: true,
          data: buffer.toString("base64"),
          filename: `adhérents-${new Date().toISOString().split("T")[0]}.xlsx`,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      } catch (error) {
        console.error("[Export] Members Excel failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to export members: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Export members list to PDF
   */
  exportMembersPDF: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database connection failed");
      }

      // Fetch all members
      const membersData = await db.select().from(members).limit(1000);

      // Create PDF
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Liste des Adhérents", 14, 15);
      doc.setFontSize(10);
      doc.text(`Généré le: ${new Date().toLocaleDateString("fr-FR")}`, 14, 25);

      // Prepare table data
      const tableData = membersData.map((member) => [
        `${member.firstName} ${member.lastName}`,
        member.email || "-",
        member.phone || "-",
        member.role || "-",
        member.status || "Actif",
      ]);

      // Add table
      (doc as any).autoTable({
        head: [["Nom", "Email", "Téléphone", "Rôle", "Statut"]],
        body: tableData,
        startY: 35,
        margin: { top: 35, right: 14, bottom: 14, left: 14 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });

      // Generate buffer
      const buffer = doc.output("arraybuffer");

      return {
        success: true,
        data: Buffer.from(buffer).toString("base64"),
        filename: `adhérents-${new Date().toISOString().split("T")[0]}.pdf`,
        contentType: "application/pdf",
      };
    } catch (error) {
      console.error("[Export] Members PDF failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to export members PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }),

  /**
   * Export financial report to Excel
   */
  exportFinancialReportExcel: protectedProcedure
    .input(z.object({
      month: z.number().min(1).max(12),
      year: z.number().min(2000),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0);

        // Fetch financial data
        const monthCotisations = await db
          .select()
          .from(cotisations)
          .where(sql`DATE(${cotisations.createdAt}) BETWEEN ${startDate} AND ${endDate}`);

        const monthDepenses = await db
          .select()
          .from(depenses)
          .where(sql`DATE(${depenses.createdAt}) BETWEEN ${startDate} AND ${endDate}`);

        // Calculate totals
        const totalCotisations = monthCotisations.reduce((sum, c) => sum + (typeof c.montant === 'number' ? c.montant : 0), 0);
        const totalDepenses = monthDepenses.reduce((sum, d) => sum + (typeof d.montant === 'number' ? d.montant : 0), 0);
        const balance = totalCotisations - totalDepenses;

        // Prepare data
        const cotisationsData = monthCotisations.map((c) => ({
          "Type": "Cotisation",
          "Montant": typeof c.montant === 'number' ? c.montant : 0,
          "Statut": c.statut || "en attente",
          "Date": new Date(c.createdAt).toLocaleDateString("fr-FR"),
        }));

        const depensesData = monthDepenses.map((d) => ({
          "Type": "Dépense",
          "Montant": typeof d.montant === 'number' ? d.montant : 0,
          "Catégorie": d.categorie || "Autre",
          "Date": new Date(d.createdAt).toLocaleDateString("fr-FR"),
        }));

        // Create workbook
        const ws1 = XLSX.utils.json_to_sheet([
          { "Rapport Financier": `${input.month}/${input.year}` },
          {},
          { "Total Cotisations": totalCotisations },
          { "Total Dépenses": totalDepenses },
          { "Solde": balance },
        ]);

        const ws2 = XLSX.utils.json_to_sheet(cotisationsData);
        const ws3 = XLSX.utils.json_to_sheet(depensesData);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, "Résumé");
        XLSX.utils.book_append_sheet(wb, ws2, "Cotisations");
        XLSX.utils.book_append_sheet(wb, ws3, "Dépenses");

        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

        return {
          success: true,
          data: buffer.toString("base64"),
          filename: `rapport-financier-${input.month}-${input.year}.xlsx`,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      } catch (error) {
        console.error("[Export] Financial report Excel failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to export financial report: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Export financial report to PDF
   */
  exportFinancialReportPDF: protectedProcedure
    .input(z.object({
      month: z.number().min(1).max(12),
      year: z.number().min(2000),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0);

        // Fetch financial data
        const monthCotisations = await db
          .select()
          .from(cotisations)
          .where(sql`DATE(${cotisations.createdAt}) BETWEEN ${startDate} AND ${endDate}`);

        const monthDepenses = await db
          .select()
          .from(depenses)
          .where(sql`DATE(${depenses.createdAt}) BETWEEN ${startDate} AND ${endDate}`);

        // Calculate totals
        const totalCotisations = monthCotisations.reduce((sum, c) => sum + (typeof c.montant === 'number' ? c.montant : 0), 0);
        const totalDepenses = monthDepenses.reduce((sum, d) => sum + (typeof d.montant === 'number' ? d.montant : 0), 0);
        const balance = totalCotisations - totalDepenses;

        // Create PDF
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Rapport Financier - ${input.month}/${input.year}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Généré le: ${new Date().toLocaleDateString("fr-FR")}`, 14, 25);

        // Summary section
        doc.setFontSize(12);
        doc.text("Résumé Financier", 14, 35);
        doc.setFontSize(10);
        doc.text(`Total Cotisations: ${(totalCotisations as number).toFixed(2)} FCFA`, 14, 45);
        doc.text(`Total Dépenses: ${(totalDepenses as number).toFixed(2)} FCFA`, 14, 55);
        doc.text(`Solde: ${(balance as number).toFixed(2)} FCFA`, 14, 65);

        // Cotisations table
        const cotisationsTableData = monthCotisations.map((c) => [
          new Date(c.createdAt).toLocaleDateString("fr-FR"),
          typeof c.montant === 'number' ? (c.montant as number).toFixed(2) : "0.00",
          c.statut || "en attente",
        ]);

        (doc as any).autoTable({
          head: [["Date", "Montant", "Statut"]],
          body: cotisationsTableData,
          startY: 75,
          margin: { top: 75, right: 14, bottom: 14, left: 14 },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
        });

        // Dépenses table
        const depensesTableData = monthDepenses.map((d) => [
          new Date(d.createdAt).toLocaleDateString("fr-FR"),
          d.categorie || "Autre",
          typeof d.montant === 'number' ? (d.montant as number).toFixed(2) : "0.00",
        ]);

        const finalY = (doc as any).lastAutoTable.finalY || 150;
        (doc as any).autoTable({
          head: [["Date", "Catégorie", "Montant"]],
          body: depensesTableData,
          startY: finalY + 10,
          margin: { top: finalY + 10, right: 14, bottom: 14, left: 14 },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [220, 53, 69], textColor: 255, fontStyle: "bold" },
        });

        const buffer = doc.output("arraybuffer");

        return {
          success: true,
          data: Buffer.from(buffer).toString("base64"),
          filename: `rapport-financier-${input.month}-${input.year}.pdf`,
          contentType: "application/pdf",
        };
      } catch (error) {
        console.error("[Export] Financial report PDF failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to export financial report PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Export projects budget report to Excel
   */
  exportProjectsBudgetExcel: protectedProcedure.mutation(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Fetch all projects
      const allProjects = await db.select().from(projects);

      // Prepare data
      const exportData = allProjects.map((project) => ({
        "Nom": project.name || "-",
        "Statut": project.status || "-",
        "Budget Alloué": typeof project.budget === 'number' ? project.budget : 0,
        "Dépenses": typeof project.spent === 'number' ? project.spent : 0,
        "Restant": typeof project.budget === 'number' && typeof project.spent === 'number' ? project.budget - project.spent : 0,
        "Progression": `${project.progress || 0}%`,
        "Date Début": project.startDate ? new Date(project.startDate).toLocaleDateString("fr-FR") : "-",
        "Date Fin": project.endDate ? new Date(project.endDate).toLocaleDateString("fr-FR") : "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Budgets Projets");

      ws["!cols"] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
      ];

      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      return {
        success: true,
        data: buffer.toString("base64"),
        filename: `budgets-projets-${new Date().toISOString().split("T")[0]}.xlsx`,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    } catch (error) {
      console.error("[Export] Projects budget Excel failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to export projects budget: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }),
});
