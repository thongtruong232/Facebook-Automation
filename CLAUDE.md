# CLAUDE.md — Facebook Page/Reels Automation Platform

> Mục tiêu: xây dựng một website quản trị + worker tự động đăng Facebook Page/Reels bằng Meta Graph API. Website thay thế Google Sheet, dùng để quản lý Page, media/video, caption, lịch đăng, queue/job, log, retry, alert và token.

---

## 0. Vai trò của Claude trong project này

Bạn là **Senior Full-stack Automation Engineer**. Khi làm việc trong repo này, hãy ưu tiên:

1. Thiết kế hệ thống chạy thật, có log, retry, idempotency, alert.
2. Ưu tiên **Meta Graph API chính thức** cho Facebook Page/Reels.
3. Không dùng browser automation để tự động đăng hàng loạt lên Facebook.
4. Không hard-code token, cookie, password hoặc Page Access Token.
5. Mọi workflow có quyền ghi dữ liệu phải có `DRY_RUN`, log và rollback hoặc retry an toàn.
6. Không xây chức năng auto-post vào Facebook Groups bằng API vì Facebook Groups API đã bị loại bỏ khỏi Graph API từ 2024.
7. Khi API Meta thay đổi, phải kiểm tra lại docs chính thức trước khi sửa code.

---

## 1. Phạm vi project

### 1.1. Có trong scope

- Website admin để quản lý automation.
- Quản lý Facebook Pages.
- Quản lý Page Access Token dạng mã hóa.
- Upload và quản lý video/media.
- Tạo bài Reels/video post.
- Lên lịch đăng Page/Reels.
- Worker tự động publish Reels bằng Meta Graph API.
- Queue job: pending, running, success, failed, cancelled.
- Retry/backoff cho lỗi tạm thời.
- Dashboard thống kê.
- Log từng bước.
- Alert Telegram/Gmail khi lỗi.
- Docker Compose deploy.

### 1.2. Không nằm trong scope

- Auto-post vào Facebook Groups bằng API.
- Auto-post vào group bằng Playwright/Selenium/Puppeteer.
- Dùng cookie/session Facebook cá nhân để đăng tự động.
- Bypass checkpoint, CAPTCHA, anti-bot, rate limit hoặc access control.
- Spam nhiều group/page bằng nội dung trùng lặp.
- Lưu token ở client/browser localStorage.

---

## 2. Bối cảnh kỹ thuật Facebook/Meta

### 2.1. Page/Reels

Facebook Page/Reels có thể tự động hóa bằng **Meta Graph API** và **Facebook Reels Publishing API** nếu app có quyền hợp lệ và Page Access Token hợp lệ.

Luồng publish Reels cơ bản:

```text
1. Start upload session
2. Upload video binary
3. Finish/publish Reel
4. Poll/check status nếu cần
5. Save result vào database
```

Endpoint logic thường dùng:

```http
POST /{page_id}/video_reels?upload_phase=start
POST {upload_url}
POST /{page_id}/video_reels?upload_phase=finish
```

> Lưu ý: version Graph API phải cấu hình trong `.env`, không hard-code trong code. Trước khi triển khai production, kiểm tra docs Meta mới nhất.

### 2.2. Permissions cần kiểm tra

Các quyền thường liên quan:

```text
pages_show_list
pages_read_engagement
pages_manage_posts
publish_video
```

Tùy app mode, Page role, app review và thay đổi của Meta, permission có thể cần xác minh thêm. Luôn test bằng Graph API Explorer trước.

### 2.3. Facebook Groups

Không xây auto-post Group API. Groups API đã bị deprecate trong Graph API v19 và bị loại bỏ khỏi mọi version từ 22/04/2024.

Cách xử lý group nếu cần:

```text
- Dùng native scheduler trong Facebook Group nếu là admin/moderator.
- Dùng human-in-the-loop: website tạo nội dung, gửi nhắc admin copy/paste/schedule thủ công.
```

---

## 3. Kiến trúc tổng thể

```text
Admin Website
  ↓
Quản lý Page / Media / Caption / Lịch đăng / Trạng thái
  ↓
Database: PostgreSQL
  ↓
Job Queue: BullMQ + Redis
  ↓
Worker chạy nền
  ↓
Meta Graph API / Facebook Reels Publishing API
  ↓
Update status + save facebook_video_id/post_id
  ↓
Log + Retry + Alert
  ↓
Dashboard báo cáo
```

