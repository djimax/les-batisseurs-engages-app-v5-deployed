import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { HeroSection } from "@/components/HeroSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, FileText, Users, Search } from "lucide-react";

export default function SearchResults() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "members" | "documents">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get search term from URL or state
  const urlParams = new URLSearchParams(window.location.search);
  const queryTerm = urlParams.get("q") || searchTerm;

  const { data: results, isLoading, error } = trpc.search.global.useQuery(
    { query: queryTerm },
    { enabled: queryTerm.length > 0 }
  );

  // Filter results by type
  const filteredResults = useMemo(() => {
    if (!results || !results.results) return [];
    
    if (filterType === "members") {
      return results.results.filter((r: any) => r.type === "member");
    } else if (filterType === "documents") {
      return results.results.filter((r: any) => r.type === "document");
    }
    return results.results;
  }, [results, filterType]);

  // Paginate results
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResults.slice(start, start + itemsPerPage);
  }, [filteredResults, currentPage]);

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

  const getResultIcon = (type: string) => {
    switch (type) {
      case "member":
        return <Users className="h-5 w-5 text-blue-500" />;
      case "document":
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <Search className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Actif</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">Inactif</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">En attente</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Complété</Badge>;
      case "in-progress":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">En cours</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection
        title="Résultats de Recherche"
        subtitle="Trouvez rapidement les membres et documents que vous recherchez"
        icon="🔍"
      />

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Affiner votre recherche..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1"
            />
            <Button
              onClick={() => {
                if (searchTerm) {
                  const params = new URLSearchParams();
                  params.set("q", searchTerm);
                  window.history.replaceState({}, "", `?${params.toString()}`);
                }
              }}
            >
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-4 items-center">
        <Select value={filterType} onValueChange={(value: any) => {
          setFilterType(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les résultats</SelectItem>
            <SelectItem value="members">Membres</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {filteredResults.length} résultat{filteredResults.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Erreur lors de la recherche</p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Veuillez réessayer ou contacter l'administrateur
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !queryTerm ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Entrez un terme de recherche pour commencer</p>
          </CardContent>
        </Card>
      ) : filteredResults.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Aucun résultat trouvé pour "{queryTerm}"</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedResults.map((result: any) => (
              <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {getResultIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold truncate">
                          {result.type === "member"
                            ? `${result.firstName} ${result.lastName}`
                            : result.title}
                        </h3>
                        {result.status && getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {result.type === "member"
                          ? result.email || result.role || "Membre"
                          : result.description || result.category}
                      </p>
                      {result.type === "member" && result.phone && (
                        <p className="text-sm text-muted-foreground">{result.phone}</p>
                      )}
                      {result.type === "document" && result.priority && (
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{result.priority}</Badge>
                          {result.category && <Badge variant="outline">{result.category}</Badge>}
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (result.type === "member") {
                          setLocation(`/members`);
                        } else if (result.type === "document") {
                          setLocation(`/documents`);
                        }
                      }}
                    >
                      Voir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={() => {}}
              totalItems={filteredResults.length}
            />
          )}
        </>
      )}
    </div>
  );
}
