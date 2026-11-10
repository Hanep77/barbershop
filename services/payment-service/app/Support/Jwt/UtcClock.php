<?php

namespace App\Support\Jwt;

use DateTimeImmutable;
use Psr\Clock\ClockInterface;

final class UtcClock implements ClockInterface
{
    public function now(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', new \DateTimeZone('UTC'));
    }
}
