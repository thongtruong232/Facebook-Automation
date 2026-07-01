# Deployment Skill

## Local Docker Compose

```bash
cp .env.example .env
docker compose up -d postgres redis
npx prisma migrate dev
npm run dev
npm run worker:dev
```

## Full compose

```bash
docker compose up --build
```

Services:

- `app`: Next.js admin.
- `worker`: Node worker.
- `postgres`: PostgreSQL 16.
- `redis`: Redis 7.

## Prisma migration

```bash
npx prisma generate
npx prisma migrate dev
```

Production nen dung:

```bash
npx prisma migrate deploy
```

## Backup database

```bash
pg_dump "$DATABASE_URL" > backup.sql
```

## Rollback co ban

1. Dung worker de tranh publish tiep.
2. Backup database hien tai.
3. Rollback image/app version.
4. Restore database neu migration khong tuong thich.
5. Bat lai worker voi `DRY_RUN=true` de smoke test.
