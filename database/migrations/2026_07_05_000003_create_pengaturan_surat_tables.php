<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaturan_surat', function (Blueprint $table) {
            $table->id();
            $table->string('nama_instansi')->nullable();
            $table->string('sub_nama')->nullable();
            $table->text('alamat_kop')->nullable();
            $table->string('telepon_kop')->nullable();
            $table->string('website_kop')->nullable();
            $table->string('email_kop')->nullable();
            $table->string('npsn_kop')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('separator', 5)->default('/');
            $table->json('format_bagian')->nullable();
            $table->string('prefix_kode', 20)->nullable();
            $table->timestamps();
        });

        Schema::create('kode_departemen', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100);
            $table->string('kode', 20);
            $table->boolean('aktif')->default(true);
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });

        Schema::create('kode_jenis_surat', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100);
            $table->string('kode', 20);
            $table->boolean('aktif')->default(true);
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });

        // Default: pengaturan_surat
        DB::table('pengaturan_surat')->insert([
            'separator'     => '/',
            'format_bagian' => json_encode(['seq', 'kode_jenis', 'kode_dept', 'bulan_romawi', 'tahun']),
            'prefix_kode'   => null,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // Default: kode_departemen
        DB::table('kode_departemen')->insert([
            ['nama' => 'Kurikulum',                  'kode' => 'KUR',  'urutan' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Kesiswaan',                  'kode' => 'KSW',  'urutan' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Humas',                      'kode' => 'HUM',  'urutan' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Sarpras',                    'kode' => 'SAR',  'urutan' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Tata Usaha',                 'kode' => 'TU',   'urutan' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Kepala Sekolah',              'kode' => 'KS',   'urutan' => 6, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Tim Penjamin Mutu Sekolah',  'kode' => 'TPMS', 'urutan' => 7, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Default: kode_jenis_surat
        DB::table('kode_jenis_surat')->insert([
            ['nama' => 'Surat Keputusan',     'kode' => 'SK',  'urutan' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Surat Permohonan',    'kode' => 'PER', 'urutan' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Surat Undangan',      'kode' => 'Und', 'urutan' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Surat Keterangan',    'kode' => 'Ket', 'urutan' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Surat Pemberitahuan', 'kode' => 'Pbt', 'urutan' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Surat Tugas',         'kode' => 'Tgs', 'urutan' => 6, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Surat Rekomendasi',   'kode' => 'Rek', 'urutan' => 7, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Surat Edaran',        'kode' => 'SE',  'urutan' => 8, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('kode_jenis_surat');
        Schema::dropIfExists('kode_departemen');
        Schema::dropIfExists('pengaturan_surat');
    }
};
