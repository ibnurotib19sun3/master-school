import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import { Layers } from 'lucide-react';

function ProgressBar({ persen, color }) {
    const COLORS = {
        sky:     'bg-sky-500',
        emerald: 'bg-emerald-500',
    };
    return (
        <div className="flex items-center gap-2 min-w-28">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className={`h-1.5 rounded-full ${COLORS[color] ?? COLORS.sky}`} style={{ width: `${Math.min(persen, 100)}%` }} />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-10 text-right tabular-nums">{persen}%</span>
        </div>
    );
}

export default function LmsProgress({ rekap, tahunAjaran, filters }) {
    const setTahun = (val) => {
        router.get('/admin/laporan/lms-progress', { tahun_ajaran_id: val || undefined }, { preserveState: true });
    };

    return (
        <AppLayout title="Progress LMS">
            <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-sky-500" /> Progress LMS per Kelas
                    </CardTitle>
                    <select value={filters.tahun_ajaran_id ?? ''} onChange={(e) => setTahun(e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-1.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                        {tahunAjaran.map((t) => (
                            <option key={t.id} value={t.id}>{t.nama} – {t.semester}{t.is_aktif ? ' ●' : ''}</option>
                        ))}
                    </select>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Mata Pelajaran</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Guru</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Rombel</th>
                                    <th className="px-4 py-3 text-center font-medium hidden sm:table-cell">Pertemuan</th>
                                    <th className="px-4 py-3 text-left font-medium">Cakupan Materi</th>
                                    <th className="px-4 py-3 text-left font-medium">Keterlibatan Siswa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {rekap.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">Belum ada data pembelajaran.</td></tr>
                                )}
                                {rekap.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.mapel}</td>
                                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{r.guru}</td>
                                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{r.rombel}</td>
                                        <td className="px-4 py-3 text-center text-gray-500 tabular-nums hidden sm:table-cell">{r.pertemuan_terlaksana}</td>
                                        <td className="px-4 py-3">
                                            <ProgressBar persen={r.persen_cakupan} color="sky" />
                                            <p className="text-[11px] text-gray-400 mt-0.5">{r.total_materi} materi · {r.pertemuan_terlaksana} pertemuan terlaksana</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ProgressBar persen={r.persen_keterlibatan} color="emerald" />
                                            <p className="text-[11px] text-gray-400 mt-0.5">{r.siswa_terlibat}/{r.total_siswa} siswa sudah akses</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </AppLayout>
    );
}
