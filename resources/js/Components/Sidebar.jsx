import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap, School, Calendar,
    ClipboardList, ClipboardCheck, FileText, BarChart3, Video, Presentation, HelpCircle,
    BookMarked, Upload, Star, MessageSquare, X,
    Clock, PieChart, ShieldCheck, Settings, BookCheck, BookText,
    UserCog, Megaphone, MailOpen, Send, FolderUp, Layers, History, CalendarX, Tag,
    ChevronDown, Lock, NotebookPen, Database, MoreHorizontal, Inbox, Crown, Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const ROLE_LABELS = {
    guru:                'Sebagai Guru',
    kepala_sekolah:      'Kepala Sekolah',
    wakasek_kurikulum:   'Wakasek Kurikulum',
    wakasek_kesiswaan:   'Wakasek Kesiswaan',
    wakasek_sarpras:     'Wakasek Sarpras',
    wakasek_humas:       'Waka Humas',
    kepala_tatausaha:    'Kepala Tata Usaha',
    tatausaha:           'Tata Usaha',
    guru_piket:          'Guru Piket',
    pokja_kurikulum:     'Pokja Kurikulum',
    pokja_kesiswaan:     'Pokja Kesiswaan',
    pokja_sarpras:       'Pokja Sarpras',
    pokja_humas:         'Pokja Humas',
    bendahara_sekolah:           'Bendahara Sekolah',
    bimbingan_konseling:         'Bimbingan Konseling',
    tim_penjamin_mutu:           'Tim Penjamin Mutu',
    kepala_konsentrasi_keahlian: 'Kepala Konsentrasi Keahlian',
};

/* ─── Icon untuk setiap section group ──────────────────────────── */
const GROUP_ICONS = {
    'Utama':                LayoutDashboard,
    'Akademik':             School,
    'Laporan':              BarChart3,
    'Rekap Jurnal':         History,
    'Piket':                ShieldCheck,
    'Administrasi Guru':    BookOpen,
    'Media Pembelajaran':   Video,
    'Asesmen & Kuis':       HelpCircle,
    'Jurnal Pimpinan':      BookCheck,
    'Evaluasi':             Star,
    'Broadcast & Sistem':   Megaphone,
    'Pokja':                Layers,
    'Tata Usaha':           UserCog,
    'Masukan & Laporan':   MessageSquare,
};

