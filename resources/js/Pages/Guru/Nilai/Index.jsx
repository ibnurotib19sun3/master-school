import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import { BarChart3, ChevronRight, BookOpen, CheckCircle } from 'lucide-react';

export default function NilaiIndex({ pembelajaran }) {
    return (
        <AppLayout title="Input Nilai">
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-sky-600" />
                        Input Nilai
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Pilih kelas untuk mulai input nilai berdasarkan jurnal mengajar
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pembelajaran.length === 0 && (
                        <div className="col-span-full text-center py-16 text-gray-400">
                            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p>Tidak ada kelas yang diampu saat ini.</p>
                        </div>
                    )}
                    {pembelajaran.map((p) => (
                        <Link key={p.id} href={`/guru/nilai/${p.id}`}>
                            <Card className="hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md transition-all cursor-pointer h-full">
                                <CardBody>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="rounded-xl bg-sky-50 dark:bg-sky-900/30 p-3">
                                            <BarChart3 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400 mt-2" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{p.mata_pelajaran?.nama}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{p.rombel?.nama}</p>
                                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <BookOpen className="h-3 w-3" />
                                            {p.jurnal_count} jurnal
                                        </div>
                                        {p.nilai_count > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                <CheckCircle className="h-3 w-3" />
                                                {p.nilai_count} sudah dinilai
                                            </div>
                                        )}
                                        <span className="ml-auto text-xs text-gray-400">KKM: {p.mata_pelajaran?.kkm ?? 75}</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
