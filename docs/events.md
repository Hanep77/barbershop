# Domain Events

Transport: Redis Streams stream `barberbrody:events`.

Producer writes a row to `outbox_events` inside the business DB transaction.
`php artisan events:relay` pushes unrelayed rows with `XADD` and marks them
relayed. Consumers use consumer groups, acknowledge with `XACK`, track
`processed_events(event_id)` and send exhausted events to
`barberbrody:events:dlq`.

Every consumer handler must be idempotent. Event IDs are UUIDv7.

## Events

### `BarbershopCreated` — producer: catalog

```json
{"barbershop_id": "uuid", "user_id": "uuid"}
```

Consumer: identity → promotes the user to `barbershop` if still `customer`.
This is an asynchronous fallback for the synchronous internal role update.

### `BookingCreated` — producer: booking

```json
{
  "booking_id": 123,
  "user_id": "uuid",
  "user_name": "Budi",
  "barbershop_id": "uuid",
  "barbershop_owner_id": "uuid",
  "barbershop_name": "Shop",
  "service_name": "Haircut",
  "capster_name": "Andi",
  "booking_date": "2026-11-10",
  "booking_time": "14:00"
}
```

Consumer: identity → notification `booking_created` to shop owner.

### `BookingCancelled` — producer: booking

```json
{
  "booking_id": 123,
  "user_id": "uuid",
  "user_name": "Budi",
  "barbershop_id": "uuid",
  "barbershop_owner_id": "uuid",
  "barbershop_name": "Shop",
  "booking_date": "2026-11-10",
  "booking_time": "14:00",
  "cancelled_by": "customer|barbershop|system",
  "refund_amount": 50000
}
```

Consumer: identity → cancellation notifications to both parties.

### `BookingStatusChanged` — producer: booking

```json
{
  "booking_id": 123,
  "user_id": "uuid",
  "barbershop_owner_id": "uuid",
  "barbershop_name": "Shop",
  "service_name": "Haircut",
  "status": "confirmed|completed|cancelled"
}
```

Consumer: identity → status notification to customer; `completed` also
encourages a review.

### `ReviewCreated` — producer: catalog

```json
{
  "rating_id": 10,
  "barbershop_owner_id": "uuid",
  "barbershop_name": "Shop",
  "user_name": "Budi",
  "rating": 5,
  "comment": "..."
}
```

Consumer: identity → review notification to shop owner.

### `PaymentSucceeded` — producer: payment

```json
{
  "payment_id": "uuid",
  "booking_id": 123,
  "user_id": "uuid",
  "barbershop_id": "uuid",
  "barbershop_owner_id": "uuid",
  "amount": 50000
}
```

Consumers: booking → `status = confirmed` (only from pending);
identity → payment success notification.

### `PaymentFailed` — producer: payment

Same shape as `PaymentSucceeded` plus `"reason": "EXPIRED|FAILED"`.
Consumers: booking → `status = cancelled` (only from pending);
identity → payment failed notification.

### `RefundSucceeded` / `RefundFailed` — producer: payment

```json
{
  "payment_id": "uuid",
  "booking_id": 123,
  "amount": 50000,
  "refund_status": "success|failed"
}
```

Consumer: booking → update `refund_status`.

### `WithdrawalSucceeded` / `WithdrawalFailed` — producer: payment

```json
{
  "withdrawal_id": 7,
  "barbershop_owner_id": "uuid",
  "amount": 100000,
  "reason": "optional failure reason"
}
```

Consumer: identity → withdrawal notification to owner.
