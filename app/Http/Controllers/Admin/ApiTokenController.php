<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Sanctum\PersonalAccessToken;

class ApiTokenController extends Controller
{
    public function index()
    {
        $tokens = PersonalAccessToken::whereJsonContains('abilities', 'api:read')
            ->latest()
            ->get(['id', 'name', 'last_used_at', 'created_at']);

        return Inertia::render('Admin/ApiToken/Index', [
            'tokens' => $tokens,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $token = $request->user()->createToken($data['name'], ['api:read']);

        return back()->with([
            'success'     => "Token API \"{$data['name']}\" berhasil dibuat.",
            'plain_token' => $token->plainTextToken,
        ]);
    }

    public function destroy(PersonalAccessToken $token)
    {
        abort_unless(in_array('api:read', $token->abilities ?? []), 404);

        $token->delete();

        return back()->with('success', 'Token API berhasil dicabut.');
    }
}
