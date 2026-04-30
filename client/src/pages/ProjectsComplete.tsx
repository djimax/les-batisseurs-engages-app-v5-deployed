import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Edit2, Trash2, Archive, Filter, Download, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Project = any;
type SortField = "name" | "startDate" | "endDate" | "budget" | "progress" | "status";
type SortOrder = "asc" | "desc";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  archived: "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function ProjectsComplete() {
  const { data: projects = [], isLoading } = trpc.projects.list.useQuery();
  const [view, setView] = useState<"summary" | "table" | "gantt">("summary");
  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  
  // Filtres
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterLeader, setFilterLeader] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  // Filtrer les projets
  const filteredProjects = useMemo(() => {
    let result = projects.filter((p: Project) => {
      // Filtre statut
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      
      // Filtre priorité
      if (filterPriority !== "all" && p.priority !== filterPriority) return false;
      
      // Filtre responsable
      if (filterLeader !== "all" && p.leaderId !== parseInt(filterLeader)) return false;
      
      // Filtre recherche
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      // Filtre plage de dates
      if (dateRangeStart && p.startDate < new Date(dateRangeStart)) return false;
      if (dateRangeEnd && p.endDate > new Date(dateRangeEnd)) return false;
      
      return true;
    });

    // Trier
    result.sort((a: Project, b: Project) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [projects, filterStatus, filterPriority, filterLeader, searchTerm, dateRangeStart, dateRangeEnd, sortField, sortOrder]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      active: filteredProjects.filter((p: Project) => p.status === "active").length,
      pending: filteredProjects.filter((p: Project) => p.status === "pending").length,
      completed: filteredProjects.filter((p: Project) => p.status === "completed").length,
      archived: filteredProjects.filter((p: Project) => p.status === "archived").length,
      totalBudget: filteredProjects.reduce((sum: number, p: Project) => sum + (p.budget || 0), 0),
      totalSpent: filteredProjects.reduce((sum: number, p: Project) => sum + (p.spent || 0), 0),
    };
  }, [filteredProjects]);

  // Données pour le graphique donut
  const chartData = [
    { name: "Actifs", value: stats.active, fill: "#10b981" },
    { name: "En attente", value: stats.pending, fill: "#f59e0b" },
    { name: "Complétés", value: stats.completed, fill: "#3b82f6" },
    { name: "Archivés", value: stats.archived, fill: "#d1d5db" },
  ];

  // Données pour le Gantt
  const ganttData = filteredProjects.map((p: Project) => ({
    id: p.id,
    name: p.name,
    start: p.startDate ? new Date(p.startDate).getTime() : Date.now(),
    end: p.endDate ? new Date(p.endDate).getTime() : Date.now(),
    progress: p.progress || 0,
    status: p.status,
  }));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleArchive = async (projectId: number) => {
    try {
      // Appeler l'API pour archiver
      toast.success("Projet archivé avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'archivage");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Chargement des projets...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projets</h1>
          <p className="text-gray-600 mt-1">Gestion complète des projets de l'association</p>
        </div>
        <Button className="gap-2">
          <Plus size={20} />
          Nouveau Projet
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Projets actifs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Complétés</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{stats.archived}</div>
              <div className="text-sm text-gray-600">Archivés</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <Input
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              placeholder="Date début"
            />
            <Input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              placeholder="Date fin"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vues */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Résumé</TabsTrigger>
          <TabsTrigger value="table">Tableau</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
        </TabsList>

        {/* Vue Résumé */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Graphique Donut */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des projets</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Budget */}
            <Card>
              <CardHeader>
                <CardTitle>Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Budget total</div>
                  <div className="text-3xl font-bold">{stats.totalBudget.toLocaleString()} €</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Dépensé</div>
                  <div className="text-3xl font-bold text-orange-600">{stats.totalSpent.toLocaleString()} €</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Restant</div>
                  <div className="text-3xl font-bold text-green-600">
                    {(stats.totalBudget - stats.totalSpent).toLocaleString()} €
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cartes de projets */}
          <div className="grid grid-cols-3 gap-4">
            {filteredProjects.map((project: Project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1">{project.description}</CardDescription>
                    </div>
                    <Badge className={statusColors[project.status]}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Priorité:</span>
                    <Badge className={priorityColors[project.priority]}>
                      {project.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progression:</span>
                    <span className="font-semibold">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-semibold">{(project.budget || 0).toLocaleString()} €</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit2 size={16} />
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Archive size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Vue Tableau */}
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Liste des projets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                        Nom {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-4 py-2 text-left">Statut</th>
                      <th className="px-4 py-2 text-left">Priorité</th>
                      <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("startDate")}>
                        Début {sortField === "startDate" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("endDate")}>
                        Fin {sortField === "endDate" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("progress")}>
                        Progression {sortField === "progress" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("budget")}>
                        Budget {sortField === "budget" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project: Project) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{project.name}</td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[project.status]}>
                            {project.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={priorityColors[project.priority]}>
                            {project.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${project.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-sm">{project.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {(project.budget || 0).toLocaleString()} €
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit2 size={16} />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Archive size={16} />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vue Gantt */}
        <TabsContent value="gantt">
          <Card>
            <CardHeader>
              <CardTitle>Timeline des projets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ganttData.map((item: any) => {
                  const duration = (item.end - item.start) / (1000 * 60 * 60 * 24); // jours
                  const today = new Date().getTime();
                  const daysFromStart = (today - item.start) / (1000 * 60 * 60 * 24);
                  const percentComplete = Math.min(100, Math.max(0, (daysFromStart / duration) * 100));

                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-xs text-gray-600">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className={`h-6 rounded-full flex items-center justify-center text-xs text-white font-semibold transition-all`}
                          style={{
                            width: `${percentComplete}%`,
                            backgroundColor:
                              item.status === "completed"
                                ? "#10b981"
                                : item.status === "active"
                                ? "#3b82f6"
                                : item.status === "pending"
                                ? "#f59e0b"
                                : "#d1d5db",
                          }}
                        >
                          {percentComplete > 10 && `${Math.round(percentComplete)}%`}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{new Date(item.start).toLocaleDateString()}</span>
                        <span>{new Date(item.end).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
