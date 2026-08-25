import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, XCircle, BookOpen, CalendarDays, Briefcase } from 'lucide-react';
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

function SlotItem({ s }) {
    return (
        <div className={`flex items-start gap-2.5 px-4 py-3 ${s.terisi ? '' : 'bg-red-50/40 dark:bg-red-900/5'}`}>
            <div className="shrink-0 mt-0.5">
                {s.terisi
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <XCircle className="h-4 w-4 text-red-400" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{fmtDate(s.tanggal)}</p>
                {s.terisi && s.kegiatan && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{s.kegiatan}</p>
                )}
                {!s.terisi && (
                    <p className="text-xs text-red-400 dark:text-red-500 mt-0.5">Jurnal belum diisi</p>
                )}
            </div>
        </div>
    );
}

function SlotPanel({ title, icon: Icon, iconClass, headerClass, slots, emptyText }) {
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
            <CardBody className="p-0 flex-1">
                {slots.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">{emptyText}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {slots.map((s, i) => <SlotItem key={i} s={s} />)}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

export default function KeaktifanJurnalTatausahaDetail({ tatausaha, slots, bulan }) {
    const [tahun, bln] = bulan.split('-');

    const terisiSlots = slots.filter(s => s.terisi);
    const kosongSlots = slots.filter(s => !s.terisi);
    const persen = slots.length > 0 ? Math.round((terisiSlots.length / slots.length) * 100 * 10) / 10 : 0;

    const barColor = persen >= 80 ? 'bg-emerald-500' : persen >= 50 ? 'bg-amber-500' : 'bg-red-500';
    const textColor = persen >= 80 ? 'text-emerald-600 dark:text-emerald-400' : persen >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400';

    return (
        <AppLayout>
            <div className="space-y-5">

                {/* Back + Info */}
                <div>
                    <Link href={`/admin/laporan/keaktifan-jurnal-tatausaha?bulan=${bulan}`}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors mb-3">
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Keaktifan Jurnal TU
                    </Link>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                        <div className="flex items-start gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{tatausaha.nama}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                                    <Briefcase className="h-3.5 w-3.5" />
                                    {tatausaha.jabatan} &nbsp;·&nbsp; {bulanNames[parseInt(bln)]} {tahun}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="text-center">
                                <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{slots.length}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Hari Hadir</p>
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
                        slots={terisiSlots}
                        emptyText="Tidak ada jurnal terisi bulan ini."
                    />
                    <SlotPanel
                        title="Belum Diisi"
                        icon={XCircle}
                        iconClass="text-red-600 dark:text-red-400"
                        headerClass="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800"
                        slots={kosongSlots}
                        emptyText="Semua jurnal sudah terisi."
                    />
                </div>

            </div>
        </AppLayout>
    );
}
