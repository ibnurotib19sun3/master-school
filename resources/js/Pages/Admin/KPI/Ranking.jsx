import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import {
    Trophy, Medal, Crown, UserCheck, BarChart2, TrendingUp,
    ChevronDown, BookOpen, Star,
} from 'lucide-react';
import { useState } from 'react';

const BULAN_LABELS = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

function bulanLabel(val) {
    if (!val) return '–';
    const [y, m] = val.split('-');
    return `${BULAN_LABELS[parseInt(m) - 1]} ${y}`;
}

function medalColor(rank) {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-300 dark:text-gray-600';
}

function RankBadge({ rank }) {
    if (rank === 1) return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <Trophy className="h-4 w-4 text-yellow-500" />
        </div>
    );
    if (rank === 2) return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Medal className="h-4 w-4 text-gray-400" />
        </div>
    );
    if (rank === 3) return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Medal className="h-4 w-4 text-amber-600" />
        </div>
    );
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm font-bold tabular-nums">
            {rank}
        </div>
    );
}

function NilaiPill({ nilai }) {
    const cls = nilai >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : nilai >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold tabular-nums ${cls}`}>
            {nilai}
        </span>
    );
}

function ProgressBar({ nilai, max = 100 }) {
    const pct = max > 0 ? Math.min((nilai / max) * 100, 100) : 0;
    const cls = nilai >= 80 ? 'bg-emerald-500' : nilai >= 60 ? 'bg-yellow-500' : 'bg-red-400';
    return (
        <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
            <div className={`h-2 rounded-full transition-all ${cls}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

function GrafBars({ indikator }) {
    return (
        <div className="space-y-1 mt-1.5">
            {indikator.map((ind, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="w-24 truncate shrink-0">{ind.nama ?? '–'}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className={`h-1.5 rounded-full ${ind.persen >= 80 ? 'bg-emerald-500' : ind.persen >= 60 ? 'bg-yellow-500' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(ind.persen ?? 0, 100)}%` }} />
                    </div>
                    <span className="w-10 text-right tabular-nums">{ind.persen ?? 0}%</span>
                </div>
            ))}
        </div>
    );
}

function RankingTable({ data, nameKey = 'nama', showTipe = false, emptyText = 'Belum ada data.' }) {
    const maxNilai = data.length > 0 ? data[0].nilai : 100;
    return (
        <div className="space-y-2">
            {data.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">{emptyText}</p>
            )}
            {data.map((item) => (
                <div key={item.guru_id ?? item.tatausaha_id ?? item.rank}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${item.rank <= 3 ? 'border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/10' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                    <RankBadge rank={item.rank} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{item[nameKey] ?? '—'}</span>
                            {showTipe && item.tipe === 'manajemen' && (
                                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                                    <Crown className="h-2.5 w-2.5" /> Manajemen
                                </span>
                            )}
                            {item.jumlah_bulan != null && (
                                <span className="text-xs text-gray-400">({item.jumlah_bulan} bulan)</span>
                            )}
                        </div>
                        {item.indikator && item.indikator.length > 0 && <GrafBars indikator={item.indikator} />}
                        <div className="flex items-center gap-2 mt-1.5">
                            <ProgressBar nilai={item.nilai} max={maxNilai > 0 ? maxNilai : 100} />
                        </div>
                    </div>
                    <NilaiPill nilai={item.nilai} />
                </div>
            ))}
        </div>
    );
}

