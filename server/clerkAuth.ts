import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Configure Clerk middleware
export async function setupClerkAuth(app: Express) {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!publishableKey || !secretKey) {
    console.warn("⚠️  Clerk keys not configured. Please add CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to your secrets.");
    console.warn("⚠️  Authentication will not work until these keys are provided.");
    return;
  }

  // Add Clerk middleware to all routes
  app.use(
    clerkMiddleware({
      publishableKey,
      secretKey,
    })
  );
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  
  if (!auth || !auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};

// Middleware to sync Clerk user with database
// First user becomes OpsAdmin with access to all tenants (atomically)
export const syncClerkUser: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  
  if (!auth || !auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = auth.userId;
    const userEmail = auth.sessionClaims?.email as string || `user-${userId}@example.com`;
    const userFirstName = auth.sessionClaims?.firstName as string || null;
    const userLastName = auth.sessionClaims?.lastName as string || null;
    
    // Use atomic first-user creation to prevent race conditions
    // This uses PostgreSQL advisory locks to ensure only one OpsAdmin is ever created
    const result = await storage.createFirstUserAtomically({
      id: userId,
      email: userEmail,
      firstName: userFirstName,
      lastName: userLastName,
      profileImageUrl: auth.sessionClaims?.imageUrl as string || null,
      role: "AnalystRO", // Will be overridden to OpsAdmin if first user
      tenantIds: [], // Will be populated if first user
    });
    
    if (result.created) {
      if (result.role === "OpsAdmin") {
        console.log(`✅ First OpsAdmin created with access to all tenants: ${userEmail}`);
      } else {
        try {
          const schoolName = `École de ${userEmail}`;
          const schoolSlug = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
          
          const newTenant = await storage.createTenant({
            name: schoolName,
            slug: schoolSlug,
            isActive: true,
          });
          
          await storage.upsertUser({
            id: userId,
            email: userEmail,
            firstName: userFirstName,
            lastName: userLastName,
            profileImageUrl: auth.sessionClaims?.imageUrl as string || null,
            role: "OpsAdmin", // OpsAdmin for their own tenant
            tenantIds: [newTenant.id], // Access only to their tenant
          });
          
          console.log(`✅ New user created tenant "${schoolName}" and assigned as OpsAdmin: ${userEmail}`);
        } catch (error) {
          console.error("Error creating tenant for new user:", error);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error("Error syncing Clerk user:", error);
    res.status(500).json({ message: "Failed to sync user" });
  }
};

// Role-based middleware
export const requireRole = (...allowedRoles: string[]): RequestHandler => {
  return async (req, res, next) => {
    const auth = getAuth(req);
    
    if (!auth || !auth.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = auth.userId;
    const dbUser = await storage.getUser(userId);

    if (!dbUser || !allowedRoles.includes(dbUser.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
