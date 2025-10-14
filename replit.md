# 0 à 1 Formation - Multi-School Platform

## Overview
Internal, multi-tenant administration platform for managing three schools (0 à 1 Formation network) using the Filiz API as the single source of truth. The platform provides unified dashboards, CERFA PDF generation, contract/devis/OPCO/RAC management, and cross-school analytics.

## Tech Stack
- **Frontend**: React with Wouter routing, TanStack Query, Tailwind CSS, Shadcn UI
- **Backend**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL (via Replit) with Drizzle ORM
- **Storage**: Replit Object Storage for PDF documents
- **Auth**: Clerk Authentication (migrated from Replit Auth)
- **PDF Generation**: pdf-lib

## Architecture

### Multi-Tenant Design
- Three schools managed through single interface
- Tenant switcher allows switching between schools or viewing aggregate "All Schools" data
- All database queries scoped by tenant ID
- Role-based access control (OpsAdmin, BillingOps, AnalystRO)

### Data Model
Core entities:
- **Tenants**: School configurations with Filiz API credentials
- **Users**: Staff with role-based permissions
- **Students**: Student records cached from Filiz API
- **Entreprises**: Company/employer records with contact information (raison sociale, contact person, tenant-scoped)
- **Programs**: Training programs (CAP, BTS, etc.) with RNCP codes
- **Contracts**: Training contracts with status tracking
- **Devis**: Quote/estimate records
- **OPCO**: OPCO submission tracking
- **RAC**: Remaining charges/invoices
- **CERFA PDFs**: Generated form documents with audit trail
- **Audit Logs**: Immutable compliance trail

### Key Features
1. **Dashboard**: 
   - KPIs per school (contracts in progress, OPCO to send, devis pending, RAC overdue)
   - **Create Dossier**: Quick-create button for schools or entreprises directly from dashboard (tabbed interface)
2. **Students Module**: Search, filter, autocomplete for linking to contracts
3. **Contracts Module**: List view with filters, detail view, CERFA generation
4. **CERFA PDF Generation**: Fill CERFA 10103*10 forms from contract data using pdf-lib
5. **Devis/OPCO/RAC**: Read-only tables with CSV export capability
6. **Audit Logs**: Comprehensive activity tracking for compliance
7. **Admin Panel** (OpsAdmin only):
   - Schools Management: Add/edit/delete schools with Filiz API configuration + CSV export
   - Students Management: Add/edit/delete students across all schools + CSV export + **CSV import**
   - Programs Management: Add/edit/delete training programs with RNCP codes + CSV export
   - Users Management: Add/edit/delete users with role and school access control
   - Activity Dashboard: Recent admin actions with statistics and filtering
8. **FilizAdapter**: Abstraction layer for all Filiz API interactions

## Development Status
**Phase 1 (Completed)**: Schema & Frontend
- ✅ Complete data model defined in shared/schema.ts
- ✅ Design system configured (Inter font, JetBrains Mono, dark mode default)
- ✅ Authentication flow (Landing/Dashboard pages)
- ✅ Sidebar navigation with tenant switcher
- ✅ All module pages (Students, Contracts, Devis, OPCO, RAC, Audit)
- ✅ KPI cards and data tables
- ✅ Contract detail with CERFA generation UI
- ✅ Dark mode toggle
- ✅ Responsive layouts

**Phase 2 (Pending)**: Backend Implementation
- Database migrations with Drizzle
- Replit Auth setup with role middleware
- FilizAdapter service
- All API endpoints
- CERFA PDF generation service
- Object storage integration
- Tenant isolation middleware

**Phase 3 (Pending)**: Integration & Testing
- Connect frontend to backend
- Error handling and loading states
- CSV export functionality
- End-to-end testing

## Design System
- **Primary Color**: Professional blue (210 100% 55%)
- **Font**: Inter for UI, JetBrains Mono for code/technical data
- **Dark Mode**: Default theme
- **Components**: Shadcn UI with custom KPI cards, data tables
- **Spacing**: Consistent p-4/p-6/p-8 system
- **Status Colors**: Success (green), Warning (yellow), Danger (red), Info (blue)

## User Roles
- **OpsAdmin**: Full access including audit logs and admin panel (schools, students, programs management)
- **BillingOps**: Contract and financial data access
- **AnalystRO**: Read-only access to analytics

