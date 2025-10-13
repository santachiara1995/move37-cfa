import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { Building2, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Opco } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusColors = {
  to_send: "secondary",
  sent: "default",
  validated: "outline",
  rejected: "destructive",
} as const;

export default function OpcoPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentTenant, isAllSchools } = useTenant();
  const { toast } = useToast();

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

  const { data: opcoList = [], isLoading } = useQuery<Opco[]>({
    queryKey: [`/api/opco?tenantId=${tenantParam}`],
    enabled: !authLoading && isAuthenticated && (isAllSchools || !!currentTenant),
  });

  const handleExportCSV = () => {
    toast({
      title: "Export",
      description: "CSV export functionality coming soon",
    });
  };

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
            OPCO
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAllSchools
              ? "All OPCO submissions across schools"
              : currentTenant
              ? `OPCO at ${currentTenant.name}`
              : "Select a school to view OPCO"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {!currentTenant && !isAllSchools ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No School Selected</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Please select a school from the tenant switcher to view OPCO.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OPCO Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Validated</TableHead>
                  <TableHead>Last Synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : opcoList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No OPCO submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  opcoList.map((opcoItem) => (
                    <TableRow
                      key={opcoItem.id}
                      className="hover-elevate"
                      data-testid={`row-opco-${opcoItem.id}`}
                    >
                      <TableCell className="font-medium">
                        {opcoItem.opcoName || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusColors[opcoItem.status as keyof typeof statusColors] ||
                            "outline"
                          }
                        >
                          {opcoItem.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {opcoItem.submittedAt
                          ? new Date(opcoItem.submittedAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {opcoItem.validatedAt
                          ? new Date(opcoItem.validatedAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {opcoItem.lastSyncedAt
                          ? new Date(opcoItem.lastSyncedAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
