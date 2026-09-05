import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import { Select, Textarea } from '@/Components/ui/Input';
import {
    Calculator, Save, TrendingUp, CheckCircle2, AlertCircle,
    UserCheck, BookOpen, RefreshCw, Search, X, ChevronDown,
    Play, BarChart2, AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

const BULAN_LABELS = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

function bulanOptions() {
    const now = new Date();
    const opts = [];
    for (let i = 5; i >= 0; i--) {
        const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        opts.push({ value: val, label: `${BULAN_LABELS[d.getMonth()]} ${d.getFullYear()}` });
    }
    return opts.reverse();
}

function bulanLabel(val) {
    if (!val) return '–';
    const [y, m] = val.split('-');
    return `${BULAN_LABELS[parseInt(m) - 1]} ${y}`;
}

function PersonSearchSelect({ list, value, onChange, placeholder, emptyLabel }) {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState('');
    const ref               = useRef(null);
    const inputRef          = useRef(null);
    const selected          = list.find((p) => String(p.id) === String(value));
    const filtered          = query ? list.filter((p) => (p.user?.name ?? '').toLowerCase().includes(query.toLowerCase())) : list;
    const pick              = useCallback((id) => { onChange(id); setOpen(false); setQuery(''); }, [onChange]);

    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);
    useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm hover:border-violet-400 dark:hover:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors">
                <span className={`truncate ${value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                    {selected ? (selected.user?.name ?? '-') : emptyLabel}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                    <div className="flex items-center gap-2 p-2 border-b border-gray-100 dark:border-gray-700">
                        <Search className="h-4 w-4 shrink-0 text-gray-400" />
                        <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none" />
                        {query && (
                            <button type="button" onClick={() => setQuery('')} className="shrink-0 text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <ul className="max-h-56 overflow-y-auto py-1">
                        <li>
                            <button type="button" onClick={() => pick('')}
                                className={`w-full px-3 py-2 text-left text-sm transition-colors ${!value ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                {emptyLabel}
                            </button>
                        </li>
                        {filtered.length === 0
                            ? <li className="px-3 py-4 text-center text-sm text-gray-400">Tidak ditemukan</li>
                            : filtered.map((p) => (
                                <li key={p.id}>
                                    <button type="button" onClick={() => pick(String(p.id))}
                                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${String(value) === String(p.id) ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                        {p.user?.name ?? '-'}
                                    </button>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            )}
        </div>
    );
}

function NilaiBar({ persen }) {
    const cls = persen >= 80 ? 'bg-emerald-500' : persen >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className={`h-2 rounded-full transition-all ${cls}`} style={{ width: `${Math.min(persen, 100)}%` }} />
            </div>
            <span className="text-sm font-bold w-12 text-right tabular-nums text-gray-900 dark:text-gray-100">{persen}%</span>
        </div>
    );
}

function ConfirmBatchModal({ open, onClose, onConfirm, bulan, loading }) {
    const [force, setForce] = useState(false);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="px-6 py-4 bg-linear-to-r from-violet-500 to-purple-600">
                    <div className="flex items-center gap-3">
                        <Play className="h-5 w-5 text-white" />
                        <h2 className="text-base font-bold text-white">Hitung Batch KPI Tata Usaha</h2>
                    </div>
                    <p className="text-xs text-white/80 mt-1">Hitung otomatis semua Tata Usaha aktif — {bulanLabel(bulan)}</p>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sistem akan menghitung KPI untuk semua tata usaha aktif berdasarkan data absensi dan jurnal bulan
                        <strong className="text-gray-900 dark:text-gray-100"> {bulanLabel(bulan)}</strong>.
                    </p>
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 cursor-pointer">
                        <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)}
                            className="mt-0.5 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Timpa data yang sudah ada</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                Jika tidak dicentang, tata usaha yang sudah memiliki KPI di bulan ini akan dilewati.
                            </p>
                        </div>
                    </label>
                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            Batal
                        </button>
                        <Button type="button" icon={Play} loading={loading} onClick={() => onConfirm(force)}>
                            Mulai Hitung
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function KPITatausahaIndex({ indikator = [], tuList = [], tahunAjaran = [], pengaturan = {}, rekap, filters = {} }) {
    // Bobot dari pengaturan (KpiPengaturan table)
    const [bobotTu,     setBobotTu]     = useState(Number(pengaturan.TU_KEAKTIFAN ?? 50));
    const [bobotJurnal, setBobotJurnal] = useState(Number(pengaturan.TU_JURNAL    ?? 50));
    const [savingBobot, setSavingBobot] = useState(false);
    const [showBatch,   setShowBatch]   = useState(false);
    const [batchLoad,   setBatchLoad]   = useState(false);

    const totalBobot = bobotTu + bobotJurnal;
    const valid      = Math.abs(totalBobot - 100) < 0.01;

    const [tahunId, setTahunId] = useState(tahunAjaran.find((t) => t.is_aktif)?.id ?? tahunAjaran[0]?.id ?? '');
    const [batchBulan, setBatchBulan] = useState(bulanOptions()[0]?.value ?? '');

    const simpanBobot = () => {
        if (!valid) return;
        setSavingBobot(true);
        router.post('/admin/kpi-tatausaha/bobot', { bobot_tu: bobotTu, bobot_jurnal: bobotJurnal }, {
            onFinish: () => setSavingBobot(false),
        });
    };

    const doBatch = (force) => {
        setBatchLoad(true);
        router.post('/admin/kpi-tatausaha/hitung-batch', {
            bulan: batchBulan, tahun_ajaran_id: tahunId, force_update: force,
        }, {
            onFinish: () => { setBatchLoad(false); setShowBatch(false); },
        });
    };

    // ── Hitung Individual ────────────────────────────────────────────────────
    const [tuId,        setTuId]        = useState('');
    const [bulan,       setBulan]       = useState(bulanOptions()[0]?.value ?? '');
    const [catatan,     setCatatan]     = useState('');
    const [hasil,       setHasil]       = useState(null);
    const [menghitung,  setMenghitung]  = useState(false);
    const [menyimpan,   setMenyimpan]   = useState(false);
    const [hitungError, setHitungError] = useState('');
    const [konfirmSave, setKonfirmSave] = useState(false);

    const reset = () => { setHasil(null); setHitungError(''); setKonfirmSave(false); };

    const hitungKPI = async () => {
        if (!tuId || !bulan) return;
        setMenghitung(true); reset();
        try {
            const res  = await fetch(`/admin/kpi-tatausaha/hitung?tatausaha_id=${tuId}&bulan=${bulan}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message ?? 'Gagal menghitung.');
            setHasil(json);
        } catch (e) {
            setHitungError(e.message);
        } finally {
            setMenghitung(false);
        }
    };

    const simpanKPI = () => {
        if (!hasil) return;
        setMenyimpan(true);
        const payload = {
            tatausaha_id: tuId, bulan, tahun_ajaran_id: tahunId,
            persen_tu: hasil.persen_tu, persen_jurnal: hasil.persen_jurnal,
            catatan,
        };
        if (hasil.sudah_disimpan && hasil.bobot_berubah) payload.force_update = true;
        router.post('/admin/kpi-tatausaha', payload, {
            onSuccess: () => { reset(); setCatatan(''); },
            onFinish:  () => setMenyimpan(false),
        });
    };

    const nilaiAkhir = hasil
        ? Math.round((hasil.persen_tu * bobotTu / 100 + hasil.persen_jurnal * bobotJurnal / 100) * 10) / 10
        : null;

    const canSave = hasil && !(hasil.sudah_disimpan && !hasil.bobot_berubah) && !(hasil.sudah_disimpan && hasil.bobot_berubah && !konfirmSave);

    // ── Rekap filter ────────────────────────────────────────────────────────
    const [bulanFilter, setBulanFilter] = useState(filters.bulan ?? '');
    const applyFilter = () => {
        router.get('/admin/kpi-tatausaha', { bulan: bulanFilter || undefined }, { preserveState: true });
    };

    return (
        <AppLayout title="KPI Tata Usaha">
            <div className="flex justify-end mb-4">
                <a href="/admin/kpi/ranking"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <BarChart2 className="h-4 w-4" />
                    Lihat Ranking
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Bobot + Batch */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Pengaturan Bobot</CardTitle></CardHeader>
                        <CardBody className="space-y-3">
                            <div className="p-3.5 rounded-xl border border-violet-100 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30">
                                <div className="flex items-center gap-2 mb-1 text-violet-600 dark:text-violet-400">
                                    <UserCheck className="h-4 w-4" />
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Keaktifan Kehadiran</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Persentase kehadiran berdasarkan presensi harian</p>
                                <div className="flex items-center gap-2">
                                    <input type="number" min="0" max="100" step="1" value={bobotTu}
                                        onChange={(e) => setBobotTu(Math.max(0, Math.min(100, Number(e.target.value))))}
                                        className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                    <span className="text-sm text-gray-500">%</span>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
                                <div className="flex items-center gap-2 mb-1 text-emerald-600 dark:text-emerald-400">
                                    <BookOpen className="h-4 w-4" />
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Keaktifan Jurnal TU</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Persentase hari hadir yang sudah diisi jurnal</p>
                                <div className="flex items-center gap-2">
                                    <input type="number" min="0" max="100" step="1" value={bobotJurnal}
                                        onChange={(e) => setBobotJurnal(Math.max(0, Math.min(100, Number(e.target.value))))}
                                        className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                    <span className="text-sm text-gray-500">%</span>
                                </div>
                            </div>

                            <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium border ${valid ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700'}`}>
                                <span>Total Bobot</span>
                                <span className="font-bold tabular-nums">{totalBobot}%</span>
                            </div>
                            {!valid && (
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Total harus tepat 100%
                                </p>
                            )}
                            <Button type="button" icon={Save} className="w-full" disabled={!valid} loading={savingBobot} onClick={simpanBobot}>
                                Simpan Bobot
                            </Button>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="space-y-3">
                            <div className="rounded-xl p-4 bg-linear-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-700">
                                <div className="flex items-center gap-2 mb-1 font-semibold text-sm text-violet-700 dark:text-violet-300">
                                    <Play className="h-4 w-4" />
                                    Hitung Semua Tata Usaha
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Hitung KPI sekaligus untuk semua tata usaha aktif</p>
                            </div>
                            <Select label="Bulan" value={batchBulan} onChange={(e) => setBatchBulan(e.target.value)}>
                                {bulanOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Select>
                            <Select label="Tahun Ajaran" value={tahunId} onChange={(e) => setTahunId(e.target.value)}>
                                {tahunAjaran.map((t) => <option key={t.id} value={t.id}>{t.nama} – {t.semester}</option>)}
                            </Select>
                            <Button type="button" icon={Play} className="w-full !bg-violet-500 hover:!bg-violet-600 !text-white !border-0"
                                onClick={() => setShowBatch(true)}>
                                Hitung Batch
                            </Button>
                        </CardBody>
                    </Card>
                </div>

                {/* Hitung Individual + Rekap */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Hitung KPI Tata Usaha</CardTitle></CardHeader>
                        <CardBody className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Tata Usaha</label>
                                    <PersonSearchSelect list={tuList} value={tuId}
                                        onChange={(id) => { setTuId(id); reset(); }}
                                        placeholder="Cari nama tata usaha..." emptyLabel="— Pilih Tata Usaha —" />
                                </div>
                                <Select label="Bulan" value={bulan} onChange={(e) => { setBulan(e.target.value); reset(); }}>
                                    {bulanOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </Select>
                            </div>

                            <Button type="button" icon={Calculator} disabled={!tuId || !bulan || menghitung} loading={menghitung} onClick={hitungKPI}>
                                Hitung Otomatis
                            </Button>

                            {hitungError && (
                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4 shrink-0" /> {hitungError}
                                </div>
                            )}

                            {hasil && (
                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hasil Perhitungan</p>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="h-4 w-4 text-violet-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keaktifan Kehadiran</span>
                                                    <span className="text-xs text-gray-400">bobot {bobotTu}%</span>
                                                </div>
                                                <span className="text-xs text-gray-500">{hasil.detail_tu.hadir} / {hasil.detail_tu.total} hari</span>
                                            </div>
                                            <NilaiBar persen={hasil.persen_tu} />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-emerald-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keaktifan Jurnal TU</span>
                                                    <span className="text-xs text-gray-400">bobot {bobotJurnal}%</span>
                                                </div>
                                                <span className="text-xs text-gray-500">{hasil.detail_jurnal.terisi} / {hasil.detail_jurnal.terjadwal} hari</span>
                                            </div>
                                            <NilaiBar persen={hasil.persen_jurnal} />
                                        </div>
                                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Nilai KPI Akhir</span>
                                            </div>
                                            <span className={`text-2xl font-black tabular-nums ${nilaiAkhir >= 80 ? 'text-emerald-600 dark:text-emerald-400' : nilaiAkhir >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {nilaiAkhir}
                                            </span>
                                        </div>

                                        {hasil.sudah_disimpan && !hasil.bobot_berubah && (
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm text-amber-700 dark:text-amber-300">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                                                KPI bulan ini sudah tersimpan dan tidak dapat diubah.
                                            </div>
                                        )}
                                        {hasil.sudah_disimpan && hasil.bobot_berubah && (
                                            <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 cursor-pointer">
                                                <input type="checkbox" checked={konfirmSave} onChange={(e) => setKonfirmSave(e.target.checked)}
                                                    className="mt-0.5 rounded border-amber-400 text-amber-500 focus:ring-amber-500" />
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        Bobot KPI berubah sejak terakhir disimpan
                                                    </div>
                                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                                        Centang untuk mengizinkan penyimpanan ulang dengan bobot terbaru
                                                    </p>
                                                </div>
                                            </label>
                                        )}

                                        <div className="space-y-3 pt-1">
                                            <Select label="Tahun Ajaran" value={tahunId} onChange={(e) => setTahunId(e.target.value)}>
                                                {tahunAjaran.map((t) => <option key={t.id} value={t.id}>{t.nama} – {t.semester}</option>)}
                                            </Select>
                                            <Textarea label="Catatan (opsional)" value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} placeholder="Catatan tambahan..." />
                                            <div className="flex justify-end gap-3">
                                                <Button type="button" variant="secondary" icon={RefreshCw} onClick={reset}>Hitung Ulang</Button>
                                                <Button type="button" icon={Save} loading={menyimpan} disabled={!canSave} onClick={simpanKPI}>
                                                    {hasil.sudah_disimpan && hasil.bobot_berubah ? 'Simpan Ulang' : 'Simpan KPI'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Rekap */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-wrap items-center gap-3">
                                <CardTitle>Rekap KPI Tersimpan</CardTitle>
                                <div className="flex items-center gap-2 ml-auto">
                                    <select value={bulanFilter} onChange={(e) => setBulanFilter(e.target.value)}
                                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-2.5 py-1.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
                                        <option value="">Semua Bulan</option>
                                        {bulanOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                    <button type="button" onClick={applyFilter}
                                        className="px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors">
                                        Filter
                                    </button>
                                    {bulanFilter && (
                                        <button type="button" onClick={() => { setBulanFilter(''); router.get('/admin/kpi-tatausaha', {}, { preserveState: true }); }}
                                            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Tata Usaha</th>
                                            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Bulan</th>
                                            <th className="px-4 py-3 text-left font-medium">Indikator</th>
                                            <th className="px-4 py-3 text-left font-medium">Persen</th>
                                            <th className="px-4 py-3 text-center font-medium hidden sm:table-cell">Bobot</th>
                                            <th className="px-4 py-3 text-right font-medium">Nilai</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {rekap.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <img src={item.tatausaha?.user?.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                            {item.tatausaha?.user?.name ?? '–'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">{bulanLabel(item.bulan)}</td>
                                                <td className="px-4 py-3">
                                                    <Badge color={item.indikator?.kode === 'KEAKTIFAN_TU' ? 'violet' : 'green'} className="whitespace-nowrap">
                                                        {item.indikator?.nama ?? '–'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 min-w-28">
                                                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                                                            <div className={`h-1.5 rounded-full ${item.persen >= 80 ? 'bg-emerald-500' : item.persen >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                style={{ width: `${Math.min(item.persen, 100)}%` }} />
                                                        </div>
                                                        <span className="text-gray-700 dark:text-gray-300 font-medium w-10 text-right tabular-nums">{item.persen}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-center tabular-nums hidden sm:table-cell">{item.bobot_snapshot}%</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`font-bold tabular-nums ${item.nilai >= 80 ? 'text-emerald-600 dark:text-emerald-400' : item.nilai >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {item.nilai}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {rekap.data.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                                                    Belum ada data KPI.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {rekap.last_page > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                                    <span>Halaman {rekap.current_page} dari {rekap.last_page}</span>
                                    <div className="flex gap-1">
                                        {rekap.links.filter((l) => l.url).map((link, i) => (
                                            <button key={i} onClick={() => router.get(link.url, {}, { preserveState: true })}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${link.active ? 'bg-violet-500 text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            <ConfirmBatchModal open={showBatch} onClose={() => setShowBatch(false)} onConfirm={doBatch} bulan={batchBulan} loading={batchLoad} />
        </AppLayout>
    );
}
