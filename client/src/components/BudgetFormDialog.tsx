import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";

interface BudgetFormDialogProps {
  onSuccess?: () => void;
}

export function BudgetFormDialog({ onSuccess }: BudgetFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "",
    name: "",
    amount: "",
    category: "operations",
    description: "",
  });

  const createMutation = trpc.budgets.create.useMutation({
    onSuccess: () => {
      toast.success("Budget créé avec succès");
      setFormData({
        projectId: "",
        name: "",
        amount: "",
        category: "operations",
        description: "",
      });
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création du budget");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId.trim()) {
      toast.error("Veuillez sélectionner un projet");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Le nom du budget est requis");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      year: new Date().getFullYear(),
      totalAmount: parseFloat(formData.amount),
      description: formData.description,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-primary gap-2"
      >
        <Plus className="w-4 h-4" />
        Ajouter un budget
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un budget</DialogTitle>
          <DialogDescription>
            Créez un nouveau budget pour un projet
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectId">Projet</Label>
            <Select 
              value={formData.projectId} 
              onValueChange={(value) => setFormData({ ...formData, projectId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Projet 1</SelectItem>
                <SelectItem value="2">Projet 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom du budget</Label>
            <Input
              id="name"
              placeholder="Budget Q1 2026"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="5000.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operations">Opérations</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="personnel">Personnel</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Détails du budget..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
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
