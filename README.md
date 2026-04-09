# MediConnect

A full-stack healthcare platform for hospitals and clinics with role-based experiences for patients, doctors, and administrators.

MediConnect combines clinical workflow management, doctor operations intelligence, patient-facing services, pharmacy data integration, and multilingual support in a single application.

## Table of Contents

- [Overview](#overview)
- [Core Capabilities](#core-capabilities)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Database and Data Setup](#database-and-data-setup)
- [Available Scripts](#available-scripts)
- [API Surface (High-Level)](#api-surface-high-level)
- [Testing](#testing)
- [Project Documentation](#project-documentation)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

MediConnect is designed to support modern hospital operations across three primary user roles:

- **Patient**: discover hospitals, manage healthcare journeys, access pharmacy and health tools.
- **Doctor**: manage profile/workflows, monitor operations and disease trends, and access decision-support insights.
- **Administrator**: review and manage doctors, monitor medicine orders, and control platform-level workflows.

The project is built as:

- a **React + Vite** frontend,
- a **Node.js + Express** backend API,
- a **Supabase** data/auth/storage layer.

## Core Capabilities

### Patient Experience

- Authentication and profile access.
- Hospital discovery and suggestion modules.
- Pharmacy browsing/search with large dataset support.
- Health tracking and dashboard interactions.

### Doctor Experience

- Doctor profile and document workflows.
- Operations and resource signal panel.
- Disease trend visualization and prediction insights.
- Context-aware recommendations using real-time and fallback signals.

### Admin Experience

- Pending doctor review and approval/rejection flow.
- Medicine order monitoring and status updates.
- Platform-level operational oversight.

### Platform Features

- Multilingual support (English/Tamil).
- AI-assisted routes and language-aware middleware.
- Map and geolocation-enabled context.
- Structured SQL and seed scripts for setup and migration.

## Architecture

```text
Frontend (React/Vite/TypeScript)
	-> REST API (Node.js/Express)
		-> Supabase (Postgres/Auth/Storage)
	-> External Signals (weather, AQI, news/events, public health)
```

### Main Components

- **Frontend**: role-based UI, dashboards, visualizations, and pharmacy modules.
- **Backend**: authentication, profile routes, admin actions, AI endpoints, operations signals.
- **Data Layer**: Supabase tables, RLS policies, storage, and migration/seed scripts.

## Tech Stack

### Frontend

- React 18, TypeScript, Vite 6
- Tailwind CSS, PostCSS, Framer Motion
- Recharts, Leaflet/React-Leaflet
- i18next for localization

### Backend

- Node.js, Express 4
- Supabase JavaScript SDK
- Axios, Multer, bcrypt, dotenv
- Jest + Supertest for API testing

### Data and Infra

- Supabase Postgres schema + SQL migrations
- Optional large-scale pharmacy CSV ingestion workflows

## Repository Structure

```text
MediConnect/
	backend/                 # Express API server, routes, services, seed/test scripts
	components/              # React UI modules (role-specific and shared)
	src/                     # Frontend services, hooks, locales, utilities
	scripts/                 # SQL and setup scripts
	ai_bot/                  # Data and notebook assets
	README.md                # This file
	supabase-schema.sql      # Core schema setup
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase project (URL, anon key, service role key)

### 1) Clone and Install

```bash
git clone https://github.com/Venkatasai6789/Hospital_Management.git
cd Hospital_Management
npm install
cd backend && npm install
```

### 2) Configure Environment

Create environment files as documented in [Environment Configuration](#environment-configuration).

### 3) Start Backend

```bash
cd backend
npm run dev
```

Backend default URL: `http://localhost:5000`

### 4) Start Frontend

In a second terminal:

```bash
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Environment Configuration

### Root `.env` (frontend)

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### `backend/.env` (backend)

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=5000
NODE_ENV=development
```

Notes:

- Keep the service role key private. Never expose it in frontend code.
- Frontend API client currently targets `http://localhost:5000/api`.

## Database and Data Setup

### Core Schema

Apply the base schema using:

- `supabase-schema.sql`
- `add_medicines_lab_tables.sql`
- Additional SQL scripts under `backend/` and `scripts/` as needed.

### Seed/Utility Scripts (Backend)

Common setup scripts include:

- `seed-admin.js`
- `seed-doctors.js`
- `seed-patients.js`
- `seed-pharmacy-labs.js`
- `repair-users.js`

### Pharmacy Large Dataset Loading

For full pharmacy ingestion and optimization, refer to:

- `PHARMACY_QUICK_START.md`
- `PHARMACY_LOAD_SETUP.md`
- `PHARMACY_OPTIMIZATION_GUIDE.md`

## Available Scripts

### Frontend (root)

- `npm run dev` - start Vite development server.
- `npm run build` - build production frontend assets.
- `npm run preview` - preview production build locally.

### Backend (`backend/`)

- `npm start` - start backend server.
- `npm run dev` - start backend with nodemon.
- `npm test` - run Jest test suite.
- `npm run test:watch` - run tests in watch mode.
- `npm run test:coverage` - generate coverage report.
- `npm run test:operations` - run operations signals test.

## API Surface (High-Level)

Base path: `/api`

- `/auth` - signup, signin, signout, current user.
- `/patients` - patient profile operations.
- `/doctors` - doctor profile and document routes.
- `/admin` - doctor moderation and medicine order controls.
- `/video` - video/session-related endpoints.
- `/ai` - AI/chat and language-aware endpoints.
- `/operations` - operations and risk signal endpoints.
- `/health` - service health check.

Health check example:

```bash
curl http://localhost:5000/api/health
```

## Testing

Run backend tests:

```bash
cd backend
npm test
```

Targeted runtime checks/scripts are also available in `backend/`, including:

- authentication and signup flows,
- patient endpoint validation,
- pharmacy API/data verification,
- operations signal checks.

## Project Documentation

The repository includes implementation and operational documents:

- `START-HERE.md`
- `00-READ-ME.md`
- `IMPLEMENTATION_SUMMARY.md`
- `CONSOLE_ERRORS_FIX.md`
- `PHARMACY_DATA_INTEGRATION.md`
- `CSV_SUPABASE_MAPPING.md`
- `OPTIMIZATION_COMPLETE.md`

Use these files for deeper, subsystem-specific guidance.

## Deployment Notes

- Set production-safe CORS and secure environment variable handling.
- Keep API and frontend base URLs aligned with deployment domains.
- Apply SQL schema and required seed data before production rollout.
- Validate role flows (patient/doctor/admin) in staging before release.

## Troubleshooting

- Backend not starting: confirm `backend/.env` values and Supabase keys.
- Frontend API failures: ensure backend is running on port `5000`.
- Empty pharmacy listings: verify medicines table data and loader completion.
- Auth/session issues: confirm Supabase URL/key alignment in root and backend env files.

For pharmacy-specific troubleshooting, use `PHARMACY_QUICK_START.md` and `PHARMACY_LOAD_SETUP.md`.

## License

This project is currently published without an explicit license declaration in the repository root.
If you plan public reuse/distribution, add a license file and update this section.
