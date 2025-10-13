# Filiz Multi-School Front-End

## Overview
Internal, multi-tenant administration platform for managing three schools using the Filiz API as the single source of truth. The platform provides unified dashboards, CERFA PDF generation, contract/devis/OPCO/RAC management, and cross-school analytics.

## Tech Stack
- **Frontend**: React with Wouter routing, TanStack Query, Tailwind CSS, Shadcn UI
- **Backend**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL (via Replit) with Drizzle ORM
- **Storage**: Replit Object Storage for PDF documents
- **Auth**: Replit Auth with OIDC
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
- **Contracts**: Training contracts with status tracking
- **Devis**: Quote/estimate records
- **OPCO**: OPCO submission tracking
- **RAC**: Remaining charges/invoices
- **CERFA PDFs**: Generated form documents with audit trail
- **Audit Logs**: Immutable compliance trail

### Key Features
1. **Dashboard**: KPIs per school (contracts in progress, OPCO to send, devis pending, RAC overdue)
2. **Students Module**: Search, filter, autocomplete for linking to contracts
3. **Contracts Module**: List view with filters, detail view, CERFA generation
4. **CERFA PDF Generation**: Fill CERFA 10103*10 forms from contract data using pdf-lib
5. **Devis/OPCO/RAC**: Read-only tables with CSV export capability
6. **Audit Logs**: Comprehensive activity tracking for compliance
7. **FilizAdapter**: Abstraction layer for all Filiz API interactions

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
- **OpsAdmin**: Full access including audit logs
- **BillingOps**: Contract and financial data access
- **AnalystRO**: Read-only access to analytics

## Recent Changes
- Created complete database schema with 9 core tables
- Built all frontend components and pages
- Implemented tenant context and switcher
- Added dark mode support with theme toggle
- Created authentication flow with Replit Auth integration
- Designed responsive layouts for all modules

## Next Steps
1. Implement database migrations
2. Set up Replit Auth server-side
3. Create FilizAdapter for API integration
4. Implement all backend endpoints
5. Build CERFA PDF generation service
6. Connect frontend to backend
7. Test complete user journeys
