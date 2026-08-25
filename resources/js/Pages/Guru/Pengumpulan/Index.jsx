import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import {
    FolderUp, Upload, Trash2, CheckCircle, Clock, AlertCircle,
    FileText, Calendar, RefreshCw,
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

/* ── helpers ── */
function fmtDatetime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function fileExt(path) {
    if (!path) return '';
    const parts = path.split('.');
    return parts[parts.length - 1]?.toUpperCase() ?? '';
}

function fileName(path) {
    if (!path) return '';
    return path.split('/').pop() ?? path;
}

const STATUS_STYLES = {
    'Tepat Waktu': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Terlambat':   'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'Belum':       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};
const STATUS_ICON = {
    'Tepat Waktu': CheckCircle,
    'Terlambat':   AlertCircle,
    'Belum':       Clock,
};

/* ── Upload button per item ── */
function UploadButton({ item, onUploading }) {
    const fileRef = useRef();
    const [busy, setBusy] = useState(false);

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        onUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        router.post(`/guru/pengumpulan/${item.id}/upload`, fd, {
            forceFormData: true,
            onFinish: () => { setBusy(false); onUploading(false); },
        });
        e.target.value = '';
    };

    return (
        <>
            <input ref={fileRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                onChange={handleChange}
            />
            <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 disabled:opacity-60 transition-colors"
            >
                <Upload className="h-3.5 w-3.5" />
                {busy ? 'Mengunggah…' : item.file_path ? 'Ganti File' : 'Upload'}
            </button>
        </>
    );
}

/* ── Delete file button ── */
function DeleteFileButton({ item }) {
    const handleDelete = () => {
        if (!confirm('Hapus file yang sudah diupload?')) return;
        router.delete(`/guru/pengumpulan/${item.id}/file`);
    };

    if (!item.file_path) return null;

    return (
        <button onClick={handleDelete}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
        </button>
    );
}

/* ── Pengumpulan group card ── */
function PengumpulanCard({ pengumpulan, items }) {
    const [uploading, setUploading] = useState(false);
    const batasExpired = new Date(pengumpulan.batas_waktu) < new Date();
    const uploaded = items.filter(i => i.file_path).length;

    return (
        <Card>
            {/* Group header */}
            <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl flex items-start justify-between gap-4 ${
                batasExpired ? 'bg-rose-50/50 dark:bg-rose-900/10' : 'bg-gray-50/50 dark:bg-gray-800/30'
            }`}>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{pengumpulan.judul}</h3>
                    {pengumpulan.deskripsi && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{pengumpulan.deskripsi}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Batas: {fmtDatetime(pengumpulan.batas_waktu)}
                        </span>
                        {batasExpired && (
                            <span className="text-rose-500 font-medium">Kedaluwarsa</span>
                        )}
                    </div>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{uploaded}/{items.length}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Sudah upload</p>
                </div>
            </div>

            <CardBody className="p-0">
                {uploading && (
                    <div className="px-4 py-2 text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Mengunggah file…
                    </div>
                )}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {items.map(item => {
                        const StatusIcon = STATUS_ICON[item.status] ?? Clock;
                        return (
                            <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                                {/* Info mapel + rombel */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {item.pembelajaran?.mata_pelajaran?.nama ?? '—'}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {item.pembelajaran?.rombel?.nama ?? '—'}
                                    </p>
                                </div>

                                {/* File info */}
                                {item.file_path ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                            <a
                                                href={item.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="truncate max-w-32 text-sky-600 dark:text-sky-400 hover:underline"
                                                title={fileName(item.file_path)}
                                            >
                                                {fileExt(item.file_path)} ↗
                                            </a>
                                        </div>
                                        <span className="hidden sm:inline text-gray-300 dark:text-gray-600">·</span>
                                        <span className="hidden sm:inline whitespace-nowrap">{fmtDatetime(item.tgl_upload)}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">Belum ada file</span>
                                )}

                                {/* Status badge */}
                                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] ?? ''}`}>
                                    <StatusIcon className="h-3 w-3" />
                                    <span className="hidden sm:inline">{item.status}</span>
                                </span>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <UploadButton item={item} onUploading={setUploading} />
                                    <DeleteFileButton item={item} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
}

/* ── Main ── */
export default function GuruPengumpulanIndex({ items }) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    // Group by pengumpulan
    const groups = items.reduce((acc, item) => {
        const id = item.pengumpulan?.id;
        if (!id) return acc;
        if (!acc[id]) acc[id] = { pengumpulan: item.pengumpulan, items: [] };
        acc[id].items.push(item);
        return acc;
    }, {});

    const groupList = Object.values(groups);

    return (
        <AppLayout title="Pengumpulan">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FolderUp className="h-5 w-5 text-sky-500" /> Pengumpulan
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Upload file pengumpulan yang ditugaskan untuk Anda
                    </p>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Keterangan:</span>
                    {['Tepat Waktu', 'Terlambat', 'Belum'].map(s => {
                        const Icon = STATUS_ICON[s];
                        return (
                            <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[s]}`}>
                                <Icon className="h-3 w-3" /> {s}
                            </span>
                        );
                    })}
                    <span className="ml-2">Format: PDF, Word, Excel, PPT, ZIP — max 20 MB</span>
                </div>

                {/* Content */}
                {groupList.length === 0 ? (
                    <Card>
                        <CardBody>
                            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                                <FolderUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">Tidak ada pengumpulan aktif saat ini.</p>
                                <p className="text-xs mt-1 opacity-70">Pengumpulan akan muncul di sini saat admin membuat tugas untuk Anda.</p>
                            </div>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="space-y-5">
                        {groupList.map(({ pengumpulan, items: groupItems }) => (
                            <PengumpulanCard
                                key={pengumpulan.id}
                                pengumpulan={pengumpulan}
                                items={groupItems}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