### 3.1. Nguyên tắc quan trọng

Website **không publish trực tiếp trong HTTP request** của admin. Website chỉ tạo/sửa dữ liệu và tạo job. Worker chạy nền xử lý job đến hạn.

Lý do:

- Upload video có thể lâu.
- API Meta có thể timeout.
- Cần retry/backoff.
- Cần chống đăng trùng.
- Cần log đầy đủ từng bước.
- Cần xử lý lỗi mà không làm treo UI.

---

## 4. Stack khuyến nghị

```text
Frontend/Admin: Next.js
Backend API: NestJS hoặc Express.js
Database: PostgreSQL
ORM: Prisma
Queue: BullMQ
Queue backend: Redis
Worker: Node.js
Storage video: Local trước, S3/Wasabi sau
Deploy: Docker Compose
Reverse proxy: Caddy hoặc Nginx
Alert: Telegram Bot hoặc Gmail/SMTP
```

### 4.1. Lý do chọn stack

| Thành phần | Lý do |
|---|---|
| Next.js | Làm dashboard nhanh, dễ triển khai |
| Node.js | Đồng bộ với worker và Meta API client |
| PostgreSQL | Quản lý job/log/trạng thái tốt |
| Prisma | Schema rõ, migration dễ |
| BullMQ + Redis | Queue/retry/backoff/rate limit tốt |
| Docker Compose | Phù hợp VPS/home server |

---

## 5. Cấu trúc repo đề xuất

```text
facebook-reels-automation/
├─ CLAUDE.md
├─ README.md
├─ package.json
├─ .env.example
├─ docker-compose.yml
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  └─ package.json
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ auth/
│  │  │  ├─ facebook-pages/
│  │  │  ├─ media/
│  │  │  ├─ social-posts/
│  │  │  ├─ publish-jobs/
│  │  │  ├─ logs/
│  │  │  ├─ alerts/
│  │  │  └─ meta/
│  │  └─ package.json
│  └─ worker/
│     ├─ src/
│     │  ├─ queues/
│     │  ├─ processors/
│     │  ├─ meta-client.ts
│     │  ├─ logger.ts
│     │  └─ main.ts
│     └─ package.json
├─ packages/
│  ├─ shared/
│  └─ config/
├─ uploads/
└─ logs/
```

Có thể bắt đầu bằng monolith đơn giản hơn:

```text
src/
├─ web/
├─ api/
├─ worker/
├─ db/
├─ services/
└─ lib/
```

---

## 6. Chức năng website admin

### 6.1. Dashboard

Route:

```text
/admin/dashboard
```

Hiển thị:

- Scheduled today
- Published today
- Failed today
- Queue pending
- Last successful publish
- Last failed publish
- Error by type
- Upcoming posts
- Recent failed jobs

### 6.2. Quản lý Facebook Pages

Route:

```text
/admin/pages
```

Chức năng:

- Thêm Page ID.
- Thêm tên Page.
- Lưu Page Access Token dạng encrypted.
- Test token.
- Bật/tắt Page.
- Cấu hình giới hạn đăng/ngày.
- Cấu hình timezone Page.
- Xem token health.

### 6.3. Quản lý media/video

Route:

```text
/admin/media
```

Chức năng:

- Upload video.
- Preview video.
- Lưu metadata.
- Kiểm tra MIME type.
- Kiểm tra dung lượng file.
- Kiểm tra duration nếu có thể.
- Gắn tag/chủ đề.
- Lưu storage path.

### 6.4. Quản lý Posts/Reels

Route:

```text
/admin/posts
```

Chức năng:

- Tạo Reel/video post.
- Chọn Page.
- Chọn video.
- Nhập caption.
- Chọn thời gian đăng.
- Save draft.
- Schedule.
- Cancel.
- Retry nếu failed.
- Clone bài.
- Preview bài.
- Xem log từng bài.

### 6.5. Quản lý Jobs

Route:

```text
/admin/jobs
```

Chức năng:

- Xem job pending/running/success/failed/cancelled.
- Retry job.
- Cancel job.
- Xem attempts.
- Xem raw response đã sanitize.
- Xem error code/message.

### 6.6. Logs

Route:

```text
/admin/logs
```

Chức năng:

