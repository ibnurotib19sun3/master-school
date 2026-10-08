import ThemeToggle from '@/Components/ThemeToggle';
import { BookText, CheckCircle2, ShieldCheck, MailOpen, Lock, Zap } from 'lucide-react';

const statTiles = [
    { icon: BookText, label: 'Jurnal Hari Ini', value: '42' },
    { icon: CheckCircle2, label: 'Kehadiran', value: '98%' },
    { icon: MailOpen, label: 'Surat Masuk', value: '7' },
];

const barHeights = [38, 62, 48, 80, 54, 70, 44];

const AnimatedMeshBg = () => (
    <>
        <div className="absolute -top-28 -left-24 h-96 w-96 rounded-full opacity-25 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)', animation: 'driftA 16s ease-in-out infinite' }} />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #7dd3fc, transparent 70%)', animation: 'driftB 20s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[30rem] w-[30rem] rounded-full opacity-[0.08] pointer-events-none"
            style={{ background: 'radial-gradient(circle, #e0f2fe, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 40px)' }} />
    </>
);

/* Visual centerpiece — a "live product" illustration (mock dashboard glass card +
   two floating accent chips) instead of a plain feature list, to give the left
   panel real product presence rather than just marketing text. */
const HeroMockup = () => (
    <div className="relative mt-9 mb-3 select-none">
        <div className="relative rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 p-5"
            style={{ animation: 'floatSlow 7s ease-in-out infinite' }}>
            <div className="flex items-center gap-1.5 mb-4">
                <span className="h-2 w-2 rounded-full bg-red-400/60" />
                <span className="h-2 w-2 rounded-full bg-amber-400/60" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
                <span className="ml-2 text-[10px] text-white/25 font-mono tracking-tight">djurnal.apikmas.sch.id</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-4">
                {statTiles.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl bg-white/[0.05] border border-white/10 px-2.5 py-2.5">
                        <Icon className="h-3.5 w-3.5 text-sky-300 mb-1.5" />
                        <p className="text-white font-bold text-[15px] leading-none">{value}</p>
                        <p className="text-sky-100/35 text-[9.5px] mt-1 leading-none">{label}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-end gap-1.5 h-14">
                {barHeights.map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-sky-400/60 to-sky-200/20" style={{ height: `${h}%` }} />
                ))}
            </div>
        </div>

        {/* Floating accent chip — top right */}
        <div className="absolute -top-5 -right-7 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 pl-2.5 pr-3.5 py-2.5 shadow-xl flex items-center gap-2"
            style={{ animation: 'floatSlow 5.5s ease-in-out infinite', animationDelay: '0.3s' }}>
            <div className="h-7 w-7 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            </div>
            <div>
                <p className="text-[11px] font-semibold text-white leading-none whitespace-nowrap">Jurnal Tersimpan</p>
                <p className="text-[9px] text-white/35 mt-1">Baru saja</p>
            </div>
        </div>

        {/* Floating accent chip — bottom left */}
        <div className="absolute -bottom-4 -left-7 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 pl-2.5 pr-3.5 py-2.5 shadow-xl flex items-center gap-2"
            style={{ animation: 'floatSlow 6.5s ease-in-out infinite', animationDelay: '0.8s' }}>
            <div className="h-7 w-7 rounded-lg bg-sky-400/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-300" />
            </div>
            <div>
                <p className="text-[11px] font-semibold text-white leading-none whitespace-nowrap">TTE Terverifikasi</p>
                <p className="text-[9px] text-white/35 mt-1">QR Code aktif</p>
            </div>
        </div>
    </div>
);

