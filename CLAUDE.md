# Facebook Page/Reels Automation Platform

Last updated: 2026-07-01

## 1. Project Overview

This project is an internal admin website for managing Facebook Page/Reels publishing automation through the official Meta Graph API path.

The website is used to:

- Manage Facebook Pages.
- Store Page Access Tokens in encrypted form.
- Upload and manage local video/media assets.
- Create captions and SocialPosts.
- Schedule Reels/video posts.
- Create PublishJobs.
- Run a background worker that processes due jobs.
- Write JobLogs for each important worker step.
- Retry/cancel jobs.
- Watch basic dashboard metrics.

Important boundary:

- The UI must not publish directly inside a browser request.
- The UI creates data and jobs only.
- The worker is the only place that handles publishing.
- Facebook Groups automation is out of scope.
- Browser automation for Facebook posting is out of scope.

## 2. Current Implementation Status

| Area | Status | Notes |
|---|---|---|
| Prisma schema | Done | Models, enums, relations, indexes, and migrations exist. |
| Database seed | Done | `prisma/seed.ts` creates admin user, test Page, sample media, SocialPost, and PublishJob. |
| Token encryption | Done | AES-256-GCM in `src/lib/crypto.ts`; tokens are not stored plaintext. |
| Meta service mock | Done / Mock | `MetaService` supports DRY_RUN mock publish and token test; real Meta calls are not implemented. |
| Worker | Partial | DB-backed worker scans due jobs, locks, validates, calls mock, updates status, logs. BullMQ is configured but not actively used by the worker. |
| API routes | Partial | Many route handlers exist. They were being moved to `{ success, data }` JSON responses. Needs final verification after current type errors are fixed. |
| Dashboard UI | Improved | `/dashboard` uses the shared admin shell, metric cards, upcoming posts, failed job actions, empty/error states, and client refresh. |
| Page management UI | Improved | `/pages` no longer renders tokens or `maskedToken`; create/edit/test-token/disable actions use JSON API calls with feedback. |
| Media upload UI | Improved | `/media` has a clear upload card, selected-file preview, media table, copy path, archive action, and feedback states. |
| Post scheduling UI | Improved | `/posts` and `/posts/new` use client-side form/actions, filters, preview/checklist, status badges, confirm, and redirects instead of raw JSON form posts. |
| Jobs UI | Improved | `/jobs` has filters, retry/cancel actions with confirmation, status badges, error truncation, and log links. |
| Logs UI | Improved | `/logs` has level/job/post/limit filters and expandable sanitized metadata. |
| Settings UI | Improved | `/settings` shows safe read-only environment values and hides secrets. |
| Users UI | Missing / Placeholder | `/users` exists as an empty placeholder. No auth/users management. |
| Auth | Missing | No login/session/RBAC middleware. Do not expose publicly. |
| Real Meta API | Missing / Mock only | `DRY_RUN=false` throws `MetaApiNotImplementedError`. |
| Telegram alert | Missing | Env vars exist; no alert service. |
| S3/Wasabi storage | Missing | Local filesystem only. |
| Docker Compose | Partial | `app`, `worker`, `postgres`, `redis` services exist. Production reverse proxy/HTTPS not included. |

Current typecheck status:

```text
npm run typecheck passes after the admin UI/API contract cleanup.
```

## 3. Completed Features

### Backend

- Prisma schema includes:
  - `User`
  - `FacebookPage`
  - `MediaAsset`
  - `SocialPost`
  - `PublishJob`
  - `JobLog`
  - `AuditLog`
  - `Setting`
- Zod env validation exists in `src/server/env.ts`.
- Prisma singleton exists in `src/server/db.ts`.
- JSON logger exists in `src/server/logger.ts` and redacts sensitive keys.
- Error classes exist in `src/server/errors.ts`.
- API response helpers exist in `src/server/api-response.ts`.
- BigInt serialization support exists for API responses.
- Validators exist for Page, Media, and Post inputs.

### Services

- `page.service.ts`
  - List Pages without returning encrypted tokens.
  - Create Page and encrypt access token.
  - Update Page and re-encrypt token if provided.
  - Disable Page.
  - Test token through Meta mock and update token health fields.
