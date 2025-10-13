import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TenantProvider } from "@/contexts/TenantContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Contracts from "@/pages/contracts";
import ContractCreate from "@/pages/contract-create";
import ContractDetail from "@/pages/contract-detail";
import DevisPage from "@/pages/devis";
import OpcoPage from "@/pages/opco";
import RacPage from "@/pages/rac";
import AuditLogs from "@/pages/audit-logs";
import AdminSchools from "@/pages/admin-schools";
import AdminStudents from "@/pages/admin-students";
import AdminPrograms from "@/pages/admin-programs";
import AdminUsers from "@/pages/admin-users";
import AdminActivity from "@/pages/admin-activity";
import NotFound from "@/pages/not-found";
import { ThemeToggle } from "@/components/ThemeToggle";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/students" component={Students} />
          <Route path="/contracts" component={Contracts} />
          <Route path="/contracts/create" component={ContractCreate} />
          <Route path="/contracts/:id" component={ContractDetail} />
          <Route path="/devis" component={DevisPage} />
          <Route path="/opco" component={OpcoPage} />
          <Route path="/rac" component={RacPage} />
          <Route path="/audit" component={AuditLogs} />
          <Route path="/admin/schools" component={AdminSchools} />
          <Route path="/admin/students" component={AdminStudents} />
          <Route path="/admin/programs" component={AdminPrograms} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/activity" component={AdminActivity} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ThemeProvider>
      <TooltipProvider>
        {isLoading || !isAuthenticated ? (
          <>
            <Router />
            <Toaster />
          </>
        ) : (
          <TenantProvider>
            <SidebarProvider style={sidebarStyle as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <header className="flex items-center justify-between p-2 border-b shrink-0">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </TenantProvider>
        )}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
