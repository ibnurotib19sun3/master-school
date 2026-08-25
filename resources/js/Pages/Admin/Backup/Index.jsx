import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Database, Download, Trash2, UploadCloud, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function fmtDate(unix) {
    return new Date(unix * 1000).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function Flash({ flash, errors }) {
    const msg = flash?.success || (errors && Object.values(errors)[0]);
    if (!msg) return null;
    const ok = !!flash?.success;
    return (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium mb-4 ${ok ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
            {ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg}
        </div>
    );
}

export default function BackupIndex({ auth, backups = [], flash, errors }) {
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [restoring, setRestoring] = useState(false);
    const fileRef = useRef(null);
    const { data, setData, post, processing, reset } = useForm({ file: null });

    function handleCreate() {
        setCreating(true);
        router.post('/admin/backup', {}, {
            onFinish: () => setCreating(false),
        });
    }

    function handleDelete(name) {
        if (!confirm(`Hapus backup "${name}"?`)) return;
        setDeleting(name);
        router.delete(`/admin/backup/${name}`, {
            onFinish: () => setDeleting(null),
        });
    }

    function handleRestore(e) {
        e.preventDefault();
        if (!data.file) return;
        if (!confirm('PERHATIAN: Restore akan menimpa seluruh data database dengan data backup. Lanjutkan?')) return;
        setRestoring(true);
        post('/admin/backup/restore', {
            forceFormData: true,
            onFinish: () => { setRestoring(false); reset(); if (fileRef.current) fileRef.current.value = ''; },
        });
    }

    return (
        <AppLayout title="Backup & Restore">
            <Head title="Backup & Restore" />

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-100 dark:bg-sky-900/40 rounded-xl text-sky-600 dark:text-sky-400">
                        <Database size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Backup & Restore</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cadangan dan pemulihan database</p>
                    </div>
                </div>

                <Flash flash={flash} errors={errors} />

                {/* Create Backup */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Buat Backup Baru</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Backup akan menyalin seluruh data database ke file <code className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">.sql</code> dan disimpan di server.
                    </p>
                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-60 transition"
                    >
                        <Database size={16} className={creating ? 'animate-spin' : ''} />
                        {creating ? 'Membuat Backup...' : 'Buat Backup Sekarang'}
                    </button>
                </div>

                {/* Backup List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Daftar Backup
                        </h2>
                        <span className="text-xs text-gray-400">{backups.length} file</span>
                    </div>

                    {backups.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-gray-400 dark:text-gray-500">
                            <Database size={36} className="opacity-30" />
                            <p className="text-sm">Belum ada file backup</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {backups.map((b) => (
                                <div key={b.name} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate">{b.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {fmtDate(b.created)} · {fmtSize(b.size)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <a
                                            href={`/admin/backup/${b.name}/download`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
                                        >
                                            <Download size={13} /> Unduh
                                        </a>
                                        <button
                                            onClick={() => handleDelete(b.name)}
                                            disabled={deleting === b.name}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 transition"
                                        >
                                            <Trash2 size={13} /> {deleting === b.name ? 'Menghapus...' : 'Hapus'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Restore */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Restore Database</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Upload file <code className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">.sql</code> untuk memulihkan database.
                        <span className="text-red-500 font-medium"> Proses ini akan menimpa seluruh data yang ada!</span>
                    </p>

                    <form onSubmit={handleRestore} className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-400 dark:hover:border-sky-500 transition cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                            <UploadCloud size={16} />
                            <span className="truncate">
                                {data.file ? data.file.name : 'Pilih file .sql...'}
                            </span>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".sql"
                                className="hidden"
                                onChange={e => setData('file', e.target.files[0] || null)}
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={!data.file || processing || restoring}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition"
                        >
                            <RefreshCw size={15} className={restoring ? 'animate-spin' : ''} />
                            {restoring ? 'Memulihkan...' : 'Restore'}
                        </button>
                    </form>

                    {errors?.file && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.file}</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