- Filter theo job.
- Filter theo post.
- Filter theo level.
- Filter theo step.
- Tìm kiếm error.
- Export log nếu cần.

### 6.7. Settings

Route:

```text
/admin/settings
```

Cấu hình:

- Default timezone.
- Max posts per run.
- Max retry.
- Global DRY_RUN.
- Telegram alert.
- Storage driver.
- Default hashtags/caption suffix.

---

## 7. Database schema đề xuất

### 7.1. Tables chính

```text
users
facebook_pages
media_assets
social_posts
publish_jobs
job_logs
settings
audit_logs
```

### 7.2. users

```sql
id UUID PRIMARY KEY
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
role TEXT NOT NULL              -- admin/editor/viewer
status TEXT NOT NULL            -- active/disabled
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### 7.3. facebook_pages

```sql
id UUID PRIMARY KEY
page_id TEXT UNIQUE NOT NULL
name TEXT NOT NULL
access_token_encrypted TEXT NOT NULL
token_status TEXT NOT NULL      -- unknown/valid/invalid/expired
status TEXT NOT NULL            -- active/disabled
daily_limit INTEGER DEFAULT 30
timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh'
last_token_check_at TIMESTAMPTZ
last_error TEXT
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### 7.4. media_assets

```sql
id UUID PRIMARY KEY
type TEXT NOT NULL              -- video/image
filename TEXT NOT NULL
original_name TEXT
storage_disk TEXT NOT NULL      -- local/s3/wasabi
storage_path TEXT NOT NULL
public_url TEXT
mime_type TEXT
size_bytes BIGINT
duration_seconds INTEGER
status TEXT NOT NULL            -- ready/processing/failed/deleted
metadata_json JSONB
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### 7.5. social_posts

```sql
id UUID PRIMARY KEY
facebook_page_id UUID NOT NULL REFERENCES facebook_pages(id)
media_asset_id UUID REFERENCES media_assets(id)
type TEXT NOT NULL              -- reel/video/post
caption TEXT NOT NULL
scheduled_at TIMESTAMPTZ NOT NULL
status TEXT NOT NULL            -- draft/ready/queued/processing/published/failed/cancelled
attempts INTEGER DEFAULT 0
max_attempts INTEGER DEFAULT 3
facebook_video_id TEXT
facebook_post_id TEXT
last_error TEXT
published_at TIMESTAMPTZ
created_by UUID REFERENCES users(id)
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### 7.6. publish_jobs

```sql
id UUID PRIMARY KEY
social_post_id UUID NOT NULL REFERENCES social_posts(id)
job_type TEXT NOT NULL          -- publish_reel
status TEXT NOT NULL            -- pending/running/success/failed/cancelled
run_at TIMESTAMPTZ NOT NULL
started_at TIMESTAMPTZ
finished_at TIMESTAMPTZ
attempts INTEGER DEFAULT 0
max_attempts INTEGER DEFAULT 3
locked_at TIMESTAMPTZ
locked_by TEXT
error_code TEXT
error_message TEXT
raw_response_json JSONB
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### 7.7. job_logs

```sql
id UUID PRIMARY KEY
job_id UUID REFERENCES publish_jobs(id)
social_post_id UUID REFERENCES social_posts(id)
level TEXT NOT NULL             -- DEBUG/INFO/WARNING/ERROR/CRITICAL
step TEXT NOT NULL
message TEXT NOT NULL
meta_json JSONB
created_at TIMESTAMPTZ NOT NULL
```

### 7.8. audit_logs

```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
action TEXT NOT NULL
entity_type TEXT NOT NULL
entity_id TEXT
before_json JSONB
after_json JSONB
ip_address TEXT
user_agent TEXT
created_at TIMESTAMPTZ NOT NULL
```

---

## 8. Status lifecycle

### 8.1. social_posts.status

```text
draft
  ↓
ready
  ↓
queued
  ↓
processing
  ↓
published
```

Failure/cancel branches:

```text
processing -> failed
ready/queued -> cancelled
failed -> ready hoặc queued khi retry thủ công
```

### 8.2. publish_jobs.status

```text
pending
  ↓
running
  ↓