- `media.service.ts`
  - List media.
  - Upload local video files to `UPLOAD_DIR`.
  - Create media record.
  - Soft-delete media by setting `DELETED`.
- `post.service.ts`
  - List posts.
  - Create draft/scheduled post.
  - Schedule post and create publish job.
  - Cancel post.
  - Mark post processing/published/failed.
- `job.service.ts`
  - Create publish job while avoiding duplicate active jobs for a post.
  - Get due jobs.
  - Lock job with optimistic update.
  - Mark running/success/failed.
  - Retry failed job.
  - Cancel pending job.
  - List/detail jobs.
- `log.service.ts`
  - Create DB job logs.
  - Also write logs to console logger.
  - Swallow DB log persistence errors so the worker does not crash.
- `dashboard.service.ts`
  - Counts scheduled/published/failed today.
  - Counts pending/running jobs.
  - Counts Pages and media.
  - Returns upcoming posts and recent failed jobs.

### Worker

- `src/workers/reels-publisher.worker.ts` can:
  - Ensure due READY/QUEUED posts have PublishJobs.
  - Load due jobs.
  - Lock a job.
  - Mark job running.
  - Validate Page/Post/Media.
  - Decrypt Page token.
  - Call `MetaService.publishReel`.
  - Mark post `PUBLISHED` and job `SUCCESS` in DRY_RUN.
  - Mark failed jobs retryable or final failed.
  - Write JobLog records.
  - Disconnect Prisma at the end.

### Tests

Unit tests exist for:

- API response helpers.
- Formatting helpers.
- Retry/error classification.
- Time/backoff helpers.
- Token crypto.
- Constants/sanitization.
- Meta mock service.
- Page, media, and post validators.

## 4. Incomplete / Mocked / TODO Features

| Feature | Current State | Needed Next |
|---|---|---|
| Real Meta API publishing | Mock only | Implement Graph API start upload, binary upload, finish publish, status polling. |
| API/UI contract | Improved | Main admin screens now use `{ success, data }` API helpers from client actions instead of plain HTML posts to JSON routes. |
| Typecheck | Passing | `npm run typecheck` passes after removing `maskedToken` usage and narrowing `client-api.ts` request body types. |
| Auth | Not implemented | Add admin login, sessions, middleware, password hashing, logout. |
| RBAC | Not implemented | Enforce admin/editor/viewer permissions. |
| Audit log | Schema exists, not wired | Log login/logout, Page token changes, schedule/cancel/retry, media delete, settings changes. |
| Telegram/Gmail alert | Not implemented | Add alert service and send on final job failure/token invalid. |
| BullMQ worker | Partial | `queue.ts` exists, but worker currently scans DB directly. |
| Repeating scheduler | Partial | Worker one-shot creates jobs for due posts; no long-running scheduler loop. |
| S3/Wasabi storage | Not implemented | Add storage driver abstraction and object upload/delete. |
| Video validation | Basic | Add duration, size policy, MIME probing, thumbnail/preview. |
| Production deploy | Partial | Add reverse proxy, HTTPS, secrets, backups, health monitoring. |
| UI filters | Improved | Posts/jobs filter client-side; logs call the API with level/job/post/limit filters. |
| Users page | Placeholder | Implement user CRUD after auth/RBAC. |

## 5. Architecture

```text
Admin Website
  -> Next.js App Router pages
  -> Next.js API Routes
  -> PostgreSQL via Prisma
  -> PublishJob records in database
  -> Worker
  -> MetaService
  -> Meta Graph API / DRY_RUN mock
  -> JobLog
  -> Dashboard
```

Standard flow:

