import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import {
    ArrowLeft, User, FileText, FileImage, File, Download, Eye, BookOpen,
} from 'lucide-react';

const statusColors = { Aktif: 'green', Mutasi: 'yellow', Lulus: 'blue', DO: 'red' };

function fileIcon(ext) {
    if (['jpg', 'jpeg', 'png'].includes(ext)) return FileImage;
    if (ext === 'pdf') return FileText;
    return File;
}

function InfoRow({ label, value }) {
    return (
        <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value ?? '–'}</p>
        </div>
    );
}

export default function SiswaShow({ siswa, jenisList, dokumen }) {
    const u = siswa.user ?? {};

    return (
        <AppLayout title={`Detail Siswa — ${u.name ?? ''}`}>
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <Link href="/admin/siswa"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Link>
                </div>

                <Card>
                    <CardBody className="p-5">
                        <div className="flex items-start gap-4 flex-wrap">
                            <img src={u.avatar_url} alt={u.name} className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{u.name}</h1>
                                    <Badge color={statusColors[siswa.status_siswa] ?? 'gray'}>{siswa.status_siswa}</Badge>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    NIS {siswa.nis} {siswa.nisn && <>· NISN {siswa.nisn}</>}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                    {siswa.rombel?.nama ?? 'Belum ada rombel'}
                                    {siswa.jurusan?.nama && <> · {siswa.jurusan.nama}</>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                            <InfoRow label="Email" value={u.email} />
                            <InfoRow label="Jenis Kelamin" value={u.gender === 'L' ? 'Laki-laki' : u.gender === 'P' ? 'Perempuan' : null} />
                            <InfoRow label="Tempat, Tanggal Lahir" value={[siswa.tempat_lahir, u.tanggal_lahir].filter(Boolean).join(', ') || null} />
                            <InfoRow label="Agama" value={siswa.agama} />
                            <InfoRow label="Alamat" value={u.alamat} />
                            <InfoRow label="Tahun Ajaran" value={siswa.tahun_ajaran?.nama} />
                            <InfoRow label="Tanggal Masuk" value={siswa.tanggal_masuk} />
                        </div>
                    </CardBody>
                </Card>

                {siswa.orang_tua && (
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /> Data Orang Tua</CardTitle></CardHeader>
                        <CardBody className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoRow label="Nama Ayah" value={siswa.orang_tua.nama_ayah} />
                            <InfoRow label="Nama Ibu" value={siswa.orang_tua.nama_ibu} />
                            <InfoRow label="Pekerjaan Ayah" value={siswa.orang_tua.pekerjaan_ayah} />
                            <InfoRow label="Pekerjaan Ibu" value={siswa.orang_tua.pekerjaan_ibu} />
                            <InfoRow label="No. HP Ayah" value={siswa.orang_tua.phone_ayah} />
                            <InfoRow label="No. HP Ibu" value={siswa.orang_tua.phone_ibu} />
                            <InfoRow label="Alamat" value={siswa.orang_tua.alamat} />
                        </CardBody>
                    </Card>
                )}

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" /> Dokumen Siswa</CardTitle></CardHeader>
                    <CardBody className="p-0">
                        {jenisList.length === 0 ? (
                            <div className="py-10 text-center text-sm text-gray-400">Belum ada jenis dokumen yang diatur.</div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {jenisList.map((jenis) => {
                                    const d = dokumen[jenis.id];
                                    const Icon = d ? fileIcon(d.file_ext) : FileText;
                                    return (
                                        <div key={jenis.id} className="flex items-center gap-3 px-5 py-3.5">
                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${d ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{jenis.nama}</p>
                                                <p className="text-xs text-gray-400">
                                                    {d ? `Diunggah ${new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · ${d.file_ext?.toUpperCase()}` : 'Belum diunggah'}
                                                </p>
                                            </div>
                                            {d && (
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" title="Lihat"
                                                        className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-sky-600 hover:border-sky-300 transition-colors">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </a>
                                                    <a href={d.file_url} download title="Unduh"
                                                        className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors">
                                                        <Download className="h-3.5 w-3.5" />
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
