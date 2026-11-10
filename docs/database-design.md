# Database Design and Data Migration

## Ownership

| Service | Database | Tables |
|---|---|---|
| identity | `identity_db` | users, password_reset_tokens, sessions, refresh_tokens, notifications, outbox_events, processed_events, cache, jobs, failed_jobs |
| catalog | `catalog_db` | barbershops, barbershop_images, service_categories, services, capsters, ratings, outbox_events |
| booking | `booking_db` | bookings, outbox_events, processed_events |
| payment | `payment_db` | payments, withdrawals, ledger_entries, barbershop_balances, outbox_events, processed_events |

Rules enforced:

- No foreign keys across databases.
- External IDs are plain indexed columns (`user_id`, `barbershop_id`,
  `service_id`, `capster_id`, `booking_id`).
- Catalog has no `balance`/bank columns; money is owned by Payment.
- Booking and Payment store snapshots needed to render history without
  synchronous reads.
- Every producer has an `outbox_events` table written in the same transaction
  as the business change.

## Monolith → target mapping

| Monolith table | Target | Transformation |
|---|---|---|
| `users` | identity.users | Copy all columns; `role` preserved. |
| `password_reset_tokens`, `sessions` | identity | Copy (sessions may be dropped on cutover). |
| `notifications` | identity.notifications | Copy; `user_id` stays UUID external. |
| `barbershops` | catalog.barbershops | Copy identity/profile columns; **drop** `balance`, `bank_name`, `account_name`, `account_number`; add `deleted_at`. |
| `barbershop_images` | catalog | Copy. |
| `service_categories` | catalog | Copy. |
| `services` | catalog | Copy. |
| `capsters` | catalog | Copy. |
| `ratings` | catalog.ratings | Copy plus `user_name`/`user_avatar` snapshot from `users` (join at migration time only); keep `booking_id` as external BIGINT. |
| `bookings` | booking.bookings | Copy IDs; add snapshots from joined `users`, `barbershops` (owner id/name), `services` (name/price/duration), `capsters` (name); `total_price = services.price` when no payment. Keep refund columns. |
| `payments` | payment.payments | Copy; add `user_id`, `barbershop_id`, `barbershop_owner_id` snapshots from `bookings`+`barbershops`; add `refund_status='none'`, `refund_amount=0`. `booking_id` remains BIGINT external, unique. |
| `transactions` | not migrated | Legacy/unrouted. |
| `withdrawals` | payment.withdrawals | Copy; add `barbershop_owner_id` from `barbershops.user_id`. |
| `barbershops.balance` | payment.ledger_entries | Opening entry `type=credit`, `reference_type='opening_balance'`, `idempotency_key='opening:{barbershop_id}'`; projection row updated. |
| `cache`, `jobs`, `failed_jobs` | identity only | Runtime tables; recreated empty. |

Session/cache/job data is not migrated.

## Migration procedure

1. Take a consistent snapshot/backup of the monolith database. Do not delete
   any monolith tables.
2. Provision the four databases and users with
   `infrastructure/postgres/init.sh`.
3. Run each service's migrations (`php artisan migrate --force`).
4. Set source and target connection env vars and run:
   ```bash
   php infrastructure/migration/migrate.php --dry-run
   php infrastructure/migration/migrate.php --apply
   ```
5. Validate:
   ```bash
   php infrastructure/migration/validate.php
   ```
   The validator compares row counts, referential integrity of external IDs and
   the ledger balance against the monolith `barbershops.balance`.
6. Switch the application env to the new services. Keep the monolith running
   read-only until validation is accepted.

The migration is idempotent: it upserts by primary key, and the opening ledger
entry uses a fixed idempotency key. It never updates or deletes monolith rows.

## Rollback

- Stop the microservices.
- Drop/recreate only the four new databases (`DROP DATABASE ...`), or truncate
  the migrated tables.
- Point the deployment back to the monolith environment.
- The monolith data was never modified, so no reverse data migration is needed.

## Cutover limitations

- Bookings created in the monolith after the extract but before cutover must be
  re-extracted (the script is idempotent).
- Sessions are not migrated; users log in again.
- Payment balance is reconstructed from `barbershops.balance`; no historical
  ledger exists before the cutover.
