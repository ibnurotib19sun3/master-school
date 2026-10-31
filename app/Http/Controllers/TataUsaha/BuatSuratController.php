<?php

namespace App\Http\Controllers\TataUsaha;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\KodeDepartemen;
use App\Models\KodeJenisSurat;
use App\Models\PengaturanSekolah;
use App\Models\PengaturanSurat;
use App\Models\Siswa;
use App\Models\SuratKeluar;
use App\Models\Tatausaha;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BuatSuratController extends Controller
{
    private function sekolahData(): array
    {
        $sekolah = PengaturanSekolah::current();
        $ps = PengaturanSurat::current();

        $alamatKop = $ps->alamat_kop ?: ([
            $sekolah->alamat,
            $sekolah->kecamatan ? 'Kec. ' . $sekolah->kecamatan : null,
            $sekolah->kota,
        ]);
        if (is_array($alamatKop)) {
            $alamatKop = implode(', ', array_filter($alamatKop));
        }

        return [
            'nama_sekolah'        => $ps->nama_instansi ?: ($sekolah->nama_sekolah ?: 'SMK'),
            'sub_nama'            => $ps->sub_nama ?: null,
            'yayasan_dinas'       => $ps->yayasan_dinas ?: $sekolah->yayasan_dinas,
            'npsn'                => $ps->npsn_kop ?: $sekolah->npsn,
            'alamat'              => $alamatKop,
            'kecamatan'           => $sekolah->kecamatan,
            'kota'                => $sekolah->kota,
            'telepon'             => $ps->telepon_kop ?: $sekolah->telepon,
            'email_sekolah'       => $ps->email_kop ?: $sekolah->email_sekolah,
            'website'             => $ps->website_kop ?: $sekolah->website,
            'kepala_sekolah_nama' => $sekolah->kepala_sekolah_nama,
            'nip_kepala'          => $sekolah->nip_kepala,
            'logo_url'            => $sekolah->logo_url,
        ];
    }

    /**
     * Konfigurasi penomoran — sama persis dengan yang dipakai di menu Surat Keluar
     * (PengaturanSurat/KodeDepartemen/KodeJenisSurat), supaya nomor yang dihasilkan
     * di Buat Surat konsisten dan bisa langsung nyambung ke arsip Surat Keluar.
     */
    private function nomorConfig(): array
    {
        $ps = PengaturanSurat::current();

        return [
            'kode_departemen' => KodeDepartemen::where('aktif', true)->orderBy('urutan')->get(['id', 'nama', 'kode']),
            'kode_jenis'      => KodeJenisSurat::where('aktif', true)->orderBy('urutan')->get(['id', 'nama', 'kode']),
            'format_nomor'    => [
                'separator'     => $ps->separator,
                'format_bagian' => $ps->format_bagian,
                'prefix_kode'   => $ps->prefix_kode,
            ],
            'next_seq' => SuratKeluar::whereYear('tgl_keluar', now()->year)->count() + 1,
        ];
    }

    public function index()
    {
        $suratKeluarDrafts = SuratKeluar::query()
            ->where(function ($q) {
                $q->whereNull('isi_surat')->orWhere('status', 'Draft');
            })
            ->latest('tgl_keluar')
            ->limit(15)
            ->get()
            ->map(fn ($s) => [
                'id'            => $s->id,
                'nomor_surat'   => $s->nomor_surat,
                'perihal'       => $s->perihal ?: '-',
                'tujuan'        => $s->tujuan ?: '-',
                'tgl_surat'     => $s->tgl_surat?->format('Y-m-d'),
                'tgl_keluar'    => $s->tgl_keluar?->format('Y-m-d'),
                'kategori'      => $s->kategori,
                'status'        => $s->status,
                'has_isi'       => !empty($s->isi_surat),
            ]);

        return Inertia::render('TataUsaha/Surat/BuatSurat', array_merge([
            'sekolah'             => $this->sekolahData(),
            'today'               => now()->toDateString(),
            'editing'             => null,
            'surat_keluar_drafts' => $suratKeluarDrafts,
        ], $this->nomorConfig()));
    }

    /**
     * Buka surat yang sudah tersimpan untuk dilanjutkan/diedit isinya — sebelumnya
     * isi surat tidak pernah disimpan sama sekali jadi tidak ada yang bisa dibuka.
     */
    public function edit(SuratKeluar $suratKeluar)
    {
        return Inertia::render('TataUsaha/Surat/BuatSurat', array_merge([
            'sekolah' => $this->sekolahData(),
            'today'   => now()->toDateString(),
            // $model->only() tidak menghormati format cast 'date:Y-m-d' (mengembalikan
            // objek Carbon mentah yang ke-JSON jadi timestamp ISO lengkap) — MySQL
            // strict mode menolak itu untuk kolom DATE, jadi tanggal diformat manual.
            'editing' => [
                'id'            => $suratKeluar->id,
                'nomor_surat'   => $suratKeluar->nomor_surat,
                'perihal'       => $suratKeluar->perihal,
                'tujuan'        => $suratKeluar->tujuan,
                'tgl_surat'     => $suratKeluar->tgl_surat?->format('Y-m-d'),
                'tgl_keluar'    => $suratKeluar->tgl_keluar?->format('Y-m-d'),
                'kategori'      => $suratKeluar->kategori,
                'status'        => $suratKeluar->status,
                'keterangan'    => $suratKeluar->keterangan,
                'isi_surat'     => $suratKeluar->isi_surat,
                'penerima_tipe' => $suratKeluar->penerima_tipe,
                'penerima_id'   => $suratKeluar->penerima_id,
                'template_kode' => $suratKeluar->template_kode,
            ],
        ], $this->nomorConfig()));
    }

    /**
     * Cari data PTK (guru/tatausaha) atau siswa untuk diintegrasikan ke isian surat —
     * dipakai picker "Isi dari Data" di halaman Buat Surat, supaya staf TU tidak perlu
     * mengetik ulang nama/NIP/NIS/jabatan yang sebenarnya sudah ada di sistem.
     */
    public function cariOrang(Request $request)
    {
        $data = $request->validate([
            'tipe' => 'required|in:guru,siswa,tatausaha',
            'q'    => 'nullable|string|max:100',
        ]);
        $q = trim($data['q'] ?? '');

        $results = match ($data['tipe']) {
            'guru' => Guru::with('user')
                ->where('is_aktif', true)
                ->when($q !== '', fn ($query) => $query->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")))
                ->orderBy('id')
                ->limit(15)
                ->get()
                ->map(fn ($g) => [
                    'id'    => $g->id,
                    'nama'  => $g->nama_lengkap,
                    'sub'   => 'NIP ' . ($g->nip ?: '-') . ' · Guru',
                    'merge' => $this->mergeFields('guru', $g),
                ]),
            'tatausaha' => Tatausaha::with('user')
                ->where('is_aktif', true)
                ->when($q !== '', fn ($query) => $query->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")))
                ->orderBy('id')
                ->limit(15)
                ->get()
                ->map(fn ($t) => [
                    'id'    => $t->id,
                    'nama'  => $t->nama_lengkap,
                    'sub'   => 'NIP ' . ($t->nip ?: '-') . ' · ' . ($t->jabatan ?: 'Tata Usaha'),
                    'merge' => $this->mergeFields('tatausaha', $t),
                ]),
            'siswa' => Siswa::with(['user', 'rombel'])
                ->where('status_siswa', 'Aktif')
                ->when($q !== '', fn ($query) => $query->where('nis', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")))
                ->orderBy('nis')
                ->limit(15)
                ->get()
                ->map(fn ($s) => [
                    'id'    => $s->id,
                    'nama'  => $s->user?->name,
                    'sub'   => 'NIS ' . $s->nis . ' · ' . ($s->rombel?->nama ?: '-'),
                    'merge' => $this->mergeFields('siswa', $s),
                ]),
        };

        return response()->json($results->values());
    }

    /**
     * Cari daftar surat keluar dari arsip / agenda untuk dihubungkan ke generator surat.
     * Sangat fleksibel: staf TU bisa memilih nomor surat yang sudah dibooking/draft di Surat Keluar.
     */
    public function cariSuratKeluar(Request $request)
    {
        $q = trim($request->input('q', ''));
        $hanyaDraft = $request->boolean('draft_only', false);

        $results = SuratKeluar::query()
            ->when($hanyaDraft, fn ($query) => $query->where(function ($sub) {
                $sub->whereNull('isi_surat')->orWhere('status', 'Draft');
            }))
            ->when($q !== '', fn ($query) => $query->where(function ($sub) use ($q) {
                $sub->where('nomor_surat', 'like', "%{$q}%")
                    ->orWhere('perihal', 'like', "%{$q}%")
                    ->orWhere('tujuan', 'like', "%{$q}%");
            }))
            ->latest('tgl_keluar')
            ->limit(20)
            ->get()
            ->map(fn ($s) => [
                'id'            => $s->id,
                'nomor_surat'   => $s->nomor_surat,
                'perihal'       => $s->perihal ?: '-',
                'tujuan'        => $s->tujuan ?: '-',
                'tgl_surat'     => $s->tgl_surat?->format('Y-m-d'),
                'tgl_keluar'    => $s->tgl_keluar?->format('Y-m-d'),
                'kategori'      => $s->kategori,
                'status'        => $s->status,
                'keterangan'    => $s->keterangan,
                'has_isi'       => !empty($s->isi_surat),
                'template_kode' => $s->template_kode,
                'penerima_tipe' => $s->penerima_tipe,
                'penerima_id'   => $s->penerima_id,
            ]);

        return response()->json($results->values());
    }

    private function mergeFields(string $tipe, $person): array
    {
        $user = $person->user;
        $ttl  = $user?->tanggal_lahir ? $user->tanggal_lahir->translatedFormat('d F Y') : '';

        return match ($tipe) {
            'guru' => [
                'nama'    => $person->nama_lengkap,
                'nip_nis' => $person->nip ?: '-',
                'jabatan' => !empty($person->jabatan) ? implode(', ', $person->jabatan) : 'Guru',
                'kelas'   => '-',
                'alamat'  => $user?->alamat ?: '-',
                'ttl'     => $ttl ?: '-',
            ],
            'tatausaha' => [
                'nama'    => $person->nama_lengkap,
                'nip_nis' => $person->nip ?: '-',
                'jabatan' => $person->jabatan ?: 'Tata Usaha',
                'kelas'   => '-',
                'alamat'  => $user?->alamat ?: '-',
                'ttl'     => $ttl ?: '-',
            ],
            'siswa' => [
                'nama'    => $user?->name ?: '-',
                'nip_nis' => $person->nis ?: '-',
                'jabatan' => 'Siswa',
                'kelas'   => $person->rombel?->nama ?: '-',
                'alamat'  => $user?->alamat ?: '-',
                'ttl'     => trim(($person->tempat_lahir ?? '') . ($ttl ? ', ' . $ttl : '')) ?: '-',
            ],
        };
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'nomor_surat'    => 'required|string|max:100',
            'perihal'        => 'required|string|max:255',
            'tujuan'         => 'required|string|max:255',
            'tgl_surat'      => 'required|date',
            'tgl_keluar'     => 'required|date',
            'kategori'       => 'required|string|max:100',
            'status'         => 'required|in:Draft,Terkirim',
            'keterangan'     => 'nullable|string',
            'isi_surat'      => 'required|string',
            'penerima_tipe'  => 'nullable|in:guru,siswa,tatausaha',
            'penerima_id'    => 'nullable|integer',
            'template_kode'  => 'nullable|string|max:50',
        ]);
    }

    public function simpan(Request $request)
    {
        $data = $this->validated($request);

        // Jika staf TU memilih nomor dari Surat Keluar yang sudah ada di arsip
        if ($request->filled('surat_keluar_id')) {
            $existing = SuratKeluar::find($request->input('surat_keluar_id'));
            if ($existing) {
                $existing->update($data);
                return redirect('/tatausaha/surat-keluar')->with('success', 'Surat keluar ' . $existing->nomor_surat . ' berhasil diperbarui dengan isi surat.');
            }
        }

        SuratKeluar::create([...$data, 'dibuat_oleh' => auth()->id()]);

        return redirect('/tatausaha/surat-keluar')->with('success', 'Surat berhasil disimpan ke arsip surat keluar.');
    }

    public function update(Request $request, SuratKeluar $suratKeluar)
    {
        $data = $this->validated($request);

        $suratKeluar->update($data);

        return redirect('/tatausaha/surat-keluar')->with('success', 'Surat berhasil diperbarui.');
    }
}
