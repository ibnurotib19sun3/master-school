import { useState, useEffect, useRef } from 'react';
import { usePage, router, Head, Link } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import Navbar from '@/Components/Navbar';
import FloatingMasukan from '@/Components/FloatingMasukan';
import { CheckCircle, XCircle, Info, X, Clock, AlertTriangle, Megaphone, Home, ChevronRight, Trophy, ArrowRight } from 'lucide-react';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

const IDLE_WARN_S = 9 * 60; // mulai warning setelah 9 menit idle
const WARN_TOTAL_S = 60;    // countdown 60 detik sebelum logout

function AutoLogout() {
    const [countdown, setCountdown] = useState(WARN_TOTAL_S);
    const [showing,   setShowing]   = useState(false);
    const [leaving,   setLeaving]   = useState(false);

    const lastActivity = useRef(Date.now());
    const warnStarted  = useRef(false);
    const tickRef      = useRef(null);

    const doLogout = () => {
        clearInterval(tickRef.current);
        router.post('/logout');
    };

    const stayHere = () => {
        warnStarted.current  = false;
        lastActivity.current = Date.now();
        setLeaving(true);
        setTimeout(() => { setShowing(false); setCountdown(WARN_TOTAL_S); }, 300);
    };

    useEffect(() => {
        const markActivity = () => {
            if (!warnStarted.current) lastActivity.current = Date.now();
        };
        const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        EVENTS.forEach((e) => document.addEventListener(e, markActivity, { passive: true }));

        tickRef.current = setInterval(() => {
            const idleSec = (Date.now() - lastActivity.current) / 1000;
            if (!warnStarted.current && idleSec >= IDLE_WARN_S) {
                warnStarted.current = true;
                setShowing(true);
                setLeaving(false);
                setCountdown(WARN_TOTAL_S);
                return;
            }
            if (warnStarted.current) {
                setCountdown((c) => {
                    if (c <= 1) { doLogout(); return 0; }
                    return c - 1;
                });
            }
        }, 1000);

        return () => {
            EVENTS.forEach((e) => document.removeEventListener(e, markActivity));
            clearInterval(tickRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!showing) return null;

    const pct    = (countdown / WARN_TOTAL_S) * 100;
    const urgent = countdown <= 15;
    const r      = 28;
    const circ   = 2 * Math.PI * r;

    return (
        <>
            <style>{`
                @keyframes al-bd-in  { from{opacity:0} to{opacity:1} }
                @keyframes al-bd-out { from{opacity:1} to{opacity:0} }
                @keyframes al-in  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
                @keyframes al-out { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.96)} }
            `}</style>

            <div className="fixed inset-0 z-9998 bg-black/50 backdrop-blur-sm"
                style={{ animation: `${leaving ? 'al-bd-out' : 'al-bd-in'} 0.25s ease forwards` }} />

            <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none p-4">
                <div className="pointer-events-auto w-full max-w-xs"
                    style={{ animation: `${leaving ? 'al-out 0.25s ease forwards' : 'al-in 0.3s cubic-bezier(0.34,1.2,0.64,1) forwards'}` }}>

                    <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/8 overflow-hidden text-center">

                        {/* Top area */}
                        <div className={`px-6 pt-7 pb-5 ${urgent ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-amber-50 dark:bg-amber-950/20'}`}>
                            {/* SVG ring countdown */}
                            <div className="relative w-20 h-20 mx-auto">
                                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                                    <circle cx="36" cy="36" r={r} fill="none" strokeWidth="3.5"
                                        className={urgent ? 'stroke-rose-100 dark:stroke-rose-900' : 'stroke-amber-100 dark:stroke-amber-900'} />
                                    <circle cx="36" cy="36" r={r} fill="none" strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeDasharray={circ}
                                        strokeDashoffset={circ * (1 - pct / 100)}
                                        className={`transition-all duration-1000 ease-linear ${urgent ? 'stroke-rose-500' : 'stroke-amber-400'}`} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-2xl font-semibold tabular-nums leading-none ${urgent ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {countdown}
                                    </span>
                                    <span className={`text-[9px] font-medium mt-0.5 ${urgent ? 'text-rose-400' : 'text-amber-400'}`}>detik</span>
                                </div>
                            </div>

                            <p className={`mt-3 text-base font-semibold ${urgent ? 'text-rose-700 dark:text-rose-300' : 'text-gray-800 dark:text-gray-100'}`}>
                                {urgent ? 'Segera Keluar!' : 'Sesi Tidak Aktif'}
                            </p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                Otomatis logout dalam {countdown} detik
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="px-6 pb-6 pt-4 space-y-2">
                            <button onClick={stayHere}
                                className={`w-full py-2.5 rounded-2xl text-sm font-medium text-white transition-all active:scale-98 ${urgent ? 'bg-rose-500 hover:bg-rose-600' : 'bg-sky-600 hover:bg-sky-700'}`}>
                                Tetap di Sini
                            </button>
                            <button onClick={doLogout}
                                className="w-full py-2 rounded-2xl text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                Keluar Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function LoginWelcome() {
    const { props } = usePage();
    const name = props.flash?.login_success ?? null;

    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (!name) return;
        setLeaving(false);
        setVisible(true);
        const t = setTimeout(dismiss, 4000);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name]);

    const dismiss = () => {
        setLeaving(true);
        setTimeout(() => setVisible(false), 350);
    };

    if (!visible) return null;

    const firstName = name?.split(' ')[0] ?? name;
    const greeting  = getGreeting();

    return (
        <>
            <style>{`
                @keyframes lw-bd-in  { from{opacity:0} to{opacity:1} }
                @keyframes lw-bd-out { from{opacity:1} to{opacity:0} }
                @keyframes lw-in  { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
                @keyframes lw-out { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.96)} }
                @keyframes lw-bar { from{transform:scaleX(1)} to{transform:scaleX(0)} }
                @keyframes lw-pop { 0%{transform:scale(0) rotate(-10deg)} 70%{transform:scale(1.1) rotate(3deg)} 100%{transform:scale(1) rotate(0)} }
            `}</style>

            <div className="fixed inset-0 z-9998 bg-black/40 backdrop-blur-sm"
                style={{ animation: `${leaving ? 'lw-bd-out' : 'lw-bd-in'} 0.3s ease forwards` }}
                onClick={dismiss} />

            <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none p-4">
                <div className="pointer-events-auto w-full max-w-xs"
                    style={{ animation: `${leaving ? 'lw-out 0.25s ease forwards' : 'lw-in 0.35s cubic-bezier(0.34,1.3,0.64,1) forwards'}` }}>

                    <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/8 overflow-hidden">

                        {/* Header — light blue bg */}
                        <div className="bg-sky-50 dark:bg-sky-950/40 px-6 pt-8 pb-6 text-center">
                            {/* Icon */}
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-white dark:bg-sky-900/50 shadow-sm ring-1 ring-sky-100 dark:ring-sky-800 flex items-center justify-center mb-4"
                                style={{ animation: 'lw-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both' }}>
                                <CheckCircle className="h-7 w-7 text-sky-600" strokeWidth={1.5} />
                            </div>
                            <p className="text-xs text-sky-500 dark:text-sky-400 font-medium tracking-wide uppercase mb-1">
                                Login Berhasil
                            </p>
                            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {greeting}, {firstName}
                            </p>
                        </div>

                        {/* Body */}
                        <div className="px-6 pt-4 pb-2 text-center">
                            <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
                                Selamat datang kembali di<br />
                                <span className="text-sky-600 font-medium">APIKMAS DJurnal</span>.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="px-6 pb-5 pt-3 space-y-2.5">
                            <button onClick={dismiss}
                                className="w-full py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-all active:scale-98">
                                Mulai Bekerja
                            </button>
                        </div>

                        {/* Auto-dismiss bar */}
                        <div className="h-0.5 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div className="h-full bg-sky-400 dark:bg-sky-600 origin-left"
                                style={{ animation: 'lw-bar 4s linear forwards' }} />
                        </div>
                    </div>

                    {/* Close */}
                    <button onClick={dismiss}
                        className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </>
    );
}

const POPUP_CFG = {
    info: {
        header: 'bg-sky-50 dark:bg-sky-950/40',
        iconBg: 'bg-white dark:bg-sky-900/50 ring-sky-100 dark:ring-sky-800',
        icon:   <Info className="h-6 w-6 text-sky-500" strokeWidth={1.5} />,
        label:  'Informasi',
        labelColor: 'text-sky-400 dark:text-sky-500',
        btn:    'bg-sky-500 hover:bg-sky-600',
    },
    peringatan: {
        header: 'bg-amber-50 dark:bg-amber-950/30',
        iconBg: 'bg-white dark:bg-amber-900/50 ring-amber-100 dark:ring-amber-800',
        icon:   <AlertTriangle className="h-6 w-6 text-amber-500" strokeWidth={1.5} />,
        label:  'Peringatan',
        labelColor: 'text-amber-500 dark:text-amber-400',
        btn:    'bg-amber-500 hover:bg-amber-600',
    },
    sukses: {
        header: 'bg-emerald-50 dark:bg-emerald-950/30',
        iconBg: 'bg-white dark:bg-emerald-900/50 ring-emerald-100 dark:ring-emerald-800',
        icon:   <CheckCircle className="h-6 w-6 text-emerald-500" strokeWidth={1.5} />,
        label:  'Pengumuman',
        labelColor: 'text-emerald-500 dark:text-emerald-400',
        btn:    'bg-emerald-500 hover:bg-emerald-600',
    },
};

const POPUP_COUNTDOWN = 7;

function AnnouncementPopup() {
    const { active_popup: popup, auth } = usePage().props;
    const userId  = auth?.user?.id ?? 'guest';
    const [visible,   setVisible]   = useState(false);
    const [leaving,   setLeaving]   = useState(false);
    const [countdown, setCountdown] = useState(POPUP_COUNTDOWN);

    const popupKey = popup ? `popup_seen_${popup.id}_u${userId}` : null;

    useEffect(() => {
        if (!popup || !popupKey) return;
        if (!localStorage.getItem(popupKey)) {
            setLeaving(false);
            setCountdown(POPUP_COUNTDOWN);
            setVisible(true);
        }
    }, [popup?.id, userId]);

    /* Hitung mundur 1 detik per tick */
    useEffect(() => {
        if (!visible || leaving || countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [visible, leaving, countdown]);

    const dismiss = () => {
        if (popupKey) localStorage.setItem(popupKey, '1');
        setLeaving(true);
        setTimeout(() => setVisible(false), 300);
    };

    if (!visible || !popup) return null;

    const cfg        = POPUP_CFG[popup.tipe] ?? POPUP_CFG.info;
    const canDismiss = countdown <= 0;

    return (
        <>
            <style>{`
                @keyframes ap-bd-in  { from{opacity:0} to{opacity:1} }
                @keyframes ap-bd-out { from{opacity:1} to{opacity:0} }
                @keyframes ap-in  { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
                @keyframes ap-out { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.96)} }
                @keyframes ap-pop { 0%{transform:scale(0) rotate(-8deg)} 70%{transform:scale(1.08) rotate(2deg)} 100%{transform:scale(1) rotate(0)} }
                @keyframes ap-countdown { from{width:100%} to{width:0%} }
            `}</style>

            {/* Backdrop — tidak bisa ditutup selama countdown */}
            <div className="fixed inset-0 z-9996 bg-black/40 backdrop-blur-sm"
                style={{ animation: `${leaving ? 'ap-bd-out' : 'ap-bd-in'} 0.3s ease forwards` }}
                onClick={canDismiss ? dismiss : undefined} />

            {/* Card */}
            <div className="fixed inset-0 z-9997 flex items-center justify-center pointer-events-none p-4">
                <div className="pointer-events-auto w-full max-w-xs"
                    style={{ animation: `${leaving ? 'ap-out 0.25s ease forwards' : 'ap-in 0.35s cubic-bezier(0.34,1.3,0.64,1) forwards'}` }}>

                    <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/8 overflow-hidden">

                        {/* Header */}
                        <div className={`${cfg.header} px-6 pt-7 pb-5 text-center`}>
                            <div className={`w-14 h-14 mx-auto rounded-2xl ${cfg.iconBg} shadow-sm ring-1 flex items-center justify-center mb-3`}
                                style={{ animation: 'ap-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}>
                                {cfg.icon}
                            </div>
                            <p className={`text-xs font-medium tracking-wide uppercase ${cfg.labelColor}`}>
                                {cfg.label}
                            </p>
                            <p className="mt-1.5 text-base font-medium text-gray-900 dark:text-gray-100 leading-snug">
                                {popup.judul}
                            </p>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed text-center"
                            dangerouslySetInnerHTML={{ __html: popup.isi }} />

                        {/* Countdown bar */}
                        {!canDismiss && (
                            <div className="mx-6 h-0.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full ${cfg.btn} opacity-50 rounded-full`}
                                    style={{ animation: `ap-countdown ${POPUP_COUNTDOWN}s linear forwards` }} />
                            </div>
                        )}

                        {/* Divider */}
                        <div className="mx-6 border-t border-gray-100 dark:border-gray-800 mt-4" />

                        {/* Footer */}
                        <div className="px-6 py-4 space-y-2">
                            <button
                                onClick={canDismiss ? dismiss : undefined}
                                disabled={!canDismiss}
                                className={`w-full py-2.5 rounded-2xl text-sm font-semibold transition-all
                                    ${canDismiss
                                        ? `text-white ${cfg.btn} active:scale-98 cursor-pointer`
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {canDismiss ? 'Mengerti' : `Mengerti (${countdown})`}
                            </button>
                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
                                <Megaphone className="h-3 w-3" /> Pesan dari Admin
                            </p>
                        </div>
                    </div>

                    {/* Tombol X hanya muncul setelah countdown selesai */}
                    {canDismiss && (
                        <button onClick={dismiss}
                            className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

function KpiNotificationPopup() {
    const { kpi_popup } = usePage().props;
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (kpi_popup) {
            setVisible(true);
            setLeaving(false);
        }
    }, [kpi_popup?.id, kpi_popup?.bulan]);

    if (!visible || !kpi_popup) return null;

    const dismiss = (goToDetail = false) => {
        setLeaving(true);
        try {
            if (window.axios) {
                window.axios.post('/kpi/tandai-dibaca', { bulan: kpi_popup.bulan }).catch(() => {});
            }
        } catch (_) {}

        setTimeout(() => {
            setVisible(false);
            if (goToDetail && kpi_popup.detail_url) {
                router.visit(kpi_popup.detail_url);
            }
        }, 250);
    };

    const predikatColor = {
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            text: 'text-emerald-700 dark:text-emerald-300',
            border: 'border-emerald-200 dark:border-emerald-800/60',
            badge: 'bg-emerald-500 text-white',
        },
        sky: {
            bg: 'bg-sky-50 dark:bg-sky-950/40',
            text: 'text-sky-700 dark:text-sky-300',
            border: 'border-sky-200 dark:border-sky-800/60',
            badge: 'bg-sky-500 text-white',
        },
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-950/40',
            text: 'text-amber-700 dark:text-amber-300',
            border: 'border-amber-200 dark:border-amber-800/60',
            badge: 'bg-amber-500 text-white',
        },
        rose: {
            bg: 'bg-rose-50 dark:bg-rose-950/40',
            text: 'text-rose-700 dark:text-rose-300',
            border: 'border-rose-200 dark:border-rose-800/60',
            badge: 'bg-rose-500 text-white',
        },
    }[kpi_popup.predikat?.color || 'sky'];

    return (
        <>
            <style>{`
                @keyframes kpi-bd-in  { from{opacity:0} to{opacity:1} }
                @keyframes kpi-bd-out { from{opacity:1} to{opacity:0} }
                @keyframes kpi-in     { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
                @keyframes kpi-out    { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.95) translateY(10px)} }
            `}</style>

            {/* Backdrop */}
            <div
                className="fixed inset-0 z-9997 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
                style={{ animation: `${leaving ? 'kpi-bd-out' : 'kpi-bd-in'} 0.25s ease forwards` }}
                onClick={() => dismiss(false)}
            />

            {/* Modal Dialog */}
            <div className="fixed inset-0 z-9998 flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
                <div
                    className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden pointer-events-auto"
                    style={{ animation: `${leaving ? 'kpi-out' : 'kpi-in'} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
                >
                    {/* Header Decorative Pattern */}
                    <div className="relative bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 pt-7 pb-6 px-6 text-white text-center select-none overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-sky-400/20 rounded-full blur-lg pointer-events-none" />

                        {/* Close button X */}
                        <button
                            type="button"
                            onClick={() => dismiss(false)}
                            aria-label="Tutup"
                            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                        >
                            <X className="h-4.5 w-4.5" />
                        </button>

                        {/* Trophy Icon */}
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg mb-3">
                            <Trophy className="h-7 w-7 text-amber-300" />
                        </div>

                        <span className="inline-block px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold uppercase tracking-wider text-sky-100">
                            Evaluasi Kinerja Tersimpan
                        </span>
                        <h3 className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                            Hasil KPI Bulan {kpi_popup.bulan_format}
                        </h3>
                        <p className="mt-1 text-xs text-sky-100/80">
                            Penilaian kinerja {kpi_popup.role_label} untuk Anda telah selesai dievaluasi.
                        </p>
                    </div>

                    {/* Body */}
                    <div className="p-5 sm:p-6 space-y-4">
                        {/* Summary Score Card */}
                        <div className={`p-4 rounded-2xl border ${predikatColor.bg} ${predikatColor.border} flex items-center justify-between`}>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Nilai Akhir KPI</p>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                                        {kpi_popup.total_nilai}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-400">/ 100</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${predikatColor.badge}`}>
                                    Grade {kpi_popup.predikat?.grade}
                                </span>
                                <p className={`text-xs font-semibold mt-1 ${predikatColor.text}`}>
                                    {kpi_popup.predikat?.label}
                                </p>
                            </div>
                        </div>

                        {/* Indikator Breakdown */}
                        {kpi_popup.indikator && kpi_popup.indikator.length > 0 && (
                            <div className="space-y-2.5">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Rincian Capaian Indikator:
                                </p>
                                <div className="space-y-2">
                                    {kpi_popup.indikator.map((item, idx) => (
                                        <div key={idx} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs">
                                            <div className="flex items-center justify-between font-medium text-gray-800 dark:text-gray-200 mb-1">
                                                <span className="truncate pr-2">{item.nama}</span>
                                                <span className="font-bold shrink-0">{item.persen}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, Math.max(0, item.persen))}%` }}
                                                />
                                            </div>
                                            <div className="mt-1 flex items-center justify-between text-[10.5px] text-gray-400 dark:text-gray-500">
                                                <span>Bobot: {item.bobot}%</span>
                                                <span>Nilai: {item.nilai}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Catatan Penilai (Jika ada) */}
                        {kpi_popup.catatan && (
                            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs">
                                <p className="font-semibold text-amber-800 dark:text-amber-300 mb-0.5">Catatan Penilai:</p>
                                <p className="text-amber-700/90 dark:text-amber-400 italic leading-relaxed">
                                    "{kpi_popup.catatan}"
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 space-y-2">
                            <button
                                type="button"
                                onClick={() => dismiss(true)}
                                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] shadow-sm transition-all flex items-center justify-center gap-1.5"
                            >
                                <span>Lihat Detail di Halaman KPI</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => dismiss(false)}
                                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                Mengerti &amp; Tutup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function Toast() {
    const { props } = usePage();
    const flash = props.flash ?? {};

    const raw     = flash.success || flash.error || flash.info || null;
    const rawType = flash.success ? 'success' : flash.error ? 'error' : 'info';

    const [visible, setVisible] = useState(false);
    const [msg,     setMsg]     = useState('');
    const [type,    setType]    = useState('success');
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (!raw) return;
        setMsg(raw);
        setType(rawType);
        setLeaving(false);
        setVisible(true);

        const hide = setTimeout(() => dismiss(), 4500);
        return () => clearTimeout(hide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [raw]);

    const dismiss = () => {
        setLeaving(true);
        setTimeout(() => setVisible(false), 300);
    };

    if (!visible) return null;

    const cfg = {
        success: {
            chip: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
            bar:  'bg-emerald-500',
            glow: 'shadow-emerald-500/10',
            icon: CheckCircle,
        },
        error: {
            chip: 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400',
            bar:  'bg-red-500',
            glow: 'shadow-red-500/10',
            icon: XCircle,
        },
        info: {
            chip: 'bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400',
            bar:  'bg-sky-500',
            glow: 'shadow-sky-500/10',
            icon: Info,
        },
    }[type];
    const Icon = cfg.icon;

    return (
        <div
            className={`fixed z-9999 pointer-events-auto
                inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-full sm:max-w-sm
                transition-all duration-300 ease-out
                ${leaving ? 'opacity-0 scale-95 translate-y-1' : 'opacity-100 scale-100 translate-y-0'}`}
        >
            <div className={`relative overflow-hidden rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
                shadow-xl ${cfg.glow} ring-1 ring-black/5 dark:ring-white/10`}>
                <div className="flex items-start gap-3 pl-3.5 pr-3 py-3.5">
                    <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${cfg.chip}`}>
                        <Icon className="h-4.5 w-4.5" />
                    </div>
                    <p className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug pt-1.5">{msg}</p>
                    <button
                        onClick={dismiss}
                        className="shrink-0 p-1 mt-0.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div className="h-[3px] bg-gray-100 dark:bg-white/5">
                    <div className={`h-full ${cfg.bar} rounded-r-full`}
                        style={{ animation: 'shrink 4.5s linear forwards' }} />
                </div>
            </div>

            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
            `}</style>
        </div>
    );
}

/**
 * Overlay blocking saat berpindah halaman / memuat data (Inertia visit apa pun —
 * navigasi menu, filter, pagination, submit form). Sengaja MENUTUP seluruh layar
 * (bukan cuma progress bar tipis di atas) supaya user tidak mengklik berulang saat
 * proses masih berjalan. Delay 150ms supaya navigasi yang sangat cepat (localhost)
 * tidak membuat overlay "kedip" sekilas.
 */
function GlobalNavigationLoader() {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        const showDelayed = () => {
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setVisible(true), 150);
        };
        const hide = () => {
            clearTimeout(timerRef.current);
            setVisible(false);
        };
        const removeStart = router.on('start', showDelayed);
        const removeFinish = router.on('finish', hide);
        return () => {
            removeStart();
            removeFinish();
            clearTimeout(timerRef.current);
        };
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-white/70 dark:bg-gray-950/75 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-5">
                <div className="relative h-20 w-20">
                    {/* Cincin gradient berputar */}
                    <div
                        className="absolute inset-0 rounded-full animate-spin"
                        style={{
                            background: 'conic-gradient(from 0deg, transparent 0%, #0ea5e9 65%, transparent 100%)',
                            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px))',
                            mask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px))',
                        }}
                    />
                    {/* Glow lembut berdenyut di belakang logo */}
                    <div className="absolute inset-3 rounded-full bg-sky-400/25 animate-ping" />
                    {/* Logo APIKMAS DJurnal — sama seperti di sidebar, "bernapas" pelan */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="h-11 w-11 rounded-xl bg-sky-600 shadow-lg shadow-sky-600/30 flex items-center justify-center"
                            style={{ animation: 'loaderBreathe 1.8s ease-in-out infinite' }}
                        >
                            <img src="/logodjurnal.svg" alt="" className="h-7 w-7 object-contain" />
                        </div>
                    </div>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">Memuat…</p>
            </div>

            <style>{`
                @keyframes loaderBreathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
}

export default function AppLayout({ children, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar_collapsed') === 'true';
        }
        return false;
    });

    const toggleSidebar = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(prev => !prev);
        } else {
            setIsCollapsed(prev => {
                const next = !prev;
                localStorage.setItem('sidebar_collapsed', String(next));
                return next;
            });
        }
    };

    useEffect(() => {
        const handlePageShow = (e) => {
            if (e.persisted) {
                window.location.reload();
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {title && <Head title={title} />}
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleSidebar}
            />

            <GlobalNavigationLoader />
            <AutoLogout />
            <LoginWelcome />
            <AnnouncementPopup />
            <KpiNotificationPopup />
            <Toast />
            <FloatingMasukan />
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                <Navbar onToggleSidebar={toggleSidebar} />

                {/* Breadcrumb Bar */}
                <div className="border-b border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xs px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {(!title || title === 'Dashboard') ? (
                        <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
                            <Home className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" strokeWidth={1.75} />
                            <span>Dashboard</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200 truncate">
                            <span>{title}</span>
                        </div>
                    )}
                </div>

                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
                    {title && (
                        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">{title}</h1>
                    )}
                    {children}
                </main>

                <footer className="border-t border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 px-6 py-3">
                    <p className="text-xs text-center text-gray-400 dark:text-gray-600">
                        &copy; {new Date().getFullYear()} APIKMAS DJurnal — Aplikasi Mengajar di Kelas Digital Jurnal
                    </p>
                </footer>
            </div>
        </div>
    );
}
