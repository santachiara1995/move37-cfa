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
// First user becomes OpsAdmin (atomically), subsequent users require manual role assignment
export const syncClerkUser: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  
  if (!auth || !auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = auth.userId;
    
    // Use atomic first-user creation to prevent race conditions
    // This uses PostgreSQL advisory locks to ensure only one OpsAdmin is ever created
    const result = await storage.createFirstUserAtomically({
      id: userId,
      email: auth.sessionClaims?.email as string || `user-${userId}@example.com`,
      firstName: auth.sessionClaims?.firstName as string || null,
      lastName: auth.sessionClaims?.lastName as string || null,
      profileImageUrl: auth.sessionClaims?.imageUrl as string || null,
      role: "AnalystRO", // Will be overridden to OpsAdmin if first user
      tenantIds: [], // Will be populated if first user
    });
    
    if (result.created) {
      if (result.role === "OpsAdmin") {
        console.log(`✅ First OpsAdmin created: ${auth.sessionClaims?.email}`);
      } else {
        console.log(`⚠️  New user created with limited access: ${auth.sessionClaims?.email}. An OpsAdmin must assign proper role and tenants.`);
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
