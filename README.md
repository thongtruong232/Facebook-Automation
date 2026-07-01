# Facebook Page/Reels Automation Platform

Website noi bo de quan ly Facebook Pages, media, caption, lich dang, publish jobs, logs va worker publish Reels qua Meta Graph API. Skeleton hien tai uu tien an toan: `DRY_RUN=true`, token duoc ma hoa, Meta client dang la stub/mock va khong goi API that.

## Stack

- Node.js + TypeScript
- Next.js App Router
- PostgreSQL + Prisma
- Redis + BullMQ
- Worker Node.js rieng
- Local filesystem storage
- Docker Compose local

## Chay local

1. Cai dependencies:

```bash
npm install
```

2. Tao file env:

```bash
cp .env.example .env
```

3. Chay Postgres va Redis:

```bash
docker compose up -d postgres redis
```

4. Tao Prisma client va migration:

```bash
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

5. Chay Next.js dev server:

```bash
npm run dev
```

6. Chay worker:

```bash
npm run worker:dev
```

7. Mo UI:

```text
http://localhost:3000/dashboard
```

## Troubleshooting Windows/Docker

### Docker bao `dockerDesktopLinuxEngine` not found

Loi mau:

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

Nguyen nhan: Docker Desktop chua chay hoac Linux engine chua san sang. Cach sua:

1. Mo Docker Desktop tu Start Menu.
2. Doi den khi Docker bao engine da running.
3. Kiem tra lai:

```bash
docker version
docker compose up -d postgres redis
```

Neu Docker Desktop vua cap nhat hoac vua pull image lan dau, container co the `Exited (255)` do engine restart. Chay lai:

```bash
docker compose up -d postgres redis
docker ps
```

### Prisma generate bao EPERM rename query_engine

Loi nay thuong xay ra khi Next.js dev server dang giu Prisma engine file tren Windows. Cach sua:

1. Dung dev server dang chay o port 3000.
2. Chay lai:

```bash
npx prisma generate
```

## Luong test DRY_RUN

1. Them Facebook Page test tai `/pages`.
2. Upload video test tai `/media`.
3. Tao Reel tai `/posts/new`.
4. Chon `Schedule`.
5. Chay worker voi `DRY_RUN=true`.
6. Kiem tra `/jobs` va `/logs`.

Khi `DRY_RUN=true`, worker validate du lieu, khong goi Meta API that, tra ve `mock_video_<timestamp>` va `mock_post_<timestamp>`, sau do set post `PUBLISHED` va job `SUCCESS`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run worker:dev
npm run worker:build
npm run worker:start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
npm run lint
npm run typecheck
npm test
```

## Meta API status

`src/server/services/meta.service.ts` dang la stub an toan. Milestone tiep theo se thay stub bang Meta Graph API client that sau khi kiem tra lai docs chinh thuc cua Meta, permissions va Graph API version hien hanh.

## Bao mat

- Khong commit `.env`.
- Khong log Page Access Token.
- Page Access Token duoc luu bang AES-256-GCM.
- Frontend chi hien token masked.
- Meta API khong duoc goi tu client/browser.

## Cau truc chinh

```text
prisma/schema.prisma
src/app
src/server
src/workers/reels-publisher.worker.ts
src/lib
docs
uploads
```

## Milestone tiep theo

- Them auth login va role admin/editor/viewer.
- Them audit log cho mutation nguy hiem.
- Implement Meta Reels Publishing API that.
- Them alert Telegram/Gmail.
- Them test integration cho schedule/retry/cancel.
- Them rate limit theo Page va dashboard nang cao.
# Facebook-Automation
