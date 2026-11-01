import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid, Users, BookOpen, GraduationCap, School, Landmark, Calendar,
    ClipboardList, ClipboardCheck, FileText, BarChart3, Video, Presentation, HelpCircle,
    BookMarked, Star, MessageSquare, X,
    Clock, PieChart, ShieldCheck, Settings, BookCheck, BookText,
    UserCog, Megaphone, MailOpen, Send, FolderUp, Layers, History, CalendarX, Tag,
    ChevronDown, ChevronRight, Lock, NotebookPen, Database, Inbox, Crown, Trophy,
    BadgeCheck, FileStack, PanelLeftClose, PanelLeftOpen, UserPen, UserCheck, KeyRound,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/* ─── Role labels ─────────────────────────────────────────────────── */
const ROLE_LABELS = {
    guru:                        'Sebagai Guru',
    kepala_sekolah:              'Kepala Sekolah',
    wakasek_kurikulum:           'Wakasek Kurikulum',
    wakasek_kesiswaan:           'Wakasek Kesiswaan',
    wakasek_sarpras:             'Wakasek Sarpras',
    wakasek_humas:               'Waka Humas',
    kepala_tatausaha:            'Kepala Tata Usaha',
    tatausaha:                   'Tata Usaha',
    guru_piket:                  'Guru Piket',
    pokja_kurikulum:             'Pokja Kurikulum',
    pokja_kesiswaan:             'Pokja Kesiswaan',
    pokja_sarpras:               'Pokja Sarpras',
    pokja_humas:                 'Pokja Humas',
    bendahara_sekolah:           'Bendahara Sekolah',
    bimbingan_konseling:         'Bimbingan Konseling',
    tim_penjamin_mutu:           'Tim Penjamin Mutu',
    kepala_konsentrasi_keahlian: 'Kepala Konsentrasi Keahlian',
    siswa:                       'Siswa',
};

/* ─── Per-group: icon ────────────────────────────────────────────── */
const GROUP_META = {
    'Utama':              { icon: LayoutGrid },
    'Akademik':           { icon: Landmark },
    'Laporan':            { icon: BarChart3 },
    'Rekap Jurnal':       { icon: BookText },
    'Piket':              { icon: ClipboardList },
    'Administrasi Guru':  { icon: UserCheck },
    'Media Pembelajaran': { icon: Video },
    'Asesmen & Kuis':     { icon: HelpCircle },
    'Jurnal Pimpinan':    { icon: Landmark },
    'Evaluasi':           { icon: Star },
    'Broadcast & Sistem': { icon: Megaphone },
    'Pokja':              { icon: Layers },
    'Tata Usaha':         { icon: UserCog },
    'Masukan & Laporan':  { icon: MessageSquare },
    'Portal Siswa':       { icon: BookOpen },
    'Siswa':              { icon: Users },
};

