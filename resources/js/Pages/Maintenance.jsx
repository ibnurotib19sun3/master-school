import { Head, router } from '@inertiajs/react';
import ThemeToggle from '@/Components/ThemeToggle';
import { Wrench, RefreshCw, Phone, Mail, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const AUTO_CHECK_SECONDS = 30;

export default function Maintenance({ message, sekolah, telepon, email, logo_url }) {
    const [secondsLeft, setSecondsLeft] = useState(AUTO_CHECK_SECONDS);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        const tick = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    setChecking(true);
                    router.reload({ onFinish: () => setChecking(false) });
                    return AUTO_CHECK_SECONDS;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(tick);
    }, []);

    const retryNow = () => {
        setChecking(true);
        setSecondsLeft(AUTO_CHECK_SECONDS);
        router.reload({ onFinish: () => setChecking(false) });
    };

    return (
        <>
            <Head title="Sedang Pemeliharaan" />
            <style>{`
                @keyframes page-in    { from{opacity:0} to{opacity:1} }
                @keyframes rise       { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
                @keyframes blob-a     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.08)} }
                @keyframes blob-b     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-25px,25px) scale(1.06)} }
                @keyframes wrench-jiggle { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(10deg)} }
                @keyframes badge-in   { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
                @keyframes bar-slide  { 0%{transform:translateX(-100%)} 100%{transform:translateX(220%)} }
                @keyframes ring-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
                .page-in     { animation: page-in .4s ease both; }
                .rise        { animation: rise .7s cubic-bezier(.22,1,.36,1) .05s both; }
                .blob-a      { animation: blob-a 10s ease-in-out infinite; }
                .blob-b      { animation: blob-b 12s ease-in-out infinite; }
                .wrench-ico  { animation: wrench-jiggle 2.2s ease-in-out infinite; transform-origin: 70% 30%; }
                .badge-in    { animation: badge-in .5s cubic-bezier(.34,1.56,.64,1) .35s both; }
                .bar-slide   { animation: bar-slide 1.6s ease-in-out infinite; }
                .ring-pulse  { animation: ring-pulse 2s ease-in-out infinite; }
            `}</style>

            <div className="page-in relative min-h-screen flex flex-col overflow-hidden bg-[#f5f6ff] dark:bg-[#07081c]">

                {/* Theme toggle */}
                <div className="absolute top-4 right-4 z-20">
                    <ThemeToggle />
                </div>

                {/* Animated mesh blobs */}
                <div className="blob-a absolute -top-24 -left-16 w-96 h-96 rounded-full pointer-events-none blur-3xl bg-sky-400/20 dark:bg-sky-600/15" />
                <div className="blob-b absolute -bottom-24 -right-16 w-96 h-96 rounded-full pointer-events-none blur-3xl bg-violet-400/20 dark:bg-violet-600/15" />

                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }} />

                {/* Main */}
                <div className="rise relative flex-1 flex items-center justify-center px-6 py-14">
                    <div className="w-full max-w-md">
                        <div className="rounded-3xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-white/4 backdrop-blur-xl shadow-xl shadow-sky-900/5 dark:shadow-black/30 p-8 text-center">

                            {/* Logo + wrench badge */}
                            <div className="relative flex justify-center mb-6">
                                <div className="relative h-20 w-20 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center overflow-hidden">
                                    <img
                                        src={logo_url || '/logodjurnalwarna.svg'}
                                        alt={sekolah || 'Logo'}
                                        className="h-12 w-12 object-contain"
                                    />
                                </div>
                                <span className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center h-9 w-9 rounded-full bg-amber-500 shadow-lg ring-4 ring-white dark:ring-[#07081c]">
                                    <Wrench className="wrench-ico h-4.5 w-4.5 text-white" />
                                </span>
                            </div>

                            {/* Status badge */}
                            <div className="badge-in flex justify-center mb-4">
                                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                    Sedang Pemeliharaan
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-2xl font-black tracking-tight mb-1 text-gray-900 dark:text-white">
                                Kami Sedang Berbenah
                            </h1>
                            {sekolah && (
                                <p className="text-sm font-medium text-sky-600 dark:text-sky-400 mb-4">{sekolah}</p>
                            )}

                            {/* Message */}
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                                {message || 'Sistem sedang dalam proses pemeliharaan dan peningkatan layanan. Kami akan segera kembali. Mohon maaf atas ketidaknyamanan ini.'}
                            </p>

                            {/* Indeterminate progress bar */}
                            <div className="relative h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden mb-5">
                                <div className="bar-slide absolute inset-y-0 left-0 w-1/3 rounded-full bg-linear-to-r from-sky-400 via-violet-400 to-sky-400" />
                            </div>

                            {/* Auto-check status + retry */}
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <p className="ring-pulse text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                    Memeriksa otomatis dalam {secondsLeft}s
                                </p>
                                <button
                                    onClick={retryNow}
                                    disabled={checking}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-400/10 border border-sky-200 dark:border-sky-400/20 hover:bg-sky-100 dark:hover:bg-sky-400/20 disabled:opacity-60 transition-colors"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
                                    {checking ? 'Memeriksa…' : 'Coba Sekarang'}
                                </button>
                            </div>

                            {/* Contact chips */}
                            {(telepon || email) && (
                                <div className="flex flex-wrap justify-center gap-2 pt-5 border-t border-gray-100 dark:border-white/10">
                                    {telepon && (
                                        <a href={`tel:${telepon}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                            <Phone className="h-3.5 w-3.5 text-sky-500" /> {telepon}
                                        </a>
                                    )}
                                    {email && (
                                        <a href={`mailto:${email}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                            <Mail className="h-3.5 w-3.5 text-sky-500" /> {email}
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quote */}
                        <p className="mt-6 text-center text-sm text-gray-400 dark:text-gray-600 italic leading-relaxed px-4">
                            "Pemeliharaan adalah wujud komitmen kami menghadirkan layanan terbaik."
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative shrink-0 py-5 border-t border-sky-100/60 dark:border-white/5">
                    <p className="text-center text-xs text-gray-400 dark:text-gray-600">
                        &copy; {new Date().getFullYear()} APIKMAS Djurnal — Sistem Informasi Manajemen Sekolah
                    </p>
                </div>
            </div>
        </>
    );
}
