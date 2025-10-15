import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import type { Opco, Rac } from "@shared/schema";

export default function ContractPayments() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, params] = useRoute("/contracts/:id/payments");
  const contractId = params?.id;

  const { data: paymentData, isLoading } = useQuery<{
    filizData: { totalDeadlineOPCO: number; totalDeadlineRAC: number } | null;
    opcoRecords: Opco[];
    racRecords: Rac[];
    summary: { totalOPCO: number; totalRAC: number; opcoCount: number; racCount: number };
  }>({
    queryKey: [`/api/contracts/${contractId}/payments`],
    enabled: !authLoading && isAuthenticated && !!contractId,
  });

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!paymentData) {
    return <div>Payment data not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/contracts/${contractId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contract
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-2">Payment Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Detailed payment information for this contract
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">OPCO Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentData.opcoRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No OPCO payments
                </p>
              ) : (
                paymentData.opcoRecords.map((opco: any) => (
                  <div key={opco.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{opco.opcoName || "OPCO Payment"}</p>
                      <p className="text-xs text-muted-foreground">
                        {opco.submittedAt ? new Date(opco.submittedAt).toLocaleDateString() : "Not submitted"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={opco.status === "validated" ? "default" : "outline"}>
                        {opco.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">RAC Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentData.racRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No RAC payments
                </p>
              ) : (
                paymentData.racRecords.map((rac: any) => (
                  <div key={rac.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        {rac.invoiceNumber || "Invoice"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {rac.dueDate ? new Date(rac.dueDate).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">
                        {((rac.amount || 0) / 100).toFixed(2)} €
                      </p>
                      <Badge variant={rac.status === "paid" ? "default" : rac.status === "overdue" ? "destructive" : "outline"}>
                        {rac.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {paymentData.filizData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filiz Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total OPCO</p>
                <p className="text-2xl font-bold">
                  {(paymentData.filizData.totalDeadlineOPCO / 100).toFixed(2)} €
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total RAC</p>
                <p className="text-2xl font-bold">
                  {(paymentData.filizData.totalDeadlineRAC / 100).toFixed(2)} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