## Recent Changes (October 2025)
- ✅ **Migration vers Clerk Authentication**: Système d'authentification modernisé
  - Migration complète de Replit Auth vers Clerk
  - Frontend: ClerkProvider, SignInButton, SignUpButton, UserButton
  - Backend: @clerk/express middleware avec gestion des clés API
  - Hook useAuth mis à jour pour utiliser Clerk
  - Requiert CLERK_PUBLISHABLE_KEY et CLERK_SECRET_KEY dans les secrets Replit
  - Interface de connexion/inscription en français
- ✅ **Rebranding "0 à 1 Formation"**: Application renommée
  - Nom de l'app changé de "Filiz Admin" → "0 à 1 Formation"
  - Icône d'en-tête changée: Building2 → School (icône d'école)
  - Titre HTML mis à jour
  - Branding cohérent sur toutes les pages
  - Boutons "Get Started" → "Commencer", "Log in" → "Connexion"
- ✅ **Traduction Complète en Français**: Interface entièrement traduite
  - Pages traduites: Dashboard, Landing, Students, Contracts, Devis, OPCO, RAC, Audit Logs, Contract Detail, Not Found
  - Composants traduits: AppSidebar (avec icône School), TenantSwitcher
  - Navigation, messages d'erreur, toasts et formulaires en français
  - Tous les labels, boutons, titres, descriptions et placeholders
  - Interface 100% française pour toutes les fonctionnalités principales
- ✅ **Entreprise Management**: Added full entreprise (company/employer) management system
  - **Database Schema**: New entreprises table with raison_sociale, nom, prenom, email, phone, tenant-scoped
  - **Create Dossier Update**: Changed from School/Student to School/Entreprise tabbed interface
  - **Backend API**: POST /api/admin/entreprises endpoint with validation and audit logging
  - **Storage Layer**: Full CRUD operations for entreprises
  - **Client-side Validation**: Toast-based error messages for required fields
  - **Audit Trail**: All entreprise operations logged with action="create_entreprise"
  - Fully tested end-to-end with validation scenarios and database verification
- ✅ **Program Name Correction**: Updated RPMS to "Responsable de Petite et Moyenne Structure" (was "Responsable Point de Vente...")
- ✅ **CSV Import Feature for Students**: Complete bulk student creation system
  - **Upload & Preview**: CSV file upload with editable preview table
  - **Template Download**: Downloadable CSV template with correct headers
  - **Smart Validation**: 
    - School matching by name or slug (e.g., "École Paris Nord" or "paris-nord")
    - Date format validation (YYYY-MM-DD) with inline error feedback
    - Required field validation (firstName, lastName, school)
    - Visual indicators (red borders) for invalid data
  - **Bulk Import API**: POST /api/admin/students/bulk endpoint with batch processing
  - **Error Handling**: Clear toast messages for validation errors, prevents crashes on invalid dates
  - **Audit Logging**: Bulk import actions logged with student count and tenant distribution
  - Fully tested end-to-end with validation scenarios
- ✅ **Tenant Switcher Fix**: Auto-update user access to all active schools on every login
- ✅ **Create Dossier Feature**: Quick-create dialog on dashboard for schools and entreprises with tabbed interface
  - **Bug Fix**: Resolved user auto-creation issue - all Replit Auth users now automatically get OpsAdmin role
  - **Bug Fix**: Fixed apiRequest parameter order in mutations (method, url, data)
  - Fully tested end-to-end with successful school/entreprise creation
- ✅ Added Programs table to database schema (training programs with RNCP codes)
- ✅ Built complete Admin Panel with five modules:
  - Schools Management: CRUD operations for tenants/schools
  - Students Management: Cross-school student management with search/filter + CSV import
  - Programs Management: Training programs (CAP, BTS, etc.) with metadata
  - Users Management: OpsAdmins can manage users, roles, and school access
  - Activity Dashboard: Recent administrative actions from audit logs with stats
- ✅ CSV Export: One-click CSV export for schools, students, and programs
- ✅ Added admin routes with OpsAdmin role restriction
- ✅ Updated sidebar navigation with admin section (visible to OpsAdmin only)
- ✅ Implemented all storage methods for programs, users, tenant updates/deletes, student updates/deletes
- ✅ Added audit logging for all admin operations
- ✅ Integrated Filiz API documentation research (https://documentation.filiz.io/)
- ✅ Created CERFA 10103*10 field mapping system (181 form fields analyzed)

## Next Steps
1. Implement database migrations
2. Set up Replit Auth server-side
3. Create FilizAdapter for API integration
4. Implement all backend endpoints
5. Build CERFA PDF generation service
6. Connect frontend to backend
7. Test complete user journeys
