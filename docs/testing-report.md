# Testing Report

All commands below were executed locally. Anything that could not be executed
is listed as not run, not as passed.

## Environment

| Item | Value |
|---|---|
| OS | Windows |
| PHP | 8.5.12 CLI locally; images use `php:8.4-fpm-alpine` (locked dependencies require >= 8.4.1) |
| Composer | 2.10.3 |
| Node / npm | 24.20.0 / 11.19.0 |
| Databases in tests | SQLite in-memory (unit/feature), SQLite files (HTTP integration) |
| Redis in tests | mocked (`Redis::shouldReceive`) for the identity consumer; no real Redis |
| External APIs | `Http::fake()` for Xendit, Google and internal service calls |

## Automated test results

| Service | Command | Result |
|---|---|---|
| identity | `php artisan test` | **11 passed** (41 assertions) |
| catalog | `php artisan test` | **27 passed** (204 assertions) |
| booking | `php artisan test` | **43 passed** (194 assertions) |
| payment | `php artisan test` | **26 passed** (90 assertions) |
| total backend | | **107 passed** |
| frontend build | `npm run build` | succeeded (Vite 6.3.5; chunk-size warning only) |
| compose config (base) | `docker compose -f infrastructure/docker/compose.yaml config` | succeeded |
| compose config (production) | `... -f compose.production.yaml config` with `ACME_EMAIL` | succeeded |
| YAML syntax | `python -c "yaml.safe_load(...)"` for Traefik static/dynamic files | succeeded |

## HTTP integration run (real local servers, no Docker)

Four `php artisan serve --env=integration` instances were started on
`127.0.0.1:8011-8014` with SQLite files and the test JWT key pair. The
following flow was executed over real HTTP:

1. Register owner through Identity (role forced to `customer`).
2. Create a barbershop through Catalog; Identity role promoted to
   `barbershop` through the internal API.
3. Refresh the owner token; new access token carries the `barbershop` role.
4. Create service category, service and capster through Catalog partner routes.
5. Register a customer; query available slots through Booking (Catalog
   validation called live).
6. Create a booking; snapshots persisted; list bookings.
7. Mark the booking `completed` as the shop owner.
8. Submit a rating through Catalog; Booking validation called live; rating
   created with the author snapshot.
9. Read booking list again; rating enrichment present.
10. Read partner dashboard stats (Booking + Payment + Catalog composition).
11. Public barbershop list/detail with computed rating aggregates.
12. Create a second booking; cancel it (refund `0/none` because unpaid).
13. Payment balance endpoint returns ledger summary.

Additional negative checks:

| Check | Result |
|---|---|
| Duplicate booking for the same capster/date/time | `422 This time slot is already booked.` |
| Another customer reads someone else's booking | `403` |
| Customer calls a partner service update | `403` |
| `/api/me` without a token | `401` |
| `/internal/*` without the internal token | `403` |
| Payment webhook without a configured token | `503` |
| Payment create without a Xendit key | `502` (expected; no outbound success claimed) |

Outbox inspection after the flow: `BookingCreated` x2, `BookingCancelled` x1,
`BookingStatusChanged` x2 in `booking_db`, `ReviewCreated` x1 in `catalog_db`.
Notification consumption was verified separately with a mocked Redis facade
(two tests: create once, ignore duplicate event).

## Covered behaviours by suite

- Identity: registration role hardening, login, JWT `/api/me`, refresh rotation
  + reuse rejection, logout revocation, notification ownership, internal-token
  protection, internal role promotion, event consumer idempotency.
- Catalog: public endpoints, shop creation + role promotion, ownership on
  services/categories/capsters, rating validation through Booking, internal
  validation/batch/stats, internal token.
- Booking: authz, snapshot creation, availability, overlap/double-booking,
  refund policy, cancel/status events, enrichment degradation, internal API,
  payment/refund event handlers, no-show command.
- Payment: mandatory webhook token, PAID idempotency, single ledger credit,
  failed payment event, payment creation authorization, internal refund
  idempotency/claiming, withdrawal balance rules, payout webhook idempotency,
  balance projection.

## Not run / not verifiable here

- **Docker image builds, container health and Traefik routing.** Docker
  Desktop's WSL2 backend cannot start because virtualization is disabled in
  the host firmware. Compose config parses correctly, but images were not
  built. Re-run on the target Debian VM:
  ```bash
  docker compose -f infrastructure/docker/compose.yaml build
  docker compose -f infrastructure/docker/compose.yaml up -d
  bash infrastructure/scripts/smoke-test.sh
  ```
- **Redis Streams transport** (`XADD`/`XREADGROUP`/`XACK`): consumer logic is
  tested with a mocked Redis facade; real transport must be smoke-tested with
  the `redis` container.
- **Real Xendit invoice/refund/payout calls**: no credentials.
- **Google OAuth and Pusher realtime**: no credentials; flows faked, and the
  Google redirect returns `503` when unconfigured.
- **PostgreSQL migrations and the data migration scripts**: no PostgreSQL
  server; run `php artisan migrate --force` per service and
  `php infrastructure/migration/migrate.php --apply` followed by
  `validate.php` on the database VM. The migration scripts still use a MySQL
  target DSN and need adapting for PostgreSQL.
- **k6 load test**: script provided but not executed.
