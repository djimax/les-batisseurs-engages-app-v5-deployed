import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";

interface AdhesionFormDialogProps {
  onSuccess?: () => void;
}

export function AdhesionFormDialog({ onSuccess }: AdhesionFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    memberId: "",
    year: new Date().getFullYear().toString(),
    amount: "50",
    status: "pending",
  });

  const createMutation = trpc.memberships.createAdhesion.useMutation({
    onSuccess: () => {
      toast.success("Adhésion créée avec succès");
      setFormData({
        memberId: "",
        year: new Date().getFullYear().toString(),
        amount: "50",
        status: "pending",
      });
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création de l'adhésion");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.memberId) {
      toast.error("Veuillez sélectionner un membre");
      return;
    }

    await createMutation.mutateAsync({
      memberId: parseInt(formData.memberId),
      annee: parseInt(formData.year),
      montant: parseFloat(formData.amount),
      dateAdhesion: new Date(),
      dateExpiration: new Date(new Date().getFullYear() + 1, 0, 1),
      status: formData.status as "pending" | "active" | "expired",
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus size={20} />
        Nouvelle Adhésion
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle adhésion</DialogTitle>
            <DialogDescription>
              Enregistrez une nouvelle adhésion pour un membre.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="memberId">Membre *</Label>
              <Select value={formData.memberId} onValueChange={(value) => setFormData({ ...formData, memberId: value })}>
                <SelectTrigger id="memberId">
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Prisca Kouassi</SelectItem>
                  <SelectItem value="2">Jean Dupont</SelectItem>
                  <SelectItem value="3">Marie Martin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Année</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="amount">Montant (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50.00"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="expired">Expirée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Création..." : "Créer l'adhésion"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
