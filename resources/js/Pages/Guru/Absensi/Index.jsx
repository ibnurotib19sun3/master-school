import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import {
    ClipboardList, FileText, CheckCircle,
    AlertCircle, Lock, Calendar, Info
} from 'lucide-react';

const PIKET_LABEL = { Tugas_Sekolah: 'Tugas Sekolah' };
const PIKET_COLOR = {
    Hadir:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Sakit:        'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    Izin:         'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    Alpha:        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    Tugas_Sekolah:'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

function StatChip({ label, count, color }) {
    const colors = {
        green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        blue:   'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
        red:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
            {label} {count}
        </span>
    );
}

export default function AbsensiIndex({
    jurnalHariIni, jadwalUncovered, piketRecords, absensiStats, tanggalHariIni, pembelajaranTanpaJadwal,
}) {
    const tglFormatted = new Date(tanggalHariIni + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const totalCards = jurnalHariIni.length + jadwalUncovered.length;

    return (
        <AppLayout title="Presensi Siswa">
            {/* Header */}
            <div className="mb-5 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                    <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Presensi Siswa Hari Ini</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{tglFormatted}</p>
                </div>
            </div>

            {/* Hint: pembelajaran tanpa jadwal */}
            {pembelajaranTanpaJadwal > 0 && (
                <div className="mb-4 p-3 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 flex items-start gap-3">
                    <Info className="h-5 w-5 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-sky-800 dark:text-sky-300">
                        <span className="font-semibold">{pembelajaranTanpaJadwal} pembelajaran</span> belum memiliki jadwal hari ini.{' '}
                        Tambahkan jadwal di menu{' '}
                        <a href="/admin/jadwal" className="underline font-medium">Admin &gt; Jadwal</a> agar muncul di sini.
                    </p>
                </div>
            )}

            {totalCards === 0 ? (
                <Card>
                    <CardBody>
                        <div className="text-center py-14 text-gray-400">
                            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>Tidak ada jadwal mengajar hari ini.</p>
                        </div>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-3">

                    {/* ── Jurnal yang sudah diisi (tiap jurnal = 1 absensi) ── */}
                    {jurnalHariIni.map((jurnal) => {
                        const firstJadwalId = jurnal.first_jadwal_id;
                        const piket    = piketRecords[firstJadwalId];
                        const stats    = absensiStats[jurnal.id];
                        const mapel    = jurnal.pembelajaran?.mata_pelajaran?.nama ?? '–';
                        const rombel   = jurnal.pembelajaran?.rombel?.nama ?? '–';
                        const piketSt  = piket?.status_guru;
                        const guruHadir  = piketSt === 'Hadir';
                        const absensiIsi = !!stats;
                        const tidakHadir = piketSt && !guruHadir;

                        let actionNode;
                        if (tidakHadir) {
                            actionNode = (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 whitespace-nowrap">
                                    <Lock className="h-3 w-3 shrink-0" /> Tdk Mengajar
                                </span>
                            );
                        } else if (!piketSt) {
                            actionNode = (
                                <span className="text-xs text-amber-600 dark:text-amber-400 italic whitespace-nowrap">Tunggu piket</span>
                            );
                        } else if (absensiIsi) {
                            actionNode = (
                                <Link
                                    href={`/guru/absensi/${jurnal.id}`}
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 whitespace-nowrap"
                                >
                                    <CheckCircle className="h-3 w-3 shrink-0" /> Lihat
                                </Link>
                            );
                        } else {
                            actionNode = (
                                <Link
                                    href={`/guru/absensi/${jurnal.id}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
                                >
                                    <ClipboardList className="h-3 w-3 shrink-0" /> Isi
                                </Link>
                            );
                        }

                        return (
                            <div key={jurnal.id} className={`rounded-xl border p-3 bg-white dark:bg-gray-800 ${
                                absensiIsi ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-200 dark:border-gray-700'
                            }`}>
                                <div className="flex items-center gap-3">
                                    {/* Jam badge */}
                                    <div className="shrink-0">
                                        <div className="h-10 w-14 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 leading-tight whitespace-nowrap text-center px-0.5">
                                                {jurnal.jam_range ?? '–'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Baris 1: mapel + status + action (tidak wrap) */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">{mapel}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">{rombel}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {piketSt && (
                                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${PIKET_COLOR[piketSt]}`}>
                                                        {PIKET_LABEL[piketSt] ?? piketSt}
                                                    </span>
                                                )}
                                                {actionNode}
                                            </div>
                                        </div>

                                        {/* Baris 2: jurnal info + stats chips */}
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                            <span className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded-full border border-sky-100 dark:border-sky-800 min-w-0">
                                                <FileText className="h-3 w-3 shrink-0" />
                                                <span className="truncate">P{jurnal.pertemuan_ke}: {jurnal.materi_pokok}</span>
                                            </span>
                                            {absensiIsi && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <StatChip label="H" count={stats['Hadir'] ?? 0} color="green" />
                                                    <StatChip label="S" count={stats['Sakit'] ?? 0} color="blue" />
                                                    <StatChip label="I" count={stats['Izin'] ?? 0} color="yellow" />
                                                    <StatChip label="A" count={stats['Alpha'] ?? 0} color="red" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* ── Jadwal belum ada jurnal ── */}
                    {jadwalUncovered.map((item) => {
                        const mapel  = item.pembelajaran?.mata_pelajaran?.nama ?? '–';
                        const rombel = item.pembelajaran?.rombel?.nama ?? '–';
                        const jamLabel = item.jam_mulai && item.jam_selesai
                            ? `${item.jam_mulai.substring(0,5)}–${item.jam_selesai.substring(0,5)}`
                            : `Jam ${item.jam_ke}`;
                        return (
                            <div key={item.id} className="rounded-xl border border-amber-200 dark:border-amber-800 p-3 bg-amber-50 dark:bg-amber-950/30">
                                <div className="flex items-center gap-3">
                                    <div className="shrink-0">
                                        <div className="h-10 w-14 rounded-lg bg-amber-200 dark:bg-amber-900/40 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 leading-tight whitespace-nowrap text-center px-0.5">{jamLabel}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">{mapel}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">{rombel}</p>
                                            </div>
                                            <Link
                                                href="/guru/jurnal"
                                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50 whitespace-nowrap shrink-0"
                                            >
                                                <FileText className="h-3 w-3 shrink-0" /> Isi Jurnal
                                            </Link>
                                        </div>
                                        <div className="mt-1.5">
                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                <AlertCircle className="h-3 w-3 shrink-0" />
                                                Isi jurnal mengajar dulu agar presensi bisa dibuka
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </AppLayout>
    );
}
