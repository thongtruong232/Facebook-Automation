# Security Skill

## Token storage

- Page Access Token phai ma hoa truoc khi luu database.
- Dung `TOKEN_ENCRYPTION_KEY` tu env/secret manager.
- Local dev co the dung placeholder, production bi chan neu placeholder chua doi.
- UI chi hien token masked.

## Logging

Khong log:

- access token
- app secret
- Authorization header
- cookie/session
- password
- token decrypted

Dung `sanitizeError` truoc khi luu raw response/error.

## Roles

- `ADMIN`: toan quyen.
- `EDITOR`: quan ly media/post, khong sua token/system settings.
- `VIEWER`: chi xem dashboard/log.

Auth va RBAC la milestone tiep theo.

## Secret rotation

Khi doi `TOKEN_ENCRYPTION_KEY`, can co migration/rotation script: decrypt bang key cu, encrypt bang key moi, audit log day du, backup database truoc khi chay.
