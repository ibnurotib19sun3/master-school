import { Link, Head } from '@inertiajs/react';
import {
    BookText, ClipboardList, BookMarked, BarChart3, Send, PieChart,
    Clock, NotebookPen, ShieldCheck, Users, Star, FileText,
    GraduationCap, Building2, UserCog, ArrowRight, ChevronRight,
    CheckCircle, Zap, Globe, MessageCircle, Mail, Phone,
} from 'lucide-react';

/* ── CSS animations ── */
const AnimStyles = () => (
    <style>{`
        @keyframes blob-spin {
            0%, 100% { transform: translate(0,0) scale(1); }
            33%       { transform: translate(30px,-20px) scale(1.08); }
            66%       { transform: translate(-15px,15px) scale(0.94); }
        }
        @keyframes float-a {
            0%, 100% { transform: translateY(0px) rotate(-1deg); }
            50%       { transform: translateY(-14px) rotate(1deg); }
        }
        @keyframes float-b {
            0%, 100% { transform: translateY(0px) rotate(1deg); }
            50%       { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes float-c {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-8px); }
        }
        @keyframes fade-up {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
        }
        @keyframes ping-slow {
            0%   { transform: scale(1);   opacity: 0.8; }
            70%  { transform: scale(1.6); opacity: 0; }
            100% { transform: scale(1.6); opacity: 0; }
        }
        .blob1 { animation: blob-spin 10s ease-in-out infinite; }
        .blob2 { animation: blob-spin 13s ease-in-out infinite reverse; }
        .blob3 { animation: blob-spin 8s  ease-in-out infinite 2s; }
        .card-float-a { animation: float-a 5s ease-in-out infinite; }
        .card-float-b { animation: float-b 6s ease-in-out infinite 0.8s; }
        .card-float-c { animation: float-c 4s ease-in-out infinite 1.4s; }
        .fade-up-1 { animation: fade-up 0.7s ease-out 0.1s both; }
        .fade-up-2 { animation: fade-up 0.7s ease-out 0.25s both; }
        .fade-up-3 { animation: fade-up 0.7s ease-out 0.4s both; }
        .fade-up-4 { animation: fade-up 0.7s ease-out 0.55s both; }
        .shimmer-text {
            background: linear-gradient(90deg, #e0e7ff 0%, #fff 40%, #c7d2fe 60%, #e0e7ff 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 4s linear infinite;
        }
        .ping-slow { animation: ping-slow 2s cubic-bezier(0,0,0.2,1) infinite; }
        .glow-btn { box-shadow: 0 0 30px rgba(99,102,241,0.5), 0 4px 20px rgba(0,0,0,0.3); }
        .glow-btn:hover { box-shadow: 0 0 40px rgba(99,102,241,0.7), 0 4px 24px rgba(0,0,0,0.35); }
    `}</style>
);

