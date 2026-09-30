<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Jurusan;
use App\Models\MataPelajaran;
use App\Models\Pembelajaran;
use App\Models\PengaturanSekolah;
use App\Models\Rombel;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

/**
 * Migrasi jadwal: menyisipkan "Jam Literasi" di JP1 setiap hari (JP2 khusus Senin,
 * karena JP1 Senin sudah dipakai untuk kegiatan lain/upacara), menggeser pelajaran
 * yang sudah ada turun satu slot. Dijalankan per rombel, idempotent per rombel+hari
 * (aman dijalankan bertahap / diulang tanpa menggeser dua kali).
 *
 * Rombel gabungan jurusan (mis. X-TI berisi RPL + TKJ) punya jadwal yang kadang
 * digabung (1 mapel untuk semua siswa, jurusan_id null) dan kadang dipisah per
 * jurusan (2 mapel paralel di jam yang sama, masing-masing jurusan_id terisi).
 * Jam Literasi mengikuti pola itu: satu pengampu untuk hari yang gabungan, atau
 * satu pengampu per jurusan untuk hari yang dipisah — ditentukan dari struktur
 * jadwal JP pertama (non-literasi) di hari itu, bukan dipaksa satu pola untuk semua.
 */
class JadwalLiterasiController extends Controller
{
    private const KODE_LITERASI = 'LITERASI';

    private function literasiMapel(): MataPelajaran
    {
        return MataPelajaran::firstOrCreate(
            ['kode' => self::KODE_LITERASI],
            [
                'nama'      => 'Literasi',
                'jenjang'   => 'SMK',
                'kkm'       => 75,
                'deskripsi' => 'Jam literasi rutin sebelum pembelajaran dimulai.',
            ]
        );
    }

