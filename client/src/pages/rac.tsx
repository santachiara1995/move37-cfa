import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Rac } from "@shared/schema";
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
  pending: "secondary",
  paid: "outline",
  overdue: "destructive",
} as const;

export default function RacPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentTenant, isAllSchools } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Non Autorisé",
        description: "Vous êtes déconnecté. Reconnexion...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const tenantParam = isAllSchools ? "all" : currentTenant?.id || "";

  const { data: racList = [], isLoading } = useQuery<Rac[]>({
    queryKey: [`/api/rac?tenantId=${tenantParam}`],
    enabled: !authLoading && isAuthenticated && (isAllSchools || !!currentTenant),
  });

  const handleExportCSV = () => {
    toast({
      title: "Export",
      description: "Fonctionnalité d'export CSV bientôt disponible",
    });
  };

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
            RAC (Reste à Charge)
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAllSchools
              ? "Tous les restes à charge de toutes les écoles"
              : currentTenant
              ? `RAC à ${currentTenant.name}`
              : "Sélectionnez une école pour voir les RAC"}
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
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No School Selected</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Please select a school from the tenant switcher to view RAC.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead>Last Synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : racList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No RAC invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  racList.map((racItem) => {
                    const isOverdue =
                      racItem.status === "pending" &&
                      racItem.dueDate &&
                      new Date(racItem.dueDate) < new Date();
                    const displayStatus = isOverdue ? "overdue" : racItem.status;

                    return (
                      <TableRow
                        key={racItem.id}
                        className="hover-elevate"
                        data-testid={`row-rac-${racItem.id}`}
                      >
                        <TableCell className="font-medium font-mono text-sm">
                          {racItem.invoiceNumber || "—"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {racItem.amount
                            ? `€${(racItem.amount / 100).toFixed(2)}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {racItem.dueDate
                            ? new Date(racItem.dueDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              statusColors[displayStatus as keyof typeof statusColors] ||
                              "outline"
                            }
                          >
                            {displayStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {racItem.paidAt
                            ? new Date(racItem.paidAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {racItem.lastSyncedAt
                            ? new Date(racItem.lastSyncedAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
