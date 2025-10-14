import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Configure Clerk middleware
export async function setupClerkAuth(app: Express) {
  // Add Clerk middleware to all routes
  app.use(clerkMiddleware());
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  
  if (!auth || !auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};

// Middleware to sync Clerk user with database and ensure access to all tenants
export const syncClerkUser: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  
  if (!auth || !auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Get user info from Clerk
    const userId = auth.userId;
    
    // Get all active tenants to ensure user always has access to current schools
    const allTenants = await storage.getTenants();
    const tenantIds = allTenants.map((t) => t.id);
    
    // Upsert user in database with access to all tenants
    // For Clerk, we'll use their user ID and get additional info from Clerk's User object
    await storage.upsertUser({
      id: userId,
      email: auth.sessionClaims?.email as string || `user-${userId}@example.com`,
      firstName: auth.sessionClaims?.firstName as string || null,
      lastName: auth.sessionClaims?.lastName as string || null,
      profileImageUrl: auth.sessionClaims?.imageUrl as string || null,
      role: "OpsAdmin", // Default role - grants full access
      tenantIds, // Grant access to all current active tenants
    });
    
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
