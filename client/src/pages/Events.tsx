'use client';

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, MapPin, Users, Clock, Trash2, Edit2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type FilterType = "all" | "past" | "present" | "future";

const SORT_OPTIONS = [
  { value: "date-asc", label: "Date (Plus anciens)" },
  { value: "date-desc", label: "Date (Plus recents)" },
  { value: "title-asc", label: "Titre (A-Z)" },
  { value: "title-desc", label: "Titre (Z-A)" },
];

export default function Events() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("date-asc");

  // Requête tRPC
  const { data: events = [], isLoading, error } = trpc.events.list.useQuery({
    limit: 100,
    offset: 0,
    search: searchTerm || undefined,
  });

  const utils = trpc.useUtils();
  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Événement supprimé");
      utils.events.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  const now = new Date();

  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const isPast = new Date(event.endDate) < now;
      const isFuture = new Date(event.startDate) > now;
      const isPresent = !isPast && !isFuture;

      let dateMatch = true;
      if (filter === "past") dateMatch = isPast;
      else if (filter === "present") dateMatch = isPresent;
      else if (filter === "future") dateMatch = isFuture;

      const searchMatch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase());

      return dateMatch && searchMatch;
    });

    // Tri
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case "date-desc":
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [events, filter, searchTerm, sortBy]);

  const stats = {
    total: events.length,
    past: events.filter((e) => new Date(e.endDate) < now).length,
    present: events.filter((e) => new Date(e.startDate) <= now && new Date(e.endDate) >= now).length,
    future: events.filter((e) => new Date(e.startDate) > now).length,
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Erreur lors du chargement des événements</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Événements</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel événement
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Passés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.past}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">À venir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.future}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et Recherche */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Rechercher un événement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {(["all", "past", "present", "future"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === "all" ? "Tous" : f === "past" ? "Passés" : f === "present" ? "En cours" : "À venir"}
            </Button>
          ))}
        </div>
      </div>

      {/* Liste des événements */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-6 w-1/3 rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Aucun événement trouvé
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                    </div>
                    {event.description && (
                      <CardDescription className="mt-1">{event.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate({ id: event.id })}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(event.startDate).toLocaleDateString("fr-FR")} -{" "}
                    {new Date(event.endDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.organizer && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Organisateur: {event.organizer}</span>
                  </div>
                )}
                {event.attendees && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{event.attendees} participants</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
