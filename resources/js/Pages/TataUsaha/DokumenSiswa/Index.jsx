import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import {
    Search, X, FileStack, ChevronLeft, ChevronRight,
    Eye, RefreshCw, Trash2, UploadCloud, Loader2,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

function Pagination({ data }) {
    const { current_page, last_page, from, to, total, prev_page_url, next_page_url } = data;
    if (last_page <= 1) return null;
    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">{from}–{to} dari {total}</p>
            <div className="flex gap-2">
                <button disabled={!prev_page_url} onClick={() => prev_page_url && router.get(prev_page_url, {}, { preserveState: true })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800">
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button disabled={!next_page_url} onClick={() => next_page_url && router.get(next_page_url, {}, { preserveState: true })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800">
                    Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

/* Satu sel matrix: ikon upload kalau kosong, atau Lihat/Ganti/Hapus kalau sudah ada —
   semua aksi langsung dari tabel supaya TU tidak perlu pindah halaman per siswa. */
function DokumenCell({ siswa, jenis, doc, onUploading, uploadingKey, setDeleteTarget }) {
    const fileInput = useRef(null);
    const isUploading = uploadingKey === `${siswa.id}-${jenis.id}`;

    const accept = (jenis.allowed_types ?? []).map((t) => (t === 'jpg' ? '.jpg,.jpeg' : `.${t}`)).join(',');

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('dokumen_jenis_id', jenis.id);
        formData.append('file', file);

        onUploading(`${siswa.id}-${jenis.id}`);
        router.post(`/tatausaha/dokumen-siswa/${siswa.id}`, formData, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                onUploading(null);
                e.target.value = '';
            },
        });
    };

    return (
        <td className="px-2 py-2 text-center align-middle">
            <input type="file" ref={fileInput} accept={accept} className="hidden" onChange={handleChange} />
            {isUploading ? (
                <div className="inline-flex items-center justify-center h-8 w-8">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                </div>
            ) : doc ? (
                <div className="inline-flex items-center gap-0.5">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" title="Lihat dokumen"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                    </a>
                    <button title="Ganti dokumen" onClick={() => fileInput.current?.click()}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button title="Hapus dokumen" onClick={() => setDeleteTarget({ ...doc, siswaNama: siswa.user?.name, jenisNama: jenis.nama })}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <button title={`Unggah ${jenis.nama}`} onClick={() => fileInput.current?.click()}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-sky-400 hover:text-sky-500 dark:hover:border-sky-500 dark:hover:text-sky-400 transition-colors">
                    <UploadCloud className="h-4 w-4" />
                </button>
            )}
        </td>
    );
}

export default function DokumenSiswaIndex({ siswa, jenisList, rombel, filters }) {
    const [search,   setSearch]   = useState(filters.search ?? '');
    const [rombelId, setRombelId] = useState(filters.rombel_id ?? '');
    const [uploadingKey, setUploadingKey] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/tatausaha/dokumen-siswa', { search: search || undefined, rombel_id: rombelId || undefined }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search, rombelId]);

    return (
        <AppLayout title="Dokumen Siswa">
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileStack className="h-5 w-5 text-sky-500" /> Dokumen Siswa
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Klik ikon di kolom jenis dokumen untuk mengunggah, mengganti, melihat, atau menghapus dokumen siswa.
                    </p>
                </div>

                <Card>
                    <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle>Daftar Siswa ({siswa.total})</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                            <select value={rombelId} onChange={(e) => setRombelId(e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                                <option value="">Semua Rombel</option>
                                {rombel.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                            </select>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama / NIS…"
                                    className="pl-8 pr-8 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-48" />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {jenisList.length === 0 ? (
                            <div className="py-16 text-center text-sm text-gray-400">
                                Belum ada jenis dokumen yang diatur. Atur dulu di menu "Jenis Dokumen Siswa".
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium sticky left-0 bg-gray-50 dark:bg-gray-900/50 min-w-56">Siswa</th>
                                            {jenisList.map((j) => (
                                                <th key={j.id} className="px-2 py-3 text-center font-medium min-w-28">{j.nama}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {siswa.data.length === 0 ? (
                                            <tr><td colSpan={jenisList.length + 1} className="px-4 py-16 text-center text-sm text-gray-400">Tidak ada siswa ditemukan.</td></tr>
                                        ) : siswa.data.map((s) => (
                                            <tr key={s.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                                                <td className="px-4 py-2.5 sticky left-0 bg-white dark:bg-gray-900">
                                                    <div className="flex items-center gap-2.5">
                                                        <img src={s.user?.avatar_url} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-gray-700" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.user?.name}</p>
                                                            <p className="text-xs text-gray-400">NIS {s.nis} · {s.rombel?.nama ?? '–'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {jenisList.map((j) => (
                                                    <DokumenCell
                                                        key={j.id}
                                                        siswa={s}
                                                        jenis={j}
                                                        doc={s.dokumen_siswa?.[j.id]}
                                                        onUploading={setUploadingKey}
                                                        uploadingKey={uploadingKey}
                                                        setDeleteTarget={setDeleteTarget}
                                                    />
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Pagination data={siswa} />
                    </CardBody>
                </Card>
            </div>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Dokumen"
                message={`Dokumen "${deleteTarget?.jenisNama}" milik ${deleteTarget?.siswaNama} akan dihapus permanen.`}
                onConfirm={() => { router.delete(`/tatausaha/dokumen-siswa/item/${deleteTarget.id}`, { preserveScroll: true, preserveState: true }); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}
