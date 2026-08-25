import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import { Select, Textarea } from '@/Components/ui/Input';
import {
    Calculator, Save, TrendingUp, CheckCircle2, AlertCircle,
    CalendarDays, UserCheck, BookOpen, RefreshCw, Crown,
} from 'lucide-react';
import { useState } from 'react';

const BULAN_LABELS = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

function bulanOptions() {
    const now   = new Date();
    const opts  = [];
    for (let i = 5; i >= 0; i--) {
        const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const lbl = `${BULAN_LABELS[d.getMonth()]} ${d.getFullYear()}`;
        opts.push({ value: val, label: lbl });
    }
    return opts.reverse();
}

function NilaiBar({ persen, color = 'indigo' }) {
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

export default function KPIIndex({ indikator = [], guruList = [], tahunAjaran = [], rekap, filters = {} }) {
    const indGuru      = indikator.find((i) => i.kode === 'KEAKTIFAN_GURU')          ?? {};
    const indJurnal    = indikator.find((i) => i.kode === 'KEAKTIFAN_JURNAL')        ?? {};
    const indManajemen = indikator.find((i) => i.kode === 'KEAKTIFAN_MANAJEMEN_GURU') ?? {};

    // ── State bobot ───────────────────────────────────────────────────
    const [bobotGuru,      setBobotGuru]      = useState(Number(indGuru.bobot      ?? 50));
    const [bobotJurnal,    setBobotJurnal]    = useState(Number(indJurnal.bobot    ?? 50));
    const [bobotManajemen, setBobotManajemen] = useState(Number(indManajemen.bobot ?? 0));
    const [savingBobot,    setSavingBobot]    = useState(false);
    const totalBobot = bobotGuru + bobotJurnal + bobotManajemen;

    const simpanBobot = () => {
        setSavingBobot(true);
        router.post('/admin/kpi/bobot', {
            bobot_guru: bobotGuru, bobot_jurnal: bobotJurnal, bobot_manajemen: bobotManajemen,
        }, {
            onFinish: () => setSavingBobot(false),
        });
    };

    // ── State hitung KPI ─────────────────────────────────────────────
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
        setMenghitung(true);
        setHasil(null);
        setHitungError('');
        try {
            const res  = await fetch(`/admin/kpi/hitung?guru_id=${guruId}&bulan=${bulan}`, {
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
        const payload = {
            guru_id: guruId, bulan, tahun_ajaran_id: tahunId,
            persen_guru: hasil.persen_guru, persen_jurnal: hasil.persen_jurnal,
            catatan,
        };
        if (hasil.is_manajemen && hasil.persen_manajemen !== null) {
            payload.persen_manajemen = hasil.persen_manajemen;
        }
        router.post('/admin/kpi', payload, {
            onSuccess: () => { setHasil(null); setCatatan(''); setSudahSimpan(false); },
            onFinish: () => setMenyimpan(false),
        });
    };

    // Nilai akhir tertimbang
    const nilaiAkhir = hasil
        ? Math.round((
            hasil.persen_guru    * bobotGuru    / 100
          + hasil.persen_jurnal  * bobotJurnal  / 100
          + (hasil.is_manajemen && hasil.persen_manajemen !== null
                ? hasil.persen_manajemen * bobotManajemen / 100
                : 0)
          ) * 10) / 10
        : null;

    const badgeColor = (kode) => {
        if (kode === 'KEAKTIFAN_GURU')           return 'blue';
        if (kode === 'KEAKTIFAN_JURNAL')          return 'green';
        if (kode === 'KEAKTIFAN_MANAJEMEN_GURU')  return 'yellow';
        return 'gray';
    };

    return (
        <AppLayout title="KPI Guru">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Panel kiri: Indikator & Bobot ─────────────────── */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Indikator KPI</CardTitle>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {/* Keaktifan Guru */}
                            <div className="p-4 rounded-xl border border-sky-100 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Keaktifan Guru</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    Persentase kehadiran guru berdasarkan data presensi harian
                                </p>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bobot (%)</label>
                                <input
                                    type="number" min="0" max="100" step="1"
                                    value={bobotGuru}
                                    onChange={(e) => setBobotGuru(Math.max(0, Math.min(100, Number(e.target.value))))}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            {/* Keaktifan Jurnal */}
                            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Keaktifan Jurnal</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    Persentase JP terjadwal yang sudah diisi jurnal mengajar
                                </p>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bobot (%)</label>
                                <input
                                    type="number" min="0" max="100" step="1"
                                    value={bobotJurnal}
                                    onChange={(e) => setBobotJurnal(Math.max(0, Math.min(100, Number(e.target.value))))}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Kehadiran Manajemen */}
                            <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Kehadiran Manajemen</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    Persentase kehadiran guru yang menjabat sebagai manajemen (bobot 0 = tidak dihitung)
                                </p>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bobot (%)</label>
                                <input
                                    type="number" min="0" max="100" step="1"
                                    value={bobotManajemen}
                                    onChange={(e) => setBobotManajemen(Math.max(0, Math.min(100, Number(e.target.value))))}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            {/* Total bobot indicator */}
                            <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium ${
                                totalBobot === 100
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
                            }`}>
                                <span>Total Bobot</span>
                                <span className="font-bold text-base">{totalBobot}%</span>
                            </div>

                            <Button
                                type="button"
                                icon={Save}
                                className="w-full"
                                disabled={totalBobot !== 100}
                                loading={savingBobot}
                                onClick={simpanBobot}
                            >
                                Simpan Bobot
                            </Button>
                        </CardBody>
                    </Card>
                </div>

                {/* ── Panel kanan: Hitung & Rekap ───────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Form Hitung KPI */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hitung KPI Guru</CardTitle>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                    label="Pilih Guru"
                                    value={guruId}
                                    onChange={(e) => { setGuruId(e.target.value); setHasil(null); }}
                                >
                                    <option value="">— Pilih Guru —</option>
                                    {guruList.map((g) => (
                                        <option key={g.id} value={g.id}>{g.user?.name}</option>
                                    ))}
                                </Select>
                                <Select
                                    label="Bulan"
                                    value={bulan}
                                    onChange={(e) => { setBulan(e.target.value); setHasil(null); }}
                                >
                                    {bulanOptions().map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </Select>
                            </div>

                            <Button
                                type="button"
                                icon={Calculator}
                                disabled={!guruId || !bulan || menghitung}
                                loading={menghitung}
                                onClick={hitungKPI}
                            >
                                Hitung Otomatis
                            </Button>

                            {hitungError && (
                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4 shrink-0" /> {hitungError}
                                </div>
                            )}

                            {/* Hasil Perhitungan */}
                            {hasil && (
                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hasil Perhitungan</p>
                                        {hasil.is_manajemen && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                                                <Crown className="h-3 w-3" /> Guru Manajemen
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {/* Keaktifan Guru */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="h-4 w-4 text-sky-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keaktifan Guru</span>
                                                    <span className="text-xs text-gray-400">bobot {bobotGuru}%</span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {hasil.detail_guru.hadir} hadir / {hasil.detail_guru.total} hari tercatat
                                                </span>
                                            </div>
                                            <NilaiBar persen={hasil.persen_guru} />
                                        </div>

                                        {/* Keaktifan Jurnal */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-emerald-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keaktifan Jurnal</span>
                                                    <span className="text-xs text-gray-400">bobot {bobotJurnal}%</span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {hasil.detail_jurnal.terisi} / {hasil.detail_jurnal.terjadwal} JP terisi
                                                </span>
                                            </div>
                                            <NilaiBar persen={hasil.persen_jurnal} />
                                        </div>

                                        {/* Kehadiran Manajemen (hanya jika guru manajemen) */}
                                        {hasil.is_manajemen && hasil.persen_manajemen !== null && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Crown className="h-4 w-4 text-amber-500" />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kehadiran Manajemen</span>
                                                        <span className="text-xs text-gray-400">bobot {bobotManajemen}%</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {hasil.detail_manajemen.hadir} hadir / {hasil.detail_manajemen.hari_kerja} hari kerja
                                                    </span>
                                                </div>
                                                <NilaiBar persen={hasil.persen_manajemen} />
                                            </div>
                                        )}

                                        {/* Nilai Akhir */}
                                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Nilai KPI Akhir</span>
                                            </div>
                                            <span className={`text-2xl font-black ${
                                                nilaiAkhir >= 80 ? 'text-emerald-600 dark:text-emerald-400'
                                                : nilaiAkhir >= 60 ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>{nilaiAkhir}</span>
                                        </div>

                                        {/* Catatan + Simpan */}
                                        <div className="space-y-3 pt-1">
                                            <Select label="Tahun Ajaran" value={tahunId} onChange={(e) => setTahunId(e.target.value)}>
                                                {tahunAjaran.map((t) => (
                                                    <option key={t.id} value={t.id}>{t.nama} – {t.semester}</option>
                                                ))}
                                            </Select>
                                            <Textarea
                                                label="Catatan (opsional)"
                                                value={catatan}
                                                onChange={(e) => setCatatan(e.target.value)}
                                                rows={2}
                                                placeholder="Catatan tambahan..."
                                            />
                                            {sudahSimpan && (
                                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm text-amber-700 dark:text-amber-300">
                                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                                                    KPI bulan ini sudah tersimpan dan tidak dapat diubah.
                                                </div>
                                            )}
                                            <div className="flex justify-end gap-3">
                                                <Button type="button" variant="secondary" icon={RefreshCw} onClick={() => { setHasil(null); setSudahSimpan(false); }}>
                                                    Hitung Ulang
                                                </Button>
                                                <Button type="button" icon={Save} loading={menyimpan} disabled={sudahSimpan} onClick={simpanKPI}>
                                                    Simpan KPI
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Rekap KPI tersimpan */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Rekap KPI Tersimpan</CardTitle>
                        </CardHeader>
                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Guru</th>
                                            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Bulan</th>
                                            <th className="px-4 py-3 text-left font-medium">Indikator</th>
                                            <th className="px-4 py-3 text-left font-medium">Persen</th>
                                            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Bobot</th>
                                            <th className="px-4 py-3 text-left font-medium">Nilai</th>
                                            <th className="px-4 py-3 text-left font-medium"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {rekap.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                                                    <Badge color={badgeColor(item.indikator?.kode)} className="whitespace-nowrap">
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
                                                        : <AlertCircle className="h-4 w-4 text-amber-500" />
                                                    }
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
