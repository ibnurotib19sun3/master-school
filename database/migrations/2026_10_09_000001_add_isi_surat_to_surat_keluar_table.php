<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            // Isi surat (HTML dari rich editor) — sebelumnya generator surat cuma
            // menyimpan metadata (nomor/perihal/tujuan), isi suratnya sendiri tidak
            // pernah tersimpan sama sekali sehingga tidak bisa dibuka/diedit lagi.
            $table->longText('isi_surat')->nullable()->after('keterangan');
            // Penerima surat yang diambil dari data PTK/Siswa (opsional) — polimorfik
            // sederhana karena guru/siswa/tatausaha ada di tabel terpisah.
            $table->string('penerima_tipe')->nullable()->after('isi_surat');
            $table->unsignedBigInteger('penerima_id')->nullable()->after('penerima_tipe');
            $table->string('template_kode')->nullable()->after('penerima_id');
        });
    }

    public function down(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->dropColumn(['isi_surat', 'penerima_tipe', 'penerima_id', 'template_kode']);
        });
    }
};
