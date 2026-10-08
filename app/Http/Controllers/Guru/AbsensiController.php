<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\AbsensiPiket;
use App\Models\Jadwal;
use App\Models\JurnalMengajar;
use App\Models\Pembelajaran;
use App\Models\PengaturanSekolah;
use App\Models\PengaturanSurat;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AbsensiController extends Controller
{
    private function guruId(): ?int
    {
        return request()->user()->guru?->id;
    }

    private function isAdmin(): bool
    {
        return request()->user()->hasAnyRole(['super_admin', 'kepala_sekolah']);
    }

    private function hariIndonesia(): string
    {
        $map = [0 => 'Ahad', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu'];
        return $map[now()->dayOfWeek] ?? 'Senin';
    }

    public function index()
    {
        $guruId  = $this->guruId();
        $isAdmin = $this->isAdmin();
        $today   = today()->toDateString();
        $hariIni = $this->hariIndonesia();

        // Semua jadwal hari ini, urut jam_mulai
        $jadwalHariIni = Jadwal::with([
            'pembelajaran.mataPelajaran',
            'pembelajaran.rombel',
        ])
        ->where('hari', $hariIni)
        ->where('is_aktif', true)
        ->when(!$isAdmin && $guruId, fn ($q) => $q->whereHas('pembelajaran', fn ($p) => $p->where('guru_id', $guruId)))
        // Jam Literasi dengan toggle "isi jurnal" nonaktif sengaja tidak pernah
        // punya jurnal — kalau tidak dikecualikan di sini, dia nongol selamanya di
        // "jadwal yang belum ada jurnalnya" padahal memang tidak perlu diisi.
        ->whereHas('pembelajaran', fn ($p) => $p->where('isi_jurnal', true))
        ->orderBy('jam_mulai')
        ->get();

        $jadwalWithJamKe = $jadwalHariIni->values()->map(fn ($j) => $j->toArray());
        $jadwalMap = $jadwalWithJamKe->keyBy('id');

        $jadwalIds       = $jadwalHariIni->pluck('id');
        $pembelajaranIds = $jadwalHariIni->pluck('pembelajaran_id')->unique();

        // Jurnal hari ini
        $jurnalHariIni = JurnalMengajar::with('pembelajaran.mataPelajaran', 'pembelajaran.rombel')
            ->where('tanggal', $today)
            ->whereIn('pembelajaran_id', $pembelajaranIds)
            ->orderBy('id')
            ->get();

        // Jadwal yang sudah dicakup oleh jurnal
        $coveredJadwalIds = $jurnalHariIni->flatMap(fn ($j) => $j->jadwal_ids ?? [])->flip();

        // Bangun data jurnal: tambahkan info jadwal yang dicakup
        $jurnalData = $jurnalHariIni->map(function ($j) use ($jadwalMap) {
            $coveredJadwals = collect($j->jadwal_ids ?? [])
                ->map(fn ($jid) => $jadwalMap->get($jid))
                ->filter()
                ->sortBy('jam_mulai')
                ->values()
                ->toArray();

            $jamKes = collect($coveredJadwals)->pluck('jam_ke')->sort()->values()->toArray();
            $jamRange = empty($jamKes)
                ? '–'
                : ('Jam ' . (count($jamKes) === 1 ? $jamKes[0] : $jamKes[0] . '–' . end($jamKes)));

            return array_merge($j->toArray(), [
                'covered_jadwals' => $coveredJadwals,
                'jam_range'       => $jamRange,
                'jam_mulai'       => collect($coveredJadwals)->min('jam_mulai'),
                'jam_selesai'     => collect($coveredJadwals)->max('jam_selesai'),
                'first_jadwal_id' => $coveredJadwals[0]['id'] ?? null,
            ]);
        })->values();

        // Jadwal yang belum ada jurnalnya
        $uncoveredJadwal = $jadwalWithJamKe->filter(fn ($j) => !isset($coveredJadwalIds[$j['id']]))->values();

        // Status piket per jadwal_id
        $piketRecords = AbsensiPiket::where('tanggal', $today)
            ->whereIn('jadwal_id', $jadwalIds)
            ->get()
            ->keyBy('jadwal_id');

        // Statistik absensi per jurnal_id
        $absensiStats = Absensi::whereIn('jurnal_id', $jurnalHariIni->pluck('id'))
            ->select('jurnal_id', 'status', DB::raw('count(*) as jumlah'))
            ->groupBy('jurnal_id', 'status')
            ->get()
            ->groupBy('jurnal_id')
            ->map(fn ($rows) => $rows->pluck('jumlah', 'status'));

        $tahunAktif = TahunAjaran::aktif();
        $pembelajaranTanpaJadwal = Pembelajaran::where('is_aktif', true)
            ->when(!$isAdmin && $guruId, fn ($q) => $q->where('guru_id', $guruId))
            ->when($tahunAktif, fn ($q) => $q->where('tahun_ajaran_id', $tahunAktif->id))
            ->whereDoesntHave('jadwal')
            ->count();

        return Inertia::render('Guru/Absensi/Index', [
            'jurnalHariIni'           => $jurnalData,
            'jadwalUncovered'         => $uncoveredJadwal,
            'piketRecords'            => $piketRecords,
            'absensiStats'            => $absensiStats,
            'tanggalHariIni'          => $today,
            'pembelajaranTanpaJadwal' => $pembelajaranTanpaJadwal,
        ]);
    }

    public function show(JurnalMengajar $jurnal)
    {
        $today = today()->toDateString();
        $pembelajaran = $jurnal->pembelajaran->load('rombel.kelas', 'mataPelajaran');

        // Detail jadwal yang dicakup jurnal ini
        $jadwals = Jadwal::whereIn('id', $jurnal->jadwal_ids ?? [])
            ->orderBy('jam_mulai')
            ->get();

        // Kelas gabung (jurusan_id null) → semua siswa di rombel
        // Kelas dipisah (jurusan_id diset) → hanya siswa jurusan tersebut
        $siswa = Siswa::where('rombel_id', $pembelajaran->rombel_id)
            ->where('status_siswa', 'Aktif')
            ->when($pembelajaran->jurusan_id, function ($q) use ($pembelajaran) {
                $q->where(function ($inner) use ($pembelajaran) {
                    $inner->where('jurusan_id', $pembelajaran->jurusan_id)
                          ->orWhereNull('jurusan_id');
                });
            })
            ->with('user')
            ->get();

        $absensi = Absensi::where('jurnal_id', $jurnal->id)
            ->get()
            ->keyBy('siswa_id');

        $absensiByStatus = collect(['Hadir', 'Sakit', 'Izin', 'Alpha'])
            ->mapWithKeys(fn ($status) => [
                $status => $siswa->filter(fn ($s) => ($absensi[$s->id]->status ?? null) === $status)
                    ->map(fn ($s) => ['id' => $s->id, 'nama' => $s->user?->name ?? '–'])
                    ->values(),
            ]);

        $sudahDiisi = $absensi->count() > 0;

        return Inertia::render('Guru/Absensi/Show', [
            'pembelajaran'    => $pembelajaran,
            'jadwals'         => $jadwals,
            'jurnal'          => $jurnal,
            'siswa'           => $siswa,
            'absensi'         => $absensi,
            'absensiByStatus' => $absensiByStatus,
            'sudahDiisi'      => $sudahDiisi,
            'tanggal'         => $jurnal->tanggal->toDateString(),
            'isToday'         => $jurnal->tanggal->toDateString() === $today,
        ]);
    }

    public function store(Request $request, JurnalMengajar $jurnal)
    {
        $request->validate([
            'absensi'            => 'required|array',
            'absensi.*.siswa_id' => 'required|exists:siswa,id',
            'absensi.*.status'   => 'required|in:Hadir,Sakit,Izin,Alpha',
        ]);

        $tanggal = $jurnal->tanggal->toDateString();

        foreach ($request->absensi as $item) {
            Absensi::updateOrCreate(
                [
                    'jurnal_id' => $jurnal->id,
                    'siswa_id'  => $item['siswa_id'],
                ],
                [
                    'pembelajaran_id' => $jurnal->pembelajaran_id,
                    'tanggal'         => $tanggal,
                    'status'          => $item['status'],
                    'keterangan'      => $item['keterangan'] ?? null,
                    'dicatat_oleh'    => auth()->id(),
                ]
            );
        }

        // Sync jumlah_hadir ke jurnal
        $jumlahHadir = Absensi::where('jurnal_id', $jurnal->id)->where('status', 'Hadir')->count();
        $jurnal->update(['jumlah_hadir' => $jumlahHadir]);

        return back()->with('success', 'Absensi berhasil disimpan.');
    }

    /**
     * Riwayat presensi siswa per sesi jurnal mengajar — guru hanya melihat
     * miliknya sendiri (lewat guruId() null-check, sama seperti JurnalController::
     * riwayat()), super_admin/kepala_sekolah melihat semua.
     */
    public function riwayat(Request $request)
    {
        $guruId  = $this->guruId();
        $isAdmin = $this->isAdmin();

        $riwayat = JurnalMengajar::with([
                'pembelajaran.mataPelajaran',
                'pembelajaran.rombel',
                'pembelajaran.jurusan',
                'pembelajaran.guru.user',
                'absensi.siswa.user',
            ])
            ->when($guruId, fn ($q) => $q->whereHas('pembelajaran', fn ($p) => $p->where('guru_id', $guruId)))
            ->when($request->dari,      fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai,    fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->rombel_id, fn ($q) => $q->whereHas('pembelajaran', fn ($p) => $p->where('rombel_id', $request->rombel_id)))
            ->when($request->q,         fn ($q) => $q->where('materi_pokok', 'like', "%{$request->q}%"))
            ->whereHas('absensi')
            ->latest('tanggal')
            ->paginate(15)
            ->withQueryString();

        // Ringkasan hadir/sakit/izin/alpha per sesi, dihitung dari data absensi yang
        // sudah di-eager-load (bukan query count terpisah per baris).
        $riwayat->getCollection()->transform(function ($j) {
            $counts = $j->absensi->countBy('status');
            $j->setAttribute('ringkasan', [
                'hadir' => $counts->get('Hadir', 0),
                'sakit' => $counts->get('Sakit', 0),
                'izin'  => $counts->get('Izin', 0),
                'alpha' => $counts->get('Alpha', 0),
                'total' => $j->absensi->count(),
            ]);
            return $j;
        });

        $rombelList = Rombel::where('is_aktif', true)->orderBy('nama')->get(['id', 'nama']);

        $kop     = PengaturanSurat::current();
        $sekolah = PengaturanSekolah::current();

        return Inertia::render('Guru/Absensi/Riwayat', [
            'riwayat'    => $riwayat,
            'filters'    => $request->only('dari', 'sampai', 'rombel_id', 'q'),
            'rombelList' => $rombelList,
            'isAdmin'    => $isAdmin,
            'kop'        => [
                'nama_instansi' => $kop->nama_instansi,
                'sub_nama'      => $kop->sub_nama,
                'yayasan_dinas' => $kop->yayasan_dinas,
                'alamat_kop'    => $kop->alamat_kop,
                'telepon_kop'   => $kop->telepon_kop,
                'website_kop'   => $kop->website_kop,
                'email_kop'     => $kop->email_kop,
                'npsn_kop'      => $kop->npsn_kop,
                'logo_url'      => $sekolah->logo_url,
            ],
        ]);
    }
}
