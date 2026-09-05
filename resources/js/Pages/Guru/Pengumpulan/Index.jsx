import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import {
    FolderUp, Upload, Trash2, CheckCircle, Clock, AlertCircle,
    FileText, Calendar, RefreshCw, Users, Lock,
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

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

// Format file yang diizinkan → accept string
const FORMAT_ACCEPT_MAP = {
    pdf:   ['.pdf'],
    word:  ['.doc', '.docx'],
    excel: ['.xls', '.xlsx'],
    ppt:   ['.ppt', '.pptx'],
    image: ['.jpg', '.jpeg', '.png'],
    zip:   ['.zip'],
};
const FORMAT_LABELS = {
    pdf: 'PDF', word: 'Word', excel: 'Excel', ppt: 'PowerPoint', image: 'Gambar', zip: 'ZIP',
};

function resolveAccept(formatFile) {
    if (!formatFile || formatFile.length === 0) {
        return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip';
    }
    const exts = formatFile.flatMap(k => FORMAT_ACCEPT_MAP[k] ?? []);
    return [...new Set(exts)].join(',');
}

function formatLabel(formatFile) {
    if (!formatFile || formatFile.length === 0) return 'PDF, Word, Excel, PPT, Gambar, ZIP';
    return formatFile.map(k => FORMAT_LABELS[k] ?? k).join(', ');
}

/* ── Upload button dengan opsi sejenjang ── */
function UploadButton({ item, siblings, onUploading }) {
    const fileRef    = useRef();
    const [busy, setBusy]       = useState(false);
    const [showOpt, setShowOpt] = useState(false);
    const [applyJenjang, setApplyJenjang] = useState(false);
    const [pendingFile, setPendingFile]   = useState(null);

    const pengumpulan = item.pengumpulan;
    const accept      = resolveAccept(pengumpulan?.format_file);

    const doUpload = (file, jenjang) => {
        if (!file) return;
        setBusy(true); setShowOpt(false); onUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('apply_jenjang', jenjang ? '1' : '0');
        router.post(`/guru/pengumpulan/${item.id}/upload`, fd, {
            forceFormData: true,
            onFinish: () => { setBusy(false); onUploading(false); setPendingFile(null); },
        });
    };

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        // Kalau ada sibling sejenjang, tampilkan konfirmasi
        if (siblings && siblings.length > 0) {
            setPendingFile(file);
            setShowOpt(true);
        } else {
            doUpload(file, false);
        }
    };

    return (
        <>
            <input ref={fileRef} type="file" className="hidden" accept={accept} onChange={handleChange} />
            <button type="button" disabled={busy || !item.portal_buka}
                onClick={() => fileRef.current?.click()}
                title={!item.portal_buka ? 'Portal upload ditutup' : ''}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60 transition-colors ${
                    item.portal_buka
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                        : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                }`}
            >
                {!item.portal_buka ? <Lock className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                {busy ? 'Mengunggah…' : item.file_path ? 'Ganti' : 'Upload'}
            </button>

            {/* Dialog pilih sejenjang */}
            {showOpt && pendingFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/40">
                                <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Upload Sejenjang</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Ditemukan {siblings.length + 1} rombel sejenjang</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Mapel ini diajarkan di <strong>{siblings.length + 1} rombel</strong> pada jenjang yang sama:
                        </p>
                        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pl-3">
                            <li>• {item.pembelajaran?.rombel?.nama ?? '—'} <span className="text-sky-500">(ini)</span></li>
                            {siblings.map(s => <li key={s.id}>• {s.pembelajaran?.rombel?.nama ?? '—'}</li>)}
                        </ul>

                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Upload ke semua rombel sekaligus, atau hanya rombel ini saja?
                        </p>

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => doUpload(pendingFile, true)}
                                className="flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                            >
                                Semua Rombel Sejenjang
                            </button>
                            <button
                                onClick={() => doUpload(pendingFile, false)}
                                className="flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Rombel Ini Saja
                            </button>
                        </div>
                        <button onClick={() => { setShowOpt(false); setPendingFile(null); }}
                            className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-1">
                            Batal
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

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

    // Kelompokkan items per (mapel, kelas) untuk deteksi sibling sejenjang
    const siblingMap = {};
    items.forEach(item => {
        const kelasId  = item.pembelajaran?.rombel?.kelas_id;
        const mapelId  = item.pembelajaran?.mata_pelajaran_id;
        if (!kelasId || !mapelId) return;
        const key = `${mapelId}_${kelasId}`;
        if (!siblingMap[key]) siblingMap[key] = [];
        siblingMap[key].push(item);
    });

    const getSiblings = (item) => {
        const kelasId = item.pembelajaran?.rombel?.kelas_id;
        const mapelId = item.pembelajaran?.mata_pelajaran_id;
        if (!kelasId || !mapelId) return [];
        const key = `${mapelId}_${kelasId}`;
        return (siblingMap[key] ?? []).filter(s => s.id !== item.id);
    };

    const formatInfo = formatLabel(pengumpulan.format_file);

    return (
        <Card>
            <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl flex items-start justify-between gap-4 ${
                batasExpired ? 'bg-rose-50/50 dark:bg-rose-900/10' : 'bg-gray-50/50 dark:bg-gray-800/30'
            }`}>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{pengumpulan.judul}</h3>
                    {pengumpulan.deskripsi && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{pengumpulan.deskripsi}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Batas: {fmtDatetime(pengumpulan.batas_waktu)}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span>Format: {formatInfo}</span>
                        {batasExpired && !pengumpulan.allow_late_upload && (
                            <>
                                <span className="text-gray-300 dark:text-gray-600">·</span>
                                <span className="flex items-center gap-1 text-rose-500">
                                    <Lock className="h-3 w-3" /> Portal ditutup
                                </span>
                            </>
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
                        const siblings   = getSiblings(item);
                        return (
                            <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {item.pembelajaran?.mata_pelajaran?.nama ?? '—'}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {item.pembelajaran?.rombel?.nama ?? '—'}
                                        {item.pembelajaran?.rombel?.kelas?.nama && (
                                            <span className="ml-1 text-gray-300 dark:text-gray-600">
                                                · Kelas {item.pembelajaran.rombel.kelas.nama}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {item.file_path ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                            <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                                                className="truncate max-w-32 text-sky-600 dark:text-sky-400 hover:underline"
                                                title={fileName(item.file_path)}>
                                                {fileExt(item.file_path)} ↗
                                            </a>
                                        </div>
                                        <span className="hidden sm:inline text-gray-300 dark:text-gray-600">·</span>
                                        <span className="hidden sm:inline whitespace-nowrap">{fmtDatetime(item.tgl_upload)}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                        {item.portal_buka ? 'Belum ada file' : 'Portal ditutup'}
                                    </span>
                                )}

                                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] ?? ''}`}>
                                    <StatusIcon className="h-3 w-3" />
                                    <span className="hidden sm:inline">{item.status}</span>
                                </span>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <UploadButton
                                        item={item}
                                        siblings={siblings}
                                        onUploading={setUploading}
                                    />
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
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FolderUp className="h-5 w-5 text-sky-500" /> Pengumpulan
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Upload file pengumpulan yang ditugaskan untuk Anda
                    </p>
                </div>

                {flash.success && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {flash.error}
                    </div>
                )}

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
                    <span className="ml-1 flex items-center gap-1 text-gray-400">
                        <Lock className="h-3 w-3" /> = Portal ditutup admin
                    </span>
                </div>

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
