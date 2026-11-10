<?php

/**
 * BarberBrody monolith -> microservices data migration.
 *
 * Usage:
 *   php infrastructure/migration/migrate.php --dry-run
 *   php infrastructure/migration/migrate.php --apply
 *
 * Source and target connections are read from environment variables:
 *   SOURCE_DB_HOST, SOURCE_DB_PORT, SOURCE_DB_DATABASE, SOURCE_DB_USERNAME, SOURCE_DB_PASSWORD
 *   IDENTITY_DB_..., CATALOG_DB_..., BOOKING_DB_..., PAYMENT_DB_...
 *
 * The script is idempotent (upserts by primary key) and never writes to the
 * source database. Keep the monolith online until validate.php passes.
 */

declare(strict_types=1);

const CHUNK = 500;

function env(string $key, ?string $default = null): ?string
{
    $value = getenv($key);

    return $value === false || $value === '' ? $default : $value;
}

function connect(string $prefix): PDO
{
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        env($prefix.'_HOST', '127.0.0.1'),
        env($prefix.'_PORT', '3306'),
        env($prefix.'_DATABASE', ''),
    );

    $pdo = new PDO($dsn, env($prefix.'_USERNAME', 'root'), env($prefix.'_PASSWORD', ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

function source(): PDO
{
    return connect('SOURCE_DB');
}

function target(string $name): PDO
{
    return connect(strtoupper($name).'_DB');
}

function all(PDO $pdo, string $sql): array
{
    return $pdo->query($sql)->fetchAll();
}

function chunked(array $rows): Generator
{
    foreach (array_chunk($rows, CHUNK) as $chunk) {
        yield $chunk;
    }
}

/**
 * @param array<int, array<string, mixed>> $rows
 */
function upsert(PDO $pdo, string $table, array $rows, bool $apply): int
{
    if ($rows === []) {
        return 0;
    }

    foreach (chunked($rows) as $chunk) {
        if (! $apply) {
            continue;
        }

        $columns = array_keys($chunk[0]);
        $columnList = implode(', ', array_map(fn ($c) => "`{$c}`", $columns));
        $placeholders = implode(', ', array_map(fn ($c) => ":{$c}", $columns));
        $updates = implode(', ', array_map(fn ($c) => "`{$c}`=VALUES(`{$c}`)", $columns));

        $statement = $pdo->prepare(
            "INSERT INTO `{$table}` ({$columnList}) VALUES ({$placeholders})
             ON DUPLICATE KEY UPDATE {$updates}"
        );

        foreach ($chunk as $row) {
            $statement->execute($row);
        }
    }

    return count($rows);
}

function report(string $label, int $rows, bool $apply): void
{
    echo str_pad($label, 42).str_pad((string) $rows, 8, ' ', STR_PAD_LEFT).($apply ? ' written' : ' (dry-run)').PHP_EOL;
}

$apply = in_array('--apply', $argv, true);
$dryRun = in_array('--dry-run', $argv, true) || ! $apply;

if ($apply && $dryRun && in_array('--dry-run', $argv, true)) {
    fwrite(STDERR, "Choose either --dry-run or --apply.\n");
    exit(1);
}

echo 'Mode: '.($apply ? 'APPLY' : 'DRY-RUN').PHP_EOL;

$src = source();
$identity = target('identity');
$catalog = target('catalog');
$booking = target('booking');
$payment = target('payment');

// ---------------------------------------------------------------- identity
$users = all($src, 'SELECT id, name, role, email, email_verified_at, google_id, avatar, password, remember_token, created_at, updated_at FROM users');

$notifications = all($src, 'SELECT id, user_id, title, message, type, is_read, created_at, updated_at FROM notifications');

report('identity.users', upsert($identity, 'users', $users, $apply), $apply);
report('identity.notifications', upsert($identity, 'notifications', $notifications, $apply), $apply);

// ----------------------------------------------------------------- catalog
$barbershops = all($src, 'SELECT id, user_id, name, address, map_url, phone_number, description, is_active, latitude, longitude, rating, open_time, close_time, created_at, updated_at FROM barbershops');

$images = all($src, 'SELECT id, barbershop_id, image_url, is_primary, created_at, updated_at FROM barbershop_images');

$categories = all($src, 'SELECT id, name, barbershop_id, created_at, updated_at FROM service_categories');

$services = all($src, 'SELECT id, barbershop_id, name, description, category_id, price, duration_minutes, is_active, created_at, updated_at FROM services');

$capsters = all($src, 'SELECT id, barbershop_id, name, title, experience, rating, specialties, phone, is_available, bio, image, created_at, updated_at FROM capsters');

$ratings = all($src, 'SELECT r.id, r.user_id, u.name AS user_name, u.avatar AS user_avatar,
        r.barbershop_id, r.capster_id, r.booking_id, r.rating, r.comment, r.created_at, r.updated_at
    FROM ratings r
    LEFT JOIN users u ON u.id = r.user_id');

report('catalog.barbershops', upsert($catalog, 'barbershops', $barbershops, $apply), $apply);
report('catalog.barbershop_images', upsert($catalog, 'barbershop_images', $images, $apply), $apply);
report('catalog.service_categories', upsert($catalog, 'service_categories', $categories, $apply), $apply);
report('catalog.services', upsert($catalog, 'services', $services, $apply), $apply);
report('catalog.capsters', upsert($catalog, 'capsters', $capsters, $apply), $apply);
report('catalog.ratings', upsert($catalog, 'ratings', $ratings, $apply), $apply);

// ----------------------------------------------------------------- booking
$bookings = all($src, 'SELECT b.id, b.user_id, u.name AS user_name, u.email AS user_email,
        b.barbershop_id, bs.name AS barbershop_name, bs.user_id AS barbershop_owner_id,
        b.service_id, s.name AS service_name, s.price AS service_price, s.duration_minutes AS service_duration_minutes,
        b.capster_id, c.name AS capster_name,
        b.booking_date, b.booking_time, b.status,
        COALESCE(s.price, 0) AS total_price,
        COALESCE(b.refund_amount, 0) AS refund_amount,
        COALESCE(b.refund_status, "none") AS refund_status,
        b.cancellation_reason, NULL AS cancelled_by, b.created_at, b.updated_at
    FROM bookings b
    LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN barbershops bs ON bs.id = b.barbershop_id
    LEFT JOIN services s ON s.id = b.service_id
    LEFT JOIN capsters c ON c.id = b.capster_id');

report('booking.bookings', upsert($booking, 'bookings', $bookings, $apply), $apply);

// ----------------------------------------------------------------- payment
$payments = all($src, 'SELECT p.id, p.booking_id, b.user_id, b.barbershop_id, bs.user_id AS barbershop_owner_id,
        p.amount, p.status, p.payment_method, p.payment_url, p.transaction_id,
        p.xendit_payment_id, p.external_id, "none" AS refund_status, 0 AS refund_amount, NULL AS refund_id,
        p.created_at, p.updated_at
    FROM payments p
    LEFT JOIN bookings b ON b.id = p.booking_id
    LEFT JOIN barbershops bs ON bs.id = b.barbershop_id');

$withdrawals = all($src, 'SELECT w.id, w.barbershop_id, bs.user_id AS barbershop_owner_id,
        w.amount, w.status, w.bank_name, w.account_name, w.account_number, w.external_id,
        w.xendit_disbursement_id, w.xendit_status, w.failure_code, w.failure_reason,
        w.processed_at, w.webhook_payload, w.created_at, w.updated_at
    FROM withdrawals w
    LEFT JOIN barbershops bs ON bs.id = w.barbershop_id');

report('payment.payments', upsert($payment, 'payments', $payments, $apply), $apply);
report('payment.withdrawals', upsert($payment, 'withdrawals', $withdrawals, $apply), $apply);

$balances = all($src, 'SELECT id AS barbershop_id, balance, updated_at FROM barbershops');

if ($apply) {
    $payment->beginTransaction();
    try {
        foreach ($balances as $row) {
            $payment->prepare(
                'INSERT INTO ledger_entries
                    (barbershop_id, type, amount, reference_type, reference_id, idempotency_key, description, created_at, updated_at)
                 VALUES (?, "credit", ?, "opening_balance", ?, ?, "Opening balance migrated from monolith", NOW(), NOW())
                 ON DUPLICATE KEY UPDATE amount = VALUES(amount)'
            )->execute([
                $row['barbershop_id'],
                $row['balance'],
                $row['barbershop_id'],
                'opening:'.$row['barbershop_id'],
            ]);

            $payment->prepare(
                'INSERT INTO barbershop_balances (barbershop_id, balance, created_at, updated_at)
                 VALUES (?, ?, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE balance = VALUES(balance)'
            )->execute([$row['barbershop_id'], $row['balance']]);
        }

        $payment->commit();
    } catch (Throwable $e) {
        $payment->rollBack();
        throw $e;
    }
}

report('payment.ledger_entries (opening)', count($balances), $apply);

echo PHP_EOL.($apply ? 'Migration applied.' : 'Dry-run complete. Re-run with --apply.').PHP_EOL;
