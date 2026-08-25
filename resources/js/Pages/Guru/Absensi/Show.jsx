import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import { Link } from '@inertiajs/react';
import {
    Save, Calendar, ChevronLeft, FileText,
    CheckCircle, Users, Edit2, ClipboardList, Clock
} from 'lucide-react';
import { useState } from 'react';

const STATUS_OPTIONS = ['Hadir', 'Sakit', 'Izin', 'Alpha'];
const STATUS_COLOR = {
    Hadir: 'bg-emerald-500', Sakit: 'bg-sky-500', Izin: 'bg-amber-500', Alpha: 'bg-red-500',
};
const STATUS_BTN_ACTIVE = {
    Hadir: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
    Sakit: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700',
    Izin:  'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
    Alpha: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
};

function StatCard({ label, count, total }) {
    const pct = total ? Math.round((count / total) * 100) : 0;
    const bar = { Hadir: 'bg-emerald-500', Sakit: 'bg-sky-500', Izin: 'bg-amber-500', Alpha: 'bg-red-500' };
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
            <p className={`text-3xl font-black ${
                label === 'Hadir' ? 'text-emerald-600 dark:text-emerald-400'
                : label === 'Sakit' ? 'text-sky-600 dark:text-sky-400'
                : label === 'Izin' ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
            }`}>{count}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 mt-2">
                <div className={`h-1.5 rounded-full ${bar[label]} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{pct}%</p>
        </div>
    );
}

export default function AbsensiShow({ pembelajaran, jadwals, jurnal, siswa, absensi, absensiByStatus, sudahDiisi, tanggal, isToday }) {
    const [editMode, setEditMode] = useState(!sudahDiisi);

    const { data, setData, post, processing } = useForm({
        tanggal,
        absensi: siswa.map((s) => ({
            siswa_id: s.id,
            status: absensi[s.id]?.status ?? 'Hadir',
            keterangan: absensi[s.id]?.keterangan ?? '',
        })),
    });

    const updateStatus = (idx, status) => {
        const next = [...data.absensi];
        next[idx] = { ...next[idx], status };
        setData('absensi', next);
    };

    const submit = (e) => {
        e.preventDefault();
        post(`/guru/absensi/${jurnal.id}`, {
            onSuccess: () => setEditMode(false),
        });
    };

    const total = siswa.length;
    const hadir = editMode
        ? data.absensi.filter((a) => a.status === 'Hadir').length
        : (absensiByStatus['Hadir']?.length ?? 0);

    // Buat label jam dari jadwals yang dicakup jurnal
    const jamLabel = (() => {
        if (!jadwals || jadwals.length === 0) return '';
        const sorted = [...jadwals].sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
        const start = sorted[0]?.jam_mulai?.substring(0, 5);
        const end   = sorted[sorted.length - 1]?.jam_selesai?.substring(0, 5);
        return start && end ? `${start} – ${end}` : '';
    })();

    const jpCount = jadwals?.length ?? 0;

    return (
        <AppLayout title={`Presensi Siswa – ${pembelajaran.mata_pelajaran?.nama}`}>
            <div className="mb-4 flex items-center justify-between">
                <Link href="/guru/absensi" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-sky-600 dark:hover:text-sky-400">
                    <ChevronLeft className="h-4 w-4" /> Kembali
                </Link>
                {sudahDiisi && !editMode && (
                    <Button size="sm" variant="secondary" icon={Edit2} onClick={() => setEditMode(true)}>
                        Edit Presensi
                    </Button>
                )}
            </div>

            {/* Info jurnal */}
            <div className="mb-4 p-3 rounded-xl border border-sky-100 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 flex items-center gap-3">
                <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-sky-500 dark:text-sky-400">
                        Pertemuan ke-{jurnal.pertemuan_ke}
                        {jpCount > 0 && <span className="ml-2">· {jpCount} JP</span>}
                        {jamLabel && <span className="ml-2">· <Clock className="h-3 w-3 inline -mt-0.5" /> {jamLabel}</span>}
                    </p>
                    <p className="text-sm font-semibold text-sky-800 dark:text-sky-200">{jurnal.materi_pokok}</p>
                </div>
            </div>

            {/* ===== STATS VIEW (sudah diisi & bukan edit mode) ===== */}
            {sudahDiisi && !editMode && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4 text-sky-500" />
                            Ringkasan Presensi — {pembelajaran.rombel?.nama} ({total} siswa)
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {STATUS_OPTIONS.map((s) => (
                                <StatCard
                                    key={s}
                                    label={s}
                                    count={absensiByStatus[s]?.length ?? 0}
                                    total={total}
                                />
                            ))}
                        </div>
                        <div className="mt-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Kehadiran</span>
                                <span className="font-bold text-sky-600 dark:text-sky-400">
                                    {total ? Math.round((hadir / total) * 100) : 0}%
                                </span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700">
                                <div
                                    className="h-3 rounded-full bg-emerald-500 transition-all"
                                    style={{ width: total ? `${(hadir / total) * 100}%` : '0%' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {STATUS_OPTIONS.map((status) => {
                            const list = absensiByStatus[status] ?? [];
                            if (list.length === 0) return null;
                            return (
                                <div key={status} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                                    <div className={`px-4 py-2 flex items-center gap-2 ${STATUS_COLOR[status]} bg-opacity-10`}>
                                        <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLOR[status]}`} />
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {status} ({list.length})
                                        </span>
                                    </div>
                                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {list.map((s, i) => (
                                            <li key={s.id} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <span className="text-xs text-gray-400 w-5 text-right">{i + 1}.</span>
                                                {s.nama}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ===== FORM INPUT (belum diisi atau sedang edit) ===== */}
            {(editMode || !sudahDiisi) && (
                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{pembelajaran.mata_pelajaran?.nama}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{pembelajaran.rombel?.nama}</p>
                                    {jamLabel && (
                                        <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 font-medium flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {jamLabel}
                                            {jpCount > 0 && <span className="ml-1">({jpCount} JP)</span>}
                                        </p>
                                    )}
                                    <div className="mt-4 space-y-2">
                                        {STATUS_OPTIONS.map((st) => {
                                            const count = data.absensi.filter((a) => a.status === st).length;
                                            return (
                                                <div key={st} className="flex justify-between text-sm">
                                                    <span className="text-gray-500">{st}</span>
                                                    <span className={`font-semibold ${
                                                        st === 'Hadir' ? 'text-emerald-600' : st === 'Alpha' ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
                                                    }`}>{count}</span>
                                                </div>
                                            );
                                        })}
                                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 mt-2">
                                            <div className="h-2 rounded-full bg-emerald-500 transition-all"
                                                style={{ width: total ? `${(data.absensi.filter(a=>a.status==='Hadir').length / total) * 100}%` : '0%' }} />
                                        </div>
                                        <p className="text-xs text-gray-400 text-center">
                                            {total ? Math.round((data.absensi.filter(a=>a.status==='Hadir').length / total) * 100) : 0}% kehadiran
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tanggal</label>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {new Date(data.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>

                            {editMode && sudahDiisi && (
                                <Button type="button" variant="secondary" className="w-full" onClick={() => setEditMode(false)}>
                                    Batal Edit
                                </Button>
                            )}
                        </div>

                        {/* Tabel absensi */}
                        <div className="lg:col-span-3">
                            <Card>
                                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                                    <CardTitle>Daftar Hadir ({total} Siswa)</CardTitle>
                                    <Button type="submit" icon={Save} loading={processing} size="sm">Simpan Presensi</Button>
                                </CardHeader>
                                <CardBody className="p-0">
                                    {/* Mobile card view */}
                                    <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                        {siswa.map((s, idx) => {
                                            const curStatus = data.absensi[idx]?.status;
                                            return (
                                                <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="text-xs text-gray-400 w-5 shrink-0 text-right">{idx + 1}</span>
                                                        <img src={s.user?.avatar_url} alt={s.user?.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                                                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{s.user?.name}</span>
                                                    </div>
                                                    <div className="flex gap-1.5 shrink-0">
                                                        {STATUS_OPTIONS.map(status => (
                                                            <button key={status} type="button"
                                                                onClick={() => updateStatus(idx, status)}
                                                                className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${curStatus === status
                                                                    ? STATUS_BTN_ACTIVE[status]
                                                                    : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-700 dark:text-gray-500 dark:border-gray-600'}`}>
                                                                {status === 'Tugas_Sekolah' ? 'TS' : status[0]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Desktop table */}
                                    <div className="overflow-x-auto hidden sm:block">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                                <tr>
                                                    <th className="px-4 py-3 text-left w-8">No</th>
                                                    <th className="px-4 py-3 text-left">Nama Siswa</th>
                                                    {STATUS_OPTIONS.map((s) => (
                                                        <th key={s} className="px-4 py-3 text-center">{s}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {siswa.map((s, idx) => (
                                                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <img src={s.user?.avatar_url} alt={s.user?.name} className="h-7 w-7 rounded-full object-cover" />
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">{s.user?.name}</span>
                                                            </div>
                                                        </td>
                                                        {STATUS_OPTIONS.map((status) => (
                                                            <td key={status} className="px-4 py-3 text-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${s.id}`}
                                                                    value={status}
                                                                    checked={data.absensi[idx]?.status === status}
                                                                    onChange={() => updateStatus(idx, status)}
                                                                    className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </form>
            )}
        </AppLayout>
    );
}
