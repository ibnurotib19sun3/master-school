import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap, School, Calendar,
    ClipboardList, ClipboardCheck, FileText, BarChart3, Video, Presentation, HelpCircle,
    BookMarked, Star, MessageSquare, X,
    Clock, PieChart, ShieldCheck, Settings, BookCheck, BookText,
    UserCog, Megaphone, MailOpen, Send, FolderUp, Layers, History, CalendarX, Tag,
    ChevronDown, Lock, NotebookPen, Database, Inbox, Crown, Trophy,
    FolderOpen, Briefcase, ChevronRight, KeyRound,
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
};

/* ─── Per-group: icon + color key ────────────────────────────────── */
const GROUP_META = {
    'Utama':              { icon: LayoutDashboard, ck: 'sky'    },
    'Akademik':           { icon: School,          ck: 'violet' },
    'Laporan':            { icon: BarChart3,        ck: 'emerald'},
    'Rekap Jurnal':       { icon: FolderOpen,       ck: 'amber'  },
    'Piket':              { icon: ClipboardList,    ck: 'rose'   },
    'Administrasi Guru':  { icon: GraduationCap,   ck: 'sky'    },
    'Media Pembelajaran': { icon: Video,            ck: 'pink'   },
    'Asesmen & Kuis':     { icon: HelpCircle,       ck: 'orange' },
    'Jurnal Pimpinan':    { icon: Briefcase,        ck: 'indigo' },
    'Evaluasi':           { icon: Star,             ck: 'yellow' },
    'Broadcast & Sistem': { icon: Megaphone,        ck: 'red'    },
    'Pokja':              { icon: Layers,           ck: 'teal'   },
    'Tata Usaha':         { icon: UserCog,          ck: 'cyan'   },
    'Masukan & Laporan':  { icon: MessageSquare,    ck: 'slate'  },
};

/* Active item — tinted bg + bright colored text (not solid pill) */
const ACTIVE_CLS = {
    sky:     'bg-sky-50     text-sky-700     font-semibold dark:bg-sky-500/[0.12]   dark:text-sky-400',
    violet:  'bg-violet-50  text-violet-700  font-semibold dark:bg-violet-500/[0.12] dark:text-violet-400',
    emerald: 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-500/[0.12] dark:text-emerald-400',
    amber:   'bg-amber-50   text-amber-700   font-semibold dark:bg-amber-500/[0.12]  dark:text-amber-400',
    rose:    'bg-rose-50    text-rose-700    font-semibold dark:bg-rose-500/[0.12]   dark:text-rose-400',
    pink:    'bg-pink-50    text-pink-700    font-semibold dark:bg-pink-500/[0.12]   dark:text-pink-400',
    orange:  'bg-orange-50  text-orange-700  font-semibold dark:bg-orange-500/[0.12] dark:text-orange-400',
    indigo:  'bg-indigo-50  text-indigo-700  font-semibold dark:bg-indigo-500/[0.12] dark:text-indigo-400',
    yellow:  'bg-yellow-50  text-yellow-700  font-semibold dark:bg-yellow-500/[0.12] dark:text-yellow-400',
    red:     'bg-red-50     text-red-700     font-semibold dark:bg-red-500/[0.12]    dark:text-red-400',
    teal:    'bg-teal-50    text-teal-700    font-semibold dark:bg-teal-500/[0.12]   dark:text-teal-400',
    cyan:    'bg-cyan-50    text-cyan-700    font-semibold dark:bg-cyan-500/[0.12]   dark:text-cyan-400',
    slate:   'bg-slate-100  text-slate-700   font-semibold dark:bg-slate-500/[0.12]  dark:text-slate-400',
};

/* Active icon chip bg per color key */
const ACTIVE_CHIP = {
    sky:     'bg-sky-100     dark:bg-sky-500/20',
    violet:  'bg-violet-100  dark:bg-violet-500/20',
    emerald: 'bg-emerald-100 dark:bg-emerald-500/20',
    amber:   'bg-amber-100   dark:bg-amber-500/20',
    rose:    'bg-rose-100    dark:bg-rose-500/20',
    pink:    'bg-pink-100    dark:bg-pink-500/20',
    orange:  'bg-orange-100  dark:bg-orange-500/20',
    indigo:  'bg-indigo-100  dark:bg-indigo-500/20',
    yellow:  'bg-yellow-100  dark:bg-yellow-500/20',
    red:     'bg-red-100     dark:bg-red-500/20',
    teal:    'bg-teal-100    dark:bg-teal-500/20',
    cyan:    'bg-cyan-100    dark:bg-cyan-500/20',
    slate:   'bg-slate-200   dark:bg-slate-500/20',
};