```text
1. Admin creates a Facebook Page.
2. Admin uploads a video.
3. Admin creates a SocialPost.
4. Admin schedules the post.
5. The system creates a PublishJob.
6. Worker finds due jobs.
7. Worker locks the job.
8. Worker validates SocialPost, FacebookPage, and MediaAsset.
9. Worker decrypts the Page token.
10. Worker calls MetaService.publishReel.
11. On success: SocialPost = PUBLISHED, PublishJob = SUCCESS.
12. On error: PublishJob is retried or marked FAILED.
13. JobLog entries are written.
```

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Web framework | Next.js 15 App Router |
| UI | React 19, plain CSS, lucide-react icons |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Validation | Zod |
| Queue | Database-backed PublishJob records currently; BullMQ helper exists but is not active in worker |
| Redis | Docker service and BullMQ helper configured; not actively required by current worker path |
| Worker | Node.js script via `tsx` |
| Storage | Local filesystem under `UPLOAD_DIR` |
| Deployment | Docker Compose |
| Tests | Vitest |

## 7. Repository Structure

```text
.
├─ CLAUDE.md
├─ README.md
├─ package.json
├─ .env.example
├─ docker-compose.yml
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ _components/
│  │  ├─ dashboard/
│  │  ├─ pages/
│  │  ├─ media/
│  │  ├─ posts/
│  │  ├─ jobs/
│  │  ├─ logs/
│  │  ├─ settings/
│  │  └─ users/
│  ├─ lib/
│  ├─ server/
│  │  ├─ services/
│  │  ├─ validators/
│  │  ├─ db.ts
│  │  ├─ env.ts
│  │  ├─ errors.ts
│  │  ├─ logger.ts
│  │  └─ queue.ts
│  ├─ types/
│  └─ workers/
├─ docs/
└─ uploads/
```

Notes:

- `src/components/` is not present. Shared UI components currently live in `src/app/_components/`.
- `uploads/` exists and contains `.gitkeep`; uploaded local files are runtime artifacts.
- `docs/` contains architecture/security/queue/Meta/deployment skill notes.

## 8. Environment Variables

| Variable | Required | Description | Example |
|---|---:|---|---|
| `APP_ENV` | Yes | Runtime environment | `development` |
| `APP_URL` | Yes | Website URL | `http://localhost:3000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://app:password@localhost:5432/facebook_automation` |
| `REDIS_URL` | Yes | Redis connection string; currently for BullMQ helper | `redis://localhost:6379` |
| `META_GRAPH_VERSION` | Yes | Meta Graph API version | `v25.0` |
| `META_APP_ID` | Later | Meta App ID for real API work | empty |
| `META_APP_SECRET` | Later | Meta App Secret for real API work | empty |
| `TOKEN_ENCRYPTION_KEY` | Yes | Key material used to derive AES-256-GCM token encryption key | `change-this-32-byte-key` |
| `DRY_RUN` | Yes | Prevents real Meta publish calls | `true` |
| `STORAGE_DRIVER` | Yes | Storage driver | `local` |
| `UPLOAD_DIR` | Yes | Local upload folder | `./uploads` |
| `DEFAULT_TIMEZONE` | Yes | Default timezone | `Asia/Ho_Chi_Minh` |
| `MAX_REELS_PER_PAGE_PER_DAY` | Yes | Daily safety limit | `30` |
| `MAX_POSTS_PER_RUN` | Yes | Worker batch size | `1` |
| `MAX_RETRY` | Yes | Max retry attempts | `3` |
| `TELEGRAM_BOT_TOKEN` | Later | Alert bot token | empty |
| `TELEGRAM_CHAT_ID` | Later | Alert chat id | empty |

Production note: do not use `change-this-32-byte-key` in production.

## 9. Database Schema Summary

### User

Purpose: stores admin/editor/viewer user records for future auth/RBAC.

Important fields:

- `email`
- `passwordHash`
- `role`
- `status`

Relations:

- Has many `SocialPost`
- Has many `AuditLog`

### FacebookPage

Purpose: stores Facebook Page metadata and encrypted Page Access Token.

Important fields:

- `pageId`
- `name`
- `accessTokenEncrypted`
- `dailyLimit`
- `timezone`
- `status`
- `lastTokenCheckAt`
- `lastTokenError`

Relations:

- Has many `SocialPost`

### MediaAsset

Purpose: stores uploaded local media/video metadata.

Important fields:

- `type`
- `filename`
- `originalName`
- `storageDisk`
- `storagePath`
- `mimeType`
- `sizeBytes`
- `durationSeconds`
- `status`

