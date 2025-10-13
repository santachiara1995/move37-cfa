import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, UserCog, Shield, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { User, Tenant } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminUsers() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: schools = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/admin/schools"],
  });


  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/admin/users/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsOpen(false);
      setEditingUser(null);
      toast({ title: "Success", description: "User updated successfully" });
    },
  });


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      role: formData.get("role") as string,
      tenantIds: selectedTenantIds,
    };

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setSelectedTenantIds(user.tenantIds || []);
    setIsOpen(true);
  };


  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      OpsAdmin: { variant: "destructive", label: "Ops Admin" },
      BillingOps: { variant: "default", label: "Billing Ops" },
      AnalystRO: { variant: "secondary", label: "Analyst RO" },
    };
    
    const config = variants[role] || { variant: "outline", label: role };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
          <h1 className="text-3xl font-bold" data-testid="heading-users">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user roles and school access. Users are created automatically when they first log in.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User Permissions</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>User Information</Label>
                <div className="p-4 bg-muted rounded-lg space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span> {editingUser?.firstName} {editingUser?.lastName}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {editingUser?.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    User information is managed by Replit Auth and cannot be edited here.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={editingUser?.role || "AnalystRO"} required>
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpsAdmin">Ops Admin (Full Access)</SelectItem>
                    <SelectItem value="BillingOps">Billing Ops (Financial Data)</SelectItem>
                    <SelectItem value="AnalystRO">Analyst RO (Read-only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>School Access</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                  {schools.map((school) => (
                    <div key={school.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`school-${school.id}`}
                        checked={selectedTenantIds.includes(school.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTenantIds([...selectedTenantIds, school.id]);
                          } else {
                            setSelectedTenantIds(selectedTenantIds.filter((id) => id !== school.id));
                          }
                        }}
                        data-testid={`checkbox-school-${school.id}`}
                      />
                      <Label htmlFor={`school-${school.id}`} className="font-normal cursor-pointer">
                        {school.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Select which schools this user can access</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-user">
                  Update Permissions
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
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-users"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">User</th>
                  <th className="text-left p-4 font-semibold">Role</th>
                  <th className="text-left p-4 font-semibold">School Access</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const accessibleSchools = schools.filter((s) => user.tenantIds?.includes(s.id));
                  return (
                    <tr key={user.id} className="border-b hover-elevate" data-testid={`row-user-${user.id}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <UserCog className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : "Not set"}
                            </div>
                            <div className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getRoleBadge(user.role)}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {accessibleSchools.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No access</span>
                          ) : accessibleSchools.length <= 2 ? (
                            accessibleSchools.map((school) => (
                              <Badge key={school.id} variant="outline" className="text-xs">
                                {school.name}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {accessibleSchools.length} schools
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{user.email || "-"}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search" : "Users will appear here after they log in for the first time"}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