success
```

Failure/cancel branches:

```text
running -> failed
pending/running -> cancelled
failed -> pending khi retry
```

---

## 9. API nội bộ của website

### 9.1. Auth

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### 9.2. Facebook Pages

```http
GET    /api/facebook-pages
POST   /api/facebook-pages
GET    /api/facebook-pages/:id
PATCH  /api/facebook-pages/:id
DELETE /api/facebook-pages/:id
POST   /api/facebook-pages/:id/test-token
```

### 9.3. Media

```http
GET    /api/media
POST   /api/media/upload
GET    /api/media/:id
DELETE /api/media/:id
```

### 9.4. Posts/Reels

```http
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PATCH  /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/schedule
POST   /api/posts/:id/cancel
POST   /api/posts/:id/retry
```

### 9.5. Jobs

```http
GET    /api/jobs
GET    /api/jobs/:id
POST   /api/jobs/:id/retry
POST   /api/jobs/:id/cancel
```

### 9.6. Logs

```http
GET /api/logs
GET /api/posts/:id/logs
GET /api/jobs/:id/logs
```

---

## 10. Worker publish flow

### 10.1. Luồng chính

```text
1. Worker lấy job pending đến hạn: status=pending, run_at<=now
2. Lock job để tránh chạy trùng
3. Set publish_jobs.status=running
4. Set social_posts.status=processing
5. Load Page + token + media + post
6. Decrypt Page Access Token
7. Validate dữ liệu
8. Start Reels upload session
9. Upload video binary
10. Finish/publish Reel
11. Lưu facebook_video_id/facebook_post_id nếu API trả về
12. Set social_posts.status=published
13. Set publish_jobs.status=success
14. Ghi job_logs từng step
15. Gửi alert optional khi success hoặc failed
```

### 10.2. Validate trước khi publish

Kiểm tra:

```text
- Page đang active.
- Token không rỗng.
- Token decrypt được.
- Media tồn tại.
- File video tồn tại.
- MIME type hợp lệ.
- Caption không rỗng.
- scheduled_at <= now.
- Post chưa published.
- facebook_video_id chưa tồn tại hoặc trạng thái chưa published.
- Page chưa vượt daily_limit.
```

### 10.3. Idempotency

Không được đăng trùng nếu job chạy lại.

Rule:

```text
Nếu social_posts.status = published -> skip.
Nếu facebook_video_id đã có và post chưa failed rõ ràng -> kiểm tra trạng thái trước khi publish lại.
Mỗi social_post chỉ có một publish_jobs active.
Retry phải dùng cùng social_post_id.
```

---

## 11. Meta API client

### 11.1. Interface đề xuất

```ts
interface MetaReelsClient {
  testPageToken(pageId: string, pageAccessToken: string): Promise<TokenCheckResult>;
  startReelUpload(pageId: string, pageAccessToken: string): Promise<StartUploadResult>;
  uploadVideo(uploadUrl: string, pageAccessToken: string, filePath: string): Promise<UploadResult>;
  finishReelUpload(params: FinishReelParams): Promise<FinishUploadResult>;
  getVideoStatus(videoId: string, pageAccessToken: string): Promise<VideoStatusResult>;
}
```

### 11.2. Pseudo-code

```ts
async function publishReel(postId: string) {
  const post = await loadPostWithPageAndMedia(postId);

  assertPostCanPublish(post);

  const token = decrypt(post.facebookPage.accessTokenEncrypted);

  const start = await meta.startReelUpload(post.facebookPage.pageId, token);

  await saveFacebookVideoId(post.id, start.video_id);

  await meta.uploadVideo(start.upload_url, token, post.media.storagePath);

  const finish = await meta.finishReelUpload({
    pageId: post.facebookPage.pageId,
    token,
    videoId: start.video_id,
    caption: post.caption,
    videoState: 'PUBLISHED',
  });

  await markPostPublished(post.id, {
    facebookVideoId: start.video_id,
    facebookPostId: finish.post_id ?? null,
    rawResponse: sanitize(finish),
  });
}
```

---

## 12. Retry/backoff

### 12.1. Retry được

Retry với:

```text
408 Request Timeout
429 Rate Limit
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout
Network timeout
Temporary DNS/connect error
```

Backoff gợi ý:

```text
attempt 1: 1s
attempt 2: 3s
attempt 3: 10s
attempt 4: 30s
```

Nếu API trả `Retry-After`, ưu tiên giá trị đó.

### 12.2. Không retry mù

Không retry mù với:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
Validation error
Missing permission
Invalid token
Unsupported endpoint
```

