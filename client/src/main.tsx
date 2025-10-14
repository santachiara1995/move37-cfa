import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// If Clerk keys are not configured, render a setup notice instead of crashing
if (!PUBLISHABLE_KEY) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-card border rounded-lg p-8">
          <h1 className="text-2xl font-semibold mb-4">Configuration requise</h1>
          <p className="text-muted-foreground mb-6">
            L'authentification Clerk n'est pas encore configurée. Pour utiliser cette application, 
            vous devez ajouter les clés API Clerk dans les secrets Replit.
          </p>
          <div className="bg-muted p-4 rounded-md mb-6">
            <h2 className="font-medium mb-2">Secrets requis :</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><code>VITE_CLERK_PUBLISHABLE_KEY</code> (frontend)</li>
              <li><code>CLERK_PUBLISHABLE_KEY</code> (backend)</li>
              <li><code>CLERK_SECRET_KEY</code> (backend)</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Obtenez vos clés depuis le{" "}
            <a 
              href="https://dashboard.clerk.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              tableau de bord Clerk
            </a>
            , puis ajoutez-les dans les secrets Replit.
          </p>
        </div>
      </div>
    </StrictMode>
  );
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </StrictMode>
  );
}
