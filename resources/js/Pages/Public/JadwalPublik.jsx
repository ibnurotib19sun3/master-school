import { useState, useEffect, Fragment } from 'react';
import { Head } from '@inertiajs/react';
import {
    School, Clock, Sun, Moon, Coffee, Calendar, ChevronDown,
    FileText, BookOpen, User,
} from 'lucide-react';

const PIKET_BADGE = {
    Hadir:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Sakit:         'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    Izin:          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    Alpha:         'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    Tugas_Sekolah: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};
const PIKET_LABEL = {
    Hadir: 'Hadir', Sakit: 'Sakit', Izin: 'Izin', Alpha: 'Alpha', Tugas_Sekolah: 'Tugas Sekolah',
};

function LiveClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <span className="font-mono tabular-nums tracking-tight">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
    );
}

const toMin = (t) => { const [h, m] = (t ?? '00:00').split(':').map(Number); return h * 60 + m; };

function detectCurrentJam(jadwal) {
    const cur = new Date().getHours() * 60 + new Date().getMinutes();
    const seen = new Set();
    for (const j of jadwal) {
        if (seen.has(j.jam_ke)) continue;
        seen.add(j.jam_ke);
        if (cur >= toMin(j.jam_mulai) && cur < toMin(j.jam_selesai)) return j.jam_ke;
    }
    return null;
}

function detectCurrentBreak(jadwal, istirahat) {
    if (!istirahat?.length || !jadwal?.length) return null;
    const cur = new Date().getHours() * 60 + new Date().getMinutes();
    const selesaiMap = {};
    for (const j of jadwal) {
        if (!selesaiMap[j.jam_ke]) selesaiMap[j.jam_ke] = j.jam_selesai;
    }
    for (const brk of istirahat) {
        const selesai = selesaiMap[brk.setelah_jp];
        if (!selesai) continue;
        const start = toMin(selesai);
        if (cur >= start && cur < start + brk.durasi_menit) return brk;
    }
    return null;
}

function JadwalCard({ j, isCurrent, isToday }) {
    return (
        <div className={`rounded-lg border p-2 text-[11px] transition-colors ${
            isCurrent
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-l-emerald-400 border-t-emerald-100 border-r-emerald-100 border-b-emerald-100 dark:border-l-emerald-500 dark:border-t-emerald-900 dark:border-r-emerald-900 dark:border-b-emerald-900 shadow-sm shadow-emerald-100 dark:shadow-none'
                : 'bg-white dark:bg-gray-800/60 border-l-2 border-l-sky-300 dark:border-l-sky-600 border-t-gray-100 border-r-gray-100 border-b-gray-100 dark:border-t-gray-700 dark:border-r-gray-700 dark:border-b-gray-700 shadow-sm'
        }`}>
            <p className="font-bold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                {j.mata_pelajaran}
            </p>
            <p className="text-gray-400 dark:text-gray-500 mt-0.5 truncate flex items-center gap-1">
                <User className="h-2.5 w-2.5 shrink-0" />
                {j.guru}
            </p>
            {isToday && j.piket_status && (
                <span className={`mt-1 inline-block text-[10px] px-1.5 py-px rounded-full font-medium ${PIKET_BADGE[j.piket_status] ?? ''}`}>
                    {PIKET_LABEL[j.piket_status] ?? j.piket_status}
                </span>
            )}
            {isToday && j.piket_tugas && (
                <div className="mt-1 flex items-start gap-1 text-[10px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 rounded px-1 py-0.5">
                    <FileText className="h-2.5 w-2.5 shrink-0 mt-px" />
                    <span className="line-clamp-1">{j.piket_tugas}</span>
                </div>
            )}
        </div>
    );
}

