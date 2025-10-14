import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AuditLog } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AuditLogs() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
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

  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    enabled: !authLoading && isAuthenticated,
  });

  const isAdminOrOps = user?.role === "OpsAdmin";

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

  if (!isAdminOrOps) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès Restreint</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Les journaux d'audit sont accessibles uniquement aux utilisateurs OpsAdmin pour des raisons de conformité et de sécurité.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">
          Journaux d'Audit
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <p>Piste d'audit immuable et ajout uniquement pour la conformité</p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horodatage</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Type d'Entité</TableHead>
                <TableHead>ID Entité</TableHead>
                <TableHead>École</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Aucun journal d'audit trouvé
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover-elevate"
                    data-testid={`row-audit-${log.id}`}
                  >
                    <TableCell className="font-mono text-xs">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.userId.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.entityType || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.entityId
                        ? `${log.entityId.substring(0, 8)}...`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.tenantId
                        ? `${log.tenantId.substring(0, 8)}...`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
