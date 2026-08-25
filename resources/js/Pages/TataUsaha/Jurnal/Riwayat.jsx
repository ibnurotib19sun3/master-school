import AppLayout from '@/Layouts/AppLayout';
import { router, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import {
    BookText, Search, X, ChevronLeft, ChevronRight,
    Printer, CheckSquare, Square, History, Plus,
} from 'lucide-react';
import { useState, useCallback } from 'react';

function toDatePart(val) {
    if (!val) return '';
    return String(val).split('T')[0].split(' ')[0];
}

function fmtLong(val) {
    const d = toDatePart(val);
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
}

export default function TUJurnalRiwayat({ riwayat, filters, jabatan, nama }) {
    const [dari,   setDari]   = useState(filters.dari   ?? '');
    const [sampai, setSampai] = useState(filters.sampai ?? '');
    const [q,      setQ]      = useState(filters.q      ?? '');
    const [selected, setSelected] = useState(new Set());

    const applyFilter = useCallback((newDari, newSampai, newQ) => {
        router.get('/tatausaha/jurnal/riwayat', {
            dari:   newDari   || undefined,
            sampai: newSampai || undefined,
            q:      newQ      || undefined,
        }, { preserveState: true, replace: true });
    }, []);

    const handleDari   = (v) => { setDari(v);   applyFilter(v, sampai, q); };
    const handleSampai = (v) => { setSampai(v); applyFilter(dari, v, q); };
    const handleQ      = (v) => { setQ(v);      applyFilter(dari, sampai, v); };
    const clearAll     = ()  => { setDari(''); setSampai(''); setQ(''); applyFilter('', '', ''); };

    const hasFilter = dari || sampai || q;

    const toggleSelect = (id) => {
        setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };
    const toggleAll = () => {
        setSelected(selected.size === riwayat.data.length
            ? new Set()
            : new Set(riwayat.data.map(i => i.id)));
    };
    const allSelected = riwayat.data.length > 0 && selected.size === riwayat.data.length;

    const printIds = (ids) => {
        if (!ids.length) return;
        window.open(`/tatausaha/jurnal/print?ids=${ids.join(',')}`, '_blank');
    };

    return (
        <AppLayout title="Riwayat Jurnal Karyawan">
            <div className="space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="h-5 w-5 text-sky-600" />
                            Riwayat Jurnal Karyawan
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {nama} — {jabatan}
                        </p>
                    </div>
                    <Link href="/tatausaha/jurnal"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Isi Jurnal Hari Ini
                    </Link>
                </div>

                {/* Filter bar */}
                <Card>
                    <CardBody className="p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal Mulai</label>
                                <input type="date" value={dari} onChange={e => handleDari(e.target.value)}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal Akhir</label>
                                <input type="date" value={sampai} onChange={e => handleSampai(e.target.value)}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div className="flex-1 min-w-48">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cari Kegiatan</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input type="text" value={q} onChange={e => handleQ(e.target.value)}
                                        placeholder="Kata kunci kegiatan..."
                                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                </div>
                            </div>
                            {hasFilter && (
                                <button onClick={clearAll}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <X className="h-3.5 w-3.5" /> Reset
                                </button>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <BookText className="h-4 w-4 text-gray-400" />
                            {riwayat.total} Entri
                            {hasFilter && <span className="text-xs font-normal text-sky-500">(difilter)</span>}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {selected.size > 0 && (
                                <button onClick={() => printIds([...selected])}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 transition-colors">
                                    <Printer className="h-3.5 w-3.5" /> Print Terpilih ({selected.size})
                                </button>
                            )}
                            {riwayat.data.length > 0 && (
                                <button onClick={toggleAll}
                                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                                    {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                    {allSelected ? 'Batal semua' : 'Pilih semua'}
                                </button>
                            )}
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {riwayat.data.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                                <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Tidak ada data{hasFilter ? ' sesuai filter' : ''}.</p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile card view */}
                                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                    {riwayat.data.map(item => {
                                        const isSel = selected.has(item.id);
                                        return (
                                            <div key={item.id}
                                                className={`px-4 py-3 flex gap-3 transition-colors ${isSel ? 'bg-sky-50/60 dark:bg-sky-900/15' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                                                <button onClick={() => toggleSelect(item.id)}
                                                    className={`shrink-0 mt-1 rounded p-0.5 transition-colors ${isSel ? 'text-sky-600 dark:text-sky-400' : 'text-gray-300 dark:text-gray-600 hover:text-sky-400'}`}>
                                                    {isSel ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{fmtLong(item.tanggal)}</p>
                                                            <p className="text-xs text-sky-500 dark:text-sky-400 mt-0.5">{item.tahun_ajaran?.nama ?? '—'} · Sem {item.semester}</p>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200 mt-1.5 leading-relaxed line-clamp-3">{item.kegiatan}</p>
                                                            {item.keterangan && <p className="text-xs text-gray-500 italic mt-0.5 line-clamp-1">{item.keterangan}</p>}
                                                        </div>
                                                        <button onClick={() => printIds([item.id])} title="Print entri ini"
                                                            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors">
                                                            <Printer className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Desktop table */}
                                <div className="overflow-x-auto hidden sm:block">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                <th className="w-8 px-3 py-3">
                                                    <button onClick={toggleAll} className={`rounded ${allSelected ? 'text-sky-600 dark:text-sky-400' : 'text-gray-300 dark:text-gray-600'}`}>
                                                        {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                                    </button>
                                                </th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Tanggal</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Tahun Ajaran</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Kegiatan</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Keterangan</th>
                                                <th className="w-10 px-3 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {riwayat.data.map(item => {
                                                const isSel = selected.has(item.id);
                                                return (
                                                    <tr key={item.id}
                                                        className={`transition-colors ${isSel ? 'bg-sky-50/60 dark:bg-sky-900/15' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}`}>
                                                        <td className="px-3 py-3 text-center">
                                                            <button onClick={() => toggleSelect(item.id)}
                                                                className={`rounded ${isSel ? 'text-sky-600 dark:text-sky-400' : 'text-gray-300 dark:text-gray-600 hover:text-sky-400'}`}>
                                                                {isSel ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">
                                                            {fmtLong(item.tanggal)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">
                                                            {item.tahun_ajaran?.nama ?? '—'}<br />
                                                            <span className="text-gray-400">Sem {item.semester}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-xs">
                                                            <p className="line-clamp-3 leading-relaxed">{item.kegiatan}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs italic max-w-xs">
                                                            <p className="line-clamp-2">{item.keterangan || '—'}</p>
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <button onClick={() => printIds([item.id])}
                                                                title="Print entri ini"
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors">
                                                                <Printer className="h-3.5 w-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {riwayat.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Halaman {riwayat.current_page} dari {riwayat.last_page}
                                            <span className="ml-2 text-gray-400">({riwayat.total} total)</span>
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                disabled={!riwayat.prev_page_url}
                                                onClick={() => riwayat.prev_page_url && router.get(riwayat.prev_page_url)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800">
                                                <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                            </button>
                                            <button
                                                disabled={!riwayat.next_page_url}
                                                onClick={() => riwayat.next_page_url && router.get(riwayat.next_page_url)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800">
                                                Next <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
