// Seed database with test data
import { storage } from "./storage";

async function seed() {
  console.log("Seeding database...");

  // Create three tenant schools
  const schools = [
    {
      name: "École Paris Nord",
      slug: "paris-nord",
      filizApiKey: "demo_key_paris_nord",
      filizApiUrl: "https://api.filiz.example.com",
      isActive: true,
    },
    {
      name: "École Lyon Centre",
      slug: "lyon-centre",
      filizApiKey: "demo_key_lyon_centre",
      filizApiUrl: "https://api.filiz.example.com",
      isActive: true,
    },
    {
      name: "École Marseille Sud",
      slug: "marseille-sud",
      filizApiKey: "demo_key_marseille_sud",
      filizApiUrl: "https://api.filiz.example.com",
      isActive: true,
    },
  ];

  const createdTenants = [];
  for (const school of schools) {
    const tenant = await storage.createTenant(school);
    createdTenants.push(tenant);
    console.log(`Created tenant: ${tenant.name}`);

    // Create sample students for each school
    for (let i = 0; i < 5; i++) {
      await storage.createStudent({
        tenantId: tenant.id,
        filizId: `filiz_student_${tenant.slug}_${i}`,
        firstName: `Student${i}`,
        lastName: `${tenant.name.split(" ")[1]}`,
        email: `student${i}@${tenant.slug}.example.com`,
        phone: `06${Math.floor(Math.random() * 100000000)}`,
        dateOfBirth: new Date(1995 + i, i, 15),
        cachedData: null,
        lastSyncedAt: new Date(),
      });
    }

    // Create sample contracts
    for (let i = 0; i < 3; i++) {
      const statuses = ["draft", "in_progress", "completed"];
      await storage.createContract({
        tenantId: tenant.id,
        studentId: null,
        filizId: `filiz_contract_${tenant.slug}_${i}`,
        contractNumber: `CTR-${tenant.slug.toUpperCase()}-2024-${String(i + 1).padStart(3, "0")}`,
        status: statuses[i % 3],
        startDate: new Date(2024, i, 1),
        endDate: new Date(2025, i, 1),
        employerName: `Entreprise ${i + 1} ${tenant.name.split(" ")[1]}`,
        cfaName: tenant.name,
        cachedData: null,
        lastSyncedAt: new Date(),
      });
    }

    // Create sample devis
    for (let i = 0; i < 2; i++) {
      const statuses = ["pending", "approved"];
      await storage.createDevis({
        tenantId: tenant.id,
        studentId: null,
        filizId: `filiz_devis_${tenant.slug}_${i}`,
        devisNumber: `DEV-${tenant.slug.toUpperCase()}-2024-${String(i + 1).padStart(3, "0")}`,
        status: statuses[i % 2],
        amount: (5000 + i * 1000) * 100, // in cents
        validUntil: new Date(2024, 11, 31),
        cachedData: null,
        lastSyncedAt: new Date(),
      });
    }

    // Create sample OPCO
    for (let i = 0; i < 2; i++) {
      const statuses = ["to_send", "sent"];
      await storage.createOpco({
        tenantId: tenant.id,
        contractId: null,
        filizId: `filiz_opco_${tenant.slug}_${i}`,
        opcoName: `OPCO ${["Atlas", "EP", "Mobilités"][i % 3]}`,
        status: statuses[i % 2],
        submittedAt: i === 1 ? new Date() : null,
        validatedAt: null,
        cachedData: null,
        lastSyncedAt: new Date(),
      });
    }

    // Create sample RAC
    for (let i = 0; i < 2; i++) {
      const statuses = ["pending", "paid"];
      await storage.createRac({
        tenantId: tenant.id,
        contractId: null,
        filizId: `filiz_rac_${tenant.slug}_${i}`,
        invoiceNumber: `INV-${tenant.slug.toUpperCase()}-2024-${String(i + 1).padStart(3, "0")}`,
        amount: (1500 + i * 500) * 100,
        dueDate: new Date(2024, 10 - i, 15),
        status: statuses[i % 2],
        paidAt: i === 1 ? new Date() : null,
        cachedData: null,
        lastSyncedAt: new Date(),
      });
    }
  }

  console.log("Seeding complete!");
  console.log(`Created ${createdTenants.length} tenants with sample data`);
}

seed().catch(console.error);