const menuGroups = [
    {
        label: 'Utama',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: null },
        ],
    },
    {
        label: 'Akademik',
        roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'kepala_tatausaha'],
        items: [
            { label: 'Pengguna',           href: '/admin/users',              icon: Users,         roles: ['super_admin'] },
            { label: 'Tahun Ajaran',       href: '/admin/tahun-ajaran',       icon: Calendar,      roles: ['super_admin'] },
            { label: 'Kelas & Jurusan',    href: '/admin/kelas-jurusan',      icon: School,        roles: ['super_admin'] },
            { label: 'Rombel',             href: '/admin/rombel',             icon: BookOpen,      roles: ['super_admin'] },
            { label: 'Mata Pelajaran',     href: '/admin/mata-pelajaran',     icon: BookMarked,    roles: ['super_admin'] },
            { label: 'Guru',               href: '/admin/guru',               icon: GraduationCap, roles: ['super_admin', 'wakasek_kurikulum', 'kepala_tatausaha', 'tatausaha'] },
            { label: 'Tata Usaha',         href: '/admin/tatausaha',          icon: UserCog,       roles: ['super_admin', 'kepala_tatausaha', 'tatausaha'] },
            { label: 'Siswa',              href: '/admin/siswa',              icon: Users,         roles: ['super_admin', 'wakasek_kesiswaan', 'kepala_tatausaha', 'tatausaha'] },
{ label: 'Pembelajaran',       href: '/admin/pembelajaran',       icon: BookOpen,      roles: ['super_admin', 'wakasek_kurikulum'] },
            { label: 'Jadwal Pelajaran',   href: '/admin/jadwal',             icon: Clock,         roles: ['super_admin', 'wakasek_kurikulum', 'kepala_sekolah'] },
            { label: 'Hari Libur',         href: '/admin/hari-libur',         icon: CalendarX,     roles: ['super_admin', 'wakasek_kurikulum'] },
            { label: 'Pengumpulan',        href: '/admin/pengumpulan',        icon: FolderUp,      roles: ['super_admin', 'wakasek_kurikulum'] },
            { label: 'Pengaturan Sekolah', href: '/admin/pengaturan-sekolah', icon: Settings,      roles: ['super_admin'] },
            { label: 'Pengaturan Surat',   href: '/admin/pengaturan-surat',   icon: FileText,      roles: ['super_admin'] },
        ],
    },
    {
        label: 'Laporan',
        roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'kepala_tatausaha'],
        items: [
            { label: 'Kehadiran Siswa',       href: '/admin/laporan/kehadiran-siswa',            icon: PieChart,  roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan'] },
            { label: 'Kehadiran Guru',        href: '/admin/laporan/kehadiran-guru',             icon: BarChart3, roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'] },
            { label: 'Kehadiran Manajemen',   href: '/admin/laporan/kehadiran-manajemen',        icon: Crown,     roles: ['super_admin', 'kepala_sekolah'] },
            { label: 'Keaktifan Jurnal Guru', href: '/admin/laporan/keaktifan-jurnal',           icon: BookCheck, roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'] },
            { label: 'Kehadiran TU',          href: '/admin/laporan/kehadiran-tatausaha',        icon: Users,     roles: ['super_admin', 'kepala_sekolah', 'kepala_tatausaha'] },
            { label: 'Keaktifan Jurnal TU',   href: '/admin/laporan/keaktifan-jurnal-tatausaha', icon: BookText,  roles: ['super_admin', 'kepala_sekolah', 'kepala_tatausaha'] },
        ],
    },
    {
        label: 'Rekap Jurnal',
        roles: ['super_admin', 'kepala_sekolah'],
        items: [
            { label: 'Jurnal Tata Usaha',     href: '/admin/riwayat-jurnal/tatausaha',       icon: BookText },
            { label: 'Jurnal Pokja',          href: '/admin/riwayat-jurnal/pokja',           icon: BookText },
            { label: 'Jurnal Wakasek',        href: '/admin/riwayat-jurnal/wakasek',         icon: BookText },
            { label: 'Jurnal Kepala TU',      href: '/admin/riwayat-jurnal/kepala-tu',       icon: BookText },
            { label: 'Jurnal Kepala Sekolah', href: '/admin/riwayat-jurnal/kepala-sekolah',  icon: BookText },
            { label: 'Jurnal Kepala KK',      href: '/admin/riwayat-jurnal/kepala-kk',       icon: BookText },
        ],
    },
    {
        label: 'Piket',
        roles: ['guru_piket', 'super_admin', 'kepala_sekolah', 'wakasek_kesiswaan', 'kepala_tatausaha'],
        roleSection: 'guru_piket',
        items: [
            { label: 'Kehadiran Mengajar',  href: '/piket',           icon: ClipboardList },
            { label: 'Kehadiran Manajemen', href: '/piket/manajemen', icon: Crown },
            { label: 'Kehadiran TU',        href: '/piket/tatausaha', icon: UserCog },
            { label: 'Buku Tamu',           href: '/admin/buku-tamu', icon: NotebookPen,
              roles: ['super_admin', 'kepala_sekolah', 'wakasek_kesiswaan', 'kepala_tatausaha', 'tatausaha'] },
        ],
    },
    {
        label: 'Administrasi Guru',
        roles: ['guru', 'super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan'],
        roleSection: 'guru',
        items: [
            { label: 'Jadwal Saya',          href: '/guru/jadwal-saya',          icon: Calendar,       roles: ['guru'] },
            { label: 'Capaian Pembelajaran', href: '/guru/capaian-pembelajaran', icon: GraduationCap,  roles: ['guru'] },
            { label: 'Jurnal Mengajar',      href: '/guru/jurnal',               icon: FileText,       roles: ['guru'] },
            { label: 'Riwayat Jurnal',       href: '/guru/jurnal/riwayat',       icon: History,        roles: ['guru'] },
            { label: 'Presensi Siswa',       href: '/guru/absensi',              icon: ClipboardList },
            { label: 'Presensi Harian (BK)', href: '/guru/presensi-harian',      icon: ClipboardCheck, roles: ['guru', 'super_admin', 'kepala_sekolah', 'wakasek_kesiswaan'], guruBkOnly: true },
            { label: 'Rekap Presensi Harian',href: '/guru/presensi-harian/rekap',icon: BarChart3,      roles: ['guru', 'super_admin', 'kepala_sekolah', 'wakasek_kesiswaan'], guruBkOnly: true },
            { label: 'Pengumpulan',          href: '/guru/pengumpulan',          icon: FolderUp,       roles: ['guru'] },
            { label: 'Jurnal Mengajar Guru', href: '/admin/jurnal-mengajar',     icon: FileText,       roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'] },
            { label: 'Input Nilai',          href: '/guru/nilai',                icon: BarChart3 },
            { label: 'Laporan KPI',          href: '/guru/kpi',                  icon: Star,           roles: ['guru'] },
            { label: 'Catatan Kepsek',       href: '/guru/catatan-kepsek',       icon: MessageSquare,  roles: ['guru'], excludeRoles: ['kepala_sekolah', 'super_admin'] },
        ],
    },
    {
        label: 'Media Pembelajaran',
        roles: ['guru', 'super_admin', 'kepala_sekolah', 'wakasek_kurikulum'],
        roleSection: 'guru',
        collapsible: true,
        items: [
            { label: 'Video Pembelajaran', href: '/guru/video-pembelajaran', icon: Video },
            { label: 'Presentasi',         href: '/guru/presentasi',         icon: Presentation },
            { label: 'Modul Ajar',         href: '/guru/modul-ajar',         icon: BookMarked },
            { label: 'Jobsheet',           href: '/guru/jobsheet',           icon: BookOpen },
        ],
    },
    {
        label: 'Asesmen & Kuis',
        roles: ['guru', 'super_admin', 'kepala_sekolah', 'wakasek_kurikulum'],
        roleSection: 'guru',
        items: [
            { label: 'Kuis & Asesmen', href: '/guru/kuis-asesmen', icon: HelpCircle },
        ],
    },
    {
        label: 'Jurnal Pimpinan',
        roles: ['kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'wakasek_sarpras', 'wakasek_humas', 'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu', 'kepala_konsentrasi_keahlian', 'super_admin'],
        roleSection: ['kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'wakasek_sarpras', 'wakasek_humas', 'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu', 'kepala_konsentrasi_keahlian'],
        items: [
            { label: 'Jurnal Harian',  href: '/pimpinan/jurnal',         icon: BookText,
              roles: ['kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'wakasek_sarpras', 'wakasek_humas', 'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu', 'kepala_konsentrasi_keahlian'] },
            { label: 'Riwayat Jurnal', href: '/pimpinan/jurnal/riwayat', icon: History,
              roles: ['kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'wakasek_sarpras', 'wakasek_humas', 'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu', 'kepala_konsentrasi_keahlian'] },
            { label: 'Jurnal Tim',     href: '/pimpinan/jurnal/bawahan', icon: Users,
              roles: ['wakasek_kurikulum', 'wakasek_kesiswaan', 'wakasek_sarpras', 'wakasek_humas', 'kepala_tatausaha'] },
        ],
    },
    {
        label: 'Evaluasi',
        roles: ['kepala_sekolah', 'super_admin', 'kepala_tatausaha'],
        roleSection: ['kepala_sekolah', 'kepala_tatausaha'],
        items: [
            { label: 'KPI Guru',       href: '/admin/kpi',            icon: Star,          roles: ['kepala_sekolah', 'super_admin'] },
            { label: 'KPI Tata Usaha', href: '/admin/kpi-tatausaha',  icon: Star,          roles: ['kepala_sekolah', 'super_admin', 'kepala_tatausaha'] },
            { label: 'Ranking KPI',    href: '/admin/kpi/ranking',    icon: Trophy,        roles: ['kepala_sekolah', 'super_admin'] },
            { label: 'Catatan Kepsek', href: '/admin/catatan-kepsek', icon: MessageSquare, roles: ['kepala_sekolah', 'super_admin'] },
        ],
    },
    {
        label: 'Broadcast & Sistem',
        roles: ['super_admin'],
        roleSection: 'kepala_sekolah',
        collapsible: false,
        items: [
            { label: 'Pesan Popup',      href: '/admin/pesan-popup',  icon: Megaphone,    roles: ['super_admin'] },
            { label: 'Info Menu',        href: '/admin/menu-badge',   icon: Tag,          roles: ['super_admin'] },
            { label: 'RBAC & Akses',     href: '/admin/rbac',         icon: ShieldCheck,  roles: ['super_admin'] },
            { label: 'Masukan & Laporan',href: '/admin/masukan',      icon: Inbox,        roles: ['super_admin'] },
            { label: 'Pemeliharaan',     href: '/admin/pemeliharaan', icon: Settings,     roles: ['super_admin'] },
            { label: 'Backup & Restore', href: '/admin/backup',       icon: Database,     roles: ['super_admin'] },
        ],
    },
    {
        label: 'Pokja',
        roles: ['pokja_kurikulum', 'pokja_kesiswaan', 'pokja_sarpras', 'pokja_humas', 'bimbingan_konseling'],
        roleSection: ['pokja_kurikulum', 'pokja_kesiswaan', 'pokja_sarpras', 'pokja_humas', 'bimbingan_konseling'],
        items: [
            { label: 'Jurnal Pokja',   href: '/pokja/jurnal',         icon: BookText,
              roles: ['pokja_kurikulum', 'pokja_kesiswaan', 'pokja_sarpras', 'pokja_humas', 'bimbingan_konseling'] },
            { label: 'Riwayat Jurnal', href: '/pokja/jurnal/riwayat', icon: History,
              roles: ['pokja_kurikulum', 'pokja_kesiswaan', 'pokja_sarpras', 'pokja_humas', 'bimbingan_konseling'] },
        ],
    },
    {
        label: 'Tata Usaha',
        roles: ['tatausaha', 'kepala_tatausaha', 'kepala_sekolah', 'super_admin'],
        roleSection: ['kepala_tatausaha', 'tatausaha'],
        items: [
            { label: 'Jurnal Karyawan',  href: '/tatausaha/jurnal',         icon: BookText,      roles: ['tatausaha'] },
            { label: 'Riwayat Jurnal',   href: '/tatausaha/jurnal/riwayat', icon: History,       roles: ['tatausaha'] },
            { label: 'Laporan KPI',      href: '/tatausaha/kpi',            icon: Star,          roles: ['tatausaha'] },
            { label: 'Buat Surat',       href: '/tatausaha/buat-surat',     icon: FileText,      roles: ['tatausaha', 'kepala_tatausaha'],                                      tuSuratOnly: true },
            { label: 'Surat Masuk',      href: '/tatausaha/surat-masuk',    icon: MailOpen,      roles: ['tatausaha', 'kepala_tatausaha'],                                      tuSuratOnly: true },
            { label: 'Surat Keluar',     href: '/tatausaha/surat-keluar',   icon: Send,          roles: ['tatausaha', 'kepala_tatausaha'],                                      tuSuratOnly: true },
            { label: 'TTE Surat',        href: '/tatausaha/tte',            icon: ShieldCheck,   roles: ['tatausaha', 'kepala_tatausaha', 'kepala_sekolah', 'super_admin'],     tuSuratOnly: true },
            { label: 'Catatan Kepsek',   href: '/tatausaha/catatan-kepsek', icon: MessageSquare, roles: ['tatausaha'] },
        ],
    },
    {
        label: 'Masukan & Laporan',
        items: [
            { label: 'Masukan & Laporan', href: '/masukan', icon: MessageSquare, roles: null, excludeRoles: ['super_admin'] },
        ],
    },
];

export const SIDEBAR_MENU_ITEMS = menuGroups.flatMap(g =>
    g.items
        .filter(i => !i.external && i.href)
        .map(i => ({ label: i.label, href: i.href, section: g.label }))
);

const BADGE_STYLES = {
    beta:         'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    maintenance:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    pengembangan: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
};
const BADGE_LABELS = {
    beta:         'Beta',
    maintenance:  'Maintenance',
    pengembangan: 'Dev',
};

const BLOCKED_BADGES = new Set(['maintenance', 'pengembangan']);

function SidebarItem({ item, active, badge, onlineCount, masukanCount }) {
    const Icon    = item.icon;
    const blocked = badge && BLOCKED_BADGES.has(badge);

    const cls = cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
        blocked
            ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
            : active
                ? 'bg-sky-600 dark:bg-sky-500 text-white shadow-md shadow-sky-600/25 dark:shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-700 dark:hover:text-sky-300',
    );

    const inner = (
        <>
            <Icon className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                blocked
                    ? 'text-slate-400 dark:text-slate-600'
                    : active
                        ? 'text-white/80'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-sky-400',
            )} />
            <span className="flex-1">{item.label}</span>
            {onlineCount > 0 && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse" />
                    {onlineCount}
                </span>
            )}
            {masukanCount > 0 && (
                <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 leading-none">
                    {masukanCount > 99 ? '99+' : masukanCount}
                </span>
            )}
            {badge && (
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none', BADGE_STYLES[badge])}>
                    {blocked ? <Lock className="h-2.5 w-2.5 inline" /> : null}
                    {' '}{BADGE_LABELS[badge]}
                </span>
            )}
        </>
    );

    if (blocked) {
        return <div className={cls} title="Menu ini sedang tidak tersedia">{inner}</div>;
    }
    if (item.external) {
        return <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
    }
    return <Link href={item.href} className={cls}>{inner}</Link>;
}

export default function Sidebar({ open, onClose }) {
    const { url, props } = usePage();
    const user       = props.auth?.user;
    const roles        = user?.roles ?? [];
    const isGuruBk     = user?.is_guru_bk ?? false;
    const isTuSurat    = user?.is_tu_surat ?? false;
    const isWaliKelas  = !!(user?.wali_kelas_rombel_id);
    const menuBadges   = props.menu_badges ?? {};
    const onlineCount  = props.online_count ?? 0;
    const masukanCount = props.notifikasi?.masukan ?? 0;

    const [collapsedGroups, setCollapsedGroups] = useState({});
    const toggleGroup  = (label) => setCollapsedGroups((p) => ({ ...p, [label]: !p[label] }));
    const isGroupOpen  = (group) => {
        const hasActive = group.items.some((i) => url.split('?')[0] === i.href);
        if (collapsedGroups[group.label] !== undefined) return !collapsedGroups[group.label];
        return group.collapsible ? hasActive : true;
    };

    const isActive  = (href) => url.split('?')[0] === href;
    const hasAccess = (itemRoles, excludeRoles, guruBkOnly, tuSuratOnly) => {
        if (excludeRoles && roles.some((r) => excludeRoles.includes(r))) return false;
        // guruBkOnly: guru biasa tanpa jabatan BK dan bukan wali kelas tidak bisa melihat item ini
        if (guruBkOnly && roles.includes('guru') && !isGuruBk && !isWaliKelas &&
            !roles.some((r) => ['super_admin', 'kepala_sekolah', 'wakasek_kesiswaan'].includes(r))) {
            return false;
        }
        // tuSuratOnly: hanya jabatan Tatausaha yang bisa akses surat, bukan toolman/kebersihan/dll
        if (tuSuratOnly && roles.includes('tatausaha') && !isTuSurat &&
            !roles.some((r) => ['super_admin', 'kepala_sekolah', 'kepala_tatausaha'].includes(r))) {
            return false;
        }
        return !itemRoles || roles.some((r) => itemRoles.includes(r));
    };

    const contextualRoles = roles.filter((r) => r in ROLE_LABELS);
    const isMultiRole     = contextualRoles.length > 1;

    const getSectionLabel = (roleSection) => {
        if (!roleSection || !isMultiRole) return null;
        const arr = Array.isArray(roleSection) ? roleSection : [roleSection];
        const hit = arr.find((r) => roles.includes(r));
        return hit ? ROLE_LABELS[hit] : null;
    };

    const groups = (() => {
        let prevLabel = null;
        return menuGroups
            .map((group) => {
                if (group.roles && !hasAccess(group.roles)) return null;
                const visibleItems = group.items.filter((i) => hasAccess(i.roles, i.excludeRoles, i.guruBkOnly, i.tuSuratOnly));
                if (visibleItems.length === 0) return null;
                const divLabel    = getSectionLabel(group.roleSection);
                const showDivider = divLabel !== null && divLabel !== prevLabel;
                if (divLabel) prevLabel = divLabel;
                return { group, visibleItems, showDivider, divLabel };
            })
            .filter(Boolean);
    })();

    const primaryRoleLabel = contextualRoles.length > 0
        ? contextualRoles.map((r) => ROLE_LABELS[r] ?? r.replace('_', ' ')).join(' · ')
        : (roles[0]?.replace(/_/g, ' ') ?? '');

    return (
        <>
            {open && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />}

            <aside className={cn(
                'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-100 dark:border-gray-800 transition-transform duration-300',
                'bg-white dark:bg-gray-900',
                open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            )}>
                {/* ── Logo header ── */}
                <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-sky-600 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            <img src="/logodjurnal.svg" alt="DJurnal" className="h-6 w-6 object-contain" />
                        </div>
                        <div>
                            <span className="block font-extrabold text-gray-900 dark:text-white text-sm tracking-tight leading-none">APIKMAS</span>
                            <span className="block text-[10px] font-semibold text-sky-600 dark:text-sky-400 tracking-widest uppercase leading-tight mt-px">DJurnal</span>
                        </div>
                    </Link>
                    <button onClick={onClose} className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                    {groups.map(({ group, visibleItems, showDivider, divLabel }) => {
                        const GroupIcon = GROUP_ICONS[group.label];
                        return (
                            <div key={group.label}>
                                {/* Role divider */}
                                {showDivider && (
                                    <div className="flex items-center gap-2 px-1 mb-3 -mt-1">
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 px-1 whitespace-nowrap">
                                            {divLabel}
                                        </span>
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                )}

                                {/* Group header button with icon */}
                                <button
                                    onClick={() => toggleGroup(group.label)}
                                    className="w-full mb-1.5 px-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600 hover:text-sky-500 dark:hover:text-sky-500 transition-colors"
                                >
                                    {GroupIcon && (
                                        <GroupIcon className="h-3.5 w-3.5 shrink-0 text-sky-400/70 dark:text-sky-500/50" />
                                    )}
                                    <span className="flex-1 text-left">{group.label}</span>
                                    <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', isGroupOpen(group) ? 'rotate-180' : '')} />
                                </button>

                                {isGroupOpen(group) && (
                                    <div className="space-y-0.5">
                                        {visibleItems.map((item) => (
                                            <SidebarItem
                                                key={item.href}
                                                item={item}
                                                active={isActive(item.href)}
                                                badge={menuBadges[item.href]}
                                                onlineCount={item.href === '/admin/users' ? onlineCount : 0}
                                                masukanCount={item.href === '/admin/masukan' ? masukanCount : 0}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* ── User footer ── */}
                <div className="border-t border-gray-100 dark:border-white/6 px-3 py-3">
                    <Link href="/profile" className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors">
                        <img
                            src={user?.avatar_url}
                            alt={user?.name}
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-sky-400 dark:ring-sky-500"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? '?')}&background=0284c7&color=fff&bold=true&size=64`;
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{primaryRoleLabel}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-600" />
                    </Link>
                </div>
            </aside>
        </>
    );
}
