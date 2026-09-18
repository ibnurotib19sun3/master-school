<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * Resolve nilai per_page dari request untuk selector 25/50/75/100/Semua.
     */
    protected function resolvePerPage(Request $request, int $default = 25): int
    {
        $perPage = $request->input('per_page');

        if ($perPage === 'all') {
            return 9999;
        }

        return in_array((int) $perPage, [25, 50, 75, 100], true) ? (int) $perPage : $default;
    }
}