Relations:

- Has many `SocialPost`

### SocialPost

Purpose: stores the post/Reel draft and schedule state.

Important fields:

- `facebookPageId`
- `mediaAssetId`
- `type`
- `caption`
- `scheduledAt`
- `status`
- `attempts`
- `maxAttempts`
- `facebookVideoId`
- `facebookPostId`
- `lastError`
- `publishedAt`

Relations:

- Belongs to `FacebookPage`
- Belongs to `MediaAsset`
- Belongs to optional `User`
- Has many `PublishJob`
- Has many `JobLog`

### PublishJob

Purpose: stores publish work items processed by the worker.

Important fields:

- `runId`
- `socialPostId`
- `jobType`
- `status`
- `runAt`
- `startedAt`
- `finishedAt`
- `attempts`
- `maxAttempts`
- `lockedAt`
- `lockedBy`
- `errorCode`
- `errorMessage`
- `rawResponseJson`

Relations:

- Belongs to `SocialPost`
- Has many `JobLog`

### JobLog

Purpose: stores step-by-step logs for jobs/posts.

Important fields:

- `jobId`
- `socialPostId`
- `level`
- `step`
- `message`
- `metaJson`
- `createdAt`

### AuditLog

Purpose: future audit trail for sensitive admin actions.

Important fields:

- `userId`
- `action`
- `entityType`
- `entityId`
- `metaJson`
- `createdAt`

### Setting

Purpose: future key-value application settings.

Important fields:

- `key`
- `value`

### Important Status Enums

`SocialPostStatus`:

- `DRAFT`
- `READY`
- `QUEUED`
- `PROCESSING`
- `PUBLISHED`
- `FAILED`
- `CANCELLED`

`PublishJobStatus`:

- `PENDING`
- `RUNNING`
- `SUCCESS`
- `FAILED`
- `CANCELLED`

`PageStatus`:

- `ACTIVE`
- `DISABLED`
- `TOKEN_INVALID`

`MediaStatus`:

- `READY`
- `PROCESSING`
- `FAILED`
- `DELETED`

## 10. API Routes Summary

| Method | Route | Purpose | Status |
|---|---|---|---|
| GET | `/api/health` | Database health check | Done, legacy response format |
| GET | `/api/dashboard` | Dashboard metrics | Done |
| GET | `/api/facebook-pages` | List Pages without token | Done |
| POST | `/api/facebook-pages` | Create Page with encrypted token | Done |
| GET | `/api/facebook-pages/:id` | Get Page detail | Done |
| PATCH | `/api/facebook-pages/:id` | Update Page/token/status | Done |
| DELETE | `/api/facebook-pages/:id` | Soft-disable Page | Done |
| POST | `/api/facebook-pages/:id/test-token` | Test token via Meta mock | Done |
| GET | `/api/media` | List media | Done |
| POST | `/api/media/upload` | Upload local video | Done |
| GET | `/api/media/:id` | Get media detail | Done |
| DELETE | `/api/media/:id` | Soft-delete media | Done |
| GET | `/api/posts` | List posts | Done |
| POST | `/api/posts` | Create draft or scheduled post | Done |
| GET | `/api/posts/:id` | Get post detail | Done |
| PATCH | `/api/posts/:id` | Update post before processing/published | Done |
| DELETE | `/api/posts/:id` | Cancel post | Done |
| POST | `/api/posts/:id/schedule` | Schedule post and create job | Done |
| POST | `/api/posts/:id/cancel` | Cancel post and pending jobs | Done |
| POST | `/api/posts/:id/retry` | Retry failed post/latest failed job | Done |
| GET | `/api/jobs` | List publish jobs | Done |
| GET | `/api/jobs/:id` | Job detail with logs | Done |
| POST | `/api/jobs/:id/retry` | Retry failed job | Done |
| POST | `/api/jobs/:id/cancel` | Cancel pending job | Done |
| GET | `/api/logs` | List/filter logs | Done |
| Any | `/api/auth/*` | Login/logout/me | Missing |
| GET | `/api/posts/:id/logs` | Post-specific logs route | Missing |
| GET | `/api/jobs/:id/logs` | Job-specific logs route | Missing |

