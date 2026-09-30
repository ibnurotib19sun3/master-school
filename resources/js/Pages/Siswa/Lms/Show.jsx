import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import { ArrowLeft, FileText, Link as LinkIcon, ExternalLink, Download, CheckCircle2 } from 'lucide-react';

function MateriRow({ item }) {
    const href = `/siswa/lms/materi/${item.id}/akses`;
    return (
        <a href={href} target="_blank" rel="noopener noreferrer"
            className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className={`shrink-0 mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center ${item.is_link ? 'bg-violet-50 dark:bg-violet-900/30' : 'bg-sky-50 dark:bg-sky-900/30'}`}>
                {item.is_link
                    ? <LinkIcon className="h-4 w-4 text-violet-500" />
                    : <FileText className="h-4 w-4 text-sky-500" />}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.judul}</p>
                    {item.sudah_dilihat && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Sudah dibuka
                        </span>
                    )}
                </div>
                {item.deskripsi && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.deskripsi}</p>}
                <p className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1">
                    {item.is_link
                        ? <><ExternalLink className="h-3 w-3" /> Buka link</>
                        : <><Download className="h-3 w-3" /> {item.file_ext?.toUpperCase()}</>}
                </p>
            </div>
        </a>
    );
}

export default function SiswaLmsShow({ pembelajaran, materi }) {
    const groups = {};
    materi.forEach((m) => {
        const key = m.pertemuan_ke ?? '_tanpa';
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a === '_tanpa') return 1;
        if (b === '_tanpa') return -1;
        return Number(a) - Number(b);
    });

    return (
        <AppLayout title="LMS">
            <div className="mb-5">
                <Link href="/siswa/lms" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 mb-2">
                    <ArrowLeft className="h-4 w-4" /> Kembali ke LMS
                </Link>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{pembelajaran.mata_pelajaran?.nama}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{pembelajaran.guru?.user?.name}</p>
            </div>

            {materi.length === 0 ? (
                <Card>
                    <CardBody>
                        <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">Belum ada materi untuk mata pelajaran ini.</p>
                        </div>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-4">
                    {sortedKeys.map((key) => (
                        <Card key={key}>
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    {key === '_tanpa' ? 'Materi Umum' : `Pertemuan ke-${key}`}
                                </p>
                            </div>
                            <CardBody className="p-0 divide-y divide-gray-100 dark:divide-gray-800">
                                {groups[key].map((item) => <MateriRow key={item.id} item={item} />)}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
