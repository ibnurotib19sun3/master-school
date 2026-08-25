import { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { usePage } from '@inertiajs/react';
import { Users, GraduationCap, BookOpen, TrendingUp, ClipboardCheck, FileText, BarChart3, ArrowUpRight } from 'lucide-react';

/* ─── StatCard / QuickCard palette ─────────────────────────────────────── */
const PALETTE = {
    indigo:  { orb: 'bg-sky-400',    icon: 'from-sky-600 to-sky-800',      bar: 'bg-sky-600'    },
    emerald: { orb: 'bg-emerald-400', icon: 'from-emerald-500 to-teal-600',   bar: 'bg-emerald-500' },
    blue:    { orb: 'bg-sky-400',     icon: 'from-sky-500 to-cyan-600',       bar: 'bg-sky-500'     },
    purple:  { orb: 'bg-violet-400',  icon: 'from-violet-500 to-purple-600',  bar: 'bg-violet-500'  },
    orange:  { orb: 'bg-orange-400',  icon: 'from-orange-500 to-amber-600',   bar: 'bg-orange-500'  },
};

/* ─── Validated dataviz palette (dataviz skill, adjacent-pair CVD-safe) ─ */
const CHR = [
    { l: '#2a78d6', d: '#3987e5' }, // slot 1 – blue
    { l: '#008300', d: '#008300' }, // slot 2 – green
    { l: '#e87ba4', d: '#d55181' }, // slot 3 – magenta
    { l: '#eda100', d: '#c98500' }, // slot 4 – yellow
    { l: '#1baf7a', d: '#199e70' }, // slot 5 – aqua
    { l: '#eb6834', d: '#d95926' }, // slot 6 – orange
];

const GENDER_CHR  = { 'Laki-laki': CHR[0], 'Perempuan': CHR[2] };
const STATUS_CHR  = { PNS: CHR[0], PPPK: CHR[1], GTY: CHR[2], GTT: CHR[3], Honorer: CHR[4] };
// Sequential blue ordinal ramp (D3 lightest → S3 darkest; dark-mode reversed toward lighter steps)
const PEND_CHR    = {
    D3: { l: '#86b6ef', d: '#9ec5f4' },
    D4: { l: '#5598e7', d: '#86b6ef' },
    S1: { l: '#2a78d6', d: '#6da7ec' },
    S2: { l: '#1c5cab', d: '#5598e7' },
    S3: { l: '#0d366b', d: '#3987e5' },
};
const PEND_ORDER  = ['D3', 'D4', 'S1', 'S2', 'S3'];

/* ─── Dark-mode detection (handles both class and data-theme strategies) ─ */
function useDark() {
    const detect = () => {
        if (typeof document === 'undefined') return false;
        const t = document.documentElement.getAttribute('data-theme');
        if (t === 'dark') return true;
        if (t === 'light') return false;
        if (document.documentElement.classList.contains('dark')) return true;
        if (document.documentElement.classList.contains('light')) return false;
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    };
    const [dark, setDark] = useState(detect);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const upd = () => setDark(detect());
        mq.addEventListener('change', upd);
        const obs = new MutationObserver(upd);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
        return () => { mq.removeEventListener('change', upd); obs.disconnect(); };
    }, []);
    return dark;
}

const clr = (pair, dark) => dark ? pair.d : pair.l;

/* ─── DonutChart ─────────────────────────────────────────────────────────
   data: [{label, value, color}]   centerLabel: string shown at rest       */
