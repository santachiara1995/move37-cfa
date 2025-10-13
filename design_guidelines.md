# Design Guidelines: Filiz Multi-School Administration Platform

## Design Approach
**Design System**: Fluent Design System with modern SaaS admin patterns (inspired by Linear, Retool, Notion)
**Rationale**: Enterprise productivity tool requiring information-dense layouts, efficient workflows, and data-heavy interfaces. Fluent provides the structural foundation while modern SaaS patterns ensure intuitive navigation and contemporary aesthetics.

## Core Design Principles
1. **Clarity Over Decoration**: Every element serves a functional purpose
2. **Information Hierarchy**: Dense data presented with clear visual structure
3. **Workflow Efficiency**: Minimize clicks, maximize context visibility
4. **Professional Restraint**: Subtle, sophisticated aesthetics for enterprise users

---

## Color Palette

### Dark Mode (Primary)
- **Background**: 220 15% 8% (deep slate, main app background)
- **Surface**: 220 14% 12% (elevated panels, cards, tables)
- **Surface Elevated**: 220 13% 15% (modals, dropdowns)
- **Border**: 220 13% 20% (subtle dividers)
- **Border Strong**: 220 12% 28% (emphasized borders, table lines)

### Light Mode (Secondary)
- **Background**: 0 0% 98% (soft white)
- **Surface**: 0 0% 100% (pure white cards)
- **Border**: 220 13% 88% (light gray dividers)
- **Border Strong**: 220 12% 75% (emphasized borders)

### Brand Colors
- **Primary**: 210 100% 55% (professional blue for CTAs, active states)
- **Primary Hover**: 210 100% 48%
- **Success**: 142 71% 45% (contract approved, OPCO sent)
- **Warning**: 38 92% 50% (pending actions, devis awaiting)
- **Danger**: 0 84% 60% (overdue RAC, failed operations)
- **Info**: 199 89% 48% (neutral informational states)

### Text Colors (Dark Mode)
- **Primary**: 0 0% 98% (main content)
- **Secondary**: 220 9% 65% (labels, supporting text)
- **Tertiary**: 220 9% 45% (placeholder, disabled states)

### Text Colors (Light Mode)
- **Primary**: 220 15% 15% (main content)
- **Secondary**: 220 13% 45% (labels)
- **Tertiary**: 220 9% 60% (placeholder)

---

## Typography

### Font Families
- **Primary**: Inter (via Google Fonts) - headings, UI elements, data
- **Monospace**: JetBrains Mono - code, API keys, technical data

### Type Scale
- **Display**: 32px/40px, font-weight 600 (dashboard headers)
- **H1**: 24px/32px, font-weight 600 (page titles)
- **H2**: 20px/28px, font-weight 600 (section headers)
- **H3**: 16px/24px, font-weight 600 (card titles, table headers)
- **Body Large**: 16px/24px, font-weight 400 (primary content)
- **Body**: 14px/20px, font-weight 400 (standard UI text)
- **Body Small**: 13px/18px, font-weight 400 (table cells, metadata)
- **Caption**: 12px/16px, font-weight 400 (timestamps, helper text)
- **Code**: 13px/20px, JetBrains Mono (API responses, technical)

---

## Layout System

### Spacing Units (Tailwind)
**Core Set**: Use 2, 3, 4, 6, 8, 12, 16 as primary spacing values
- Tight spacing: p-2, gap-3 (compact tables, icon-text pairs)
- Standard spacing: p-4, gap-4 (cards, form groups)
- Generous spacing: p-6, p-8 (page margins, section padding)
- Large spacing: p-12, p-16 (dashboard panels, major sections)

### Grid Structure
- **Main Container**: max-w-screen-2xl mx-auto (accommodates wide tables)
- **Sidebar**: w-64 fixed (tenant switcher, navigation)
- **Content Area**: flex-1 with px-6 lg:px-8 (responsive padding)
- **Multi-Column Data**: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

---

## Component Library