    public function index()
    {
        $tahunAktif = TahunAjaran::aktif();
        $literasi   = $this->literasiMapel();
        $pengaturan = PengaturanSekolah::current();
        $hariAktif  = $pengaturan->hari_aktif ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        $jurusanMap = Jurusan::pluck('nama', 'id');

        $rombelList = Rombel::where('is_aktif', true)
            ->when($tahunAktif, fn ($q) => $q->where('tahun_ajaran_id', $tahunAktif->id))
            ->orderBy('nama')
            ->get()
            ->map(function ($r) use ($literasi, $tahunAktif, $hariAktif, $jurusanMap) {
                $pembLiterasiList = Pembelajaran::where('rombel_id', $r->id)
                    ->where('mata_pelajaran_id', $literasi->id)
                    ->when($tahunAktif, fn ($q) => $q->where('tahun_ajaran_id', $tahunAktif->id))
                    ->get();

                $jadwalList = Jadwal::whereIn('pembelajaran_id', $pembLiterasiList->pluck('id'))->get();

                // Data tersimpan saat ini, per hari → daftar {jurusan_id, jurusan_nama, guru_id}.
                // Selalu array walau gabungan (1 elemen, jurusan_id null) supaya seragam dengan saran.
                $guruPerHari = [];
                foreach ($jadwalList as $jadwal) {
                    $pemb = $pembLiterasiList->firstWhere('id', $jadwal->pembelajaran_id);
                    if (!$pemb) {
                        continue;
                    }
                    $guruPerHari[$jadwal->hari][] = [
                        'jurusan_id'   => $pemb->jurusan_id,
                        'jurusan_nama' => $pemb->jurusan_id ? ($jurusanMap[$pemb->jurusan_id] ?? null) : null,
                        'guru_id'      => $pemb->guru_id,
                    ];
                }

                // Saran otomatis untuk tombol "Tarik Data Jadwal": guru yang mengajar JP
                // PERTAMA (bukan literasi) di rombel ini pada tiap hari — dicari lewat jam_ke
                // TERKECIL di antara jadwal non-literasi. Kalau di jam_ke terkecil itu ada
                // lebih dari satu baris (jurusan_id berbeda-beda), berarti hari itu dipisah
                // per jurusan, jadi saran juga berupa satu guru per jurusan. Otomatis benar
                // baik untuk hari yang belum dimigrasi (JP pertama masih di posisi asli)
                // maupun yang sudah (JP pertama sudah tergeser 1 slot oleh literasi).
                $jadwalNonLiterasi = Jadwal::where('is_aktif', true)
                    ->whereIn('hari', $hariAktif)
                    ->whereHas('pembelajaran', fn ($q) => $q->where('rombel_id', $r->id)
                        ->where('mata_pelajaran_id', '!=', $literasi->id)
                        ->when($tahunAktif, fn ($qq) => $qq->where('tahun_ajaran_id', $tahunAktif->id)))
                    ->with('pembelajaran:id,guru_id,jurusan_id')
                    ->orderBy('jam_ke')
                    ->get()
                    ->groupBy('hari');

                $saranPerHari = [];
                foreach ($jadwalNonLiterasi as $hari => $list) {
                    $jamKeTerkecil = $list->min('jam_ke');
                    $items = [];
                    $seenJurusan = [];
                    foreach ($list->where('jam_ke', $jamKeTerkecil) as $jadwal) {
                        $jurusanId = $jadwal->pembelajaran?->jurusan_id;
                        $key = $jurusanId ?? 'null';
                        if (in_array($key, $seenJurusan, true) || !$jadwal->pembelajaran?->guru_id) {
                            continue;
                        }
                        $seenJurusan[] = $key;
                        $items[] = [
                            'jurusan_id'   => $jurusanId,
                            'jurusan_nama' => $jurusanId ? ($jurusanMap[$jurusanId] ?? null) : null,
                            'guru_id'      => $jadwal->pembelajaran->guru_id,
                        ];
                    }
                    $saranPerHari[$hari] = $items;
                }

                return [
                    'id'             => $r->id,
                    'nama'           => $r->nama,
                    'guru_per_hari'  => $guruPerHari,
                    'saran_per_hari' => $saranPerHari,
                    'hari_migrasi'   => $jadwalList->pluck('hari')->unique()->values()->all(),
                ];
            });

        $guruList = Guru::with('user')->where('is_aktif', true)->orderBy('id')->get()
            ->map(fn ($g) => ['id' => $g->id, 'nama' => $g->nama_lengkap]);

        return Inertia::render('Admin/Jadwal/Literasi', [
            'rombelList'         => $rombelList,
            'guruList'           => $guruList,
            'tahunAktif'         => $tahunAktif,
            'hariAktif'          => $hariAktif,
            'jumlahJp'           => $pengaturan->jumlah_jp,
            'literasiIsiJurnal'  => (bool) $pengaturan->literasi_isi_jurnal,
        ]);
    }