## 11. UI Pages Summary

| Page | Path | Purpose | Status |
|---|---|---|---|
| Home redirect | `/` | Redirects to `/dashboard` | Done |
| Dashboard | `/dashboard` | Shows metrics/upcoming/failed jobs | Partial; uses client API fetch |
| Facebook Pages | `/pages` | Add/list/test Page | Partial / currently type-broken due `maskedToken` |
| Media | `/media` | Upload/list media | Partial; form posts to JSON route |
| Posts | `/posts` | List posts and actions | Partial; action forms post to JSON route |
| Create Post | `/posts/new` | Create draft/schedule post | Partial; form posts to JSON route |
| Jobs | `/jobs` | List/retry/cancel jobs | Partial; action forms post to JSON route |
| Logs | `/logs` | List logs | Partial; no filter UI |
| Settings | `/settings` | Shows selected env values | Partial |
| Users | `/users` | Placeholder | Missing / placeholder |

## 12. Worker Flow

Command:

```bash
npm run worker:dev
```

Current flow:

```text
1. Load env.
2. Generate workerId from hostname, pid, and timestamp.
3. Ensure due READY/QUEUED posts have PublishJobs.
4. Get due jobs with status=PENDING, runAt<=now, attempts<maxAttempts.
5. Lock job with lockedAt/lockedBy.
6. Mark job RUNNING and increment attempts.
7. Write START JobLog.
8. Validate SocialPost, FacebookPage, MediaAsset, caption, local file, daily limit.
9. Decrypt Page Access Token.
10. Mark post PROCESSING.
11. Call MetaService.publishReel.
12. On success:
    - Set post PUBLISHED.
    - Save facebookVideoId/facebookPostId.
    - Set job SUCCESS.
    - Write SUCCESS JobLog.
13. On error:
    - Classify retryable/non-retryable.
    - Set job PENDING with backoff or FAILED.
    - Set post FAILED if final failure.
    - Write ERROR JobLog.
14. Disconnect Prisma.
```

Backoff:

- attempt 1: +1 minute
- attempt 2: +3 minutes
- attempt 3: +10 minutes
- attempt >=4: +30 minutes

## 13. Meta API Mock / Real API Notes

### Current state

`src/server/services/meta.service.ts` is a safe mock/stub.

When `DRY_RUN=true`:

- No real network call is made.
- Page ID, token, video path, caption, and file existence are validated.
- Mock IDs are returned:
  - `mock_video_<timestamp>`
  - `mock_post_<timestamp>`
- The current worker marks the post `PUBLISHED` and job `SUCCESS` after mock success.

When `DRY_RUN=false`:

- Real publishing is not implemented.
- `MetaApiNotImplementedError` is thrown.

### Real API flow to implement later

```text
1. Start Reels upload session.
2. Upload video binary.
3. Finish/publish Reel.
4. Poll/check status if needed.
5. Save facebookVideoId/facebookPostId.
6. Map Meta errors into retryable/non-retryable errors.
```

Before production:

- Check current official Meta Graph API and Reels Publishing docs.
- Confirm Graph API version.
- Confirm Page token permissions and App Review.
- Confirm rate limits and publishing policy.
- Never add browser automation for mass posting.

