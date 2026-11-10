<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('events:relay')->everyFiveSeconds()->withoutOverlapping();