/* Active icon color per color key */
const ACTIVE_ICON_COLOR = {
    sky:     'text-sky-600     dark:text-sky-400',
    violet:  'text-violet-600  dark:text-violet-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber:   'text-amber-600   dark:text-amber-400',
    rose:    'text-rose-600    dark:text-rose-400',
    pink:    'text-pink-600    dark:text-pink-400',
    orange:  'text-orange-600  dark:text-orange-400',
    indigo:  'text-indigo-600  dark:text-indigo-400',
    yellow:  'text-yellow-600  dark:text-yellow-400',
    red:     'text-red-600     dark:text-red-400',
    teal:    'text-teal-600    dark:text-teal-400',
    cyan:    'text-cyan-600    dark:text-cyan-400',
    slate:   'text-slate-600   dark:text-slate-400',
};

/* Hover-chip tint per color key */
const HOVER_CHIP = {
    sky:     'group-hover:bg-sky-100/80     dark:group-hover:bg-sky-900/30',
    violet:  'group-hover:bg-violet-100/80  dark:group-hover:bg-violet-900/30',
    emerald: 'group-hover:bg-emerald-100/80 dark:group-hover:bg-emerald-900/30',
    amber:   'group-hover:bg-amber-100/80   dark:group-hover:bg-amber-900/30',
    rose:    'group-hover:bg-rose-100/80    dark:group-hover:bg-rose-900/30',
    pink:    'group-hover:bg-pink-100/80    dark:group-hover:bg-pink-900/30',
    orange:  'group-hover:bg-orange-100/80  dark:group-hover:bg-orange-900/30',
    indigo:  'group-hover:bg-indigo-100/80  dark:group-hover:bg-indigo-900/30',
    yellow:  'group-hover:bg-yellow-100/80  dark:group-hover:bg-yellow-900/30',
    red:     'group-hover:bg-red-100/80     dark:group-hover:bg-red-900/30',
    teal:    'group-hover:bg-teal-100/80    dark:group-hover:bg-teal-900/30',
    cyan:    'group-hover:bg-cyan-100/80    dark:group-hover:bg-cyan-900/30',
    slate:   'group-hover:bg-slate-100/80   dark:group-hover:bg-slate-900/30',
};

/* Hover-icon color per color key */
const HOVER_ICON = {
    sky:     'group-hover:text-sky-600     dark:group-hover:text-sky-400',
    violet:  'group-hover:text-violet-600  dark:group-hover:text-violet-400',
    emerald: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    amber:   'group-hover:text-amber-600   dark:group-hover:text-amber-400',
    rose:    'group-hover:text-rose-600    dark:group-hover:text-rose-400',
    pink:    'group-hover:text-pink-600    dark:group-hover:text-pink-400',
    orange:  'group-hover:text-orange-600  dark:group-hover:text-orange-400',
    indigo:  'group-hover:text-indigo-600  dark:group-hover:text-indigo-400',
    yellow:  'group-hover:text-yellow-600  dark:group-hover:text-yellow-400',
    red:     'group-hover:text-red-600     dark:group-hover:text-red-400',
    teal:    'group-hover:text-teal-600    dark:group-hover:text-teal-400',
    cyan:    'group-hover:text-cyan-600    dark:group-hover:text-cyan-400',
    slate:   'group-hover:text-slate-600   dark:group-hover:text-slate-400',
};