function DonutChart({ data, centerLabel }) {
    const [hov, setHov] = useState(null);
    const R = 52, CIRC = 2 * Math.PI * R;
    const active = data.filter(d => d.value > 0);
    const GAP    = active.length > 1 ? 6 : 0;
    const total  = data.reduce((s, d) => s + d.value, 0);

    let cum = 0;
    const arcs = data.map((d) => {
        const frac = total > 0 ? d.value / total : 0;
        const len  = Math.max(0, frac * CIRC - GAP);
        const off  = -(cum * CIRC);
        cum += frac;
        return { ...d, frac, len, off, pct: Math.round(frac * 100) };
    });

    const hovArc = hov !== null ? arcs[hov] : null;
    const cVal   = hovArc?.value ?? total;
    const cSub   = hovArc?.label ?? centerLabel;
    const cClr   = hovArc?.color;

    return (
        <div className="flex flex-col items-center gap-4">
            <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden="true">
                {/* track */}
                <circle cx="80" cy="80" r={R} fill="none" strokeWidth="22"
                    className="stroke-gray-100 dark:stroke-gray-800" />

                {total === 0 ? (
                    <text x="80" y="85" textAnchor="middle" className="fill-gray-400"
                        style={{ fontSize: 12 }}>Belum ada data</text>
                ) : arcs.map((arc, i) => arc.value > 0 && (
                    <circle key={i} cx="80" cy="80" r={R} fill="none"
                        stroke={arc.color}
                        strokeWidth={hov === i ? 27 : 22}
                        strokeDasharray={`${arc.len} ${CIRC}`}
                        strokeDashoffset={arc.off}
                        strokeLinecap="butt"
                        pointerEvents="visibleStroke"
                        style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: '80px 80px',
                            opacity: hov !== null && hov !== i ? 0.3 : 1,
                            transition: 'stroke-width 0.15s ease, opacity 0.15s ease',
                        }}
                        onMouseEnter={() => setHov(i)}
                        onMouseLeave={() => setHov(null)}
                    />
                ))}

                {/* center */}
                <text x="80" y="73" textAnchor="middle"
                    fill={cClr ?? 'currentColor'}
                    className={cClr ? '' : 'fill-gray-900 dark:fill-white'}
                    style={{ fontSize: 28, fontWeight: 800, transition: 'fill 0.15s' }}>
                    {cVal}
                </text>
                <text x="80" y="92" textAnchor="middle"
                    className="fill-gray-400" style={{ fontSize: 11 }}>
                    {cSub}
                </text>
            </svg>

            {/* legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                {arcs.map((arc, i) => (
                    <button key={i} type="button"
                        className={`flex items-center gap-1.5 transition-opacity ${hov !== null && hov !== i ? 'opacity-25' : ''}`}
                        onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: arc.color }} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{arc.label}</span>
                        <span className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-200">{arc.value}</span>
                        <span className="text-[10px] text-gray-400">({arc.pct}%)</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ─── HBarChart ──────────────────────────────────────────────────────────
   data: [{label, value, color, nama?}]                                    */
function HBarChart({ data }) {
    const [mounted, setMounted] = useState(false);
    const [hov, setHov]         = useState(null);
    useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

    if (!data?.length) return (
        <p className="py-6 text-center text-sm text-gray-400">Belum ada data</p>
    );

    const max   = Math.max(...data.map(d => d.value), 1);
    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div className="space-y-3">
            {data.map((d, i) => {
                const widthPct = (d.value / max) * 100;
                const share    = total > 0 ? Math.round((d.value / total) * 100) : 0;
                const isHov    = hov === i;
                return (
                    <div key={i} className="relative"
                        onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>

                        {/* tooltip */}
                        {isHov && (
                            <div className="pointer-events-none absolute left-0 -top-9 z-10 rounded-lg bg-gray-900 dark:bg-gray-700 px-2.5 py-1.5 text-xs text-white shadow-lg whitespace-nowrap">
                                <span className="font-medium">{d.nama ?? d.label}</span>
                                <span className="ml-2 tabular-nums">{d.value} ({share}%)</span>
                            </div>
                        )}

                        <div className="mb-1 flex items-center justify-between">
                            <span className="max-w-[55%] truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                                {d.label}
                            </span>
                            <span className="ml-2 shrink-0 text-xs tabular-nums">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{d.value}</span>
                                <span className="ml-1 text-gray-400">({share}%)</span>
                            </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div className="h-full rounded-full"
                                style={{
                                    width: mounted ? `${widthPct}%` : '0%',
                                    backgroundColor: d.color,
                                    opacity: hov !== null && !isHov ? 0.35 : 1,
                                    transition: `width 0.65s ease ${i * 55}ms, opacity 0.15s`,
                                }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── ChartCard ──────────────────────────────────────────────────────── */
function ChartCard({ title, subtitle, children }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

/* ─── StatCard ───────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color = 'indigo', trend }) {
    const p = PALETTE[color] ?? PALETTE.indigo;
    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className={`pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full blur-2xl opacity-20 dark:opacity-10 ${p.orb}`} />
            <div className={`absolute bottom-0 left-0 h-0.75 w-0 group-hover:w-full transition-all duration-500 ease-out rounded-full ${p.bar}`} />
            <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tabular-nums text-gray-900 dark:text-white">
                        {value ?? '—'}
                    </p>
                    {trend && (
                        <p className="mt-1.5 flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="h-3 w-3" />{trend}
                        </p>
                    )}
                </div>
                <div className={`shrink-0 rounded-2xl bg-linear-to-br ${p.icon} p-3 shadow-lg shadow-${color}-200 dark:shadow-none`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </div>
        </div>
    );
}

/* ─── QuickCard ─────────────────────────────────────────────────────── */
function QuickCard({ label, href, icon: Icon, gradient }) {
    return (
        <a href={href}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center gap-3 text-center">
            <div className={`pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 bg-linear-to-br ${gradient}`} />
            <div className={`rounded-2xl bg-linear-to-br ${gradient} p-3.5 shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{label}</span>
            <ArrowUpRight className="absolute top-3 right-3 h-3.5 w-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </a>
    );
}

/* ─── Dashboard ─────────────────────────────────────────────────────── */
export default function Dashboard({ stats, charts = {} }) {
    const { props }  = usePage();
    const user       = props.auth?.user;
    const roles      = user?.roles ?? [];
    const isDark     = useDark();

    const isGuru        = roles.includes('guru');
    const isWakasek     = roles.includes('wakasek_kurikulum');
    const isAdmin       = roles.some(r => ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'].includes(r));
    const showQuickActions = isGuru || (isAdmin && !isWakasek);

    // Resolve chart data with validated palette colors
    const genderGuruChrt  = (charts.gender_guru ?? []).map(d => ({ ...d, color: clr(GENDER_CHR[d.label] ?? CHR[0], isDark) }));
    const genderTuChrt    = (charts.gender_tatausaha ?? []).map(d => ({ ...d, color: clr(GENDER_CHR[d.label] ?? CHR[0], isDark) }));
    const genderSiswaChrt = (charts.gender_siswa ?? []).map(d => ({ ...d, color: clr(GENDER_CHR[d.label] ?? CHR[0], isDark) }));
    const statusChrt      = (charts.status_guru ?? []).map(d => ({ ...d, color: clr(STATUS_CHR[d.label] ?? CHR[0], isDark) }));
    const pendidikanChrt  = (charts.pendidikan_guru ?? [])
        .sort((a, b) => PEND_ORDER.indexOf(a.label) - PEND_ORDER.indexOf(b.label))
        .map(d => ({ ...d, color: clr(PEND_CHR[d.label] ?? CHR[0], isDark) }));
    const jurusanChrt     = (charts.siswa_per_jurusan ?? []).map((d, i) => ({ ...d, color: clr(CHR[i % CHR.length], isDark) }));

    return (
        <AppLayout title="Dashboard">
            <div className="space-y-6">

                {/* Welcome banner */}
                <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-sky-500 via-sky-600 to-blue-700 p-6 text-white shadow-lg shadow-sky-200 dark:shadow-sky-900/30">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute right-8 bottom-0 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
                    <div className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-1/4 opacity-[0.06]">
                        <BookOpen className="h-full w-full" />
                    </div>
                    <div className="relative">
                        <p className="text-sm font-medium text-sky-100/80">Selamat datang kembali,</p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight">{user?.nama_lengkap ?? user?.name}</h2>
                        <p className="mt-1 text-sm capitalize text-sky-100/60">
                            {roles[0]?.replace(/_/g, ' ')}
                            {stats.tahun_aktif && <> · {stats.tahun_aktif.nama} — {stats.tahun_aktif.semester}</>}
                        </p>
                    </div>
                </div>

                {/* Admin stats */}
                {isAdmin && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            Statistik Sekolah
                        </h2>
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <StatCard icon={Users}         label="Total Siswa"  value={stats.total_siswa}  color="indigo" />
                            <StatCard icon={GraduationCap} label="Total Guru"   value={stats.total_guru}   color="emerald" />
                            <StatCard icon={BookOpen}      label="Rombel Aktif" value={stats.total_rombel} color="blue" />
                            <StatCard icon={Users}         label="Pengguna"     value={stats.total_users}  color="purple" />
                        </div>
                    </section>
                )}

                {/* Charts – admin only */}
                {isAdmin && (
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            Demografi SDM
                        </h2>

                        {/* Row 1: Gender donuts */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <ChartCard title="Gender – Guru PTK"
                                subtitle={`${stats.total_guru} guru aktif`}>
                                <DonutChart data={genderGuruChrt} centerLabel="Guru" />
                            </ChartCard>
                            <ChartCard title="Gender – Tata Usaha"
                                subtitle="Tenaga Kependidikan aktif">
                                <DonutChart data={genderTuChrt} centerLabel="TU" />
                            </ChartCard>
                            <ChartCard title="Gender – Siswa"
                                subtitle={`${stats.total_siswa} siswa aktif`}>
                                <DonutChart data={genderSiswaChrt} centerLabel="Siswa" />
                            </ChartCard>
                        </div>

                        {/* Row 2: Status + Pendidikan bars */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <ChartCard title="Status Kepegawaian PTK">
                                <HBarChart data={statusChrt} />
                            </ChartCard>
                            <ChartCard title="Pendidikan Terakhir PTK">
                                <HBarChart data={pendidikanChrt} />
                            </ChartCard>
                        </div>

                        {/* Row 3: Siswa per Jurusan */}
                        {jurusanChrt.length > 0 && (
                            <ChartCard title="Siswa per Jurusan / Konsentrasi Keahlian"
                                subtitle={`Total ${stats.total_siswa} siswa aktif`}>
                                <HBarChart data={jurusanChrt} />
                            </ChartCard>
                        )}
                    </section>
                )}

                {/* Guru stats */}
                {isGuru && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            Aktivitas Saya
                        </h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <StatCard icon={BookOpen}       label="Kelas Saya"       value={stats.pembelajaran_saya ?? 0} color="indigo" />
                            <StatCard icon={ClipboardCheck} label="Absensi Hari Ini" value="–"                           color="emerald" />
                            <StatCard icon={FileText}       label="Jurnal Bulan Ini" value="–"                           color="blue" />
                        </div>
                    </section>
                )}

                {/* Quick actions */}
                {showQuickActions && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            Akses Cepat
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {isGuru && [
                                { label: 'Input Absensi',   href: '/guru/absensi',      icon: ClipboardCheck, gradient: 'from-sky-500 to-cyan-600'    },
                                { label: 'Jurnal Mengajar', href: '/guru/jurnal',        icon: FileText,       gradient: 'from-emerald-500 to-teal-600' },
                                { label: 'Input Nilai',     href: '/guru/nilai',         icon: BarChart3,      gradient: 'from-purple-500 to-pink-600'  },
                                { label: 'Upload Video',    href: '/guru/video-edukasi', icon: TrendingUp,     gradient: 'from-orange-500 to-amber-600' },
                            ].map(item => <QuickCard key={item.href} {...item} />)}

                            {isAdmin && !isWakasek && [
                                { label: 'Tambah Siswa',   href: '/admin/siswa',          icon: Users,     gradient: 'from-sky-500 to-sky-700' },
                                { label: 'Kelola Rombel',  href: '/admin/rombel',         icon: BookOpen,  gradient: 'from-emerald-500 to-teal-600'  },
                                { label: 'KPI Guru',       href: '/admin/kpi',            icon: BarChart3, gradient: 'from-purple-500 to-pink-600'   },
                                { label: 'Catatan Kepsek', href: '/admin/catatan-kepsek', icon: FileText,  gradient: 'from-orange-500 to-amber-600'  },
                            ].map(item => <QuickCard key={item.href} {...item} />)}
                        </div>
                    </section>
                )}

            </div>
        </AppLayout>
    );
}
