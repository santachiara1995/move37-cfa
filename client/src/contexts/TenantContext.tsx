import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Tenant } from "@shared/schema";

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  isAllSchools: boolean;
  setIsAllSchools: (value: boolean) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isAllSchools, setIsAllSchools] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("selectedTenant");
    const savedAllSchools = localStorage.getItem("isAllSchools");
    if (savedAllSchools === "true") {
      setIsAllSchools(true);
      setCurrentTenant(null);
    } else if (saved) {
      try {
        setCurrentTenant(JSON.parse(saved));
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (isAllSchools) {
      localStorage.setItem("isAllSchools", "true");
      localStorage.removeItem("selectedTenant");
    } else if (currentTenant) {
      localStorage.setItem("selectedTenant", JSON.stringify(currentTenant));
      localStorage.removeItem("isAllSchools");
    }
  }, [currentTenant, isAllSchools]);

  return (
    <TenantContext.Provider value={{ currentTenant, setCurrentTenant, isAllSchools, setIsAllSchools }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
