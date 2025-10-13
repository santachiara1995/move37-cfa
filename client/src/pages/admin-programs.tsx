import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GraduationCap, Search } from "lucide-react";
import type { Program, Tenant } from "@shared/schema";

export default function AdminPrograms() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["/api/admin/programs"],
  });

  const { data: schools = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/admin/schools"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/admin/programs", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
      setIsOpen(false);
      toast({ title: "Success", description: "Program created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/admin/programs/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
      setIsOpen(false);
      setEditingProgram(null);
      toast({ title: "Success", description: "Program updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/admin/programs/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
      toast({ title: "Success", description: "Program deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      tenantId: formData.get("tenantId") as string,
      name: formData.get("name") as string,
      code: formData.get("code") as string || null,
      level: formData.get("level") as string || null,
      duration: formData.get("duration") ? parseInt(formData.get("duration") as string) : null,
      rncpCode: formData.get("rncpCode") as string || null,
      description: formData.get("description") as string || null,
      filizId: formData.get("filizId") as string || null,
      isActive: formData.get("isActive") === "on",
    };

    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      searchQuery === "" ||
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.level?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTenant = selectedTenant === "all" || program.tenantId === selectedTenant;
    
    return matchesSearch && matchesTenant;
  });

  const openEditDialog = (program: Program) => {
    setEditingProgram(program);
    setIsOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProgram(null);
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
          <h1 className="text-3xl font-bold" data-testid="heading-programs">Training Programs</h1>
          <p className="text-muted-foreground mt-1">Manage training programs and certifications</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-add-program">
              <Plus className="w-4 h-4 mr-2" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProgram ? "Edit Program" : "Add New Program"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">School</Label>
                <Select name="tenantId" defaultValue={editingProgram?.tenantId} required>
                  <SelectTrigger data-testid="select-program-school">
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
                  <Label htmlFor="name">Program Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingProgram?.name}
                    placeholder="CAP Pâtisserie"
                    required
                    data-testid="input-program-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    name="code"
                    defaultValue={editingProgram?.code || ""}
                    placeholder="CAP-PAT-2024"
                    data-testid="input-program-code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select name="level" defaultValue={editingProgram?.level || ""}>
                    <SelectTrigger data-testid="select-program-level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAP">CAP</SelectItem>
                      <SelectItem value="BEP">BEP</SelectItem>
                      <SelectItem value="BAC PRO">BAC PRO</SelectItem>
                      <SelectItem value="BTS">BTS</SelectItem>
                      <SelectItem value="DUT">DUT</SelectItem>
                      <SelectItem value="Licence Pro">Licence Pro</SelectItem>
                      <SelectItem value="Master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (months)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    defaultValue={editingProgram?.duration || ""}
                    placeholder="24"
                    data-testid="input-program-duration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rncpCode">RNCP Code</Label>
                  <Input
                    id="rncpCode"
                    name="rncpCode"
                    defaultValue={editingProgram?.rncpCode || ""}
                    placeholder="RNCP..."
                    data-testid="input-program-rncp"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingProgram?.description || ""}
                  placeholder="Program description..."
                  rows={3}
                  data-testid="input-program-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filizId">Filiz ID (optional)</Label>
                <Input
                  id="filizId"
                  name="filizId"
                  defaultValue={editingProgram?.filizId || ""}
                  placeholder="External ID from Filiz"
                  data-testid="input-program-filizid"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={editingProgram?.isActive ?? true}
                  data-testid="switch-program-active"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-program">
                  {editingProgram ? "Update" : "Create"} Program
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-programs"
          />
        </div>
        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-school">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPrograms.map((program) => {
          const school = schools.find((s) => s.id === program.tenantId);
          return (
            <Card key={program.id} data-testid={`card-program-${program.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <CardDescription>{school?.name}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(program)}
                      data-testid={`button-edit-program-${program.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete ${program.name}?`)) {
                          deleteMutation.mutate(program.id);
                        }
                      }}
                      data-testid={`button-delete-program-${program.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {program.level && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium">{program.level}</span>
                  </div>
                )}
                {program.code && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Code</span>
                    <span className="font-mono text-xs">{program.code}</span>
                  </div>
                )}
                {program.duration && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{program.duration} months</span>
                  </div>
                )}
                {program.rncpCode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">RNCP</span>
                    <span className="font-mono text-xs">{program.rncpCode}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Status</span>
                  <span className={program.isActive ? "text-green-600" : "text-red-600"}>
                    {program.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {program.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {program.description}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPrograms.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No programs found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedTenant !== "all" ? "Try adjusting your filters" : "Get started by adding your first program"}
            </p>
            {!searchQuery && selectedTenant === "all" && (
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Program
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
