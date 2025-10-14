import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { isSignedIn, isLoaded: clerkLoaded } = useUser();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isSignedIn && clerkLoaded,
    retry: false,
  });

  return {
    user,
    isLoading: !clerkLoaded || userLoading,
    isAuthenticated: isSignedIn && !!user,
  };
}
