import { useState, useEffect } from 'react';
import ThemeToggle from '@/Components/ThemeToggle';
import {
    ChevronLeft, ChevronRight, ShieldCheck, BookText,
    FileSpreadsheet, Sparkles, LayoutGrid, CheckCircle2,
    CalendarCheck, Award
} from 'lucide-react';

/* ─── Fitur Utama APIKMAS DJurnal ────────────────────────────────── */
const slides = [
    {
        tag: 'Jurnal & Presensi',
        title: 'Jurnal Mengajar & Presensi Digital',
        subtitle: 'Pencatatan agenda mengajar harian, ketercapaian materi, dan absensi guru maupun siswa secara real-time dan terstruktur.',
    },
    {
        tag: 'Tata Usaha & Persuratan',
        title: 'Manajemen Surat & TTE Resmi',
        subtitle: 'Penyusunan naskah dinas resmi, penomoran agenda otomatis, disposisi cepat, serta verifikasi tanda tangan elektronik (TTE) berbasis QR Code.',
    },
    {
        tag: 'Perangkat & Media Ajar',
        title: 'Modul Ajar & Media Pembelajaran',
        subtitle: 'Pengarsipan modul ajar, jobsheet praktikum, asesmen kuis, dan materi ajar guru yang terorganisir untuk mendukung proses KBM.',
    },
    {
        tag: 'Laporan & Kinerja',
        title: 'Rekapitulasi Kinerja & Pelaporan',
        subtitle: 'Statistik kehadiran guru dan siswa, rekapitulasi semester otomatis, serta monitoring pimpinan sekolah dalam satu dasbor terpadu.',
    },
];

