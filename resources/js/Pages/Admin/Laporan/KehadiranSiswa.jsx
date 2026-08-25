import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import { Select } from '@/Components/ui/Input';
import Badge from '@/Components/ui/Badge';
import { Users, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

const BULAN = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

function PersenBar({ persen }) {
    const color = persen >= 90 ? 'bg-emerald-500' : persen >= 75 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${persen}%` }} />
            </div>
            <span className={`text-xs font-semibold w-10 text-right ${persen >= 90 ? 'text-emerald-600 dark:text-emerald-400' : persen >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                {persen}%
            </span>
        </div>
    );
}

export default function KehadiranSiswa({ rekap, rombel, tahunAjaran, filters, bulan }) {
    const [localFilters, setLocalFilters] = useState({ bulan, rombel_id: filters.rombel_id ?? '' });

    const applyFilter = (key, value) => {
        const next = { ...localFilters, [key]: value };
        setLocalFilters(next);
        router.get('/admin/laporan/kehadiran-siswa', next, { preserveState: true, replace: true });
    };

    const [bulanTahun, setBulanTahun] = useState(() => {
        const [y, m] = bulan.split('-');
        return { tahun: y, bulan: m };
    });

    const changeBulan = (key, val) => {
        const next = { ...bulanTahun, [key]: val };
        setBulanTahun(next);
        applyFilter('bulan', `${next.tahun}-${next.bulan}`);
    };

    const totalHadir = rekap.reduce((s, r) => s + r.hadir, 0);
    const totalSiswa = rekap.length;
    const rataKehadiran = totalSiswa > 0
        ? Math.round(rekap.reduce((s, r) => s + r.persen, 0) / totalSiswa)
        : 0;

    const tahunList = [];
    for (let y = 2023; y <= new Date().getFullYear() + 1; y++) tahunList.push(y);

    return (
        <AppLayout title="Laporan Kehadiran Siswa">
            {/* Filter Bar */}
            <Card className="mb-4">
                <CardBody>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex items-end gap-2">
                                <Select
                                    label="Bulan"
                                    value={bulanTahun.bulan}
                                    onChange={(e) => changeBulan('bulan', e.target.value)}
                                    className="w-36"
                                >
                                    {BULAN.map((b, i) => (
                                        <option key={i} value={String(i + 1).padStart(2, '0')}>{b}</option>
                                    ))}
                                </Select>
                                <Select
                                    label="Tahun"
                                    value={bulanTahun.tahun}
                                    onChange={(e) => changeBulan('tahun', e.target.value)}
                                    className="w-28"
                                >
                                    {tahunList.map((y) => <option key={y} value={y}>{y}</option>)}
                                </Select>
                            </div>
                            <Select
                                label="Rombel"
                                value={localFilters.rombel_id}
                                onChange={(e) => applyFilter('rombel_id', e.target.value)}
                                className="w-48"
                            >
                                <option value="">Semua Rombel</option>
                                {rombel.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                            </Select>
                        </div>
                        <a
                            href={`/admin/laporan/kehadiran-siswa/export?bulan=${localFilters.bulan}&rombel_id=${localFilters.rombel_id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors self-end"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Export Excel
                        </a>
                    </div>
                </CardBody>
            </Card>

            {/* Statistik ringkas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                    { label: 'Total Siswa', value: totalSiswa, icon: Users, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/30' },
                    { label: 'Rata-rata Kehadiran', value: `${rataKehadiran}%`, icon: TrendingUp, color: rataKehadiran >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400', bg: rataKehadiran >= 90 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30' },
                    { label: 'Kehadiran < 75%', value: rekap.filter((r) => r.persen < 75).length, icon: Users, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
                ].map((s) => (
                    <div key={s.label} className={`rounded-xl p-4 flex items-center gap-4 ${s.bg}`}>
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm`}>
                            <s.icon className={`h-5 w-5 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabel */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Kehadiran per Siswa — {BULAN[parseInt(bulanTahun.bulan) - 1]} {bulanTahun.tahun}</CardTitle>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">NIS</th>
                                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Nama Siswa</th>
                                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Rombel</th>
                                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Hadir</th>
                                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Sakit</th>
                                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Izin</th>
                                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Alpha</th>
                                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Total</th>
                                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Kehadiran</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {rekap.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-xs">
                                            Tidak ada data absensi untuk periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    rekap.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500 hidden sm:table-cell">{r.nis}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.nama}</td>
                                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{r.rombel ?? '–'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge color="green">{r.hadir}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                <Badge color="blue">{r.sakit}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                <Badge color="yellow">{r.izin}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                <Badge color={r.alpha > 0 ? 'red' : 'gray'}>{r.alpha}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 font-medium hidden sm:table-cell">{r.total}</td>
                                            <td className="px-4 py-3 min-w-[140px]">
                                                <PersenBar persen={r.persen} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </AppLayout>
    );
}
