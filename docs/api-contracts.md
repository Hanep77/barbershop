# BarberBrody Microservices — API Contracts

Version: 1.0 (target `feat/barberbrody-microservices`)

All public routes are exposed through Traefik. All `/internal/*` routes are
reachable only on the Docker `internal` network and require
`X-Internal-Token`.

## Authentication

- Access token: JWT RS256, 15 minutes (`JWT_ACCESS_TTL`).
- Refresh token: opaque, 7 days, rotated on every refresh.
- Claims: `sub` (user UUID), `role`, `name`, `email`, `avatar`, `iss`, `aud`, `jti`, `iat`, `exp`.
- Public API expects `Authorization: Bearer <access_token>`.
- `401` means the client must refresh or log in again.

## Identity Service

### Public

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | no | Register. Role is always forced to `customer`. |
| POST | `/api/login` | no | Email/password login. |
| POST | `/api/auth/refresh` | no | Rotate refresh token, issue new access token. Body: `refresh_token`. |
| POST | `/api/logout` | jwt | Revoke the refresh token. Body: `refresh_token` (optional if sent as cookie). |
| GET | `/api/me` | jwt | Current user. |
| GET | `/api/user` | jwt | Legacy alias of `/api/me`. |
| POST | `/api/user` | jwt | Legacy alias of `/api/me`. |
| GET | `/api/notifications` | jwt | `{data: Notification[]}` |
| GET | `/api/notifications/unread-count` | jwt | `{unread_count: int}` |
| POST | `/api/notifications/{id}/read` | jwt | Mark one as read. |
| POST | `/api/notifications/read-all` | jwt | Mark all as read. |
| POST | `/api/broadcasting/auth` | jwt | Pusher private-channel authorization. |
| GET | `/auth/google/redirect` | no | Returns Google authorization URL (JSON `{url}`). |
| GET | `/auth/google/callback` | no | Exchanges code, issues tokens, redirects to `FRONTEND_URL/auth/callback#access_token=...&refresh_token=...`. |

Login/register/refresh response:

```json
{
  "user": {"id":"uuid","name":"...","email":"...","role":"customer","avatar":null},
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

`GET /api/me` response: user object plus `barbershop` (null unless resolved
from Catalog via internal call; Identity never stores shops).

### Internal

| Method | Path | Description |
|---|---|---|
| GET | `/internal/users/{id}` | `{id,name,email,role,avatar}` or 404. |
| POST | `/internal/users/batch` | `{ids: []}` → `{users: {id: user}}`. |
| PATCH | `/internal/users/{id}/role` | `{role}` updates role and revokes refresh tokens. |

Identity consumes the domain events listed in
[`events.md`](events.md) and writes notifications + broadcasts them.

## Catalog Service

### Public / customer

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/barbershop?search=` | no | List shops with rating/count/min price/images. |
| POST | `/api/barbershop` | jwt | Create shop owned by current user; promotes role to `barbershop`. |
| GET | `/api/barbershop/{id}` | no | Shop detail with services, capsters, images, rating aggregates. |
| PUT | `/api/barbershop/{id}` | jwt | Owner only. |
| DELETE | `/api/barbershop/{id}` | jwt | Owner only. Soft delete; bookings keep snapshots. |
| GET | `/api/barbershop/{id}/images` | no | `{images: []}` |
| GET | `/api/barbershop/images` | jwt | Owner gallery. |
| POST | `/api/barbershop/images` | jwt | Multipart `image`. |
| PATCH | `/api/barbershop/images/{image}/set-primary` | jwt | Owner only. |
| DELETE | `/api/barbershop/images/{image}` | jwt | Owner only. |
| GET | `/api/barbershop/{id}/services` | no | Services with category. |
| GET | `/api/barbershop/{id}/service-categories` | no | Categories with services. |
| GET | `/api/barbershop/{id}/capsters` | no | `{capsters: []}` |
| GET | `/api/barbershop/{id}/ratings` | no | `{data: Rating[]}` with user/capster snapshots. |
| POST | `/api/ratings` | jwt | Validate completed booking through Booking Service. |
| PUT | `/api/ratings/{id}` | jwt | Author only. |
| DELETE | `/api/ratings/{id}` | jwt | Author only. |

### Partner

| Method | Path | Description |
|---|---|---|
| GET | `/api/partner/barbershop` | `{barbershop, user}`; `user` comes from JWT claims, never Identity DB. |
| PUT | `/api/partner/barbershop` | Owner only. |
| GET/POST/PUT/DELETE | `/api/partner/barbershop/services[/{id}]` | Resource routes; ownership enforced. |
| GET/POST/PUT/DELETE | `/api/partner/barbershop/service-categories[/{id}]` | Ownership enforced. |
| GET/POST/PUT/DELETE | `/api/partner/barbershop/capsters[/{id}]` | Ownership enforced; `update`/`destroy` implemented. |
| POST | `/api/partner/barbershop/capsters/{id}/toggle-status` | Ownership enforced. |
| PUT/DELETE | `/api/barbershop/services/{id}` | Legacy route kept for frontend compatibility. |

### Internal