/* ─── Menu data ───────────────────────────────────────────────────── */
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
            { label: 'Jadwal Saya',          href: '/guru/jadwal-saya',          icon: Calendar,      roles: ['guru'] },
            { label: 'Capaian Pembelajaran', href: '/guru/capaian-pembelajaran', icon: GraduationCap, roles: ['guru'] },
            { label: 'Jurnal Mengajar',      href: '/guru/jurnal',               icon: FileText,      roles: ['guru'] },
            { label: 'Riwayat Jurnal',       href: '/guru/jurnal/riwayat',       icon: History,       roles: ['guru'] },
            { label: 'Presensi Siswa',       href: '/guru/absensi',              icon: ClipboardList },
            { label: 'Presensi Harian (BK)', href: '/guru/presensi-harian',      icon: ClipboardCheck, roles: ['guru', 'super_admin', 'kepala_sekolah', 'wakasek_kesiswaan'], guruBkOnly: true },
            { label: 'Rekap Presensi',       href: '/guru/presensi-harian/rekap',icon: BarChart3,     roles: ['guru', 'super_admin', 'kepala_sekolah', 'wakasek_kesiswaan'], guruBkOnly: true },
            { label: 'Pengumpulan',          href: '/guru/pengumpulan',          icon: FolderUp,      roles: ['guru'] },
            { label: 'Jurnal Mengajar Guru', href: '/admin/jurnal-mengajar',     icon: FileText,      roles: ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'] },
            { label: 'Input Nilai',          href: '/guru/nilai',                icon: BarChart3 },
            { label: 'Laporan KPI',          href: '/guru/kpi',                  icon: Star,          roles: ['guru'] },
            { label: 'Catatan Kepsek',       href: '/guru/catatan-kepsek',       icon: MessageSquare, roles: ['guru'], excludeRoles: ['kepala_sekolah', 'super_admin'] },
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

/* ── Smooth collapse ─────────────────────────────────────────────── */
function CollapseSection({ open, children }) {
    const ref = useRef(null);
    const [height, setHeight] = useState(open ? 'auto' : '0px');
    useEffect(() => {
        if (!ref.current) return;
        if (open) {
            const h = ref.current.scrollHeight;
            setHeight(`${h}px`);
            const t = setTimeout(() => setHeight('auto'), 280);
            return () => clearTimeout(t);
        } else {
            setHeight(`${ref.current.scrollHeight}px`);
            requestAnimationFrame(() => requestAnimationFrame(() => setHeight('0px')));
        }
    }, [open]);
    return (
        <div ref={ref} style={{ height, overflow: 'hidden', transition: 'height 250ms cubic-bezier(0.4,0,0.2,1)' }}>
            {children}
        </div>
    );
}

/* ── Nav item — active color varies per group ────────────────────── */
function SidebarItem({ item, active, badge, onlineCount, masukanCount, ck = 'sky' }) {
    const Icon    = item.icon;
    const blocked = badge && BLOCKED_BADGES.has(badge);
    const activeCls = ACTIVE_CLS[ck] ?? ACTIVE_CLS.sky;

    const cls = cn(
        'group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all duration-150 w-full',
        blocked
            ? 'opacity-35 cursor-not-allowed text-gray-400 dark:text-gray-600'
            : active
                ? activeCls
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-100',
    );

    const inner = (
        <>
            <span className={cn(
                'shrink-0 flex items-center justify-center h-[22px] w-[22px] rounded-md transition-all duration-150',
                blocked
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : active
                        ? ACTIVE_CHIP[ck]
                        : cn('bg-gray-100/80 dark:bg-white/[0.06]', HOVER_CHIP[ck]),
            )}>
                <Icon className={cn(
                    'h-[13px] w-[13px] transition-colors',
                    blocked
                        ? 'text-gray-400 dark:text-gray-600'
                        : active
                            ? ACTIVE_ICON_COLOR[ck]
                            : cn('text-gray-400 dark:text-gray-500', HOVER_ICON[ck]),
                )} />
            </span>
            <span className="flex-1 leading-tight truncate">{item.label}</span>
            {onlineCount > 0 && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-[2px] leading-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse" />
                    {onlineCount}
                </span>
            )}
            {masukanCount > 0 && (
                <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 leading-none">
                    {masukanCount > 99 ? '99+' : masukanCount}
                </span>
            )}
            {badge && (
                <span className={cn('shrink-0 rounded-md px-1.5 py-[2px] text-[10px] font-semibold leading-none', BADGE_STYLES[badge])}>
                    {blocked ? <Lock className="h-2.5 w-2.5 inline" /> : BADGE_LABELS[badge]}
                </span>
            )}
        </>
    );

    if (blocked) return <div className={cls} title="Menu ini sedang tidak tersedia">{inner}</div>;
    if (item.external) return <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
    return <Link href={item.href} className={cls}>{inner}</Link>;
}

/* ── Role divider ────────────────────────────────────────────────── */
function RoleDivider({ label }) {
    return (
        <div className="flex items-center gap-2 px-1 py-2 mt-1">
            <div className="h-px flex-1 bg-gray-200/80 dark:bg-white/8" />
            <span className="text-[9.5px] font-bold tracking-[0.12em] uppercase text-sky-500/70 whitespace-nowrap">
                {label}
            </span>
            <div className="h-px flex-1 bg-gray-200/80 dark:bg-white/8" />
        </div>
    );
}

