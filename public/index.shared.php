<?php

/**
 * Versi index.php untuk SHARED HOSTING (cPanel).
 *
 * Cara pakai:
 *  1. Upload seluruh project ke folder di LUAR public_html,
 *     misal: /home/useranda/apikmas_app/
 *  2. Salin file ini ke public_html/index.php
 *  3. Salin public/.htaccess ke public_html/.htaccess
 *  4. Salin isi folder public/build/ ke public_html/build/
 *  5. Salin isi folder public/storage/ ke public_html/storage/
 *     (atau buat symlink: ln -s /home/useranda/apikmas_app/storage/app/public public_html/storage)
 *  6. Sesuaikan '../apikmas_app' di bawah dengan nama folder project Anda.
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Sesuaikan path ini → nama folder project di atas public_html
$appPath = __DIR__ . '/../apikmas_app';

if (file_exists($maintenance = $appPath . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $appPath . '/vendor/autoload.php';

/** @var Application $app */
$app = require_once $appPath . '/bootstrap/app.php';

$app->handleRequest(Request::capture());
