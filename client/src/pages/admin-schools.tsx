import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { Tenant } from "@shared/schema";

export default function AdminSchools() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<Tenant | null>(null);

  const { data: schools = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/admin/schools"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/admin/schools", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/tenants"] });
      setIsOpen(false);
      toast({ title: "Succès", description: "Établissement créé avec succès" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/admin/schools/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/tenants"] });
      setIsOpen(false);
      setEditingSchool(null);
      toast({ title: "Succès", description: "Établissement modifié avec succès" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/admin/schools/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/tenants"] });
      toast({ title: "Succès", description: "Établissement supprimé avec succès" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      filizApiKey: formData.get("filizApiKey") as string,
      filizApiUrl: formData.get("filizApiUrl") as string,
      isActive: formData.get("isActive") === "on",
    };

    if (editingSchool) {
      updateMutation.mutate({ id: editingSchool.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (school: Tenant) => {
    setEditingSchool(school);
    setIsOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSchool(null);
    setIsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-schools">Gestion des Établissements</h1>
          <p className="text-muted-foreground mt-1">Gérer les établissements et leur configuration API Filiz</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/api/admin/export/schools", "_blank")}
            data-testid="button-export-schools"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-add-school">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un Établissement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSchool ? "Modifier l'Établissement" : "Nouvel Établissement"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'Établissement</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingSchool?.name}
                    placeholder="École Paris Nord"
                    required
                    data-testid="input-school-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Identifiant</Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={editingSchool?.slug}
                    placeholder="paris-nord"
                    required
                    data-testid="input-school-slug"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filizApiUrl">Filiz API URL</Label>
                <Input
                  id="filizApiUrl"
                  name="filizApiUrl"
                  defaultValue={editingSchool?.filizApiUrl || ""}
                  placeholder="https://api.filiz.io/v1"
                  data-testid="input-filiz-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filizApiKey">Clé API Filiz</Label>
                <Textarea
                  id="filizApiKey"
                  name="filizApiKey"
                  defaultValue={editingSchool?.filizApiKey || ""}
                  placeholder="Entrez la clé API Filiz..."
                  rows={3}
                  data-testid="input-filiz-key"
                />
                <p className="text-sm text-muted-foreground">À obtenir depuis le portail partenaire Filiz</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={editingSchool?.isActive ?? true}
                  data-testid="switch-school-active"
                />
                <Label htmlFor="isActive">Actif</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" data-testid="button-save-school">
                  {editingSchool ? "Modifier" : "Créer"} l'Établissement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <Card key={school.id} data-testid={`card-school-${school.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{school.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">{school.slug}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(school)}
                    data-testid={`button-edit-school-${school.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Supprimer ${school.name} ?`)) {
                        deleteMutation.mutate(school.id);
                      }
                    }}
                    data-testid={`button-delete-school-${school.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Statut</span>
                <span className={school.isActive ? "text-green-600" : "text-red-600"}>
                  {school.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API Filiz</span>
                <span className={school.filizApiKey ? "text-green-600" : "text-yellow-600"}>
                  {school.filizApiKey ? "Configurée" : "Non configurée"}
                </span>
              </div>
              {school.filizApiUrl && (
                <div className="text-xs text-muted-foreground mt-2 font-mono truncate">
                  {school.filizApiUrl}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {schools.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No schools yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first school</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add School
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