    /**
     * Toggle global: apakah Jam Literasi ikut mengisi jurnal mengajar guru.
     * Langsung disinkronkan ke semua baris Pembelajaran Literasi yang sudah ada,
     * dan dipakai sebagai nilai default untuk pengampu literasi yang baru dibuat.
     */
    public function toggleIsiJurnal(Request $request)
    {
        $data = $request->validate(['isi_jurnal' => 'required|boolean']);

        $literasi   = $this->literasiMapel();
        $pengaturan = PengaturanSekolah::current();
        $pengaturan->update(['literasi_isi_jurnal' => $data['isi_jurnal']]);

        Pembelajaran::where('mata_pelajaran_id', $literasi->id)
            ->update(['isi_jurnal' => $data['isi_jurnal']]);

        return back()->with('success', $data['isi_jurnal']
            ? 'Jam Literasi sekarang ikut mengisi jurnal mengajar.'
            : 'Jam Literasi sekarang tidak mengisi jurnal mengajar.');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'assignments'                              => 'required|array|min:1',
            'assignments.*.rombel_id'                  => 'required|exists:rombel,id',
            'assignments.*.guru_per_hari'               => 'required|array|min:1',
            'assignments.*.guru_per_hari.*'             => 'array',
            'assignments.*.guru_per_hari.*.*.jurusan_id' => 'nullable|exists:jurusan,id',
            'assignments.*.guru_per_hari.*.*.guru_id'    => 'nullable|exists:guru,id',
        ]);

        $validator->after(function ($validator) use ($request) {
            // Satu guru tidak bisa jadi pengampu literasi di lebih dari 1 rombel
            // (atau lebih dari 1 jurusan) pada hari yang sama (jam literasi
            // berlangsung bersamaan di semua rombel/jurusan).
            $guruPerHariGlobal = [];
            foreach ($request->input('assignments', []) as $item) {
                foreach (($item['guru_per_hari'] ?? []) as $hari => $entries) {
                    foreach ((array) $entries as $entry) {
                        $guruId = $entry['guru_id'] ?? null;
                        if (!$guruId) {
                            continue;
                        }
                        $guruPerHariGlobal[$hari][] = $guruId;
                    }
                }
            }
            foreach ($guruPerHariGlobal as $hari => $guruIds) {
                if (count($guruIds) !== count(array_unique($guruIds))) {
                    $validator->errors()->add('assignments', "Ada guru yang dijadwalkan literasi di lebih dari 1 rombel pada hari {$hari} secara bersamaan.");
                }
            }
        });

        $data = $validator->validate();

        $tahunAktif = TahunAjaran::aktif();
        abort_if(!$tahunAktif, 422, 'Tahun ajaran aktif belum diatur.');

        $literasi   = $this->literasiMapel();
        $pengaturan = PengaturanSekolah::current();
        $hariAktif  = $pengaturan->hari_aktif ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

        $totalDigeser  = 0;
        $totalDitambah = 0;
        $totalDihapus  = 0;

        DB::transaction(function () use ($data, $tahunAktif, $literasi, $pengaturan, $hariAktif, &$totalDigeser, &$totalDitambah, &$totalDihapus) {
            // Tambah 1 slot JP baru hanya sekali (saat migrasi literasi pertama kali
            // dijalankan) — supaya pelajaran yang tergeser ke slot terakhir tetap
            // punya jam yang valid, tidak terpotong.
            $sudahPernahMigrasi = Pembelajaran::where('mata_pelajaran_id', $literasi->id)->exists();
            if (!$sudahPernahMigrasi) {
                $pengaturan->update(['jumlah_jp' => $pengaturan->jumlah_jp + 1]);
            }
            $slots = collect($pengaturan->fresh()->getJamSlots())->keyBy('jam_ke');

            foreach ($data['assignments'] as $item) {
                $rombelId = $item['rombel_id'];

                foreach ($item['guru_per_hari'] as $hari => $entries) {
                    if (!in_array($hari, $hariAktif, true)) {
                        continue;
                    }

                    $entries = array_values(array_filter((array) $entries, fn ($e) => !empty($e['guru_id'])));
                    if (empty($entries)) {
                        continue;
                    }

                    // Pembelajaran literasi rombel ini untuk hari ini — bisa lebih dari
                    // satu baris kalau dipisah per jurusan.
                    $literasiPembMap = Pembelajaran::where('rombel_id', $rombelId)
                        ->where('mata_pelajaran_id', $literasi->id)
                        ->where('tahun_ajaran_id', $tahunAktif->id)
                        ->get()
                        ->keyBy('id');

                    $existingJadwalByJurusan = Jadwal::whereIn('pembelajaran_id', $literasiPembMap->keys())
                        ->where('hari', $hari)
                        ->get()
                        ->keyBy(fn ($j) => $literasiPembMap[$j->pembelajaran_id]->jurusan_id ?? 'null');

                    if ($existingJadwalByJurusan->isNotEmpty()) {
                        // Slot literasi hari ini sudah ada — pakai jam_ke yang sama,
                        // tidak perlu geser jadwal lagi.
                        $insertAt = $existingJadwalByJurusan->first()->jam_ke;
                    } else {
                        $insertAt = $hari === 'Senin' ? 2 : 1;

                        // Geser turun 1 slot semua jadwal rombel ini (selain literasi) mulai dari $insertAt.
                        // Urut DESC agar slot tertinggi diproses lebih dulu.
                        $pembIdsLain = Pembelajaran::where('rombel_id', $rombelId)
                            ->where('tahun_ajaran_id', $tahunAktif->id)
                            ->where('mata_pelajaran_id', '!=', $literasi->id)
                            ->pluck('id');

                        $existingLain = Jadwal::whereIn('pembelajaran_id', $pembIdsLain)
                            ->where('hari', $hari)
                            ->where('jam_ke', '>=', $insertAt)
                            ->orderByDesc('jam_ke')
                            ->get();

                        foreach ($existingLain as $jadwal) {
                            $newJamKe = $jadwal->jam_ke + 1;
                            $slot     = $slots[$newJamKe] ?? null;
                            $jadwal->update([
                                'jam_ke'      => $newJamKe,
                                'jam_mulai'   => $slot['jam_mulai'] ?? $jadwal->jam_mulai,
                                'jam_selesai' => $slot['jam_selesai'] ?? $jadwal->jam_selesai,
                            ]);
                            $totalDigeser++;
                        }
                    }

                    $slotBaru  = $slots[$insertAt] ?? null;
                    $seenKeys  = [];

                    foreach ($entries as $entry) {
                        $jurusanId = $entry['jurusan_id'] ?? null;
                        $guruId    = $entry['guru_id'];
                        $key       = $jurusanId ?? 'null';
                        $seenKeys[] = $key;

                        $pembelajaran = Pembelajaran::firstOrCreate(
                            [
                                'rombel_id'         => $rombelId,
                                'mata_pelajaran_id' => $literasi->id,
                                'tahun_ajaran_id'   => $tahunAktif->id,
                                'jurusan_id'        => $jurusanId,
                                'guru_id'           => $guruId,
                            ],
                            ['jam_per_minggu' => 1, 'is_aktif' => true, 'isi_jurnal' => $pengaturan->literasi_isi_jurnal]
                        );

                        if ($existingJadwalByJurusan->has($key)) {
                            $jadwalRow = $existingJadwalByJurusan[$key];
                            if ($jadwalRow->pembelajaran_id !== $pembelajaran->id) {
                                $jadwalRow->update(['pembelajaran_id' => $pembelajaran->id]);
                            }
                        } else {
                            Jadwal::create([
                                'pembelajaran_id' => $pembelajaran->id,
                                'hari'            => $hari,
                                'jam_ke'          => $insertAt,
                                'jam_mulai'       => $slotBaru['jam_mulai'] ?? '00:00',
                                'jam_selesai'     => $slotBaru['jam_selesai'] ?? '00:00',
                                'is_aktif'        => true,
                            ]);
                            $totalDitambah++;
                        }
                    }

                    // Hapus slot jurusan yang tidak lagi dipilih (mis. hari ini berubah
                    // dari dipisah-per-jurusan menjadi gabungan, atau sebaliknya).
                    foreach ($existingJadwalByJurusan as $key => $jadwalRow) {
                        if (!in_array($key, $seenKeys, true)) {
                            $jadwalRow->delete();
                            $totalDihapus++;
                        }
                    }
                }
            }

            // Bersihkan Pembelajaran literasi yang tidak lagi punya jadwal
            // (mis. karena pengampu di hari itu diganti ke guru lain, atau jurusan
            // yang sebelumnya dipisah sekarang digabung).
            Pembelajaran::where('mata_pelajaran_id', $literasi->id)
                ->where('tahun_ajaran_id', $tahunAktif->id)
                ->doesntHave('jadwal')
                ->delete();

            // Sinkronkan jam_per_minggu literasi dengan jumlah hari yang benar-benar diampu.
            Pembelajaran::where('mata_pelajaran_id', $literasi->id)
                ->where('tahun_ajaran_id', $tahunAktif->id)
                ->withCount('jadwal')
                ->get()
                ->each(fn ($p) => $p->update(['jam_per_minggu' => $p->jadwal_count]));
        });

        return back()->with('success', "Jam Literasi diterapkan: {$totalDitambah} slot ditambahkan, {$totalDigeser} jadwal digeser, {$totalDihapus} slot dihapus.");
    }
}
