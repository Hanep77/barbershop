<?php

namespace App\Support\Outbox;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Transactional outbox row. Written in the same DB transaction as the
 * state change, then relayed to Redis Streams by events:relay.
 */
class OutboxEvent extends Model
{
    use HasUuids;

    protected $table = 'outbox_events';

    protected $guarded = ['id'];

    protected $casts = [
        'payload' => 'array',
        'occurred_at' => 'datetime',
        'relayed_at' => 'datetime',
    ];

    public $incrementing = false;

    protected $keyType = 'string';
}
