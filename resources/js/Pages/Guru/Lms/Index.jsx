import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import { Layers, BookOpen, ChevronRight } from 'lucide-react';

export default function LmsIndex({ pembelajaran, tahunAktif }) {
    return (
        <AppLayout title="LMS">
            <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-sky-500" /> LMS — Materi Pembelajaran
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Pilih kelas untuk mengelola materi (file/link) per pertemuan
                    {tahunAktif && <> · {tahunAktif.nama} — {tahunAktif.semester}</>}
                </p>
            </div>

            {pembelajaran.length === 0 ? (
                <Card>
                    <CardBody>
                        <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                            <Layers className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">Belum ada kelas yang diampu di tahun ajaran ini.</p>
                        </div>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pembelajaran.map((p) => (
                        <Link key={p.id} href={`/guru/lms/${p.id}`}
                            className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 p-3 shadow-md">
                                    <BookOpen className="h-5 w-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{p.mapel}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {p.kelas ? `Kelas ${p.kelas} · ` : ''}{p.rombel}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                                {p.jumlah_materi} materi tersimpan
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
