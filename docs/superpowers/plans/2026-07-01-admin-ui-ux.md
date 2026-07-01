# Admin UI UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Facebook Reels Automation admin UI into a safer, clearer dashboard for Pages, media, posts, jobs, logs, and settings without changing publish business logic.

**Architecture:** Keep reads server-first where pages can load initial data, then hand serialized data to focused client screens for mutations, feedback, filtering, and confirmations. Shared UI primitives live in `src/components`, while existing App Router pages remain the route entry points.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma-backed route handlers, plain CSS, lucide-react, Vitest.

---

### Task 1: Formatting And Client API Foundation

**Files:**
- Modify: `src/lib/format.test.ts`
- Modify: `src/lib/format.ts`
- Modify: `src/lib/client-api.ts`

- [x] Add failing tests for `formatDateTimeLocal` and `formatStatus`.
- [x] Run `npm test -- src/lib/format.test.ts` and verify the missing helpers fail.
- [x] Implement the helpers and narrow `fetch` body types in `client-api.ts`.
- [x] Re-run the focused tests.

### Task 2: Shared UI Components

**Files:**
- Create: `src/components/ui/*.tsx`
- Create: `src/components/status/*.tsx`
- Create: `src/components/layout/*.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/_components/app-shell.tsx`

- [x] Add card, button, input, textarea, select, badge, table, loading, empty, error, confirm, toast, and page header primitives.
- [x] Add status badges for posts, jobs, pages, media, and logs.
- [x] Improve the admin shell with topbar, DRY RUN badge, active navigation, and responsive behavior.

### Task 3: Data Serialization And Screen Clients

**Files:**
- Create: `src/lib/admin-types.ts`
- Create: `src/lib/serializers.ts`
- Create: `src/components/forms/*.tsx`
- Create: `src/components/screens/*.tsx`
- Modify: `src/app/**/page.tsx`

- [x] Serialize Date/BigInt server data before passing it to client screens.
- [x] Build client screens for Dashboard, Pages, Media, Posts, Create Post, Jobs, Logs, and Settings.
- [x] Use existing JSON route handlers only; do not call Meta from the UI.
- [x] Add loading, error, empty, confirmation, filter, and feedback states.

### Task 4: Docs And Verification

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [x] Update project status and browser UI flow documentation.
- [x] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run local browser verification for core screens.
- [ ] Request a code review pass and fix actionable issues.