/* ─── Pure SVG & CSS Geometric Ornament (NO images/photos) ───────── */
function GeometricOrnament() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Ambient glowing radial gradients */}
            <div
                className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full opacity-35 blur-3xl"
                style={{
                    background: 'radial-gradient(circle, #38bdf8 0%, #0284c7 40%, transparent 70%)',
                    animation: 'ornamentFloat 18s ease-in-out infinite alternate',
                }}
            />
            <div
                className="absolute bottom-10 right-0 w-[30rem] h-[30rem] rounded-full opacity-25 blur-3xl"
                style={{
                    background: 'radial-gradient(circle, #0ea5e9 0%, #0369a1 45%, transparent 70%)',
                    animation: 'ornamentFloat 14s ease-in-out infinite alternate-reverse',
                }}
            />
            <div
                className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 blur-2xl"
                style={{
                    background: 'radial-gradient(circle, #38bdf8 0%, #0284c7 35%, transparent 65%)',
                }}
            />

            {/* Matrix Dot Grid */}
            <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #ffffff 1.2px, transparent 1.2px)',
                    backgroundSize: '28px 28px',
                }}
            />

            {/* Subtle Diagonal Tech Hatching */}
            <div
                className="absolute inset-0 opacity-[0.035]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 36px)',
                }}
            />

            {/* Concentric Modern Wave Lines (SVG) */}
            <svg
                className="absolute inset-0 w-full h-full opacity-20"
                viewBox="0 0 800 800"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="400" cy="400" r="160" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
                <circle cx="400" cy="400" r="230" stroke="#7dd3fc" strokeWidth="1.2" opacity="0.3" />
                <circle cx="400" cy="400" r="300" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="8 8" opacity="0.25" />
                <circle cx="400" cy="400" r="370" stroke="#bae6fd" strokeWidth="1" opacity="0.15" />

                {/* Dynamic intersecting curves */}
                <path
                    d="M-50,220 C200,140 320,480 620,380 C760,330 820,240 850,220"
                    stroke="url(#lineGrad1)"
                    strokeWidth="2"
                    opacity="0.5"
                />
                <path
                    d="M-50,560 C220,640 400,320 660,460 C780,520 830,580 870,620"
                    stroke="url(#lineGrad2)"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                    opacity="0.45"
                />
                <path
                    d="M100,780 C280,500 520,620 720,280"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    opacity="0.3"
                />

                <defs>
                    <linearGradient id="lineGrad1" x1="0" y1="0" x2="800" y2="400" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38bdf8" />
                        <stop offset="0.5" stopColor="#7dd3fc" stopOpacity="0.8" />
                        <stop offset="1" stopColor="#0284c7" />
                    </linearGradient>
                    <linearGradient id="lineGrad2" x1="0" y1="600" x2="800" y2="400" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#bae6fd" />
                        <stop offset="0.5" stopColor="#38bdf8" />
                        <stop offset="1" stopColor="#0284c7" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Floating Glassmorphic Centerpiece Nodes (Fitur Aplikasi) */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative w-80 h-80 max-w-full">
                    {/* Central Core: APIKMAS DJurnal */}
                    <div
                        className="absolute inset-0 m-auto w-44 h-44 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col items-center justify-center p-5 text-center transform -rotate-3 hover:rotate-0 transition-transform duration-500"
                        style={{ animation: 'floatCenter 8s ease-in-out infinite' }}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400/30 to-sky-200/20 border border-white/20 flex items-center justify-center mb-2.5 shadow-inner">
                            <LayoutGrid className="w-6 h-6 text-sky-200" />
                        </div>
                        <p className="text-[11.5px] font-bold text-white tracking-wide uppercase">APIKMAS DJurnal</p>
                        <p className="text-[9.5px] text-sky-200/70 mt-0.5">Sistem Informasi Sekolah</p>
                        <div className="mt-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9px] font-semibold text-emerald-300">Sistem Aktif &amp; Siap</span>
                        </div>
                    </div>

                    {/* Floating Node 1: Jurnal & Presensi (Top-Right) */}
                    <div
                        className="absolute -top-4 -right-2 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 px-3 py-2 shadow-xl flex items-center gap-2.5"
                        style={{ animation: 'floatSlowA 6s ease-in-out infinite' }}
                    >
                        <div className="w-7 h-7 rounded-lg bg-sky-400/20 border border-sky-400/30 flex items-center justify-center shrink-0">
                            <BookText className="w-4 h-4 text-sky-300" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-white leading-tight">Jurnal &amp; Presensi</p>
                            <p className="text-[9px] text-white/50 mt-0.5">Agenda Harian Guru</p>
                        </div>
                    </div>

                    {/* Floating Node 2: Tata Usaha & TTE (Bottom-Left) */}
                    <div
                        className="absolute -bottom-4 -left-2 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 px-3 py-2 shadow-xl flex items-center gap-2.5"
                        style={{ animation: 'floatSlowB 7s ease-in-out infinite' }}
                    >
                        <div className="w-7 h-7 rounded-lg bg-sky-400/20 border border-sky-400/30 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4 text-sky-300" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-white leading-tight">Persuratan &amp; TTE</p>
                            <p className="text-[9px] text-white/50 mt-0.5">Validasi QR Code</p>
                        </div>
                    </div>

                    {/* Floating Node 3: Rekap Laporan (Top-Left) */}
                    <div
                        className="absolute top-16 -left-8 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/10 px-2.5 py-1.5 shadow-lg flex items-center gap-1.5"
                        style={{ animation: 'floatSlowA 5.5s ease-in-out infinite reverse' }}
                    >
                        <CalendarCheck className="w-3.5 h-3.5 text-sky-300" />
                        <span className="text-[9.5px] font-medium text-sky-100/80">Rekap Otomatis</span>
                    </div>

                    {/* Floating Node 4: Civitas Sekolah (Bottom-Right) */}
                    <div
                        className="absolute bottom-16 -right-6 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/10 px-2.5 py-1.5 shadow-lg flex items-center gap-1.5"
                        style={{ animation: 'floatSlowB 6.5s ease-in-out infinite reverse' }}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span className="text-[9.5px] font-medium text-amber-100/80">Guru &middot; TU &middot; Siswa</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function GuestLayout({ children }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    /* Auto rotate slider every 6 seconds */
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-gray-950 font-sans selection:bg-sky-500 selection:text-white">

            {/* ═══════════════════════════════════════════════════════════════════
                LEFT PANEL: Pure Geometric Ornament & Feature Carousel
                (Visible on desktop lg:w-1/2, NO photo/image of books)
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-10 xl:p-14 overflow-hidden bg-gradient-to-br from-[#051726] via-[#082742] to-[#025686] text-white select-none">
                {/* Background vector ornament layer */}
                <GeometricOrnament />

                {/* Left Panel Top: School / App Pill */}
                <div className="relative z-10 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-xs text-sky-100/90 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        <span className="font-semibold tracking-wide">APIKMAS DJurnal</span>
                        <span className="text-white/30">&middot;</span>
                        <span className="text-white/70 text-[11px]">Sistem Informasi Sekolah</span>
                    </div>

                    <div className="text-[11px] font-mono text-white/40">
                        v1.0.10
                    </div>
                </div>

                {/* Navigation Arrow Left (translucent floating circular button) */}
                <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Slide Sebelumnya"
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all shadow-lg"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Navigation Arrow Right (translucent floating circular button) */}
                <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Slide Selanjutnya"
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all shadow-lg"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Left Panel Bottom: Carousel Text & Pagination Dots */}
                <div className="relative z-10 max-w-lg">
                    {/* Animated slide content */}
                    <div key={currentSlide} className="transition-all duration-500 ease-out animate-fadeIn">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-sky-400/20 border border-sky-300/30 text-[11px] font-semibold text-sky-200 uppercase tracking-wider mb-2.5">
                            {slides[currentSlide].tag}
                        </span>
                        <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            {slides[currentSlide].title}
                        </h2>
                        <p className="mt-3 text-sm xl:text-base text-sky-100/75 leading-relaxed font-normal">
                            {slides[currentSlide].subtitle}
                        </p>
                    </div>

                    {/* Pagination Indicators (active elongated pill, round inactive dots) */}
                    <div className="mt-6 flex items-center gap-2">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setCurrentSlide(idx)}
                                aria-label={`Pilih slide ${idx + 1}`}
                                className={`transition-all duration-300 rounded-full ${
                                    idx === currentSlide
                                        ? 'w-8 h-2 bg-white shadow-sm'
                                        : 'w-2 h-2 bg-white/35 hover:bg-white/60'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                RIGHT PANEL: Clean Login Card
                (Full width on mobile, 50% on desktop)
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 min-h-screen flex flex-col justify-between bg-white dark:bg-gray-900 px-6 sm:px-12 lg:px-14 xl:px-20 py-8 relative transition-colors duration-200 overflow-y-auto">

                {/* Top Bar with Segmented ThemeToggle in top-right corner */}
                <div className="w-full flex justify-end items-center mb-4">
                    <ThemeToggle />
                </div>

                {/* Centered Login Form Container */}
                <div className="flex-1 flex items-center justify-center py-6">
                    <div className="w-full max-w-[400px] transition-all">
                        {children}
                    </div>
                </div>

                {/* Clean School Footer */}
                <div className="text-center pt-6 pb-2 border-t border-gray-100 dark:border-gray-800/80">
                    <p className="text-[11px] font-mono font-medium text-gray-400 dark:text-gray-500">
                        APIKMAS DJurnal v1.2.5
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-snug">
                        &copy; {new Date().getFullYear()} APIKMAS DJurnal &middot; Mafatih Inovasi Teknologi
                    </p>
                </div>
            </div>

            {/* ── Keyframes animation styling ── */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes floatCenter {
                    0%, 100% { transform: translateY(0) rotate(-3deg); }
                    50%      { transform: translateY(-10px) rotate(-1deg); }
                }
                @keyframes floatSlowA {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-8px); }
                }
                @keyframes floatSlowB {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-6px); }
                }
                @keyframes ornamentFloat {
                    0%   { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(25px, 20px) scale(1.08); }
                }
            `}</style>
        </div>
    );
}
