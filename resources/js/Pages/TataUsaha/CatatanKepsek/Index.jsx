import AppLayout from '@/Layouts/AppLayout';
import { Card, CardBody } from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import RichContent from '@/Components/ui/RichContent';
import { MessageSquare, CheckCircle, Clock } from 'lucide-react';

const KATEGORI_COLOR = {
    Evaluasi: 'blue', Saran: 'green', Perbaikan: 'yellow',
    Apresiasi: 'indigo', Peringatan: 'red',
};

const KATEGORI_BG = {
    Evaluasi:   'border-l-sky-500',
    Saran:      'border-l-green-500',
    Perbaikan:  'border-l-amber-500',
    Apresiasi:  'border-l-sky-500',
    Peringatan: 'border-l-red-500',
};

export default function TUCatatanKepsek({ catatan }) {
    const fmt = (val) => {
        if (!val) return '-';
        return new Date(val).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
    };

    const items = catatan?.data ?? [];

    return (
        <AppLayout title="Catatan dari Kepala Sekolah">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-sky-600" />
                    Catatan dari Kepala Sekolah
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Catatan evaluasi, saran, dan apresiasi untuk Anda
                </p>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Belum ada catatan untuk Anda.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <Card key={item.id} className={`border-l-4 ${KATEGORI_BG[item.kategori] ?? 'border-l-gray-300'}`}>
                            <CardBody>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <Badge color={KATEGORI_COLOR[item.kategori] ?? 'gray'}>
                                                {item.kategori}
                                            </Badge>
                                            {item.status === 'Dibaca' ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle className="h-3 w-3" /> Sudah dibaca
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 rounded-full px-2 py-0.5">
                                                    Baru
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.judul}</h3>
                                        {item.kepsek && (
                                            <p className="text-xs text-gray-500 mb-3">
                                                Dari: <span className="font-medium text-gray-700 dark:text-gray-300">{item.kepsek?.name}</span>
                                            </p>
                                        )}
                                        <RichContent html={item.catatan} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300" />
                                    </div>
                                    <p className="shrink-0 text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {fmt(item.created_at)}
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
