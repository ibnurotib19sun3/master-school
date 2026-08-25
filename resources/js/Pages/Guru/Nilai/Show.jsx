import AppLayout from '@/Layouts/AppLayout';
import { router, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import {
    BarChart3, BookOpen, ChevronLeft, GraduationCap, Save,
    FileSpreadsheet, TableProperties, PenSquare, AlertCircle, CheckCircle2,
    Info, ChevronRight,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */
function fmtDate(val) {
    if (!val) return '–';
    const [y, m, d] = String(val).split('T')[0].split(' ')[0].split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function clr(val, kkm) {
    if (val === null || val === undefined) return '';
    if (val >= kkm) return 'text-green-700 dark:text-green-400 font-semibold';
    if (val >= kkm - 10) return 'text-yellow-600 dark:text-yellow-400 font-semibold';
    return 'text-red-600 dark:text-red-400 font-semibold';
}

function bgClr(val, kkm) {
    if (val === null || val === undefined) return '';
    if (val >= kkm) return 'bg-green-50 dark:bg-green-900/20';
    if (val >= kkm - 10) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
}

/* ------------------------------------------------------------------ */
/* Main component                                                        */
/* ------------------------------------------------------------------ */
export default function NilaiShow({ pembelajaran, jurnalList, siswa, nilaiData }) {
    const kkm = pembelajaran.mata_pelajaran?.kkm ?? 75;

    const [tab,               setTab]       = useState('input');
    // Step 1: pilih capaian
    const [selCapaianId,  setSelCapaian]    = useState(null);
    // Step 2: pilih jurnal (dari hasil filter)
    const [selJurnalId,   setSelJurnal]     = useState(null);
    const [localNilai,    setLocalNilai]    = useState({});
    const [saving,        setSaving]        = useState(false);
    const [flash,         setFlash]         = useState(null);

    /* ---------------------------------------------------------------- */
    /* Derived data                                                       */
    /* ---------------------------------------------------------------- */

    // nilaiMap[jurnal_id][siswa_id][capaian_id] = nilai
    const nilaiMap = useMemo(() => {
        const m = {};
        for (const n of nilaiData) {
            if (!m[n.jurnal_mengajar_id]) m[n.jurnal_mengajar_id] = {};
            if (!m[n.jurnal_mengajar_id][n.siswa_id]) m[n.jurnal_mengajar_id][n.siswa_id] = {};
            m[n.jurnal_mengajar_id][n.siswa_id][n.capaian_pembelajaran_id] = parseFloat(n.nilai);
        }
        return m;
    }, [nilaiData]);

    // jurnalCapaianMap[jurnal_id] = Set<capaian_id>
    const jurnalCapaianMap = useMemo(() => {
        const m = {};
        for (const j of jurnalList) {
            m[j.id] = new Set(j.capaian_pembelajaran.map(cp => cp.id));
        }
        return m;
    }, [jurnalList]);

    // Semua capaian unik dari seluruh jurnal
    const allCapaian = useMemo(() => {
        const seen = new Map();
        for (const j of jurnalList) {
            for (const cp of j.capaian_pembelajaran) {
                if (!seen.has(cp.id)) seen.set(cp.id, cp);
            }
        }
        return [...seen.values()].sort((a, b) => a.kode_lengkap.localeCompare(b.kode_lengkap));
    }, [jurnalList]);

    // Jurnal yang memuat capaian yang dipilih (filter step 2)
    const filteredJurnal = useMemo(() => {
        if (!selCapaianId) return jurnalList;
        return jurnalList.filter(j => jurnalCapaianMap[j.id]?.has(selCapaianId));
    }, [selCapaianId, jurnalList, jurnalCapaianMap]);

    const selJurnal = filteredJurnal.find(j => j.id === selJurnalId) ?? null;

    /* ---------------------------------------------------------------- */
    /* Handlers                                                           */
    /* ---------------------------------------------------------------- */
    const handleSelectCapaian = (cpId) => {
        setSelCapaian(cpId ? Number(cpId) : null);
        setSelJurnal(null);
        setLocalNilai({});
    };

    const handleSelectJurnal = (jId) => {
        setSelJurnal(jId ? Number(jId) : null);
        setLocalNilai({});
    };

    const getNilai = useCallback((jurnalId, siswaId, capaianId) => {
        const key = `${jurnalId}_${siswaId}_${capaianId}`;
        if (localNilai[key] !== undefined) return localNilai[key];
        const sv = nilaiMap[jurnalId]?.[siswaId]?.[capaianId];
        return sv !== undefined ? String(sv) : '';
    }, [localNilai, nilaiMap]);

    const setNilai = (jurnalId, siswaId, capaianId, val) => {
        const key = `${jurnalId}_${siswaId}_${capaianId}`;
        setLocalNilai(prev => ({ ...prev, [key]: val }));
    };

    /* ---------------------------------------------------------------- */
    /* Save                                                               */
    /* ---------------------------------------------------------------- */
    const handleSave = () => {
        if (!selJurnal) return;
        setSaving(true);
        setFlash(null);

        const nilaiList = [];
        for (const s of siswa) {
            for (const cp of selJurnal.capaian_pembelajaran) {
                const val = getNilai(selJurnal.id, s.id, cp.id);
                nilaiList.push({
                    siswa_id: s.id,
                    capaian_pembelajaran_id: cp.id,
                    nilai: val === '' ? null : val,
                });
            }
        }

        router.post(`/guru/nilai/${pembelajaran.id}/jurnal/${selJurnal.id}`, { nilai_list: nilaiList }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setLocalNilai({});
                setFlash({ type: 'success', msg: 'Nilai berhasil disimpan.' });
                setTimeout(() => setFlash(null), 3500);
            },
            onError: () => setFlash({ type: 'error', msg: 'Terjadi kesalahan saat menyimpan.' }),
            onFinish: () => setSaving(false),
        });
    };

    /* ---------------------------------------------------------------- */
    /* Rekap                                                               */
    /* ---------------------------------------------------------------- */
    const rekapData = useMemo(() => {
        return siswa.map(s => {
            const capaianAvgs = allCapaian.map(cp => {
                const values = [];
                for (const j of jurnalList) {
                    if (jurnalCapaianMap[j.id]?.has(cp.id)) {
                        const val = nilaiMap[j.id]?.[s.id]?.[cp.id];
                        if (val !== undefined && val !== null) values.push(val);
                    }
                }
                return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
            });
            const filled     = capaianAvgs.filter(v => v !== null);
            const nilaiAkhir = filled.length > 0 ? filled.reduce((a, b) => a + b, 0) / filled.length : null;
            return { siswa: s, capaianAvgs, nilaiAkhir };
        });
    }, [siswa, allCapaian, jurnalList, jurnalCapaianMap, nilaiMap]);

    /* ---------------------------------------------------------------- */
    /* Render                                                             */
    /* ---------------------------------------------------------------- */
    return (
        <AppLayout title={`Input Nilai — ${pembelajaran.mata_pelajaran?.nama}`}>
            <div className="space-y-5">

                {/* Header */}
                <div className="flex items-start gap-3">
                    <Link href="/guru/nilai"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors mt-0.5">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {pembelajaran.mata_pelajaran?.nama}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5" />
                            {pembelajaran.rombel?.nama}
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            KKM {kkm}
                        </p>
                    </div>
                </div>

                {/* Flash */}
                {flash && (
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${flash.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                        {flash.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {flash.msg}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                    {[
                        { key: 'input', icon: PenSquare, label: 'Input Nilai' },
                        { key: 'rekap', icon: TableProperties, label: 'Rekap & Export' },
                    ].map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key
                                    ? 'bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                <Icon className="h-4 w-4" />{t.label}
                            </button>
                        );
                    })}
                </div>

                {/* ======================= TAB INPUT ======================= */}
                {tab === 'input' && (
                    <div className="space-y-4">
                        {allCapaian.length === 0 ? (
                            <Card>
                                <CardBody className="py-16 text-center text-gray-400">
                                    <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Belum ada capaian pembelajaran di jurnal manapun untuk kelas ini.</p>
                                    <p className="text-xs mt-1 text-gray-300">Tambahkan capaian saat mengisi jurnal.</p>
                                </CardBody>
                            </Card>
                        ) : (
                            <>
                                {/* ── Step 1: Pilih Capaian ── */}
                                <Card>
                                    <CardBody className="p-4 space-y-4">
                                        {/* Breadcrumb steps indicator */}
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 flex-wrap">
                                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${selCapaianId ? 'bg-sky-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>1</span>
                                            <span className={selCapaianId ? 'text-sky-600 dark:text-sky-400 font-medium' : ''}>Pilih Capaian Pembelajaran</span>
                                            <ChevronRight className="h-3 w-3 text-gray-300" />
                                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${selJurnalId ? 'bg-sky-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>2</span>
                                            <span className={selJurnalId ? 'text-sky-600 dark:text-sky-400 font-medium' : ''}>Pilih Jurnal</span>
                                            <ChevronRight className="h-3 w-3 text-gray-300" />
                                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${selJurnalId ? 'bg-sky-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>3</span>
                                            <span>Input Nilai</span>
                                        </div>

                                        {/* Capaian dropdown */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                                                Capaian Pembelajaran
                                            </label>
                                            <select
                                                value={selCapaianId ?? ''}
                                                onChange={e => handleSelectCapaian(e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                                                <option value="">— Pilih capaian pembelajaran —</option>
                                                {allCapaian.map(cp => (
                                                    <option key={cp.id} value={cp.id}>
                                                        {cp.kode_lengkap} · {cp.capaian}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Jurnal dropdown — muncul setelah capaian dipilih */}
                                        {selCapaianId !== null && (
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                                                    Jurnal Mengajar
                                                    <span className="ml-1.5 font-normal text-sky-500">
                                                        ({filteredJurnal.length} jurnal memuat capaian ini)
                                                    </span>
                                                </label>

                                                {filteredJurnal.length === 0 ? (
                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs">
                                                        <Info className="h-3.5 w-3.5 shrink-0" />
                                                        Belum ada jurnal yang memuat capaian ini. Tambahkan capaian saat mengisi jurnal.
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={selJurnalId ?? ''}
                                                        onChange={e => handleSelectJurnal(e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                                                        <option value="">— Pilih jurnal —</option>
                                                        {filteredJurnal.map(j => {
                                                            // Count berapa nilai sudah diisi untuk jurnal ini
                                                            const filledCount = siswa.filter(s =>
                                                                j.capaian_pembelajaran.some(cp => nilaiMap[j.id]?.[s.id]?.[cp.id] !== undefined)
                                                            ).length;
                                                            return (
                                                                <option key={j.id} value={j.id}>
                                                                    [{j.pertemuan_ke}] {fmtDate(j.tanggal)} — {j.materi_pokok}
                                                                    {filledCount > 0 ? ` ✓ ${filledCount}/${siswa.length}` : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                )}
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>

                                {/* ── Step 3: Input Grid ── */}
                                {selJurnal && (
                                    siswa.length === 0 ? (
                                        <Card>
                                            <CardBody className="py-10 text-center text-gray-400 text-sm">
                                                Tidak ada siswa aktif di kelas ini.
                                            </CardBody>
                                        </Card>
                                    ) : (
                                        <Card>
                                            <CardHeader className="flex items-center gap-3">
                                                <CardTitle className="flex-1 text-sm">
                                                    Pertemuan {selJurnal.pertemuan_ke} &nbsp;·&nbsp; {fmtDate(selJurnal.tanggal)}
                                                    <span className="ml-2 text-xs font-normal text-gray-400">{selJurnal.materi_pokok}</span>
                                                </CardTitle>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition-colors">
                                                    <Save className="h-3.5 w-3.5" />
                                                    {saving ? 'Menyimpan...' : 'Simpan Nilai'}
                                                </button>
                                            </CardHeader>
                                            <CardBody className="p-0">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                                <th className="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10 w-8">No</th>
                                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 sticky left-8 bg-gray-50 dark:bg-gray-800/80 z-10 min-w-44">Nama Siswa</th>
                                                                {selJurnal.capaian_pembelajaran.map(cp => (
                                                                    <th key={cp.id} className={`px-3 py-3 font-semibold text-center min-w-24 ${cp.id === selCapaianId ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}>
                                                                        <div className={`font-mono text-xs font-bold ${cp.id === selCapaianId ? 'text-sky-600 dark:text-sky-400' : 'text-sky-600 dark:text-sky-400'}`}>
                                                                            {cp.kode_lengkap}
                                                                            {cp.id === selCapaianId && <span className="ml-1 text-[9px] font-normal bg-sky-200 dark:bg-sky-800 px-1 py-0.5 rounded">dipilih</span>}
                                                                        </div>
                                                                        <div className="text-xs font-normal text-gray-400 max-w-28 truncate" title={cp.capaian}>{cp.capaian}</div>
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                            {siswa.map((s, idx) => (
                                                                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                                    <td className="px-3 py-2 text-gray-400 text-xs sticky left-0 bg-white dark:bg-gray-900 z-10">{idx + 1}</td>
                                                                    <td className="px-4 py-2 sticky left-8 bg-white dark:bg-gray-900 z-10">
                                                                        <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">{s.nama}</div>
                                                                        <div className="text-xs text-gray-400">{s.nis}</div>
                                                                    </td>
                                                                    {selJurnal.capaian_pembelajaran.map(cp => {
                                                                        const val    = getNilai(selJurnal.id, s.id, cp.id);
                                                                        const numVal = val === '' ? null : parseFloat(val);
                                                                        const isSel  = cp.id === selCapaianId;
                                                                        return (
                                                                            <td key={cp.id} className={`px-2 py-2 text-center ${isSel ? 'bg-sky-50/50 dark:bg-sky-900/10' : ''}`}>
                                                                                <input
                                                                                    type="number"
                                                                                    min="0" max="100" step="0.5"
                                                                                    value={val}
                                                                                    onChange={e => setNilai(selJurnal.id, s.id, cp.id, e.target.value)}
                                                                                    placeholder="–"
                                                                                    className={`w-20 text-center rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2 transition-colors
                                                                                        ${isSel ? 'focus:ring-sky-400' : 'focus:ring-sky-300'}
                                                                                        ${numVal !== null
                                                                                            ? numVal >= kkm
                                                                                                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                                                                : numVal >= kkm - 10
                                                                                                    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                                                                                    : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500'}`} />
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                                                    <span>{siswa.length} siswa · {selJurnal.capaian_pembelajaran.length} capaian</span>
                                                    <span className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-green-200 dark:bg-green-800"></span> ≥ KKM</span>
                                                        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-yellow-200 dark:bg-yellow-800"></span> Mendekati</span>
                                                        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-red-200 dark:bg-red-800"></span> &lt; KKM</span>
                                                    </span>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    )
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ======================= TAB REKAP ======================= */}
                {tab === 'rekap' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="flex items-center gap-3">
                                <CardTitle className="flex-1 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-gray-400" />
                                    Rekap Nilai — {pembelajaran.mata_pelajaran?.nama} / {pembelajaran.rombel?.nama}
                                </CardTitle>
                                <a href={`/guru/nilai/${pembelajaran.id}/export`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">
                                    <FileSpreadsheet className="h-3.5 w-3.5" /> Export Excel
                                </a>
                            </CardHeader>
                            <CardBody className="p-0">
                                {allCapaian.length === 0 || siswa.length === 0 ? (
                                    <div className="py-16 text-center text-gray-400 text-sm">
                                        <TableProperties className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        {allCapaian.length === 0 ? 'Belum ada capaian pembelajaran di jurnal manapun.' : 'Belum ada siswa aktif.'}
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                        <th className="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10 w-8">No</th>
                                                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 sticky left-8 bg-gray-50 dark:bg-gray-800/80 z-10 min-w-44">Nama Siswa</th>
                                                        {allCapaian.map(cp => (
                                                            <th key={cp.id} className="px-3 py-3 text-center min-w-24">
                                                                <div className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">{cp.kode_lengkap}</div>
                                                                <div className="text-xs font-normal text-gray-400 max-w-28 truncate" title={cp.capaian}>{cp.capaian}</div>
                                                            </th>
                                                        ))}
                                                        <th className="px-3 py-3 text-center min-w-28 bg-sky-50 dark:bg-sky-900/20 font-bold text-sky-700 dark:text-sky-400 text-xs sticky right-0 z-10">
                                                            Nilai Akhir
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                    {rekapData.map(({ siswa: s, capaianAvgs, nilaiAkhir }, idx) => (
                                                        <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                            <td className="px-3 py-2.5 text-gray-400 text-xs sticky left-0 bg-white dark:bg-gray-900 z-10">{idx + 1}</td>
                                                            <td className="px-4 py-2.5 sticky left-8 bg-white dark:bg-gray-900 z-10">
                                                                <div className="font-medium text-gray-800 dark:text-gray-200">{s.nama}</div>
                                                                <div className="text-xs text-gray-400">{s.nis}</div>
                                                            </td>
                                                            {capaianAvgs.map((avg, i) => (
                                                                <td key={allCapaian[i].id} className={`px-3 py-2.5 text-center ${avg !== null ? bgClr(avg, kkm) : ''}`}>
                                                                    {avg !== null
                                                                        ? <span className={clr(avg, kkm)}>{avg.toFixed(1)}</span>
                                                                        : <span className="text-gray-300 dark:text-gray-600">–</span>}
                                                                </td>
                                                            ))}
                                                            <td className={`px-3 py-2.5 text-center sticky right-0 z-10 ${nilaiAkhir !== null ? bgClr(nilaiAkhir, kkm) : 'bg-sky-50 dark:bg-sky-900/10'}`}>
                                                                {nilaiAkhir !== null
                                                                    ? <span className={`text-base ${clr(nilaiAkhir, kkm)}`}>{nilaiAkhir.toFixed(1)}</span>
                                                                    : <span className="text-gray-300 dark:text-gray-600">–</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                        <td colSpan={2} className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10">
                                                            Rata-rata Kelas
                                                        </td>
                                                        {allCapaian.map((cp, i) => {
                                                            const vals = rekapData.map(r => r.capaianAvgs[i]).filter(v => v !== null);
                                                            const avg  = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                                                            return (
                                                                <td key={cp.id} className="px-3 py-2.5 text-center">
                                                                    {avg !== null
                                                                        ? <span className={`text-xs font-bold ${clr(avg, kkm)}`}>{avg.toFixed(1)}</span>
                                                                        : <span className="text-gray-300 text-xs">–</span>}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="px-3 py-2.5 text-center sticky right-0 bg-sky-50 dark:bg-sky-900/20 z-10">
                                                            {(() => {
                                                                const all = rekapData.map(r => r.nilaiAkhir).filter(v => v !== null);
                                                                const avg = all.length > 0 ? all.reduce((a, b) => a + b, 0) / all.length : null;
                                                                return avg !== null
                                                                    ? <span className={`text-sm font-bold ${clr(avg, kkm)}`}>{avg.toFixed(1)}</span>
                                                                    : <span className="text-gray-300 text-xs">–</span>;
                                                            })()}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                                            <span className="font-medium text-gray-500">Keterangan:</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-green-200 dark:bg-green-800"></span> ≥ KKM ({kkm})</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-yellow-200 dark:bg-yellow-800"></span> Mendekati ({kkm - 10}–{kkm - 1})</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-red-200 dark:bg-red-800"></span> Di bawah KKM</span>
                                            <span className="ml-auto italic">Nilai akhir = rata-rata semua capaian</span>
                                        </div>
                                    </>
                                )}
                            </CardBody>
                        </Card>

                        <Card>
                            <CardBody className="p-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    <Info className="h-4 w-4 text-sky-500" /> Cara Kalkulasi Nilai
                                </h3>
                                <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 list-decimal list-inside">
                                    <li>Pilih <strong>Capaian Pembelajaran</strong> → jurnal yang memuat capaian itu otomatis tersaring.</li>
                                    <li>Pilih <strong>Jurnal</strong> → input nilai semua siswa untuk capaian di jurnal tersebut.</li>
                                    <li>Satu capaian bisa muncul di beberapa jurnal — nilainya <strong>dirata-rata otomatis</strong> per capaian.</li>
                                    <li><strong>Nilai Akhir</strong> = rata-rata dari semua nilai rata-rata capaian per siswa.</li>
                                </ol>
                            </CardBody>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
