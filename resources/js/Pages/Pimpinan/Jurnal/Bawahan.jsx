import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { BookText, Search, X, ChevronLeft, ChevronRight, History, Users } from 'lucide-react';
import { useState, useCallback } from 'react';

function toDatePart(val) {
    if (!val) return '';
    return String(val).split('T')[0].split(' ')[0];
}
function fmtDate(val) {
    const d = toDatePart(val);
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
}

const BASE = '/pimpinan/jurnal/bawahan';

export default function JurnalBawahan({ riwayat, staffList, filters, type, label, supervisor }) {
    const [staff,  setStaff]  = useState(filters.staff  ?? '');
    const [dari,   setDari]   = useState(filters.dari   ?? '');
    const [sampai, setSampai] = useState(filters.sampai ?? '');
    const [q,      setQ]      = useState(filters.q      ?? '');

    const apply = useCallback((ns, nd, nss, nq) => {
        router.get(BASE, {
            staff:  ns  || undefined,
            dari:   nd  || undefined,
            sampai: nss || undefined,
            q:      nq  || undefined,
        }, { preserveState: true, replace: true });
    }, []);

    const hStaff  = (v) => { setStaff(v);  apply(v, dari, sampai, q); };
    const hDari   = (v) => { setDari(v);   apply(staff, v, sampai, q); };
    const hSampai = (v) => { setSampai(v); apply(staff, dari, v, q); };
    const hQ      = (v) => { setQ(v);      apply(staff, dari, sampai, v); };
    const clear   = ()  => { setStaff(''); setDari(''); setSampai(''); setQ(''); apply('', '', '', ''); };

    const hasFilter     = staff || dari || sampai || q;
    const selectedStaff = staffList.find(s => String(s.id) === String(staff));

    const colorClass = type === 'tatausaha'
        ? { ring: 'focus:ring-sky-500', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: 'text-sky-600' }
        : { ring: 'focus:ring-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: 'text-purple-600' };

    return (
        <AppLayout title={`Jurnal ${label}`}>
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <History className={`h-5 w-5 ${colorClass.icon}`} />
                        Jurnal {label}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Rekap jurnal {label} — dipantau oleh {supervisor}
                    </p>
                </div>

                {/* Filter */}
                <Card>
                    <CardBody className="p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-52">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    <Users className="inline h-3 w-3 mr-1" />{label}
                                </label>
                                <select
                                    value={staff}
                                    onChange={e => hStaff(e.target.value)}
                                    className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${colorClass.ring}`}
                                >
                                    <option value="">Semua {label}</option>
                                    {staffList.map(s => (
                                        <option key={s.id} value={s.id}>{s.nama} — {s.jabatan}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal Mulai</label>
                                <input
                                    type="date"
                                    value={dari}
                                    onChange={e => hDari(e.target.value)}
                                    className={`rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${colorClass.ring}`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal Akhir</label>
                                <input
                                    type="date"
                                    value={sampai}
                                    onChange={e => hSampai(e.target.value)}
                                    className={`rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${colorClass.ring}`}
                                />
                            </div>
                            <div className="flex-1 min-w-44">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cari Kegiatan</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={q}
                                        onChange={e => hQ(e.target.value)}
                                        placeholder="Kata kunci..."
                                        className={`w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${colorClass.ring}`}
                                    />
                                </div>
                            </div>
                            {hasFilter && (
                                <button
                                    onClick={clear}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" /> Reset
                                </button>
                            )}
                        </div>
                        {selectedStaff && (
                            <div className="mt-2">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass.badge}`}>
                                    {selectedStaff.nama} — {selectedStaff.jabatan}
                                </span>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookText className="h-4 w-4 text-gray-400" />
                            {riwayat.total} Entri
                            {hasFilter && <span className="text-xs font-normal text-gray-400">(difilter)</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardBody className="p-0">
                        {riwayat.data.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                                <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Tidak ada data{hasFilter ? ' sesuai filter' : ''}.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Tanggal</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Nama</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Jabatan</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Tahun Ajaran</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Kegiatan</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {riwayat.data.map(item => {
                                                const nama    = type === 'tatausaha'
                                                    ? (item.tatausaha?.user?.name ?? '—')
                                                    : (item.guru?.user?.name ?? '—');
                                                const jabatan = type === 'tatausaha'
                                                    ? (item.tatausaha?.jabatan ?? '—')
                                                    : ((item.guru?.jabatan ?? []).find(j => j.startsWith('Pokja ')) ?? '—');
                                                return (
                                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium text-xs">
                                                            {fmtDate(item.tanggal)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-800 dark:text-gray-200 font-medium">
                                                            {nama}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colorClass.badge}`}>
                                                                {jabatan}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">
                                                            {item.tahun_ajaran?.nama ?? '—'}<br />
                                                            <span className="text-gray-400">Sem {item.semester}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-xs">
                                                            <p className="line-clamp-2 leading-relaxed">{item.kegiatan}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500 dark:text-gray:400 text-xs italic max-w-xs">
                                                            <p className="line-clamp-2">{item.keterangan || '—'}</p>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination data={riwayat} />
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}

function Pagination({ data }) {
    if (data.last_page <= 1) return null;
    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Halaman {data.current_page} dari {data.last_page}
                <span className="ml-2 text-gray-400">({data.total} total)</span>
            </p>
            <div className="flex gap-2">
                <button
                    disabled={!data.prev_page_url}
                    onClick={() => data.prev_page_url && router.get(data.prev_page_url)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800"
                >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                    disabled={!data.next_page_url}
                    onClick={() => data.next_page_url && router.get(data.next_page_url)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800"
                >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
