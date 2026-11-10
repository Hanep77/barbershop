<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('bookings:auto-revalidate')->everyMinute()->withoutOverlapping();
Schedule::command('events:relay')->everyFiveSeconds()->withoutOverlapping();
Schedule::command('events:consume booking')->everyFiveSeconds()->withoutOverlapping();
