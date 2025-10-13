import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search, Users as UsersIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Student } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Students() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentTenant, isAllSchools } = useTenant();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

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

  const tenantParam = isAllSchools ? "all" : currentTenant?.id || "";

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: [`/api/students?tenantId=${tenantParam}${searchQuery ? `&search=${searchQuery}` : ""}`],
    enabled: !authLoading && isAuthenticated && (isAllSchools || !!currentTenant),
  });

  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.firstName?.toLowerCase().includes(query) ||
      student.lastName?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query)
    );
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
            Students
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAllSchools
              ? "All students across schools"
              : currentTenant
              ? `Students at ${currentTenant.name}`
              : "Select a school to view students"}
          </p>
        </div>
      </div>

      {!currentTenant && !isAllSchools ? (
        <Card>
          <CardContent className="p-8 text-center">
            <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No School Selected</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Please select a school from the tenant switcher to view students.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-students"
              />
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    {isAllSchools && <TableHead>School</TableHead>}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-28 bg-muted animate-pulse rounded" />
                        </TableCell>
                        {isAllSchools && (
                          <TableCell>
                            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isAllSchools ? 5 : 4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow
                        key={student.id}
                        className="cursor-pointer hover-elevate"
                        data-testid={`row-student-${student.id}`}
                      >
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {student.email || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {student.phone || "—"}
                        </TableCell>
                        {isAllSchools && (
                          <TableCell>
                            <Badge variant="outline">School</Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