### Navigation & Layout
- **Top Bar**: Fixed header with tenant switcher (dropdown), user menu, notifications. Height: h-16, bg-surface with border-b
- **Sidebar**: Collapsible navigation with module icons. Active state with primary color accent border-l-2
- **Breadcrumbs**: Secondary text with chevron separators showing navigation hierarchy

### Dashboard Components
- **KPI Cards**: Surface background, 4px rounded corners, p-6. Large metric (text-3xl font-semibold), label below (text-sm text-secondary). Status indicator dot for at-risk items
- **Chart Container**: Surface elevated background, p-6, rounded-lg. Title (h3), date range selector (top-right), responsive chart area

### Data Tables (TanStack)
- **Table Header**: bg-surface-elevated, sticky top-0, text-sm font-semibold text-secondary, py-3 px-4
- **Table Row**: border-b border, hover:bg-surface transition, py-3 px-4
- **Pagination**: Bottom bar with page numbers, items per page selector, total count display
- **Filters**: Top bar with search input, status dropdowns, date range picker. Clear all button (text-sm text-primary)
- **Actions Column**: Icon buttons (edit, download, delete) with tooltips on hover

### Forms & Inputs
- **Text Input**: h-10, bg-surface, border border-strong, rounded-md, px-3. Focus: ring-2 ring-primary
- **Select/Dropdown**: Same styling as text input, chevron-down icon right-aligned
- **Autocomplete**: Dropdown results with highlighted match text, max-height with scroll
- **Button Primary**: bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md font-medium
- **Button Secondary**: border border-strong hover:bg-surface text-primary px-4 py-2 rounded-md
- **Button Danger**: bg-danger hover:bg-danger-dark text-white (for destructive actions)

### Modals & Overlays
- **Modal Background**: bg-black/50 backdrop-blur-sm fixed inset-0
- **Modal Panel**: bg-surface rounded-lg shadow-2xl max-w-2xl w-full p-6
- **Modal Header**: flex justify-between items-center mb-6, h3 title, close button
- **Toast Notifications**: Fixed top-right, slide-in animation, auto-dismiss after 5s. Success/error variants

### Status Indicators
- **Badge**: Rounded-full px-2.5 py-0.5 text-xs font-medium
  - Success: bg-success/10 text-success
  - Warning: bg-warning/10 text-warning
  - Danger: bg-danger/10 text-danger
  - Neutral: bg-border text-secondary
- **Progress Bar**: h-2 bg-border rounded-full, inner fill with primary color based on percentage

### Tenant Switcher
- **Dropdown Trigger**: Surface background, border, rounded-md, px-4 py-2, school name + chevron
- **Dropdown Menu**: Surface elevated, shadow-lg, rounded-lg, py-2. Each school option with hover state
- **"All Schools" Option**: Border-b separator, distinct styling to indicate aggregate view

---

## Audit & Compliance UI
- **Audit Log Table**: Monospace font for IDs, timestamps in caption size, action type with color-coded badges
- **Immutable Indicator**: Lock icon with tooltip explaining append-only nature
- **Export Controls**: Date range selector, CSV/Excel format toggle, download button

---

## Animations
**Minimal & Purposeful**:
- Hover states: 150ms ease transition on background-color, border-color
- Modal/drawer: 200ms ease slide-in/fade-in
- Loading states: Subtle skeleton loaders, no spinners unless brief (<1s operations)
- Page transitions: None - instant navigation for data-heavy application

---

## Images
**No Hero Images**: This is a utility application, not marketing
**Icon Usage**: Heroicons (outline for navigation, solid for status indicators)
**Data Visualization**: Chart.js or Recharts for KPI graphs with brand color palette
**Empty States**: Simple illustration with "No data" message and CTA to add first item

---

## Accessibility & Dark Mode
- Maintain WCAG AA contrast ratios (4.5:1 for text)
- Dark mode as default with toggle in user menu
- Consistent form input styling across all color modes (background always defined)
- Focus indicators (ring-2) visible in both modes
- Keyboard navigation fully supported (table row focus, modal trap focus)