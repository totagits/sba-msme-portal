# SBA MSMEs Online Database and Reporting Portal

> **Bureau of Small Business Administration (SBA)**
> Ministry of Commerce and Industry — Republic of Liberia
> PAYEI Program — Sub-Project A: Youth Entrepreneurship and Investment Bank (YEIB)

---

## Overview

A production-ready, government-grade national inventory system for **Micro, Small, and Medium Enterprises (MSMEs)** and **Business Development Service Providers (BDSPs)** across all 15 counties of Liberia. Built for policy decisions, financial inclusion, youth/women entrepreneurship monitoring, and donor reporting.

## Key Features

| Feature | Description |
|---|---|
| 📊 Executive Dashboard | Real-time KPIs, charts by county/sector/category, data quality gauge |
| 🏢 MSME Registry | 5-step registration wizard, workflow approval pipeline, GPS capture |
| 👥 BDSP Directory | Service provider registry with availability status and service matching |
| 🗺️ GIS Map | Leaflet-based interactive map with MSME + BDSP layers and county filters |
| 📄 Report Engine | Configurable national/county/sector/inclusion reports with CSV export |
| 📥 Bulk Import | Drag-and-drop CSV/Excel upload with dedup, validation, and rollback |
| 📴 Offline PWA | IndexedDB-backed offline field data collection + sync status |
| 🔐 RBAC Security | 10 user roles, permission-based UI, JWT + refresh tokens, audit log |
| 🔔 Notifications | In-app notification system with real-time unread count |
| 🛡️ Audit Trail | Full audit log of all system actions with user, entity, IP tracking |

## Tech Stack

### Backend
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma + PostgreSQL 16
- **Auth**: JWT (access + refresh), bcrypt, RBAC middleware
- **Validation**: Zod
- **File Upload**: Multer (max 10MB)
- **API Docs**: Swagger UI at `/api/docs`

### Frontend
- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS 3 (custom Liberian government palette)
- **State**: TanStack Query (React Query) v5
- **Forms**: React Hook Form + Zod
- **Routing**: Wouter (lightweight client router)
- **Charts**: Recharts
- **Maps**: Leaflet
- **Offline**: Dexie (IndexedDB)
- **PWA**: vite-plugin-pwa + Workbox

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm 10+

### 1. Install Dependencies

```bash
# From monorepo root
npm install

# Install backend deps
cd apps/backend && npm install

# Install frontend deps  
cd apps/frontend && npm install
```

### 2. Configure Environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `.env` with your database connection and secrets (see [Environment Variables](#environment-variables)).

### 3. Initialize Database

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma db seed
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend API (port 3001)
cd apps/backend && npm run dev

# Terminal 2 — Frontend dev server (port 5173)
cd apps/frontend && npm run dev
```

Open http://localhost:5173

### Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@sba.gov.lr | ChangeMe123! |
| SBA Director | director@sba.gov.lr | ChangeMe123! |
| Data Officer | data.officer@sba.gov.lr | ChangeMe123! |
| County Officer | county.officer@sba.gov.lr | ChangeMe123! |
| Verifier | verifier@sba.gov.lr | ChangeMe123! |
| Viewer | viewer@sba.gov.lr | ChangeMe123! |

> ⚠️ **Change all passwords immediately before deploying to production.**

## Docker Deployment

```bash
# Production full-stack (PostgreSQL + Redis + Backend + Frontend)
docker compose up -d

# View logs
docker compose logs -f backend

# Run migrations inside container
docker compose exec backend npx prisma migrate deploy
```

Access the portal at http://localhost:3000

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret |
| `JWT_EXPIRES_IN` | — | Access token expiry (default: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | — | Refresh token expiry (default: `7d`) |
| `PORT` | — | API server port (default: `3001`) |
| `UPLOAD_DIR` | — | File upload path (default: `./uploads`) |
| `MAX_FILE_SIZE` | — | Max upload size bytes (default: `10485760`) |
| `BCRYPT_ROUNDS` | — | bcrypt salt rounds (default: `12`) |
| `CORS_ORIGINS` | — | Comma-separated allowed origins |
| `SMTP_HOST` | — | Email server (optional) |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |

## API Documentation

Swagger UI is available at: **http://localhost:3001/api/docs**

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/msmes` | List MSMEs with pagination & filters |
| POST | `/api/msmes` | Register new MSME |
| POST | `/api/msmes/:id/workflow` | Workflow action (submit/verify/approve) |
| GET | `/api/analytics/dashboard` | Executive dashboard data |
| GET | `/api/analytics/msmes-by-county` | County breakdown |
| POST | `/api/reports` | Generate report |
| POST | `/api/imports` | Bulk CSV/Excel import |
| POST | `/api/sync/sync` | Sync offline records |
| GET | `/api/audit-logs` | Audit trail |

## Roles & Permissions

| Role | Key Permissions |
|---|---|
| `SUPER_ADMIN` | All permissions |
| `SBA_DIRECTOR` | View all, approve, generate reports |
| `SBA_DATA_OFFICER` | Create/edit MSMEs & BDSPs, import |
| `COUNTY_OFFICER` | County-scoped MSME CRUD |
| `VERIFIER` | Verify MSMEs, create field visits |
| `ANALYST` | Analytics read, reports generate |
| `BDSP_OFFICER` | BDSP CRUD |
| `FIELD_AGENT` | MSME create (offline capable) |
| `DONOR_PARTNER` | Read-only analytics & reports |
| `VIEWER` | Read-only all registries |

## MSME Workflow

```
DRAFT → SUBMITTED → UNDER_REVIEW → VERIFIED → APPROVED
                 ↓                         ↓
         RETURNED_FOR_CORRECTION      REJECTED
                 ↓
             ARCHIVED
```

## Project Structure

```
sba-msme-portal/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # 25+ table DB schema
│   │   │   └── seed.ts             # Seed data (counties, sectors, users)
│   │   └── src/
│   │       ├── modules/            # 16 domain modules (auth, msmes, bdsps, ...)
│   │       ├── middleware/         # Auth, RBAC, audit, upload, error handling
│   │       ├── config/             # Prisma client, env config
│   │       └── app.ts              # Express app factory
│   └── frontend/
│       └── src/
│           ├── lib/                # API client, auth context, offline DB, utils
│           ├── components/         # AppShell, shared components
│           └── pages/              # 30+ pages across all modules
├── docker-compose.yml
└── package.json                    # Monorepo workspace root
```

## Security Notes

1. **JWT Secrets**: Use cryptographically random strings (min 64 chars) in production
2. **Password Policy**: Enforced 8+ chars, uppercase, number
3. **Rate Limiting**: 100 req/15min global; 20 req/15min on auth routes
4. **Audit Logging**: All write operations logged with user, IP, entity, before/after state
5. **File Uploads**: MIME type validation, size limits, stored outside web root
6. **CORS**: Explicitly configured allowed origins
7. **Account Lockout**: After 5 failed logins, account locked for 30 minutes

## License

Government of Liberia — Ministry of Commerce and Industry  
Developed under PAYEI Program — SBA MSME Online Database Project  
© 2024 All Rights Reserved
