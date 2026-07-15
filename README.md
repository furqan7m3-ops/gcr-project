# GCR

## Project Overview

GCR is a Google Classroom-inspired classroom management platform. The repository contains a working foundation plus complete vertical slices of product functionality for both the teacher/student-facing app and a full administrator platform: Docker-based PostgreSQL, a Prisma schema and migrations, Auth.js credential authentication (with login-attempt tracking, account lockout, and revocable sessions), the shared authenticated application shell, a complete Classroom module (create/join/leave/archive, roster/invitations, role-based authorization), a complete Stream module (announcements with edit/delete/pin, comments with optimistic UI), a complete Classwork module (topics, materials, assignments with a draft/scheduled/published/closed lifecycle, a per-assignment detail page, and student submissions/grading), a shared Content Scheduling engine spanning announcements/assignments/materials (see [Content Scheduling](#content-scheduling) below), a centralized Teacher Review Queue (see [Teacher Review Queue](#teacher-review-queue) below), a fully read-only Archived Classroom Experience (see [Archived Classroom Experience](#archived-classroom-experience) below), role-specific Dashboard Enhancements tying all of the above together (see [Dashboard Enhancements](#dashboard-enhancements) below), a reusable, authorization-aware Global Search Infrastructure (backend only so far - see [Global Search Infrastructure](#global-search-infrastructure) below), and a real-data Notifications center. On top of that, `/admin` is a full administrator console: user management, classroom administration, content moderation, platform analytics and detailed reports, an audit log, system-wide settings, and a security dashboard (sessions, lockouts, password policy) — see [Admin Platform](#admin-platform) below. Calendar and a global search UI are the remaining missing pieces.

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

The seed script (`prisma/seed.ts`) creates four users. The admin account has a real, working password out of the box; the teacher and student accounts still have a placeholder `passwordHash` and need a one-time patch before they can sign in.

**Admin (works immediately after seeding):**

- Email: `faizan.admin@gcr.dev`
- Password: `F@izan4121`
- Sign in at `/login` and you land on `/dashboard`; the admin nav section (and `/admin`) is visible immediately.

**Teacher / student (need a manual password patch):**

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

Seed accounts: `faizan.admin@gcr.dev` (ADMIN), `daniel.teacher@gcr.dev` (TEACHER, owns "Advanced Mathematics 101"), `sofia.student@gcr.dev` / `liam.student@gcr.dev` (STUDENT, both enrolled in that class).

**Note on account lockout:** 5 consecutive failed sign-in attempts on any account auto-locks it (`UserStatus.LOCKED`) until an admin unlocks it from `/admin/security/locked-accounts` — keep this in mind while testing wrong-password flows. Public self-registration does not exist; every account is created by an administrator (`/admin/users`) or seeded directly.

### User flow walkthrough

A step-by-step path through everything currently implemented. Useful for anyone reviewing the app for the first time.

**1. Authentication**

- Visit `/login`, sign in as the teacher (`daniel.teacher@gcr.dev`).
- Try a wrong password first if you want to see the inline error state.
- On success you land on `/dashboard`.
- Open an incognito window and try visiting `/dashboard` directly while signed out - you should be redirected to `/login` (enforced in `src/proxy.ts`, Next.js's renamed middleware convention).
- See [Dashboard Enhancements](#dashboard-enhancements) below for what `/dashboard` actually shows per role (it's role-specific, not the generic placeholder from earlier phases).

**2. Application shell**

- Click the hamburger icon (top-left) on desktop - the sidebar collapses to icon-only with hover tooltips; click again to expand.
- Shrink the browser window below ~1024px - the sidebar disappears and the same hamburger now opens a slide-in drawer.
- Click the bell icon - a real notifications dropdown backed by the `Notification` table (unread count badge, mark-as-read, links to the relevant classroom item).
- Click your avatar (top-right) - dropdown with your name/email/role and a working Sign out.

**3. Classroom list (`/classes`, via the sidebar)**

- As the teacher: you see the "Advanced Mathematics 101" card and both **Create class** and **Join class** buttons.
- Click the **⋮** menu on the card: Copy class code / Edit class / Archive class.
- Create a test class via the dialog - it redirects you straight into the new class.
- Sign out and sign in as the student (`sofia.student@gcr.dev`): same class card is visible (she's enrolled), but there's no **Create class** button - only **Join class** and, on the **⋮** menu, **Leave class** instead of Edit/Archive.
- Try joining with a made-up code to see the validation/not-found error.
- See [Archived Classroom Experience](#archived-classroom-experience) below for what changes once a class is archived.

**4. Classroom detail**

- Click into a class card. You land on a colored banner header with the class title/section and three tabs: **Stream / Classwork / People**.
- All three tabs are fully implemented (see sections 5-10 for Stream/Classwork; People shows the roster split into Teachers/Students with an Invite dialog, role changes, and remove-member, all authorized server-side).

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

**7. Classwork - topics**

- As the teacher, open the **Classwork** tab and use **+ Create → Topic** to add one or two topics.
- Rename a topic inline, then drag-and-drop to reorder them - the order persists across a page refresh.
- Delete a topic - a confirmation dialog appears first.
- As the student, confirm the Classwork tab shows the same topics with no **+ Create** button and no rename/reorder/delete controls anywhere.

**8. Classwork - materials**

- As the teacher, use **+ Create → Material** and try each input type: a description-only note, a link (a YouTube/Vimeo URL is categorized as video, any other URL as a link), and a file attachment.
- Assign a material to a topic, and leave another unassigned - the unassigned one renders under a "General" group.
- Edit and delete a material - both work as expected, with a confirmation on delete.
- As the student, materials are visible but read-only (no edit/delete controls). Note that file attachments currently record metadata only (name/size/type) - actual file storage isn't wired up yet, and the UI says so explicitly.

**9. Classwork - assignments**

- As the teacher, use **+ Create → Assignment**, fill in title/instructions/due date/points/topic/attachments, and click **Save draft** - it appears in the list with a **Draft** badge, visible only to you.
- As the student, confirm the draft assignment does not appear in the Classwork list at all.
- Back as the teacher, open the assignment's management menu and **Publish now** - the student now sees it (no badge).
- Try **Close assignment**, **Edit**, and **Delete** from the same menu - each works with the expected confirmation/toast behavior.
- As the student, confirm no management menu appears on any assignment card.
- See [Content Scheduling](#content-scheduling) below for the Schedule/Cancel-scheduled-publication flow shared by announcements, assignments, and materials.

**10. Classwork - assignment detail page, submissions & grading**

- Click an assignment's title (as either role) to open its dedicated detail page.
- Confirm it shows the full instructions (untruncated), due date, points, and attachments, reusing the same management menu for teachers.
- As the student: turn in work via the submission panel (text answer and/or attachments) - status moves Assigned → Submitted (or Late, past the due date). Turn it in again before the teacher reviews it and it stays editable.
- As the teacher: open the roster-style submissions list, click into a student's submission, enter a grade (bounded by the assignment's points) and feedback, and return it - the student sees the grade badge and feedback, and a private comment thread is available on either side.
- As the student, try navigating directly to a **draft** assignment's detail URL - you should get a clean "Assignment not found" page, not the real content.
- See [Teacher Review Queue](#teacher-review-queue) below for the centralized, cross-classroom "To review" page built on top of this same grading flow.

**11. Responsive check**

- Repeat steps 3-10 with the browser narrowed to a phone-sized viewport (or DevTools device mode) - the drawer nav, dialogs, and comment threads should all remain usable.

## Content Scheduling

Announcements, assignments, and materials all share one scheduling engine rather than three separate implementations. Every piece of content moves through the same status lifecycle - **Draft → Scheduled → Published** (assignments add a fourth, terminal **Closed** state, unrelated to scheduling) - and the same three teacher-facing actions apply everywhere: **Schedule for later**, **Cancel scheduled publication**, and **Publish now**.

- **Create time**: the create dialog/composer for each content type has a shared "Save as draft / Publish now / Schedule for later" control. Choosing **Schedule for later** reveals a date & time picker; the content is created straight into the Scheduled state.
- **Managing existing drafts**: a draft or scheduled item's management menu offers **Publish now**, **Schedule…** (drafts only) or **Cancel scheduled publication** (scheduled items only), alongside the existing Edit/Delete.
- **Visibility**: Draft and Scheduled content is only visible to whoever manages that classroom (teacher/co-teacher/admin) - students never see it until it actually publishes, the same rule already used for draft assignments.
- **Guardrails**: content in an archived classroom can't be scheduled or published; a closed assignment can never be (re-)scheduled; a scheduled time must be in the future.
- **Status badges**: cards show a **Draft**, **Scheduled** (with the publish date/time), or **Closed** badge; published content shows no badge, matching the existing convention.
- **Architecture**: the shared engine (`src/lib/scheduling`) knows nothing about Prisma or any specific content type - each feature (`stream`, `classwork`) implements a small adapter bridging its own model to the engine. `publishScheduledContent` (the function a future cron job/worker would call on an interval) is already wired up as an admin-triggerable Server Action; nothing about the manual "Schedule for later" flow will need to change once that automatic trigger is added.

### Content scheduling manual testing walkthrough

A step-by-step path through the scheduling flow for all three content types. Sign in as the teacher (`daniel.teacher@gcr.dev`) unless a step says otherwise - see [Get a working login](#get-a-working-login) if that account still needs its password patched.

**1. Draft → Schedule → Cancel → Reschedule → Publish now (announcements)**

- Open **Stream**, and in the composer choose **Schedule for later** instead of the default **Publish now** - a date & time picker appears; pick a time a few minutes out and submit.
- Confirm the announcement now shows a **Scheduled** badge with the date/time you picked, and that it's still visible to you (the manager).
- Open a private/incognito window and sign in as the student (`sofia.student@gcr.dev`) - confirm the scheduled announcement does **not** appear on the Stream at all.
- Back as the teacher, open the announcement's **⋮** menu and choose **Cancel scheduled publication** - the badge changes to **Draft** and the scheduled time is cleared.
- Open the **⋮** menu again and choose **Schedule…** - pick a new date/time and confirm; the badge returns to **Scheduled** with the new time.
- Finally, choose **Publish now** from the same menu - the badge disappears (published content shows no badge), and refreshing the student's window now shows the announcement.

**2. Assignments - scheduling respects Draft/Scheduled/Published/Closed**

- In **Classwork**, use **+ Create → Assignment**, fill in the details, and this time choose **Schedule for later** in the create dialog's publish controls, picking a future date/time, then submit.
- Confirm it appears in your list with a **Scheduled** badge, and that the student's Classwork list doesn't show it at all (same rule as Draft).
- From its management menu, try **Publish now** - it should publish immediately, badge disappears, and it becomes visible to the student.
- **Close** the assignment from the same menu, then try to re-open its menu - **Schedule…** and **Publish now** should no longer be offered at all, since a closed assignment is a terminal state and can never be (re-)scheduled.
- Create a second assignment as a plain **Save draft**, then use **Schedule…** from its management menu (rather than at create time) to verify rescheduling an existing draft works the same way as the create-time flow.

**3. Materials - scheduling is a brand-new capability here**

- In **Classwork**, use **+ Create → Material**, add a link or description, and choose **Schedule for later** - materials previously had no draft/scheduled concept at all, so confirm this now behaves exactly like announcements/assignments: a **Scheduled** badge, invisible to the student, manageable via **Publish now** / **Schedule…** / **Cancel scheduled publication** from its **⋮** menu.

**4. Guardrails**

- Archive a classroom (from its card's **⋮** menu, or `/admin/classrooms`) that still has a draft item in it, then try to **Schedule…** or **Publish now** that item - it should fail with an "This class is archived…" error instead of silently succeeding.
- Restore the classroom afterward so the rest of the walkthrough still works.

**5. Notifications**

- When an item transitions to Published - whether by **Publish now** or by letting a schedule complete (see below) - confirm the student receives the same "New announcement/assignment/material in <class>" notification (bell icon) they'd get from an immediate, non-scheduled post.

**6. Confirming a real scheduled publish (optional, no UI trigger yet)**

- The batch function that would let a cron job publish everything past its scheduled time (`publishScheduledContent`) exists as a Server Action but is intentionally not wired to any UI button or automatic timer yet (see [Content Scheduling](#content-scheduling)) - there is nothing to click here. If you want to see it fire, schedule an item for a time a minute in the future, wait, and re-visit the page: it will still show as **Scheduled** until something actually calls that batch function (a future cron job, once added).

## Teacher Review Queue

`/review` is a single, cross-classroom page listing every submission a teacher (or admin) needs to act on - no more clicking into each class's Classwork tab one at a time. It's gated to `UserRole.TEACHER`/`ADMIN` the same way `/admin` is gated to `ADMIN` - `src/proxy.ts` redirects anyone else to `/dashboard?denied=review` before the page renders, and the "To review" sidebar link is hidden from students entirely.

- **What shows up**: submitted, late, and returned submissions across every classroom the signed-in teacher manages (an admin sees every active classroom platform-wide, the same bypass rule used everywhere else). A student's in-progress draft is never listed - consistent with the rule already used on a single assignment's submission list, where a draft is invisible to teachers, not just hidden.
- **Filters**: classroom, assignment, student, status (Submitted / Late / Returned), and a due-before date - all URL-driven (`?classroomId=`, `?status=`, etc.), so a filtered view is a shareable/bookmarkable link. Picking a classroom narrows the assignment and student dropdowns to just that class.
- **Sorting**: Newest, Oldest, Due date, Student name, Assignment name - click a column header or use the sort dropdown.
- **Summary tiles**: Pending reviews, Late submissions, Returned today, Recently submitted (last 48 hours) - computed with a single aggregate query, not by counting the current page of rows.
- **Actions, without leaving the queue**: click **Open** on any row to open a dialog with the full grading panel - the exact same component used on the dedicated submission page - so **Grade**, **Return**, and **Leave a private comment** all work inline. A link inside the dialog also jumps to the full submission page if you'd rather work there.
- **Query optimization**: the row list is one indexed `findMany` (classroom/assignment/student/status/due-date filters all pushed into the `WHERE` clause, sorting done in the database, not in JavaScript) plus one `count()` for pagination - no per-row follow-up queries. The four summary tiles are computed by a single raw SQL query using conditional `COUNT(*) FILTER (WHERE ...)` aggregates instead of four separate round trips.

### Teacher review queue manual testing walkthrough

Sign in as the teacher (`daniel.teacher@gcr.dev`) unless a step says otherwise - see [Get a working login](#get-a-working-login) if that account still needs its password patched.

**1. Access control**

- Signed out, visit `/review` directly - redirected to `/login`.
- Signed in as the student seed account, visit `/review` directly - redirected to `/dashboard?denied=review` with an error toast; the **To review** sidebar link is absent from the student's nav entirely.
- Signed in as the teacher, click **To review** in the sidebar (or visit `/review`) - the page loads with summary tiles, filters, and a table.

**2. Getting submissions into the queue**

- As the student (`sofia.student@gcr.dev` or `liam.student@gcr.dev`), turn in an assignment that's still open - go back to the teacher and confirm it now appears in `/review` with a **Submitted** badge.
- Turn in a second assignment after its due date has passed (or edit the assignment's due date to the past first, then submit) - confirm it shows a **Late** badge instead.
- From either the queue's quick-review dialog or the full submission page, return one of them - confirm its badge changes to **Returned** and it now counts under the **Returned today** summary tile.

**3. Filters**

- Filter by **Classroom** - confirm the assignment and student dropdowns narrow to just that class's options, and the table only shows that class's rows.
- Filter by **Status** (Submitted / Late / Returned) one at a time - confirm only matching rows remain.
- Filter by a specific **Assignment** or **Student** - confirm the table narrows accordingly; clear the filter (back to "All…") and confirm rows return.
- Set **Due before** to a date before any of your assignments were due - confirm the table empties out and shows the "Nothing to review" empty state.

**4. Sorting**

- Try each sort option - **Newest**, **Oldest**, **Due date**, **Student name**, **Assignment name** - and confirm the row order changes accordingly; click a sortable column header as a shortcut for the same thing.

**5. Actions inline**

- Click **Open** on a submitted row - a dialog opens with the student's work, attachments, and a grade input (bounded by the assignment's points).
- Enter a grade and feedback, save it, then **Return** the submission from the same dialog - confirm the toast, the badge updating to **Returned**, and that the student sees the grade on their end (sign in as them to confirm).
- Post a private comment from the dialog - confirm it appears immediately, and that it's the same thread visible on the full submission page (open **Open full page** from the dialog to cross-check).

**6. Cross-classroom scope**

- If the teacher manages more than one classroom, confirm submissions from every one of them appear in the unfiltered queue, not just the first class - this is the entire point of the page versus checking each class's Classwork tab individually.
- Sign in as the admin (`faizan.admin@gcr.dev`) and visit `/review` - confirm it shows submissions across every active classroom platform-wide, not just ones the admin personally teaches.

## Archived Classroom Experience

Archiving a classroom (from its card's **⋮** menu, or `/admin/classrooms`) makes it fully read-only, closely matching Google Classroom's own archived behavior - rather than just hiding a few buttons, every content-mutating Server Action independently refuses to run against an archived classroom, whether or not the UI happened to expose a way to trigger it.

- **Teachers can still**: view the classroom, view announcements/assignments/materials/grades, restore the classroom, and copy the class code. They can no longer post announcements, create assignments, upload materials, invite members, or edit the classroom's own title/section/description - and editing or deleting any _existing_ announcement/assignment/material is blocked too, since the objective is a genuinely read-only class, not just a frozen "create" button.
- **Students can still**: view the classroom, announcements, assignments, grades, and download existing material attachments. They can no longer submit or unsubmit assignments, post (or receive) Stream comments, or join the class by code.
- **Grading stays open on purpose**: returning a submission, entering/editing a grade, and private submission comments between a teacher and student are _not_ blocked by archiving - this matches real Google Classroom (grading work already turned in doesn't freeze) and isn't one of the stated restrictions.
- **Permission model**: `canManageClassroom(role)` (Owner/Teacher/Co-Teacher, or an Admin via its existing bypass) still determines who _can_ manage a classroom regardless of archived state - it's what gates the **Restore** action. A separate, new `canModifyClassroom(role, status)` helper (`src/features/classroom/lib/can-manage.ts`) additionally requires the classroom to be `ACTIVE`, and is what every page now uses to decide whether to render a composer, a "+ Create" button, an Invite button, or a per-item management menu. Permanently deleting a classroom remains exclusively an Admin action from `/admin/classrooms` - there is no teacher-facing delete.
- **Server enforcement**: a single reusable `assertClassroomActive(classroom)` guard (`classroom-service.ts`) is called by every mutation across the classroom, stream, classwork, submissions, and invitation services before it does anything else - never rely on a hidden or disabled button alone. The same function replaced several pre-existing, duplicated `if (status === ARCHIVED) throw` checks scattered across those services.
- **UI indicators**: an **Archived** badge over the class banner, a dismissible-by-restoring banner explaining the read-only state, the quick-actions menu swapping **Edit class** / **Archive class** for **Restore class**, disabled/hidden compose and invite controls, and a plain-text note in place of the comment box and submission form for students.
- **Finding an archived class**: `/archived` (the "Archived classes" sidebar link) lists every archived classroom the signed-in user still belongs to - or, for an admin, every archived classroom platform-wide, the same bypass rule used elsewhere. Each card opens straight into the read-only classroom and carries the same **⋮** → **Restore class** shortcut.

### Archived classroom manual testing walkthrough

Sign in as the teacher (`daniel.teacher@gcr.dev`) unless a step says otherwise - see [Get a working login](#get-a-working-login) if that account still needs its password patched.

**1. Archiving and the read-only indicators**

- From `/classes`, use the "Advanced Mathematics 101" card's **⋮** menu and choose **Archive class** (confirm the dialog first).
- Open the class - confirm an **Archived** badge now sits over the banner, and a banner strip below it reads "This class is archived and is now read-only," with a **Restore class** button (teacher view only - a student sees the same banner without the button).
- Open the **⋮** menu again - **Edit class** and **Archive class** are gone, replaced by a single **Restore class** item; **Copy class code** is still there.
- Click **Archived classes** in the sidebar (`/archived`) - confirm the class now appears there with a working **Restore class** shortcut on its own **⋮** menu; sign in as the student and confirm she sees the same class on her own `/archived` page (she's a member, even though she can't manage it); sign in as the admin and confirm `/archived` shows it too, even without being a member (platform-wide view).

**2. Teacher restrictions**

- On **Stream**, confirm the announcement composer is gone entirely - there is nothing to click to attempt a post.
- On **Classwork**, confirm the **+ Create** button (Assignment/Material/Topic) is gone, and that every assignment/material card's **⋮** management menu (Edit/Delete/Publish/Schedule/Close) is gone too - the cards themselves still render normally, just without controls.
- On **People**, confirm the **Invite** button is gone from the Pending invitations section (the section itself, and the roster, are still visible).
- Try navigating directly to `/classes/<id>` and using the class's **⋮** → there is no way left to reach an Edit dialog for the class's title/section/description.

**3. Student restrictions**

- Sign in as a student in this class (`sofia.student@gcr.dev`). Confirm Stream, Classwork, and People all still show their existing content.
- Open any announcement - confirm the "Add class comment…" box is replaced by "Comments are turned off because this class is archived."
- Open an assignment that was already published before archiving - confirm the submission panel shows "This class is archived - submissions are closed" instead of the response textarea/attachment picker/Turn in button (if the student already had a submission in progress, its read-only content still displays).
- Confirm there is no way to join this class from `/classes` even with the correct class code (try **Join class** with it) - you should get an "archived and no longer accepting new members" error.

**4. Restore**

- Back as the teacher, click **Restore class** (from the banner or the **⋮** menu).
- Confirm the Archived badge/banner disappear immediately, and that the composer, **+ Create** button, per-item management menus, and Invite button are all back.
- As the student, confirm the comment box and submission form are usable again on the same announcement/assignment as before.

**5. Server enforcement, not just UI**

- While the class is archived again (or by re-archiving it), open a second browser tab to an already-open Edit/Create dialog you had queued up before archiving (or replay a previous form submission) - confirm it fails with a clear "This class is archived…" error rather than silently succeeding, proving the block isn't just a hidden button.

**6. Grading stays open**

- With the class archived, open an already-submitted assignment's submission (from `/review` or the classwork submissions list) and confirm you can still enter a grade, return it, and post a private comment - none of that is blocked by archiving, matching real Google Classroom.

**7. Permissions**

- Confirm a co-teacher (promote a student to **Co-teacher** first, from People) can also restore the class - restore isn't owner-only.
- Confirm there is no delete option anywhere in the teacher-facing UI for this class; only `/admin/classrooms` (Admin-only) can permanently delete a classroom.

## Dashboard Enhancements

`/dashboard` is role-specific, not a shared placeholder - a Teacher and a Student see genuinely different content, and an Admin visiting `/dashboard` is sent straight to `/admin` (which is itself now a real, fully wired dashboard rather than the static stub it was left as after Phase 13.1).

- **Teacher dashboard** (`/dashboard` signed in as Teacher): Active/Archived classroom counts, a **Review queue** section that reuses the exact same summary tiles component as `/review` (Pending reviews, Late submissions, Returned today, Recently submitted), a **Scheduled content** breakdown of currently-Scheduled announcements/assignments/materials across the classes they manage, and an **Upcoming publications** list of the soonest-to-publish scheduled items, each linking straight into its classroom.
- **Student dashboard** (`/dashboard` signed in as Student): Active/Archived classroom counts, an **Upcoming deadlines** list of Published assignments due soon (never drafts or scheduled ones - the query only ever selects Published, so nothing a student shouldn't see yet can leak through here), and an **Archived classes** section previewing up to three archived classes with a "View all" link to the full `/archived` page.
- **Admin dashboard** (`/admin`): the platform-wide stat tiles (users by role, classrooms, assignments, submissions, announcements) plus two new tiles - **Archived classrooms** and platform-wide **Scheduled content** (the same summary component the Teacher dashboard uses, just unscoped) - and a **Platform activity** section reusing the existing recent-activity feed from `/admin/reports`.
- **Reuse over duplication**: nothing here re-implements logic that already exists elsewhere - the Review queue tiles, the recent-activity feed, and the archived-classroom card are all the literal same components/queries used by `/review`, `/admin/reports`, and `/archived` respectively, just re-composed. New shared pieces (`ScheduledContentSummary`, `UpcomingItemsList` and its two thin wrappers) were built once and reused across whichever dashboards need them.
- **Query optimization**: every scheduled/archived count is a single indexed `count()` (backed by the `(status, scheduledFor)` index added in Phase 14.1); "Upcoming publications" fetches a small, bounded `take: 5` from each of the three content tables in parallel and merges the results in memory instead of attempting a cross-table SQL `UNION`; every dashboard's tiles are fetched together via one `Promise.all`, never sequentially.

### Dashboard manual testing walkthrough

Sign in as the teacher (`daniel.teacher@gcr.dev`) unless a step says otherwise - see [Get a working login](#get-a-working-login) if that account still needs its password patched.

**1. Role-specific routing**

- Signed in as the teacher, visit `/dashboard` - confirm you see the Teacher dashboard (Review queue, Scheduled content, Upcoming publications), not the old generic placeholder.
- Sign in as the student and visit `/dashboard` - confirm you see the Student dashboard (Upcoming deadlines, Archived classes) instead.
- Sign in as the admin and visit `/dashboard` - confirm you're taken to `/admin` (a real browser follows this immediately; a raw `curl`/HTTP client won't, since this Next.js build emits the redirect as a client-side meta-refresh when streaming rather than a hard 307 - that's expected, not a bug).

**2. Teacher dashboard**

- Note the **Active classes** / **Archived classes** counts, then archive a class (see [Archived Classroom Experience](#archived-classroom-experience)) and refresh - confirm **Archived classes** increments and **Active classes** decrements; restore it afterward.
- Schedule an announcement, an assignment, and a material for a few minutes out (see [Content Scheduling](#content-scheduling)) - refresh `/dashboard` and confirm the **Scheduled content** tiles show 1/1/1 (plus a total of 3), and all three appear in **Upcoming publications**, soonest first, each linking into the right classroom's Stream or Classwork tab.
- Click **Open review queue** next to the Review queue tiles - confirm it takes you to `/review`, and that the numbers shown on the dashboard match the summary tiles there exactly (they're the same underlying query).

**3. Student dashboard**

- As the student, note **Upcoming deadlines** - confirm it lists Published assignments with a future due date, soonest first, and that clicking one opens its assignment detail page.
- Confirm a Scheduled or Draft assignment (created by the teacher but not yet published) never appears in this list - visibility rules are enforced in the query itself, not filtered client-side.
- Archive a class the student is enrolled in - confirm it now shows up under the dashboard's **Archived classes** section (and the **Archived classes** count ticks up); restore it afterward. If the student is in more than three archived classes, confirm a "View all N archived classes" link appears and goes to `/archived`.

**4. Admin dashboard**

- Visit `/admin` directly - confirm the platform stat tiles now render real numbers (not the old "—" placeholders), including the new **Archived classrooms** tile.
- With the scheduled content from step 2 still in place, confirm the Admin dashboard's **Scheduled content** tiles show the same platform-wide total (3 or more, depending on what else is scheduled elsewhere) - unscoped, unlike the teacher's classroom-scoped view.
- Confirm **Platform activity** shows the same recent-activity feed as `/admin/reports` - archiving/restoring a classroom or scheduling content in the steps above should appear here.

## Global Search Infrastructure

The backend for cross-application search (`src/features/search`) - a shared, authorization-aware search service, ready for a future search box to call. **There is no search UI wired up yet** - the header search bar (`src/components/shell/search-bar.tsx`) is still the same plain, non-functional input it's always been, by design (this phase was infrastructure only). Everything below is verified via a script or by calling the exported functions directly, not by clicking anything.

- **What's searchable**: Classrooms (title/section/subject), Announcements (title/content), Assignments (title/description), Materials (title/description), and - Admin only - Users (name/email). Adding a new searchable entity means adding one function to `search-service.ts`; the scoping, merging, and counting pipeline around it is entity-agnostic.
- **Authorization-aware, not filtered after the fact**: a new `getClassroomSearchScope(user)` helper (`classroom-service.ts`) computes, in one query, which classrooms a user manages (full visibility, drafts/scheduled included) versus is only a plain member of (published-only visibility) - the exact same per-classroom rule every feature already enforces individually, just applied across every classroom the viewer can see at once. Archived classrooms are deliberately **included** in scope (only soft-deleted ones are excluded) - archived content stays readable (see [Archived Classroom Experience](#archived-classroom-experience)), so it must stay findable too. Admins bypass membership entirely and search platform-wide, the same convention used everywhere else in the app.
- **Reusable pieces**: `search()` in `search-service.ts` (the shared service - one call, five entity types queried in parallel, merged and sorted by recency), `getSearchResults()` in `queries/search-queries.ts` (server-only, for a future results page), `globalSearchAction()` in `actions/search-actions.ts` (the client-invokable global search endpoint), and `useGlobalSearch()` in `hooks/use-global-search.ts` (a debounced client hook - feed it keystrokes via `setQuery`, it debounces, skips trivial queries, and calls the action). `lib/search-text.ts` and `lib/search-constants.ts` hold the small normalization/truncation utilities and shared constants (`MIN_QUERY_LENGTH`, `DEFAULT_LIMIT_PER_TYPE`, `SEARCH_DEBOUNCE_MS`) every entry point uses.
- **Query optimization**: below `MIN_QUERY_LENGTH` (2 characters), `search()` returns an empty result set without touching the database at all. Otherwise it's exactly five bounded, indexed queries (`take: limit`, default 5 per type) run together via `Promise.all` - never sequential, never per-row.

### Global search infrastructure manual testing walkthrough

Since there's no UI yet, "manual testing" here means calling the service directly with a throwaway script, the same way this phase was verified during development. Run these from the project root with the dev database up (`docker compose up -d`).

**1. Set up a throwaway verification script**

- Create a temporary file, e.g. `scripts-verify-search-tmp.ts`, importing `search` from `@/features/search/services/search-service.ts` and `prisma` from `@/lib/prisma`.
- Look up a teacher, a student, and the admin from the seed data (`prisma.user.findFirst({ where: { role: ... } })`), and an active classroom the teacher owns.
- Run it with `npx tsx --require dotenv/config scripts-verify-search-tmp.ts`, then delete the file when done - don't leave it in the repo.

**2. Authorization scoping**

- Create a draft assignment and a published announcement/assignment/material in the teacher's classroom with a distinctive, uncommon title (e.g. prefix everything with a random word so it can't collide with seed data).
- Call `search(teacherSessionUser, { query: "<your word>" })` - confirm all of them come back, including the draft (the teacher manages this classroom).
- Call `search(studentSessionUser, { query: "<your word>" })` (using a student actually enrolled in that classroom) - confirm the draft assignment is **absent** but the published items are present.
- Call `search(teacherSessionUser, { query: "<your word>", entityTypes: ["user"] })` - confirm it returns nothing (non-admins can't search users, regardless of what they search for).
- Call `search(adminSessionUser, { query: "<any existing user's first name>" })` - confirm matching users appear with `entityType: "user"` and an `href` pointing at `/admin/users?q=<email>`.

**3. Archived classrooms stay searchable**

- Archive the teacher's classroom (`classroomService.archiveClassroom` or the `/classes` UI from [Archived Classroom Experience](#archived-classroom-experience)).
- Re-run the same teacher search from step 2 - confirm the results are unchanged (archived classroom content is still found, matching the rule that archived classrooms remain fully readable).
- Restore the classroom afterward.

**4. Query-length guard and result shape**

- Call `search(teacherSessionUser, { query: "a" })` (below `MIN_QUERY_LENGTH`) - confirm it returns `{ query: "a", totalCount: 0, items: [], countsByType: { ...all zero } }` immediately, without needing any matching data to exist.
- Call `search(teacherSessionUser, { query: "<your word>", entityTypes: ["material"] })` - confirm only material results come back, even though the announcement/assignment also match.

**5. Clean up**

- Delete the test announcement/assignment/material created in step 2 and remove the throwaway script - the feature itself adds no new routes or UI, so there's nothing else to reset.

## Admin Platform

Everything under `/admin` is gated to `UserRole.ADMIN` at two layers - `src/proxy.ts` (redirects non-admins to `/dashboard?denied=admin` before the page even renders) and `src/app/admin/layout.tsx` (a server-side re-check). Sign in as `faizan.admin@gcr.dev` and use the **Admin** section of the sidebar, or visit the routes below directly.

**Dashboard (`/admin`)** - platform-wide stat tiles (users by role, classrooms, assignments, submissions, announcements), plus Archived classroom and Scheduled content statistics and a Platform activity feed (see [Dashboard Enhancements](#dashboard-enhancements)). The deeper analytics view - the platform-growth chart, a system-overview breakdown, and links into the six detailed reports - lives at `/admin/reports`, linked from the sidebar.

**Users (`/admin/users`)** - searchable/filterable/sortable/paginated user table. Create a user (a temporary password is generated and shown once), edit name/email/role, change status (Active/Inactive/Suspended/Archived - Locked is system-only, see Security), reset a password, or force a password change on next sign-in. Public self-registration is intentionally absent - every account originates here or from the seed script.

**Classrooms (`/admin/classrooms`)** - every classroom on the platform, regardless of owner. Archive/restore/delete (soft-delete), transfer ownership to another user by email, assign an additional teacher by email, and view per-classroom statistics (members, assignments, submissions) and its member list.

**Moderation (`/admin/moderation`)** - a single console for moderating Announcements, Comments, Materials, and Assignments across every classroom (switch content type via the dropdown). Archive, soft-delete, or restore any item; every action requires a confirmation dialog first.

**Reports (`/admin/reports`)** - the same stat tiles as the dashboard plus a platform-growth chart (weekly signups/classrooms, last 12 weeks) and a recent-activity feed, with links out to six detailed, filterable/sortable reports: Teacher Activity, Student Activity, Assignment Completion, Submission Rates, Classroom Activity, and Inactive Users. Every report returns a `{ columns, rows }` shape ready for a future CSV/PDF exporter (not built yet, by design).

**Audit Logs (`/admin/audit-logs`)** - a searchable, filterable, paginated trail of every administrative event: user create/update/role-change/suspend/password-reset, classroom archive, content moderation actions, account lock/unlock, and session termination. Filter by exact event type or search by actor/target.

**Settings (`/admin/settings`)** - platform-wide configuration: platform name (shown in both app and admin headers, and the page `<title>`), academic year, session timeout, max upload size, default classroom settings (applied to every newly created classroom), notification defaults, and the password policy (min length, uppercase/number/symbol requirements - enforced live on the self-service change-password form).

**Security (`/admin/security`)** - account-status breakdown, the current password policy, and three drill-down pages: **Active Sessions** (every currently valid signed-in session, with a real "Terminate" action - JWTs are stateless, so this is backed by a `UserLoginSession` table keyed by a session id embedded in the JWT and checked on every request), **Failed Login Attempts** (every unsuccessful sign-in, with email/IP/device), and **Locked Accounts** (auto-locked after 5 consecutive failed attempts; unlock or force a password reset from here).

### Admin manual testing walkthrough

A step-by-step path through every admin area, in the order it was built. Sign in as `faizan.admin@gcr.dev` / `F@izan4121` unless a step says otherwise. Every mutation below writes a real database row and shows a toast - nothing here is mocked.

**1. Access control**

- Signed out, visit `/admin` directly - redirected to `/login`.
- Signed in as the teacher or student seed account, visit `/admin` - redirected to `/dashboard?denied=admin` with an error toast; the **Admin** nav section is absent from their sidebar entirely.
- Signed in as the admin, `/admin` loads the dashboard inside its own shell (separate header/sidebar from the teacher/student app, same design system).

**2. Users (`/admin/users`)**

- Use the search box and the role/status filter dropdowns together, then click a column header to sort - the URL updates with `?q=`/`?role=`/`?status=`/`?sort=` and the table re-renders server-side.
- Click **Create user**, fill in name/email/role, submit - a one-time temporary-password dialog appears; copy it.
- Sign in as that new user with the temp password - you land on `/change-password` immediately (a new admin-created account always requires setting its own password first), not `/dashboard`.
- Back as admin, open a user's **⋮** menu: **Edit** (change name/email/role - changing role alone logs a different audit event than changing name/email, see step 7), **Reset password** (new temp password, same one-time dialog), **Force password change** (no new password yet, but their next sign-in redirects to `/change-password` the same way), and status changes (**Deactivate**/**Suspend**/**Archive**, each behind a confirmation dialog, plus **Reactivate** once inactive).
- Try deactivating or changing the role of your own admin account - it's blocked with an inline error (`CANNOT_MODIFY_SELF`); every other admin action can target any account, including other admins.

**3. Classrooms (`/admin/classrooms`)**

- The table lists every classroom platform-wide, not just ones you belong to - search/filter/sort/pagination work the same way as Users.
- Open **View details** on "Advanced Mathematics 101" - a side panel shows member/teacher/student counts, assignment/announcement/material/submission counts, and the full roster.
- **Archive** it (confirmation dialog first) - it disappears from the teacher's/students' classroom lists; **Restore** brings it back.
- **Transfer ownership** by typing another user's email (e.g. a student's) - that user becomes OWNER, the previous owner is downgraded to TEACHER.
- **Assign teacher** by email - adds that user as a TEACHER member without touching the owner.
- **Delete** (soft-delete) - same visual effect as Archive from the classroom's perspective, but tracked as a distinct action in the audit log.

**4. Moderation (`/admin/moderation`)**

- Switch the **Content type** dropdown between Announcements / Comments / Materials / Assignments - each renders its own columns (comments show a truncated content preview instead of a title).
- Pick any item's **⋮** menu: **Archive**, **Delete**, or **Restore** (whichever apply to its current status) - each requires confirming first, then the item's status badge updates and it disappears from the classroom it came from.
- Filter by status (Active/Archived/Deleted) to find something to restore after archiving/deleting it.

**5. Reports (`/admin/reports`)**

- The dashboard shows the same stat tiles as `/admin`, plus a 12-week platform-growth line chart (users + classrooms created per week) and a recent-activity feed.
- Follow the six report cards at the bottom into their own pages: **Teacher Activity**, **Student Activity**, **Assignment Completion**, **Submission Rates**, **Classroom Activity**, **Inactive Users**. Each supports search, a relevant filter (e.g. classroom or status), and click-to-sort column headers, independent of the others.
- On **Inactive Users**, lower the "days inactive" threshold to `0` - every seeded account (all created moments apart) should now appear, since none of them are older than that.

**6. Audit Logs (`/admin/audit-logs`)**

- After doing steps 2-4 above, open this page - you should see one row per action you just took (e.g. "User Created", "Role Changed", "Classroom Archived", "Assignment Deleted"), each with a timestamp, the admin as Actor, and a human-readable Target (a user's "Name (email)", a classroom's title, a content item's title/preview).
- Filter by one exact event type via the dropdown, or search by actor/target text - pagination applies once you have more rows than fit on one page.
- Note what's deliberately _not_ here: ordinary classroom activity like a student joining or submitting work lives in the same underlying table but is excluded from this view - only the fixed set of administrative events counts.

**7. Settings (`/admin/settings`)**

- Change **Platform name** and save - confirm it now shows in both the teacher/student app header and the admin header, and in the browser tab title.
- Toggle a **Default classroom setting** (e.g. turn off "Allow materials") and save, then create a new classroom (as the teacher, or via admin/classrooms is view-only for creation) - the new classroom's settings should reflect the value you just changed, not the old default.
- Tighten the **Password policy** (e.g. require a symbol, raise the minimum length) and save, then go to `/change-password` as any signed-in user and try a password that violates the new rule - it's rejected with the specific requirement that's missing.

**8. Security (`/admin/security`)**

- The overview shows live counts: active sessions, locked accounts, failed attempts in the last 24 hours, and the current password policy.
- Open **Active sessions** - your own current session is listed with its IP/device and expiry. Sign in as another seed account in a second browser (or incognito), find that session here, and **Terminate** it - the other browser gets signed out on its very next request (try refreshing it).
- Deliberately fail a sign-in 5 times in a row for one account (wrong password each time) - the 6th attempt fails even with the _correct_ password, because the account is now locked. Confirm it under **Locked accounts**.
- From **Locked accounts**, either **Unlock** it (sign-in works again immediately) or **Force a password reset** (generates a new temporary password and also clears the lock).
- Open **Failed login attempts** - your 5 deliberate failures (plus the 6th "correct password, still locked" one) are all listed with timestamps.

**9. Cross-check with Audit Logs**

- Go back to `/admin/audit-logs` - the lock from step 8 shows as "Account Locked" (attributed to the locked account itself, since it was system-triggered by its own failed attempts, not by an admin), and your unlock/terminate/reset actions each show up as their own event, all attributed to you as the actor.

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

- `src/app`: Next.js App Router routes.
  - `(auth)/login` is public.
  - `(app)` is the session-gated group wrapping every authenticated route in the shared shell (`dashboard`, `classes`, `classes/[classroomId]/{stream,classwork,people}`, `archived` - the "Archived classes" listing, `notifications`, `settings` - profile + password, `change-password`, `review` - the Teacher Review Queue, additionally gated to Teacher/Admin).
  - `admin` is the `UserRole.ADMIN`-gated console (`users`, `classrooms`, `moderation`, `reports` + six report sub-routes, `audit-logs`, `settings`, `security` + three sub-routes), wrapped in its own shell by `admin/layout.tsx`.
  - `api/auth/[...nextauth]` is the Auth.js route handler.
- `src/components/ui`: shadcn-style design-system primitives (button, card, table, dialog, alert-dialog, dropdown-menu, sheet, tooltip, input, textarea, select, label, skeleton, badge, avatar, separator) - no domain logic.
- `src/components/shell`: the teacher/student application chrome - header, sidebar, mobile drawer, nav config, breadcrumbs, user/notifications menus.
- `src/components/admin`: the parallel admin chrome - admin shell/header/sidebar/mobile-nav, its own nav config, and the forbidden-access toast.
- `src/components/page`: page-composition scaffolding - page container, section header, dashboard/stat grids, the shared paginated-table `Pagination` control.
- `src/components/states`: shared empty/error/loading-skeleton components.
- `src/components/layouts`: the pre-auth marketing shell used by the public landing page.
- `src/features/<name>`: feature-owned code, each split into `services/` (Prisma access + business rules), `validation/` (Zod schemas), `actions/` (Server Actions), `queries/` (plain server-only read functions, not client-invokable Server Actions), `components/`, `hooks/`, `lib/`, `types/`. Teacher/student-facing: `classroom`, `stream`, `classwork` (topics, materials, assignments, assignment detail), `submissions` (turn-in + grading), `scheduling` (the cross-content-type Draft/Scheduled/Published engine's feature-layer wiring), `review` (the cross-classroom Teacher Review Queue), `dashboard` (the role-specific `/dashboard` and `/admin` views, composed from the other features' existing services), `search` (the shared, authorization-aware global search service - backend only, no UI yet), `notifications`, `account` (self-service change-password). Admin-facing, under `features/admin/*`: `users`, `classrooms`, `moderation`, `reports` (dashboard analytics + six detailed report generators), `audit-logs`, `settings`, `security`.
- `src/auth`: Auth.js configuration (`index.ts` - credentials provider, login-attempt tracking, auto-lockout, per-session JWT tracking) and the server-side session helper (`session.ts`).
- `src/lib`: shared utilities - `lib/auth/permissions.ts` (role/ownership authorization helpers), `lib/auth/password.ts` / `lib/password-policy.ts` (hashing + policy enforcement), `lib/audit-log.ts` (the single source of truth for which admin events are tracked, shared by every feature that writes or reads the audit trail), `lib/system-settings.ts` (cached read of the platform settings singleton), `lib/scheduling` (the content-type-agnostic Draft/Scheduled/Published engine, shared by announcements/assignments/materials), `lib/prisma.ts` (Prisma client singleton).
- `src/proxy.ts`: the renamed Next.js middleware convention - auth gate, admin-route gate, review-route gate, forced-password-change redirect, and per-request session-revocation check.
- `src/generated/prisma`: generated Prisma client - do not edit.
- `src/config`: environment variable parsing/validation.
- `docs`: project documentation (UI architecture, database architecture, authentication plan).
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

- **Authentication & session security**: Auth.js credentials provider, JWT sessions, Prisma adapter, `/login` form, `proxy.ts`-enforced route protection, per-attempt login tracking, auto-lockout after 5 consecutive failures, forced password-change flow, and revocable per-session tracking (a `UserLoginSession` row per sign-in, checked on every request, so a specific session can be terminated despite JWTs otherwise being stateless).
- **Application shell**: responsive header, collapsible desktop sidebar, mobile drawer navigation, breadcrumbs, user/notifications menus, page-composition primitives, empty/loading/error states - plus a parallel shell for the admin console.
- **Classroom module**: create/edit/archive/restore a classroom (Teacher/Admin), join/leave by class code (any authenticated user), classroom list ("My Classrooms" cards), classroom detail shell with Stream/Classwork/People tab navigation, and a fully read-only archived state (see [Archived Classroom Experience](#archived-classroom-experience)).
- **Stream module**: announcements (create/edit/delete/pin/unpin, Teacher/Admin only, students read-only), draft/scheduled/published lifecycle (see Content Scheduling), pinned-first ordering, comments on announcements (create by any member, delete own, teacher/manager can delete any) with optimistic UI, confirmation dialogs on destructive actions, toast notifications throughout.
- **Classwork module**:
  - _Topics_: create, rename, delete, and drag-and-drop reorder (Teacher/Admin only; students read-only).
  - _Materials_: metadata-only uploads, link/URL materials (auto-typed as video/link), file attachments, optional topic assignment, and a draft/scheduled/published lifecycle (see Content Scheduling).
  - _Assignments_: create/edit/delete with title, instructions, due date, points, topic, and attachments; a draft → scheduled → published → closed lifecycle where drafts and scheduled items are invisible to students, not just visually hidden.
  - _Assignment detail page_: full instructions/attachments, the shared management menu for teachers, and a real submission/grading flow - students turn in text and/or attachments, teachers grade (bounded by the assignment's points) and return work with feedback, and a private comment thread sits alongside each submission.
- **Content Scheduling** (see [Content Scheduling](#content-scheduling) for the full walkthrough): a single shared engine (`src/lib/scheduling` + `src/features/scheduling`) drives Draft/Scheduled/Published transitions for announcements, assignments, and materials alike - Schedule for later, Cancel scheduled publication, and Publish now Server Actions, with the batch "publish everything due" function already built as the seam a future cron job would call.
- **Teacher Review Queue** (`/review`, Teacher/Admin-only - see [Teacher Review Queue](#teacher-review-queue) for the full walkthrough): a centralized, cross-classroom list of submissions needing attention (submitted/late/returned), with classroom/assignment/student/status/due-date filters, five sort options, four aggregate summary tiles, and inline Grade/Return/Comment via a dialog that reuses the same review panel as the full submission page.
- **Archived Classroom Experience** (see [Archived Classroom Experience](#archived-classroom-experience) for the full walkthrough): archiving a classroom makes it genuinely read-only - every content-mutating Server Action across classroom/stream/classwork/submissions/invitations is independently blocked server-side via one shared `assertClassroomActive` guard, with matching UI (archived badge/banner, Restore action, disabled compose/invite/management controls) so the interface never dangles a control the server would reject.
- **Dashboard Enhancements** (see [Dashboard Enhancements](#dashboard-enhancements) for the full walkthrough): `/dashboard` now renders a genuinely role-specific view for Teachers (Review queue summary, Scheduled content, Upcoming publications) and Students (Upcoming deadlines, Archived classes), and `/admin` is a real, fully wired dashboard (previously a static placeholder) with platform-wide Archived classroom and Scheduled content statistics plus a Platform activity feed - built by composing existing, already-tested components and queries rather than duplicating them.
- **Global Search Infrastructure** (see [Global Search Infrastructure](#global-search-infrastructure) for the full walkthrough): a shared, authorization-aware search service across classrooms/announcements/assignments/materials (plus users, Admin-only) - backend and a reusable debounced hook only, no search UI wired up yet.
- **People module**: classroom roster split into Teachers/Students, an Invite dialog (email or shareable code), role changes (promote/demote co-teacher, transfer ownership), and remove-member - all authorized server-side.
- **Notifications**: real, database-backed notifications (new assignment/material/announcement, submission returned, private comment) with an unread-count badge and a notification center, generated as a side effect of the actions above.
- **Admin platform** (`/admin`, `UserRole.ADMIN`-only - see [Admin Platform](#admin-platform) for the full walkthrough): dashboard analytics, user management (create/edit/status/reset password/force password change), classroom administration (archive/restore/delete/transfer ownership/assign teacher), content moderation (archive/delete/restore announcements/comments/materials/assignments), six detailed filterable reports, a full audit log of every administrative action, platform-wide settings (branding, password policy, defaults), and a security dashboard (active sessions, failed logins, account lockouts).

  All of the above is authorized server-side (Server Actions + service-layer checks), not just hidden in the UI.

## Future Modules

Still planned / not yet built:

- Calendar (due dates across classes)
- Global search UI (the search service/action/debounced hook already exist and are fully authorization-aware - see [Global Search Infrastructure](#global-search-infrastructure) - but the header search bar is still a plain, unwired input; no results dropdown or results page has been built yet)
- Real file storage for uploads (materials/assignments/submissions currently record file metadata only; Supabase Storage is the planned backend)
- CSV/PDF export for admin reports (the report data layer already returns an export-ready `{ columns, rows }` shape; no exporter is wired up yet, by design)
- An automatic scheduler (cron job/worker) to call `publishScheduledContent` on an interval (the function itself, and the admin-triggerable Server Action wrapping it, already exist - see [Content Scheduling](#content-scheduling))

## Deployment

Production deployment will target Vercel for the application and PostgreSQL for data storage, with Supabase Storage for file uploads in the future.
