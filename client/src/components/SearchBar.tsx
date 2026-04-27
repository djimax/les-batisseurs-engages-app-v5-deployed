import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Users, Loader2, Calendar, Tag, AlertCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

// ---- Types ----
interface ResultMeta {
  status: string | null;
  priority: string | null;
  category: string | null;
  dueDate: string | null;
  fileType: string | null;
  role: string | null;
  function: string | null;
  joinedAt: string | null;
}

interface SearchResult {
  id: number;
  type: "member" | "document";
  title: string;
  subtitle: string;
  snippet: string | null;
  meta: ResultMeta;
  link: string;
}

// ---- Helpers de mise en évidence ----
function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// ---- Badges statut / priorité ----
const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  completed: { label: 'Complété', className: 'bg-green-100 text-green-700' },
  in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-700' },
  pending: { label: 'En attente', className: 'bg-orange-100 text-orange-700' },
  active: { label: 'Actif', className: 'bg-green-100 text-green-700' },
  inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-600' },
};

const PRIORITY_LABELS: Record<string, { label: string; className: string }> = {
  high: { label: 'Haute', className: 'bg-red-100 text-red-700' },
  medium: { label: 'Moyenne', className: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Basse', className: 'bg-gray-100 text-gray-600' },
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const s = STATUS_LABELS[status];
  if (!s) return null;
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", s.className)}>
      {s.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return null;
  const p = PRIORITY_LABELS[priority];
  if (!p) return null;
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5", p.className)}>
      <AlertCircle className="h-2.5 w-2.5" />
      {p.label}
    </span>
  );
}

// ---- Composant principal ----
export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const { data: searchData, isLoading } = trpc.search.global.useQuery(
    { query: debouncedQuery, limit: 8 },
    {
      enabled: debouncedQuery.length > 0 && isOpen,
      staleTime: 1000,
    }
  );

  useEffect(() => {
    if (searchData?.results) {
      setResults(searchData.results as SearchResult[]);
      setSelectedIndex(0);
    }
  }, [searchData]);

  // Raccourcis clavier globaux
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
      if (isOpen && results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleSelectResult(results[selectedIndex]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Fermeture au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.type === "member" ? "/members" : "/documents");
    setIsOpen(false);
    setQuery("");
  };

  // Séparer membres et documents pour l'affichage groupé
  const memberResults = results.filter((r) => r.type === "member");
  const documentResults = results.filter((r) => r.type === "document");

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Barre de recherche */}
      <div
        className={cn(
          "relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
          isOpen
            ? "border-primary bg-background ring-2 ring-primary/20"
            : "border-input bg-muted/50 hover:bg-muted"
        )}
      >
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher... (Cmd+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Panneau de résultats */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-input rounded-xl shadow-xl z-50 max-h-[520px] overflow-y-auto">
          {query.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Tapez pour rechercher des membres ou des documents</p>
              <p className="text-xs mt-1 opacity-60">Utilisez <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑</kbd> <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↓</kbd> pour naviguer, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Entrée</kbd> pour sélectionner</p>
            </div>
          ) : isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-2">Recherche en cours…</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Aucun résultat pour <strong>"{query}"</strong></p>
            </div>
          ) : (
            <div className="py-2">
              {/* Groupe Membres */}
              {memberResults.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    Membres ({memberResults.length})
                  </div>
                  {memberResults.map((result, idx) => {
                    const globalIdx = results.indexOf(result);
                    return (
                      <button
                        key={`member-${result.id}`}
                        onClick={() => handleSelectResult(result)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-accent transition-colors",
                          globalIdx === selectedIndex && "bg-accent"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground">
                              {highlight(result.title, query)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {highlight(result.subtitle, query)}
                            </div>
                            {/* Métadonnées membres */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <StatusBadge status={result.meta.status} />
                              {result.meta.function && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Tag className="h-2.5 w-2.5" />
                                  {result.meta.function}
                                </span>
                              )}
                              {result.meta.joinedAt && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Calendar className="h-2.5 w-2.5" />
                                  Depuis le {result.meta.joinedAt}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Séparateur si les deux groupes sont présents */}
              {memberResults.length > 0 && documentResults.length > 0 && (
                <div className="border-t border-border mx-4 my-1" />
              )}

              {/* Groupe Documents */}
              {documentResults.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    Documents ({documentResults.length})
                  </div>
                  {documentResults.map((result) => {
                    const globalIdx = results.indexOf(result);
                    return (
                      <button
                        key={`document-${result.id}`}
                        onClick={() => handleSelectResult(result)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-accent transition-colors",
                          globalIdx === selectedIndex && "bg-accent"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground">
                              {highlight(result.title, query)}
                            </div>
                            {/* Catégorie */}
                            {result.meta.category && (
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {result.meta.category}
                              </div>
                            )}
                            {/* Extrait de description avec mise en évidence */}
                            {result.snippet && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                {highlight(result.snippet, query)}
                              </p>
                            )}
                            {/* Badges statut, priorité, date */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <StatusBadge status={result.meta.status} />
                              <PriorityBadge priority={result.meta.priority} />
                              {result.meta.dueDate && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  Échéance : {result.meta.dueDate}
                                </span>
                              )}
                              {result.meta.fileType && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase font-mono">
                                  {result.meta.fileType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-border px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Échap</kbd> pour fermer
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