/* ── Group header ────────────────────────────────────────────────── */
function GroupHeader({ label, meta, open, onClick }) {
    const Icon = meta?.icon;
    const ck   = meta?.ck ?? 'sky';
    return (
        <button type="button" onClick={onClick}
            className="w-full flex items-center gap-2 px-1.5 py-1.5 rounded-lg group mb-0.5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
            {Icon && (
                <span className={cn(
                    'shrink-0 flex items-center justify-center h-[18px] w-[18px] rounded-md',
                    /* subtle bg using the group color chip */
                    ck === 'sky'     && 'bg-sky-100     dark:bg-sky-900/40',
                    ck === 'violet'  && 'bg-violet-100  dark:bg-violet-900/40',
                    ck === 'emerald' && 'bg-emerald-100 dark:bg-emerald-900/40',
                    ck === 'amber'   && 'bg-amber-100   dark:bg-amber-900/40',
                    ck === 'rose'    && 'bg-rose-100    dark:bg-rose-900/40',
                    ck === 'pink'    && 'bg-pink-100    dark:bg-pink-900/40',
                    ck === 'orange'  && 'bg-orange-100  dark:bg-orange-900/40',
                    ck === 'indigo'  && 'bg-indigo-100  dark:bg-indigo-900/40',
                    ck === 'yellow'  && 'bg-yellow-100  dark:bg-yellow-900/40',
                    ck === 'red'     && 'bg-red-100     dark:bg-red-900/40',
                    ck === 'teal'    && 'bg-teal-100    dark:bg-teal-900/40',
                    ck === 'cyan'    && 'bg-cyan-100    dark:bg-cyan-900/40',
                    ck === 'slate'   && 'bg-slate-100   dark:bg-slate-800',
                )}>
                    <Icon className={cn(
                        'h-2.5 w-2.5',
                        ck === 'sky'     && 'text-sky-600     dark:text-sky-400',
                        ck === 'violet'  && 'text-violet-600  dark:text-violet-400',
                        ck === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                        ck === 'amber'   && 'text-amber-600   dark:text-amber-400',
                        ck === 'rose'    && 'text-rose-600    dark:text-rose-400',
                        ck === 'pink'    && 'text-pink-600    dark:text-pink-400',
                        ck === 'orange'  && 'text-orange-600  dark:text-orange-400',
                        ck === 'indigo'  && 'text-indigo-600  dark:text-indigo-400',
                        ck === 'yellow'  && 'text-yellow-600  dark:text-yellow-400',
                        ck === 'red'     && 'text-red-600     dark:text-red-400',
                        ck === 'teal'    && 'text-teal-600    dark:text-teal-400',
                        ck === 'cyan'    && 'text-cyan-600    dark:text-cyan-400',
                        ck === 'slate'   && 'text-slate-600   dark:text-slate-400',
                    )} />
                </span>
            )}
            <span className="flex-1 text-left text-[10px] font-bold tracking-[0.07em] uppercase text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-500 transition-colors">
                {label}
            </span>
            <ChevronDown className={cn(
                'h-3 w-3 text-gray-300 dark:text-gray-700 group-hover:text-gray-400 transition-all duration-200',
                open ? 'rotate-180' : 'rotate-0',
            )} />
        </button>
    );
}

