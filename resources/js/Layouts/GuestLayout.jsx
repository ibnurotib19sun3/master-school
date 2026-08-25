import ThemeToggle from '@/Components/ThemeToggle';
import { CheckCircle, BookText, ShieldCheck, BarChart3, Send } from 'lucide-react';

const highlights = [
    { icon: BookText,    text: 'Jurnal digital seluruh civitas sekolah' },
    { icon: ShieldCheck, text: 'TTE surat berbasis QR Code terverifikasi' },
    { icon: BarChart3,   text: 'KPI guru & evaluasi kinerja real-time' },
    { icon: Send,        text: 'Manajemen surat masuk & keluar terpadu' },
];

const BlobBg = () => (
    <>
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-25 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #7dd3fc, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #0ea5e9, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 40px)' }} />
    </>
);

export default function GuestLayout({ children }) {
    const gradient = 'linear-gradient(135deg, #082f49 0%, #0c4a6e 20%, #075985 40%, #0369a1 60%, #0284c7 80%, #0ea5e9 100%)';

    return (
        <div className="min-h-screen flex">

            {/* ── Left panel: branding ── */}
            <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center p-12 overflow-hidden"
                style={{ background: gradient }}>
                <BlobBg />

                <div className="relative z-10 max-w-sm w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="h-12 w-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg">
                            <img src="/logodjurnal.svg" alt="DJurnal" className="h-7 w-7 object-contain" />
                        </div>
                        <div>
                            <p className="text-white font-extrabold text-lg leading-none tracking-tight">APIKMAS DJurnal</p>
                            <p className="text-sky-200/60 text-xs mt-0.5">Sistem Informasi Sekolah</p>
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="text-white font-extrabold text-3xl leading-tight mb-3 tracking-tight">
                        Kelola Sekolah<br />
                        <span className="text-sky-200">Lebih Cerdas.</span>
                    </h1>
                    <p className="text-sky-200/60 text-sm leading-relaxed mb-10">
                        Platform digital terintegrasi untuk manajemen akademik, jurnal, persuratan, dan evaluasi kinerja seluruh civitas sekolah.
                    </p>

                    {/* Feature highlights */}
                    <div className="space-y-3.5">
                        {highlights.map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                                    <Icon className="h-4 w-4 text-sky-200" />
                                </div>
                                <span className="text-sky-100/70 text-sm">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Bottom badge */}
                    <div className="mt-12 flex items-center gap-2 bg-white/8 border border-white/12 rounded-xl px-4 py-3">
                        <div className="flex -space-x-1.5">
                            {['#0284c7','#0369a1','#0891b2','#059669'].map((c, i) => (
                                <div key={i} className="h-6 w-6 rounded-full border-2 border-[#075985] flex items-center justify-center text-[9px] font-bold text-white"
                                    style={{ background: c }}>
                                    {['G','K','T','W'][i]}
                                </div>
                            ))}
                        </div>
                        <p className="text-sky-200/50 text-xs ml-1">Guru · Kepala Sekolah · Tata Usaha · Wakasek</p>
                    </div>
                </div>

                {/* Footer text */}
                <p className="absolute bottom-5 text-sky-300/30 text-xs">
                    © {new Date().getFullYear()} APIKMAS DJurnal
                </p>
            </div>

            {/* ── Right panel: form ── */}
            <div className="flex-1 relative flex items-center justify-center p-5 sm:p-8 overflow-hidden"
                style={{ background: gradient }}>
                <BlobBg />

                {/* Theme toggle */}
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
                    <ThemeToggle glass />
                </div>

                <div className="relative z-10 w-full max-w-sm sm:max-w-md">

                    {/* Mobile logo (only on small screens) */}
                    <div className="flex flex-col items-center mb-7 lg:hidden">
                        <div className="h-14 w-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-4 shadow-xl">
                            <img src="/logodjurnal.svg" alt="DJurnal" className="h-9 w-9 object-contain" />
                        </div>
                        <p className="text-white font-bold text-lg tracking-wide text-center">APIKMAS DJurnal</p>
                        <p className="text-sky-200/60 text-xs mt-0.5 text-center">Sistem Informasi Sekolah</p>
                    </div>

                    {/* Form card */}
                    <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-gray-100 dark:border-white/20 px-7 py-8 sm:px-9 sm:py-10">
                        {children}
                    </div>

                    {/* Footer */}
                    <p className="mt-5 text-center text-xs text-white/30">
                        © {new Date().getFullYear()} APIKMAS DJurnal · Semua hak dilindungi
                    </p>
                </div>
            </div>
        </div>
    );
}
