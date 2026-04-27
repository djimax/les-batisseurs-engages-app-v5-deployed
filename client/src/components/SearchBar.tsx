import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Users, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  id: number;
  type: "member" | "document";
  title: string;
  subtitle: string;
  icon: string;
  link: string;
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  // Recherche avec debounce
  const { data: searchData, isLoading } = trpc.search.global.useQuery(
    { query: debouncedQuery, limit: 8 },
    {
      enabled: debouncedQuery.length > 0 && isOpen,
      staleTime: 1000,
    }
  );

  useEffect(() => {
    if (searchData?.results) {
      setResults(searchData.results);
      setSelectedIndex(0);
    }
  }, [searchData]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K ou Ctrl+K pour ouvrir la recherche
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }

      // Fermer avec Escape
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }

      // Navigation au clavier
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

  // Fermer quand on clique en dehors
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
    // Naviguer vers la liste plutôt que vers le détail
    if (result.type === "member") {
      navigate("/members");
    } else if (result.type === "document") {
      navigate("/documents");
    }
    setIsOpen(false);
    setQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "member":
        return <Users className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

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
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Résultats de recherche */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-input rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {query.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Tapez pour rechercher des membres ou des documents
            </div>
          ) : isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé pour "{query}"
            </div>
          ) : (
            <div className="divide-y">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelectResult(result)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-start gap-3",
                    index === selectedIndex && "bg-accent"
                  )}
                >
                  <div className="mt-1 text-muted-foreground flex-shrink-0">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {result.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {result.type === "member" ? "Membre" : "Document"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
