import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import {
    Settings, Clock, Plus, Trash2, CheckSquare, Square, Save,
    RefreshCw, Building2, ImagePlus, Trash,
} from 'lucide-react';
import { useState, useMemo, useRef } from 'react';

const SEMUA_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

function calcSlots(jamMulai, durasiJp, jumlahJp, istirahat) {
    if (!jamMulai || !durasiJp || !jumlahJp) return [];
    const [h, m] = jamMulai.split(':').map(Number);
    let total = h * 60 + m;
    const fmt = (min) =>
        `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
    const slots = [];
    for (let i = 1; i <= jumlahJp; i++) {
        const mulai = fmt(total);
        total += Number(durasiJp);
        const selesai = fmt(total);
        slots.push({ jam_ke: i, jam_mulai: mulai, jam_selesai: selesai });
        const brk = istirahat.find((b) => Number(b.setelah_jp) === i);
        if (brk) total += Number(brk.durasi_menit);
    }
    return slots;
}

/* ─── Logo Picker ─── */
function LogoPicker({ currentUrl, onSave, onDelete, saving }) {
    const [preview, setPreview] = useState(null);
    const [file, setFile]       = useState(null);
    const fileRef               = useRef();

    const pickFile = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleSave = () => {
        if (!file) return;
        const fd = new FormData();
        fd.append('logo', file);
        onSave(fd, () => { setFile(null); setPreview(null); });
    };

    const imgSrc = preview || currentUrl;

    return (
        <div className="space-y-3">
            <div className="flex items-start gap-4">
                {/* Preview box */}
                <div className="h-24 w-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                    {imgSrc
                        ? <img src={imgSrc} alt="Logo" className="h-full w-full object-contain p-1" />
                        : <Building2 className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                    }
                </div>
                <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo Sekolah</p>
                    <p className="text-xs text-gray-400">PNG, JPG, SVG, WebP — maks. 2 MB. Logo tampil di KOP surat.</p>
                    <div className="flex gap-2 flex-wrap">
                        <button type="button" onClick={() => fileRef.current.click()}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-700 hover:bg-sky-100 transition-colors">
                            <ImagePlus className="h-3.5 w-3.5" />
                            {imgSrc ? 'Ganti Logo' : 'Upload Logo'}
                        </button>
                        {currentUrl && !preview && (
                            <button type="button" onClick={onDelete}
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors">
                                <Trash className="h-3.5 w-3.5" /> Hapus Logo
                            </button>
                        )}
                        {preview && (
                            <Button size="sm" loading={saving} onClick={handleSave}>Simpan Logo</Button>
                        )}
                        {preview && (
                            <button type="button" onClick={() => { setPreview(null); setFile(null); fileRef.current.value = ''; }}
                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2">
                                Batal
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
        </div>
    );
}

export default function PengaturanSekolahIndex({ pengaturan }) {
    /* ── Identitas state ── */
    const [id, setId] = useState({
        nama_sekolah:        pengaturan.nama_sekolah ?? '',
        yayasan_dinas:       pengaturan.yayasan_dinas ?? '',
        npsn:                pengaturan.npsn ?? '',
        alamat:              pengaturan.alamat ?? '',
        kecamatan:           pengaturan.kecamatan ?? '',
        kota:                pengaturan.kota ?? '',
        telepon:             pengaturan.telepon ?? '',
        email_sekolah:       pengaturan.email_sekolah ?? '',
        website:             pengaturan.website ?? '',
        kepala_sekolah_nama: pengaturan.kepala_sekolah_nama ?? '',
        nip_kepala:          pengaturan.nip_kepala ?? '',
    });
    const [savingId,   setSavingId]   = useState(false);
    const [savingLogo, setSavingLogo] = useState(false);

    const saveIdentitas = () => {
        setSavingId(true);
        router.post('/admin/pengaturan-sekolah/identitas', id, { onFinish: () => setSavingId(false) });
    };

    const saveLogo = (fd, done) => {
        setSavingLogo(true);
        router.post('/admin/pengaturan-sekolah/identitas', fd, {
            forceFormData: true,
            onFinish: () => { setSavingLogo(false); done(); },
        });
    };

    const deleteLogo = () => {
        if (!confirm('Hapus logo sekolah?')) return;
        router.delete('/admin/pengaturan-sekolah/logo');
    };

    /* ── Jam belajar state ── */
    const [jamMulai, setJamMulai]   = useState((pengaturan.jam_mulai_sekolah ?? '07:00').substring(0, 5));
    const [durasiJp, setDurasiJp]   = useState(pengaturan.durasi_jp ?? 45);
    const [jumlahJp, setJumlahJp]   = useState(pengaturan.jumlah_jp ?? 10);
    const [istirahat, setIstirahat] = useState(
        pengaturan.istirahat ?? [{ setelah_jp: 3, durasi_menit: 15 }]
    );
    const [hariAktif, setHariAktif] = useState(
        pengaturan.hari_aktif ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
    );
    const [submitting, setSubmitting] = useState(false);

    const slots = useMemo(
        () => calcSlots(jamMulai, durasiJp, jumlahJp, istirahat),
        [jamMulai, durasiJp, jumlahJp, istirahat]
    );

    const addIstirahat    = () => setIstirahat((prev) => [...prev, { setelah_jp: 1, durasi_menit: 15 }]);
    const removeIstirahat = (idx) => setIstirahat((prev) => prev.filter((_, i) => i !== idx));
    const setBreakField   = (idx, key, val) =>
        setIstirahat((prev) => prev.map((b, i) => (i === idx ? { ...b, [key]: Number(val) } : b)));

    const submitJam = () => {
        setSubmitting(true);
        router.put('/admin/pengaturan-sekolah', {
            jam_mulai_sekolah: jamMulai,
            durasi_jp:         Number(durasiJp),
            jumlah_jp:         Number(jumlahJp),
            istirahat,
            hari_aktif:        hariAktif,
        }, { onFinish: () => setSubmitting(false) });
    };

    return (
        <AppLayout title="Pengaturan Sekolah">
            {/* Header */}
            <div className="mb-5 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                    <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Pengaturan Sekolah</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Identitas, jam belajar, istirahat, dan hari aktif</p>
                </div>
            </div>

            {/* ── IDENTITAS SEKOLAH ── */}
            <Card className="mb-6">
                <CardHeader><CardTitle>Identitas Sekolah</CardTitle></CardHeader>
                <CardBody className="space-y-5">
                    {/* Logo */}
                    <LogoPicker
                        currentUrl={pengaturan.logo_url}
                        onSave={saveLogo}
                        onDelete={deleteLogo}
                        saving={savingLogo}
                    />

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <Input label="Nama Sekolah" value={id.nama_sekolah}
                                onChange={e => setId(p => ({ ...p, nama_sekolah: e.target.value }))}
                                placeholder="SMK Contoh Negeri 1" />
                        </div>
                        <div className="sm:col-span-2">
                            <Input label="Yayasan / Dinas" value={id.yayasan_dinas}
                                onChange={e => setId(p => ({ ...p, yayasan_dinas: e.target.value }))}
                                placeholder="Yayasan Pendidikan Maju Bersama / Dinas Pendidikan Prov. ..." />
                        </div>
                        <Input label="NPSN" value={id.npsn}
                            onChange={e => setId(p => ({ ...p, npsn: e.target.value }))}
                            placeholder="12345678" />
                        <Input label="Telepon" value={id.telepon}
                            onChange={e => setId(p => ({ ...p, telepon: e.target.value }))}
                            placeholder="(021) 1234567" />
                        <div className="sm:col-span-2">
                            <Input label="Alamat" value={id.alamat}
                                onChange={e => setId(p => ({ ...p, alamat: e.target.value }))}
                                placeholder="Jl. Contoh No. 1" />
                        </div>
                        <Input label="Kecamatan" value={id.kecamatan}
                            onChange={e => setId(p => ({ ...p, kecamatan: e.target.value }))}
                            placeholder="Kec. Contoh" />
                        <Input label="Kota / Kabupaten" value={id.kota}
                            onChange={e => setId(p => ({ ...p, kota: e.target.value }))}
                            placeholder="Kota Contoh" />
                        <Input label="Email Sekolah" type="email" value={id.email_sekolah}
                            onChange={e => setId(p => ({ ...p, email_sekolah: e.target.value }))}
                            placeholder="info@sekolah.sch.id" />
                        <Input label="Website" value={id.website}
                            onChange={e => setId(p => ({ ...p, website: e.target.value }))}
                            placeholder="www.sekolah.sch.id" />
                        <Input label="Nama Kepala Sekolah" value={id.kepala_sekolah_nama}
                            onChange={e => setId(p => ({ ...p, kepala_sekolah_nama: e.target.value }))}
                            placeholder="Drs. H. Ahmad Santoso, M.Pd." />
                        <Input label="NIP Kepala Sekolah" value={id.nip_kepala}
                            onChange={e => setId(p => ({ ...p, nip_kepala: e.target.value }))}
                            placeholder="196801011990031001" />
                    </div>

                    <div className="flex justify-end pt-1">
                        <Button icon={Save} loading={savingId} onClick={saveIdentitas}>
                            Simpan Identitas
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* ── JAM BELAJAR ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                    <Card>
                        <CardHeader><CardTitle>Waktu Belajar</CardTitle></CardHeader>
                        <CardBody className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Jam Masuk Sekolah
                                </label>
                                <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durasi per JP (menit)</label>
                                    <input type="number" min="15" max="120" value={durasiJp}
                                        onChange={(e) => setDurasiJp(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah JP per Hari</label>
                                    <input type="number" min="1" max="14" value={jumlahJp}
                                        onChange={(e) => setJumlahJp(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>Waktu Istirahat</CardTitle>
                            <button onClick={addIstirahat}
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-700">
                                <Plus className="h-3.5 w-3.5" /> Tambah Istirahat
                            </button>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            {istirahat.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">Belum ada waktu istirahat.</p>
                            )}
                            {istirahat.map((b, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Setelah JP ke-</label>
                                            <input type="number" min="1" max={jumlahJp - 1} value={b.setelah_jp}
                                                onChange={(e) => setBreakField(idx, 'setelah_jp', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Durasi (menit)</label>
                                            <input type="number" min="5" max="120" value={b.durasi_menit}
                                                onChange={(e) => setBreakField(idx, 'durasi_menit', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                        </div>
                                    </div>
                                    <button onClick={() => removeIstirahat(idx)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Hari Aktif Sekolah</CardTitle></CardHeader>
                        <CardBody>
                            <div className="flex flex-wrap gap-2">
                                {SEMUA_HARI.map((h) => {
                                    const aktif = hariAktif.includes(h);
                                    return (
                                        <button key={h}
                                            onClick={() => setHariAktif((prev) =>
                                                prev.includes(h) ? prev.filter((d) => d !== h) : [...prev, h]
                                            )}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                                aktif
                                                    ? 'bg-sky-600 text-white border-sky-600'
                                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-sky-400'
                                            }`}>
                                            {aktif ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                            {h}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                Hari aktif: {hariAktif.length > 0 ? hariAktif.join(', ') : '–'}
                            </p>
                        </CardBody>
                    </Card>

                    <div className="flex justify-end">
                        <Button icon={Save} loading={submitting} onClick={submitJam}>
                            Simpan Jam Belajar
                        </Button>
                    </div>
                </div>

                {/* RIGHT: Live Preview */}
                <div>
                    <Card>
                        <CardHeader className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-sky-500" />
                            <CardTitle>Preview Jadwal JP</CardTitle>
                            <span className="ml-auto text-xs text-gray-400">(otomatis diperbarui)</span>
                        </CardHeader>
                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left font-medium w-16">JP</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Jam Mulai</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Jam Selesai</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Ket.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {slots.map((slot) => {
                                            const brk = istirahat.find((b) => Number(b.setelah_jp) === slot.jam_ke);
                                            return (
                                                <>
                                                    <tr key={slot.jam_ke} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                                        <td className="px-4 py-2.5">
                                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs font-bold">
                                                                {slot.jam_ke}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 font-mono text-gray-700 dark:text-gray-300">{slot.jam_mulai}</td>
                                                        <td className="px-4 py-2.5 font-mono text-gray-700 dark:text-gray-300">{slot.jam_selesai}</td>
                                                        <td className="px-4 py-2.5 text-gray-400 text-xs">{durasiJp} menit</td>
                                                    </tr>
                                                    {brk && (
                                                        <tr key={`brk-${slot.jam_ke}`} className="bg-amber-50 dark:bg-amber-900/10">
                                                            <td className="px-4 py-1.5 text-center">
                                                                <span className="text-xs text-amber-600 dark:text-amber-400">–</span>
                                                            </td>
                                                            <td colSpan={3} className="px-4 py-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                                                                ☕ Istirahat {brk.durasi_menit} menit
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })}
                                        {slots.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                                                    Isi pengaturan di kiri untuk melihat preview.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
