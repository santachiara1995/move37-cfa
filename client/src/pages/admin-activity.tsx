import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Building2, Users, GraduationCap, FileText, Clock } from "lucide-react";
import type { AuditLog } from "@shared/schema";
import { format } from "date-fns";

export default function AdminActivity() {
  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const getActionIcon = (action: string) => {
    if (action.includes("school") || action.includes("tenant")) return Building2;
    if (action.includes("student")) return Users;
    if (action.includes("program")) return GraduationCap;
    if (action.includes("contract")) return FileText;
    if (action.includes("user")) return User;
    return Shield;
  };

  const getActionColor = (action: string) => {
    if (action.startsWith("create_")) return "text-green-600";
    if (action.startsWith("update_")) return "text-blue-600";
    if (action.startsWith("delete_")) return "text-red-600";
    return "text-gray-600";
  };

  const getActionLabel = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-activity">Activity Dashboard</h1>
        <p className="text-muted-foreground mt-1">Recent administrative actions and system events</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">Logged in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter((log) => {
                const logDate = new Date(log.timestamp);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return logDate > dayAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter((log) => 
                log.action.includes("create_") || 
                log.action.includes("update_") || 
                log.action.includes("delete_")
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">CRUD operations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditLogs.slice(0, 50).map((log) => {
              const Icon = getActionIcon(log.action);
              const actionColor = getActionColor(log.action);
              
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover-elevate"
                  data-testid={`activity-${log.id}`}
                >
                  <div className={`p-2 rounded-lg bg-muted ${actionColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {getActionLabel(log.action)}
                      </Badge>
                      {log.entityType && (
                        <span className="text-sm text-muted-foreground">
                          {log.entityType}
                        </span>
                      )}
                    </div>
                    {log.payload && typeof log.payload === "object" && (
                      <div className="text-sm">
                        {JSON.stringify(log.payload).slice(0, 100)}
                        {JSON.stringify(log.payload).length > 100 && "..."}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>User: {log.userId.slice(0, 8)}...</span>
                      {log.tenantId && <span>School: {log.tenantId.slice(0, 8)}...</span>}
                      <span>{format(new Date(log.timestamp), "PPp")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {auditLogs.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
            <p className="text-muted-foreground">Administrative actions will appear here</p>
          </div>
        </Card>
      )}
    </div>
  );
}
