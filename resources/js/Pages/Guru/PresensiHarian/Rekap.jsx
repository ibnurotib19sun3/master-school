import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import { BarChart3, Search, Users, TrendingUp, Calendar } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';

const BULAN = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

function pctColor(pct) {
    if (pct >= 90) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (pct >= 75) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

export default function PresensiHarianRekap({
    rombelList, tahunAjaranList, rekap, hariEfektif, periodeLabel, canEdit, filters,
}) {
    const [search, setSearch] = useState(filters.search ?? '');

    const navigate = useCallback((params) => {
        router.get('/guru/presensi-harian/rekap', { ...filters, ...params }, {
            preserveState: true, replace: true,
        });
    }, [filters]);

    const onSearch   = (v) => { setSearch(v); navigate({ search: v }); };
    const onRombel   = (v) => navigate({ rombel_id: v, search: '' });
    const onMode     = (v) => navigate({ mode: v, search: '' });
    const onBulan    = (v) => navigate({ bulan: v });
    const onTahun    = (v) => navigate({ tahun: v });
    const onTahunAjaran = (v) => navigate({ tahun_ajaran_id: v });

    const filteredRekap = useMemo(() => {
        if (!search) return rekap;
        return rekap.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.nis.includes(search));
    }, [rekap, search]);

    const avgPct = rekap.length > 0
        ? Math.round(rekap.reduce((s, r) => s + r.persen, 0) / rekap.length)
        : 0;

    const tahunList = [];
    for (let y = new Date().getFullYear(); y >= 2020; y--) tahunList.push(y);

    return (
        <AppLayout title="Rekap Presensi Harian">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-sky-600" />
                        Rekap Presensi Siswa Harian
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Rekapitulasi kehadiran harian per siswa
                    </p>
                </div>
                <a
                    href="/guru/presensi-harian"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0"
                >
                    ← Isi Presensi
                </a>
            </div>

            {/* ── Filter bar ── */}
            <Card className="mb-4">
                <CardBody>
                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Mode toggle */}
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Periode</p>
                            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                {[['bulanan', 'Bulanan'], ['semester', 'Semester']].map(([val, label]) => (
                                    <button
                                        key={val}
                                        onClick={() => onMode(val)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                            filters.mode === val
                                                ? 'bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-300 shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rombel */}
                        <div className="min-w-40">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kelas/Rombel</p>
                            <select
                                value={filters.rombel_id ?? ''}
                                onChange={(e) => onRombel(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {rombelList.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                            </select>
                        </div>

                        {/* Period selector */}
                        {filters.mode === 'bulanan' ? (
                            <>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bulan</p>
                                    <select
                                        value={filters.bulan}
                                        onChange={(e) => onBulan(e.target.value)}
                                        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    >
                                        {BULAN.map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tahun</p>
                                    <select
                                        value={filters.tahun}
                                        onChange={(e) => onTahun(e.target.value)}
                                        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    >
                                        {tahunList.map((y) => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div className="min-w-48">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tahun Ajaran / Semester</p>
                                <select
                                    value={filters.tahun_ajaran_id ?? ''}
                                    onChange={(e) => onTahunAjaran(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                >
                                    {tahunAjaranList.map((ta) => (
                                        <option key={ta.id} value={ta.id}>{ta.nama} – Sem. {ta.semester}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {!filters.rombel_id ? (
                <div className="text-center py-16 text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Pilih kelas/rombel untuk melihat rekap</p>
                </div>
            ) : rekap.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Belum ada data presensi untuk periode ini</p>
                </div>
            ) : (
                <>
                    {/* ── Stats summary ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
                            <p className="text-xs text-gray-400 mb-1">Periode</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{periodeLabel}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
                            <p className="text-xs text-gray-400 mb-1">Hari Efektif</p>
                            <p className="font-bold text-2xl text-sky-600 dark:text-sky-400">{hariEfektif}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Rata-rata Kehadiran
                            </p>
                            <p className={`font-bold text-2xl ${avgPct >= 90 ? 'text-emerald-600' : avgPct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                                {avgPct}%
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <CardTitle>
                                Data Kehadiran
                                <span className="ml-2 text-sm font-normal text-gray-400">({filteredRekap.length} siswa)</span>
                            </CardTitle>
                            <div className="relative w-full sm:w-56">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => onSearch(e.target.value)}
                                    placeholder="Cari nama / NIS..."
                                    className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                        </CardHeader>

                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredRekap.map((r, idx) => (
                                <div key={r.id} className="px-4 py-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{r.name}</p>
                                            <p className="text-xs text-gray-400">{r.nis}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${pctColor(r.persen)}`}>
                                            {r.persen}%
                                        </span>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {[['Hadir', r.hadir, 'green'], ['Sakit', r.sakit, 'sky'], ['Izin', r.izin, 'yellow'], ['Alpha', r.alpha, 'red']].map(([label, val, color]) => (
                                            <div key={label} className="text-center">
                                                <Badge color={color}>{label}: {val}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium w-10">No</th>
                                        <th className="px-4 py-3 text-left font-medium">Nama Siswa</th>
                                        <th className="px-4 py-3 text-left font-medium w-24">NIS</th>
                                        <th className="px-3 py-3 text-center font-medium w-16 text-emerald-600 dark:text-emerald-400">Hadir</th>
                                        <th className="px-3 py-3 text-center font-medium w-14 text-sky-600 dark:text-sky-400">Sakit</th>
                                        <th className="px-3 py-3 text-center font-medium w-14 text-amber-600 dark:text-amber-400">Izin</th>
                                        <th className="px-3 py-3 text-center font-medium w-16 text-red-600 dark:text-red-400">Alpha</th>
                                        <th className="px-4 py-3 text-center font-medium w-20">% Hadir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredRekap.map((r, idx) => (
                                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-2.5 text-gray-400 text-center">{idx + 1}</td>
                                            <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{r.name}</td>
                                            <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 font-mono text-xs">{r.nis}</td>
                                            <td className="px-3 py-2.5 text-center font-semibold text-emerald-600 dark:text-emerald-400">{r.hadir}</td>
                                            <td className="px-3 py-2.5 text-center font-semibold text-sky-600 dark:text-sky-400">{r.sakit}</td>
                                            <td className="px-3 py-2.5 text-center font-semibold text-amber-600 dark:text-amber-400">{r.izin}</td>
                                            <td className="px-3 py-2.5 text-center font-semibold text-red-600 dark:text-red-400">{r.alpha}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${pctColor(r.persen)}`}>
                                                    {r.persen}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {filteredRekap.length > 0 && (
                                    <tfoot className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-600 dark:text-gray-400 border-t-2 border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-2.5 text-right">Total</td>
                                            <td className="px-3 py-2.5 text-center text-emerald-600">{filteredRekap.reduce((a, r) => a + r.hadir, 0)}</td>
                                            <td className="px-3 py-2.5 text-center text-sky-600">{filteredRekap.reduce((a, r) => a + r.sakit, 0)}</td>
                                            <td className="px-3 py-2.5 text-center text-amber-600">{filteredRekap.reduce((a, r) => a + r.izin, 0)}</td>
                                            <td className="px-3 py-2.5 text-center text-red-600">{filteredRekap.reduce((a, r) => a + r.alpha, 0)}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${pctColor(avgPct)}`}>{avgPct}%</span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </AppLayout>
    );
}
