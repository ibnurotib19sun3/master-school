<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BackupController extends Controller
{
    private string $dir;

    public function __construct()
    {
        $this->dir = storage_path('app/backups');
        if (! is_dir($this->dir)) {
            mkdir($this->dir, 0755, true);
        }
    }

    public function index()
    {
        $backups = collect(glob($this->dir . '/*.sql') ?: [])
            ->map(fn ($f) => [
                'name'    => basename($f),
                'size'    => filesize($f),
                'created' => filemtime($f),
            ])
            ->sortByDesc('created')
            ->values();

        return Inertia::render('Admin/Backup/Index', [
            'backups' => $backups,
        ]);
    }

    public function create()
    {
        $cfg  = config('database.connections.mysql');
        $db   = $cfg['database'];
        $user = $cfg['username'];
        $pass = $cfg['password'] ?? '';
        $host = $cfg['host'];
        $port = $cfg['port'] ?? '3306';

        $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
        $path     = $this->dir . DIRECTORY_SEPARATOR . $filename;

        // Coba mysqldump hanya jika exec benar-benar tersedia di hosting
        $mysqldumpOk = false;
        if ($this->execAvailable()) {
            $cnf = @tempnam(sys_get_temp_dir(), 'mysql_cnf_');
            if ($cnf !== false) {
                @file_put_contents($cnf, "[client]\npassword=" . $pass . "\n");
                @chmod($cnf, 0600);
                $cmd = sprintf(
                    'mysqldump --defaults-extra-file=%s -h %s -P %s -u %s %s > %s 2>&1',
                    escapeshellarg($cnf), escapeshellarg($host),
                    escapeshellarg($port), escapeshellarg($user),
                    escapeshellarg($db), escapeshellarg($path)
                );
                @exec($cmd, $out, $code);
                @unlink($cnf);
                $mysqldumpOk = (($code ?? -1) === 0 && file_exists($path) && filesize($path) >= 20);
            }
        }

        // Fallback PHP dump
        if (! $mysqldumpOk) {
            try {
                $this->phpDump($path);
            } catch (\Throwable $e) {
                return back()->withErrors(['backup' => 'Backup gagal: ' . $e->getMessage()]);
            }
        }

        if (! file_exists($path) || filesize($path) < 10) {
            return back()->withErrors(['backup' => 'Gagal membuat backup.']);
        }

        return back()->with('success', "Backup berhasil dibuat: {$filename}");
    }

    public function download(string $filename)
    {
        $path = $this->resolvedPath($filename);
        abort_if(! file_exists($path), 404);

        return response()->download($path);
    }

    public function restore(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:204800', // 200 MB
        ]);

        $sql = file_get_contents($request->file('file')->getRealPath());

        if (empty(trim($sql))) {
            return back()->withErrors(['file' => 'File SQL kosong atau tidak valid.']);
        }

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::unprepared($sql);
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        } catch (\Throwable $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            return back()->withErrors(['file' => 'Restore gagal: ' . $e->getMessage()]);
        }

        return back()->with('success', 'Database berhasil dipulihkan dari backup.');
    }

    public function destroy(string $filename)
    {
        $path = $this->resolvedPath($filename);
        abort_if(! file_exists($path), 404);

        unlink($path);
        return back()->with('success', "Backup '{$filename}' berhasil dihapus.");
    }

    // ── helpers ───────────────────────────────────────────────────

    private function execAvailable(): bool
    {
        if (! function_exists('exec')) return false;
        $disabled = array_map('trim', explode(',', (string) ini_get('disable_functions')));
        return ! in_array('exec', $disabled, true);
    }

    private function resolvedPath(string $filename): string
    {
        // Cegah directory traversal
        abort_if(str_contains($filename, '..') || str_contains($filename, '/'), 400);
        return $this->dir . DIRECTORY_SEPARATOR . $filename;
    }

    private function phpDump(string $path): void
    {
        @set_time_limit(300);

        $pdo = DB::connection()->getPdo();
        $db  = config('database.connections.mysql.database');

        $fh = @fopen($path, 'w');
        if (! $fh) return;

        fwrite($fh, "-- APIKMAS DJurnal PHP Backup\n");
        fwrite($fh, "-- Database: {$db}\n");
        fwrite($fh, "-- Generated: " . now()->toDateTimeString() . "\n\n");
        fwrite($fh, "SET FOREIGN_KEY_CHECKS=0;\n");
        fwrite($fh, "SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n\n");

        $tables = $pdo->query('SHOW TABLES')->fetchAll(\PDO::FETCH_COLUMN);

        foreach ($tables as $table) {
            fwrite($fh, "-- Table: `{$table}`\n");
            fwrite($fh, "DROP TABLE IF EXISTS `{$table}`;\n");
            $row = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(\PDO::FETCH_ASSOC);
            fwrite($fh, ($row['Create Table'] ?? '') . ";\n\n");

            // Fetch row-by-row to avoid memory exhaustion on large tables
            $stmt = $pdo->query("SELECT * FROM `{$table}`");
            while ($r = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                $vals = array_map(fn ($v) => $v === null ? 'NULL' : $pdo->quote((string) $v), $r);
                fwrite($fh, "INSERT INTO `{$table}` VALUES (" . implode(',', $vals) . ");\n");
            }
            fwrite($fh, "\n");
        }

        fwrite($fh, "SET FOREIGN_KEY_CHECKS=1;\n");
        fclose($fh);
    }
}
