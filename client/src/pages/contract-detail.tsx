import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react";
import type { Contract, CerfaPdf } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function ContractDetail() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/contracts/:id");
  const contractId = params?.id;

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

  const { data: contract, isLoading } = useQuery<Contract>({
    queryKey: [`/api/contracts/${contractId}`],
    enabled: !authLoading && isAuthenticated && !!contractId,
  });

  const { data: cerfaPdfs = [] } = useQuery<CerfaPdf[]>({
    queryKey: [`/api/contracts/${contractId}/cerfa`],
    enabled: !authLoading && isAuthenticated && !!contractId,
  });

  const generateCerfa = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/contracts/${contractId}/cerfa/generate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}/cerfa`] });
      toast({
        title: "Success",
        description: "CERFA PDF generated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to generate CERFA PDF",
        variant: "destructive",
      });
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Contract Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The contract you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild variant="outline">
              <Link href="/contracts">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contracts
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild data-testid="button-back">
          <Link href="/contracts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">
            Contract Details
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            {contract.contractNumber || "No contract number"}
          </p>
        </div>
        <Badge variant={contract.status === "in_progress" ? "default" : "outline"}>
          {contract.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contract Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Employer</p>
              <p className="font-medium">{contract.employerName || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">CFA</p>
              <p className="font-medium">{contract.cfaName || "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                <p className="font-medium">
                  {contract.startDate
                    ? new Date(contract.startDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">End Date</p>
                <p className="font-medium">
                  {contract.endDate
                    ? new Date(contract.endDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">CERFA Documents</CardTitle>
            <Button
              size="sm"
              onClick={() => generateCerfa.mutate()}
              disabled={generateCerfa.isPending}
              data-testid="button-generate-cerfa"
            >
              {generateCerfa.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate CERFA
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {cerfaPdfs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No CERFA documents generated yet
              </p>
            ) : (
              <div className="space-y-3">
                {cerfaPdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pdf.formVersion}</p>
                        <p className="text-xs text-muted-foreground">
                          {pdf.generatedAt
                            ? new Date(pdf.generatedAt).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      data-testid={`button-download-${pdf.id}`}
                    >
                      <a href={pdf.storageUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