/* ── Floating app-preview cards ── */
function PreviewJurnal() {
    return (
        <div className="bg-white/12 backdrop-blur-xl border border-white/20 rounded-2xl p-4 w-64 shadow-2xl card-float-a">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-sky-400/30 flex items-center justify-center">
                    <BookText className="h-3.5 w-3.5 text-sky-200" />
                </div>
                <span className="text-white/90 text-xs font-semibold">Jurnal Harian</span>
                <span className="ml-auto text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-medium">Hari ini</span>
            </div>
            <div className="space-y-2">
                {[
                    { guru: 'Rizky M.', mapel: 'Matematika', kelas: 'XI-A', status: true },
                    { guru: 'Siti R.',  mapel: 'B. Inggris', kelas: 'X-B',  status: true },
                    { guru: 'Doni P.',  mapel: 'Fisika',     kelas: 'XII-C', status: false },
                ].map((r, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-white/6 px-2.5 py-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${r.status ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className="text-white/80 text-[11px] font-medium flex-1 truncate">{r.guru}</span>
                        <span className="text-white/50 text-[10px]">{r.mapel}</span>
                        <span className="text-white/40 text-[10px] hidden sm:block">{r.kelas}</span>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
                <span className="text-white/40 text-[10px]">32 dari 35 guru aktif</span>
                <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-1 w-5 rounded-full ${i < 4 ? 'bg-sky-400' : 'bg-white/15'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function PreviewStats() {
    return (
        <div className="bg-white/12 backdrop-blur-xl border border-white/20 rounded-2xl p-4 w-52 shadow-2xl card-float-b">
            <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-3">Kehadiran Minggu Ini</p>
            <div className="flex items-end gap-1.5 h-14 mb-2">
                {[60, 85, 72, 90, 78, 95, 88].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end">
                        <div
                            className="rounded-t-sm"
                            style={{
                                height: `${h}%`,
                                background: i === 5 ? 'linear-gradient(180deg,#a5b4fc,#6366f1)' : 'rgba(255,255,255,0.15)',
                            }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white text-xl font-bold">92%</p>
                    <p className="text-white/40 text-[10px]">Rata-rata kehadiran</p>
                </div>
                <div className="flex items-center gap-1 bg-emerald-400/15 text-emerald-300 text-[10px] px-2 py-1 rounded-full font-semibold">
                    ↑ 4.2%
                </div>
            </div>
        </div>
    );
}

function PreviewTte() {
    return (
        <div className="bg-white/12 backdrop-blur-xl border border-white/20 rounded-xl px-3.5 py-3 w-56 shadow-2xl card-float-c">
            <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <span className="text-white/90 text-xs font-semibold">TTE Surat Keluar</span>
            </div>
            <div className="space-y-1.5">
                {[
                    { nomor: '021/SK/VII/2026', ok: true  },
                    { nomor: '022/SK/VII/2026', ok: true  },
                    { nomor: '023/SK/VII/2026', ok: false },
                ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${s.ok ? 'bg-emerald-400/20' : 'bg-amber-400/20'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        </div>
                        <span className="font-mono text-[10px] text-white/60 truncate">{s.nomor}</span>
                        {s.ok && <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0 ml-auto" />}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Feature cards ── */
const features = [
    { icon: BookText,    title: 'Jurnal Digital',       desc: 'Jurnal mengajar guru, harian pimpinan, pokja, dan tata usaha — tercatat rapi.',           color: 'indigo' },
    { icon: ClipboardList, title: 'Presensi Siswa',     desc: 'Input kehadiran per pertemuan secara real-time, siap untuk rekap laporan.',                color: 'emerald' },
    { icon: BookMarked,  title: 'Media Pembelajaran',   desc: 'Kelola video, modul ajar, jobsheet, dan presentasi dalam satu platform.',                  color: 'violet' },
    { icon: BarChart3,   title: 'Penilaian & KPI',      desc: 'Nilai siswa per kompetensi, evaluasi KPI guru dan staf berbasis kinerja nyata.',           color: 'orange' },
    { icon: Send,        title: 'Manajemen Surat',      desc: 'Buat, lacak, dan arsipkan surat masuk & keluar. Dilengkapi TTE berbasis QR Code.',         color: 'blue' },
    { icon: PieChart,    title: 'Laporan & Rekap',      desc: 'Laporan kehadiran siswa, guru, dan staf. Rekap jurnal per periode, siap cetak.',           color: 'rose' },
    { icon: Clock,       title: 'Jadwal Pelajaran',     desc: 'Atur jadwal mengajar per rombel. Tersedia tampilan jadwal publik untuk siswa.',            color: 'amber' },
    { icon: NotebookPen, title: 'Buku Tamu Digital',    desc: 'Registrasi tamu sekolah secara digital. Riwayat kunjungan mudah diakses.',                 color: 'teal' },
    { icon: ShieldCheck, title: 'TTE & Verifikasi QR',  desc: 'Tanda tangan elektronik kepala sekolah. Verifikasi keaslian surat via QR Code.',          color: 'indigo' },
    { icon: Star,        title: 'Kuis & Asesmen',       desc: 'Buat soal kuis digital untuk siswa. Terintegrasi dengan pengumpulan tugas.',              color: 'pink' },
    { icon: Users,       title: 'Multi-Peran RBAC',     desc: 'Lebih dari 13 peran: guru, kepala sekolah, wakasek, tata usaha, pokja, piket.',           color: 'slate' },
    { icon: FileText,    title: 'Capaian Pembelajaran', desc: 'Dokumentasi CP per mata pelajaran, pengumpulan tugas, dan portofolio digital.',            color: 'cyan' },
];

const COLOR = {
    indigo:  { bg: 'bg-sky-500/10',  ring: 'ring-sky-500/20',  icon: 'text-sky-400',  glow: '#6366f1' },
    emerald: { bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', icon: 'text-emerald-400', glow: '#10b981' },
    violet:  { bg: 'bg-violet-500/10',  ring: 'ring-violet-500/20',  icon: 'text-violet-400',  glow: '#8b5cf6' },
    orange:  { bg: 'bg-orange-500/10',  ring: 'ring-orange-500/20',  icon: 'text-orange-400',  glow: '#f97316' },
    blue:    { bg: 'bg-sky-500/10',    ring: 'ring-sky-500/20',    icon: 'text-sky-400',    glow: '#3b82f6' },
    rose:    { bg: 'bg-rose-500/10',    ring: 'ring-rose-500/20',    icon: 'text-rose-400',    glow: '#f43f5e' },
    amber:   { bg: 'bg-amber-500/10',   ring: 'ring-amber-500/20',   icon: 'text-amber-400',   glow: '#f59e0b' },
    teal:    { bg: 'bg-teal-500/10',    ring: 'ring-teal-500/20',    icon: 'text-teal-400',    glow: '#14b8a6' },
    pink:    { bg: 'bg-pink-500/10',    ring: 'ring-pink-500/20',    icon: 'text-pink-400',    glow: '#ec4899' },
    slate:   { bg: 'bg-slate-500/10',   ring: 'ring-slate-500/20',   icon: 'text-slate-400',   glow: '#64748b' },
    cyan:    { bg: 'bg-cyan-500/10',    ring: 'ring-cyan-500/20',    icon: 'text-cyan-400',    glow: '#06b6d4' },
};

const roles = [
    { icon: GraduationCap, label: 'Guru',           desc: 'Jurnal, presensi, nilai, media, kuis',     grad: 'from-sky-500/20 to-sky-600/10',  ring: 'ring-sky-500/20',  icon2: 'text-sky-400' },
    { icon: Building2,     label: 'Kepala Sekolah', desc: 'Monitor, evaluasi, TTE, catatan kepsek',   grad: 'from-violet-500/20 to-violet-600/10',  ring: 'ring-violet-500/20',  icon2: 'text-violet-400' },
    { icon: UserCog,       label: 'Tata Usaha',     desc: 'Surat masuk/keluar, jurnal karyawan',      grad: 'from-sky-500/20 to-sky-600/10',      ring: 'ring-sky-500/20',    icon2: 'text-sky-400' },
    { icon: Users,         label: 'Wakasek',        desc: 'Laporan, jadwal, rekap jurnal bawahan',    grad: 'from-emerald-500/20 to-emerald-600/10', ring: 'ring-emerald-500/20', icon2: 'text-emerald-400' },
    { icon: ClipboardList, label: 'Guru Piket',     desc: 'Presensi kehadiran harian siswa',          grad: 'from-amber-500/20 to-amber-600/10',    ring: 'ring-amber-500/20',   icon2: 'text-amber-400' },
    { icon: BookText,      label: 'Pokja',          desc: 'Jurnal pokja & riwayat kegiatan',          grad: 'from-rose-500/20 to-rose-600/10',      ring: 'ring-rose-500/20',    icon2: 'text-rose-400' },
];

const stats = [
    { val: '13+', label: 'Peran Pengguna',   icon: Users },
    { val: '12+', label: 'Modul Fitur',      icon: Zap },
    { val: '100%', label: 'Berbasis Web',    icon: Globe },
    { val: '24/7', label: 'Akses Kapan Saja', icon: Clock },
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#0b0f1a] text-gray-100 overflow-x-hidden">
            <Head title="APIKMAS DJurnal — Sistem Informasi Manajemen Sekolah" />
            <AnimStyles />

            {/* ── Navbar ── */}
            <header className="sticky top-0 z-50 border-b border-white/5"
                style={{ background: 'rgba(11,15,26,0.85)', backdropFilter: 'blur(20px)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center">
                            <img src="/logodjurnal.svg" alt="DJurnal" className="h-5 w-5 object-contain" />
                        </div>
                        <span className="font-bold text-white text-sm sm:text-base tracking-tight">APIKMAS DJurnal</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="/jadwal-publik"
                            className="hidden sm:inline-flex text-xs font-medium text-white/50 hover:text-white/80 transition-colors">
                            Jadwal Publik
                        </a>
                        <Link href="/login"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all glow-btn"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)' }}>
                            Masuk <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* ══ HERO ══ */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden"
                style={{ background: 'linear-gradient(150deg, #0b0f1a 0%, #0f0c29 20%, #1a0533 40%, #0b1d3a 70%, #0b0f1a 100%)' }}>

                {/* Animated blobs */}
                <div className="blob1 absolute top-[-100px] left-[-100px] h-[500px] w-[500px] rounded-full opacity-30 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #4338ca 0%, transparent 70%)' }} />
                <div className="blob2 absolute bottom-[-80px] right-[-80px] h-[450px] w-[450px] rounded-full opacity-20 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
                <div className="blob3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 60%)' }} />

                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                {/* Glow lines */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 w-full">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                        {/* ── Left: Content ── */}
                        <div className="flex-1 text-center lg:text-left">

                            {/* Badge */}
                            <div className="fade-up-1 inline-flex items-center gap-2.5 bg-white/5 border border-white/10 text-sky-300 text-xs font-medium px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                </span>
                                Sistem Informasi Sekolah Terintegrasi
                            </div>

                            {/* Heading */}
                            <h1 className="fade-up-2 text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold leading-[1.1] tracking-tight mb-6">
                                <span className="text-white">Kelola Sekolah</span>
                                <br />
                                <span className="shimmer-text">Lebih Cerdas</span>
                                <br />
                                <span className="text-white">& Efisien</span>
                            </h1>

                            {/* Desc */}
                            <p className="fade-up-3 text-white/50 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                                Platform digital untuk manajemen akademik, presensi, jurnal mengajar, persuratan, dan evaluasi kinerja — seluruh civitas sekolah dalam satu aplikasi.
                            </p>

                            {/* Feature pills */}
                            <div className="fade-up-3 flex flex-wrap gap-2 justify-center lg:justify-start mb-10">
                                {['Jurnal Digital', 'TTE Surat', 'KPI Guru', 'Presensi', 'Multi-Peran'].map((t) => (
                                    <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                                        <CheckCircle className="h-3 w-3 text-sky-400" /> {t}
                                    </span>
                                ))}
                            </div>

                            {/* CTAs */}
                            <div className="fade-up-4 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                                <Link href="/login"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-all glow-btn"
                                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
                                    Masuk ke Aplikasi <ArrowRight className="h-4 w-4" />
                                </Link>
                                <a href="/jadwal-publik"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-sm text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all">
                                    <Clock className="h-4 w-4" /> Jadwal Publik
                                </a>
                            </div>

                            {/* Trust bar */}
                            <div className="fade-up-4 mt-10 flex items-center gap-4 justify-center lg:justify-start">
                                <div className="flex -space-x-2">
                                    {['#4f46e5','#7c3aed','#0284c7','#059669'].map((c, i) => (
                                        <div key={i} className="h-7 w-7 rounded-full border-2 border-[#0b0f1a] flex items-center justify-center text-[10px] font-bold text-white"
                                            style={{ background: c }} >
                                            {['G','K','T','W'][i]}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-white/40 text-xs">Digunakan oleh guru, kepala sekolah, tata usaha &amp; lebih</p>
                            </div>
                        </div>

                        {/* ── Right: App Preview ── */}
                        <div className="flex-1 relative w-full max-w-lg mx-auto lg:mx-0 h-[420px] lg:h-[500px] hidden sm:block">
                            {/* Main card */}
                            <div className="absolute top-8 left-0 right-4">
                                <PreviewJurnal />
                            </div>
                            {/* Stats card */}
                            <div className="absolute bottom-8 right-0">
                                <PreviewStats />
                            </div>
                            {/* TTE card */}
                            <div className="absolute top-1/2 -translate-y-1/2 right-0 lg:-right-4">
                                <PreviewTte />
                            </div>
                            {/* Glow behind cards */}
                            <div className="absolute inset-0 pointer-events-none"
                                style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
                        </div>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, transparent, #0b0f1a)' }} />
            </section>

            {/* ══ STATS BAND ══ */}
            <section className="py-10 border-y border-white/5"
                style={{ background: 'linear-gradient(90deg, #0f0c29 0%, #1a0533 50%, #0b1d3a 100%)' }}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {stats.map(({ val, label, icon: Icon }) => (
                        <div key={label} className="text-center group">
                            <div className="inline-flex h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 items-center justify-center mb-3 mx-auto group-hover:bg-sky-500/20 transition-colors">
                                <Icon className="h-4.5 w-4.5 text-sky-400" />
                            </div>
                            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{val}</p>
                            <p className="text-xs text-white/40 mt-1 font-medium">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ FEATURES ══ */}
            <section className="py-24 sm:py-32" style={{ background: '#0b0f1a' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
                            <Zap className="h-3.5 w-3.5" /> Fitur Lengkap
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                            Semua yang Sekolah Butuhkan
                        </h2>
                        <p className="text-white/40 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                            Dari jurnal harian guru hingga tanda tangan elektronik kepala sekolah — semuanya dalam satu aplikasi terpadu.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map(({ icon: Icon, title, desc, color }) => {
                            const c = COLOR[color] ?? COLOR.indigo;
                            return (
                                <div key={title}
                                    className={`group relative rounded-2xl p-6 border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 overflow-hidden`}>
                                    {/* Hover glow */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                        style={{ background: `radial-gradient(circle at 30% 30%, ${c.glow}15 0%, transparent 60%)` }} />
                                    <div className={`relative inline-flex h-11 w-11 rounded-xl ${c.bg} ring-1 ${c.ring} items-center justify-center mb-4`}>
                                        <Icon className={`h-5 w-5 ${c.icon}`} />
                                    </div>
                                    <h3 className="relative font-bold text-white text-base mb-2">{title}</h3>
                                    <p className="relative text-sm text-white/40 leading-relaxed">{desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ══ ROLES ══ */}
            <section className="py-24 sm:py-32 border-t border-white/5"
                style={{ background: 'linear-gradient(180deg, #0d1117 0%, #0b0f1a 100%)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
                            <Users className="h-3.5 w-3.5" /> Multi-Peran
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                            Untuk Seluruh Civitas Sekolah
                        </h2>
                        <p className="text-white/40 text-sm sm:text-base max-w-xl mx-auto">
                            Setiap pengguna mendapat tampilan dan akses sesuai perannya — tidak perlu akun terpisah.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roles.map(({ icon: Icon, label, desc, grad, ring, icon2 }) => (
                            <div key={label}
                                className={`group flex items-center gap-4 rounded-2xl p-5 bg-gradient-to-br ${grad} ring-1 ${ring} hover:ring-2 transition-all duration-200`}>
                                <div className={`shrink-0 h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${icon2}`} />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{label}</p>
                                    <p className="text-xs text-white/40 mt-0.5 leading-snug">{desc}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ CTA / KONTAK ══ */}
            <section className="py-24 sm:py-32 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #3730a3 60%, #2563eb 100%)' }}>
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
                <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-15 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }} />
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-sky-500/15 border border-sky-500/25 text-sky-300 text-xs font-semibold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
                            <MessageCircle className="h-3.5 w-3.5" /> Hubungi Kami
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                            Tertarik Menggunakan<br className="hidden sm:block" /> APIKMAS DJurnal?
                        </h2>
                        <p className="text-sky-200/60 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                            Hubungi kami untuk informasi pemesanan, demo aplikasi, dan konsultasi kebutuhan sekolah Anda. Kami siap membantu.
                        </p>
                    </div>

                    {/* Main card */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-black/30 overflow-hidden backdrop-blur-sm">
                        <div className="flex flex-col lg:flex-row">

                            {/* Left: action */}
                            <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center">
                                <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-3">Mulai Sekarang</p>
                                <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-3 leading-snug">
                                    Dapatkan Demo &amp;<br /> Konsultasi Gratis
                                </h3>
                                <p className="text-sm text-white/40 leading-relaxed mb-8">
                                    Tim kami siap menjelaskan fitur, membantu setup, dan menyesuaikan kebutuhan sekolah Anda.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <a href="https://wa.me/6285749850763"
                                        target="_blank" rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02] shadow-lg shadow-green-500/20"
                                        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.12 1.533 5.845L.057 23.571a.75.75 0 0 0 .92.92l5.726-1.476A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22.5c-1.98 0-3.83-.544-5.41-1.49l-.387-.232-4.02 1.036 1.036-3.91-.254-.4A10.46 10.46 0 0 1 1.5 12C1.5 6.21 6.21 1.5 12 1.5S22.5 6.21 22.5 12 17.79 22.5 12 22.5z"/>
                                        </svg>
                                        Chat WhatsApp
                                    </a>
                                    <a href="mailto:smkkurikulum3@gmail.com"
                                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-white/10 border border-white/15 hover:bg-white/20 transition-all hover:scale-[1.02]">
                                        <Mail className="h-4 w-4" />
                                        Kirim Email
                                    </a>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden lg:block w-px bg-white/8 my-8" />
                            <div className="lg:hidden h-px bg-white/8 mx-8" />

                            {/* Right: info cards */}
                            <div className="flex-1 p-8 sm:p-10 flex flex-col gap-4 justify-center">
                                {[
                                    { icon: MessageCircle, label: 'WhatsApp',    val: '+62 857-4985-0763',        sub: 'Respon cepat via chat',     href: 'https://wa.me/6285749850763' },
                                    { icon: Mail,          label: 'Email',        val: 'smkkurikulum3@gmail.com', sub: 'Untuk pertanyaan formal',    href: 'mailto:smkkurikulum3@gmail.com' },
                                    { icon: Clock,         label: 'Jam Layanan',  val: 'Senin – Sabtu',           sub: '08.00 – 16.00 WIB',         href: null },
                                ].map(({ icon: Icon, label, val, sub, href }) => {
                                    const inner = (
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                                                <Icon className="h-4.5 w-4.5 text-sky-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-semibold text-sky-400 uppercase tracking-widest mb-0.5">{label}</p>
                                                <p className="text-sm font-bold text-white truncate">{val}</p>
                                                <p className="text-xs text-white/30 mt-0.5">{sub}</p>
                                            </div>
                                            {href && <ArrowRight className="h-4 w-4 text-white/20 shrink-0" />}
                                        </div>
                                    );
                                    const cls = 'block rounded-2xl px-4 py-4 border bg-white/4 border-white/8 hover:bg-sky-500/10 hover:border-sky-500/20 transition-all';
                                    return href
                                        ? <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={cls}>{inner}</a>
                                        : <div key={label} className={cls}>{inner}</div>;
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ FOOTER ══ */}
            <footer className="border-t border-white/5 py-8" style={{ background: '#070a10' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                            <img src="/logodjurnal.svg" alt="DJurnal" className="h-4 w-4 opacity-80 object-contain" />
                        </div>
                        <span className="text-white/30 text-sm font-medium">APIKMAS DJurnal</span>
                    </div>
                    <p className="text-white/20 text-xs text-center">
                        © {new Date().getFullYear()} APIKMAS DJurnal · Sistem Informasi Manajemen Sekolah
                    </p>
                    <div className="flex items-center gap-5 text-xs text-white/30">
                        <a href="/jadwal-publik" className="hover:text-white/60 transition-colors">Jadwal Publik</a>
                        <a href="/buku-tamu" className="hover:text-white/60 transition-colors">Buku Tamu</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