Các lỗi này phải set failed và gửi alert.

---

## 13. Logging

### 13.1. Log schema

```json
{
  "timestamp": "2026-07-01T20:00:00+07:00",
  "level": "INFO",
  "job": "facebook_reels_publish",
  "run_id": "20260701-200000",
  "step": "finish_publish",
  "item_id": "social_post_uuid",
  "status": "success",
  "duration_ms": 532,
  "message": "Reel published"
}
```

### 13.2. Level

```text
DEBUG    Chi tiết dev
INFO     Trạng thái bình thường
WARNING  Có vấn đề nhưng job tiếp tục
ERROR    Một bước/item lỗi
CRITICAL Job fail hoặc ảnh hưởng production
```

### 13.3. Không log

Không log:

```text
- access token
- app secret
- Authorization header
- cookie/session
- password
- token decrypted
```

---

## 14. Alert

Gửi alert khi:

```text
- Token invalid/expired
- Missing permission
- Publish failed sau max retry
- API 429 nhiều lần
- Queue bị kẹt
- Worker không chạy
- Không có job success trong 24h dù có pending jobs
```

Alert message mẫu:

```text
[Facebook Automation] Publish failed
Post: <post_id>
Page: <page_name>
Step: upload_video
Error: <sanitized_error>
Attempts: 3/3
Time: 2026-07-01 20:00:00 +07
```

---

## 15. Bảo mật

### 15.1. Token storage

- Page Access Token phải mã hóa trước khi lưu database.
- Dùng `TOKEN_ENCRYPTION_KEY` từ env/secret manager.
- Không trả token đầy đủ về frontend.
- UI chỉ hiển thị token dạng masked: `EAAB...abcd`.

### 15.2. Environment variables

`.env.example`:

```env
APP_URL=https://automation.example.com
APP_ENV=production

DATABASE_URL=postgresql://app:password@postgres:5432/facebook_automation
REDIS_URL=redis://redis:6379

META_GRAPH_VERSION=vXX.X
META_APP_ID=
META_APP_SECRET=
TOKEN_ENCRYPTION_KEY=

STORAGE_DRIVER=local
UPLOAD_DIR=/app/uploads

DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
MAX_REELS_PER_PAGE_PER_DAY=30
MAX_POSTS_PER_RUN=1
MAX_RETRY=3
DRY_RUN=true

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### 15.3. Auth/role

Roles:

```text
admin   Toàn quyền
editor  Tạo/sửa media/post, không sửa token/system settings
viewer  Chỉ xem dashboard/log
```

### 15.4. Audit log

Ghi audit khi:

```text
- Login/logout
- Thêm/sửa/xóa Page
- Thay token
- Schedule/cancel/retry post
- Xóa media
- Đổi settings
```

---

## 16. UI yêu cầu

### 16.1. Sidebar

```text
Dashboard
Posts / Reels
Media Library
Facebook Pages
Jobs
Logs
Settings
Users
```

### 16.2. Posts table

Columns:

```text
Thumbnail
Caption preview
Page
Scheduled At
Status
Attempts
Published At
Actions
```

Actions:

```text
Edit
Preview
Schedule
Cancel
Retry
View logs
```

### 16.3. Create/Edit Post form

Fields:

```text
Page
Type: Reel / Video
Video
Caption
Scheduled time
Status
Hashtags
Internal note
```

Validation UI:

```text
- Caption required
- Video required với Reel
- Page required
- Scheduled time required
- Không cho schedule thời gian quá khứ trừ khi muốn publish ngay
```

---

## 17. Docker Compose đề xuất

```yaml
services:
  web:
    build: .
    command: npm run start:web
    env_file: .env
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"
    volumes:
      - uploads:/app/uploads

  worker:
    build: .
    command: npm run start:worker
    env_file: .env
    depends_on:
      - postgres
      - redis
    volumes:
      - uploads:/app/uploads

  scheduler:
    build: .
    command: npm run start:scheduler
    env_file: .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: facebook_automation
      POSTGRES_USER: app
      POSTGRES_PASSWORD: change_me
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
  uploads:
