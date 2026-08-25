import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import { Select, Textarea } from '@/Components/ui/Input';
import {
    Calculator, Save, TrendingUp, CheckCircle2, AlertCircle,
    UserCheck, BookOpen, RefreshCw, Crown,
} from 'lucide-react';
import { useState } from 'react';

const BULAN_LABELS = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

function bulanOptions() {
    const now  = new Date();
    const opts = [];
    for (let i = 5; i >= 0; i--) {
        const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const lbl = `${BULAN_LABELS[d.getMonth()]} ${d.getFullYear()}`;
        opts.push({ value: val, label: lbl });
    }
    return opts.reverse();
}

function NilaiBar({ persen }) {
    const barColor = persen >= 80 ? 'bg-emerald-500' : persen >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(persen, 100)}%` }} />
            </div>
            <span className="text-sm font-bold w-12 text-right text-gray-900 dark:text-gray-100">{persen}%</span>
        </div>
    );
}

export default function KPIManajemenIndex({ indikator = [], manajemenList = [], tahunAjaran = [], rekap, filters = {} }) {
    const indHadir  = indikator.find((i) => i.kode === 'KEAKTIFAN_MANAJEMEN')         ?? {};
    const indJurnal = indikator.find((i) => i.kode === 'KEAKTIFAN_JURNAL_MANAJEMEN') ?? {};

    const [bobotHadir,  setBobotHadir]  = useState(Number(indHadir.bobot  ?? 50));
    const [bobotJurnal, setBobotJurnal] = useState(Number(indJurnal.bobot ?? 50));
    const [savingBobot, setSavingBobot] = useState(false);
    const totalBobot = bobotHadir + bobotJurnal;

    const simpanBobot = () => {
        setSavingBobot(true);
        router.post('/admin/kpi-manajemen/bobot', { bobot_hadir: bobotHadir, bobot_jurnal: bobotJurnal }, {
            onFinish: () => setSavingBobot(false),
        });
    };

    const [guruId,      setGuruId]      = useState('');
    const [bulan,       setBulan]       = useState(bulanOptions()[0]?.value ?? '');
    const [tahunId,     setTahunId]     = useState(tahunAjaran.find((t) => t.is_aktif)?.id ?? tahunAjaran[0]?.id ?? '');
    const [catatan,     setCatatan]     = useState('');
    const [hasil,       setHasil]       = useState(null);
    const [sudahSimpan, setSudahSimpan] = useState(false);
    const [menghitung,  setMenghitung]  = useState(false);
    const [menyimpan,   setMenyimpan]   = useState(false);
    const [hitungError, setHitungError] = useState('');

    const hitungKPI = async () => {
        if (!guruId || !bulan) return;
        setMenghitung(true); setHasil(null); setHitungError('');
        try {
            const res  = await fetch(`/admin/kpi-manajemen/hitung?guru_id=${guruId}&bulan=${bulan}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message ?? 'Gagal menghitung.');
            setHasil(json);
            setSudahSimpan(!!json.sudah_disimpan);
        } catch (e) {
            setHitungError(e.message);
        } finally {
            setMenghitung(false);
        }
    };

    const simpanKPI = () => {
        if (!hasil || sudahSimpan) return;
        setMenyimpan(true);
        router.post('/admin/kpi-manajemen', {
            guru_id: guruId, bulan, tahun_ajaran_id: tahunId,
            persen_hadir: hasil.persen_hadir, persen_jurnal: hasil.persen_jurnal,
            catatan,
        }, {
            onSuccess: () => { setHasil(null); setCatatan(''); setSudahSimpan(false); },
            onFinish:  () => setMenyimpan(false),
        });
    };

    const nilaiAkhir = hasil
        ? Math.round((hasil.persen_hadir * bobotHadir / 100 + hasil.persen_jurnal * bobotJurnal / 100) * 10) / 10
        : null;

    return (
        <AppLayout title="KPI Manajemen">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Indikator & Bobot */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-amber-500" />
                                Indikator KPI Manajemen
                            </CardTitle>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Keaktifan Kehadiran</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    Persentase kehadiran berdasarkan hari kerja (Senin–Sabtu minus libur)
                                </p>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bobot (%)</label>
                                <input
                                    type="number" min="0" max="100" step="1"
                                    value={bobotHadir}
                                    onChange={(e) => setBobotHadir(Math.max(0, Math.min(100, Number(e.target.value))))}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Keaktifan Jurnal Pimpinan</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    Persentase hari hadir yang sudah diisi jurnal pimpinan
                                </p>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bobot (%)</label>
                                <input
                                    type="number" min="0" max="100" step="1"
                                    value={bobotJurnal}
                                    onChange={(e) => setBobotJurnal(Math.max(0, Math.min(100, Number(e.target.value))))}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium ${
                                totalBobot === 100
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
                            }`}>
                                <span>Total Bobot</span>
                                <span className="font-bold text-base">{totalBobot}%</span>
                            </div>

                            <Button type="button" icon={Save} className="w-full"
                                disabled={totalBobot !== 100} loading={savingBobot} onClick={simpanBobot}>
                                Simpan Bobot
                            </Button>
                        </CardBody>
                    </Card>
                </div>

                {/* Hitung & Rekap */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hitung KPI Manajemen</CardTitle>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select label="Pilih Pejabat Manajemen" value={guruId}
                                    onChange={(e) => { setGuruId(e.target.value); setHasil(null); }}>
                                    <option value="">— Pilih Pejabat —</option>
                                    {manajemenList.map((g) => (
                                        <option key={g.id} value={g.id}>{g.user?.name}</option>
                                    ))}
                                </Select>
                                <Select label="Bulan" value={bulan}
                                    onChange={(e) => { setBulan(e.target.value); setHasil(null); }}>
                                    {bulanOptions().map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </Select>
                            </div>

                            <Button type="button" icon={Calculator}
                                disabled={!guruId || !bulan || menghitung} loading={menghitung} onClick={hitungKPI}>
                                Hitung Otomatis
                            </Button>

                            {hitungError && (
                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4 shrink-0" /> {hitungError}
                                </div>
                            )}

                            {hasil && (
                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
                                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Hasil Perhitungan</p>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="h-4 w-4 text-amber-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keaktifan Kehadiran</span>
                                                    <span className="text-xs text-gray-400">bobot {bobotHadir}%</span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {hasil.detail_hadir.hadir} hadir / {hasil.detail_hadir.hari_kerja} hari kerja
                                                </span>
                                            </div>
                                            <NilaiBar persen={hasil.persen_hadir} />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-emerald-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keaktifan Jurnal Pimpinan</span>
                                                    <span className="text-xs text-gray-400">bobot {bobotJurnal}%</span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {hasil.detail_jurnal.terisi} / {hasil.detail_jurnal.terjadwal} hari hadir terisi
                                                </span>
                                            </div>
                                            <NilaiBar persen={hasil.persen_jurnal} />
                                        </div>

                                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-amber-500" />
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Nilai KPI Akhir</span>
                                            </div>
                                            <span className={`text-2xl font-black ${
                                                nilaiAkhir >= 80 ? 'text-emerald-600 dark:text-emerald-400'
                                                : nilaiAkhir >= 60 ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>{nilaiAkhir}</span>
                                        </div>

                                        <div className="space-y-3 pt-1">
                                            <Select label="Tahun Ajaran" value={tahunId} onChange={(e) => setTahunId(e.target.value)}>
                                                {tahunAjaran.map((t) => (
                                                    <option key={t.id} value={t.id}>{t.nama} – {t.semester}</option>
                                                ))}
                                            </Select>
                                            <Textarea label="Catatan (opsional)" value={catatan}
                                                onChange={(e) => setCatatan(e.target.value)} rows={2}
                                                placeholder="Catatan tambahan..." />
                                            {sudahSimpan && (
                                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm text-amber-700 dark:text-amber-300">
                                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                                                    KPI bulan ini sudah tersimpan dan tidak dapat diubah.
                                                </div>
                                            )}
                                            <div className="flex justify-end gap-3">
                                                <Button type="button" variant="secondary" icon={RefreshCw}
                                                    onClick={() => { setHasil(null); setSudahSimpan(false); }}>
                                                    Hitung Ulang
                                                </Button>
                                                <Button type="button" icon={Save} loading={menyimpan}
                                                    disabled={sudahSimpan} onClick={simpanKPI}>
                                                    Simpan KPI
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Rekap tersimpan */}
                    <Card>
                        <CardHeader><CardTitle>Rekap KPI Tersimpan</CardTitle></CardHeader>
                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-amber-50 dark:bg-amber-900/20 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Pejabat</th>
                                            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Bulan</th>
                                            <th className="px-4 py-3 text-left font-medium">Indikator</th>
                                            <th className="px-4 py-3 text-left font-medium">Persen</th>
                                            <th className="px-4 py-3 text-center font-medium hidden sm:table-cell">Bobot</th>
                                            <th className="px-4 py-3 text-left font-medium">Nilai</th>
                                            <th className="px-4 py-3 text-left font-medium"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {rekap.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <img src={item.guru?.user?.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                            {item.guru?.user?.name ?? '–'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">
                                                    {item.bulan ? (() => {
                                                        const [y, m] = item.bulan.split('-');
                                                        return `${BULAN_LABELS[parseInt(m) - 1]} ${y}`;
                                                    })() : '–'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge color={item.indikator?.kode === 'KEAKTIFAN_MANAJEMEN' ? 'amber' : 'green'} className="whitespace-nowrap">
                                                        {item.indikator?.nama ?? '–'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 min-w-28">
                                                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                                                            <div className={`h-1.5 rounded-full ${
                                                                item.persen >= 80 ? 'bg-emerald-500' : item.persen >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`} style={{ width: `${Math.min(item.persen, 100)}%` }} />
                                                        </div>
                                                        <span className="text-gray-700 dark:text-gray-300 font-medium w-10 text-right">{item.persen}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-center hidden sm:table-cell">{item.bobot_snapshot}%</td>
                                                <td className="px-4 py-3">
                                                    <span className={`font-bold text-base ${
                                                        item.nilai >= 80 ? 'text-emerald-600 dark:text-emerald-400'
                                                        : item.nilai >= 60 ? 'text-yellow-600 dark:text-yellow-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                    }`}>{item.nilai}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.nilai >= 80
                                                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                        : <AlertCircle className="h-4 w-4 text-amber-500" />}
                                                </td>
                                            </tr>
                                        ))}
                                        {rekap.data.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                                                    Belum ada data KPI. Hitung KPI di atas untuk memulai.
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
