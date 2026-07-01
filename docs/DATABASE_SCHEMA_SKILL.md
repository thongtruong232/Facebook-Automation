# Database Schema Skill

## Tables

- `users`: admin/editor/viewer.
- `facebook_pages`: Page ID, encrypted token, status, limit, timezone.
- `media_assets`: video metadata va local storage path.
- `social_posts`: caption, lich dang, status, facebook result IDs.
- `publish_jobs`: job lifecycle, lock, attempts, raw sanitized response.
- `job_logs`: log tung step theo job/post.
- `audit_logs`: thay doi quan trong cua user.
- `settings`: cau hinh key/value.

## Relations

- Mot FacebookPage co nhieu SocialPost.
- Mot MediaAsset co the duoc dung boi nhieu SocialPost.
- Mot SocialPost co nhieu PublishJob.
- Mot PublishJob co nhieu JobLog.
- JobLog co the gan voi SocialPost va PublishJob.

## Important indexes

- `social_posts(status, scheduled_at)`
- `social_posts(facebook_page_id, status)`
- `publish_jobs(status, run_at)`
- `publish_jobs(social_post_id, status)`
- `job_logs(job_id, created_at)`

## Enums

Prisma schema co cac enum bat buoc: `UserRole`, `PageStatus`, `MediaType`, `MediaStatus`, `SocialPostType`, `SocialPostStatus`, `PublishJobStatus`, `JobType`, `LogLevel`.
