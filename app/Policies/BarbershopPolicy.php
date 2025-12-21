<?php

namespace App\Policies;

use App\Models\Barbershop;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BarbershopPolicy
{
    public function update(User $user, Barbershop $barbershop): bool
    {
        return $user->id == $barbershop->user->id;
    }

    public function delete(User $user, Barbershop $barbershop): bool
    {
        return $user->id == $barbershop->user->id;
    }
}
