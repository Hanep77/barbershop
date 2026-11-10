# Service Mapping (audit result)

Audited from the monolith at the repository root. This replaces the
"candidate" mapping in `plans/split_services.md`, which was partly inaccurate:
the application uses cookie/session auth (not tokens), several plan endpoints
did not exist, and some controllers mixed domains.

## Controller / model ownership

| Monolith file | Target | Notes |
|---|---|---|
| `UserController` | identity | Register/login/logout/me rewritten for JWT. Registration no longer accepts a role. |
| `SocialiteController` | identity | Replaced by a Guzzle-based Google OAuth flow (`GoogleAuthController`) because `laravel/socialite` pulls a JWT package blocked by a security advisory. |
| `NotificationController`, `NotificationService`, `NotificationSent`, `Notification` | identity | Notifications are now only written by Identity from consumed events. |
| `BarbershopController` | catalog | `balance` removed; `store` promotes role through Identity internal API. |
| `BarbershopImageController` | catalog | Local `public` disk + shared volume, served by Catalog Nginx. |
| `ServiceController`, `ServiceCategoryController` | catalog | Ownership checks added (previous IDOR on categories). |
| `CapsterController` | catalog | `update`/`destroy` were empty in the monolith; now implemented with ownership checks. |
| `RatingController` | catalog | Booking validation now via Booking internal API; user name/avatar snapshotted; publishes `ReviewCreated`. |
| `PartnerBarbershopController` | catalog + booking | Profile/services/capsters → catalog. Dashboard aggregation → booking. Withdrawals → payment. |
| `BookingController` | booking | Owns availability, creation, cancellation, status, snapshots. Refund is delegated to Payment. |
| `PaymentController` | payment | Owns Xendit, payments, refunds. Webhook no longer writes bookings or barbershop balance. |
| `WithdrawalController` | payment | Owns payouts and the ledger. Balance comes from `ledger_entries`. |
| `XenditService` | payment | Only Payment talks to Xendit. |
| `Transaction`, `TransactionController`, `transactions` table | not migrated | Legacy, unrouted predecessor of bookings/payments. Kept only in the monolith. |
| `AutoRevalidateBookings` | booking | Publishes events instead of writing notifications. |
| `RoleMiddleware`, policies | identity (claims) + catalog (ownership) | Policies that relied on cross-domain Eloquent relations were replaced by ownership checks. |

## Route ownership

| Route | Service |
|---|---|
| `/api/register`, `/api/login`, `/api/logout`, `/api/me`, `/api/user`, `/api/auth/*` | identity |
| `/auth/google/*` | identity |
| `/api/notifications*`, `/api/broadcasting/auth` | identity |
| `/api/barbershop` (collection, create), `/api/barbershop/{id}` and sub-resources except slots | catalog |
| `/api/barbershop/{id}/available-slots` | booking |
| `/api/barbershop/images*`, `/api/barbershop/services/{id}` | catalog |
| `/api/ratings*` | catalog |
| `/api/partner/barbershop` (profile) and services/categories/capsters | catalog |
| `/api/partner/barbershop/bookings*`, `/api/partner/barbershop/dashboard/*` | booking |
| `/api/partner/barbershop/withdrawals*`, `/api/partner/barbershop/balance` | payment |
| `/api/bookings*` | booking |
| `/api/payments*`, `/api/xendit/*` | payment |
| `/storage/*` | catalog |
| `/internal/*` | never exposed by Traefik |
| everything else (`/`) | frontend |

## Behaviour changes (intentional)

1. Authentication moved from Sanctum session cookies to JWT access tokens +
   rotating refresh tokens. The frontend was updated accordingly.
2. `POST /api/register` ignores the submitted role (`customer` only). The
   `barbershop` role is granted when the shop is created; the frontend rotates
   tokens after onboarding.
3. `GET /api/me` and `POST /api/logout` now exist (they were called by the
   frontend but missing in the monolith).
4. `balance` is no longer returned by Catalog. The withdrawals page uses
   `GET /api/partner/barbershop/balance` from Payment.
5. Barbershop deletion is a soft delete; bookings keep snapshots and are not
   cascaded across databases.
6. Payment webhook requires a configured webhook token. If the token is not
   configured the endpoint returns `503` instead of accepting unsigned
   callbacks. Webhook logs no longer contain raw payloads/tokens.
7. Payment detail is owner-only (previously any authenticated user could read
   any payment).
8. Category and capster mutations are ownership-checked.
9. Double-booking prevention adds a per-capster/date lock + overlap check in a
   transaction (the monolith performed no locking).
10. Notifications, payment status propagation and refund status propagation are
    asynchronous events. Small propagation delays are expected and consumers
    are idempotent.

## Security findings fixed

- Self-assigned `barbershop` role at registration.
- Optional Xendit webhook token (`if ($webhookToken && ...)`) and secret
  logging of callback payloads.
- Payment detail IDOR.
- Category/capster IDOR.
- Cross-service direct table access (removed by construction).
- Production `APP_DEBUG` default corrected in service `.env.example` files.
- Separate DB credentials per service (`infrastructure/mysql/init.sql`).

## Remaining assumptions / limitations

- No real Xendit/Google/Pusher credentials were available: integrations are
  covered by fakes in tests and are not claimed to be live-tested.
- Real-time notifications require Pusher configuration; without it the bell
  still fetches notifications on mount.
- UUIDv7 IDs are used for new rows; the identity/API type for `user.id` is a
  string (frontend type corrected).
- The legacy `transactions` table is intentionally not migrated.