export default function Ranking({ rankingGuru = [], rankingTu = [], rankingAkhirGuru = [], rankingAkhirTu = [], bulan, bulanList = [], tahunAjaran = [] }) {
    const [activeSection, setActiveSection] = useState('guru'); // guru | tu
    const [activeTab, setActiveTab]         = useState('bulan'); // bulan | akhir

    const changeBulan = (b) => {
        router.get('/admin/kpi/ranking', { bulan: b }, { preserveState: false });
    };

    const guruData    = activeTab === 'akhir' ? rankingAkhirGuru : rankingGuru;
    const tuData      = activeTab === 'akhir' ? rankingAkhirTu   : rankingTu;
    const currentData = activeSection === 'guru' ? guruData : tuData;

    return (
        <AppLayout title="Ranking KPI">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Ranking KPI
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {activeTab === 'akhir' ? 'Rata-rata nilai KPI seluruh bulan' : `Periode: ${bulanLabel(bulan)}`}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2 flex-wrap">
                    <a href="/admin/kpi"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <BarChart2 className="h-4 w-4" />
                        KPI Guru
                    </a>
                    <a href="/admin/kpi-tatausaha"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <BarChart2 className="h-4 w-4" />
                        KPI Tata Usaha
                    </a>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Section toggle: Guru / Tata Usaha */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <button type="button" onClick={() => setActiveSection('guru')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeSection === 'guru' ? 'bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        <UserCheck className="h-4 w-4" /> Guru
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 tabular-nums">
                            {guruData.length}
                        </span>
                    </button>
                    <button type="button" onClick={() => setActiveSection('tu')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeSection === 'tu' ? 'bg-white dark:bg-gray-900 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        <BookOpen className="h-4 w-4" /> Tata Usaha
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 tabular-nums">
                            {tuData.length}
                        </span>
                    </button>
                </div>

                {/* Tab: Per Bulan / Ranking Akhir */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <button type="button" onClick={() => setActiveTab('bulan')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'bulan' ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        Per Bulan
                    </button>
                    <button type="button" onClick={() => setActiveTab('akhir')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'akhir' ? 'bg-white dark:bg-gray-900 text-yellow-700 dark:text-yellow-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        <Star className="h-3.5 w-3.5" /> Ranking Akhir
                    </button>
                </div>

                {/* Bulan filter (only for per-bulan tab) */}
                {activeTab === 'bulan' && (
                    <div className="flex items-center gap-2 ml-auto">
                        <label className="text-sm text-gray-500 dark:text-gray-400">Bulan:</label>
                        <div className="relative">
                            <select value={bulan} onChange={(e) => changeBulan(e.target.value)}
                                className="appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-1.5 pr-8 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                {bulanList.map((b) => (
                                    <option key={b} value={b}>{bulanLabel(b)}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                )}

                {activeTab === 'akhir' && (
                    <p className="ml-auto text-xs text-gray-400 dark:text-gray-500 italic">
                        Rata-rata nilai dari semua bulan yang sudah dihitung
                    </p>
                )}
            </div>

            {/* Top 3 Podium (per bulan only, ada data) */}
            {activeTab === 'bulan' && currentData.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[currentData[1], currentData[0], currentData[2]].map((item, idx) => {
                        if (!item) return null;
                        const positions = [2, 1, 3];
                        const rank = positions[idx];
                        const heights = ['h-20', 'h-28', 'h-16'];
                        const colors = [
                            'from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700',
                            'from-yellow-400 to-amber-300 dark:from-yellow-600 dark:to-amber-500',
                            'from-amber-500 to-orange-400 dark:from-amber-700 dark:to-orange-600',
                        ];
                        return (
                            <div key={item.guru_id ?? item.tatausaha_id} className="flex flex-col items-center gap-2">
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-24">{item.nama}</p>
                                    <NilaiPill nilai={item.nilai} />
                                </div>
                                <div className={`w-full rounded-t-xl ${heights[idx]} bg-linear-to-b ${colors[idx]} flex items-start justify-center pt-2`}>
                                    <span className="text-white font-black text-xl">#{rank}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Ranking List */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {activeSection === 'guru' ? 'Ranking Guru' : 'Ranking Tata Usaha'}
                        {activeTab === 'akhir' && <span className="ml-2 text-xs font-normal text-gray-400">(rata-rata semua bulan)</span>}
                        {activeTab === 'bulan' && <span className="ml-2 text-xs font-normal text-gray-400">({bulanLabel(bulan)})</span>}
                    </CardTitle>
                </CardHeader>
                <CardBody>
                    <RankingTable
                        data={currentData}
                        nameKey="nama"
                        showTipe={activeSection === 'guru'}
                        emptyText={activeTab === 'bulan'
                            ? `Belum ada data KPI ${activeSection === 'guru' ? 'guru' : 'tata usaha'} untuk bulan ${bulanLabel(bulan)}.`
                            : `Belum ada data KPI ${activeSection === 'guru' ? 'guru' : 'tata usaha'}.`
                        }
                    />
                </CardBody>
            </Card>
        </AppLayout>
    );
}
