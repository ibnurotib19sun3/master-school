<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSekolah;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PengaturanSekolahController extends Controller
{
    public function index()
    {
        $pengaturan = PengaturanSekolah::current();

        return Inertia::render('Admin/PengaturanSekolah/Index', [
            'pengaturan' => $pengaturan,
            'jamSlots'   => $pengaturan->getJamSlots(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'jam_mulai_sekolah'        => 'required|date_format:H:i',
            'durasi_jp'                => 'required|integer|min:15|max:120',
            'jumlah_jp'                => 'required|integer|min:1|max:14',
            'istirahat'                => 'nullable|array',
            'istirahat.*.setelah_jp'   => 'required|integer|min:1',
            'istirahat.*.durasi_menit' => 'required|integer|min:5|max:120',
            'hari_aktif'               => 'required|array|min:1',
            'hari_aktif.*'             => 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Ahad',
        ]);

        // Pastikan urutan hari selalu Senin → Selasa → ... → Ahad
        $hariOrder = ['Senin' => 0, 'Selasa' => 1, 'Rabu' => 2, 'Kamis' => 3, 'Jumat' => 4, 'Sabtu' => 5, 'Ahad' => 6];
        usort($data['hari_aktif'], fn ($a, $b) => ($hariOrder[$a] ?? 99) - ($hariOrder[$b] ?? 99));

        PengaturanSekolah::current()->update($data);

        return back()->with('success', 'Pengaturan jam belajar berhasil disimpan.');
    }

    public function updateIdentitas(Request $request)
    {
        $data = $request->validate([
            'nama_sekolah'        => 'nullable|string|max:200',
            'yayasan_dinas'       => 'nullable|string|max:200',
            'npsn'                => 'nullable|string|max:20',
            'alamat'              => 'nullable|string',
            'kecamatan'           => 'nullable|string|max:100',
            'kota'                => 'nullable|string|max:100',
            'telepon'             => 'nullable|string|max:50',
            'email_sekolah'       => 'nullable|email|max:200',
            'website'             => 'nullable|string|max:200',
            'kepala_sekolah_nama' => 'nullable|string|max:200',
            'nip_kepala'          => 'nullable|string|max:50',
            'logo'                => 'nullable|image|mimes:png,jpg,jpeg,svg,webp|max:2048',
        ]);

        $pengaturan = PengaturanSekolah::current();

        if ($request->hasFile('logo')) {
            if ($pengaturan->logo_path) {
                Storage::disk('public')->delete($pengaturan->logo_path);
            }
            $data['logo_path'] = $request->file('logo')->store('logo', 'public');
        }

        unset($data['logo']);
        $pengaturan->update($data);

        return back()->with('success', 'Identitas sekolah berhasil disimpan.');
    }

    public function deleteLogo()
    {
        $pengaturan = PengaturanSekolah::current();
        if ($pengaturan->logo_path) {
            Storage::disk('public')->delete($pengaturan->logo_path);
            $pengaturan->update(['logo_path' => null]);
        }
        return back()->with('success', 'Logo berhasil dihapus.');
    }
}
