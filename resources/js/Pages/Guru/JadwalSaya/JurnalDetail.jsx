import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import {
    ArrowLeft, BookOpen, Users, FileText, Calendar, Hash,
    BookMarked, Video, Presentation, FileSpreadsheet, ExternalLink,
    Download, MessageSquare, CheckCircle2, Inbox, ListChecks,
} from 'lucide-react';

const METODE_COLOR = {
    Ceramah:    'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    Diskusi:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Praktik:    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Proyek:     'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    Kooperatif: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    Lainnya:    'bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300',
};

const MEDIA_ICON = {
    'Video Pembelajaran': Video,
    'Presentasi':         Presentation,
    'Modul Ajar':         BookMarked,
    'Jobsheet':           FileSpreadsheet,
};

function fmtDate(val) {
    if (!val) return '—';
    const [y, m, d] = String(val).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

function MediaBadge({ mediaType, mediaLink, mediaRefJudul, mediaUrl }) {
    const link = mediaLink || mediaUrl;
    if (!mediaType || mediaType === 'Papan Tulis' || mediaType === 'Lainnya') {
        return mediaType ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <FileText className="h-3 w-3" /> {mediaType}
            </span>
        ) : null;
    }
    const Icon  = MEDIA_ICON[mediaType] ?? ExternalLink;
    const isVid = mediaType === 'Video Pembelajaran';
    if (!link) return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Icon className="h-3 w-3" /> {mediaType}
        </span>
    );
    return (
        <a href={link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
            {isVid ? <ExternalLink className="h-3 w-3" /> : <Download className="h-3 w-3" />}
            <Icon className="h-3 w-3" />
            {mediaRefJudul ?? mediaType}
        </a>
    );
}

function JurnalCard({ jurnal, index }) {
    const metodeArr = Array.isArray(jurnal.metode) ? jurnal.metode : (jurnal.metode ? [jurnal.metode] : []);

    return (
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Nomor pertemuan strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 dark:bg-sky-600" />

            <div className="pl-4 pr-4 py-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="flex items-center justify-center h-7 w-7 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-bold shrink-0">
                            {jurnal.pertemuan_ke}
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
                                {jurnal.materi_pokok}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {fmtDate(jurnal.tanggal)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {metodeArr.map((m) => (
                            <span key={m} className={`text-xs font-medium px-2 py-0.5 rounded-full ${METODE_COLOR[m] ?? METODE_COLOR.Lainnya}`}>
                                {m}
                            </span>
                        ))}
                        {jurnal.jumlah_hadir != null && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full font-medium">
                                <Users className="h-3 w-3" />
                                {jurnal.jumlah_hadir} hadir
                            </span>
                        )}
                    </div>
                </div>

                {/* Uraian materi */}
                {jurnal.uraian_materi && (
                    <div className="mb-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {jurnal.uraian_materi}
                        </p>
                    </div>
                )}

                {/* Capaian pembelajaran */}
                {jurnal.capaian?.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-1 mb-1.5">
                            <ListChecks className="h-3.5 w-3.5 text-purple-500" />
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                Capaian Pembelajaran
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {jurnal.capaian.map((cp) => (
                                <span key={cp.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium"
                                    title={cp.capaian}>
                                    {cp.kode_lengkap}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer row: media + catatan */}
                <div className="flex items-center gap-3 flex-wrap">
                    <MediaBadge
                        mediaType={jurnal.media_type}
                        mediaLink={jurnal.media_link}
                        mediaRefJudul={jurnal.media_ref_judul}
                        mediaUrl={jurnal.media_url}
                    />
                    {jurnal.catatan && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" title={jurnal.catatan}>
                            <MessageSquare className="h-3 w-3" />
                            <span className="truncate max-w-48">{jurnal.catatan}</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function JurnalDetail({ pembelajaran, jurnalList }) {
    const totalPertemuan = jurnalList.length;
    const terakhir       = jurnalList[0]?.tanggal ?? null;

    return (
        <AppLayout>
            <div className="space-y-6">

                {/* Back button + header */}
                <div>
                    <Link href="/guru/jadwal-saya"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors mb-3">
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Jadwal Saya
                    </Link>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-900/40 shrink-0">
                                <BookOpen className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                    {pembelajaran.mata_pelajaran ?? '—'}
                                </h2>
                                <div className="flex items-center gap-3 flex-wrap mt-1.5">
                                    {pembelajaran.kode_mapel && (
                                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                            {pembelajaran.kode_mapel}
                                        </span>
                                    )}
                                    {pembelajaran.rombel && (
                                        <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                            <Users className="h-3.5 w-3.5 text-gray-400" />
                                            {pembelajaran.rombel}
                                            {pembelajaran.jurusan && ` — ${pembelajaran.jurusan}`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Total Pertemuan</p>
                                <p className="text-xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                                    {totalPertemuan}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Terakhir Mengajar</p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {terakhir ? fmtDate(terakhir) : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jurnal list */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Riwayat Jurnal Mengajar
                        </h3>
                        {totalPertemuan > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                                {totalPertemuan} entri
                            </span>
                        )}
                    </div>

                    {jurnalList.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-5">
                                <Inbox className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Belum ada jurnal mengajar yang diisi
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {jurnalList.map((jurnal, i) => (
                                <JurnalCard key={jurnal.id} jurnal={jurnal} index={i} />
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
