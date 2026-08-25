import { Head } from '@inertiajs/react';
import ThemeToggle from '@/Components/ThemeToggle';

export default function Maintenance({ message, sekolah }) {
    return (
        <>
            <Head title="Sedang Pemeliharaan" />
            <style>{`
                @keyframes page-in   { from{opacity:0} to{opacity:1} }
                @keyframes rise      { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
                @keyframes spin-ring { to{transform:rotate(360deg)} }
                @keyframes spin-ring-rev { to{transform:rotate(-360deg)} }
                @keyframes spin-icon { to{transform:rotate(360deg)} }
                @keyframes dot-bounce { 0%,80%,100%{transform:translateY(0);opacity:.35} 40%{transform:translateY(-9px);opacity:1} }
                @keyframes glow-breathe { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.9;transform:scale(1.06)} }
                @keyframes badge-in  { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
                .page-in   { animation: page-in .4s ease both; }
                .rise      { animation: rise .75s cubic-bezier(.22,1,.36,1) .05s both; }
                .ring-cw   { animation: spin-ring 14s linear infinite; }
                .ring-ccw  { animation: spin-ring-rev 10s linear infinite; }
                .spin-icon { animation: spin-icon 20s linear infinite; }
                .glow      { animation: glow-breathe 4s ease-in-out infinite; }
                .dot-1     { animation: dot-bounce 1.4s ease-in-out 0s   infinite; }
                .dot-2     { animation: dot-bounce 1.4s ease-in-out .18s infinite; }
                .dot-3     { animation: dot-bounce 1.4s ease-in-out .36s infinite; }
                .badge-in  { animation: badge-in .5s cubic-bezier(.34,1.56,.64,1) .5s both; }
            `}</style>

            <div className="page-in relative min-h-screen flex flex-col overflow-hidden bg-[#f5f6ff] dark:bg-[#07081c]">

                {/* Theme toggle */}
                <div className="absolute top-4 right-4 z-20">
                    <ThemeToggle />
                </div>

                {/* Ambient glow center */}
                <div className="glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.1) 45%, transparent 75%)' }} />

                {/* Top-right secondary glow */}
                <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full pointer-events-none blur-3xl bg-violet-400/15 dark:bg-violet-600/12" />

                {/* Bottom-left tertiary glow */}
                <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full pointer-events-none blur-3xl bg-sky-400/15 dark:bg-sky-600/10" />

                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }} />

                {/* Main */}
                <div className="rise relative flex-1 flex items-center justify-center px-6 py-16">
                    <div className="w-full max-w-sm text-center">

                        {/* Logo with spinning rings */}
                        <div className="relative flex justify-center items-center mb-8" style={{ height: '128px' }}>
                            {/* Outer ring — clockwise dashed */}
                            <div className="ring-cw absolute w-28 h-28 rounded-full border border-dashed border-sky-400/30 dark:border-sky-400/25" />
                            {/* Inner ring — counter-clockwise solid */}
                            <div className="ring-ccw absolute w-20 h-20 rounded-full border border-sky-300/40 dark:border-sky-500/30" />

                            {/* Logo */}
                            <div className="relative z-10 flex items-center justify-center">
                                <img src="/logodjurnalwarna.svg" alt="DJurnal" className="h-14 w-14 object-contain drop-shadow-lg" />
                            </div>
                        </div>

                        {/* Bounce dots */}
                        <div className="flex justify-center gap-1.5 mb-7">
                            <span className="dot-1 inline-block w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                            <span className="dot-2 inline-block w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />
                            <span className="dot-3 inline-block w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                        </div>

                        {/* Status badge */}
                        <div className="badge-in flex justify-center mb-5">
                            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                Sedang Pemeliharaan
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-orange-500 dark:text-orange-400">
                            Segera Kembali
                        </h1>

                        {sekolah && (
                            <p className="text-base font-medium text-gray-500 dark:text-gray-400 mb-6">{sekolah}</p>
                        )}

                        {/* Gradient divider */}
                        <div className="mx-auto mb-6 h-px w-32 rounded-full"
                            style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.5), transparent)' }} />

                        {/* Message */}
                        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8 px-2">
                            {message || 'Sistem sedang dalam proses pemeliharaan dan peningkatan layanan. Kami akan segera kembali. Mohon maaf atas ketidaknyamanan ini.'}
                        </p>

                        {/* Quote */}
                        <p className="text-sm text-gray-400 dark:text-gray-600 italic leading-relaxed">
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
