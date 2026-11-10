# Data migration scripts

Run after the four service databases are provisioned and migrated.

## Environment

Set connection variables for the monolith and each target database:

```bash
export SOURCE_DB_HOST=127.0.0.1 SOURCE_DB_PORT=3306 SOURCE_DB_DATABASE=nephair
export SOURCE_DB_USERNAME=root SOURCE_DB_PASSWORD=...
export IDENTITY_DB_HOST=10.10.10.11 IDENTITY_DB_DATABASE=identity_db IDENTITY_DB_USERNAME=identity_user IDENTITY_DB_PASSWORD=...
export CATALOG_DB_HOST=10.10.10.11  CATALOG_DB_DATABASE=catalog_db   CATALOG_DB_USERNAME=catalog_user   CATALOG_DB_PASSWORD=...
export BOOKING_DB_HOST=10.10.10.11  BOOKING_DB_DATABASE=booking_db   BOOKING_DB_USERNAME=booking_user   BOOKING_DB_PASSWORD=...
export PAYMENT_DB_HOST=10.10.10.11  PAYMENT_DB_DATABASE=payment_db   PAYMENT_DB_USERNAME=payment_user   PAYMENT_DB_PASSWORD=...
```

Defaults: host `127.0.0.1`, port `3306`, user `root`, empty password.

## Run

```bash
php infrastructure/migration/migrate.php --dry-run   # row counts only
php infrastructure/migration/migrate.php --apply     # writes targets only
php infrastructure/migration/validate.php            # exit 1 on mismatch
```

Order matters and is handled internally: identity → catalog → booking →
payment. Payments/withdrawals are enriched with user/shop/owner snapshots from
the monolith at extraction time. Opening balances become ledger entries.

## Rollback

Drop or truncate only the new databases, then point the deployment back to the
monolith. The scripts never modify the source database.

See `docs/database-design.md` for the full mapping and validation criteria.
