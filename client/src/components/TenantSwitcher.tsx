import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTenant } from "@/contexts/TenantContext";
import type { Tenant } from "@shared/schema";
import { useState } from "react";

export function TenantSwitcher() {
  const [open, setOpen] = useState(false);
  const { currentTenant, setCurrentTenant, isAllSchools, setIsAllSchools } = useTenant();

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const handleSelect = (tenant: Tenant | null, allSchools: boolean = false) => {
    if (allSchools) {
      setIsAllSchools(true);
      setCurrentTenant(null);
    } else if (tenant) {
      setCurrentTenant(tenant);
      setIsAllSchools(false);
    }
    setOpen(false);
  };

  const displayName = isAllSchools
    ? "Toutes les Écoles"
    : currentTenant?.name || "Sélectionnez une école...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a tenant"
          className="w-64 justify-between"
          data-testid="button-tenant-switcher"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{displayName}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Rechercher une école..." />
          <CommandList>
            <CommandEmpty>Aucune école trouvée.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => handleSelect(null, true)}
                className="cursor-pointer"
                data-testid="option-all-schools"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    isAllSchools ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="flex flex-col">
                  <span className="font-medium">Toutes les Écoles</span>
                  <span className="text-xs text-muted-foreground">
                    Vue d'ensemble de toutes les écoles
                  </span>
                </div>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Écoles">
              {isLoading ? (
                <CommandItem disabled>Chargement...</CommandItem>
              ) : (
                tenants.map((tenant) => (
                  <CommandItem
                    key={tenant.id}
                    onSelect={() => handleSelect(tenant)}
                    className="cursor-pointer"
                    data-testid={`option-tenant-${tenant.slug}`}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        currentTenant?.id === tenant.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span>{tenant.name}</span>
                      {tenant.slug && (
                        <span className="text-xs text-muted-foreground">
                          {tenant.slug}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
