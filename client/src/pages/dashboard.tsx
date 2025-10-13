import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { KPICard } from "@/components/KPICard";
import {
  FileText,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  Users,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardKPIs {
  contractsInProgress: number;
  opcoToSend: number;
  devisPending: number;
  racOverdue: number;
  totalStudents: number;
  recentActivity: number;
}

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentTenant, isAllSchools } = useTenant();
  const { toast } = useToast();

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
