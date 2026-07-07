# GCR

## Project Overview

GCR is a Google Classroom-inspired classroom management platform. The repository now contains a working foundation plus the first vertical slice of product functionality: Docker-based PostgreSQL, a Prisma schema and migrations, Auth.js credential authentication, the shared authenticated application shell (responsive header/sidebar/navigation), and a complete Classroom module (create/join/leave/archive classes, role-based authorization, classroom detail shell with Stream/Classwork/People tabs). Stream, Classwork, People, Assignments, and Notifications are still placeholder screens pending future phases.

## Architecture

The project is a monolithic Next.js application using the App Router, Server Actions, and Route Handlers, with Prisma for data access and PostgreSQL for persistence. Business logic is organized feature-first under `src/features/*` (services → validation → Server Actions → components), while `src/components/*` holds shared, domain-agnostic UI infrastructure (design-system primitives, app shell, page scaffolding, empty/loading/error states). See [docs/ui-architecture.md](docs/ui-architecture.md) for the full UI architecture and [docs/database-architecture.md](docs/database-architecture.md) for the data model.

## Technology Stack

- Next.js 16 (App Router, Turbopack, Server Actions)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- shadcn/ui-style components on Radix UI primitives
- Auth.js (next-auth v4, credentials provider, JWT sessions) + Prisma adapter
- Prisma ORM (driver adapter for `pg`)
- PostgreSQL
- Zod (Server Action input validation)
- React Hook Form (available; not yet wired into a form)
- TanStack Query (available; not yet wired into a data flow)
- Lucide React + Sonner (toasts)
- ESLint + Prettier + Husky + lint-staged
- Docker + Docker Compose

## Why These Technologies Were Chosen

- Next.js provides a strong full-stack foundation with server-side rendering and Server Actions, so mutations (create/join/archive a class) don't need a separate API layer.
- TypeScript improves maintainability and team collaboration.
- Tailwind CSS enables fast UI iteration with a scalable, token-driven design system.
- Prisma simplifies database access while keeping the schema explicit and type-safe.
- PostgreSQL is a robust relational database for classroom and assignment data.
- Docker ensures every developer can run the same local infrastructure without installing PostgreSQL manually.

## Prerequisites

- Docker Desktop
- Node.js 20+
- Git

## Project Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment example:
   ```bash
   copy .env.example .env.local
   ```
4. Start PostgreSQL with Docker:
   ```bash
   docker compose up -d
   ```
5. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
6. Apply migrations:
   ```bash
   npx prisma migrate dev
   ```
7. Seed the database with demo users and a demo classroom:
   ```bash
   npm run seed
   ```
8. Start the development server:
   ```bash
   npm run dev
   ```

## Trying It Out Locally

The seed script creates four users (password hashes in `prisma/seed.ts` are placeholders, not real login credentials as committed). To sign in locally, set a real bcrypt hash for a seed user's `passwordHash` column, or hash a known password yourself:

```bash
node -e "console.log(require('bcryptjs').hashSync('Testpass123!', 10))"
```

Then update the user's `passwordHash` in the database with that hash and sign in at `/login` with that email/password. Seed accounts: `mina.admin@gcr.dev` (ADMIN), `daniel.teacher@gcr.dev` (TEACHER, owns "Advanced Mathematics 101"), `sofia.student@gcr.dev` / `liam.student@gcr.dev` (STUDENT, enrolled in that class).

Once signed in: `/dashboard` → sidebar **Classes** → view/create/join/archive classes → click into a class to see the Stream/Classwork/People tab shell (placeholder content for now).

## Docker Setup

PostgreSQL runs inside Docker so developers do not need to install or configure a local database. The application itself runs on the host machine.

## Database Architecture

The application uses a Prisma-backed PostgreSQL schema that models classrooms, memberships, announcements, materials, assignments, submissions, comments, notifications, files, and activity history. For a full explanation of entities, relationships, enums, cascade rules, indexes, constraints, and an ER diagram, see [docs/database-architecture.md](docs/database-architecture.md).

