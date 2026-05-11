'use client';

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-purple-100 text-purple-800",
};

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: campaigns = [], isLoading, error } = trpc.campaigns.list.useQuery({
    limit: 100,
    offset: 0,
    search: searchTerm || undefined,
    status: statusFilter,
  });

  const { data: stats } = trpc.campaigns.getStats.useQuery();

  const utils = trpc.useUtils();
  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => {
      toast.success("Campagne supprimée");
      utils.campaigns.list.invalidate();
      utils.campaigns.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const searchMatch =
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return searchMatch;
    });
  }, [campaigns, searchTerm]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Erreur lors du chargement des campagnes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campagnes</h1>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      {stats && (
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
              <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Complétées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Rechercher une campagne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === undefined ? "default" : "outline"}
            onClick={() => setStatusFilter(undefined)}
          >
            Toutes
          </Button>
          {(["draft", "scheduled", "active", "completed"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === "draft" ? "Brouillons" : status === "scheduled" ? "Programmées" : status === "active" ? "Actives" : "Complétées"}
            </Button>
          ))}
        </div>
      </div>

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
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Aucune campagne trouvée
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{campaign.title}</CardTitle>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${STATUS_COLORS[campaign.status as keyof typeof STATUS_COLORS]}`}>
                        {campaign.status === "draft" ? "Brouillon" : campaign.status === "scheduled" ? "Programmée" : campaign.status === "active" ? "Active" : "Complétée"}
                      </span>
                    </div>
                    {campaign.description && (
                      <CardDescription className="mt-1">{campaign.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(campaign.id);
                        setIsCreateOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate({ id: campaign.id })}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {campaign.targetAudience && (
                    <div>
                      <div className="text-gray-600">Audience</div>
                      <div className="font-medium">{campaign.targetAudience}</div>
                    </div>
                  )}
                  {campaign.budget && (
                    <div>
                      <div className="text-gray-600">Budget</div>
                      <div className="font-medium">{campaign.budget} EUR</div>
                    </div>
                  )}
                  {campaign.goal && (
                    <div>
                      <div className="text-gray-600">Objectif</div>
                      <div className="font-medium">{campaign.goal}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-gray-600">Type</div>
                    <div className="font-medium capitalize">{campaign.campaignType}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