```

---

## 18. Scheduler/Queue

Có 2 cách:

### Cách A — BullMQ repeatable job

```text
Mỗi 1 phút:
- scan social_posts status=ready scheduled_at<=now
- tạo publish_jobs nếu chưa có
- push job vào BullMQ
```

### Cách B — systemd/cron gọi scheduler

```text
Mỗi 1-5 phút chạy:
npm run scheduler:due
```

Production nên ưu tiên BullMQ + Redis hoặc systemd timer có log rõ.

---

## 19. DRY_RUN

Khi `DRY_RUN=true`:

- Không gọi API publish thật.
- Vẫn validate dữ liệu.
- Vẫn ghi log.
- Vẫn cho biết job nào sẽ chạy.
- Không set `published`.
- Có thể set `dry_run_checked_at` hoặc ghi log `DRY_RUN_OK`.

---

## 20. Test plan

### 20.1. Unit tests

```text
- validate post
- validate media
- encrypt/decrypt token
- sanitize error response
- retry classifier
- idempotency guard
```

### 20.2. Integration tests

```text
- Create Page
- Upload media
- Create post draft
- Schedule post
- Generate publish_job
- Retry failed job
- Cancel job
- Dashboard count
```

### 20.3. Meta API manual test

```text
1. Test token bằng Graph API Explorer.
2. Test Page ID.
3. Test start upload session với video ngắn.
4. Test upload video.
5. Test finish publish.
6. Kiểm tra Reel trên Facebook Page.
```

### 20.4. Production smoke test

```text
- Login admin
- Add Page test
- Upload video 5-10s
- Schedule sau 5 phút
- Worker publish thành công
- Log không chứa token
- Dashboard cập nhật status
- Retry không đăng trùng
```

---

## 21. Lỗi thường gặp và cách xử lý

| Lỗi | Nguyên nhân thường gặp | Xử lý |
|---|---|---|
| 401 Unauthorized | Token sai/hết hạn | Test lại token, tạo token mới |
| 403 Forbidden | Thiếu permission/Page role | Kiểm tra quyền Page và App Review |
| 400 Bad Request | Payload sai | Log sanitized response, sửa params |
| 404 Unsupported endpoint | Sai Graph version/endpoint/page_id | Kiểm tra docs + Page ID |
| 429 Rate limit | Đăng quá nhanh/quá nhiều | Backoff, giảm concurrency, kiểm tra daily limit |
| Upload timeout | File lớn/mạng yếu | Tăng timeout, retry resumable nếu API hỗ trợ |
| Published nhưng UI không thấy ngay | Processing chậm | Poll status hoặc chờ xử lý |
| Duplicate publish | Worker chạy trùng | Lock job + idempotency guard |
| Token lộ trong log | Logging sai | Sanitize toàn bộ error/request |

---

## 22. Milestones triển khai

### Milestone 1 — Admin Website MVP

```text
- Login admin
- CRUD Facebook Page
- CRUD Media
- CRUD Posts/Reels
- Upload video local
- Prisma schema + migration
```

### Milestone 2 — Queue nội bộ

```text
- Tạo publish_jobs khi schedule bài
- Job status: pending/running/success/failed
- Retry thủ công từ dashboard
- Logs theo từng job
```

### Milestone 3 — Meta API Publisher

```text
- Test Page token
- Start Reels upload
- Upload video
- Finish publish
- Lưu facebook_video_id
- Chống đăng trùng
```

### Milestone 4 — Worker production

```text
- BullMQ worker
- Redis queue
- Retry/backoff
- Lock job
- Rate limit theo Page
- Alert Telegram
```

### Milestone 5 — Dashboard báo cáo

```text
- Published today
- Failed today
- Upcoming posts
- Error by type
- Job history
- Token health
```

### Milestone 6 — Hardening

```text
- Mã hóa token
- Role admin/editor/viewer
- Audit log
- Backup database
- Storage S3/Wasabi
- Deploy Docker Compose
- Uptime monitor
```

---

## 23. Acceptance criteria

Project được xem là chạy được khi:

```text
[ ] Admin login được.
[ ] Thêm Facebook Page được.
[ ] Token được lưu encrypted.
[ ] Test token không lộ token ra log/UI.
[ ] Upload video được.
[ ] Tạo Reel draft được.
[ ] Schedule Reel được.
[ ] Job pending được tạo đúng run_at.
[ ] Worker lấy job đến hạn.
[ ] Worker publish thành công 1 Reel test.
[ ] social_posts chuyển sang published.
[ ] publish_jobs chuyển sang success.
[ ] facebook_video_id được lưu.
[ ] Log từng bước có trong admin.
[ ] Retry failed job không đăng trùng.
[ ] DRY_RUN=true không gọi API thật.
[ ] 401/403 không retry mù.
[ ] 429/5xx có backoff.
[ ] Alert gửi khi job failed.
```

---

## 24. Quy tắc code bắt buộc

1. Không commit `.env`.
2. Không log access token.
3. Không lưu token plaintext.
4. Không gọi Meta API từ frontend.
5. Không publish trong request handler nếu upload video có thể lâu.
6. Mọi job phải có `run_id` hoặc `job_id`.
7. Mọi lỗi API phải sanitize trước khi lưu log.
8. Mọi retry phải có giới hạn.
9. Mọi action nguy hiểm phải ghi audit log.
10. Dùng migration cho thay đổi database.
11. Không ghi trực tiếp DB ngoài service/repository layer.
12. Trước khi thêm browser automation, phải chứng minh API chính thức không đáp ứng được.

---

## 25. Prompt mẫu để tiếp tục làm việc với Claude

### 25.1. Tạo database schema

```text
Dựa trên CLAUDE.md, hãy tạo Prisma schema hoàn chỉnh cho project Facebook Page/Reels Automation Platform. Yêu cầu có users, facebook_pages, media_assets, social_posts, publish_jobs, job_logs, audit_logs, settings. Có enum status rõ ràng, relation đúng, indexes cho scheduled_at/status/run_at.
```

### 25.2. Tạo API backend

```text
Dựa trên CLAUDE.md, hãy tạo backend API bằng NestJS/Express cho các module: auth, facebook-pages, media, social-posts, publish-jobs, logs. Yêu cầu có validation, error handling, không trả access token plaintext, có audit log.
```

### 25.3. Tạo worker

```text
Dựa trên CLAUDE.md, hãy tạo BullMQ worker publish Facebook Reels. Yêu cầu có lock job, idempotency, retry/backoff, DRY_RUN, log từng step, sanitize error, không log token, cập nhật status social_posts và publish_jobs.
```

### 25.4. Tạo Meta client

```text
Dựa trên CLAUDE.md và tài liệu chính thức của Meta, hãy tạo MetaReelsClient bằng TypeScript. Yêu cầu có testPageToken, startReelUpload, uploadVideo, finishReelUpload, getVideoStatus. Không hard-code Graph version, timeout rõ ràng, phân loại lỗi retryable/non-retryable.
```

### 25.5. Tạo UI admin

```text
Dựa trên CLAUDE.md, hãy tạo UI admin bằng Next.js cho Dashboard, Posts/Reels, Media Library, Facebook Pages, Jobs, Logs, Settings. Ưu tiên layout rõ ràng, form validation, status badge, action buttons: schedule/cancel/retry/view logs.
```

---

## 26. Nguồn tham khảo chính thức cần kiểm tra khi code

Luôn ưu tiên docs chính thức:

- Meta Graph API documentation: https://developers.facebook.com/docs/graph-api/
- Facebook Pages API: https://developers.facebook.com/docs/pages-api/
- Facebook Pages API - Manage Pages: https://developers.facebook.com/docs/pages-api/manage-pages/
- Facebook Pages API - Posts: https://developers.facebook.com/docs/pages-api/posts/
- Video API / Reels Publishing API: https://developers.facebook.com/docs/video-api/guides/reels-publishing/
- Graph API changelog: https://developers.facebook.com/docs/graph-api/changelog/
- Graph API v19 changelog / Groups API deprecation: https://developers.facebook.com/docs/graph-api/changelog/version19.0/
- Meta Platform Terms: https://developers.facebook.com/terms/
- Meta automated data collection terms/policies: https://developers.facebook.com/documentation/development/terms-and-policies/automated-data-collection/

---

## 27. Tóm tắt cuối

Hệ thống cần xây là:

```text
Admin Website + PostgreSQL + Redis Queue + Node Worker + Meta Graph API + Logs + Alerts
```

Mục tiêu kỹ thuật:

```text
- Quản lý Page/Reels tập trung.
- Lên lịch đăng tự động.
- Publish Reels bằng API chính thức.
- Không phụ thuộc Google Sheet.
- Có retry/backoff.
- Có idempotency chống đăng trùng.
- Có log và dashboard.
- Có bảo mật token.
- Không auto-post Facebook Groups.
```