| Method | Path | Description |
|---|---|---|
| GET | `/internal/barbershops/{id}` | Shop summary (`id,user_id,name,address,open_time,close_time,is_active`). |
| GET | `/internal/barbershops/by-owner/{userId}` | Owner's shop summary or 404. |
| POST | `/internal/barbershops/batch` | `{ids: []}` → `{barbershops: {id: summary}}`. |
| GET | `/internal/services/{id}` | `{id,barbershop_id,name,price,duration_minutes,is_active}`. |
| GET | `/internal/capsters/{id}` | `{id,barbershop_id,name,is_available}`. |
| POST | `/internal/catalog/validate-booking` | `{barbershop_id,service_id,capster_id}` → `{valid, barbershop, service, capster}`. One call used by Booking creation and slot lookup. |
| POST | `/internal/ratings/by-bookings` | `{booking_ids: []}` → `{ratings: {booking_id: rating}}`. |

## Booking Service

### Public / customer

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/barbershop/{id}/available-slots?date=&capster_id=&service_id=` | no | `{slots: ["H:i"]}`. Uses Catalog for hours/duration, local bookings for conflicts. |
| GET | `/api/bookings` | jwt | Current user's bookings with payment and rating enrichment. |
| POST | `/api/bookings` | jwt + role customer | Create booking with price/duration snapshots. |
| GET | `/api/bookings/{id}` | jwt | Owner or shop owner. Includes `payment` and `rating`. |
| POST | `/api/bookings/{id}/cancel` | jwt | Customer cancel; refund policy computed here, refund executed by Payment. |

### Partner

| Method | Path | Description |
|---|---|---|
| GET | `/api/partner/barbershop/bookings` | Bookings for owner's shop (shop resolved from Catalog). |
| PUT | `/api/partner/barbershop/bookings/{id}/status` | pending/confirmed/completed/cancelled. |
| POST | `/api/partner/barbershop/bookings/{id}/cancel` | 100% refund when paid. |
| GET | `/api/partner/barbershop/dashboard/stats` | Composed from Booking + Payment + Catalog. |
| GET | `/api/partner/barbershop/dashboard/today-appointments` | Booking snapshots. |
| GET | `/api/partner/barbershop/dashboard/recent-bookings` | Booking snapshots + price. |

### Internal

| Method | Path | Description |
|---|---|---|
| GET | `/internal/bookings/{id}` | Booking incl. snapshots and `barbershop_owner_id`. |
| POST | `/internal/bookings/{id}/validate-review` | `{user_id}` → `{valid,status,user_id,capster_id,barbershop_id}`. |
| GET | `/internal/bookings/by-barbershop/{barbershopId}/stats?from=&to=` | `{total_bookings,bookings_change,current_month,last_month}`. |
| GET | `/internal/bookings/by-barbershop/{barbershopId}/today` | Appointment rows. |
| GET | `/internal/bookings/by-barbershop/{barbershopId}/recent?limit=5` | Recent rows with price. |

Booking consumes `PaymentSucceeded`, `PaymentFailed`, `RefundSucceeded`,
`RefundFailed` and updates its projection idempotently.

## Payment Service

### Public

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create` | jwt | `{booking_id}`. Validates booking via Booking Service, creates Xendit invoice, returns `{payment_url}`. |
| GET | `/api/payments/{bookingId}` | jwt | Payment of the current user's booking. |
| GET | `/api/payments/detail/{id}` | jwt | Payment detail, owner only. |
| GET | `/api/partner/barbershop/withdrawals` | jwt | Owner withdrawal history. |
| POST | `/api/partner/barbershop/withdrawals` | jwt | Validate balance from ledger, create Xendit payout. |
| GET | `/api/partner/barbershop/balance` | jwt | `{balance,pending_withdrawal,available_balance}`. |
| POST | `/api/payments/webhook/xendit` | webhook token | Invoice webhook. Mandatory token validation. |
| POST | `/api/xendit/refund-webhook` | webhook token | Refund webhook. |
| POST | `/api/xendit/payout-webhook` | webhook token | Payout webhook. |

### Internal

| Method | Path | Description |
|---|---|---|
| GET | `/internal/payments/by-booking/{bookingId}` | Payment or 404. |
| POST | `/internal/payments/by-bookings` | `{booking_ids: []}` → `{payments: {booking_id: payment}}`. |
| POST | `/internal/payments/refund` | `{booking_id,amount,reason}`. Idempotent per booking. Returns `{refund_status,refund_amount}`. |
| GET | `/internal/payments/stats/{barbershopId}?from=&to=` | `{revenue,revenue_change,current_month,last_month}`. |
| GET | `/internal/balances/{barbershopId}` | `{balance,pending_withdrawal,available_balance}`. |

Payment publishes `PaymentSucceeded`, `PaymentFailed`, `RefundSucceeded`,
`RefundFailed`, `WithdrawalSucceeded`, `WithdrawalFailed`.

## Error format

All services return:

```json
{"message": "human readable", "errors": {"field": ["..."]}}
```

Validation: `422`. Unauthenticated: `401`. Forbidden/ownership: `403`.
Not found: `404`. Dependency unavailable: `503`.