export default function JadwalPublik({
    jadwalAll, hariAktif, hariHariIni, tanggal, namaSekolah, logoSekolah, istirahat,
}) {
    const ist = istirahat ?? [];

    const todayJadwal = (jadwalAll ?? []).filter((j) => j.hari === hariHariIni);

    const [selectedHari, setSelectedHari]   = useState(hariHariIni);
    const [rombelFilter,  setRombelFilter]   = useState('');
    const [isDark,        setIsDark]         = useState(false);
    const [currentJamKe,  setCurrentJamKe]   = useState(() => detectCurrentJam(todayJadwal));
    const [currentBreak,  setCurrentBreak]   = useState(() => detectCurrentBreak(todayJadwal, ist));

    useEffect(() => {
        const dark = localStorage.getItem('theme') === 'dark';
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
    }, []);

    useEffect(() => {
        const tick = () => {
            setCurrentJamKe(detectCurrentJam(todayJadwal));
            setCurrentBreak(detectCurrentBreak(todayJadwal, ist));
        };
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, []);

    const toggleDark = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', next);
    };

    // Grid data for selected day
    const hariJadwal = (jadwalAll ?? []).filter((j) => j.hari === selectedHari);

    // Unique JP slots for selected day (sorted asc)
    const jpSlots = (() => {
        const map = {};
        for (const j of hariJadwal) {
            if (!map[j.jam_ke]) map[j.jam_ke] = { jam_ke: j.jam_ke, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai };
        }
        return Object.values(map).sort((a, b) => a.jam_ke - b.jam_ke);
    })();

    // Unique rombels for selected day (sorted)
    const rombelsOfDay = (() => {
        const seen = new Set(); const out = [];
        for (const j of hariJadwal) {
            if (!seen.has(j.rombel_nama)) { seen.add(j.rombel_nama); out.push(j.rombel_nama); }
        }
        return out.sort();
    })();

    // Filtered rombel columns
    const displayRombels = rombelFilter
        ? rombelsOfDay.filter((r) => r === rombelFilter)
        : rombelsOfDay;

    // Cell lookup: jam_ke → rombel_nama → jadwal item
    const cellMap = (() => {
        const map = {};
        for (const j of hariJadwal) {
            if (!map[j.jam_ke]) map[j.jam_ke] = {};
            map[j.jam_ke][j.rombel_nama] = j;
        }
        return map;
    })();

    const isToday      = selectedHari === hariHariIni;
    const isBreakActive = isToday && currentBreak !== null;

    // All rombels across all days (for dropdown)
    const allRombelsList = (() => {
        const seen = new Set(); const out = [];
        for (const j of jadwalAll ?? []) {
            if (!seen.has(j.rombel_nama)) { seen.add(j.rombel_nama); out.push(j.rombel_nama); }
        }
        return out.sort();
    })();

    const isBreakAfter = (jamKe) => ist.find((b) => b.setelah_jp === jamKe) ?? null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            <Head title="Jadwal Pelajaran" />

            {/* Header */}
            <div className="bg-linear-to-r from-sky-700 via-sky-800 to-sky-900 text-white shadow-lg">
                <div className="max-w-full px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {logoSekolah
                                    ? <img src={logoSekolah} alt="Logo" className="h-full w-full object-contain p-1" />
                                    : <School className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">{namaSekolah}</h1>
                                <p className="text-sky-200 text-xs">Jadwal Pelajaran Mingguan</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <div className="text-right">
                                <div className="text-lg sm:text-2xl font-bold leading-none"><LiveClock /></div>
                                <div className="text-sky-200 text-[10px] sm:text-xs mt-0.5 capitalize hidden sm:block">{tanggal}</div>
                            </div>
                            <button onClick={toggleDark}
                                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                                {isDark ? <Sun className="h-4 w-4 text-white" /> : <Moon className="h-4 w-4 text-white" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Day Tabs + Rombel Filter */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-full px-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap py-2">

                        {/* Day tabs - scrollable */}
                        <div className="-mx-4 sm:mx-0 overflow-x-auto shrink-0">
                            <div className="flex gap-1 px-4 sm:px-0 py-2 w-max">
                                {(hariAktif ?? []).map((hari) => {
                                    const isSelected = hari === selectedHari;
                                    const isHariIni  = hari === hariHariIni;
                                    return (
                                        <button
                                            key={hari}
                                            onClick={() => { setSelectedHari(hari); setRombelFilter(''); }}
                                            className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                                isSelected
                                                    ? 'bg-sky-600 text-white shadow-sm'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}>
                                            {hari}
                                            {isHariIni && (
                                                <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${
                                                    isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                                                } ${isSelected ? '' : 'animate-pulse'}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rombel filter */}
                        <div className="flex items-center gap-2 py-2 shrink-0">
                            {isToday && isBreakActive && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 text-xs font-medium text-amber-600 dark:text-amber-400">
                                    <Coffee className="h-3.5 w-3.5 shrink-0" />
                                    Istirahat {currentBreak?.durasi_menit}m
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                </div>
                            )}
                            {isToday && currentJamKe && !isBreakActive && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    JP {currentJamKe} Sedang Berlangsung
                                </div>
                            )}
                            <div className="relative">
                                <select
                                    value={rombelFilter}
                                    onChange={(e) => setRombelFilter(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                                    <option value="">Semua Kelas</option>
                                    {allRombelsList.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="px-4 sm:px-6 py-4 pb-10">
                {hariJadwal.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
                        <Calendar className="h-14 w-14 mb-4 opacity-30" />
                        <p className="text-base font-medium">Tidak ada jadwal hari {selectedHari}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <table className="border-collapse" style={{ minWidth: `${72 + displayRombels.length * 148}px` }}>
                            {/* Header: JP + Rombel columns */}
                            <thead>
                                <tr>
                                    <th className="sticky left-0 z-20 bg-sky-800 text-white px-3 py-3 text-center min-w-[72px] w-[72px] border-r border-sky-700">
                                        <div className="text-xs font-bold">JP</div>
                                        <div className="text-[10px] opacity-70 font-normal">Waktu</div>
                                    </th>
                                    {displayRombels.map((rombel) => (
                                        <th key={rombel}
                                            className="bg-sky-600 dark:bg-sky-700 text-white px-2 py-3 text-xs font-semibold min-w-[148px] text-center whitespace-nowrap border-r border-sky-500 dark:border-sky-600 last:border-r-0">
                                            {rombel}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {jpSlots.map((slot, rowIdx) => {
                                    const isCurrent = isToday && slot.jam_ke === currentJamKe;
                                    const breakAfter = isBreakAfter(slot.jam_ke);
                                    const isLastRow  = rowIdx === jpSlots.length - 1;

                                    return (
                                        <Fragment key={slot.jam_ke}>
                                            {/* JP row */}
                                            <tr key={`jp-${slot.jam_ke}`}
                                                className={`border-b border-gray-100 dark:border-gray-800 ${
                                                    isCurrent ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'bg-white dark:bg-gray-900'
                                                }`}>

                                                {/* JP column — sticky left */}
                                                <td className={`sticky left-0 z-10 px-2 py-3 text-center border-r align-middle ${
                                                    isCurrent
                                                        ? 'bg-emerald-600 border-emerald-500'
                                                        : 'bg-sky-700 border-sky-600'
                                                }`}>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span className="text-sm font-black text-white leading-none">{slot.jam_ke}</span>
                                                        <span className="text-[9px] font-mono text-white/70 leading-none">{slot.jam_mulai}</span>
                                                        <span className="text-[9px] font-mono text-white/50 leading-none">–{slot.jam_selesai}</span>
                                                        {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse mt-0.5" />}
                                                    </div>
                                                </td>

                                                {/* Rombel cells */}
                                                {displayRombels.map((rombel) => {
                                                    const j = cellMap[slot.jam_ke]?.[rombel] ?? null;
                                                    return (
                                                        <td key={rombel}
                                                            className={`px-1.5 py-1.5 border-r border-gray-100 dark:border-gray-800 last:border-r-0 align-top ${
                                                                isCurrent ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : ''
                                                            }`}>
                                                            {j ? (
                                                                <JadwalCard j={j} isCurrent={isCurrent} isToday={isToday} />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full min-h-[56px] text-gray-200 dark:text-gray-800 text-base select-none">
                                                                    –
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>

                                            {/* Break row */}
                                            {breakAfter && !isLastRow && (
                                                <tr className="bg-amber-50 dark:bg-amber-950/15 border-b border-amber-100 dark:border-amber-900">
                                                    <td className="sticky left-0 z-10 bg-amber-400 dark:bg-amber-800 px-2 py-1.5 text-center">
                                                        <Coffee className="h-3.5 w-3.5 text-white mx-auto" />
                                                    </td>
                                                    <td colSpan={displayRombels.length}
                                                        className="px-3 py-1.5">
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                            <Coffee className="h-3.5 w-3.5 shrink-0" />
                                                            Istirahat — {breakAfter.durasi_menit} Menit
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Legend */}
                {isToday && (
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                        {Object.entries(PIKET_LABEL).map(([key, label]) => (
                            <span key={key} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-medium ${PIKET_BADGE[key]}`}>
                                {label}
                            </span>
                        ))}
                        <span className="text-gray-400 dark:text-gray-600 self-center">← Status presensi guru hari ini</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-800 py-3">
                <p className="text-center text-xs text-gray-400 dark:text-gray-600">
                    &copy; {new Date().getFullYear()} APIKMAS Djurnal — Sistem Informasi Manajemen Sekolah
                </p>
            </div>
        </div>
    );
}
