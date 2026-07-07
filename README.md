# GCR

## Project Overview

GCR is a Google Classroom-inspired classroom management platform. This repository currently contains the production-ready foundation for the application, including the project structure, development tooling, Dockerized PostgreSQL, and Prisma configuration. No application features or business logic have been implemented yet.

## Architecture

The project is structured for a monolithic Next.js application with server actions and route handlers, using Prisma for data access and PostgreSQL for persistence. The codebase is organized to support future modules such as authentication, dashboard, classes, announcements, materials, assignments, submissions, notifications, and admin.

## Technology Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui-ready UI foundation
- Prisma ORM
- PostgreSQL
- TanStack Query
- React Hook Form + Zod
- Lucide React + Sonner
- ESLint + Prettier + Husky + lint-staged
- Docker + Docker Compose

## Why These Technologies Were Chosen

- Next.js provides a strong full-stack foundation with server-side rendering and server actions.
- TypeScript improves maintainability and team collaboration.
- Tailwind CSS enables fast UI iteration with a scalable design system.
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
6. Run migrations when schema changes are introduced:
   ```bash
   npx prisma migrate dev
   ```
7. Start the development server:
   ```bash
   npm run dev
   ```

## Docker Setup

PostgreSQL runs inside Docker so developers do not need to install or configure a local database. The application itself runs on the host machine.

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

- src/app: Next.js App Router pages, layouts, and route segments.
- src/components: reusable UI and layout components.
- src/features: domain-oriented feature modules.
- src/hooks: shared hooks.
- src/lib: shared libraries and utilities.
- src/providers: context providers and global state wrappers.
- src/services: API and persistence service abstractions.
- src/server: server-only code, actions, and handlers.
- src/types: shared TypeScript types.
- src/utils: helper functions.
- src/constants: application constants.
- src/config: environment and app configuration.
- src/styles: global styles.
- docs: project documentation.
- prisma: Prisma schema and migrations.
- public: static assets.

## Coding Standards

- Use strict TypeScript.
- Keep components small and composable.
- Prefer feature-based organization for new domain work.
- Avoid placeholder business logic in the initial setup.
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
- AUTH_SECRET: Secret used for future authentication flows.
- NEXTAUTH_URL: Application base URL for authentication callbacks.
- NEXT_PUBLIC_SUPABASE_URL: Placeholder for future Supabase Storage.
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Placeholder for future Supabase Storage.
- SUPABASE_SERVICE_ROLE_KEY: Placeholder for future Supabase Storage.

## Future Modules

Planned modules include:

- Authentication
- Dashboard
- Classes
- Announcements
- Materials
- Assignments
- Submissions
- Notifications
- Admin

## Deployment

Production deployment will target Vercel for the application and PostgreSQL for data storage, with Supabase Storage for file uploads in the future.
