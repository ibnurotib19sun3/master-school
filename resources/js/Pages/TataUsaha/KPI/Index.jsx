import AppLayout from '@/Layouts/AppLayout';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import { TrendingUp, UserCheck, BookOpen, Star, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react';

const BULAN_LABELS = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

function formatBulan(ym) {
    if (!ym) return '–';
    const [y, m] = ym.split('-');
    return `${BULAN_LABELS[parseInt(m) - 1]} ${y}`;
}

function GradeLabel({ nilai }) {
    if (nilai >= 90) return <span className="font-bold text-emerald-600 dark:text-emerald-400">A</span>;
    if (nilai >= 80) return <span className="font-bold text-sky-600 dark:text-sky-400">B</span>;
    if (nilai >= 70) return <span className="font-bold text-yellow-600 dark:text-yellow-400">C</span>;
    return <span className="font-bold text-red-600 dark:text-red-400">D</span>;
}

function BarRow({ label, persen, bobot, icon: Icon, color }) {
    const barCls = persen >= 80 ? 'bg-emerald-500' : persen >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    <span className="text-xs text-gray-400">bobot {bobot}%</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{persen}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className={`h-2 rounded-full transition-all ${barCls}`} style={{ width: `${Math.min(persen, 100)}%` }} />
            </div>
        </div>
    );
}

function KpiCard({ item }) {
    const nilai = Number(item.nilai_akhir ?? 0);
    const isBaik = nilai >= 80;

    return (
        <Card className="overflow-hidden">
            <div className={`h-1.5 ${isBaik ? 'bg-emerald-500' : nilai >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <CardBody className="space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{formatBulan(item.bulan)}</p>
                        </div>
                        {item.tahun_ajaran && (
                            <p className="text-xs text-gray-400 ml-6">{item.tahun_ajaran}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className={`text-3xl font-black leading-none ${
                            nilai >= 80 ? 'text-emerald-600 dark:text-emerald-400'
                            : nilai >= 60 ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>{nilai}</div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center justify-end gap-1">
                            Predikat <GradeLabel nilai={nilai} />
                        </div>
                    </div>
                </div>

                <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                    <BarRow
                        label="Keaktifan Kehadiran"
                        persen={Number(item.persen_tu ?? 0)}
                        bobot={Number(item.bobot_tu ?? 50)}
                        icon={UserCheck}
                        color="text-violet-500"
                    />
                    <BarRow
                        label="Keaktifan Jurnal TU"
                        persen={Number(item.persen_jurnal ?? 0)}
                        bobot={Number(item.bobot_jurnal ?? 50)}
                        icon={BookOpen}
                        color="text-emerald-500"
                    />
                </div>

                <div className="flex items-start gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                    {isBaik
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    }
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.catatan
                            ? item.catatan
                            : isBaik ? 'KPI bulan ini memenuhi target.' : 'KPI bulan ini belum memenuhi target 80.'}
                    </p>
                </div>
            </CardBody>
        </Card>
    );
}

function RingkasanCard({ rekap }) {
    if (!rekap.length) return null;
    const rataTu     = Math.round(rekap.reduce((s, r) => s + Number(r.persen_tu ?? 0), 0) / rekap.length * 10) / 10;
    const rataJurnal = Math.round(rekap.reduce((s, r) => s + Number(r.persen_jurnal ?? 0), 0) / rekap.length * 10) / 10;
    const rataNilai  = Math.round(rekap.reduce((s, r) => s + Number(r.nilai_akhir ?? 0), 0) / rekap.length * 10) / 10;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" /> Ringkasan Keseluruhan
                </CardTitle>
            </CardHeader>
            <CardBody>
                <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 text-center">
                    {[
                        { label: 'Rata-rata Kehadiran', value: `${rataTu}%`,   icon: UserCheck,  color: 'text-violet-500' },
                        { label: 'Rata-rata Jurnal',    value: `${rataJurnal}%`, icon: BookOpen, color: 'text-emerald-500' },
                        { label: 'Rata-rata Nilai KPI', value: rataNilai,       icon: TrendingUp, color: 'text-amber-500' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="px-4 py-3">
                            <Icon className={`h-5 w-5 mx-auto mb-1.5 ${color}`} />
                            <p className={`text-2xl font-black ${color}`}>{value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}

export default function TatausahaKPI({ rekap = [] }) {
    return (
        <AppLayout title="Laporan KPI Saya">
            <div className="space-y-6">
                {rekap.length === 0 ? (
                    <Card>
                        <CardBody className="py-16 text-center">
                            <Star className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                            <p className="font-medium text-gray-500 dark:text-gray-400">Belum ada data KPI.</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                KPI akan muncul di sini setelah dinilai oleh Kepala Tata Usaha.
                            </p>
                        </CardBody>
                    </Card>
                ) : (
                    <>
                        <RingkasanCard rekap={rekap} />
                        <div>
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                Riwayat KPI Per Bulan
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {rekap.map((item) => (
                                    <KpiCard key={item.bulan} item={item} />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
