import {
  users,
  tenants,
  students,
  contracts,
  devis,
  opco,
  rac,
  cerfaPdfs,
  auditLogs,
  type User,
  type UpsertUser,
  type Tenant,
  type InsertTenant,
  type Student,
  type InsertStudent,
  type Contract,
  type InsertContract,
  type Devis,
  type InsertDevis,
  type Opco,
  type InsertOpco,
  type Rac,
  type InsertRac,
  type CerfaPdf,
  type InsertCerfaPdf,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Tenant operations
  getTenants(): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;

  // Student operations
  getStudents(tenantId: string): Promise<Student[]>;
  searchStudents(tenantId: string, query: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;

  // Contract operations
  getContracts(tenantId: string, statusFilter?: string): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;

  // Devis operations
  getDevisList(tenantId: string): Promise<Devis[]>;
  getDevis(id: string): Promise<Devis | undefined>;
  createDevis(devisData: InsertDevis): Promise<Devis>;

  // OPCO operations
  getOpcoList(tenantId: string): Promise<Opco[]>;
  getOpco(id: string): Promise<Opco | undefined>;
  createOpco(opcoData: InsertOpco): Promise<Opco>;

  // RAC operations
  getRacList(tenantId: string): Promise<Rac[]>;
  getRac(id: string): Promise<Rac | undefined>;
  createRac(racData: InsertRac): Promise<Rac>;

  // CERFA PDF operations
  getCerfaPdfsForContract(contractId: string): Promise<CerfaPdf[]>;
  createCerfaPdf(cerfaPdf: InsertCerfaPdf): Promise<CerfaPdf>;

  // Audit log operations
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Tenant operations
  async getTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).where(eq(tenants.isActive, true));
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(tenantData).returning();
    return tenant;
  }

  // Student operations
  async getStudents(tenantId: string): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(eq(students.tenantId, tenantId))
      .orderBy(desc(students.createdAt));
  }

  async searchStudents(tenantId: string, query: string): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.tenantId, tenantId),
          or(
            like(students.firstName, `%${query}%`),
            like(students.lastName, `%${query}%`),
            like(students.email, `%${query}%`)
          )
        )
      );
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(studentData).returning();
    return student;
  }

  // Contract operations
  async getContracts(tenantId: string, statusFilter?: string): Promise<Contract[]> {
    const conditions = [eq(contracts.tenantId, tenantId)];
    if (statusFilter && statusFilter !== "all") {
      conditions.push(eq(contracts.status, statusFilter));
    }

    return await db
      .select()
      .from(contracts)
      .where(and(...conditions))
      .orderBy(desc(contracts.createdAt));
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async createContract(contractData: InsertContract): Promise<Contract> {
    const [contract] = await db.insert(contracts).values(contractData).returning();
    return contract;
  }

  // Devis operations
  async getDevisList(tenantId: string): Promise<Devis[]> {
    return await db
      .select()
      .from(devis)
      .where(eq(devis.tenantId, tenantId))
      .orderBy(desc(devis.createdAt));
  }

  async getDevis(id: string): Promise<Devis | undefined> {
    const [devisItem] = await db.select().from(devis).where(eq(devis.id, id));
    return devisItem;
  }

  async createDevis(devisData: InsertDevis): Promise<Devis> {
    const [devisItem] = await db.insert(devis).values(devisData).returning();
    return devisItem;
  }

  // OPCO operations
  async getOpcoList(tenantId: string): Promise<Opco[]> {
    return await db
      .select()
      .from(opco)
      .where(eq(opco.tenantId, tenantId))
      .orderBy(desc(opco.createdAt));
  }

  async getOpco(id: string): Promise<Opco | undefined> {
    const [opcoItem] = await db.select().from(opco).where(eq(opco.id, id));
    return opcoItem;
  }

  async createOpco(opcoData: InsertOpco): Promise<Opco> {
    const [opcoItem] = await db.insert(opco).values(opcoData).returning();
    return opcoItem;
  }

  // RAC operations
  async getRacList(tenantId: string): Promise<Rac[]> {
    return await db
      .select()
      .from(rac)
      .where(eq(rac.tenantId, tenantId))
      .orderBy(desc(rac.createdAt));
  }

  async getRac(id: string): Promise<Rac | undefined> {
    const [racItem] = await db.select().from(rac).where(eq(rac.id, id));
    return racItem;
  }

  async createRac(racData: InsertRac): Promise<Rac> {
    const [racItem] = await db.insert(rac).values(racData).returning();
    return racItem;
  }

  // CERFA PDF operations
  async getCerfaPdfsForContract(contractId: string): Promise<CerfaPdf[]> {
    return await db
      .select()
      .from(cerfaPdfs)
      .where(eq(cerfaPdfs.contractId, contractId))
      .orderBy(desc(cerfaPdfs.generatedAt));
  }

  async createCerfaPdf(cerfaPdfData: InsertCerfaPdf): Promise<CerfaPdf> {
    const [cerfaPdf] = await db.insert(cerfaPdfs).values(cerfaPdfData).returning();
    return cerfaPdf;
  }

  // Audit log operations
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  async createAuditLog(auditLogData: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(auditLogData).returning();
    return auditLog;
  }
}

export const storage = new DatabaseStorage();
