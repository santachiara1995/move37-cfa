import { Button } from "@/components/ui/button";
import { School, FileText, BarChart3, Shield } from "lucide-react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">0 à 1 Formation</span>
              <span className="text-xs text-muted-foreground">Formation Professionnelle</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button variant="outline" data-testid="button-login">
                Connexion
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button data-testid="button-signup">
                Inscription
              </Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold mb-4">
              Outils Administratifs pour la Formation Professionnelle
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gérez votre école, centralisez vos données, automatisez vos documents administratifs
              et assurez la conformité de vos processus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="border rounded-lg p-6 hover-elevate">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <School className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gestion Multi-Sites</h3>
              <p className="text-sm text-muted-foreground">
                Gérez plusieurs établissements depuis une interface unique avec isolation des données et contrôle d'accès par rôle.
              </p>
            </div>

            <div className="border rounded-lg p-6 hover-elevate">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Documents Administratifs</h3>
              <p className="text-sm text-muted-foreground">
                Générez automatiquement vos formulaires et documents officiels à partir de vos données avec traçabilité complète.
              </p>
            </div>

            <div className="border rounded-lg p-6 hover-elevate">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tableaux de Bord</h3>
              <p className="text-sm text-muted-foreground">
                Suivez vos indicateurs clés en temps réel : contrats, financements, règlements et statistiques consolidées.
              </p>
            </div>

            <div className="border rounded-lg p-6 hover-elevate md:col-span-2 lg:col-span-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Audit & Conformité</h3>
              <p className="text-sm text-muted-foreground">
                Traçabilité complète de toutes les opérations avec journalisation sécurisée pour garantir la conformité réglementaire.
              </p>
            </div>
          </div>

          <div className="text-center">
            <SignUpButton mode="modal">
              <Button size="lg" data-testid="button-get-started">
                Commencer
              </Button>
            </SignUpButton>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Plateforme de gestion administrative pour la formation professionnelle</p>
        </div>
      </footer>
    </div>
  );
}
