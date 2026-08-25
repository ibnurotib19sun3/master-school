import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { BookOpen, Search, Filter, Clock, CheckCircle, XCircle, Users, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';

const STATUS_COLOR = {
    menunggu:        'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
    diterima:        'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-300',
    selesai:         'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300',
    tidak_diterima:  'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_LABEL = {
    menunggu:       'Menunggu',
    diterima:       'Diterima',
    selesai:        'Selesai',
    tidak_diterima: 'Tidak Diterima',
};

function StatusBadge({ status }) {
    return (
        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[status] ?? ''}`}>
            {STATUS_LABEL[status] ?? status}
        </span>
    );
}

export default function BukuTamuAdmin({ tamu, tanggal, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [updatingId, setUpdatingId] = useState(null);

    const applyFilter = (params) => {
        router.get('/admin/buku-tamu', { tanggal, search, ...params }, { preserveState: true });
    };

    const updateStatus = (id, status) => {
        setUpdatingId(id);
        router.patch(`/admin/buku-tamu/${id}/status`, { status }, {
            onFinish: () => setUpdatingId(null),
        });
    };

    const total     = tamu.length;
    const menunggu  = tamu.filter((t) => t.status === 'menunggu').length;
    const diterima  = tamu.filter((t) => t.status === 'diterima').length;
    const selesai   = tamu.filter((t) => t.status === 'selesai').length;

    return (
        <AppLayout title="Buku Tamu">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-sky-600" />
                        Buku Tamu
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <a
                        href="/buku-tamu"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-700 px-3 py-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Buka Halaman Publik
                    </a>
                    <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => applyFilter({ tanggal: e.target.value })}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Tamu', val: total,    cls: 'text-sky-600 dark:text-sky-400' },
                    { label: 'Menunggu',   val: menunggu, cls: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Diterima',   val: diterima, cls: 'text-sky-600 dark:text-sky-400' },
                    { label: 'Selesai',    val: selesai,  cls: 'text-emerald-600 dark:text-emerald-400' },
                ].map(({ label, val, cls }) => (
                    <Card key={label}><CardBody className="p-4 text-center">
                        <p className={`text-2xl font-black ${cls}`}>{val}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                    </CardBody></Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-sky-500" />
                            Daftar Tamu
                        </CardTitle>
                        <div className="relative w-full sm:w-60">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama / keperluan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilter({ search })}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    {tamu.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Belum ada tamu hari ini.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Tamu</th>
                                            <th className="px-4 py-3 text-left">Menemui</th>
                                            <th className="px-4 py-3 text-left">Keperluan</th>
                                            <th className="px-4 py-3 text-center">Jam Masuk</th>
                                            <th className="px-4 py-3 text-center">Jam Keluar</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {tamu.map((t) => (
                                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">{t.nama_tamu}</p>
                                                    {t.instansi && <p className="text-xs text-gray-500">{t.instansi}</p>}
                                                    {t.nomor_hp && <p className="text-xs text-gray-400">{t.nomor_hp}</p>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{t.yang_dituju_nama}</p>
                                                    {t.yang_dituju_jabatan && (
                                                        <p className="text-xs text-gray-500">{t.yang_dituju_jabatan}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 max-w-[200px]">
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{t.keperluan}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="flex items-center justify-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        {t.jam_masuk}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    {t.jam_keluar ?? '–'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <StatusBadge status={t.status} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <QuickActions
                                                        tamu={t}
                                                        loading={updatingId === t.id}
                                                        onUpdate={updateStatus}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {tamu.map((t) => (
                                    <div key={t.id} className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">{t.nama_tamu}</p>
                                                {t.instansi && <p className="text-xs text-gray-500">{t.instansi}</p>}
                                            </div>
                                            <StatusBadge status={t.status} />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            <span className="font-semibold">Menemui:</span> {t.yang_dituju_nama}
                                            {t.yang_dituju_jabatan && ` · ${t.yang_dituju_jabatan}`}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{t.keperluan}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {t.jam_masuk}{t.jam_keluar ? ` – ${t.jam_keluar}` : ''}
                                            </p>
                                            <QuickActions
                                                tamu={t}
                                                loading={updatingId === t.id}
                                                onUpdate={updateStatus}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardBody>
            </Card>
        </AppLayout>
    );
}

function QuickActions({ tamu, loading, onUpdate }) {
    if (loading) {
        return <svg className="animate-spin h-4 w-4 mx-auto text-sky-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>;
    }

    if (tamu.status === 'selesai' || tamu.status === 'tidak_diterima') {
        return <span className="text-xs text-gray-400">–</span>;
    }

    return (
        <div className="flex items-center gap-1.5 justify-center flex-wrap">
            {tamu.status === 'menunggu' && (
                <button
                    onClick={() => onUpdate(tamu.id, 'diterima')}
                    className="text-xs px-2 py-1 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800/40 font-medium transition-colors"
                >
                    Diterima
                </button>
            )}
            {(tamu.status === 'menunggu' || tamu.status === 'diterima') && (
                <button
                    onClick={() => onUpdate(tamu.id, 'selesai')}
                    className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40 font-medium transition-colors flex items-center gap-1"
                >
                    <CheckCircle className="h-3 w-3" /> Selesai
                </button>
            )}
            {tamu.status === 'menunggu' && (
                <button
                    onClick={() => onUpdate(tamu.id, 'tidak_diterima')}
                    className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40 font-medium transition-colors flex items-center gap-1"
                >
                    <XCircle className="h-3 w-3" /> Tolak
                </button>
            )}
        </div>
    );
}
