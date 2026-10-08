import AppLayout from '@/Layouts/AppLayout';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import { FileStack, FileText, FileImage, File, Download, Eye, Clock } from 'lucide-react';

function fileIcon(ext) {
    if (['jpg', 'jpeg', 'png'].includes(ext)) return FileImage;
    if (ext === 'pdf') return FileText;
    return File;
}

export default function SiswaDokumenIndex({ jenisList, dokumen }) {
    const total     = jenisList.length;
    const terunggah = Object.keys(dokumen).length;

    return (
        <AppLayout title="Dokumen Saya">
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileStack className="h-5 w-5 text-sky-500" /> Dokumen Saya
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Dokumen yang sudah diunggah Tatausaha untuk Anda — {terunggah} dari {total} jenis dokumen.
                    </p>
                </div>

                <Card>
                    <CardHeader><CardTitle>Daftar Dokumen</CardTitle></CardHeader>
                    <CardBody className="p-0">
                        {jenisList.length === 0 ? (
                            <div className="py-16 text-center text-sm text-gray-400">Belum ada jenis dokumen yang diatur sekolah.</div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {jenisList.map((jenis) => {
                                    const d = dokumen[jenis.id];
                                    const Icon = d ? fileIcon(d.file_ext) : FileText;
                                    return (
                                        <div key={jenis.id} className="flex items-center gap-3 px-5 py-3.5">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${d ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                                                <Icon className="h-4.5 w-4.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{jenis.nama}</p>
                                                {d ? (
                                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        Diunggah {new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-amber-500 mt-0.5">Belum diunggah oleh Tatausaha</p>
                                                )}
                                            </div>
                                            {d && (
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" title="Lihat"
                                                        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-sky-600 hover:border-sky-300 transition-colors">
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                    <a href={d.file_url} download title="Unduh"
                                                        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
