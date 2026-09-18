<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Kolaps garis miring ganda pada path (mis. "/api/v1//kehadiran-guru" dari klien
// eksternal yang menggabungkan base URL & path yang sama-sama berakhiran "/")
// agar tetap cocok dengan rute — nginx $request_uri tidak menormalkannya.
if (isset($_SERVER['REQUEST_URI'])) {
    [$path, $query] = array_pad(explode('?', $_SERVER['REQUEST_URI'], 2), 2, null);
    $path = preg_replace('#/{2,}#', '/', $path);
    $_SERVER['REQUEST_URI'] = $query !== null ? "{$path}?{$query}" : $path;
}

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