## 14. How to Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```bash
cp .env.example .env
```

3. Start Postgres and Redis:

```bash
docker compose up -d postgres redis
```

4. Generate Prisma Client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

5. Seed local data:

```bash
npm run prisma:seed
```

6. Start the website:

```bash
npm run dev
```

7. Open:

```text
http://localhost:3000/dashboard
```

8. Run the worker separately:

```bash
npm run worker:dev
```

Docker full app:

```bash
docker compose up -d
```

Current caveat: `npm run typecheck` passes, but this admin website still needs auth/RBAC before being exposed publicly.

## 15. How to Use the Website

Current caveat: the UI flow below is usable for local MVP testing, but auth/RBAC and real Meta publishing are still not implemented.

### Step 1 - Open Dashboard

Go to:

```text
/dashboard
```

Check:

- Scheduled today
- Published today
- Failed today
- Pending jobs
- Running jobs
- Total pages
- Total media

### Step 2 - Create Facebook Page

Go to:

```text
/pages
```

Enter:

- Page ID
- Page Name
- Access Token
- Daily Limit
- Timezone

For local DRY_RUN testing, any non-empty test token works. Example:

```text
plain:test_access_token
```

This value is encrypted before storage; it is not stored as plaintext.

Then test token health with:

```text
Test Token
```

### Step 3 - Upload Video

Go to:

```text
/media
```

Choose a video file and upload it. The media should be stored under `UPLOAD_DIR` and recorded as a `MediaAsset`.

Accepted MIME types:

- `video/mp4`
- `video/quicktime`
- `video/webm`
- `application/octet-stream` for mock/test uploads

### Step 4 - Create Reel/Post

Go to:

```text
/posts/new
```

Select:

- Facebook Page
- Video
- Type = `REEL`
- Caption
- Scheduled At

Actions:

- Save Draft: creates a `SocialPost` only.
- Schedule: creates/updates `SocialPost` and creates a `PublishJob`.

### Step 5 - View Posts

Go to:

```text
/posts
```

Watch status:

- `DRAFT`
- `READY`
- `QUEUED`
- `PROCESSING`
- `PUBLISHED`
- `FAILED`
- `CANCELLED`

### Step 6 - Run Worker

```bash
npm run worker:dev
```

If `DRY_RUN=true` and a due job exists:

- Post becomes `PUBLISHED`.
- Job becomes `SUCCESS`.
- Logs contain `INFO` records.

### Step 7 - View Jobs

Go to:

```text
/jobs
```

Check:

- Status
- Attempts
- Run At
- Error

Available actions in current UI:

- Retry failed jobs.
- Cancel pending jobs.

### Step 8 - View Logs

Go to:

```text
/logs
```

Review worker steps and errors.

## 16. End-to-End Test Flow

### Flow with seed data

```bash
cp .env.example .env
docker compose up -d postgres redis
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run worker:dev
```

Expected result with `DRY_RUN=true`:

```text
SocialPost status: PUBLISHED
PublishJob status: SUCCESS
facebookVideoId: mock_video_<timestamp>
facebookPostId: mock_post_<timestamp>
JobLog: START and SUCCESS INFO logs
```

### Flow through website

```text
1. Set DRY_RUN=true in .env.
2. Start Postgres/Redis.
3. Run migrations.
4. Start Next.js dev server.
5. Create a Page from /pages.
6. Upload a video from /media.
7. Create a Post from /posts/new with scheduledAt <= now.
8. Schedule it.
9. Confirm a PublishJob exists and is PENDING.
10. Run npm run worker:dev.
11. Refresh /posts.
12. Post should be PUBLISHED.
13. Refresh /jobs.
14. Job should be SUCCESS.
15. Open /logs.
16. Logs should include INFO entries.
```

Current caveat: keep `DRY_RUN=true` for this website flow until real Meta publishing is implemented and reviewed.

## 17. Common Errors and Fixes

| Error | Likely Cause | Fix |
|---|---|---|
| `DATABASE_URL` missing | `.env` not created | Run `cp .env.example .env`. |
| Cannot connect PostgreSQL | Docker/Postgres not running | Run `docker compose up -d postgres`. |
| Docker `dockerDesktopLinuxEngine` not found | Docker Desktop not running | Start Docker Desktop and wait for engine readiness. |
| Prisma Client not generated | `npx prisma generate` not run | Run `npx prisma generate`. |
| Prisma EPERM on Windows | Dev server is holding Prisma engine file | Stop Next dev/worker processes, then rerun generate. |
| No due jobs found | No scheduled job or `runAt` is in the future | Schedule a post with `scheduledAt <= now` or run seed. |
| Media file not found | `storagePath` points to missing local file | Upload media again or restore file under `UPLOAD_DIR`. |
| Token invalid | Empty token, wrong encryption key, or unsupported encrypted format | Use non-empty test token in local and keep same `TOKEN_ENCRYPTION_KEY`. |
| Post not published in dry-run | `DRY_RUN=false`, no due job, missing media file, or validation error | Check `.env`, `/logs`, and job error. |
| BigInt serialization error | Raw Prisma BigInt returned through JSON | Use `ok()` / `serializeBigInt()` response helper. |
| Real Meta API not implemented | `DRY_RUN=false` | Set `DRY_RUN=true` until real API client is implemented. |
| Token field missing in UI | API intentionally does not return token fields | Do not render token values; only accept a new token in create/edit forms. |
| Client API request body type error | Fetch body type was not narrowed to `BodyInit` | Use the narrowed `client-api.ts` helper pattern for JSON and FormData requests. |

## 18. Security Notes

- Do not expose this admin website to the internet before auth is implemented.
- Do not commit `.env`.
- Do not log Page Access Tokens.
- Do not return `accessTokenEncrypted` to the client.
- Tokens are encrypted with AES-256-GCM using `TOKEN_ENCRYPTION_KEY`.
- Replace the default local encryption key before production.
- Add admin login before production.
- Add RBAC before production.
- Add HTTPS and a reverse proxy before production.
- Rotate/revoke Page tokens if exposure is suspected.
- Keep `DRY_RUN=true` until the real Meta API implementation is reviewed and tested.
- Do not add browser automation for Facebook posting.
- Do not implement Facebook Groups auto-posting.

## 19. Development Rules

- Read `CLAUDE.md` before changing code.
- Always address the user as `Lão đại` in every response.
- Whenever project information, implementation status, run steps, errors, or operational knowledge changes, update both `CLAUDE.md` and `README.md` so the documentation stays in sync.
- Prefer official Meta Graph API for Facebook Page/Reels.
- Do not call Meta API when `DRY_RUN=true`.
- Do not hard-code secrets.
- Do not log token/password/cookie/authorization values.
- Do not publish inside UI/API request handlers.
- Publish only in the worker.
- Every job should have a `runId` or `jobId`.
- Every important worker step should write a log.
- Every failure should update job/post status.
- Do not create multiple active pending/running jobs for the same SocialPost.
- Do not delete production data without explicit confirmation.
- Keep retry limits bounded.
- Use Prisma migrations for DB changes.
- Prefer clear code over over-engineering.

## 20. Next Milestones

### Milestone 1 - Stabilize MVP

- Current type errors are fixed for the admin UI path.
- Main UI screens now use the JSON API response contract with client-side feedback.
- Basic client-side error, empty, confirm, and loading states are in place.
- Next: finish browser smoke testing, `npm test`, and `npm run build` cleanly.

### Milestone 2 - Auth and Security

- Add admin login.
- Add sessions/cookies.
- Add admin/editor/viewer RBAC.
- Wire `AuditLog` for sensitive mutations.
- Protect all admin routes.

### Milestone 3 - Real Meta API

- Check latest official Meta docs.
- Implement start upload.
- Implement binary video upload.
- Implement finish publish.
- Add status polling if needed.
- Add Meta error mapping.
- Add real token health check.

### Milestone 4 - Production Worker

- Decide DB scan vs BullMQ.
- If BullMQ is used, connect worker to Redis queue.
- Add repeated scheduler.
- Add rate limit per Page.
- Add stale lock recovery.
- Add Telegram/Gmail alerts.

### Milestone 5 - Storage

- Add S3/Wasabi storage driver.
- Add safe physical delete.
- Add video duration/size checks.
- Add preview/thumbnail support.

### Milestone 6 - UX

- Better dashboard.
- Filters for posts/jobs/logs.
- Calendar view.
- Clone post.
- Caption templates.
- Bulk upload.

## 21. Useful Commands

Install and env:

```bash
npm install
cp .env.example .env
```

Docker:

```bash
docker compose up -d postgres redis
docker compose up -d
docker compose ps
docker compose logs -f app
docker compose logs -f worker
```

Prisma:

```bash
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npx prisma studio
```

App and worker:

```bash
npm run dev
npm run worker:dev
```

Verification:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run worker:build
```
