# Queue Worker Skill

## Job status

```text
PENDING -> RUNNING -> SUCCESS
PENDING/RUNNING -> CANCELLED
RUNNING -> FAILED
FAILED -> PENDING khi retry thu cong
```

## Worker steps

1. Load env va ket noi database.
2. Tim due jobs: `status=PENDING`, `runAt<=now`, `attempts<maxAttempts`.
3. Lock job bang update co dieu kien.
4. Load SocialPost + FacebookPage + MediaAsset.
5. Validate idempotency va du lieu publish.
6. Set post `PROCESSING`.
7. Goi Meta service.
8. Success: job `SUCCESS`, post `PUBLISHED` neu publish that.
9. DRY_RUN: job `SUCCESS`, post `READY`, log `dry_run_ok`.
10. Retryable error: job ve `PENDING`, backoff, post `QUEUED`.
11. Non-retryable error: job `FAILED`, post `FAILED`.

## Retryable

- HTTP 408, 429, 500, 502, 503, 504
- Network timeout
- Temporary DNS/connect error

## Non-retryable

- HTTP 400, 401, 403, 404
- Validation error
- Permission error
- Invalid token
- Unsupported endpoint

## Idempotency

- Neu post `PUBLISHED`, worker skip.
- Neu co `facebookVideoId`, khong publish lai mu.
- Moi post chi co mot active job `PENDING/RUNNING`.
- Retry dung lai cung `social_post_id`.
