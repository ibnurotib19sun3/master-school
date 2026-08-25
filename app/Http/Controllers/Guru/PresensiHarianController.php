<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\PresensiSiswaHarian;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PresensiHarianController extends Controller
{
    private function canEdit(): bool
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return true;
        if (!$user->hasRole('guru')) return false;
        return in_array('Bimbingan Konseling', (array) ($user->guru?->jabatan ?? []));
    }

    /** Rombel ID where this user is wali kelas (null if not wali kelas). */
    private function getWaliKelasRombelId(): ?int
    {
        return Rombel::where('wali_kelas_id', auth()->id())
            ->where('is_aktif', true)
            ->value('id');
    }

    /** Abort 403 for guru who are neither BK nor wali kelas nor admin/kepsek/wakasek. */
    private function authorize(): void
    {
        $user = auth()->user();
        if ($user->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kesiswaan'])) return;
        if ($user->hasRole('guru') && ($this->canEdit() || $this->getWaliKelasRombelId())) return;
        abort(403);
    }

    private function rombelList(?int $tahunId): \Illuminate\Support\Collection
    {
        return Rombel::where('is_aktif', true)
            ->when($tahunId, fn ($q) => $q->where('tahun_ajaran_id', $tahunId))
            ->orderBy('nama')
            ->get(['id', 'nama']);
    }

    public function index(Request $request)
    {
        $this->authorize();

        $tahunAjaran   = TahunAjaran::aktif();
        $wkRombelId    = $this->getWaliKelasRombelId();
        $isWaliKelasOnly = $wkRombelId && !$this->canEdit() &&
            !auth()->user()->hasAnyRole(['kepala_sekolah', 'wakasek_kesiswaan']);

        // Wali kelas only sees their own rombel; others see all
        $rombelList = $isWaliKelasOnly
            ? Rombel::where('id', $wkRombelId)->get(['id', 'nama'])
            : $this->rombelList($tahunAjaran?->id);

        $tanggal  = $request->tanggal ?? today()->toDateString();
        $rombelId = $isWaliKelasOnly
            ? $wkRombelId
            : ($request->rombel_id ? (int) $request->rombel_id : $rombelList->first()?->id);
        $search   = $request->search ?? '';

        $siswaList       = collect();
        $presensiRecords = collect();

        if ($rombelId) {
            $siswaList = Siswa::with('user')
                ->where('rombel_id', $rombelId)
                ->where('status_siswa', 'Aktif')
                ->whereHas('user')
                ->when($search, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")))
                ->get(['id', 'user_id', 'nis', 'nisn'])
                ->map(fn ($s) => [
                    'id'         => $s->id,
                    'name'       => $s->user?->name ?? '–',
                    'nis'        => $s->nis,
                    'avatar_url' => $s->user?->avatar_url,
                ])
                ->sortBy('name')
                ->values();

            $presensiRecords = PresensiSiswaHarian::where('rombel_id', $rombelId)
                ->where('tanggal', $tanggal)
                ->get(['siswa_id', 'status', 'keterangan'])
                ->keyBy('siswa_id')
                ->map(fn ($p) => ['status' => $p->status, 'keterangan' => $p->keterangan]);
        }

        return Inertia::render('Guru/PresensiHarian/Index', [
            'rombelList'      => $rombelList,
            'siswaList'       => $siswaList->values(),
            'presensiRecords' => $presensiRecords,
            'tahunAjaran'     => $tahunAjaran?->only(['id', 'nama', 'semester']),
            'canEdit'         => $this->canEdit(),
            'filters'         => [
                'tanggal'   => $tanggal,
                'rombel_id' => $rombelId,
                'search'    => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        if (! $this->canEdit()) abort(403);

        $data = $request->validate([
            'tanggal'               => 'required|date',
            'rombel_id'             => 'required|exists:rombel,id',
            'records'               => 'required|array|min:1',
            'records.*.siswa_id'    => 'required|exists:siswa,id',
            'records.*.status'      => 'required|in:Hadir,Sakit,Izin,Alpha',
            'records.*.keterangan'  => 'nullable|string|max:500',
        ]);

        $tahunAjaran = TahunAjaran::aktif();

        foreach ($data['records'] as $rec) {
            PresensiSiswaHarian::updateOrCreate(
                ['siswa_id' => $rec['siswa_id'], 'tanggal' => $data['tanggal']],
                [
                    'rombel_id'       => $data['rombel_id'],
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'status'          => $rec['status'],
                    'keterangan'      => $rec['keterangan'] ?? null,
                    'dicatat_oleh'    => auth()->id(),
                ]
            );
        }

        return back()->with('success', 'Presensi harian berhasil disimpan.');
    }

    public function rekap(Request $request)
    {
        $this->authorize();

        $tahunAjaran     = TahunAjaran::aktif();
        $tahunAjaranList = TahunAjaran::orderByDesc('tanggal_mulai')->get(['id', 'nama', 'semester']);

        $wkRombelId      = $this->getWaliKelasRombelId();
        $isWaliKelasOnly = $wkRombelId && !$this->canEdit() &&
            !auth()->user()->hasAnyRole(['kepala_sekolah', 'wakasek_kesiswaan']);

        $rombelList = $isWaliKelasOnly
            ? Rombel::where('id', $wkRombelId)->get(['id', 'nama'])
            : $this->rombelList($tahunAjaran?->id);

        $mode     = in_array($request->mode, ['bulanan', 'semester']) ? $request->mode : 'bulanan';
        $rombelId = $isWaliKelasOnly
            ? $wkRombelId
            : ($request->rombel_id ? (int) $request->rombel_id : null);
        $search   = $request->search ?? '';

        $rekap       = collect();
        $hariEfektif = 0;
        $periodeLabel = '';

        if ($rombelId) {
            if ($mode === 'bulanan') {
                $bulan = (int) ($request->bulan ?? now()->month);
                $tahun = (int) ($request->tahun  ?? now()->year);
                $from  = Carbon::createFromDate($tahun, $bulan, 1)->startOfMonth();
                $to    = $from->copy()->endOfMonth();
                $periodeLabel = $from->locale('id')->translatedFormat('F Y');
            } else {
                $taId = $request->tahun_ajaran_id ? (int) $request->tahun_ajaran_id : $tahunAjaran?->id;
                $ta   = TahunAjaran::find($taId) ?? $tahunAjaran;
                $from = Carbon::parse($ta?->tanggal_mulai ?? now()->startOfYear());
                $to   = Carbon::parse($ta?->tanggal_selesai ?? now()->endOfYear());
                $periodeLabel = ($ta?->nama ?? '') . ' Sem. ' . ($ta?->semester ?? '');
            }

            $siswaQuery = Siswa::with('user')
                ->where('rombel_id', $rombelId)
                ->where('status_siswa', 'Aktif')
                ->whereHas('user')
                ->when($search, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")));

            $siswaList = $siswaQuery->get(['id', 'user_id', 'nis'])
                ->map(fn ($s) => ['id' => $s->id, 'name' => $s->user?->name ?? '–', 'nis' => $s->nis])
                ->sortBy('name')
                ->values();

            $countRows = PresensiSiswaHarian::where('rombel_id', $rombelId)
                ->whereBetween('tanggal', [$from->toDateString(), $to->toDateString()])
                ->selectRaw('siswa_id, status, COUNT(*) as total')
                ->groupBy('siswa_id', 'status')
                ->get();

            $countMap = [];
            foreach ($countRows as $row) {
                $countMap[$row->siswa_id][$row->status] = $row->total;
            }

            $hariEfektif = PresensiSiswaHarian::where('rombel_id', $rombelId)
                ->whereBetween('tanggal', [$from->toDateString(), $to->toDateString()])
                ->distinct('tanggal')
                ->count('tanggal');

            $rekap = $siswaList->map(function ($s) use ($countMap, $hariEfektif) {
                $hadir = $countMap[$s['id']]['Hadir'] ?? 0;
                $sakit = $countMap[$s['id']]['Sakit'] ?? 0;
                $izin  = $countMap[$s['id']]['Izin']  ?? 0;
                $alpha = $countMap[$s['id']]['Alpha']  ?? 0;
                $persen = $hariEfektif > 0 ? round($hadir / $hariEfektif * 100) : 0;
                return [...$s, 'hadir' => $hadir, 'sakit' => $sakit, 'izin' => $izin, 'alpha' => $alpha, 'persen' => $persen];
            });
        }

        return Inertia::render('Guru/PresensiHarian/Rekap', [
            'rombelList'      => $rombelList,
            'tahunAjaranList' => $tahunAjaranList,
            'rekap'           => $rekap->values(),
            'hariEfektif'     => $hariEfektif,
            'periodeLabel'    => $periodeLabel,
            'canEdit'         => $this->canEdit(),
            'filters'         => [
                'mode'            => $mode,
                'rombel_id'       => $rombelId,
                'bulan'           => (int) ($request->bulan ?? now()->month),
                'tahun'           => (int) ($request->tahun  ?? now()->year),
                'tahun_ajaran_id' => $request->tahun_ajaran_id ? (int) $request->tahun_ajaran_id : $tahunAjaran?->id,
                'search'          => $search,
            ],
        ]);
    }
}
