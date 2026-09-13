import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import {
    FolderUp, Upload, Trash2, CheckCircle, Clock, AlertCircle,
    FileText, Calendar, RefreshCw, Users, Lock, X, Layers,
} from 'lucide-react';
import { useState, useRef } from 'react';

function fmtDatetime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function fileExt(path) {
    if (!path) return '';
    return path.split('.').pop()?.toUpperCase() ?? '';
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
    if (!formatFile || formatFile.length === 0)
        return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip';
    return [...new Set(formatFile.flatMap(k => FORMAT_ACCEPT_MAP[k] ?? []))].join(',');
}
function formatLabel(formatFile) {
    if (!formatFile || formatFile.length === 0) return 'PDF, Word, Excel, PPT, Gambar, ZIP';
    return formatFile.map(k => FORMAT_LABELS[k] ?? k).join(', ');
}

/* ── Dialog pilih rombel/sejenjang ─────────────────────────────── */
function JenjangDialog({ item, siblings, pendingFile, onConfirm, onCancel }) {
    const kelasNama  = item.pembelajaran?.rombel?.kelas?.nama ?? '—';
    const thisRombel = item.pembelajaran?.rombel?.nama ?? '—';
    const allRombel  = [item, ...siblings].map(s => s.pembelajaran?.rombel?.nama ?? '—');

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="px-5 pt-5 pb-4 text-center border-b border-gray-100 dark:border-gray-800">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                        <Layers className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Upload Sejenjang</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.pembelajaran?.mata_pelajaran?.nama ?? '—'} &middot; Kelas {kelasNama}
                    </p>
                </div>

                {/* Daftar rombel */}
                <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                        {allRombel.length} Rombel di jenjang ini
                    </p>
                    <div className="space-y-1">
                        {allRombel.map((nama, i) => (
                            <div key={i} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm ${
                                nama === thisRombel
                                    ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 font-medium'
                                    : 'text-gray-600 dark:text-gray-400'
                            }`}>
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${nama === thisRombel ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                {nama}
                                {nama === thisRombel && (
                                    <span className="ml-auto text-[10px] bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-full font-medium">ini</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pilihan */}
                <div className="px-5 pb-5 space-y-2.5">
                    <button
                        onClick={() => onConfirm(pendingFile, true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors text-left"
                    >
                        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <Users className="h-4 w-4" />
                        </div>
                        <div>
                            <div>Semua {allRombel.length} Rombel</div>
                            <div className="text-xs font-normal text-sky-100">1 file untuk Kelas {kelasNama}</div>
                        </div>
                    </button>

                    <button
                        onClick={() => onConfirm(pendingFile, false)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors text-left"
                    >
                        <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                            <FolderUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <div>Rombel Ini Saja</div>
                            <div className="text-xs font-normal text-gray-400 dark:text-gray-500">{thisRombel} saja</div>
                        </div>
                    </button>

                    <button onClick={onCancel}
                        className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        Batal
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Upload button ─────────────────────────────────────────────── */
function UploadButton({ item, siblings, onUploading }) {
    const fileRef  = useRef();
    const [busy, setBusy]             = useState(false);
    const [showOpt, setShowOpt]       = useState(false);
    const [pendingFile, setPendingFile] = useState(null);

    const accept = resolveAccept(item.pengumpulan?.format_file);

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

            {showOpt && pendingFile && (
                <JenjangDialog
                    item={item}
                    siblings={siblings}
                    pendingFile={pendingFile}
                    onConfirm={doUpload}
                    onCancel={() => { setShowOpt(false); setPendingFile(null); }}
                />
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

/* ── Card per pengumpulan ──────────────────────────────────────── */
function PengumpulanCard({ pengumpulan, items }) {
    const [uploading, setUploading] = useState(false);
    const batasExpired = new Date(pengumpulan.batas_waktu) < new Date();
    const uploaded = items.filter(i => i.file_path).length;

    const siblingMap = {};
    items.forEach(item => {
        const kelasId = item.pembelajaran?.rombel?.kelas_id;
        const mapelId = item.pembelajaran?.mata_pelajaran_id;
        if (!kelasId || !mapelId) return;
        const key = `${mapelId}_${kelasId}`;
        if (!siblingMap[key]) siblingMap[key] = [];
        siblingMap[key].push(item);
    });

    const getSiblings = (item) => {
        const kelasId = item.pembelajaran?.rombel?.kelas_id;
        const mapelId = item.pembelajaran?.mata_pelajaran_id;
        if (!kelasId || !mapelId) return [];
        return (siblingMap[`${mapelId}_${kelasId}`] ?? []).filter(s => s.id !== item.id);
    };

    return (
        <Card>
            {/* Header card */}
            <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl ${
                batasExpired ? 'bg-rose-50/50 dark:bg-rose-900/10' : 'bg-gray-50/50 dark:bg-gray-800/30'
            }`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug">{pengumpulan.judul}</h3>
                        {pengumpulan.deskripsi && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{pengumpulan.deskripsi}</p>
                        )}
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{uploaded}/{items.length}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Sudah upload</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        Batas: {fmtDatetime(pengumpulan.batas_waktu)}
                    </span>
                    <span className="hidden sm:inline text-gray-300 dark:text-gray-600">·</span>
                    <span>Format: {formatLabel(pengumpulan.format_file)}</span>
                    {batasExpired && !pengumpulan.allow_late_upload && (
                        <span className="flex items-center gap-1 text-rose-500">
                            <Lock className="h-3 w-3" /> Portal ditutup
                        </span>
                    )}
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
                            <div key={item.id} className="px-4 py-3 space-y-2">
                                {/* Baris 1: mapel + status */}
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                                            {item.pembelajaran?.mata_pelajaran?.nama ?? '—'}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                            {item.pembelajaran?.rombel?.nama ?? '—'}
                                            {item.pembelajaran?.rombel?.kelas?.nama && (
                                                <span className="ml-1 text-gray-300 dark:text-gray-600">
                                                    · Kelas {item.pembelajaran.rombel.kelas.nama}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] ?? ''}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {item.status}
                                    </span>
                                </div>

                                {/* Baris 2: file info + tombol */}
                                <div className="flex items-center gap-2 justify-between">
                                    {item.file_path ? (
                                        <div className="flex items-center gap-1.5 min-w-0 text-xs text-gray-500 dark:text-gray-400">
                                            <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                            <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                                                className="truncate max-w-[160px] sm:max-w-xs text-sky-600 dark:text-sky-400 hover:underline"
                                                title={fileName(item.file_path)}>
                                                {fileExt(item.file_path)} — {fileName(item.file_path)}
                                            </a>
                                            <span className="hidden sm:inline text-gray-300 dark:text-gray-600 shrink-0">·</span>
                                            <span className="hidden sm:inline whitespace-nowrap shrink-0">{fmtDatetime(item.tgl_upload)}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                            {item.portal_buka ? 'Belum ada file' : 'Portal ditutup'}
                                        </span>
                                    )}

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <UploadButton item={item} siblings={siblings} onUploading={setUploading} />
                                        <DeleteFileButton item={item} />
                                    </div>
                                </div>

                                {/* Tanggal upload mobile */}
                                {item.file_path && (
                                    <p className="sm:hidden text-[11px] text-gray-400 dark:text-gray-600">
                                        Diupload: {fmtDatetime(item.tgl_upload)}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
}

/* ── Main ─────────────────────────────────────────────────────── */
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

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Status:</span>
                    {['Tepat Waktu', 'Terlambat', 'Belum'].map(s => {
                        const Icon = STATUS_ICON[s];
                        return (
                            <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[s]}`}>
                                <Icon className="h-3 w-3" /> {s}
                            </span>
                        );
                    })}
                    <span className="flex items-center gap-1 text-gray-400">
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
