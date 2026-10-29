<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Memastikan akun petugas yang memiliki penanda wajib_ganti_sandi
     * harus mengubah kata sandi sebelum dapat mengakses fitur lainnya (FR-AKN-05).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->wajib_ganti_sandi) {
            if (! $request->routeIs('auth.first-time-password*') && ! $request->routeIs('logout')) {
                return redirect()->route('auth.first-time-password');
            }
        }

        return $next($request);
    }
}
