import { useState, useEffect, useRef } from 'react';
import { usePage, router, Head } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import Navbar from '@/Components/Navbar';
import FloatingMasukan from '@/Components/FloatingMasukan';
import { CheckCircle, XCircle, Info, X, Clock, AlertTriangle, Megaphone } from 'lucide-react';

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
            bar:  'bg-emerald-500',
            icon: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
            text: 'text-emerald-700 dark:text-emerald-300',
        },
        error: {
            bar:  'bg-red-500',
            icon: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
            text: 'text-red-700 dark:text-red-300',
        },
        info: {
            bar:  'bg-sky-500',
            icon: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
            text: 'text-sky-700 dark:text-sky-300',
        },
    }[type];

    return (
        <div
            className={`fixed bottom-6 right-6 z-9999 max-w-sm w-full pointer-events-auto
                transition-all duration-300
                ${leaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
        >
            <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar}`} />
                <div className="flex items-start gap-3 pl-4 pr-3 py-3.5">
                    {cfg.icon}
                    <p className={`flex-1 text-sm font-medium ${cfg.text}`}>{msg}</p>
                    <button
                        onClick={dismiss}
                        className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className={`h-0.5 ${cfg.bar} opacity-30`}
                    style={{ animation: 'shrink 4.5s linear forwards' }} />
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

export default function AppLayout({ children, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <AutoLogout />
            <LoginWelcome />
            <AnnouncementPopup />
            <Toast />
            <FloatingMasukan />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
                    {title && (
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">{title}</h1>
                    )}
                    {children}
                </main>

                <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-3">
                    <p className="text-xs text-center text-gray-400 dark:text-gray-600">
                        &copy; {new Date().getFullYear()} APIKMAS DJurnal — Aplikasi Mengajar di Kelas Digital Jurnal
                    </p>
                </footer>
            </div>
        </div>
    );
}
