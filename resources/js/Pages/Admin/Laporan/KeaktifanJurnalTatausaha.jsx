import AppLayout from '@/Layouts/AppLayout';
import { router, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { BookText, Filter, TrendingUp, CheckCircle2, AlertCircle, XCircle, Search } from 'lucide-react';

const BULAN_NAMES = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function barColor(p) {
    return p >= 80 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : 'bg-red-500';
}
function pctText(p) {
    return p >= 80 ? 'text-emerald-600 dark:text-emerald-400'
        : p >= 50 ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';
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

export default function KeaktifanJurnalTatausaha({ rekap, bulan, hariKerja }) {
    const [tahun, bln] = bulan.split('-');

    const totHadir   = rekap.reduce((s, r) => s + r.hari_hadir, 0);
    const totTerisi  = rekap.reduce((s, r) => s + r.jurnal_terisi, 0);
    const totKosong  = rekap.reduce((s, r) => s + r.jurnal_kosong, 0);
    const totPersen  = totHadir > 0 ? Math.round((totTerisi / totHadir) * 100 * 10) / 10 : 0;

    const sorted = [...rekap].sort((a, b) => b.persen - a.persen);

    return (
        <AppLayout title="Keaktifan Jurnal Tata Usaha">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookText className="h-5 w-5 text-sky-600" />
                        Keaktifan Jurnal Tata Usaha
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {BULAN_NAMES[parseInt(bln)]} {tahun} · {hariKerja} hari kerja
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <input
                        type="month"
                        value={bulan}
                        onChange={(e) => router.get('/admin/laporan/keaktifan-jurnal-tatausaha', { bulan: e.target.value }, { preserveState: true })}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500"
                    />
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card><CardBody className="p-4 text-center">
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{hariKerja}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Hari Kerja</p>
                </CardBody></Card>
                <Card><CardBody className="p-4 text-center">
                    <p className="text-2xl font-black text-sky-600 dark:text-sky-400">{totHadir}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Total Hadir</p>
                </CardBody></Card>
                <Card><CardBody className="p-4 text-center">
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totTerisi}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Jurnal Terisi</p>
                </CardBody></Card>
                <Card><CardBody className="p-4 text-center">
                    <p className={`text-2xl font-black ${pctText(totPersen)}`}>{totPersen}%</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Rata-rata</p>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 mt-2">
                        <div className={`h-1.5 rounded-full ${barColor(totPersen)} transition-all`} style={{ width: `${totPersen}%` }} />
                    </div>
                </CardBody></Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-sky-500" />
                        Rekap Per Karyawan
                    </CardTitle>
                </CardHeader>
                <CardBody className="p-0">
                    {sorted.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <BookText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Tidak ada data tata usaha aktif.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-8">No</th>
                                        <th className="px-4 py-3 text-left">Nama</th>
                                        <th className="px-4 py-3 text-left hidden sm:table-cell">Jabatan</th>
                                        <th className="px-4 py-3 text-center">Hari Hadir</th>
                                        <th className="px-4 py-3 text-center">Jurnal Terisi</th>
                                        <th className="px-4 py-3 text-center">Kosong</th>
                                        <th className="px-4 py-3 text-center min-w-[160px]">Keaktifan</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 w-16" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {sorted.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.nama}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{row.jabatan}</td>
                                            <td className="px-4 py-3 text-center text-sky-600 dark:text-sky-400 font-semibold">{row.hari_hadir}</td>
                                            <td className="px-4 py-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">{row.jurnal_terisi}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-semibold ${row.jurnal_kosong > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {row.jurnal_kosong}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                                        <div className={`h-2 rounded-full ${barColor(row.persen)} transition-all`} style={{ width: `${Math.min(row.persen, 100)}%` }} />
                                                    </div>
                                                    <span className={`text-xs font-bold w-10 text-right ${pctText(row.persen)}`}>{row.persen}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge persen={row.persen} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link
                                                    href={`/admin/laporan/keaktifan-jurnal-tatausaha/${row.id}/detail?bulan=${bulan}`}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                                                >
                                                    <Search className="h-3 w-3" /> Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Total</td>
                                        <td className="px-4 py-3 text-center font-bold text-sky-600 dark:text-sky-400">{totHadir}</td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{totTerisi}</td>
                                        <td className="px-4 py-3 text-center font-bold text-red-500">{totKosong}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                                    <div className={`h-2 rounded-full ${barColor(totPersen)} transition-all`} style={{ width: `${Math.min(totPersen, 100)}%` }} />
                                                </div>
                                                <span className={`text-xs font-black w-10 text-right ${pctText(totPersen)}`}>{totPersen}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center"><StatusBadge persen={totPersen} /></td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="font-medium">Keterangan:</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Aktif ≥80%</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Cukup 50–79%</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Kurang &lt;50%</span>
                <span className="ml-2 text-gray-400">* % dihitung dari hari hadir vs jurnal terisi</span>
            </div>
        </AppLayout>
    );
}
