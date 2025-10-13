import { Button } from "@/components/ui/button";
import { Building2, FileText, BarChart3, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">Filiz Admin</span>
              <span className="text-xs text-muted-foreground">Multi-School Management</span>
            </div>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Log in</a>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold mb-4">
              Multi-School Administration Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unified interface for managing three schools, generating CERFA documents,
              tracking contracts, and maintaining compliance across all locations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="border rounded-lg p-6 hover-elevate">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-Tenant</h3>
              <p className="text-sm text-muted-foreground">
                Manage three schools from a single interface with tenant isolation and role-based access control.
              </p>
            </div>

            <div className="border rounded-lg p-6 hover-elevate">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">CERFA Generation</h3>
              <p className="text-sm text-muted-foreground">
                Automatically fill and generate CERFA 10103*10 PDF forms from contract data with audit trails.
              </p>
            </div>

            <div className="border rounded-lg p-6 hover-elevate">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Real-time KPIs and cross-school analytics for contracts, OPCO status, and outstanding payments.
              </p>
            </div>

            <div className="border rounded-lg p-6 hover-elevate md:col-span-2 lg:col-span-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Audit & Compliance</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive audit logging for all operations with immutable records for GDPR compliance and accountability.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Internal administration platform for Filiz Multi-School management</p>
        </div>
      </footer>
    </div>
  );
}
