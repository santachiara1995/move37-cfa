import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./replitAuth";
import { FilizAdapter } from "./filizAdapter";
import { cerfaService } from "./cerfaService";
import { objectStorage } from "./objectStorage";
import { 
  insertTenantSchema, 
  insertStudentSchema,
  insertEntrepriseSchema,
  insertProgramSchema,
  updateUserRoleSchema,
  type Tenant 
} from "@shared/schema";

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
      const claims = req.user.claims;
      
      // Get all active tenants to ensure user always has access to current schools
      const allTenants = await storage.getTenants();
      const tenantIds = allTenants.map((t: Tenant) => t.id);
      
      // Always upsert user to ensure they have access to all current tenants
      // This handles both first-time login and keeping tenant access up-to-date
      const user = await storage.upsertUser({
        id: claims.sub,
        email: claims.email,
        firstName: claims.first_name,
        lastName: claims.last_name,
        profileImageUrl: claims.profile_image_url,
        role: "OpsAdmin", // Default role - grants full access
        tenantIds, // Grant access to all current active tenants
      });
      
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

  // ========== ADMIN ROUTES (OpsAdmin only) ==========
  
  // User Management
  app.get("/api/admin/users", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validation = updateUserRoleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validation.error.errors 
        });
      }
      
      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userData = {
        ...existingUser,
        role: validation.data.role,
        tenantIds: validation.data.tenantIds,
      };
      
      const user = await storage.upsertUser(userData);
      
      await createAuditLog(
        userId,
        null,
        "update_user_permissions",
        "user",
        user.id,
        { email: user.email, role: user.role, tenantIds: user.tenantIds },
        req
      );
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // CSV Export
  app.get("/api/admin/export/schools", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const schools = await storage.getAllTenants();
      
      const csv = [
        "ID,Name,Slug,Filiz API URL,Active,Created At",
        ...schools.map((s) => 
          `${s.id},"${s.name}","${s.slug}","${s.filizApiUrl || ""}",${s.isActive},${s.createdAt}`
        ),
      ].join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=schools.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting schools:", error);
      res.status(500).json({ message: "Failed to export schools" });
    }
  });

  app.get("/api/admin/export/students", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const tenants = await storage.getAllTenants();
      let allStudents: any[] = [];
      
      for (const tenant of tenants) {
        const students = await storage.getStudents(tenant.id);
        allStudents = [...allStudents, ...students.map((s) => ({ ...s, schoolName: tenant.name }))];
      }
      
      const csv = [
        "ID,First Name,Last Name,Email,Phone,Date of Birth,School,Filiz ID,Numéro OPCO,Numéro DEKRA,Created At",
        ...allStudents.map((s) => 
          `${s.id},"${s.firstName}","${s.lastName}","${s.email || ""}","${s.phone || ""}","${s.dateOfBirth || ""}","${s.schoolName}","${s.filizId || ""}","${s.numeroOpco || ""}","${s.numeroDekra || ""}",${s.createdAt}`
        ),
      ].join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=students.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting students:", error);
      res.status(500).json({ message: "Failed to export students" });
    }
  });

  app.get("/api/admin/export/programs", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const tenants = await storage.getAllTenants();
      let allPrograms: any[] = [];
      
      for (const tenant of tenants) {
        const programs = await storage.getPrograms(tenant.id);
        allPrograms = [...allPrograms, ...programs.map((p) => ({ ...p, schoolName: tenant.name }))];
      }
      
      const csv = [
        "ID,Name,Code,Level,Duration (months),RNCP Code,School,Active,Created At",
        ...allPrograms.map((p) => 
          `${p.id},"${p.name}","${p.code || ""}","${p.level || ""}","${p.duration || ""}","${p.rncpCode || ""}","${p.schoolName}",${p.isActive},${p.createdAt}`
        ),
      ].join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=programs.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting programs:", error);
      res.status(500).json({ message: "Failed to export programs" });
    }
  });

  // Schools Management
  app.get("/api/admin/schools", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const schools = await storage.getAllTenants();
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  app.post("/api/admin/schools", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = insertTenantSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validation.error.errors 
        });
      }
      
      const school = await storage.createTenant(validation.data);
      
      await createAuditLog(
        userId,
        school.id,
        "create_school",
        "tenant",
        school.id,
        { name: school.name, slug: school.slug },
        req
      );
      
      res.json(school);
    } catch (error) {
      console.error("Error creating school:", error);
      res.status(500).json({ message: "Failed to create school" });
    }
  });

  app.put("/api/admin/schools/:id", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const existingSchool = await storage.getTenant(req.params.id);
      if (!existingSchool) {
        return res.status(404).json({ message: "School not found" });
      }
      
      const validation = insertTenantSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validation.error.errors 
        });
      }
      
      const school = await storage.updateTenant(req.params.id, validation.data);
      
      await createAuditLog(
        userId,
        school.id,
        "update_school",
        "tenant",
        school.id,
        req.body,
        req
      );
      
      res.json(school);
    } catch (error) {
      console.error("Error updating school:", error);
      res.status(500).json({ message: "Failed to update school" });
    }
  });

  app.delete("/api/admin/schools/:id", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const existingSchool = await storage.getTenant(req.params.id);
      if (!existingSchool) {
        return res.status(404).json({ message: "School not found" });
      }
      
      await storage.deleteTenant(req.params.id);
      
      await createAuditLog(
        userId,
        existingSchool.id,
        "delete_school",
        "tenant",
        existingSchool.id,
        { name: existingSchool.name },
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ message: "Failed to delete school" });
    }
  });

  // Students Management
  app.get("/api/admin/students", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const tenants = await storage.getAllTenants();
      let allStudents: any[] = [];
      
      for (const tenant of tenants) {
        const students = await storage.getStudents(tenant.id);
        allStudents = [...allStudents, ...students];
      }
      
      res.json(allStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/admin/students", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = insertStudentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validation.error.errors 
        });
      }
      
      const student = await storage.createStudent(validation.data);
      
      await createAuditLog(
        userId,
        student.tenantId,
        "create_student",
        "student",
        student.id,
        { name: `${student.firstName} ${student.lastName}` },
        req
      );
      
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.post("/api/admin/students/bulk", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { students } = req.body;

      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: "Invalid request: students array required" });
      }

      // Validate all students
      const validatedStudents = [];
      const errors = [];
      
      for (let i = 0; i < students.length; i++) {
        const validation = insertStudentSchema.safeParse(students[i]);
        if (!validation.success) {
          errors.push({ index: i, errors: validation.error.errors });
        } else {
          validatedStudents.push(validation.data);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          message: "Some students have validation errors", 
          errors 
        });
      }

      // Create all students
      const createdStudents = [];
      for (const studentData of validatedStudents) {
        const student = await storage.createStudent(studentData);
        createdStudents.push(student);
      }

      // Log bulk import action (use first student's tenant for cross-tenant operations)
      const firstTenantId = createdStudents[0]?.tenantId || validatedStudents[0]?.tenantId;
      if (firstTenantId) {
        await createAuditLog(
          userId,
          firstTenantId,
          "bulk_import_students",
          "student",
          "bulk",
          { 
            count: createdStudents.length,
            tenantIds: Array.from(new Set(createdStudents.map(s => s.tenantId)))
          },
          req
        );
      }

      res.json({ 
        success: true, 
        count: createdStudents.length, 
        students: createdStudents 
      });
    } catch (error) {
      console.error("Error bulk importing students:", error);
      res.status(500).json({ message: "Failed to bulk import students" });
    }
  });

  app.put("/api/admin/students/:id", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const existingStudent = await storage.getStudentById(req.params.id);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const validation = insertStudentSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validation.error.errors 
        });
      }
      
      const student = await storage.updateStudent(req.params.id, validation.data);
      
      await createAuditLog(
        userId,
        student.tenantId,
        "update_student",
        "student",
        student.id,
        req.body,
        req
      );
      
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/admin/students/:id", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const student = await storage.getStudentById(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      await storage.deleteStudent(req.params.id);
      
      await createAuditLog(
        userId,
        student.tenantId,
        "delete_student",
        "student",
        req.params.id,
        { name: `${student.firstName} ${student.lastName}` },
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Entreprise Management
  app.post("/api/admin/entreprises", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = insertEntrepriseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validation.error.errors 
        });
      }
      
      const entreprise = await storage.createEntreprise(validation.data);
      
      await createAuditLog(
        userId,
        entreprise.tenantId,
        "create_entreprise",
        "entreprise",
        entreprise.id,
        { name: `${entreprise.raisonSociale} - ${entreprise.prenom} ${entreprise.nom}` },
        req
      );
      
      res.json(entreprise);
    } catch (error) {
      console.error("Error creating entreprise:", error);
      res.status(500).json({ message: "Failed to create entreprise" });
    }
  });

  // Programs Management
  app.get("/api/admin/programs", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const tenants = await storage.getAllTenants();
      let allPrograms: any[] = [];
      
      for (const tenant of tenants) {
        const programs = await storage.getPrograms(tenant.id);
        allPrograms = [...allPrograms, ...programs];
      }
      
      res.json(allPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });

  app.post("/api/admin/programs", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = insertProgramSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validation.error.errors 
        });
      }
      
      const program = await storage.createProgram(validation.data);
      
      await createAuditLog(
        userId,
        program.tenantId,
        "create_program",
        "program",
        program.id,
        { name: program.name },
        req
      );
      
      res.json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(500).json({ message: "Failed to create program" });
    }
  });

  app.put("/api/admin/programs/:id", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const existingProgram = await storage.getProgramById(req.params.id);
      if (!existingProgram) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      const validation = insertProgramSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validation.error.errors 
        });
      }
      
      const program = await storage.updateProgram(req.params.id, validation.data);
      
      await createAuditLog(
        userId,
        program.tenantId,
        "update_program",
        "program",
        program.id,
        req.body,
        req
      );
      
      res.json(program);
    } catch (error) {
      console.error("Error updating program:", error);
      res.status(500).json({ message: "Failed to update program" });
    }
  });

  app.delete("/api/admin/programs/:id", isAuthenticated, requireRole("OpsAdmin"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const program = await storage.getProgramById(req.params.id);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      await storage.deleteProgram(req.params.id);
      
      await createAuditLog(
        userId,
        program.tenantId,
        "delete_program",
        "program",
        req.params.id,
        { name: program.name },
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ message: "Failed to delete program" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
