import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, XCircle, BookOpen, Users, CalendarDays } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';

const bulanNames = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function fmtDate(val) {
    if (!val) return '—';
    const [y, m, d] = String(val).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long',
    });
}

function SlotCard({ s }) {
    return (
        <div className={`flex items-start gap-2.5 px-4 py-2.5 ${s.terisi ? '' : 'bg-red-50/40 dark:bg-red-900/5'}`}>
            <div className="shrink-0 mt-0.5">
                {s.terisi
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <XCircle className="h-4 w-4 text-red-400" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                        JP {s.jam_ke}
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {s.mata_pelajaran}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                        <Users className="h-3 w-3" />{s.rombel}
                    </span>
                    {s.status_guru === 'Tugas_Sekolah' && (
                        <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded whitespace-nowrap">
                            Tugas Sekolah
                        </span>
                    )}
                </div>
                {s.terisi && s.materi_pokok && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        <span className="text-gray-400">Pertemuan {s.pertemuan_ke} —</span> {s.materi_pokok}
                    </p>
                )}
                {!s.terisi && (
                    <p className="text-xs text-red-400 dark:text-red-500 mt-0.5">Jurnal belum diisi</p>
                )}
            </div>
        </div>
    );
}

function SlotPanel({ title, icon: Icon, iconClass, headerClass, bgClass, slots, emptyText }) {
    const byDate = {};
    slots.forEach(s => {
        if (!byDate[s.tanggal]) byDate[s.tanggal] = [];
        byDate[s.tanggal].push(s);
    });
    const dates = Object.keys(byDate).sort();

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className={`rounded-t-xl ${headerClass}`}>
                <CardTitle className={`flex items-center gap-2 text-sm ${iconClass}`}>
                    <Icon className="h-4 w-4" />
                    {title}
                    <span className="ml-auto text-xs font-bold tabular-nums px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20">
                        {slots.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardBody className={`p-0 flex-1 overflow-auto ${bgClass}`}>
                {dates.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">{emptyText}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {dates.map(tgl => (
                            <div key={tgl}>
                                <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800/50">
                                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {fmtDate(tgl)}
                                    </p>
                                </div>
                                {byDate[tgl].map((s, i) => (
                                    <SlotCard key={i} s={s} />
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

export default function KeaktifanJurnalDetail({ guru, slots, bulan }) {
    const [tahun, bln] = bulan.split('-');

    const terisiSlots = slots.filter(s => s.terisi);
    const kosongSlots = slots.filter(s => !s.terisi);
    const persen = slots.length > 0 ? Math.round((terisiSlots.length / slots.length) * 100 * 10) / 10 : 0;

    const barColor = persen >= 80 ? 'bg-emerald-500' : persen >= 50 ? 'bg-amber-500' : 'bg-red-500';
    const textColor = persen >= 80 ? 'text-emerald-600 dark:text-emerald-400' : persen >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400';

    return (
        <AppLayout>
            <div className="space-y-5">

                {/* Back + Guru info */}
                <div>
                    <Link href={`/admin/laporan/keaktifan-jurnal?bulan=${bulan}`}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors mb-3">
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Keaktifan Jurnal
                    </Link>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                        <div className="flex items-start gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{guru.nama}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    NIP/NIPY: {guru.nip} &nbsp;·&nbsp; {bulanNames[parseInt(bln)]} {tahun}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="text-center">
                                <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{slots.length}</p>
                                <p className="text-xs text-gray-500 mt-0.5">JP Hadir</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{terisiSlots.length}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Jurnal Terisi</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-2xl font-black tabular-nums ${kosongSlots.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>{kosongSlots.length}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Belum Diisi</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-2xl font-black tabular-nums ${textColor}`}>{persen}%</p>
                                <p className="text-xs text-gray-500 mt-0.5">Keaktifan</p>
                                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 mt-1.5 mx-auto max-w-16">
                                    <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${persen}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2-column: filled | unfilled */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                    <SlotPanel
                        title="Jurnal Terisi"
                        icon={CheckCircle2}
                        iconClass="text-emerald-700 dark:text-emerald-300"
                        headerClass="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800"
                        bgClass=""
                        slots={terisiSlots}
                        emptyText="Tidak ada jurnal terisi bulan ini."
                    />
                    <SlotPanel
                        title="Belum Diisi"
                        icon={XCircle}
                        iconClass="text-red-600 dark:text-red-400"
                        headerClass="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800"
                        bgClass=""
                        slots={kosongSlots}
                        emptyText="Semua jurnal sudah terisi."
                    />
                </div>

            </div>
        </AppLayout>
    );
}