export default function GuestLayout({ children }) {
    const gradient = 'linear-gradient(160deg, #051f33 0%, #06304f 22%, #0b4870 44%, #0c5a87 64%, #0284c7 84%, #0ea5e9 100%)';

    return (
        <div className="min-h-screen flex" style={{ background: gradient }}>

            {/* ── Left panel: branding ── */}
            <div className="hidden lg:flex lg:w-[50%] relative flex-col items-center justify-center p-12 overflow-hidden">
                <AnimatedMeshBg />

                <div className="relative z-10 max-w-sm w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center shadow-lg shadow-black/10">
                            <img src="/logodjurnal.svg" alt="DJurnal" className="h-7 w-7 object-contain" />
                        </div>
                        <div>
                            <p className="text-white font-extrabold text-lg leading-none tracking-tight">APIKMAS DJurnal</p>
                            <p className="text-sky-200/50 text-xs mt-1">Sistem Informasi Sekolah</p>
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="text-white font-extrabold text-[2rem] leading-[1.15] mb-3 tracking-tight">
                        Satu Platform,<br />
                        <span className="bg-gradient-to-r from-sky-200 to-sky-300 bg-clip-text text-transparent">Semua Administrasi.</span>
                    </h1>
                    <p className="text-sky-100/50 text-[14.5px] leading-relaxed">
                        Jurnal, persuratan, kehadiran, dan evaluasi kinerja — terintegrasi dalam satu portal untuk seluruh civitas sekolah.
                    </p>

                    <HeroMockup />

                    {/* Bottom badge */}
                    <div className="mt-6 flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3.5">
                        <div className="flex -space-x-1.5 shrink-0">
                            {['#0284c7', '#0369a1', '#0891b2', '#059669'].map((c, i) => (
                                <div key={i} className="h-6 w-6 rounded-full border-2 border-[#06304f] flex items-center justify-center text-[9px] font-bold text-white"
                                    style={{ background: c }}>
                                    {['G', 'K', 'T', 'W'][i]}
                                </div>
                            ))}
                        </div>
                        <p className="text-sky-100/40 text-xs leading-snug">Guru · Kepala Sekolah · Tata Usaha · Wakasek</p>
                    </div>
                </div>

                <p className="absolute bottom-6 text-sky-200/25 text-xs tracking-wide">
                    &copy; {new Date().getFullYear()} APIKMAS DJurnal
                </p>
            </div>

            {/* ── Right panel: form — same gradient as the left, glass card on top ── */}
            <div className="flex-1 relative flex items-center justify-center p-5 sm:p-8 overflow-hidden">
                <AnimatedMeshBg />

                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                    <ThemeToggle glass />
                </div>

                <div className="relative z-10 w-full max-w-[380px]" style={{ animation: 'fadeIn 0.5s ease-out' }}>

                    {/* Mobile logo (small screens only — left panel is hidden) */}
                    <div className="flex flex-col items-center mb-7 lg:hidden">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-4 shadow-xl">
                            <img src="/logodjurnal.svg" alt="DJurnal" className="h-8 w-8 object-contain" />
                        </div>
                        <p className="text-white font-bold text-lg tracking-tight text-center">APIKMAS DJurnal</p>
                        <p className="text-sky-200/50 text-xs mt-0.5 text-center">Sistem Informasi Sekolah</p>
                    </div>

                    <div className="relative">
                        {/* Floating accent chip — top left of card, mirrors the left panel's chips */}
                        <div className="hidden sm:flex absolute -top-5 -left-6 z-20 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 pl-2.5 pr-3.5 py-2.5 shadow-xl items-center gap-2"
                            style={{ animation: 'floatSlow 6s ease-in-out infinite' }}>
                            <div className="h-7 w-7 rounded-lg bg-sky-400/20 flex items-center justify-center shrink-0">
                                <Lock className="h-3.5 w-3.5 text-sky-200" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-white leading-none whitespace-nowrap">Aman &amp; Terenkripsi</p>
                            </div>
                        </div>

                        {/* Floating accent chip — bottom right of card */}
                        <div className="hidden sm:flex absolute -bottom-4 -right-6 z-20 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 pl-2.5 pr-3.5 py-2.5 shadow-xl items-center gap-2"
                            style={{ animation: 'floatSlow 5s ease-in-out infinite', animationDelay: '0.5s' }}>
                            <div className="h-7 w-7 rounded-lg bg-amber-400/20 flex items-center justify-center shrink-0">
                                <Zap className="h-3.5 w-3.5 text-amber-200" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-white leading-none whitespace-nowrap">Akses Cepat</p>
                            </div>
                        </div>

                        {/* Form card — glass, matches the left panel's colored backdrop */}
                        <div className="relative bg-white/[0.08] backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/20 border border-white/15 px-7 py-8 sm:px-9 sm:py-10 overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-300/80 via-white/60 to-sky-300/80" />
                            {children}
                        </div>
                    </div>

                    <p className="mt-7 text-center text-xs text-sky-100/30">
                        &copy; {new Date().getFullYear()} APIKMAS DJurnal &middot; Semua hak dilindungi
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes floatSlow {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-8px); }
                }
                @keyframes driftA {
                    0%, 100% { transform: translate(0, 0); }
                    50%      { transform: translate(30px, 20px); }
                }
                @keyframes driftB {
                    0%, 100% { transform: translate(0, 0); }
                    50%      { transform: translate(-25px, -15px); }
                }
            `}</style>
        </div>
    );
}
