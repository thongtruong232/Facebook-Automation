# Meta Graph API Skill

## Publish Reels flow

```text
1. Start upload session
2. Upload video binary
3. Finish publish
4. Poll/check status neu can
5. Save facebook_video_id/facebook_post_id
```

Endpoint logic can kiem tra lai truoc production:

```http
POST /{page_id}/video_reels?upload_phase=start
POST {upload_url}
POST /{page_id}/video_reels?upload_phase=finish
```

## Permissions

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `publish_video`

Permissions co the thay doi theo app mode, Page role, app review va Graph API version. Luon test bang Graph API Explorer truoc khi production.

## Rules

- Khong hard-code token.
- Khong log Authorization header, Page Access Token hoac app secret.
- `META_GRAPH_VERSION` lay tu `.env`.
- Mac dinh chay `DRY_RUN=true`.
- Neu docs hien hanh ap dung gioi han 30 API-published Reels trong rolling 24h/page, phai enforce trong worker.
- Kiem tra docs chinh thuc Meta truoc khi implement API client that.

## Current implementation

`src/server/services/meta.service.ts` la stub/mock. Khi `DRY_RUN=false`, service nem loi `META_CLIENT_STUB` de tranh goi API that ngoai y muon.
