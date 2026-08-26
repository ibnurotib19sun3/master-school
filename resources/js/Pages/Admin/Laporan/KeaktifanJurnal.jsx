import AppLayout from '@/Layouts/AppLayout';
import { router, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { BookCheck, TrendingUp, AlertCircle, CheckCircle2, XCircle, Filter, Search } from 'lucide-react';
import { useState } from 'react';

const bulanNames = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function persenColor(persen) {
    if (persen >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (persen >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

function barColor(persen) {
    if (persen >= 80) return 'bg-emerald-500';
    if (persen >= 50) return 'bg-amber-500';
    return 'bg-red-500';
}

function StatusBadge({ persen }) {
    if (persen >= 80) return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3" /> Aktif
        </span>
    );
    if (persen >= 50) return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-full px-2 py-0.5">
            <AlertCircle className="h-3 w-3" /> Cukup
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-full px-2 py-0.5">
            <XCircle className="h-3 w-3" /> Kurang
        </span>
    );
}

export default function KeaktifanJurnal({ rekap, bulan }) {
    const [tahun, bln] = bulan.split('-');
    const [q, setQ] = useState('');

    const totHadir  = rekap.reduce((s, r) => s + r.jam_hadir, 0);
    const totTerisi = rekap.reduce((s, r) => s + r.jam_terisi, 0);
    const totKosong = rekap.reduce((s, r) => s + r.jam_kosong, 0);
    const totPersen = totHadir > 0 ? Math.round((totTerisi / totHadir) * 100 * 10) / 10 : 0;

    const sorted  = [...rekap].sort((a, b) => b.persen - a.persen);
    const visible = q.trim()
        ? sorted.filter(r => r.nama.toLowerCase().includes(q.toLowerCase()))
        : sorted;

    const handleBulan = (e) => {
        router.get('/admin/laporan/keaktifan-jurnal', { bulan: e.target.value }, { preserveState: true });
    };

    return (
        <AppLayout title="Laporan Keaktifan Jurnal">
            {/* Header + Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookCheck className="h-5 w-5 text-sky-600" />
                        Keaktifan Pengisian Jurnal
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {bulanNames[parseInt(bln)]} {tahun}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <input
                        type="month"
                        value={bulan}
                        onChange={handleBulan}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardBody className="p-4 text-center">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{totHadir}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">JP Hadir</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4 text-center">
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totTerisi}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Jurnal Terisi</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4 text-center">
                        <p className="text-2xl font-black text-red-500 dark:text-red-400">{totKosong}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Belum Diisi</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4 text-center">
                        <p className={`text-2xl font-black ${persenColor(totPersen)}`}>{totPersen}%</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Rata-rata</p>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 mt-2">
                            <div className={`h-1.5 rounded-full ${barColor(totPersen)} transition-all`} style={{ width: `${totPersen}%` }} />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Tabel per guru */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-sky-500" />
                        Rekap Per Guru
                    </CardTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Cari nama guru..."
                            className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-sky-500 w-48"
                        />
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    {rekap.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <BookCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Tidak ada data guru aktif.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-8">No</th>
                                        <th className="px-4 py-3 text-left">Nama Guru</th>
                                        <th className="px-4 py-3 text-left hidden sm:table-cell">NIP/NIPY</th>
                                        <th className="px-4 py-3 text-center">JP Hadir</th>
                                        <th className="px-4 py-3 text-center">Terisi</th>
                                        <th className="px-4 py-3 text-center">Kosong</th>
                                        <th className="px-4 py-3 text-center min-w-[160px]">Keaktifan</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 w-16" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {visible.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.nama}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{row.nip}</td>
                                            <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 font-semibold">{row.jam_hadir}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{row.jam_terisi}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-semibold ${row.jam_kosong > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {row.jam_kosong}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                                        <div
                                                            className={`h-2 rounded-full ${barColor(row.persen)} transition-all`}
                                                            style={{ width: `${Math.min(row.persen, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-bold w-10 text-right ${persenColor(row.persen)}`}>
                                                        {row.persen}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge persen={row.persen} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link
                                                    href={`/admin/laporan/keaktifan-jurnal/${row.id}/detail?bulan=${bulan}`}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                                                >
                                                    <Search className="h-3 w-3" /> Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* Total row */}
                                <tfoot className="bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                                            Total Keseluruhan
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">{totHadir}</td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{totTerisi}</td>
                                        <td className="px-4 py-3 text-center font-bold text-red-500">{totKosong}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                                    <div className={`h-2 rounded-full ${barColor(totPersen)} transition-all`} style={{ width: `${Math.min(totPersen, 100)}%` }} />
                                                </div>
                                                <span className={`text-xs font-black w-10 text-right ${persenColor(totPersen)}`}>
                                                    {totPersen}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <StatusBadge persen={totPersen} />
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Keterangan warna */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="font-medium">Keterangan:</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" /> Aktif ≥ 80%</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" /> Cukup 50–79%</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" /> Kurang &lt; 50%</span>
            </div>
        </AppLayout>
    );
}
