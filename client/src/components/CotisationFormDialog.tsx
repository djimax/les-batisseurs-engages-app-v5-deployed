import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";

interface CotisationFormDialogProps {
  onSuccess?: () => void;
}

export function CotisationFormDialog({ onSuccess }: CotisationFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    memberId: "",
    amount: "",
    dueDate: "",
    status: "en attente",
  });

  const createMutation = trpc.memberships.createCotisation.useMutation({
    onSuccess: () => {
      toast.success("Cotisation créée avec succès");
      setFormData({
        memberId: "",
        amount: "",
        dueDate: "",
        status: "en attente",
      });
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création de la cotisation");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.memberId.trim()) {
      toast.error("Veuillez sélectionner un membre");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    if (!formData.dueDate) {
      toast.error("Veuillez sélectionner une date d'échéance");
      return;
    }

    createMutation.mutate({
      memberId: parseInt(formData.memberId),
      montant: parseFloat(formData.amount),
      dateDebut: new Date(formData.dueDate),
      dateFin: new Date(formData.dueDate),
      statut: formData.status as "payée" | "en attente" | "en retard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-primary gap-2"
      >
        <Plus className="w-4 h-4" />
        Ajouter une cotisation
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une cotisation</DialogTitle>
          <DialogDescription>
            Créez une nouvelle cotisation pour un membre
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="memberId">Membre</Label>
            <Select 
              value={formData.memberId} 
              onValueChange={(value) => setFormData({ ...formData, memberId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Prisca Kouassi</SelectItem>
                <SelectItem value="2">Jean Dupont</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="50.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Date d'échéance</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en attente">En attente</SelectItem>
                <SelectItem value="payée">Payée</SelectItem>
                <SelectItem value="en retard">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
