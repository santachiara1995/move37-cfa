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
    mutationFn: async (data: any) => apiRequest("/api/admin/schools", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setIsDialogOpen(false);
      toast({ title: "Success", description: "School created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create school", variant: "destructive" });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/admin/students", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      // Invalidate all dashboard KPI queries
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0]?.toString().includes('/api/dashboard/kpis')
      });
      setIsDialogOpen(false);
      setSelectedSchoolId("");
      toast({ title: "Success", description: "Student created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create student", variant: "destructive" });
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
    createSchoolMutation.mutate(data);
  };

  const handleStudentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      toast({ title: "Error", description: "Please select a school", variant: "destructive" });
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data = {
      tenantId: selectedSchoolId,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
    };
    createStudentMutation.mutate(data);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
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
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAllSchools
              ? "Overview across all schools"
              : currentTenant
              ? `${currentTenant.name} overview`
              : "Select a school to view dashboard"}
          </p>
        </div>
        {user?.role === "OpsAdmin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-dossier" className="gap-2">
                <FolderPlus className="w-4 h-4" />
                Create Dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Dossier</DialogTitle>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="school" data-testid="tab-school">School</TabsTrigger>
                  <TabsTrigger value="student" data-testid="tab-student">Student</TabsTrigger>
                </TabsList>
                
                <TabsContent value="school">
                  <form onSubmit={handleSchoolSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">School Name</Label>
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
                        Unique identifier (lowercase, hyphenated)
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
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createSchoolMutation.isPending} data-testid="button-submit-school">
                        {createSchoolMutation.isPending ? "Creating..." : "Create School"}
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>
                
                <TabsContent value="student">
                  <form onSubmit={handleStudentSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenantId">School</Label>
                      <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                        <SelectTrigger data-testid="select-student-school">
                          <SelectValue placeholder="Select a school" />
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          required
                          data-testid="input-student-firstname"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          required
                          data-testid="input-student-lastname"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        data-testid="input-student-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        data-testid="input-student-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        data-testid="input-student-dob"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createStudentMutation.isPending} data-testid="button-submit-student">
                        {createStudentMutation.isPending ? "Creating..." : "Create Student"}
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
            <h3 className="text-lg font-semibold mb-2">No School Selected</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Please select a school from the tenant switcher in the sidebar to view the dashboard,
              or choose "All Schools" for an aggregate view.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="Contracts in Progress"
              value={kpis?.contractsInProgress ?? 0}
              icon={FileText}
              isLoading={isLoading}
            />
            <KPICard
              title="OPCO to Send"
              value={kpis?.opcoToSend ?? 0}
              icon={Building2}
              status={kpis && kpis.opcoToSend > 0 ? "warning" : undefined}
              trendValue={kpis && kpis.opcoToSend > 0 ? "Action required" : undefined}
              isLoading={isLoading}
            />
            <KPICard
              title="Devis Pending"
              value={kpis?.devisPending ?? 0}
              icon={FileSpreadsheet}
              isLoading={isLoading}
            />
            <KPICard
              title="RAC Overdue"
              value={kpis?.racOverdue ?? 0}
              icon={AlertCircle}
              status={kpis && kpis.racOverdue > 0 ? "danger" : "success"}
              trendValue={kpis && kpis.racOverdue > 0 ? "Urgent" : "On track"}
              isLoading={isLoading}
            />
            <KPICard
              title="Total Students"
              value={kpis?.totalStudents ?? 0}
              icon={Users}
              isLoading={isLoading}
            />
            <KPICard
              title="Recent Activity"
              value={kpis?.recentActivity ?? 0}
              subtitle="Last 7 days"
              icon={TrendingUp}
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Contracts</CardTitle>
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
                    No recent contracts
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Actions</CardTitle>
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
                    No pending actions
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
