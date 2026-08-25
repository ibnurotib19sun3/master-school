import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { BookText, Search, X, ChevronLeft, ChevronRight, History, Users } from 'lucide-react';
import { useState, useCallback } from 'react';

function toDatePart(val) {
    if (!val) return '';
    return String(val).split('T')[0].split(' ')[0];
}
function fmtShort(val) {
    const d = toDatePart(val);
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
}

const BASE = '/admin/riwayat-jurnal/pokja';

export default function AdminRiwayatJurnalPokja({ riwayat, staffList, filters }) {
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

    const hasFilter = staff || dari || sampai || q;
    const selectedStaff = staffList.find(s => String(s.id) === String(staff));

    return (
        <AppLayout title="Riwayat Jurnal Pokja">
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <History className="h-5 w-5 text-sky-600" /> Riwayat Jurnal Pokja
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Rekap jurnal seluruh anggota pokja</p>
                </div>

                {/* Filter */}
                <Card>
                    <CardBody className="p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-52">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    <Users className="inline h-3 w-3 mr-1" />Anggota Pokja
                                </label>
                                <select value={staff} onChange={e => hStaff(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    <option value="">Semua Anggota</option>
                                    {staffList.map(s => (
                                        <option key={s.id} value={s.id}>{s.nama} — {s.jabatan}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal Mulai</label>
                                <input type="date" value={dari} onChange={e => hDari(e.target.value)}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal Akhir</label>
                                <input type="date" value={sampai} onChange={e => hSampai(e.target.value)}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div className="flex-1 min-w-44">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cari Kegiatan</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input type="text" value={q} onChange={e => hQ(e.target.value)}
                                        placeholder="Kata kunci..."
                                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                </div>
                            </div>
                            {hasFilter && (
                                <button onClick={clear}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <X className="h-3.5 w-3.5" /> Reset
                                </button>
                            )}
                        </div>
                        {selectedStaff && (
                            <div className="mt-2">
                                <span className="text-xs text-sky-600 dark:text-sky-400 font-medium bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-full">
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
                            {hasFilter && <span className="text-xs font-normal text-sky-500">(difilter)</span>}
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
                                {/* Mobile card view */}
                                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                    {riwayat.data.map(item => {
                                        const jabatanPokja = (item.guru?.jabatan ?? []).find(j => j.startsWith('Pokja ')) ?? '—';
                                        return (
                                            <div key={item.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{item.guru?.user?.name ?? '—'}</p>
                                                    <p className="text-xs text-gray-400 shrink-0">{fmtShort(item.tanggal)}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">{jabatanPokja}</span>
                                                    <span className="text-xs text-gray-400">{item.tahun_ajaran?.nama ?? '—'} · Sem {item.semester}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">{item.kegiatan}</p>
                                                {item.keterangan && <p className="text-xs text-gray-500 italic mt-0.5 line-clamp-1">{item.keterangan}</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Desktop table */}
                                <div className="overflow-x-auto hidden sm:block">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Tanggal</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Nama</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Jabatan Pokja</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Tahun Ajaran</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Kegiatan</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {riwayat.data.map(item => {
                                                const jabatanPokja = (item.guru?.jabatan ?? [])
                                                    .find(j => j.startsWith('Pokja ')) ?? '—';
                                                return (
                                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium text-xs">
                                                            {fmtShort(item.tanggal)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-800 dark:text-gray-200 font-medium">
                                                            {item.guru?.user?.name ?? '—'}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                                                                {jabatanPokja}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">
                                                            {item.tahun_ajaran?.nama ?? '—'}<br />
                                                            <span className="text-gray-400">Sem {item.semester}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-xs">
                                                            <p className="line-clamp-2 leading-relaxed">{item.kegiatan}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs italic max-w-xs">
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
                <button disabled={!data.prev_page_url}
                    onClick={() => data.prev_page_url && router.get(data.prev_page_url)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800">
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button disabled={!data.next_page_url}
                    onClick={() => data.next_page_url && router.get(data.next_page_url)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800">
                    Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
