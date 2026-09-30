<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KartuSiswaTemplate;
use App\Models\PengaturanSekolah;
use App\Models\PengaturanSurat;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class KartuSiswaController extends Controller
{
    public const FIELD_OPTIONS = [
        'nis'           => 'NIS',
        'nisn'          => 'NISN',
        'kelas'         => 'Kelas / Rombel',
        'jurusan'       => 'Jurusan',
        'ttl'           => 'Tempat & Tanggal Lahir',
        'alamat'        => 'Alamat',
        'jenis_kelamin' => 'Jenis Kelamin',
        'agama'         => 'Agama',
        'sekolah'       => 'Identitas Sekolah (logo, nama, alamat)',
    ];

    public function index()
    {
        $templates = KartuSiswaTemplate::orderByDesc('id')->get()
            ->map(fn ($t) => $this->normalizeTemplate($t));

        $tahunAktif = TahunAjaran::aktif();
        $rombelList = Rombel::with('kelas')
            ->where('is_aktif', true)
            ->when($tahunAktif, fn ($q) => $q->where('tahun_ajaran_id', $tahunAktif->id))
            ->orderBy('nama')
            ->get(['id', 'nama', 'kelas_id']);

        return Inertia::render('Admin/KartuSiswa/Index', [
            'templates'     => $templates,
            'rombelList'    => $rombelList,
            'fieldOptions'  => self::FIELD_OPTIONS,
        ]);
    }

    public function storeTemplate(Request $request)
    {
        $data = $this->validateTemplate($request);

        if ($request->hasFile('background')) {
            $data['background_path'] = $request->file('background')->store('kartu-siswa', 'public');
        }

        KartuSiswaTemplate::create($data);

        return back()->with('success', 'Template kartu siswa berhasil dibuat.');
    }

    public function updateTemplate(Request $request, KartuSiswaTemplate $template)
    {
        $oldImagePaths = $this->imagePathsOf($template->fields ?? []);

        $data = $this->validateTemplate($request);

        $newImagePaths = $this->imagePathsOf($data['fields'] ?? []);
        foreach (array_diff($oldImagePaths, $newImagePaths) as $orphan) {
            Storage::disk('public')->delete($orphan);
        }

        if ($request->hasFile('background')) {
            if ($template->background_path) {
                Storage::disk('public')->delete($template->background_path);
            }
            $data['background_path'] = $request->file('background')->store('kartu-siswa', 'public');
        } elseif ($request->boolean('hapus_background')) {
            if ($template->background_path) {
                Storage::disk('public')->delete($template->background_path);
            }
            $data['background_path'] = null;
        }

        $template->update($data);

        return back()->with('success', 'Template kartu siswa berhasil diperbarui.');
    }

    public function destroyTemplate(KartuSiswaTemplate $template)
    {
        if ($template->background_path) {
            Storage::disk('public')->delete($template->background_path);
        }
        foreach ($this->imagePathsOf($template->fields ?? []) as $path) {
            Storage::disk('public')->delete($path);
        }
        $template->delete();

        return back()->with('success', 'Template kartu siswa berhasil dihapus.');
    }

    private function imagePathsOf(array $fields): array
    {
        return collect($fields)
            ->filter(fn ($f) => is_array($f) && ($f['type'] ?? null) === 'image' && !empty($f['image_path']))
            ->pluck('image_path')
            ->all();
    }

    public function cetak(Request $request)
    {
        $data = $request->validate([
            'template_id'   => 'required|exists:kartu_siswa_template,id',
            'rombel_id'     => 'nullable|exists:rombel,id',
            'siswa_ids'     => 'nullable|array',
            'siswa_ids.*'   => 'integer|exists:siswa,id',
        ]);

        $template = $this->normalizeTemplate(KartuSiswaTemplate::findOrFail($data['template_id']));

        $query = Siswa::with(['user', 'rombel.kelas', 'rombel.jurusanList'])->where('status_siswa', 'Aktif');
        if (!empty($data['siswa_ids'])) {
            $query->whereIn('id', $data['siswa_ids']);
        } elseif (!empty($data['rombel_id'])) {
            $query->where('rombel_id', $data['rombel_id']);
        } else {
            abort(422, 'Pilih rombel atau siswa yang akan dicetak.');
        }

        $siswaList = $query->orderBy('nis')->get()->map(fn (Siswa $s) => [
            'id'            => $s->id,
            'nama'          => $s->user?->name,
            'foto_url'      => $s->user?->avatar_url,
            'nis'           => 'NIS: ' . $this->formatNis($s->nis),
            'nisn'          => $s->nisn ? "NISN: {$s->nisn}" : null,
            'kelas'         => $s->rombel?->nama ?? '–',
            'jurusan'       => $s->rombel?->jurusanList->pluck('nama')->join(', ') ?: '–',
            'ttl'           => trim(($s->tempat_lahir ?? '') . ($s->user?->tanggal_lahir ? ', ' . $s->user->tanggal_lahir->translatedFormat('d F Y') : '')) ?: '–',
            'alamat'        => $s->user?->alamat ?? '–',
            'jenis_kelamin' => $s->user?->gender === 'L' ? 'Laki-laki' : ($s->user?->gender === 'P' ? 'Perempuan' : '–'),
            'agama'         => $s->agama ?? '–',
        ]);

        $sekolah = PengaturanSekolah::current();
        $kop     = PengaturanSurat::current();

        return Inertia::render('Admin/KartuSiswa/Cetak', [
            'template'  => $template,
            'siswaList' => $siswaList,
            'sekolah'   => [
                'nama_sekolah' => $sekolah->nama_sekolah,
                'alamat'       => $sekolah->alamat,
                'logo_url'     => $sekolah->logo_url,
                'nama_instansi' => $kop->nama_instansi,
            ],
        ]);
    }

    private function formatNis(?string $nis): string
    {
        $digits = preg_replace('/\D/', '', (string) $nis);
        if (strlen($digits) !== 10) {
            return $nis ?? '–';
        }
        return substr($digits, 0, 4) . '/' . substr($digits, 4, 3) . '.' . substr($digits, 7, 3);
    }

    /**
     * Posisi default foto: dipusatkan secara horizontal, dekat bagian atas kartu.
     */
    private function defaultFotoLayout(float $lebarMm): array
    {
        $width = round(min(20, $lebarMm * 0.35), 1);

        return [
            'x'      => round(($lebarMm - $width) / 2, 1),
            'y'      => 4,
            'width'  => $width,
            'height' => $width,
        ];
    }

    /**
     * Posisi default tiap elemen data/teks: ditumpuk vertikal di bawah foto, rata tengah.
     */
    private function defaultFieldLayout(string $type, ?string $key, string $content, int $index, float $lebarMm, float $fotoBottom): array
    {
        return [
            'id'        => (string) Str::uuid(),
            'type'      => $type,
            'key'       => $key,
            'content'   => $content,
            'x'         => 2,
            'y'         => round($fotoBottom + 2 + $index * 4.2, 1),
            'width'     => round($lebarMm - 4, 1),
            'align'     => 'center',
            'fontSize'  => $index === 0 ? 9 : 7,
            'bold'      => $index === 0,
            'italic'    => false,
            'underline' => false,
            'color'     => '#111827',
        ];
    }

    /**
     * Template lama (sebelum fitur tata letak drag & drop) menyimpan `fields` sebagai
     * array string dan tidak punya `foto_layout`. Normalisasi di sini supaya template
     * lama tetap tampil benar tanpa perlu migrasi data manual.
     */
    private function normalizeTemplate(KartuSiswaTemplate $t): KartuSiswaTemplate
    {
        $lebarMm    = (float) $t->lebar_mm;
        $fotoLayout = $t->foto_layout ?: $this->defaultFotoLayout($lebarMm);
        $fotoBottom = $fotoLayout['y'] + $fotoLayout['height'];

        $rawFields = $t->fields ?: [];
        $isLegacy  = collect($rawFields)->contains(fn ($f) => is_string($f));

        if ($isLegacy) {
            $fields = [$this->defaultFieldLayout('data', 'nama', '', 0, $lebarMm, $fotoBottom)];
            foreach (array_values($rawFields) as $i => $key) {
                $fields[] = $this->defaultFieldLayout('data', $key, '', $i + 1, $lebarMm, $fotoBottom);
            }
            $rawFields = $fields;
        } elseif (!collect($rawFields)->contains(fn ($f) => ($f['type'] ?? 'data') === 'data' && ($f['key'] ?? null) === 'nama')) {
            array_unshift($rawFields, $this->defaultFieldLayout('data', 'nama', '', 0, $lebarMm, $fotoBottom));
        }

        // Jaga-jaga untuk template lama yang sempat tersimpan dengan bold/italic/underline
        // berupa string "0"/"1", dan x/y/width/height/fontSize berupa string angka (bug
        // FormData sebelum diperbaiki — validasi 'numeric'/'boolean' tidak meng-cast nilai,
        // sehingga tersimpan sebagai string). String + number di JS artinya digabung jadi
        // teks, bukan dijumlahkan — itu sebabnya elemen "hilang" saat digeser. Cast ulang di sini.
        $t->fields = array_values(array_map(function ($f) {
            $f['bold']      = filter_var($f['bold'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $f['italic']    = filter_var($f['italic'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $f['underline'] = filter_var($f['underline'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $f['x']         = (float) $f['x'];
            $f['y']         = (float) $f['y'];
            $f['width']     = (float) $f['width'];
            $f['fontSize']  = (float) $f['fontSize'];
            if (isset($f['height'])) {
                $f['height'] = (float) $f['height'];
            }
            if (($f['type'] ?? null) === 'image' && !empty($f['image_path'])) {
                $f['image_url'] = Storage::disk('public')->url($f['image_path']);
            }
            return $f;
        }, $rawFields));
        $t->foto_layout = [
            'x'      => (float) $fotoLayout['x'],
            'y'      => (float) $fotoLayout['y'],
            'width'  => (float) $fotoLayout['width'],
            'height' => (float) $fotoLayout['height'],
        ];

        return $t;
    }

    private function validateTemplate(Request $request): array
    {
        $data = $request->validate([
            'nama'                 => 'required|string|max:255',
            'lebar_mm'             => 'required|numeric|min:10|max:500',
            'tinggi_mm'            => 'required|numeric|min:10|max:500',
            'orientasi'            => 'required|in:portrait,landscape',
            'bingkai_foto'         => 'required|in:kotak,lingkaran',
            'foto_layout'          => 'nullable|array',
            'foto_layout.x'        => 'required_with:foto_layout|numeric',
            'foto_layout.y'        => 'required_with:foto_layout|numeric',
            'foto_layout.width'    => 'required_with:foto_layout|numeric|min:5',
            'foto_layout.height'   => 'required_with:foto_layout|numeric|min:5',
            'fields'               => 'nullable|array',
            'fields.*.id'          => 'nullable|string',
            'fields.*.type'        => 'required|in:data,text,image',
            'fields.*.key'         => 'nullable|string|in:nama,' . implode(',', array_keys(self::FIELD_OPTIONS)),
            'fields.*.content'     => 'nullable|string|max:255',
            'fields.*.x'           => 'required|numeric',
            'fields.*.y'           => 'required|numeric',
            'fields.*.width'       => 'required|numeric|min:5',
            'fields.*.height'      => 'nullable|numeric|min:5',
            'fields.*.align'       => 'required|in:left,center,right',
            'fields.*.fontSize'    => 'required|numeric|min:5|max:40',
            'fields.*.bold'        => 'boolean',
            'fields.*.italic'      => 'boolean',
            'fields.*.underline'   => 'boolean',
            'fields.*.color'       => 'nullable|string|max:20',
            'fields.*.image'       => 'nullable|image|mimes:jpg,jpeg,png,webp,svg|max:5120',
            'fields.*.image_path'  => 'nullable|string',
            'fields.*.remove_image' => 'nullable|boolean',
            'kertas'               => 'required|string|max:20',
            'kertas_lebar_mm'      => 'required|numeric|min:50|max:2000',
            'kertas_tinggi_mm'     => 'required|numeric|min:50|max:2000',
            'margin_mm'            => 'required|numeric|min:0|max:100',
            'jarak_x_mm'           => 'required|numeric|min:0|max:100',
            'jarak_y_mm'           => 'required|numeric|min:0|max:100',
            'background'           => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        // Simpan/hapus gambar per-elemen (tipe 'image') sebelum disaring — pakai index
        // asli dari request supaya file yang diunggah cocok dengan elemennya masing-masing.
        $rawFields = $data['fields'] ?? [];
        foreach ($rawFields as $i => &$f) {
            if (($f['type'] ?? null) !== 'image') {
                continue;
            }
            if (!empty($f['image']) && $f['image'] instanceof \Illuminate\Http\UploadedFile) {
                $f['image_path'] = $f['image']->store('kartu-siswa', 'public');
            } elseif (!empty($f['remove_image'])) {
                $f['image_path'] = null;
            }
            unset($f['image'], $f['remove_image']);
        }
        unset($f);

        // Buang elemen yang tidak lengkap (data tanpa key, teks tanpa isi, gambar tanpa file)
        // dan pastikan elemen "nama" selalu ada — nama siswa wajib tampil di kartu.
        // Submit lewat FormData (perlu untuk upload background) mengirim boolean sebagai
        // string "0"/"1" — validasi 'boolean' tidak meng-cast nilainya, jadi harus di-cast
        // manual di sini, kalau tidak "0" (string) akan dibaca truthy di frontend.
        $fields = collect($rawFields)
            ->filter(function ($f) {
                if ($f['type'] === 'text') return filled($f['content'] ?? null);
                if ($f['type'] === 'image') return filled($f['image_path'] ?? null);
                return filled($f['key'] ?? null);
            })
            ->map(function ($f) {
                $f['bold'] = filter_var($f['bold'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $f['italic'] = filter_var($f['italic'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $f['underline'] = filter_var($f['underline'] ?? false, FILTER_VALIDATE_BOOLEAN);
                // Sama seperti boolean di atas — FormData mengirim angka sebagai string dan
                // 'numeric' tidak meng-cast-nya. String + number di JS = digabung jadi teks,
                // bukan dijumlahkan, jadi elemen "hilang" (posisi jadi teks aneh) saat digeser.
                $f['x'] = (float) $f['x'];
                $f['y'] = (float) $f['y'];
                $f['width'] = (float) $f['width'];
                $f['fontSize'] = (float) $f['fontSize'];
                if (isset($f['height'])) {
                    $f['height'] = (float) $f['height'];
                }
                return $f;
            })
            ->values()
            ->all();

        if (!collect($fields)->contains(fn ($f) => $f['type'] === 'data' && $f['key'] === 'nama')) {
            array_unshift($fields, [
                'id' => (string) Str::uuid(), 'type' => 'data', 'key' => 'nama', 'content' => '',
                'x' => 2, 'y' => 4, 'width' => (float) $data['lebar_mm'] - 4, 'align' => 'center',
                'fontSize' => 9, 'bold' => true, 'italic' => false, 'underline' => false, 'color' => '#111827',
            ]);
        }

        $data['fields'] = $fields;

        if (!empty($data['foto_layout'])) {
            $data['foto_layout'] = [
                'x'      => (float) $data['foto_layout']['x'],
                'y'      => (float) $data['foto_layout']['y'],
                'width'  => (float) $data['foto_layout']['width'],
                'height' => (float) $data['foto_layout']['height'],
            ];
        }

        return $data;
    }
}
