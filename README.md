# GCR

## Project Overview

GCR is a Google Classroom-inspired classroom management platform. The repository now contains a working foundation plus several vertical slices of product functionality: Docker-based PostgreSQL, a Prisma schema and migrations, Auth.js credential authentication, the shared authenticated application shell (responsive header/sidebar/navigation), a complete Classroom module (create/join/leave/archive classes, role-based authorization, classroom detail shell with Stream/Classwork/People tabs), and a complete Stream module (announcements with edit/delete/pin, and comments with optimistic UI). Classwork, People, Assignments, and Notifications are still placeholder screens pending future phases.

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

### Get a working login

The seed script (`prisma/seed.ts`) creates four users, but their committed `passwordHash` values are placeholders - not real credentials. Before anyone can sign in, set a real bcrypt hash on at least one seed user.

1. Generate a hash for a password of your choice:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('Testpass123!', 10))"
   ```
2. Update the seed user's row with that hash (psql example, adjust for your DB client of choice):
   ```sql
   UPDATE "User" SET "passwordHash" = '<hash from step 1>' WHERE email = 'daniel.teacher@gcr.dev';
   UPDATE "User" SET "passwordHash" = '<hash from step 1>' WHERE email = 'sofia.student@gcr.dev';
   ```
3. Sign in at `/login` with that email and the plaintext password you hashed. The login page also shows a "Dev seed accounts" hint box outside of production builds.

Seed accounts: `mina.admin@gcr.dev` (ADMIN), `daniel.teacher@gcr.dev` (TEACHER, owns "Advanced Mathematics 101"), `sofia.student@gcr.dev` / `liam.student@gcr.dev` (STUDENT, both enrolled in that class). Only teacher/student have a `passwordHash` worth patching for typical testing - patch admin's too if you need to test `/admin/*` nav visibility.

### User flow walkthrough

A step-by-step path through everything currently implemented. Useful for anyone reviewing the app for the first time.

**1. Authentication**

- Visit `/login`, sign in as the teacher (`daniel.teacher@gcr.dev`).
- Try a wrong password first if you want to see the inline error state.
- On success you land on `/dashboard`.
- Open an incognito window and try visiting `/dashboard` directly while signed out - you should be redirected to `/login` (middleware-enforced).

**2. Application shell**

- Click the hamburger icon (top-left) on desktop - the sidebar collapses to icon-only with hover tooltips; click again to expand.
- Shrink the browser window below ~1024px - the sidebar disappears and the same hamburger now opens a slide-in drawer.
- Click the bell icon - an empty "You're all caught up" notifications dropdown (UI only, not wired to real data yet).
- Click your avatar (top-right) - dropdown with your name/email/role and a working Sign out.

**3. Classroom list (`/classes`, via the sidebar)**

- As the teacher: you see the "Advanced Mathematics 101" card and both **Create class** and **Join class** buttons.
- Click the **⋮** menu on the card: Copy class code / Edit class / Archive class.
- Create a test class via the dialog - it redirects you straight into the new class.
- Sign out and sign in as the student (`sofia.student@gcr.dev`): same class card is visible (she's enrolled), but there's no **Create class** button - only **Join class** and, on the **⋮** menu, **Leave class** instead of Edit/Archive.
- Try joining with a made-up code to see the validation/not-found error.

**4. Classroom detail**

- Click into a class card. You land on a colored banner header with the class title/section and three tabs: **Stream / Classwork / People**.
- Classwork and People currently show a "coming soon" placeholder - that's expected, not a bug.

**5. Stream - announcements**

- As the teacher, you'll see a composer at the top ("Share something with your class..."). Post one.
- As the student, there is no composer at all - confirm the textarea/Post button simply aren't in the page for a student account.
- On each announcement (teacher view), open the **⋮** menu: **Edit**, **Pin**/**Unpin**, **Delete**.
  - Pin one - it should jump to the top of the list regardless of when it was posted, and a "Pinned" badge appears (visible to every role, not just the teacher).
  - Edit one - content updates and an "· edited" marker appears next to the timestamp.
  - Delete one - a confirmation dialog appears first (destructive action); after confirming, it disappears and a toast confirms it.
- As the student, confirm the **⋮** menu doesn't appear on any announcement at all.

**6. Stream - comments**

- Under any announcement, both teacher and student can type in the "Add class comment…" box and post - it appears in the thread immediately (optimistic UI, before the server even responds).
- As a student, post a comment, then confirm you see a delete (trash) icon on _your own_ comment but not on other people's.
- As the teacher, confirm you see a delete icon on _every_ comment in the classroom, including students' - deleting one shows a toast and removes it instantly.
- Comments display oldest-first, growing downward like a conversation thread.

**7. Responsive check**

- Repeat steps 3-6 with the browser narrowed to a phone-sized viewport (or DevTools device mode) - the drawer nav, dialogs, and comment threads should all remain usable.

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
- `src/features/<name>`: feature-owned code, each split into `services/` (Prisma access + business rules), `validation/` (Zod schemas), `actions/` (Server Actions), `components/`, `hooks/`, `types/`. Currently: `classroom`, `stream` (`stream` uses `queries/` instead of a read-side action, since its reads are plain server-only functions, not client-invokable Server Actions).
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
- Stream module: announcements (create/edit/delete/pin/unpin, Teacher/Admin only, students read-only), pinned-first ordering, comments on announcements (create by any member, delete own, teacher/manager can delete any) with optimistic UI, confirmation dialogs on destructive actions, toast notifications throughout. All of it authorized server-side, not just hidden in the UI.

## Future Modules

Planned modules include:

- Classwork (topics, assignments, materials)
- People (roster, invitations)
- Assignment detail and submissions/grading
- Notifications (real data, currently UI-only)
- Search (real data, currently UI-only)
- Admin area (users, classrooms, reports)
- Calendar

## Deployment

Production deployment will target Vercel for the application and PostgreSQL for data storage, with Supabase Storage for file uploads in the future.
