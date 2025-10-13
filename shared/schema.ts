import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// SESSION & AUTH TABLES (Required for Replit Auth)
// ============================================================================

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("AnalystRO"), // OpsAdmin, BillingOps, AnalystRO
  tenantIds: text("tenant_ids").array().notNull().default(sql`'{}'::text[]`), // Accessible tenant IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["OpsAdmin", "BillingOps", "AnalystRO"]),
  tenantIds: z.array(z.string()),
});

export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================================================
// TENANT MANAGEMENT
// ============================================================================

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "École Paris Nord"
  slug: varchar("slug").notNull().unique(), // e.g., "paris-nord"
  filizApiKey: varchar("filiz_api_key"), // API key for Filiz API
  filizApiUrl: varchar("filiz_api_url"), // Base URL for Filiz API
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// ============================================================================
// STUDENTS
// ============================================================================

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  filizId: varchar("filiz_id"), // External ID from Filiz API
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  numeroOpco: varchar("numero_opco"), // Numéro OPCO
  numeroDekra: varchar("numero_dekra"), // Numéro DEKRA
  cachedData: jsonb("cached_data"), // Full cached data from Filiz API
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.union([z.date(), z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ).optional(),
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// ============================================================================
// ENTREPRISES (COMPANIES)
// ============================================================================

export const entreprises = pgTable("entreprises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  raisonSociale: varchar("raison_sociale").notNull(), // Company name
  nom: varchar("nom").notNull(), // Contact last name
  prenom: varchar("prenom").notNull(), // Contact first name
  email: varchar("email"),
  phone: varchar("phone"),
  filizId: varchar("filiz_id"), // External ID from Filiz API
  cachedData: jsonb("cached_data"), // Full cached data from Filiz API
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEntrepriseSchema = createInsertSchema(entreprises).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEntreprise = z.infer<typeof insertEntrepriseSchema>;
export type Entreprise = typeof entreprises.$inferSelect;

// ============================================================================
// CONTRACTS
// ============================================================================

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  studentId: varchar("student_id").references(() => students.id),
  filizId: varchar("filiz_id"), // External ID from Filiz API
  contractNumber: varchar("contract_number"),
  status: varchar("status").notNull(), // draft, in_progress, completed, cancelled
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  employerName: varchar("employer_name"),
  cfaName: varchar("cfa_name"),
  cachedData: jsonb("cached_data"), // Full cached data from Filiz API
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// ============================================================================
// DEVIS (QUOTES)
// ============================================================================

export const devis = pgTable("devis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  studentId: varchar("student_id").references(() => students.id),
  filizId: varchar("filiz_id"),
  devisNumber: varchar("devis_number"),
  status: varchar("status").notNull(), // pending, approved, rejected
  amount: integer("amount"), // in cents
  validUntil: timestamp("valid_until"),
  cachedData: jsonb("cached_data"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDevisSchema = createInsertSchema(devis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDevis = z.infer<typeof insertDevisSchema>;
export type Devis = typeof devis.$inferSelect;

// ============================================================================
// OPCO (Opérateurs de Compétences)
// ============================================================================

export const opco = pgTable("opco", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  contractId: varchar("contract_id").references(() => contracts.id),
  filizId: varchar("filiz_id"),
  opcoName: varchar("opco_name"),
  status: varchar("status").notNull(), // to_send, sent, validated, rejected
  submittedAt: timestamp("submitted_at"),
  validatedAt: timestamp("validated_at"),
  cachedData: jsonb("cached_data"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOpcoSchema = createInsertSchema(opco).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOpco = z.infer<typeof insertOpcoSchema>;
export type Opco = typeof opco.$inferSelect;

// ============================================================================
// RAC (Reste à Charge / Remaining Charges)
// ============================================================================

export const rac = pgTable("rac", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  contractId: varchar("contract_id").references(() => contracts.id),
  filizId: varchar("filiz_id"),
  invoiceNumber: varchar("invoice_number"),
  amount: integer("amount"), // in cents
  dueDate: timestamp("due_date"),
  status: varchar("status").notNull(), // pending, paid, overdue
  paidAt: timestamp("paid_at"),
  cachedData: jsonb("cached_data"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRacSchema = createInsertSchema(rac).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRac = z.infer<typeof insertRacSchema>;
export type Rac = typeof rac.$inferSelect;

// ============================================================================
// CERFA PDFs
// ============================================================================

export const cerfaPdfs = pgTable("cerfa_pdfs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  userId: varchar("user_id").notNull().references(() => users.id), // Who generated it
  formVersion: varchar("form_version").notNull().default("10103_10"), // CERFA form version
  storageUrl: text("storage_url").notNull(), // URL in object storage
  objectPath: text("object_path").notNull(), // Path in object storage
  fieldMappingVersion: varchar("field_mapping_version"), // Version of mapping JSON used
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCerfaPdfSchema = createInsertSchema(cerfaPdfs).omit({
  id: true,
  generatedAt: true,
  createdAt: true,
});

export type InsertCerfaPdf = z.infer<typeof insertCerfaPdfSchema>;
export type CerfaPdf = typeof cerfaPdfs.$inferSelect;

// ============================================================================
// TRAINING PROGRAMS
// ============================================================================

export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  filizId: varchar("filiz_id"), // External ID from Filiz API
  name: varchar("name").notNull(), // e.g., "CAP Pâtisserie"
  code: varchar("code"), // Program code
  level: varchar("level"), // e.g., "CAP", "BTS", "Licence Pro"
  duration: integer("duration"), // Duration in months
  rncpCode: varchar("rncp_code"), // RNCP certification code
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  cachedData: jsonb("cached_data"), // Full cached data from Filiz API
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  action: varchar("action").notNull(), // e.g., "generate_cerfa", "update_contract"
  entityType: varchar("entity_type"), // e.g., "contract", "student"
  entityId: varchar("entity_id"), // ID of the affected entity
  payload: jsonb("payload"), // Additional data about the action
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
