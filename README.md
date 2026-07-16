# AGENTIC Farm Tracking — Frontend

The web client for the **BSL Farm Management System**: a role-based dashboard for multi-farm operations covering payroll, attendance, procurement & inventory, coffee picking, factory processing, godown stock, harvest planning, and analytics.

Built with **Next.js 15 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui** (Radix primitives). It talks to the FastAPI backend over a JWT-authenticated REST API.

---

## Quick Start

### Prerequisites

- **Node.js 20+** and npm
- The **backend API** running locally on `http://localhost:8000` (see the `bsl` repo). The dev server proxies `/api/*` to it — API calls fail without it.

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a backend user account.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server on `localhost:3000` (hot reload) |
| `npm run build` | Production build — also runs the TypeScript check |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint validation |

> No test framework is configured.

---

## Backend Connection

The Next.js dev server proxies all `/api/*` requests to the backend, configured in **`next.config.ts`**:

```ts
async rewrites() {
  return [{ source: "/api/:path*", destination: "http://localhost:8000/api/:path*" }];
}
```

To point at a deployed backend (e.g. Cloud Run), change the `destination`. All API calls in the app use the relative base URL `/api` (`src/constants/index.ts` → `API_BASE_URL`), so nothing else needs to change.

---

## Architecture

### Routing & pages

Two routes only:

- `/` — Login (`src/app/page.tsx`)
- `/dashboard` — Role-based dashboard (`src/app/dashboard/page.tsx`)

`src/proxy.ts` guards routes via a `token` cookie: unauthenticated users hitting `/dashboard` are redirected to `/`, and authenticated users hitting `/` are redirected to `/dashboard`.

### Role-based dashboards

`/dashboard` reads the signed-in user's role from auth context and dynamically imports (`next/dynamic`) the matching dashboard from `src/components/dashboards/`. Every dashboard receives `{ user, onLogout }` and wraps its content in `<ErrorBoundary>` + `<Layout>`.

Notable role → dashboard mappings:

| Role | Dashboard |
|---|---|
| `general_manager` | `HarvestOperationsDashboard` |
| `scale_supervisor` | `PickingDashboard` |
| `managing_director` | `AdminManagerDashboard` |
| `sub_supervisor` | shares `SupervisorDashboard` |

Each dashboard is a set of tab panels kept mounted once visited (to preserve data across tab switches) and composed from **section components** in `src/components/dashboards/sections/` (67+ files).

Section naming conventions:

- `{Role}{Feature}Section` — role-specific (e.g. `ManagerPayrollSection`)
- `Shared{Feature}Section` — reused across roles; takes a `userRole` prop to adjust permissions (e.g. `SharedSmrSection`)
- `Md{Feature}Section` — Managing Director-specific

New sections must be exported from `src/components/dashboards/sections/index.ts`.

### Layout system

Every dashboard uses `src/components/layout/Layout.tsx`, which composes the shadcn `SidebarProvider` + `AppSidebar` + `SiteHeader`. The sidebar takes a `NavItem[]`; items with a `children` array render as collapsible groups (`NavMain.tsx`).

### State management

- **Auth** — React Context (`src/contexts/AuthContext.tsx`). Use `useAuth()` → `{ user, login, logout, isAuthenticated }`. Token and user are persisted to `localStorage` and a `token` cookie (the cookie is what route middleware reads).
- **Data fetching** — `useApi<T>(apiCall, options)` and `useMultipleApi` (`src/hooks/useApi.ts`) → `{ data, loading, error, refetch }`. `useApi` re-runs when its `dependencies` change; `useMultipleApi` runs calls in parallel with `Promise.allSettled`.
- No Redux or Zustand.

### API services

`src/services/api/` holds domain services (activities, analytics, attendance, auth, calendar, expenses, farms, items, management, payroll, photos, procurement, reports, stock, tasks, transfers, users, workers). Each extends `BaseApiService` (`base.ts`), which centralizes auth headers, 401 session-expiry handling, 5xx retries, file uploads, and downloads.

`src/services/api/index.ts` exports a singleton `apiService`; components import it directly for both reads and mutations.

### Types, constants & validation

- Shared TypeScript interfaces: `src/types/index.ts`
- Role identifiers (17 roles): `src/constants/index.ts` → `USER_ROLES`
- Zod schemas by domain: `src/lib/schemas/` (`auth`, `attendance`, `items`, `procurement`, `tasks`, `users`)

### Common components

Reusable primitives in `src/components/common/`: `StatusBadge`, `ApprovalStatusBadge`, `ActivityTypeBadge`, `EmptyState`, `LoadingSpinner`, `Pagination`, `ErrorBoundary` (required wrapper for all dashboards), and `SaturdayWeekPicker` (payroll weeks end on Saturday).

---

## Domain Notes

### Procurement & inventory

**External chain:** `SMR → PFI → LPO → GRN → CARDEX` · **Internal chain:** `SIMR → GIN → CARDEX`

CARDEX is the running stock ledger — updated on every GRN (stock **IN**) and GIN issuance (stock **OUT**). Approval thresholds (TZS): Manager-only `< 5M`, requires GM `≥ 5M`, requires MD `≥ 20M`.

### Fuel & Chemicals

Stock movements are recorded as a structured **From → To** where each side is one of `Farm CARDEX`, `Block`, or `External / Supplier`. Blocks are within-farm, so the block picker loads blocks for the CARDEX-side farm chosen in the movement.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI | React 18, Radix UI + shadcn/ui (`src/components/ui/`) |
| Styling | Tailwind CSS (HSL CSS variables; dark mode via `class`) |
| Forms | `react-hook-form` + `zod` |
| Charts | `recharts` |
| Calendar | FullCalendar |
| Toasts | `sonner` |
| Icons | `lucide-react` |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router (login + dashboard pages)
├── components/
│   ├── dashboards/         # Role dashboards + sections/ (feature panels)
│   ├── layout/             # Layout, AppSidebar, SiteHeader, NavMain
│   ├── common/             # Shared primitives (badges, ErrorBoundary, ...)
│   └── ui/                 # shadcn/ui components
├── contexts/               # AuthContext
├── hooks/                  # useApi, useMultipleApi
├── services/api/           # Domain API services over BaseApiService
├── lib/schemas/            # Zod validation schemas
├── types/                  # Shared TypeScript interfaces
├── constants/              # Roles, API base URL, storage keys
└── proxy.ts                # Route auth guard
```
