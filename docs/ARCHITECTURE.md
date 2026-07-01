# Architecture

```text
Admin Website -> Database -> Job Queue -> Worker -> Meta API -> Logs/Alerts
```

## Components

- Admin Website: Next.js App Router, server-rendered pages, route handlers cho API noi bo.
- Database: PostgreSQL quan ly Page, media, posts, jobs, logs, audit va settings.
- ORM: Prisma schema voi enum ro rang cho post/job/media/page status.
- Queue: BullMQ + Redis da co integration point trong `src/server/queue.ts`.
- Worker: `src/workers/reels-publisher.worker.ts` scan job den han, lock, validate, publish stub va log.
- Meta API: `src/server/services/meta.service.ts` dang stub DRY_RUN, khong goi API that.

## Data flow

1. Admin tao Page, upload media, tao post.
2. Schedule post tao `publish_jobs` status `PENDING`.
3. Worker lock job thanh `RUNNING`.
4. Worker validate Page, token, media, caption, limit va idempotency.
5. Meta service publish hoac DRY_RUN.
6. Worker update post/job status va tao `job_logs`.

## Safety boundaries

- UI khong publish truc tiep.
- Token khong tra plaintext ve browser.
- Worker la noi duy nhat xu ly publish.
- Retry co gioi han va phan loai loi.
