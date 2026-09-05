import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import { Select, Textarea } from '@/Components/ui/Input';
import {
    Calculator, Save, TrendingUp, CheckCircle2, AlertCircle,
    UserCheck, BookOpen, RefreshCw, Crown, Search, X, ChevronDown,
    Play, BarChart2, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

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
        opts.push({ value: val, label: `${BULAN_LABELS[d.getMonth()]} ${d.getFullYear()}` });
    }
    return opts.reverse();
}

function bulanLabel(val) {
    if (!val) return '–';
    const [y, m] = val.split('-');
    return `${BULAN_LABELS[parseInt(m) - 1]} ${y}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm hover:border-sky-400 dark:hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors">
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
                                className={`w-full px-3 py-2 text-left text-sm transition-colors ${!value ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-medium' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                {emptyLabel}
                            </button>
                        </li>
                        {filtered.length === 0
                            ? <li className="px-3 py-4 text-center text-sm text-gray-400">Tidak ditemukan</li>
                            : filtered.map((p) => (
                                <li key={p.id}>
                                    <button type="button" onClick={() => pick(String(p.id))}
                                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${String(value) === String(p.id) ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
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

function ConfirmBatchModal({ open, onClose, onConfirm, tipe, bulan, loading }) {
    const [force, setForce] = useState(false);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className={`px-6 py-4 ${tipe === 'manajemen' ? 'bg-linear-to-r from-amber-500 to-orange-500' : 'bg-linear-to-r from-sky-500 to-blue-600'}`}>
                    <div className="flex items-center gap-3">
                        <Play className="h-5 w-5 text-white" />
                        <h2 className="text-base font-bold text-white">Hitung Batch KPI</h2>
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                        Hitung otomatis semua {tipe === 'manajemen' ? 'Guru Manajemen' : 'Guru Biasa'} — {bulanLabel(bulan)}
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sistem akan menghitung KPI untuk semua guru {tipe === 'manajemen' ? 'manajemen' : 'biasa'} yang aktif
                        berdasarkan data absensi dan jurnal bulan <strong className="text-gray-900 dark:text-gray-100">{bulanLabel(bulan)}</strong>.
                    </p>
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 cursor-pointer">
                        <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)}
                            className="mt-0.5 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Timpa data yang sudah ada</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                Jika tidak dicentang, guru yang sudah memiliki KPI di bulan ini akan dilewati.
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

// ── Bobot Panel ───────────────────────────────────────────────────────────────

function BobotPanel({ tipe, pengaturan, tahunAjaran }) {
    const isMgmt = tipe === 'manajemen';

    const [bGuru,      setBGuru]      = useState(Number(isMgmt ? (pengaturan.MGT_GURU ?? 40)      : (pengaturan.BIASA_GURU ?? 50)));
    const [bJurnal,    setBJurnal]    = useState(Number(isMgmt ? (pengaturan.MGT_JURNAL ?? 30)    : (pengaturan.BIASA_JURNAL ?? 50)));
    const [bManajemen, setBManajemen] = useState(Number(pengaturan.MGT_MANAJEMEN ?? 30));
    const [saving,     setSaving]     = useState(false);
    const [showBatch,  setShowBatch]  = useState(false);
    const [batchLoad,  setBatchLoad]  = useState(false);

    const totalBobot = isMgmt ? bGuru + bJurnal + bManajemen : bGuru + bJurnal;
    const valid      = Math.abs(totalBobot - 100) < 0.01;

    const simpanBobot = () => {
        if (!valid) return;
        setSaving(true);
        const payload = { tipe, bobot_guru: bGuru, bobot_jurnal: bJurnal };
        if (isMgmt) payload.bobot_manajemen = bManajemen;
        router.post('/admin/kpi/bobot', payload, { onFinish: () => setSaving(false) });
    };

    const [tahunId,    setTahunId]    = useState(tahunAjaran.find((t) => t.is_aktif)?.id ?? tahunAjaran[0]?.id ?? '');
    const [batchBulan, setBatchBulan] = useState(bulanOptions()[0]?.value ?? '');

    const doBatch = (force) => {
        setBatchLoad(true);
        router.post('/admin/kpi/hitung-batch', {
            tipe, bulan: batchBulan, tahun_ajaran_id: tahunId, force_update: force,
        }, {
            onFinish: () => { setBatchLoad(false); setShowBatch(false); },
        });
    };

    const indikatorItems = [
        {
            key: 'guru',
            label: 'Keaktifan Guru',
            desc: 'Persentase kehadiran berdasarkan presensi harian',
            icon: <UserCheck className="h-4 w-4" />,
            color: 'sky',
            val: bGuru, set: setBGuru,
        },
        {
            key: 'jurnal',
            label: 'Keaktifan Jurnal',
            desc: 'Persentase JP terjadwal yang sudah diisi jurnal',
            icon: <BookOpen className="h-4 w-4" />,
            color: 'emerald',
            val: bJurnal, set: setBJurnal,
        },
        ...(isMgmt ? [{
            key: 'manajemen',
            label: 'Kehadiran Manajemen',
            desc: 'Kehadiran tambahan khusus guru yang menjabat',
            icon: <Crown className="h-4 w-4" />,
            color: 'amber',
            val: bManajemen, set: setBManajemen,
        }] : []),
    ];

    const colorMap = {
        sky:     'border-sky-100 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 ring-sky-500',
        emerald: 'border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 ring-emerald-500',
        amber:   'border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 ring-amber-500',
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Pengaturan Bobot</CardTitle>
                </CardHeader>
                <CardBody className="space-y-3">
                    {indikatorItems.map((item) => {
                        const [brd, bg, ic, ring] = colorMap[item.color].split(' ');
                        const cls = colorMap[item.color];
                        return (
                            <div key={item.key} className={`p-3.5 rounded-xl border ${brd} ${bg}`}>
                                <div className={`flex items-center gap-2 mb-1 ${ic}`}>
                                    {item.icon}
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{item.label}</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.desc}</p>
                                <div className="flex items-center gap-2">
                                    <input type="number" min="0" max="100" step="1" value={item.val}
                                        onChange={(e) => item.set(Math.max(0, Math.min(100, Number(e.target.value))))}
                                        className={`w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 ${ring.split('ring-')[1] ? `focus:ring-${ring.split('ring-')[1]}` : 'focus:ring-sky-500'}`}
                                    />
                                    <span className="text-sm text-gray-500">%</span>
                                </div>
                            </div>
                        );
                    })}

                    <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium border ${
                        valid
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700'
                    }`}>
                        <span>Total Bobot</span>
                        <span className="font-bold tabular-nums">{totalBobot}%</span>
                    </div>
                    {!valid && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Total harus tepat 100% sebelum bisa disimpan
                        </p>
                    )}

                    <Button type="button" icon={Save} className="w-full" disabled={!valid} loading={saving} onClick={simpanBobot}>
                        Simpan Bobot
                    </Button>
                </CardBody>
            </Card>

            <Card>
                <CardBody className="space-y-3">
                    <div className={`rounded-xl p-4 ${isMgmt ? 'bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-700' : 'bg-linear-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-700'}`}>
                        <div className={`flex items-center gap-2 mb-1 font-semibold text-sm ${isMgmt ? 'text-amber-700 dark:text-amber-300' : 'text-sky-700 dark:text-sky-300'}`}>
                            <Play className="h-4 w-4" />
                            Hitung Semua {isMgmt ? 'Guru Manajemen' : 'Guru Biasa'}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Hitung KPI sekaligus untuk semua guru aktif di bulan yang dipilih
                        </p>
                    </div>
                    <Select label="Bulan" value={batchBulan} onChange={(e) => setBatchBulan(e.target.value)}>
                        {bulanOptions().map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </Select>
                    <Select label="Tahun Ajaran" value={tahunId} onChange={(e) => setTahunId(e.target.value)}>
                        {tahunAjaran.map((t) => (
                            <option key={t.id} value={t.id}>{t.nama} – {t.semester}</option>
                        ))}
                    </Select>
                    <Button type="button" icon={Play}
                        className={`w-full ${isMgmt ? '!bg-amber-500 hover:!bg-amber-600' : '!bg-sky-500 hover:!bg-sky-600'} !text-white !border-0`}
                        onClick={() => setShowBatch(true)}>
                        Hitung Batch
                    </Button>
                </CardBody>
            </Card>

            <ConfirmBatchModal
                open={showBatch}
                onClose={() => setShowBatch(false)}
                onConfirm={doBatch}
                tipe={tipe}
                bulan={batchBulan}
                loading={batchLoad}
            />
        </>
    );
}

// ── Hitung Individual ─────────────────────────────────────────────────────────

function HitungPanel({ guruList, tipe, pengaturan, tahunAjaran }) {
    const isMgmt = tipe === 'manajemen';

    const [guruId,      setGuruId]      = useState('');
    const [bulan,       setBulan]       = useState(bulanOptions()[0]?.value ?? '');
    const [tahunId,     setTahunId]     = useState(tahunAjaran.find((t) => t.is_aktif)?.id ?? tahunAjaran[0]?.id ?? '');
    const [catatan,     setCatatan]     = useState('');
    const [hasil,       setHasil]       = useState(null);
    const [menghitung,  setMenghitung]  = useState(false);
    const [menyimpan,   setMenyimpan]   = useState(false);
    const [hitungError, setHitungError] = useState('');
    const [konfirmSave, setKonfirmSave] = useState(false);

    const reset = () => { setHasil(null); setHitungError(''); setKonfirmSave(false); };

    const hitungKPI = async () => {
        if (!guruId || !bulan) return;
        setMenghitung(true);
        setHasil(null);
        setHitungError('');
        setKonfirmSave(false);
        try {
            const res  = await fetch(`/admin/kpi/hitung?guru_id=${guruId}&bulan=${bulan}`, {
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
            guru_id: guruId, bulan, tahun_ajaran_id: tahunId,
            persen_guru: hasil.persen_guru, persen_jurnal: hasil.persen_jurnal,
            catatan,
        };
        if (hasil.is_manajemen && hasil.persen_manajemen !== null) {
            payload.persen_manajemen = hasil.persen_manajemen;
        }
        if (hasil.sudah_disimpan && hasil.bobot_berubah) {
            payload.force_update = true;
        }
        router.post('/admin/kpi', payload, {
            onSuccess: () => { reset(); setCatatan(''); },
            onFinish:  () => setMenyimpan(false),
        });
    };

    // Nilai akhir preview
    const nilaiAkhir = hasil ? (() => {
        const bGuru    = hasil.is_manajemen ? (pengaturan.MGT_GURU ?? 40)      : (pengaturan.BIASA_GURU ?? 50);
        const bJurnal  = hasil.is_manajemen ? (pengaturan.MGT_JURNAL ?? 30)    : (pengaturan.BIASA_JURNAL ?? 50);
        const bMgmt    = pengaturan.MGT_MANAJEMEN ?? 30;
        return Math.round((
            hasil.persen_guru   * bGuru   / 100
          + hasil.persen_jurnal * bJurnal / 100
          + (hasil.is_manajemen && hasil.persen_manajemen !== null ? hasil.persen_manajemen * bMgmt / 100 : 0)
        ) * 10) / 10;
    })() : null;

    const canSave = hasil && !(hasil.sudah_disimpan && !hasil.bobot_berubah) && !(hasil.sudah_disimpan && hasil.bobot_berubah && !konfirmSave);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Hitung KPI Individual</CardTitle>
                    {isMgmt && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                            <Crown className="h-3 w-3" /> Guru Manajemen
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Guru</label>
                        <PersonSearchSelect
                            list={guruList}
                            value={guruId}
                            onChange={(id) => { setGuruId(id); reset(); }}
                            placeholder="Cari nama guru..."
                            emptyLabel="— Pilih Guru —"
                        />
                    </div>
                    <Select label="Bulan" value={bulan} onChange={(e) => { setBulan(e.target.value); reset(); }}>
                        {bulanOptions().map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </Select>
                </div>

                <Button type="button" icon={Calculator} disabled={!guruId || !bulan || menghitung} loading={menghitung} onClick={hitungKPI}>
                    Hitung Otomatis
                </Button>

                {hitungError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {hitungError}
                    </div>
                )}

                {hasil && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Header hasil */}
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
                                        <span className="text-xs text-gray-400">bobot {hasil.is_manajemen ? (pengaturan.MGT_GURU ?? 40) : (pengaturan.BIASA_GURU ?? 50)}%</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{hasil.detail_guru.hadir} / {hasil.detail_guru.total} hari</span>
                                </div>
                                <NilaiBar persen={hasil.persen_guru} />
                            </div>

                            {/* Keaktifan Jurnal */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-emerald-500" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keaktifan Jurnal</span>
                                        <span className="text-xs text-gray-400">bobot {hasil.is_manajemen ? (pengaturan.MGT_JURNAL ?? 30) : (pengaturan.BIASA_JURNAL ?? 50)}%</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{hasil.detail_jurnal.terisi} / {hasil.detail_jurnal.hadir} JP</span>
                                </div>
                                <NilaiBar persen={hasil.persen_jurnal} />
                            </div>

                            {/* Kehadiran Manajemen */}
                            {hasil.is_manajemen && hasil.persen_manajemen !== null && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <Crown className="h-4 w-4 text-amber-500" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kehadiran Manajemen</span>
                                            <span className="text-xs text-gray-400">bobot {pengaturan.MGT_MANAJEMEN ?? 30}%</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{hasil.detail_manajemen.hadir} / {hasil.detail_manajemen.hari_kerja} hari kerja</span>
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
                                <span className={`text-2xl font-black tabular-nums ${nilaiAkhir >= 80 ? 'text-emerald-600 dark:text-emerald-400' : nilaiAkhir >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {nilaiAkhir}
                                </span>
                            </div>

                            {/* Status & Konfirmasi */}
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

                            {/* Catatan + Tahun Ajaran + Actions */}
                            <div className="space-y-3 pt-1">
                                <Select label="Tahun Ajaran" value={tahunId} onChange={(e) => setTahunId(e.target.value)}>
                                    {tahunAjaran.map((t) => (
                                        <option key={t.id} value={t.id}>{t.nama} – {t.semester}</option>
                                    ))}
                                </Select>
                                <Textarea label="Catatan (opsional)" value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} placeholder="Catatan tambahan..." />
                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="secondary" icon={RefreshCw} onClick={reset}>
                                        Hitung Ulang
                                    </Button>
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
    );
}

// ── Rekap Table ───────────────────────────────────────────────────────────────

function RekapTable({ rekap, tipe, guruList, filters }) {
    const [bulanFilter, setBulanFilter] = useState(filters.bulan ?? '');
    const [guruFilter,  setGuruFilter]  = useState(filters.guru_id ?? '');

    const applyFilter = () => {
        router.get('/admin/kpi', { tipe, bulan: bulanFilter || undefined, guru_id: guruFilter || undefined }, { preserveState: true });
    };

    const badgeColor = (kode) => {
        if (kode === 'KEAKTIFAN_GURU')            return 'blue';
        if (kode === 'KEAKTIFAN_JURNAL')           return 'green';
        if (kode === 'KEAKTIFAN_MANAJEMEN_GURU')   return 'yellow';
        return 'gray';
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                    <CardTitle>Rekap KPI Tersimpan</CardTitle>
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                        <select value={bulanFilter} onChange={(e) => setBulanFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-2.5 py-1.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                            <option value="">Semua Bulan</option>
                            {bulanOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button type="button" onClick={applyFilter}
                            className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors">
                            Filter
                        </button>
                        {(bulanFilter || guruFilter) && (
                            <button type="button" onClick={() => { setBulanFilter(''); setGuruFilter(''); router.get('/admin/kpi', { tipe }, { preserveState: true }); }}
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
                                <th className="px-4 py-3 text-left font-medium">Guru</th>
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
                                            <img src={item.guru?.user?.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                                            <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                {item.guru?.user?.name ?? '–'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">
                                        {bulanLabel(item.bulan)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge color={badgeColor(item.indikator?.kode)} className="whitespace-nowrap">
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
                                        Belum ada data KPI tersimpan untuk tab ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {rekap.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                        <span>Halaman {rekap.current_page} dari {rekap.last_page}</span>
                        <div className="flex gap-1">
                            {rekap.links.filter((l) => l.url).map((link, i) => (
                                <button key={i} onClick={() => router.get(link.url, {}, { preserveState: true })}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${link.active ? 'bg-sky-500 text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function KPIIndex({ guruBiasa = [], guruMgmt = [], tahunAjaran = [], pengaturan = {}, rekap, filters = {} }) {
    const initTab   = filters.tipe ?? 'biasa';
    const [tab, setTab] = useState(initTab);

    const switchTab = (t) => {
        setTab(t);
        router.get('/admin/kpi', { tipe: t }, { preserveState: false });
    };

    const guruList = tab === 'manajemen' ? guruMgmt : guruBiasa;

    return (
        <AppLayout title="KPI Guru">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
                <button type="button" onClick={() => switchTab('biasa')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'biasa' ? 'bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    <UserCheck className="h-4 w-4" />
                    Guru Biasa
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 tabular-nums">
                        {guruBiasa.length}
                    </span>
                </button>
                <button type="button" onClick={() => switchTab('manajemen')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'manajemen' ? 'bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    <Crown className="h-4 w-4" />
                    Guru Manajemen
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 tabular-nums">
                        {guruMgmt.length}
                    </span>
                </button>
            </div>

            {/* Action row */}
            <div className="flex justify-end mb-4">
                <a href="/admin/kpi/ranking"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <BarChart2 className="h-4 w-4" />
                    Lihat Ranking
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Bobot + Batch */}
                <div className="lg:col-span-1 space-y-4">
                    <BobotPanel tipe={tab} pengaturan={pengaturan} tahunAjaran={tahunAjaran} />
                </div>

                {/* Right: Hitung + Rekap */}
                <div className="lg:col-span-2 space-y-6">
                    <HitungPanel guruList={guruList} tipe={tab} pengaturan={pengaturan} tahunAjaran={tahunAjaran} />
                    <RekapTable rekap={rekap} tipe={tab} guruList={guruList} filters={filters} />
                </div>
            </div>
        </AppLayout>
    );
}
