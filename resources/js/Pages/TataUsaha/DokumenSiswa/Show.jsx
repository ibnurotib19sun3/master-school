import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import {
    ArrowLeft, FileText, FileImage, File, Download, Eye, Upload,
    Trash2, Loader2, CheckCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';

function fileIcon(ext) {
    if (['jpg', 'jpeg', 'png'].includes(ext)) return FileImage;
    if (ext === 'pdf') return FileText;
    return File;
}

const TYPE_LABEL = { jpg: 'JPG/JPEG', png: 'PNG', pdf: 'PDF' };

export default function DokumenSiswaShow({ siswa, jenisList, dokumen }) {
    const [uploadingId, setUploadingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const fileInputs = useRef({});

    const triggerUpload = (jenisId) => fileInputs.current[jenisId]?.click();

    const handleFileChange = (jenis, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('dokumen_jenis_id', jenis.id);
        formData.append('file', file);

        setUploadingId(jenis.id);
        router.post(`/tatausaha/dokumen-siswa/${siswa.id}`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploadingId(null);
                e.target.value = '';
            },
        });
    };

    return (
        <AppLayout title={`Dokumen — ${siswa.user?.name ?? ''}`}>
            <div className="space-y-5">
                <Link href="/tatausaha/dokumen-siswa"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>

                <Card>
                    <CardBody className="p-5 flex items-center gap-4">
                        <img src={siswa.user?.avatar_url} alt="" className="h-16 w-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{siswa.user?.name}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">NIS {siswa.nis} · {siswa.rombel?.nama ?? '–'}</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Dokumen ({Object.keys(dokumen).length}/{jenisList.length})</CardTitle></CardHeader>
                    <CardBody className="p-0">
                        {jenisList.length === 0 ? (
                            <div className="py-10 text-center text-sm text-gray-400">
                                Belum ada jenis dokumen yang diatur. Atur dulu di menu "Jenis Dokumen Siswa".
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {jenisList.map((jenis) => {
                                    const d = dokumen[jenis.id];
                                    const Icon = d ? fileIcon(d.file_ext) : FileText;
                                    const isUploading = uploadingId === jenis.id;
                                    return (
                                        <div key={jenis.id} className="flex items-center gap-3 px-5 py-3.5 flex-wrap">
                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${d ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                                                {d ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{jenis.nama}</p>
                                                <p className="text-xs text-gray-400">
                                                    Tipe diterima: {(jenis.allowed_types ?? []).map((t) => TYPE_LABEL[t] ?? t).join(', ')}
                                                    {d && (
                                                        <> · diunggah {new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        {d.pengunggah?.name && ` oleh ${d.pengunggah.name}`}</>
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {d && (
                                                    <>
                                                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" title="Lihat"
                                                            className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-sky-600 hover:border-sky-300 transition-colors">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </a>
                                                        <a href={d.file_url} download title="Unduh"
                                                            className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors">
                                                            <Download className="h-3.5 w-3.5" />
                                                        </a>
                                                        <button onClick={() => setDeleteTarget(d)} title="Hapus"
                                                            className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-rose-600 hover:border-rose-300 transition-colors">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={(el) => (fileInputs.current[jenis.id] = el)}
                                                    accept={(jenis.allowed_types ?? []).map((t) => (t === 'jpg' ? '.jpg,.jpeg' : `.${t}`)).join(',')}
                                                    className="hidden"
                                                    onChange={(e) => handleFileChange(jenis, e)}
                                                />
                                                <button
                                                    onClick={() => triggerUpload(jenis.id)}
                                                    disabled={isUploading}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 transition-colors"
                                                >
                                                    {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                                    {d ? 'Ganti' : 'Unggah'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Dokumen"
                message="Dokumen ini akan dihapus permanen dan tidak bisa dikembalikan."
                onConfirm={() => { router.delete(`/tatausaha/dokumen-siswa/item/${deleteTarget.id}`, { preserveScroll: true }); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}
