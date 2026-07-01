# Logging And Monitoring Skill

## JobLog fields

- `job_id`
- `social_post_id`
- `level`
- `step`
- `message`
- `meta_json`
- `created_at`

## Levels

- `DEBUG`: chi tiet dev.
- `INFO`: trang thai binh thuong.
- `WARNING`: co loi tam thoi va job tiep tuc/retry.
- `ERROR`: mot job/item fail.
- `CRITICAL`: worker/app crash hoac anh huong production.

## Alert rules

Gui Telegram/Gmail khi:

- Token invalid/expired.
- Missing permission.
- Publish failed sau max retry.
- API 429 nhieu lan.
- Queue bi ket.
- Worker khong chay.
- Khong co job success trong 24h du co pending jobs.

## Message shape

```text
[Facebook Automation] Publish failed
Post: <post_id>
Page: <page_name>
Step: <step>
Error: <sanitized_error>
Attempts: <attempts>/<max_attempts>
Time: <timestamp>
```
