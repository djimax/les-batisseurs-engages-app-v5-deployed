import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Gift, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FinanceCharts } from "@/components/FinanceCharts";
import { HeroSection } from "@/components/HeroSection";
import { CotisationFormDialog } from "@/components/CotisationFormDialog";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Finance() {
  const [isCreateCotisationOpen, setIsCreateCotisationOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("date-newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch data from backend
  const { data: cotisations, isLoading: cotisationsLoading } = trpc.memberships.listCotisations.useQuery({
    limit: 1000,
  });
  
  const { data: stats, isLoading: statsLoading } = trpc.finances.stats.useQuery();
  
  const { data: expensesChart, isLoading: expensesChartLoading } = trpc.reports.getExpensesChart.useQuery();
  
  const { data: cotisationsChart, isLoading: cotisationsChartLoading } = trpc.reports.getCotisationsChart.useQuery();

  // Mutations
  const updateCotisationStatus = trpc.memberships.updateCotisationStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut de cotisation mis à jour");
      trpc.useUtils().memberships.listCotisations.invalidate();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Format data for charts
  const chartData = useMemo(() => {
    const expensesByCategory = expensesChart?.map((item: any) => ({
      category: item.name,
      amount: item.value,
    })) || [];

    return {
      expensesByCategory,
      monthlyData: [],
      balanceHistory: [],
    };
  }, [expensesChart]);

  // Sort and paginate cotisations
  const sortedCotisations = useMemo(() => {
    if (!cotisations) return [];
    
    let sorted = [...cotisations];
    
    if (sortBy === "date-newest") {
      sorted.sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime());
    } else if (sortBy === "date-oldest") {
      sorted.sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
    } else if (sortBy === "amount-high") {
      sorted.sort((a, b) => parseFloat(String(b.montant)) - parseFloat(String(a.montant)));
    } else if (sortBy === "amount-low") {
      sorted.sort((a, b) => parseFloat(String(a.montant)) - parseFloat(String(b.montant)));
    }
    
    return sorted;
  }, [cotisations, sortBy]);

  const paginatedCotisations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedCotisations.slice(start, start + itemsPerPage);
  }, [sortedCotisations, currentPage]);

  const totalPages = Math.ceil((sortedCotisations.length || 0) / itemsPerPage);

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "payée": "default",
      "en attente": "secondary",
      "en retard": "destructive",
    };
    return variants[statut] || "outline";
  };

  const isLoading = cotisationsLoading || statsLoading;

  return (
    <div className="space-y-6">
      <HeroSection
        title="Gestion Financière"
        subtitle="Suivez les cotisations, dons et dépenses de votre association"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cotisations Collectées</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalCotisations ? `${stats.totalCotisations.toLocaleString('fr-FR')} FCFA` : "0 FCFA"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {cotisations?.length || 0} cotisations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dons Reçus</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalDons ? `${stats.totalDons.toLocaleString('fr-FR')} FCFA` : "0 FCFA"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              0 dons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalDepenses ? `${stats.totalDepenses.toLocaleString('fr-FR')} FCFA` : "0 FCFA"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              0 dépenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solde</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className={`text-2xl font-bold ${(stats?.solde || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats?.solde ? `${stats.solde.toLocaleString('fr-FR')} FCFA` : "0 FCFA"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Bilan financier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {!isLoading && (
        <FinanceCharts
          expensesByCategory={chartData.expensesByCategory}
          monthlyData={chartData.monthlyData}
          balanceHistory={chartData.balanceHistory}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="cotisations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cotisations">Cotisations</TabsTrigger>
          <TabsTrigger value="dons">Dons</TabsTrigger>
          <TabsTrigger value="depenses">Dépenses</TabsTrigger>
        </TabsList>

        {/* Cotisations Tab */}
        <TabsContent value="cotisations" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Label>Trier par</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-newest">Plus récents</SelectItem>
                  <SelectItem value="date-oldest">Plus anciens</SelectItem>
                  <SelectItem value="amount-high">Montant (Élevé)</SelectItem>
                  <SelectItem value="amount-low">Montant (Bas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsCreateCotisationOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une cotisation
            </Button>
          </div>

          {cotisationsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4">Membre</th>
                        <th className="text-left p-4">Montant</th>
                        <th className="text-left p-4">Période</th>
                        <th className="text-left p-4">Statut</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCotisations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-4 text-muted-foreground">
                            Aucune cotisation trouvée
                          </td>
                        </tr>
                      ) : (
                        paginatedCotisations.map(cot => (
                          <tr key={cot.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">{cot.memberName || "N/A"}</td>
                            <td className="p-4 font-medium">{typeof cot.montant === 'number' ? (cot.montant as number).toLocaleString('fr-FR') : cot.montant} FCFA</td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {new Date(cot.dateDebut).toLocaleDateString('fr-FR')} - {new Date(cot.dateFin).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="p-4">
                              <Badge variant={getStatutBadge(cot.statut)}>
                                {cot.statut}
                              </Badge>
                            </td>
                            <td className="p-4">
                              {cot.statut !== "payée" && (
            <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    updateCotisationStatus.mutate({
                      cotisationId: cot.id,
                      statut: "payée",
                    });
                  }}
                  disabled={updateCotisationStatus.isPending}
                >
                  {updateCotisationStatus.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Marquer payée"
                  )}
                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Dons Tab */}
        <TabsContent value="dons" className="space-y-4">
          {false ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4">Donateur</th>
                        <th className="text-left p-4">Montant</th>
                        <th className="text-left p-4">Date</th>
                        <th className="text-left p-4">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="text-center p-4 text-muted-foreground">
                          Fonctionnalité en développement
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dépenses Tab */}
        <TabsContent value="depenses" className="space-y-4">
          {false ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4">Description</th>
                        <th className="text-left p-4">Montant</th>
                        <th className="text-left p-4">Catégorie</th>
                        <th className="text-left p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="text-center p-4 text-muted-foreground">
                          Fonctionnalité en développement
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Cotisation Form Dialog */}
      <CotisationFormDialog
        onSuccess={() => {
          setIsCreateCotisationOpen(false);
          trpc.useUtils().memberships.listCotisations.invalidate();
        }}
      />
    </div>
  );
}
