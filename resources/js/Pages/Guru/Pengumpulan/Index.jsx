import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import {
    FolderUp, Upload, Trash2, CheckCircle, Clock, AlertCircle,
    FileText, Calendar, RefreshCw, Users, Lock, X, Layers, User,
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


/* ── Upload button ─────────────────────────────────────────────── */
function UploadButton({ item, onUploading }) {
    const fileRef = useRef();
    const [busy, setBusy] = useState(false);

    const accept = resolveAccept(item.pengumpulan?.format_file);

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setBusy(true); onUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('apply_jenjang', '0');
        router.post(`/guru/pengumpulan/${item.id}/upload`, fd, {
            forceFormData: true,
            onFinish: () => { setBusy(false); onUploading(false); },
        });
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
        </>
    );
}

/* ── Modal konfirmasi cakupan upload untuk grup rombel sejenjang ── */
function ScopeConfirmModal({ group, onClose, onChoose }) {
    const kelasNama  = group.items[0].pembelajaran?.rombel?.kelas?.nama ?? '—';
    const mapelNama  = group.items[0].pembelajaran?.mata_pelajaran?.nama ?? '—';
    const [scope, setScope] = useState('semua');
    const [selectedId, setSelectedId] = useState(group.items[0].id);

    const handleConfirm = () => {
        if (scope === 'semua') {
            onChoose({ itemId: group.items[0].id, jenjang: true });
        } else {
            onChoose({ itemId: selectedId, jenjang: false });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-800/50">
                            <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Pilih Cakupan Upload</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{mapelNama} · Kelas {kelasNama}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Anda mengampu <strong>{mapelNama}</strong> di {group.items.length} rombel sejenjang. Upload untuk semua rombel sekaligus, atau pilih satu rombel saja?
                    </p>

                    {/* Opsi: semua rombel */}
                    <button type="button" onClick={() => setScope('semua')}
                        className={`w-full text-left rounded-xl border-2 p-3 transition-colors flex items-start gap-3 ${
                            scope === 'semua'
                                ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${scope === 'semua' ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                            <Users className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Semua Rombel Sejenjang</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                1 file dipakai untuk {group.items.length} rombel: {group.items.map(i => i.pembelajaran?.rombel?.nama ?? '—').join(', ')}
                            </p>
                        </div>
                    </button>

                    {/* Opsi: rombel tertentu */}
                    <button type="button" onClick={() => setScope('satu')}
                        className={`w-full text-left rounded-xl border-2 p-3 transition-colors flex items-start gap-3 ${
                            scope === 'satu'
                                ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${scope === 'satu' ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                            <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Rombel Tertentu Saja</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">File hanya berlaku untuk satu rombel yang dipilih</p>
                            {scope === 'satu' && (
                                <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}
                                    onClick={e => e.stopPropagation()}
                                    className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    {group.items.map(i => (
                                        <option key={i.id} value={i.id}>{i.pembelajaran?.rombel?.nama ?? '—'}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 bg-gray-50/80 dark:bg-gray-800/40">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        Batal
                    </button>
                    <button type="button" onClick={handleConfirm}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors flex items-center gap-1.5">
                        <Upload className="h-3.5 w-3.5" /> Pilih File
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Upload button khusus grup rombel sejenjang (dengan konfirmasi cakupan) ── */
function GroupedUploadButton({ group, onUploading }) {
    const fileRef = useRef();
    const pendingRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const rep = group.items[0];
    const accept = resolveAccept(rep.pengumpulan?.format_file);
    const portalBuka = group.items.some(i => i.portal_buka);

    const handleChoose = (choice) => {
        pendingRef.current = choice;
        setShowModal(false);
        setTimeout(() => fileRef.current?.click(), 50);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        const pending = pendingRef.current;
        if (!file || !pending) return;
        e.target.value = '';
        setBusy(true); onUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('apply_jenjang', pending.jenjang ? '1' : '0');
        router.post(`/guru/pengumpulan/${pending.itemId}/upload`, fd, {
            forceFormData: true,
            onFinish: () => { setBusy(false); onUploading(false); pendingRef.current = null; },
        });
    };

    return (
        <>
            <input ref={fileRef} type="file" className="hidden" accept={accept} onChange={handleFileChange} />
            <button type="button" disabled={busy || !portalBuka}
                onClick={() => setShowModal(true)}
                title={!portalBuka ? 'Portal upload ditutup' : ''}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60 transition-colors ${
                    portalBuka
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                        : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                }`}
            >
                {!portalBuka ? <Lock className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                {busy ? 'Mengunggah…' : group.items.some(i => i.file_path) ? 'Ganti' : 'Upload'}
            </button>
            {showModal && (
                <ScopeConfirmModal group={group} onClose={() => setShowModal(false)} onChoose={handleChoose} />
            )}
        </>
    );
}

function DeleteFileButton({ item, allJenjang = false }) {
    const handleDelete = () => {
        const msg = allJenjang
            ? 'Hapus file untuk semua rombel sejenjang?'
            : 'Hapus file yang sudah diupload?';
        if (!confirm(msg)) return;
        router.delete(`/guru/pengumpulan/${item.id}/file`, {
            data: allJenjang ? { all_jenjang: true } : {},
        });
    };
    if (!item.file_path) return null;
    return (
        <button onClick={handleDelete}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
        </button>
    );
}

/* ── Row untuk grup "semua rombel sejenjang" ───────────────────── */
function GroupedRow({ group, onUploading }) {
    const rep        = group.items[0];
    const kelasNama  = rep.pembelajaran?.rombel?.kelas?.nama ?? '—';
    const mapelNama  = rep.pembelajaran?.mata_pelajaran?.nama ?? '—';
    const rombelList = group.items.map(i => i.pembelajaran?.rombel?.nama ?? '—').join(' · ');
    const hasFile    = group.items.some(i => i.file_path);
    const portalBuka = group.items.some(i => i.portal_buka);
    const status     = rep.status;
    const StatusIcon = STATUS_ICON[status] ?? Clock;

    return (
        <div className="px-4 py-3 space-y-2">
            {/* Baris 1: mapel + badge semua rombel + status */}
            <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{mapelNama}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-1.5 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/40">
                            <Users className="h-2.5 w-2.5" /> Kelas {kelasNama} · Semua Rombel
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{rombelList}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? ''}`}>
                    <StatusIcon className="h-3 w-3" />{status}
                </span>
            </div>

            {/* Baris 2: file info + tombol */}
            <div className="flex items-center gap-2 justify-between">
                {hasFile ? (
                    <div className="flex items-center gap-1.5 min-w-0 text-xs text-gray-500 dark:text-gray-400">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <a href={rep.file_url} target="_blank" rel="noopener noreferrer"
                            className="truncate max-w-40 sm:max-w-xs text-sky-600 dark:text-sky-400 hover:underline"
                            title={fileName(rep.file_path)}>
                            {fileExt(rep.file_path)} — {fileName(rep.file_path)}
                        </a>
                        <span className="hidden sm:inline text-gray-300 dark:text-gray-600 shrink-0">·</span>
                        <span className="hidden sm:inline whitespace-nowrap shrink-0">{fmtDatetime(rep.tgl_upload)}</span>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                        {portalBuka ? 'Belum ada file' : 'Portal ditutup'}
                    </span>
                )}
                <div className="flex items-center gap-1.5 shrink-0">
                    <GroupedUploadButton group={group} onUploading={onUploading} />
                    {hasFile && <DeleteFileButton item={rep} allJenjang />}
                </div>
            </div>

            {hasFile && (
                <p className="sm:hidden text-[11px] text-gray-400 dark:text-gray-600">
                    Diupload: {fmtDatetime(rep.tgl_upload)}
                </p>
            )}
        </div>
    );
}

/* ── Card per pengumpulan ──────────────────────────────────────── */
function PengumpulanCard({ pengumpulan, items }) {
    const [uploading, setUploading] = useState(false);
    const batasExpired = new Date(pengumpulan.batas_waktu) < new Date();
    const uploaded = items.filter(i => i.file_path).length;

    // Group items by mapel + kelas → tampil sebagai 1 baris "Semua Rombel"
    const groupMap = {};
    items.forEach(item => {
        const kelasId = item.pembelajaran?.rombel?.kelas_id;
        const mapelId = item.pembelajaran?.mata_pelajaran_id;
        const key = (kelasId && mapelId) ? `${mapelId}_${kelasId}` : `solo_${item.id}`;
        if (!groupMap[key]) groupMap[key] = [];
        groupMap[key].push(item);
    });

    const displayGroups = Object.values(groupMap).map(grpItems =>
        grpItems.length > 1
            ? { type: 'group', items: grpItems }
            : { type: 'single', item: grpItems[0] }
    );

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
                    {displayGroups.map((dg, idx) => {
                        if (dg.type === 'group') {
                            return <GroupedRow key={idx} group={dg} onUploading={setUploading} />;
                        }

                        const item       = dg.item;
                        const StatusIcon = STATUS_ICON[item.status] ?? Clock;
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
                                        <StatusIcon className="h-3 w-3" />{item.status}
                                    </span>
                                </div>

                                {/* Baris 2: file info + tombol */}
                                <div className="flex items-center gap-2 justify-between">
                                    {item.file_path ? (
                                        <div className="flex items-center gap-1.5 min-w-0 text-xs text-gray-500 dark:text-gray-400">
                                            <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                            <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                                                className="truncate max-w-40 sm:max-w-xs text-sky-600 dark:text-sky-400 hover:underline"
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
                                        <UploadButton item={item} onUploading={setUploading} />
                                        <DeleteFileButton item={item} />
                                    </div>
                                </div>

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