/* ─── Menu data ───────────────────────────────────────────────────── */
const menuGroups = [
    {
        label: 'Utama',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid, roles: null },
        ],
    },
    {
        label: 'Akademik',
        roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'kepala_tatausaha'],
        collapsible: true,
        items: [
            { label: 'Pengguna',           href: '/admin/users',              icon: Users,         roles: ['super_admin'] },
            { label: 'Tahun Ajaran',       href: '/admin/tahun-ajaran',       icon: Calendar,      roles: ['super_admin'] },
            { label: 'Kelas & Jurusan',    href: '/admin/kelas-jurusan',      icon: Landmark,      roles: ['super_admin'] },
            { label: 'Rombel',             href: '/admin/rombel',             icon: BookOpen,      roles: ['super_admin'] },
            { label: 'Mata Pelajaran',     href: '/admin/mata-pelajaran',     icon: BookMarked,    roles: ['super_admin'] },
            { label: 'Guru',               href: '/admin/guru',               icon: UserCheck,     roles: ['super_admin', 'wakasek_kurikulum', 'kepala_tatausaha', 'tatausaha'] },
            { label: 'Tata Usaha',         href: '/admin/tatausaha',          icon: UserCog,       roles: ['super_admin', 'kepala_tatausaha', 'tatausaha'] },
            { label: 'Pembelajaran',       href: '/admin/pembelajaran',       icon: BookOpen,      roles: ['super_admin', 'wakasek_kurikulum'] },
            { label: 'Jadwal Pelajaran',   href: '/admin/jadwal',             icon: Clock,         roles: ['super_admin', 'wakasek_kurikulum', 'kepala_sekolah'] },
            { label: 'Jam Literasi',       href: '/admin/jadwal-literasi',    icon: BookOpen,      roles: ['super_admin', 'wakasek_kurikulum'] },
            { label: 'Hari Libur',         href: '/admin/hari-libur',         icon: CalendarX,     roles: ['super_admin', 'wakasek_kurikulum'] },
            { label: 'Pengumpulan',        href: '/admin/pengumpulan',        icon: FolderUp,      roles: ['super_admin', 'wakasek_kurikulum'] },
            { label: 'Pengaturan Sekolah', href: '/admin/pengaturan-sekolah', icon: Settings,      roles: ['super_admin'] },
            { label: 'Pengaturan Surat',   href: '/admin/pengaturan-surat',   icon: FileText,      roles: ['super_admin'] },
        ],
    },
    {
        label: 'Siswa',
        roles: ['super_admin', 'wakasek_kesiswaan', 'kepala_tatausaha', 'tatausaha'],
        collapsible: true,
        items: [
            { label: 'Data Siswa',      href: '/admin/siswa',                 icon: Users,          roles: ['super_admin', 'wakasek_kesiswaan', 'kepala_tatausaha', 'tatausaha'], tuSuratExclude: true },
            { label: 'Cetak Kartu',     href: '/admin/kartu-siswa',           icon: BadgeCheck,     roles: ['super_admin'] },
            { label: 'Jenis Dokumen',   href: '/admin/dokumen-jenis',         icon: FileStack,      roles: ['super_admin', 'kepala_tatausaha', 'wakasek_kesiswaan'], tuSuratExclude: true },
            { label: 'Laporan Dokumen', href: '/admin/dokumen-jenis/laporan', icon: ClipboardCheck, roles: ['super_admin', 'kepala_tatausaha', 'wakasek_kesiswaan'], tuSuratExclude: true },
            { label: 'Dokumen Siswa',   href: '/tatausaha/dokumen-siswa',     icon: FileStack,      roles: ['tatausaha'], tuSuratOnly: true },
        ],
    },
    {
        label: 'Laporan',
        roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'kepala_tatausaha'],
        collapsible: true,
        items: [
            { label: 'Kehadiran Siswa',       href: '/admin/laporan/kehadiran-siswa',            icon: PieChart,  roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan'] },
            { label: 'Kehadiran Guru',        href: '/admin/laporan/kehadiran-guru',             icon: BarChart3, roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'] },
            { label: 'Kehadiran Manajemen',   href: '/admin/laporan/kehadiran-manajemen',        icon: Crown,     roles: ['super_admin', 'kepala_sekolah'] },
            { label: 'Keaktifan Jurnal Guru', href: '/admin/laporan/keaktifan-jurnal',           icon: BookCheck, roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'] },
            { label: 'Kehadiran TU',          href: '/admin/laporan/kehadiran-tatausaha',        icon: Users,     roles: ['super_admin', 'kepala_sekolah', 'kepala_tatausaha'] },
            { label: 'Keaktifan Jurnal TU',   href: '/admin/laporan/keaktifan-jurnal-tatausaha', icon: BookText,  roles: ['super_admin', 'kepala_sekolah', 'kepala_tatausaha'] },
            { label: 'Progress LMS',          href: '/admin/laporan/lms-progress',               icon: Layers,    roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'] },
        ],
    },
    {
        label: 'Rekap Jurnal',
        roles: ['super_admin', 'kepala_sekolah'],
        collapsible: true,
        items: [
            { label: 'Jurnal Tata Usaha',     href: '/admin/riwayat-jurnal/tatausaha',      icon: BookText },
            { label: 'Jurnal Pokja',          href: '/admin/riwayat-jurnal/pokja',          icon: BookText },
            { label: 'Jurnal Wakasek',        href: '/admin/riwayat-jurnal/wakasek',        icon: BookText },
            { label: 'Jurnal Kepala TU',      href: '/admin/riwayat-jurnal/kepala-tu',      icon: BookText },
            { label: 'Jurnal Kepala Sekolah', href: '/admin/riwayat-jurnal/kepala-sekolah', icon: BookText },
            { label: 'Jurnal Kepala KK',      href: '/admin/riwayat-jurnal/kepala-kk',      icon: BookText },
        ],
    },
    {
        label: 'Piket',
        roles: ['guru_piket', 'super_admin', 'kepala_sekolah', 'wakasek_kesiswaan', 'kepala_tatausaha'],
        roleSection: 'guru_piket',
        collapsible: true,
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
        collapsible: true,
        items: [
            { label: 'Jadwal Saya',            href: '/guru/jadwal-saya',          icon: Calendar,      roles: ['guru'] },
            { label: 'Capaian Pembelajaran',   href: '/guru/capaian-pembelajaran', icon: GraduationCap, roles: ['guru'] },
            { label: 'Jurnal Mengajar',        href: '/guru/jurnal',               icon: FileText,      roles: ['guru'] },
            { label: 'Riwayat Jurnal',         href: '/guru/jurnal/riwayat',       icon: History,       roles: ['guru'] },
            { label: 'Presensi Siswa',         href: '/guru/absensi',              icon: ClipboardList },
            { label: 'Riwayat Presensi Siswa', href: '/guru/absensi/riwayat',      icon: History },
            { label: 'Presensi Harian (BK)',   href: '/guru/presensi-harian',      icon: ClipboardCheck, roles: ['guru', 'super_admin', 'kepala_sekolah', 'wakasek_kesiswaan'], guruBkOnly: true },
            { label: 'Rekap Presensi',         href: '/guru/presensi-harian/rekap',icon: BarChart3,     roles: ['guru', 'super_admin', 'kepala_sekolah', 'wakasek_kesiswaan'], guruBkOnly: true },
            { label: 'Pengumpulan',            href: '/guru/pengumpulan',          icon: FolderUp,      roles: ['guru'] },
            { label: 'LMS',                    href: '/guru/lms',                  icon: Layers,        roles: ['guru'] },
            { label: 'Jurnal Mengajar Guru',   href: '/admin/jurnal-mengajar',     icon: FileText,      roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'] },
            { label: 'Input Nilai',            href: '/guru/nilai',                icon: BarChart3 },
            { label: 'Laporan KPI',            href: '/guru/kpi',                  icon: Star,          roles: ['guru'] },
            { label: 'Catatan Kepsek',         href: '/guru/catatan-kepsek',       icon: MessageSquare, roles: ['guru'], excludeRoles: ['kepala_sekolah', 'super_admin'] },
        ],
    },
    {
        label: 'Portal Siswa',
        roles: ['siswa'],
        roleSection: 'siswa',
        collapsible: true,
        items: [
            { label: 'LMS', href: '/siswa/lms', icon: Layers, roles: ['siswa'] },
            { label: 'Dokumen Saya', href: '/siswa/dokumen', icon: FileStack, roles: ['siswa'] },
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
        collapsible: true,
        items: [
            { label: 'Kuis & Asesmen', href: '/guru/kuis-asesmen', icon: HelpCircle },
        ],
    },
    {
        label: 'Jurnal Pimpinan',
        roles: ['kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'wakasek_sarpras', 'wakasek_humas', 'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu', 'kepala_konsentrasi_keahlian', 'super_admin'],
        roleSection: ['kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'wakasek_sarpras', 'wakasek_humas', 'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu', 'kepala_konsentrasi_keahlian'],
        collapsible: true,
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
        collapsible: true,
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
        collapsible: true,
        items: [
            { label: 'Pesan Popup',       href: '/admin/pesan-popup',  icon: Megaphone,   roles: ['super_admin'] },
            { label: 'Info Menu',         href: '/admin/menu-badge',   icon: Tag,         roles: ['super_admin'] },
            { label: 'RBAC & Akses',      href: '/admin/rbac',         icon: ShieldCheck, roles: ['super_admin'] },
            { label: 'Masukan & Laporan', href: '/admin/masukan',      icon: Inbox,       roles: ['super_admin'] },
            { label: 'Pemeliharaan',      href: '/admin/pemeliharaan', icon: Settings,    roles: ['super_admin'] },
            { label: 'Backup & Restore',  href: '/admin/backup',       icon: Database,    roles: ['super_admin'] },
            { label: 'API Eksternal',     href: '/admin/api-token',    icon: KeyRound,    roles: ['super_admin'] },
        ],
    },
    {
        label: 'Pokja',
        roles: ['pokja_kurikulum', 'pokja_kesiswaan', 'pokja_sarpras', 'pokja_humas', 'bimbingan_konseling'],
        roleSection: ['pokja_kurikulum', 'pokja_kesiswaan', 'pokja_sarpras', 'pokja_humas', 'bimbingan_konseling'],
        collapsible: true,
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
        collapsible: true,
        items: [
            { label: 'Jurnal Karyawan',  href: '/tatausaha/jurnal',         icon: BookText,    roles: ['tatausaha'] },
            { label: 'Riwayat Jurnal',   href: '/tatausaha/jurnal/riwayat', icon: History,     roles: ['tatausaha'] },
            { label: 'Laporan KPI',      href: '/tatausaha/kpi',            icon: Star,        roles: ['tatausaha'] },
            { label: 'Buat Surat',       href: '/tatausaha/buat-surat',     icon: FileText,    roles: ['tatausaha', 'kepala_tatausaha'], tuSuratOnly: true },
            { label: 'Surat Masuk',      href: '/tatausaha/surat-masuk',    icon: MailOpen,    roles: ['tatausaha', 'kepala_tatausaha'], tuSuratOnly: true },
            { label: 'Surat Keluar',     href: '/tatausaha/surat-keluar',   icon: Send,        roles: ['tatausaha', 'kepala_tatausaha'], tuSuratOnly: true },
            { label: 'TTE Surat',        href: '/tatausaha/tte',            icon: ShieldCheck, roles: ['tatausaha', 'kepala_tatausaha', 'kepala_sekolah', 'super_admin'], tuSuratOnly: true },
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
    g.items.filter(i => !i.external && i.href).map(i => ({ label: i.label, href: i.href, section: g.label }))
);

const BADGE_STYLES = {
    beta:         'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
    maintenance:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    pengembangan: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
};
const BADGE_LABELS  = { beta: 'Beta', maintenance: 'Maint', pengembangan: 'Dev' };
const BLOCKED_BADGES = new Set(['maintenance', 'pengembangan']);

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Smooth collapse ─────────────────────────────────────────────── */
function CollapseSection({ open, children }) {
    const ref = useRef(null);
    const [height, setHeight] = useState(open ? 'auto' : '0px');

    useEffect(() => {
        if (!ref.current) return;
        if (open) {
            const h = ref.current.scrollHeight;
            setHeight(`${h}px`);
            const t = setTimeout(() => setHeight('auto'), 260);
            return () => clearTimeout(t);
        } else {
            setHeight(`${ref.current.scrollHeight}px`);
            requestAnimationFrame(() => requestAnimationFrame(() => setHeight('0px')));
        }
    }, [open]);

    return (
        <div ref={ref} style={{ height, overflow: 'hidden', transition: 'height 240ms cubic-bezier(0.4,0,0.2,1)' }}>
            {children}
        </div>
    );
}

/* ── Role divider ────────────────────────────────────────────────── */
function RoleDivider({ label }) {
    return (
        <div className="flex items-center gap-2 px-2 py-2 mt-2">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-sky-600 dark:text-sky-400 whitespace-nowrap">
                {label}
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        </div>
    );
}

/* ── Main sidebar ────────────────────────────────────────────────── */
export default function Sidebar({ open, onClose, isCollapsed = false, onToggleCollapse }) {
    const { url, props } = usePage();
    const user         = props.auth?.user;
    const roles        = user?.roles ?? [];
    const isGuruBk     = user?.is_guru_bk ?? false;
    const isTuSurat    = user?.is_tu_surat ?? false;
    const isWaliKelas  = !!(user?.wali_kelas_rombel_id);
    const menuBadges   = props.menu_badges ?? {};
    const onlineCount  = props.online_count ?? 0;
    const masukanCount = props.notifikasi?.masukan ?? 0;
    const appVersion   = props.app_version;
    const sekolah      = props.sekolah;

    const [collapsedGroups, setCollapsedGroups] = useState({});
    const toggleGroup = (label) => setCollapsedGroups(p => ({ ...p, [label]: !p[label] }));

    const isGroupOpen = (group) => {
        const hasActive = group.items.some(i => url.split('?')[0] === i.href);
        if (collapsedGroups[group.label] !== undefined) return !collapsedGroups[group.label];

        // Default open untuk Guru (Administrasi Guru) dan Tata Usaha (Tata Usaha)
        const isGuruGroup = group.label === 'Administrasi Guru' && roles.includes('guru');
        const isTuGroup = group.label === 'Tata Usaha' && roles.some(r => ['tatausaha', 'kepala_tatausaha'].includes(r));
        if (isGuruGroup || isTuGroup) {
            return true;
        }

        return group.collapsible ? hasActive : true;
    };

    const isActive = (href) => url.split('?')[0] === href;

    const hasAccess = (itemRoles, excludeRoles, guruBkOnly, tuSuratOnly, tuSuratExclude) => {
        if (excludeRoles && roles.some(r => excludeRoles.includes(r))) return false;
        if (guruBkOnly && roles.includes('guru') && !isGuruBk && !isWaliKelas &&
            !roles.some(r => ['super_admin', 'kepala_sekolah', 'wakasek_kesiswaan'].includes(r))) return false;
        if (tuSuratOnly && roles.includes('tatausaha') && !isTuSurat &&
            !roles.some(r => ['super_admin', 'kepala_sekolah', 'kepala_tatausaha'].includes(r))) return false;
        if (tuSuratExclude && roles.includes('tatausaha') && isTuSurat &&
            !roles.some(r => ['super_admin', 'kepala_sekolah', 'kepala_tatausaha', 'wakasek_kesiswaan'].includes(r))) return false;
        return !itemRoles || roles.some(r => itemRoles.includes(r));
    };

    const contextualRoles = roles.filter(r => r in ROLE_LABELS);
    const isMultiRole     = contextualRoles.length > 1;

    const getSectionLabel = (roleSection) => {
        if (!roleSection || !isMultiRole) return null;
        const arr = Array.isArray(roleSection) ? roleSection : [roleSection];
        const hit = arr.find(r => roles.includes(r));
        return hit ? ROLE_LABELS[hit] : null;
    };

    const groups = (() => {
        let prevLabel = null;
        return menuGroups.map(group => {
            if (group.roles && !hasAccess(group.roles)) return null;
            const visibleItems = group.items.filter(i => hasAccess(i.roles, i.excludeRoles, i.guruBkOnly, i.tuSuratOnly, i.tuSuratExclude));
            if (visibleItems.length === 0) return null;
            const divLabel    = getSectionLabel(group.roleSection);
            const showDivider = divLabel !== null && divLabel !== prevLabel;
            if (divLabel) prevLabel = divLabel;
            return { group, visibleItems, showDivider, divLabel };
        }).filter(Boolean);
    })();

    const initials = getInitials(user?.name);

    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden" onClick={onClose} />
            )}

            {/* ── Sidebar container ─────────────────────────────── */}
            <aside className={cn(
                'fixed top-0 left-0 bottom-0 z-40 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-800/80 transition-all duration-300 ease-in-out',
                isCollapsed ? 'w-20' : 'w-64',
                open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}>

                {/* Mobile close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="lg:hidden absolute top-3.5 right-3.5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-20"
                    aria-label="Tutup Menu"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* ── Profile Section ────── */}
                <div className={cn(
                    'relative shrink-0 border-b border-gray-100 dark:border-gray-800/80 transition-all duration-200',
                    isCollapsed ? 'py-4 px-2 flex justify-center' : 'pt-5 pb-4 px-3 text-center'
                )}>
                    {isCollapsed ? (
                        <Link href="/profile" title={user?.name} className="relative group block">
                            <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center ring-2 ring-sky-200 dark:ring-sky-800/50 group-hover:scale-105 transition-transform overflow-hidden">
                                {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user?.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    initials
                                )}
                            </div>
                        </Link>
                    ) : (
                        <div className="flex flex-col items-center">
                            {/* Avatar Circle with photo or initials */}
                            <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-bold text-base flex items-center justify-center ring-3 ring-sky-50 dark:ring-sky-900/30 shadow-2xs select-none overflow-hidden">
                                {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user?.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    initials
                                )}
                            </div>

                            {/* Full Name */}
                            <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug truncate max-w-full px-2" title={user?.name}>
                                {user?.name}
                            </p>

                            {/* Update Profil link */}
                            <Link
                                href="/profile"
                                className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400 transition-colors group"
                            >
                                <UserPen className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" strokeWidth={1.75} />
                                <span>Update Profil</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* ── Navigation Items ─────────────────────────── */}
                <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1
                    [&::-webkit-scrollbar]:w-1
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-gray-200
                    dark:[&::-webkit-scrollbar-thumb]:bg-gray-800">

                    {groups.map(({ group, visibleItems, showDivider, divLabel }) => {
                        const meta = GROUP_META[group.label];
                        const GroupIcon = meta?.icon || Landmark;
                        const isSingleItem = visibleItems.length === 1 && !group.collapsible;

                        // Case 1: Single direct item (e.g. Dashboard / Masukan)
                        if (isSingleItem) {
                            const item = visibleItems[0];
                            const active = isActive(item.href);
                            const ItemIcon = item.icon || GroupIcon;
                            const badge = menuBadges[item.href];
                            const blocked = badge && BLOCKED_BADGES.has(badge);

                            return (
                                <div key={group.label} className="pt-0.5">
                                    {!isCollapsed && (
                                        <div className="px-3 pt-1.5 pb-1 text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
                                            {group.label}
                                        </div>
                                    )}
                                    <Link
                                        href={item.href}
                                        title={isCollapsed ? item.label : undefined}
                                        className={cn(
                                            'flex items-center gap-2.5 transition-all duration-150',
                                            isCollapsed
                                                ? 'justify-center h-10 w-10 mx-auto rounded-lg'
                                                : 'px-3 py-2 w-full text-[13px] font-semibold rounded-lg',
                                            active
                                                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/40 font-semibold shadow-2xs'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                                        )}
                                    >
                                        <ItemIcon className={cn('h-4.5 w-4.5 shrink-0 transition-colors', active ? 'text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400')} strokeWidth={1.75} />
                                        {!isCollapsed && <span className="truncate leading-tight">{item.label}</span>}
                                    </Link>
                                </div>
                            );
                        }

                        // Case 2: Multi-item or collapsible group (e.g. Akademik, Siswa, Laporan, Piket, etc.)
                        const groupOpen = isGroupOpen(group);
                        const anyActive = visibleItems.some(i => isActive(i.href));

                        return (
                            <div key={group.label} className="pt-0.5">
                                {showDivider && !isCollapsed && <RoleDivider label={divLabel} />}

                                {/* In collapsed mode, render simple group icon button */}
                                {isCollapsed ? (
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.label)}
                                        title={group.label}
                                        className={cn(
                                            'flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-150',
                                            anyActive
                                                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold'
                                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                                        )}
                                    >
                                        <GroupIcon className="h-4.5 w-4.5" strokeWidth={1.75} />
                                    </button>
                                ) : (
                                    <>
                                        {/* Group Header Button */}
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(group.label)}
                                            className={cn(
                                                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors group',
                                                anyActive
                                                    ? 'text-sky-700 dark:text-sky-300 font-semibold bg-sky-50/60 dark:bg-sky-950/20'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <GroupIcon className={cn(
                                                    'h-4.5 w-4.5 shrink-0 transition-colors',
                                                    anyActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                                )} strokeWidth={1.75} />
                                                <span className="truncate text-left">{group.label}</span>
                                            </div>
                                            <ChevronDown className={cn(
                                                'h-3.5 w-3.5 transition-transform duration-200 shrink-0',
                                                groupOpen ? 'rotate-180 text-sky-600 dark:text-sky-400' : 'rotate-0 text-gray-400'
                                            )} strokeWidth={1.75} />
                                        </button>

                                        {/* Group Children with Interactive Tree Branch Connecting Lines |-- */}
                                        <CollapseSection open={groupOpen}>
                                            <div className="relative ml-4 pl-3 border-l-2 border-gray-200/80 dark:border-gray-800 space-y-0.5 my-1 transition-colors">
                                                {visibleItems.map(item => {
                                                    const active = isActive(item.href);
                                                    const ItemIcon = item.icon || GroupIcon;
                                                    const badge = menuBadges[item.href];
                                                    const blocked = badge && BLOCKED_BADGES.has(badge);

                                                    const innerContent = (
                                                        <>
                                                            <ItemIcon className={cn(
                                                                'h-3.5 w-3.5 shrink-0 transition-colors',
                                                                active ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                                            )} strokeWidth={1.75} />
                                                            <span className="flex-1 truncate leading-tight">{item.label}</span>

                                                            {item.href === '/admin/users' && onlineCount > 0 && (
                                                                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-[1px] leading-none">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse" />
                                                                    {onlineCount}
                                                                </span>
                                                            )}
                                                            {item.href === '/admin/masukan' && masukanCount > 0 && (
                                                                <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] px-1 leading-none">
                                                                    {masukanCount > 99 ? '99+' : masukanCount}
                                                                </span>
                                                            )}
                                                            {badge && (
                                                                <span className={cn('shrink-0 rounded-md px-1.5 py-[1px] text-[10px] font-semibold leading-none', BADGE_STYLES[badge])}>
                                                                    {blocked ? <Lock className="h-2.5 w-2.5 inline" /> : BADGE_LABELS[badge]}
                                                                </span>
                                                            )}
                                                        </>
                                                    );

                                                    return (
                                                        <div key={item.href} className="relative flex items-center group/tree">
                                                            {/* Clean Tree branch horizontal connector line (tanpa titik) */}
                                                            <span className={cn(
                                                                'absolute -left-3 top-1/2 w-3 h-px transition-colors duration-150',
                                                                active
                                                                    ? 'bg-sky-500'
                                                                    : 'bg-gray-200 dark:bg-gray-800 group-hover/tree:bg-gray-300 dark:group-hover/tree:bg-gray-700'
                                                            )} />

                                                            {blocked ? (
                                                                <div
                                                                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed w-full"
                                                                    title="Menu ini sedang tidak tersedia"
                                                                >
                                                                    {innerContent}
                                                                </div>
                                                            ) : (
                                                                <Link
                                                                    href={item.href}
                                                                    className={cn(
                                                                        'group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-all w-full',
                                                                        active
                                                                            ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200/80 dark:border-sky-800/40 shadow-2xs'
                                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                                                                    )}
                                                                >
                                                                    {innerContent}
                                                                </Link>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CollapseSection>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* ── Footer Section (Matching Screenshot) ────── */}
                <div className="shrink-0 p-3 border-t border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-900">
                    {!isCollapsed ? (
                        <div className="space-y-1.5">
                            {/* Version Info Row */}
                            <div className="flex items-center justify-between px-1 text-[11px]">
                                <span className="text-gray-400 dark:text-gray-500">Versi aplikasi</span>
                                <span className="font-semibold text-gray-600 dark:text-gray-300">
                                    v{appVersion || '1.0.10'}
                                </span>
                            </div>

                            {/* Collapse Button */}
                            <button
                                type="button"
                                onClick={onToggleCollapse}
                                className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <PanelLeftClose className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" strokeWidth={1.75} />
                                <span>Ciutkan sidebar</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                                v{appVersion || '1.0'}
                            </span>
                            <button
                                type="button"
                                onClick={onToggleCollapse}
                                title="Perlebar sidebar"
                                aria-label="Perlebar sidebar"
                                className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
