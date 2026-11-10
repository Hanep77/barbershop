# Known Limitations and Assumptions

## Verification gaps

1. **Docker images were not built on the development machine.** Docker Desktop
   is installed but WSL2 cannot start because hardware virtualization is
   disabled in the host firmware (`wsl --status`: "virtualization is not
   enabled on this machine"). Therefore `docker build`, container health and
   Traefik end-to-end routing were **not** executed here.
   - `docker compose config` (base and production overlay) was validated
     successfully with the Compose CLI.
   - Dockerfiles and gateway configuration must be built and smoke-tested on
     the target Debian host.
2. **No real credentials** for Xendit, Google OAuth or Pusher. All external
   integrations are covered by fakes; live behaviour is not claimed.
3. **PostgreSQL was not available during the original verification.**
   Per-service tests run on SQLite in-memory and an HTTP integration run used
   SQLite files. The booking lock now also handles PostgreSQL; run migrations
   against PostgreSQL on the database VM before cutover.
4. **Redis event transport was not exercised end-to-end** because Redis was not
   running locally. The outbox rows, consumer idempotency (with a mocked Redis
   facade), and producer payloads are tested; the actual `XADD`/`XREADGROUP`
   path must be smoke-tested with the Redis container.
5. **Data migration scripts** were not executed against real monolith data.
   They read from the monolith MySQL source and still hardcode a MySQL target
   DSN; adapt the target connection before importing into PostgreSQL. They are
   idempotent by design and include a validator.

## Architecture assumptions

- One PostgreSQL server with four databases and four least-privilege roles
  (`infrastructure/postgres/init.sh`).
- Redis Streams + transactional outbox is the event bus. Consumers run in
  dedicated worker containers with short polling loops (5-10 s).
- Payment is the only service that calls Xendit and the only owner of balances
  (`ledger_entries` + `barbershop_balances`). The opening balance is migrated
  from the monolith `barbershops.balance`; no historical transaction ledger
  exists before cutover.
- Booking owns price/duration/name snapshots. Catalog changes do not rewrite
  history.
- Booking read endpoints synchronously enrich with Payment and Catalog. If a
  dependency is down, `payment`/`rating` degrade to `null` and dashboard
  metrics degrade to `0`; writes that require validation return `503`.
- Barbershop deletion is a soft delete. Cross-database cascades do not exist;
  historical bookings remain readable.

## Functional limitations

- Real-time notifications need Pusher configuration. Without it, notifications
  are still fetched when the bell mounts.
- Google OAuth uses a hand-written authorization-code flow because the
  `laravel/socialite` dependency chain pulled a JWT package blocked by a
  security advisory.
- The legacy `transactions` table and `TransactionController` are not migrated;
  they were unrouted predecessors of bookings/payments.
- Rating editing keeps the author's original name/avatar snapshot; a later
  profile change does not update old reviews.
- Refund initiation is synchronous from Booking to Payment; if that call times
  out, Booking marks `refund_status=failed`, and a later
  `RefundSucceeded`/`RefundFailed` event corrects it. A refund webhook payload
  that omits the amount falls back to the payment amount.
- Withdrawal balance can become negative only if refunds are issued after a
  successful payout; the existing product rules do not prevent this.
- Catalog image storage is a single-host Docker volume. Horizontal scaling of
  catalog replicas is supported only on one Docker host; move to S3/MinIO for
  multi-host scaling.
- Traefik rate limiting is a static 60 req/min average with burst 120 per API
  router. Adjust in `infrastructure/gateway/dynamic/middleware.yaml`.
- TLS is configured only in the production overlay; the base compose uses HTTP
  for local demonstrations.
- Monitoring (Prometheus/Grafana/cAdvisor/Node Exporter) and k6 execution are
  left for the next phase. A k6 script and a `infrastructure/monitoring/`
  placeholder are provided.
- The frontend bundle is ~980 kB (285 kB gzip) and emits Vite's chunk-size
  warning. Code splitting is not part of this migration.
- `user.id` is a UUID; the frontend type was corrected from `number` to
  `string`. Any external client still assuming numeric IDs must be updated.
