import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./replitAuth";
import { FilizAdapter } from "./filizAdapter";
import { cerfaService } from "./cerfaService";
import { objectStorage } from "./objectStorage";
import type { Tenant } from "@shared/schema";

// Helper to create audit log
async function createAuditLog(
  userId: string,
  tenantId: string | null,
  action: string,
  entityType: string | null,
  entityId: string | null,
  payload: any,
  req: Request
) {
  await storage.createAuditLog({
    userId,
    tenantId,
    action,
    entityType,
    entityId,
    payload,
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ========== AUTH ROUTES ==========
  app.get("/api/auth/user", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ========== TENANT ROUTES ==========
  app.get("/api/tenants", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Only return tenants the user has access to
      const allTenants = await storage.getTenants();
      const accessibleTenants = allTenants.filter((t) => user.tenantIds.includes(t.id));
      res.json(accessibleTenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  // ========== DASHBOARD ROUTES ==========
  app.get("/api/dashboard/kpis", isAuthenticated, requireRole("OpsAdmin", "BillingOps", "AnalystRO"), async (req: any, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (tenantId === "all") {
        // Aggregate across user's accessible tenants only
        const allTenants = await storage.getTenants();
        const tenants = allTenants.filter((t) => user.tenantIds.includes(t.id));
        let totalContractsInProgress = 0;
        let totalOpcoToSend = 0;
        let totalDevisPending = 0;
        let totalRacOverdue = 0;
        let totalStudents = 0;

        for (const tenant of tenants) {
          const contracts = await storage.getContracts(tenant.id);
          totalContractsInProgress += contracts.filter((c) => c.status === "in_progress").length;

          const opcoList = await storage.getOpcoList(tenant.id);
          totalOpcoToSend += opcoList.filter((o) => o.status === "to_send").length;

          const devisList = await storage.getDevisList(tenant.id);
          totalDevisPending += devisList.filter((d) => d.status === "pending").length;

          const racList = await storage.getRacList(tenant.id);
          totalRacOverdue += racList.filter((r) => {
            return (
              r.status === "pending" &&
              r.dueDate &&
              new Date(r.dueDate) < new Date()
            );
          }).length;

          const students = await storage.getStudents(tenant.id);
          totalStudents += students.length;
        }

        res.json({
          contractsInProgress: totalContractsInProgress,
          opcoToSend: totalOpcoToSend,
          devisPending: totalDevisPending,
          racOverdue: totalRacOverdue,
          totalStudents,
          recentActivity: 0, // Would need additional tracking
        });
      } else if (tenantId) {
        // Validate access to this specific tenant
        if (!user.tenantIds.includes(tenantId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Single tenant
        const contracts = await storage.getContracts(tenantId);
        const contractsInProgress = contracts.filter((c) => c.status === "in_progress").length;

        const opcoList = await storage.getOpcoList(tenantId);
        const opcoToSend = opcoList.filter((o) => o.status === "to_send").length;

        const devisList = await storage.getDevisList(tenantId);
        const devisPending = devisList.filter((d) => d.status === "pending").length;

        const racList = await storage.getRacList(tenantId);
        const racOverdue = racList.filter((r) => {
          return (
            r.status === "pending" &&
            r.dueDate &&
            new Date(r.dueDate) < new Date()
          );
        }).length;

        const students = await storage.getStudents(tenantId);

        res.json({
          contractsInProgress,
          opcoToSend,
          devisPending,
          racOverdue,
          totalStudents: students.length,
          recentActivity: 0,
        });
      } else {
        res.json({
          contractsInProgress: 0,
          opcoToSend: 0,
          devisPending: 0,
          racOverdue: 0,
          totalStudents: 0,
          recentActivity: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  // ========== STUDENT ROUTES ==========
  app.get("/api/students", isAuthenticated, requireRole("OpsAdmin", "BillingOps", "AnalystRO"), async (req: any, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const searchQuery = req.query.search as string;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (tenantId === "all") {
        const allTenants = await storage.getTenants();
        const tenants = allTenants.filter((t) => user.tenantIds.includes(t.id));
        let allStudents: any[] = [];
        for (const tenant of tenants) {
          const students = searchQuery
            ? await storage.searchStudents(tenant.id, searchQuery)
            : await storage.getStudents(tenant.id);
          allStudents = [...allStudents, ...students];
        }
        res.json(allStudents);
      } else if (tenantId) {
        // Validate access to this specific tenant
        if (!user.tenantIds.includes(tenantId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        const students = searchQuery
          ? await storage.searchStudents(tenantId, searchQuery)
          : await storage.getStudents(tenantId);
        res.json(students);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // ========== CONTRACT ROUTES ==========
  app.get("/api/contracts", isAuthenticated, requireRole("OpsAdmin", "BillingOps", "AnalystRO"), async (req: any, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const statusFilter = req.query.status as string;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (tenantId === "all") {
        const allTenants = await storage.getTenants();
        const tenants = allTenants.filter((t) => user.tenantIds.includes(t.id));
        let allContracts: any[] = [];
        for (const tenant of tenants) {
          const contracts = await storage.getContracts(tenant.id, statusFilter);
          allContracts = [...allContracts, ...contracts];
        }
        res.json(allContracts);
      } else if (tenantId) {
        // Validate access to this specific tenant
        if (!user.tenantIds.includes(tenantId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        const contracts = await storage.getContracts(tenantId, statusFilter);
        res.json(contracts);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/:id", isAuthenticated, requireRole("OpsAdmin", "BillingOps", "AnalystRO"), async (req: any, res: Response) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      // Validate tenant access
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.tenantIds.includes(contract.tenantId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(contract);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  app.get("/api/contracts/:id/cerfa", isAuthenticated, requireRole("OpsAdmin", "BillingOps", "AnalystRO"), async (req: any, res: Response) => {
    try {
      // First validate contract access
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      // Validate tenant access
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.tenantIds.includes(contract.tenantId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const cerfaPdfs = await storage.getCerfaPdfsForContract(req.params.id);
      res.json(cerfaPdfs);
    } catch (error) {
      console.error("Error fetching CERFA PDFs:", error);
      res.status(500).json({ message: "Failed to fetch CERFA PDFs" });
    }
  });

  app.post("/api/contracts/:id/cerfa/generate", isAuthenticated, requireRole("OpsAdmin", "BillingOps"), async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const userId = req.user.claims.sub;

      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      // Validate tenant access
      const user = await storage.getUser(userId);
      if (!user || !user.tenantIds.includes(contract.tenantId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      // In production, would fetch from Filiz API
      // For now, use cached data or mock data
      const contractData: any = contract.cachedData || {
        id: contract.id,
        contractNumber: contract.contractNumber || "",
        status: contract.status,
        startDate: contract.startDate?.toISOString() || "",
        endDate: contract.endDate?.toISOString() || "",
        apprentice: {
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean.dupont@example.com",
          dateOfBirth: "1995-01-15",
        },
        employer: {
          name: contract.employerName || "",
          siret: "12345678901234",
          address: "123 Rue Example, Paris",
        },
        cfa: {
          name: contract.cfaName || "",
          uai: "0751234A",
        },
      };

      // Generate PDF
      const pdfBuffer = await cerfaService.generateCerfa10103(contractData);

      // Upload to object storage
      const fileName = `cerfa-${contract.contractNumber || contractId}-${Date.now()}.pdf`;
      const { objectPath, url } = await objectStorage.uploadPDF(fileName, pdfBuffer, {
        contractId,
        userId,
        generatedAt: new Date().toISOString(),
      });

      // Save to database
      const cerfaPdf = await storage.createCerfaPdf({
        tenantId: contract.tenantId,
        contractId,
        userId,
        formVersion: "10103_10",
        storageUrl: url,
        objectPath,
        fieldMappingVersion: cerfaService.getFieldMappingVersion(),
      });

      // Audit log
      await createAuditLog(
        userId,
        contract.tenantId,
        "generate_cerfa",
        "contract",
        contractId,
        { cerfaPdfId: cerfaPdf.id },
        req
      );

      res.json(cerfaPdf);
    } catch (error) {
      console.error("Error generating CERFA:", error);
      res.status(500).json({ message: "Failed to generate CERFA PDF" });
    }
  });

  // ========== DEVIS ROUTES ==========
  app.get("/api/devis", isAuthenticated, requireRole("OpsAdmin", "BillingOps", "AnalystRO"), async (req: any, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (tenantId === "all") {
        const allTenants = await storage.getTenants();
        const tenants = allTenants.filter((t) => user.tenantIds.includes(t.id));
        let allDevis: any[] = [];
        for (const tenant of tenants) {
          const devisList = await storage.getDevisList(tenant.id);
          allDevis = [...allDevis, ...devisList];
        }
        res.json(allDevis);
      } else if (tenantId) {
        // Validate access to this specific tenant
        if (!user.tenantIds.includes(tenantId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        const devisList = await storage.getDevisList(tenantId);
        res.json(devisList);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching devis:", error);
      res.status(500).json({ message: "Failed to fetch devis" });
    }
  });

  // ========== OPCO ROUTES ==========
  app.get("/api/opco", isAuthenticated, requireRole("OpsAdmin", "BillingOps", "AnalystRO"), async (req: any, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (tenantId === "all") {
        const allTenants = await storage.getTenants();
        const tenants = allTenants.filter((t) => user.tenantIds.includes(t.id));
        let allOpco: any[] = [];
        for (const tenant of tenants) {
          const opcoList = await storage.getOpcoList(tenant.id);
          allOpco = [...allOpco, ...opcoList];
        }
        res.json(allOpco);
      } else if (tenantId) {
        // Validate access to this specific tenant
        if (!user.tenantIds.includes(tenantId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        const opcoList = await storage.getOpcoList(tenantId);
        res.json(opcoList);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching OPCO:", error);
      res.status(500).json({ message: "Failed to fetch OPCO" });
    }
  });

  // ========== RAC ROUTES ==========
  app.get("/api/rac", isAuthenticated, requireRole("OpsAdmin", "BillingOps", "AnalystRO"), async (req: any, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (tenantId === "all") {
        const allTenants = await storage.getTenants();
        const tenants = allTenants.filter((t) => user.tenantIds.includes(t.id));
        let allRac: any[] = [];
        for (const tenant of tenants) {
          const racList = await storage.getRacList(tenant.id);
          allRac = [...allRac, ...racList];
        }
        res.json(allRac);
      } else if (tenantId) {
        // Validate access to this specific tenant
        if (!user.tenantIds.includes(tenantId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        const racList = await storage.getRacList(tenantId);
        res.json(racList);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching RAC:", error);
      res.status(500).json({ message: "Failed to fetch RAC" });
    }
  });

  // ========== AUDIT LOG ROUTES ==========
  app.get("/api/audit-logs", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const auditLogs = await storage.getAuditLogs(limit);
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
