import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, UserCog } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tenant } from "@shared/schema";
import { format } from "date-fns";

interface Master {
  id: string;
  tenantId: string;
  entrepriseId?: string;
  lastName: string;
  firstName: string;
  birthDate?: Date;
  nir?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  diploma?: string;
  diplomaLevel?: string;
  filizId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Entreprise {
  id: string;
  raisonSociale: string;
}

export default function AdminMasters() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMaster, setEditingMaster] = useState<Master | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: masters = [], isLoading } = useQuery<Master[]>({
    queryKey: ["/api/admin/masters"],
  });

  const { data: schools = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/admin/schools"],
  });

  const { data: companies = [] } = useQuery<Entreprise[]>({
    queryKey: ["/api/entreprises"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/admin/masters", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/masters"] });
      setIsOpen(false);
      toast({ title: "Succès", description: "Maître d'apprentissage créé avec succès" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/admin/masters/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/masters"] });
      setIsOpen(false);
      setEditingMaster(null);
      toast({ title: "Succès", description: "Maître d'apprentissage mis à jour avec succès" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/masters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/masters"] });
      toast({ title: "Succès", description: "Maître d'apprentissage supprimé avec succès" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      tenantId: formData.get("tenantId") as string,
      entrepriseId: formData.get("entrepriseId") as string || null,
      lastName: formData.get("lastName") as string,
      firstName: formData.get("firstName") as string,
      birthDate: formData.get("birthDate") ? new Date(formData.get("birthDate") as string) : null,
      nir: formData.get("nir") as string || null,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      jobTitle: formData.get("jobTitle") as string || null,
      diploma: formData.get("diploma") as string || null,
      diplomaLevel: formData.get("diplomaLevel") as string || null,
      filizId: formData.get("filizId") as string || null,
    };

    if (editingMaster) {
      updateMutation.mutate({ id: editingMaster.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredMasters = masters.filter((master) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      master.firstName?.toLowerCase().includes(query) ||
      master.lastName?.toLowerCase().includes(query) ||
      master.email?.toLowerCase().includes(query)
    );
  });

  const openEditDialog = (master: Master) => {
    setEditingMaster(master);
    setIsOpen(true);
  };

  const openCreateDialog = () => {
    setEditingMaster(null);
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
          <h1 className="text-3xl font-bold" data-testid="heading-masters">
            Gestion des Maîtres d'Apprentissage
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérer les maîtres d'apprentissage pour toutes les écoles
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-add-master">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un Maître
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMaster ? "Modifier le Maître d'Apprentissage" : "Ajouter un Maître d'Apprentissage"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">École *</Label>
                <Select name="tenantId" defaultValue={editingMaster?.tenantId} required>
                  <SelectTrigger data-testid="select-master-school">
                    <SelectValue placeholder="Sélectionner une école" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Accordion type="multiple" defaultValue={["identity", "contact", "professional"]} className="space-y-2">
                <AccordionItem value="identity">
                  <AccordionTrigger className="text-base font-semibold">
                    Identité
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          defaultValue={editingMaster?.lastName}
                          required
                          data-testid="input-master-lastname"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          defaultValue={editingMaster?.firstName}
                          required
                          data-testid="input-master-firstname"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Date de naissance</Label>
                        <Input
                          id="birthDate"
                          name="birthDate"
                          type="date"
                          defaultValue={editingMaster?.birthDate ? format(new Date(editingMaster.birthDate), 'yyyy-MM-dd') : ""}
                          data-testid="input-master-birthdate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nir">NIR (Sécurité sociale)</Label>
                        <Input
                          id="nir"
                          name="nir"
                          defaultValue={editingMaster?.nir || ""}
                          placeholder="15 chiffres"
                          data-testid="input-master-nir"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="contact">
                  <AccordionTrigger className="text-base font-semibold">
                    Contact
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={editingMaster?.email || ""}
                          data-testid="input-master-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          defaultValue={editingMaster?.phone || ""}
                          data-testid="input-master-phone"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="professional">
                  <AccordionTrigger className="text-base font-semibold">
                    Informations Professionnelles
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="entrepriseId">Entreprise (optionnel)</Label>
                      <Select name="entrepriseId" defaultValue={editingMaster?.entrepriseId || ""}>
                        <SelectTrigger data-testid="select-master-company">
                          <SelectValue placeholder="Sélectionner une entreprise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucune entreprise</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.raisonSociale}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Fonction</Label>
                        <Input
                          id="jobTitle"
                          name="jobTitle"
                          defaultValue={editingMaster?.jobTitle || ""}
                          placeholder="Ex: Chef pâtissier"
                          data-testid="input-master-jobtitle"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="diplomaLevel">Niveau du diplôme</Label>
                        <Input
                          id="diplomaLevel"
                          name="diplomaLevel"
                          defaultValue={editingMaster?.diplomaLevel || ""}
                          placeholder="Ex: CAP, Bac Pro, BTS"
                          data-testid="input-master-diplmalevel"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diploma">Diplôme professionnel</Label>
                      <Input
                        id="diploma"
                        name="diploma"
                        defaultValue={editingMaster?.diploma || ""}
                        placeholder="Ex: CAP Pâtisserie"
                        data-testid="input-master-diploma"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filizId">Filiz ID (optionnel)</Label>
                      <Input
                        id="filizId"
                        name="filizId"
                        defaultValue={editingMaster?.filizId || ""}
                        placeholder="External ID from Filiz"
                        data-testid="input-master-filizid"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" data-testid="button-save-master">
                  {editingMaster ? "Mettre à jour" : "Créer"} le Maître
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher des maîtres d'apprentissage..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-masters"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Maîtres d'Apprentissage ({filteredMasters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Fonction</TableHead>
                  <TableHead>Diplôme</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-5 w-32 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-40 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredMasters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun maître d'apprentissage trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMasters.map((master) => (
                    <TableRow
                      key={master.id}
                      className="cursor-pointer hover-elevate"
                      data-testid={`row-master-${master.id}`}
                    >
                      <TableCell className="font-medium">{master.lastName}</TableCell>
                      <TableCell>{master.firstName}</TableCell>
                      <TableCell className="text-muted-foreground">{master.email || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{master.phone || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{master.jobTitle || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{master.diploma || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(master)}
                            data-testid={`button-edit-master-${master.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Êtes-vous sûr de vouloir supprimer ce maître d'apprentissage ?")) {
                                deleteMutation.mutate(master.id);
                              }
                            }}
                            data-testid={`button-delete-master-${master.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
