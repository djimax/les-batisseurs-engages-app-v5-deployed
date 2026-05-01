import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Users } from "lucide-react";
import { toast } from "sonner";

export default function Memberships() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("adhesions");

  // Récupérer les données d'adhésions
  const { data: adhesions, isLoading: adhesionsLoading } = trpc.memberships.listAdhesions.useQuery({
    year: selectedYear,
    limit: 100,
  });

  const { data: adhesionStats } = trpc.memberships.getAdhesionStats.useQuery({
    year: selectedYear,
  });

  // Récupérer les données de cotisations
  const { data: cotisations, isLoading: cotisationsLoading } = trpc.memberships.listCotisations.useQuery({
    limit: 100,
  });

  const { data: cotisationsStats } = trpc.memberships.getCotisationsStats.useQuery();
  const { data: overdueCotisations } = trpc.memberships.getOverdueCotisations.useQuery();

  // Mutations
  const updateAdhesionStatus = trpc.memberships.updateAdhesionStatus.useMutation();
  const updateCotisationStatus = trpc.memberships.updateCotisationStatus.useMutation();

  const handleMarkAdhesionActive = (adhesionId: number) => {
    updateAdhesionStatus.mutate(
      { adhesionId, status: "active" },
      {
        onSuccess: () => {
          toast.success("Adhésion activée");
        },
        onError: (error) => {
          toast.error("Erreur lors de l'activation");
        },
      }
    );
  };

  const handleMarkCotisationPaid = (cotisationId: number) => {
    updateCotisationStatus.mutate(
      { cotisationId, statut: "payée", datePayment: new Date() },
      {
        onSuccess: () => {
          toast.success("Cotisation marquée comme payée");
        },
        onError: (error) => {
          toast.error("Erreur lors de la mise à jour");
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Actif</Badge>;
      case "expired":
        return <Badge className="bg-red-500">Expiré</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case "payée":
        return <Badge className="bg-green-500">Payée</Badge>;
      case "en attente":
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case "en retard":
        return <Badge className="bg-red-500">En retard</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Adhésions & Cotisations</h1>
          <p className="text-muted-foreground mt-2">Gérez les adhésions et cotisations des membres</p>
        </div>
        <Button className="bg-primary gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle adhésion
        </Button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Adhésions actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adhesionStats?.active || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Année {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cotisations payées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cotisationsStats?.paid || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Taux: {(cotisationsStats?.collectionRate || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cotisations en retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{cotisationsStats?.overdue || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">À relancer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Montant collecté</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(cotisationsStats?.paidAmount || 0).toFixed(0)} FCFA</div>
            <p className="text-xs text-muted-foreground mt-1">Total: {(cotisationsStats?.totalAmount || 0).toFixed(0)} FCFA</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="adhesions">Adhésions</TabsTrigger>
          <TabsTrigger value="cotisations">Cotisations</TabsTrigger>
          <TabsTrigger value="overdue">En retard ({overdueCotisations?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Onglet Adhésions */}
        <TabsContent value="adhesions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Adhésions {selectedYear}</CardTitle>
                  <CardDescription>Liste des adhésions pour l'année sélectionnée</CardDescription>
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border rounded-md"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {adhesionsLoading ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : adhesions && adhesions.length > 0 ? (
                <div className="space-y-3">
                  {adhesions.map((adhesion: any) => (
                    <div key={adhesion.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{adhesion.memberName}</p>
                        <p className="text-sm text-muted-foreground">{adhesion.memberEmail}</p>
                        <p className="text-sm mt-1">
                          Montant: <span className="font-semibold">{adhesion.montant} FCFA</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(adhesion.status)}
                        {adhesion.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAdhesionActive(adhesion.id)}
                          >
                            Activer
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune adhésion</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Cotisations */}
        <TabsContent value="cotisations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cotisations</CardTitle>
              <CardDescription>Liste de toutes les cotisations</CardDescription>
            </CardHeader>
            <CardContent>
              {cotisationsLoading ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : cotisations && cotisations.length > 0 ? (
                <div className="space-y-3">
                  {cotisations.map((cotisation: any) => (
                    <div key={cotisation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{cotisation.memberName}</p>
                        <p className="text-sm text-muted-foreground">{cotisation.memberEmail}</p>
                        <p className="text-sm mt-1">
                          Montant: <span className="font-semibold">{cotisation.montant} FCFA</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Période: {new Date(cotisation.dateDebut).toLocaleDateString("fr-FR")} - {new Date(cotisation.dateFin).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(cotisation.statut)}
                        {cotisation.statut !== "payée" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkCotisationPaid(cotisation.id)}
                          >
                            Marquer payée
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune cotisation</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet En retard */}
        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Cotisations en retard
              </CardTitle>
              <CardDescription>Cotisations à relancer</CardDescription>
            </CardHeader>
            <CardContent>
              {overdueCotisations && overdueCotisations.length > 0 ? (
                <div className="space-y-3">
                  {overdueCotisations.map((cotisation: any) => (
                    <div key={cotisation.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex-1">
                        <p className="font-medium">{cotisation.memberName}</p>
                        <p className="text-sm text-muted-foreground">{cotisation.memberEmail}</p>
                        <p className="text-sm mt-1">
                          Montant: <span className="font-semibold">{cotisation.montant} FCFA</span>
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          En retard depuis {cotisation.daysOverdue} jours
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500">En retard</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkCotisationPaid(cotisation.id)}
                        >
                          Marquer payée
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune cotisation en retard</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
