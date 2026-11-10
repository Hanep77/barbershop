<?php

/**
 * Validates the migrated data. Exit code 1 when a check fails.
 *
 *   php infrastructure/migration/validate.php
 */

declare(strict_types=1);

function env(string $key, ?string $default = null): ?string
{
    $value = getenv($key);

    return $value === false || $value === '' ? $default : $value;
}

function connect(string $prefix): PDO
{
    return new PDO(
        sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            env($prefix.'_HOST', '127.0.0.1'),
            env($prefix.'_PORT', '3306'),
            env($prefix.'_DATABASE', ''),
        ),
        env($prefix.'_USERNAME', 'root'),
        env($prefix.'_PASSWORD', ''),
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC],
    );
}

function countOf(PDO $pdo, string $table): int
{
    return (int) $pdo->query("SELECT COUNT(*) AS c FROM `{$table}`")->fetch()['c'];
}

function ids(PDO $pdo, string $sql): array
{
    return array_map('strval', array_column($pdo->query($sql)->fetchAll(), 'id'));
}

function check(string $label, bool $ok, string $detail = ''): bool
{
    echo str_pad($label, 50).($ok ? 'OK' : 'FAIL').($detail !== '' ? '  '.$detail : '').PHP_EOL;

    return $ok;
}

$src = connect('SOURCE_DB');
$identity = connect('IDENTITY_DB');
$catalog = connect('CATALOG_DB');
$booking = connect('BOOKING_DB');
$payment = connect('PAYMENT_DB');

$ok = true;

$pairs = [
    ['users', $src, $identity],
    ['notifications', $src, $identity],
    ['barbershops', $src, $catalog],
    ['barbershop_images', $src, $catalog],
    ['service_categories', $src, $catalog],
    ['services', $src, $catalog],
    ['capsters', $src, $catalog],
    ['ratings', $src, $catalog],
    ['bookings', $src, $booking],
    ['payments', $src, $payment],
    ['withdrawals', $src, $payment],
];

foreach ($pairs as [$table, $sourceConn, $targetConn]) {
    $sourceCount = countOf($sourceConn, $table);
    $targetCount = countOf($targetConn, $table);
    $ok = check("row count {$table}", $sourceCount === $targetCount, "source={$sourceCount} target={$targetCount}") && $ok;
}

$identityUsers = array_flip(ids($identity, 'SELECT id FROM users'));
$catalogShops = array_flip(ids($catalog, 'SELECT id FROM barbershops'));
$catalogServices = array_flip(ids($catalog, 'SELECT id FROM services'));
$catalogCapsters = array_flip(ids($catalog, 'SELECT id FROM capsters'));
$bookingIds = array_flip(ids($booking, 'SELECT id FROM bookings'));

$orphanUsers = array_filter(ids($booking, 'SELECT DISTINCT user_id AS id FROM bookings'), fn ($id) => $id !== '' && ! isset($identityUsers[$id]));
$orphanShops = array_filter(ids($booking, 'SELECT DISTINCT barbershop_id AS id FROM bookings'), fn ($id) => $id !== '' && ! isset($catalogShops[$id]));
$orphanServices = array_filter(ids($booking, 'SELECT DISTINCT service_id AS id FROM bookings'), fn ($id) => $id !== '' && ! isset($catalogServices[$id]));
$orphanCapsters = array_filter(ids($booking, 'SELECT DISTINCT capster_id AS id FROM bookings'), fn ($id) => $id !== '' && ! isset($catalogCapsters[$id]));

$ok = check('booking -> identity user references', $orphanUsers === [], 'missing='.count($orphanUsers)) && $ok;
$ok = check('booking -> catalog barbershop references', $orphanShops === [], 'missing='.count($orphanShops)) && $ok;
$ok = check('booking -> catalog service references', $orphanServices === [], 'missing='.count($orphanServices)) && $ok;
$ok = check('booking -> catalog capster references', $orphanCapsters === [], 'missing='.count($orphanCapsters)) && $ok;

$orphanPayments = array_filter(ids($payment, 'SELECT DISTINCT booking_id AS id FROM payments'), fn ($id) => $id !== '' && ! isset($bookingIds[$id]));
$ok = check('payment -> booking references', $orphanPayments === [], 'missing='.count($orphanPayments)) && $ok;

$orphanRatings = array_filter(ids($catalog, 'SELECT DISTINCT booking_id AS id FROM ratings'), fn ($id) => $id !== '' && ! isset($bookingIds[$id]));
$ok = check('rating -> booking references', $orphanRatings === [], 'missing='.count($orphanRatings)) && $ok;

$ledger = $payment->query(
    'SELECT barbershop_id, SUM(CASE WHEN type = "credit" THEN amount ELSE -amount END) AS total
     FROM ledger_entries GROUP BY barbershop_id'
)->fetchAll();

$projection = $payment->query('SELECT barbershop_id, balance FROM barbershop_balances')->fetchAll();

$projectionMap = [];
foreach ($projection as $row) {
    $projectionMap[(string) $row['barbershop_id']] = (float) $row['balance'];
}

$ledgerMismatch = [];
foreach ($ledger as $row) {
    $shopId = (string) $row['barbershop_id'];
    if (! isset($projectionMap[$shopId]) || abs((float) $row['total'] - $projectionMap[$shopId]) > 0.01) {
        $ledgerMismatch[] = $shopId;
    }
}

$ok = check('ledger total equals projection', $ledgerMismatch === [], 'mismatch='.count($ledgerMismatch)) && $ok;

echo PHP_EOL.($ok ? 'VALIDATION PASSED' : 'VALIDATION FAILED').PHP_EOL;

exit($ok ? 0 : 1);
