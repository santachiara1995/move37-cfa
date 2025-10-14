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
// First user becomes OpsAdmin, subsequent users require manual role assignment
export const syncClerkUser: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  
  if (!auth || !auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = auth.userId;
    
    // Check if user already exists in database
    const existingUser = await storage.getUser(userId);
    
    if (existingUser) {
      // User already exists, just continue
      next();
      return;
    }
    
    // New user - check if any OpsAdmin already exists in the system
    // This prevents race conditions by checking for admin existence, not total user count
    const allUsers = await storage.getAllUsers();
    const hasOpsAdmin = allUsers.some(u => u.role === "OpsAdmin");
    
    if (!hasOpsAdmin) {
      // No OpsAdmin exists - make this user the first admin
      const allTenants = await storage.getTenants();
      const tenantIds = allTenants.map((t) => t.id);
      
      await storage.upsertUser({
        id: userId,
        email: auth.sessionClaims?.email as string || `user-${userId}@example.com`,
        firstName: auth.sessionClaims?.firstName as string || null,
        lastName: auth.sessionClaims?.lastName as string || null,
        profileImageUrl: auth.sessionClaims?.imageUrl as string || null,
        role: "OpsAdmin", // First admin user
        tenantIds, // Access to all tenants
      });
      
      console.log(`✅ First OpsAdmin created: ${auth.sessionClaims?.email}`);
    } else {
      // OpsAdmin exists - create user with minimal access
      // An OpsAdmin must manually assign role and tenants via the admin panel
      await storage.upsertUser({
        id: userId,
        email: auth.sessionClaims?.email as string || `user-${userId}@example.com`,
        firstName: auth.sessionClaims?.firstName as string || null,
        lastName: auth.sessionClaims?.lastName as string || null,
        profileImageUrl: auth.sessionClaims?.imageUrl as string || null,
        role: "AnalystRO", // Default to read-only role
        tenantIds: [], // No tenant access by default - admin must assign
      });
      
      console.log(`⚠️  New user created with limited access: ${auth.sessionClaims?.email}. An OpsAdmin must assign proper role and tenants.`);
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
