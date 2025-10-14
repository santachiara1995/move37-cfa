import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { KPICard } from "@/components/KPICard";
import {
  FileText,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  Users,
  TrendingUp,
  FolderPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Tenant } from "@shared/schema";

interface DashboardKPIs {
  contractsInProgress: number;
  opcoToSend: number;
  devisPending: number;
  racOverdue: number;
  totalStudents: number;
  recentActivity: number;
}

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { currentTenant, isAllSchools } = useTenant();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("school");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [isSchoolActive, setIsSchoolActive] = useState(true);

  const { data: schools = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/admin/schools"],
    enabled: user?.role === "OpsAdmin",
  });

  const createSchoolMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/admin/schools", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setIsDialogOpen(false);
      setIsSchoolActive(true);
      toast({ title: "Succès", description: "École créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la création de l'école", variant: "destructive" });
    },
  });

  const createEntrepriseMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/admin/entreprises", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/entreprises"] });
      // Invalidate all dashboard KPI queries
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0]?.toString().includes('/api/dashboard/kpis') ?? false
      });
      setIsDialogOpen(false);
      setSelectedSchoolId("");
      toast({ title: "Succès", description: "Entreprise créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la création de l'entreprise", variant: "destructive" });
    },
  });

  const handleSchoolSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      filizApiUrl: formData.get("filizApiUrl") as string,
      filizApiKey: formData.get("filizApiKey") as string,
      isActive: isSchoolActive,
    };
    
    // Validate required fields
    if (!data.name || !data.slug) {
      toast({ 
        title: "Erreur de validation", 
        description: "Le nom de l'école et le slug sont requis", 
        variant: "destructive" 
      });
      return;
    }
    
    createSchoolMutation.mutate(data);
  };

  const handleEntrepriseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      toast({ title: "Erreur de validation", description: "Veuillez sélectionner une école", variant: "destructive" });
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data = {
      tenantId: selectedSchoolId,
      raisonSociale: formData.get("raisonSociale") as string,
      nom: formData.get("nom") as string,
      prenom: formData.get("prenom") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
    };
    
    // Validate required fields
    if (!data.raisonSociale || !data.nom || !data.prenom) {
      toast({ 
        title: "Erreur de validation", 
        description: "La raison sociale, le prénom et le nom sont requis", 
        variant: "destructive" 
      });
      return;
    }
    
    createEntrepriseMutation.mutate(data);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const tenantParam = isAllSchools
    ? "all"
    : currentTenant?.id || "";

  const { data: kpis, isLoading } = useQuery<DashboardKPIs>({
    queryKey: [`/api/dashboard/kpis?tenantId=${tenantParam}`],
    enabled: !authLoading && isAuthenticated && (isAllSchools || !!currentTenant),
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">
            Tableau de Bord
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAllSchools
              ? "Vue d'ensemble de toutes les écoles"
              : currentTenant
              ? `Vue d'ensemble de ${currentTenant.name}`
              : "Sélectionnez une école pour voir le tableau de bord"}
          </p>
        </div>
        {user?.role === "OpsAdmin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-dossier" className="gap-2">
                <FolderPlus className="w-4 h-4" />
                Créer un Dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un Nouveau Dossier</DialogTitle>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="school" data-testid="tab-school">École</TabsTrigger>
                  <TabsTrigger value="entreprise" data-testid="tab-entreprise">Entreprise</TabsTrigger>
                </TabsList>
                
                <TabsContent value="school">
                  <form onSubmit={handleSchoolSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom de l'École</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="e.g., École Paris Nord"
                        data-testid="input-school-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        name="slug"
                        required
                        placeholder="e.g., paris-nord"
                        data-testid="input-school-slug"
                      />
                      <p className="text-xs text-muted-foreground">
                        Identifiant unique (minuscules, séparées par des tirets)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filizApiUrl">Filiz API URL</Label>
                      <Input
                        id="filizApiUrl"
                        name="filizApiUrl"
                        placeholder="https://api.filiz.io"
                        data-testid="input-filiz-url"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filizApiKey">Filiz API Key</Label>
                      <Input
                        id="filizApiKey"
                        name="filizApiKey"
                        type="password"
                        placeholder="Enter API key"
                        data-testid="input-filiz-key"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="isActive" 
                        checked={isSchoolActive}
                        onCheckedChange={setIsSchoolActive}
                      />
                      <Label htmlFor="isActive">Actif</Label>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={createSchoolMutation.isPending} data-testid="button-submit-school">
                        {createSchoolMutation.isPending ? "Création..." : "Créer l'École"}
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>
                
                <TabsContent value="entreprise">
                  <form onSubmit={handleEntrepriseSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenantId">École</Label>
                      <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                        <SelectTrigger data-testid="select-entreprise-school">
                          <SelectValue placeholder="Sélectionnez une école" />
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
                    <div className="space-y-2">
                      <Label htmlFor="raisonSociale">Raison Sociale</Label>
                      <Input
                        id="raisonSociale"
                        name="raisonSociale"
                        required
                        placeholder="e.g., ABC Corporation"
                        data-testid="input-entreprise-raison-sociale"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input
                          id="prenom"
                          name="prenom"
                          required
                          data-testid="input-entreprise-prenom"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom</Label>
                        <Input
                          id="nom"
                          name="nom"
                          required
                          data-testid="input-entreprise-nom"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        data-testid="input-entreprise-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        data-testid="input-entreprise-phone"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={createEntrepriseMutation.isPending} data-testid="button-submit-entreprise">
                        {createEntrepriseMutation.isPending ? "Création..." : "Créer l'Entreprise"}
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!currentTenant && !isAllSchools ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune École Sélectionnée</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Veuillez sélectionner une école dans le sélecteur d'établissement de la barre latérale pour voir le tableau de bord,
              ou choisissez "Toutes les Écoles" pour une vue d'ensemble.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="Contrats en Cours"
              value={kpis?.contractsInProgress ?? 0}
              icon={FileText}
              isLoading={isLoading}
            />
            <KPICard
              title="OPCO à Envoyer"
              value={kpis?.opcoToSend ?? 0}
              icon={Building2}
              status={kpis && kpis.opcoToSend > 0 ? "warning" : undefined}
              trendValue={kpis && kpis.opcoToSend > 0 ? "Action requise" : undefined}
              isLoading={isLoading}
            />
            <KPICard
              title="Devis en Attente"
              value={kpis?.devisPending ?? 0}
              icon={FileSpreadsheet}
              isLoading={isLoading}
            />
            <KPICard
              title="RAC en Retard"
              value={kpis?.racOverdue ?? 0}
              icon={AlertCircle}
              status={kpis && kpis.racOverdue > 0 ? "danger" : "success"}
              trendValue={kpis && kpis.racOverdue > 0 ? "Urgent" : "À jour"}
              isLoading={isLoading}
            />
            <KPICard
              title="Total Étudiants"
              value={kpis?.totalStudents ?? 0}
              icon={Users}
              isLoading={isLoading}
            />
            <KPICard
              title="Activité Récente"
              value={kpis?.recentActivity ?? 0}
              subtitle="7 derniers jours"
              icon={TrendingUp}
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contrats Récents</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Aucun contrat récent
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions en Attente</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Aucune action en attente
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