### Useful Commands

- Start database:
  ```bash
  docker compose up -d
  ```
- Stop database:
  ```bash
  docker compose down
  ```
- Reset database volume:
  ```bash
  docker compose down -v
  ```
- View logs:
  ```bash
  docker compose logs -f postgres
  ```

## Folder Structure

- `src/app`: Next.js App Router routes. `(auth)/login` is public; `(app)` is the session-gated group wrapping every authenticated route in the shared shell (`dashboard`, `classes`, `classes/[classroomId]/{stream,classwork,people}`).
- `src/components/ui`: shadcn-style design-system primitives (button, card, dialog, alert-dialog, dropdown-menu, sheet, tooltip, input, textarea, label, skeleton, badge, avatar, separator) - no domain logic.
- `src/components/shell`: the application chrome - header, sidebar, mobile drawer, nav config, breadcrumbs, user/notifications menus.
- `src/components/page`: page-composition scaffolding - page container, section header, dashboard/stat grids.
- `src/components/states`: shared empty/error/loading-skeleton components.
- `src/components/layouts`: the pre-auth marketing shell used by the public landing page.
- `src/features/<name>`: feature-owned code, each split into `services/` (Prisma access + business rules), `validation/` (Zod schemas), `actions/` (Server Actions), `components/`, `hooks/`, `types/`. Currently: `classroom`.
- `src/auth`: Auth.js configuration (`index.ts`) and the server-side session helper (`session.ts`).
- `src/lib`: shared utilities, including `lib/auth/permissions.ts` (role/ownership authorization helpers) and `lib/prisma.ts` (Prisma client singleton).
- `src/generated/prisma`: generated Prisma client - do not edit.
- `src/config`: environment variable parsing/validation.
- `docs`: project documentation (UI architecture, database architecture).
- `prisma`: Prisma schema, migrations, and seed script.
- `public`: static assets.

## Coding Standards

- Use strict TypeScript.
- Keep components small and composable.
- Prefer feature-based organization for new domain work: `services` do data access, `actions` do auth + validation + call services, `components` stay presentational.
- Avoid placeholder business logic - Server Actions should enforce real authorization and touch the real database, even for early-phase features.
- Run linting and formatting before opening a pull request.

## Git Workflow

Recommended branches:

- main
- develop
- feature/*
- bugfix/*
- hotfix/*

## Environment Variables

- DATABASE_URL: PostgreSQL connection string for Prisma.
- AUTH_SECRET: Secret used to sign Auth.js JWTs.
- NEXTAUTH_URL: Application base URL for authentication callbacks.
- NEXT_PUBLIC_SUPABASE_URL: Placeholder for future Supabase Storage.
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Placeholder for future Supabase Storage.
- SUPABASE_SERVICE_ROLE_KEY: Placeholder for future Supabase Storage.

## Implemented So Far

- Authentication: Auth.js credentials provider, JWT sessions, Prisma adapter, `/login` form, protected-route middleware.
- Application shell: responsive header, collapsible desktop sidebar, mobile drawer navigation, breadcrumbs, user/notifications menus, page-composition primitives, empty/loading/error states.
- Classroom module: create/edit/archive a classroom (Teacher/Admin), join/leave by class code (any authenticated user), classroom list ("My Classrooms" cards), classroom detail shell with Stream/Classwork/People tab navigation.

## Future Modules

Planned modules include:

- Stream (announcements, comments)
- Classwork (topics, assignments, materials)
- People (roster, invitations)
- Assignment detail and submissions/grading
- Notifications (real data, currently UI-only)
- Search (real data, currently UI-only)
- Admin area (users, classrooms, reports)
- Calendar

## Deployment

Production deployment will target Vercel for the application and PostgreSQL for data storage, with Supabase Storage for file uploads in the future.
