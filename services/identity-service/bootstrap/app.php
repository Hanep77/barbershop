<?php

use App\Http\Middleware\InternalOnly;
use App\Http\Middleware\JwtAuthenticate;
use App\Http\Middleware\RequireRole;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('internal')
                ->prefix('internal')
                ->group(base_path('routes/internal.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->alias([
            'jwt' => JwtAuthenticate::class,
            'internal' => InternalOnly::class,
            'role' => RequireRole::class,
        ]);
        $middleware->redirectGuestsTo(function (Request $request) {
            return $request->is('api/*') ? null : '/login';
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (NotFoundHttpException $e, $request) {
            if ($request->expectsJson() && $e->getPrevious() instanceof ModelNotFoundException) {
                return response()->json(['message' => 'Resource not found'], Response::HTTP_NOT_FOUND);
            }
        });
    })->create();