/* ── Main sidebar ────────────────────────────────────────────────── */
export default function Sidebar({ open, onClose }) {
    const { url, props } = usePage();
    const user         = props.auth?.user;
    const roles        = user?.roles ?? [];
    const isGuruBk     = user?.is_guru_bk ?? false;
    const isTuSurat    = user?.is_tu_surat ?? false;
    const isWaliKelas  = !!(user?.wali_kelas_rombel_id);
    const menuBadges   = props.menu_badges ?? {};
    const onlineCount  = props.online_count ?? 0;
    const masukanCount = props.notifikasi?.masukan ?? 0;

    const [collapsedGroups, setCollapsedGroups] = useState({});
    const toggleGroup = (label) => setCollapsedGroups(p => ({ ...p, [label]: !p[label] }));

    const isGroupOpen = (group) => {
        const hasActive = group.items.some(i => url.split('?')[0] === i.href);
        if (collapsedGroups[group.label] !== undefined) return !collapsedGroups[group.label];
        return group.collapsible ? hasActive : true;
    };

    const isActive = (href) => url.split('?')[0] === href;

    const hasAccess = (itemRoles, excludeRoles, guruBkOnly, tuSuratOnly) => {
        if (excludeRoles && roles.some(r => excludeRoles.includes(r))) return false;
        if (guruBkOnly && roles.includes('guru') && !isGuruBk && !isWaliKelas &&
            !roles.some(r => ['super_admin', 'kepala_sekolah', 'wakasek_kesiswaan'].includes(r))) return false;
        if (tuSuratOnly && roles.includes('tatausaha') && !isTuSurat &&
            !roles.some(r => ['super_admin', 'kepala_sekolah', 'kepala_tatausaha'].includes(r))) return false;
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
            const visibleItems = group.items.filter(i => hasAccess(i.roles, i.excludeRoles, i.guruBkOnly, i.tuSuratOnly));
            if (visibleItems.length === 0) return null;
            const divLabel    = getSectionLabel(group.roleSection);
            const showDivider = divLabel !== null && divLabel !== prevLabel;
            if (divLabel) prevLabel = divLabel;
            return { group, visibleItems, showDivider, divLabel };
        }).filter(Boolean);
    })();

    const primaryRoleLabel = contextualRoles.length > 0
        ? contextualRoles.map(r => ROLE_LABELS[r] ?? r.replace(/_/g, ' ')).join(' · ')
        : (roles[0]?.replace(/_/g, ' ') ?? '');

    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px] lg:hidden" onClick={onClose} />
            )}

            {/* ── Sidebar — flush, no card float ───────────────── */}
            <aside className={cn(
                'fixed top-0 left-0 bottom-0 z-30 flex flex-col w-64',
                'bg-white dark:bg-gray-900',
                'border-r border-gray-200/80 dark:border-gray-800/80',
                'transition-transform duration-300 ease-in-out',
                open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            )}>

                {/* ── Logo — tinggi h-16 sejajar navbar ─────────── */}
                <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800/60">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <div className="shrink-0 h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center overflow-hidden">
                            <img src="/logodjurnal.svg" alt="DJurnal" className="h-6 w-6 object-contain" />
                        </div>
                        <div>
                            <span className="block font-black text-gray-900 dark:text-white text-[13px] tracking-tight leading-none">APIKMAS</span>
                            <span className="block text-[9px] font-bold tracking-[0.2em] uppercase leading-tight mt-[3px] text-sky-500 dark:text-sky-400">
                                DJurnal
                            </span>
                        </div>
                    </Link>
                    <button onClick={onClose} className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* ── Navigation ───────────────────────────────── */}
                <nav className="flex-1 overflow-y-auto px-3 py-3
                    [&::-webkit-scrollbar]:w-1
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-gray-200
                    dark:[&::-webkit-scrollbar-thumb]:bg-gray-800">

                    {groups.map(({ group, visibleItems, showDivider, divLabel }, gi) => {
                        const meta      = GROUP_META[group.label];
                        const ck        = meta?.ck ?? 'sky';
                        const groupOpen = isGroupOpen(group);
                        return (
                            <div key={group.label} className={gi > 0 ? 'mt-1' : ''}>
                                {showDivider && <RoleDivider label={divLabel} />}
                                <GroupHeader label={group.label} meta={meta} open={groupOpen} onClick={() => toggleGroup(group.label)} />
                                <CollapseSection open={groupOpen}>
                                    <div className="space-y-0.5 pb-1 pl-1">
                                        {visibleItems.map(item => (
                                            <SidebarItem
                                                key={item.href}
                                                item={item}
                                                active={isActive(item.href)}
                                                badge={menuBadges[item.href]}
                                                ck={ck}
                                                onlineCount={item.href === '/admin/users' ? onlineCount : 0}
                                                masukanCount={item.href === '/admin/masukan' ? masukanCount : 0}
                                            />
                                        ))}
                                    </div>
                                </CollapseSection>
                            </div>
                        );
                    })}
                </nav>

                {/* ── User footer ──────────────────────────────── */}
                <div className="shrink-0 px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800/60">
                    <Link href="/profile"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2
                            hover:bg-gray-50 dark:hover:bg-white/[0.04]
                            transition-colors group">
                        <div className="relative shrink-0">
                            <img
                                src={user?.avatar_url}
                                alt={user?.name}
                                className="h-8 w-8 rounded-lg object-cover ring-[1.5px] ring-gray-200 dark:ring-white/10"
                                onError={e => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? '?')}&background=0284c7&color=fff&bold=true&size=64`;
                                }}
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-[1.5px] ring-white dark:ring-gray-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{user?.name}</p>
                            <p className="text-[10.5px] text-gray-400 dark:text-gray-500 truncate capitalize leading-tight mt-0.5">{primaryRoleLabel}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-700 group-hover:text-gray-400 transition-colors" />
                    </Link>
                </div>
            </aside>
        </>
    );
}
