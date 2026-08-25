import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    ShieldCheck, Users, Search, X, ChevronDown, Check,
    CheckCircle2, AlertCircle, Shield, Eye, Lock, Unlock,
    UserCog, Info,
} from 'lucide-react';

/* ─── Data statis akses modul per role (dari route middleware) ─── */
const ALL_ROLES = [
    'super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan',
    'guru', 'guru_piket', 'tatausaha', 'kepala_tatausaha',
    'pokja_kurikulum', 'pokja_kesiswaan', 'pokja_sarpras', 'pokja_humas',
    'bimbingan_konseling', 'bendahara_sekolah', 'tim_penjamin_mutu',
    'kepala_konsentrasi_keahlian', 'siswa', 'orang_tua',
];

const ROLE_LABEL = {
    super_admin:                  'Super Admin',
    kepala_sekolah:               'Kepala Sekolah',
    wakasek_kurikulum:            'Wakasek Kurikulum',
    wakasek_kesiswaan:            'Wakasek Kesiswaan',
    guru:                         'Guru',
    guru_piket:                   'Guru Piket',
    tatausaha:                    'Tata Usaha',
    kepala_tatausaha:             'Kepala TU',
    pokja_kurikulum:              'Pokja Kurikulum',
    pokja_kesiswaan:              'Pokja Kesiswaan',
    pokja_sarpras:                'Pokja Sarpras',
    pokja_humas:                  'Pokja Humas',
    bimbingan_konseling:          'BK',
    bendahara_sekolah:            'Bendahara',
    tim_penjamin_mutu:            'TPM',
    kepala_konsentrasi_keahlian:  'Ka. Konsentrasi',
    siswa:                        'Siswa',
    orang_tua:                    'Orang Tua',
};

const ROLE_COLOR = {
    super_admin:                 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-700',
    kepala_sekolah:              'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-700',
    wakasek_kurikulum:           'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-700',
    wakasek_kesiswaan:           'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-700',
    guru:                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
    guru_piket:                  'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-700',
    tatausaha:                   'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-700',
    kepala_tatausaha:            'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-700',
    pokja_kurikulum:             'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-700',
    pokja_kesiswaan:             'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-700',
    pokja_sarpras:               'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-700',
    pokja_humas:                 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-700',
    bimbingan_konseling:         'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-700',
    bendahara_sekolah:           'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    tim_penjamin_mutu:           'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    kepala_konsentrasi_keahlian: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
    siswa:                       'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    orang_tua:                   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

/* Modul akses berdasarkan route middleware di web.php */
const MODUL_ACCESS = [
    {
        modul: 'Dashboard', icon: '🏠',
        roles: ['super_admin','kepala_sekolah','wakasek_kurikulum','wakasek_kesiswaan','guru','guru_piket','tatausaha','kepala_tatausaha','pokja_kurikulum','pokja_kesiswaan','pokja_sarpras','pokja_humas','bimbingan_konseling','bendahara_sekolah','tim_penjamin_mutu','kepala_konsentrasi_keahlian','siswa','orang_tua'],
    },
    {
        modul: 'Admin Panel', icon: '⚙️',
        roles: ['super_admin','kepala_sekolah','wakasek_kurikulum','wakasek_kesiswaan','kepala_tatausaha','tatausaha'],
    },
    {
        modul: 'Pengguna', icon: '👤',
        roles: ['super_admin'],
        desc: 'Kelola akun pengguna sistem',
    },
    {
        modul: 'Data Akademik', icon: '🏫',
        desc: 'Tahun Ajaran, Kelas, Jurusan, Rombel, Mapel',
        roles: ['super_admin'],
    },
    {
        modul: 'Data Guru & TU', icon: '👩‍🏫',
        desc: 'CRUD data guru & tata usaha',
        roles: ['super_admin','wakasek_kurikulum','kepala_tatausaha','tatausaha'],
    },
    {
        modul: 'Data Siswa', icon: '🎓',
        desc: 'CRUD data siswa',
        roles: ['super_admin','wakasek_kesiswaan','kepala_tatausaha','tatausaha'],
    },
    {
        modul: 'Pembelajaran & Jadwal', icon: '📋',
        roles: ['super_admin','wakasek_kurikulum'],
    },
    {
        modul: 'Laporan Kehadiran', icon: '📊',
        roles: ['super_admin','kepala_sekolah','wakasek_kurikulum','wakasek_kesiswaan','kepala_tatausaha'],
    },
    {
        modul: 'Riwayat Jurnal', icon: '📜',
        roles: ['super_admin','kepala_sekolah'],
    },
    {
        modul: 'Piket & Presensi', icon: '🛡️',
        roles: ['super_admin','kepala_sekolah','wakasek_kesiswaan','kepala_tatausaha','guru_piket'],
    },
    {
        modul: 'Jurnal Mengajar', icon: '📔',
        desc: 'Isi & kelola jurnal pembelajaran',
        roles: ['super_admin','kepala_sekolah','wakasek_kurikulum','guru'],
    },
    {
        modul: 'Absensi Siswa', icon: '✅',
        roles: ['super_admin','kepala_sekolah','wakasek_kurikulum','guru'],
    },
    {
        modul: 'Nilai & Kuis', icon: '📝',
        roles: ['super_admin','kepala_sekolah','wakasek_kurikulum','guru'],
    },
    {
        modul: 'Media Pembelajaran', icon: '🎬',
        roles: ['super_admin','kepala_sekolah','wakasek_kurikulum','guru'],
    },
    {
        modul: 'Jurnal Pimpinan', icon: '👑',
        desc: 'Monitoring jurnal seluruh civitas',
        roles: ['super_admin','kepala_sekolah','wakasek_kurikulum','wakasek_kesiswaan','kepala_tatausaha','bendahara_sekolah','tim_penjamin_mutu','kepala_konsentrasi_keahlian'],
    },
    {
        modul: 'KPI & Evaluasi', icon: '⭐',
        roles: ['super_admin','kepala_sekolah','kepala_tatausaha'],
    },
    {
        modul: 'Tata Usaha', icon: '🗂️',
        desc: 'Jurnal karyawan, surat, TTE',
        roles: ['super_admin','kepala_sekolah','tatausaha','kepala_tatausaha'],
    },
    {
        modul: 'Pokja', icon: '🔧',
        desc: 'Jurnal pokja & kesiswaan',
        roles: ['super_admin','pokja_kurikulum','pokja_kesiswaan','pokja_sarpras','pokja_humas','bimbingan_konseling'],
    },
    {
        modul: 'Pengaturan Sistem', icon: '🔒',
        desc: 'Sekolah, Surat, RBAC, Pemeliharaan, Backup',
        roles: ['super_admin'],
    },
];

/* ─── RoleBadge ─── */
function RoleBadge({ role }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${ROLE_COLOR[role] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
            {ROLE_LABEL[role] ?? role}
        </span>
    );
}

/* ─── RoleMultiSelect ─── */
function RoleMultiSelect({ allRoles, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    const toggle = (name) => {
        if (selected.includes(name)) onChange(selected.filter(r => r !== name));
        else onChange([...selected, name]);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors min-w-32"
            >
                <span className="flex-1 text-left truncate">
                    {selected.length === 0 ? 'Pilih role...' : selected.map(r => ROLE_LABEL[r] ?? r).join(', ')}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 left-0 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
                    <div className="max-h-72 overflow-y-auto py-1">
                        {allRoles.map(r => (
                            <button
                                key={r.name}
                                type="button"
                                onClick={() => toggle(r.name)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                                <div className={`h-4 w-4 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                                    selected.includes(r.name)
                                        ? 'bg-sky-600 border-sky-600'
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                    {selected.includes(r.name) && <Check className="h-2.5 w-2.5 text-white" />}
                                </div>
                                <span className="text-gray-700 dark:text-gray-200">{ROLE_LABEL[r.name] ?? r.name}</span>
                                <span className="ml-auto text-xs text-gray-400">{r.users_count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Halaman Utama ─── */
export default function RbacIndex({ roles, users }) {
    const [tab, setTab]           = useState('pengguna');
    const [search, setSearch]     = useState('');
    const [saving, setSaving]     = useState(null);
    const [pendingRoles, setPendingRoles] = useState({});
    const [flash, setFlash]       = useState(null);
    const [matrixRole, setMatrixRole] = useState('');

    /* Inisiasi pendingRoles dari props */
    useEffect(() => {
        const init = {};
        users.forEach(u => { init[u.id] = u.roles; });
        setPendingRoles(init);
    }, [users]);

    const filteredUsers = useMemo(() => {
        const q = search.toLowerCase();
        return users.filter(u =>
            u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
    }, [users, search]);

    const isDirty = useCallback((userId) => {
        const original = users.find(u => u.id === userId)?.roles ?? [];
        const current  = pendingRoles[userId] ?? [];
        return JSON.stringify([...original].sort()) !== JSON.stringify([...current].sort());
    }, [users, pendingRoles]);

    const saveRoles = useCallback((user) => {
        setSaving(user.id);
        router.post(`/admin/rbac/users/${user.id}/roles`, { roles: pendingRoles[user.id] ?? [] }, {
            preserveScroll: true,
            onSuccess: () => {
                setFlash({ type: 'success', msg: `Role ${user.name} berhasil disimpan.` });
                setTimeout(() => setFlash(null), 3000);
            },
            onError: () => setFlash({ type: 'error', msg: 'Gagal menyimpan.' }),
            onFinish: () => setSaving(null),
        });
    }, [pendingRoles]);

    const cancelEdit = useCallback((userId) => {
        const original = users.find(u => u.id === userId)?.roles ?? [];
        setPendingRoles(p => ({ ...p, [userId]: original }));
    }, [users]);

    /* Matriks: filter berdasarkan role */
    const matrixFiltered = matrixRole
        ? MODUL_ACCESS.filter(m => m.roles.includes(matrixRole))
        : MODUL_ACCESS;

    const totalRoles    = roles.length;
    const totalUsers    = users.length;
    const noRoleCount   = users.filter(u => u.roles.length === 0).length;
    const multiRoleCount = users.filter(u => u.roles.length > 1).length;

    return (
        <AppLayout title="RBAC & Akses">
            {/* Flash */}
            {flash && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
                    flash.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                        : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
                }`}>
                    {flash.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {flash.msg}
                </div>
            )}

            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">RBAC & Manajemen Akses</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Kelola role dan hak akses seluruh pengguna sistem</p>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Peran', val: totalRoles,   icon: Shield,  color: 'text-sky-600 dark:text-sky-400',     bg: 'bg-sky-50 dark:bg-sky-900/20' },
                        { label: 'Total Pengguna', val: totalUsers, icon: Users,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Tanpa Role',    val: noRoleCount, icon: Unlock, color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
                        { label: 'Multi-Role',    val: multiRoleCount, icon: Lock, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl p-4 flex items-center gap-3 ${s.bg}`}>
                            <s.icon className={`h-5 w-5 shrink-0 ${s.color}`} />
                            <div>
                                <p className={`text-2xl font-black leading-none ${s.color}`}>{s.val}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Role chips overview */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Semua Peran Terdaftar</p>
                    <div className="flex flex-wrap gap-2">
                        {roles.map(r => (
                            <div key={r.id} className="flex items-center gap-1.5">
                                <RoleBadge role={r.name} />
                                <span className="text-xs text-gray-400">{r.users_count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
                    {[
                        { key: 'pengguna', label: 'Pengguna & Role',  icon: UserCog },
                        { key: 'matriks',  label: 'Matriks Akses',    icon: Eye },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                tab === t.key
                                    ? 'bg-white dark:bg-gray-900 text-sky-700 dark:text-sky-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ─── TAB: Pengguna & Role ─── */}
                {tab === 'pengguna' && (
                    <div className="space-y-4">
                        {/* Toolbar */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Cari nama atau email..."
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <span className="text-sm text-gray-400">{filteredUsers.length} pengguna</span>
                        </div>

                        {/* Info */}
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 text-xs text-sky-700 dark:text-sky-400">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>Satu pengguna bisa memiliki lebih dari satu role. Setelah mengubah role, klik <strong>Simpan</strong> untuk menyimpan perubahan.</span>
                        </div>

                        {/* Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                            {/* Header */}
                            <div className="hidden sm:grid grid-cols-[2fr_2fr_3fr_auto] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                <span>Nama</span>
                                <span>Email</span>
                                <span>Role</span>
                                <span>Aksi</span>
                            </div>

                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-sm">Tidak ada pengguna ditemukan.</div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredUsers.map(user => {
                                        const currentRoles = pendingRoles[user.id] ?? [];
                                        const dirty = isDirty(user.id);
                                        const isSaving = saving === user.id;

                                        return (
                                            <div key={user.id} className={`p-4 transition-colors ${dirty ? 'bg-sky-50/50 dark:bg-sky-900/10' : ''}`}>
                                                {/* Desktop grid */}
                                                <div className="hidden sm:grid grid-cols-[2fr_2fr_3fr_auto] gap-4 items-center">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{user.name}</p>
                                                        {user.roles.length === 0 && (
                                                            <span className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                                                                <AlertCircle className="h-3 w-3" /> Tanpa role
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                                                    <RoleMultiSelect
                                                        allRoles={roles}
                                                        selected={currentRoles}
                                                        onChange={val => setPendingRoles(p => ({ ...p, [user.id]: val }))}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        {dirty && (
                                                            <>
                                                                <button
                                                                    onClick={() => saveRoles(user)}
                                                                    disabled={isSaving}
                                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                                                                >
                                                                    {isSaving ? (
                                                                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                                        </svg>
                                                                    ) : <Check className="h-3 w-3" />}
                                                                    Simpan
                                                                </button>
                                                                <button
                                                                    onClick={() => cancelEdit(user.id)}
                                                                    className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {!dirty && user.roles.length > 0 && (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Mobile */}
                                                <div className="sm:hidden space-y-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{user.name}</p>
                                                            <p className="text-xs text-gray-400">{user.email}</p>
                                                        </div>
                                                        {user.roles.length === 0 && (
                                                            <span className="text-xs text-amber-500 flex items-center gap-1 shrink-0">
                                                                <AlertCircle className="h-3 w-3" />Tanpa role
                                                            </span>
                                                        )}
                                                    </div>
                                                    <RoleMultiSelect
                                                        allRoles={roles}
                                                        selected={currentRoles}
                                                        onChange={val => setPendingRoles(p => ({ ...p, [user.id]: val }))}
                                                    />
                                                    {dirty && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => saveRoles(user)}
                                                                disabled={isSaving}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold"
                                                            >
                                                                <Check className="h-3 w-3" /> Simpan
                                                            </button>
                                                            <button onClick={() => cancelEdit(user.id)} className="text-xs text-gray-400 hover:text-gray-600">Batal</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── TAB: Matriks Akses ─── */}
                {tab === 'matriks' && (
                    <div className="space-y-4">
                        {/* Filter role */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">Filter peran:</span>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => setMatrixRole('')}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                        matrixRole === '' ? 'bg-sky-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >Semua Modul</button>
                                {roles.map(r => (
                                    <button
                                        key={r.name}
                                        onClick={() => setMatrixRole(r.name === matrixRole ? '' : r.name)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                            matrixRole === r.name
                                                ? 'bg-sky-600 text-white border-sky-600'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                                        }`}
                                    >{ROLE_LABEL[r.name] ?? r.name}</button>
                                ))}
                            </div>
                        </div>

                        {/* Role access detail card */}
                        {matrixRole && (
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700">
                                        {ROLE_LABEL[matrixRole] ?? matrixRole}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        dapat mengakses{' '}
                                        <span className="font-bold text-gray-900 dark:text-white">{matrixFiltered.length}</span>
                                        {' '}dari {MODUL_ACCESS.length} modul
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {matrixFiltered.map((m, i) => (
                                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800">
                                            <span className="text-base leading-none mt-0.5 shrink-0">{m.icon}</span>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{m.modul}</p>
                                                {m.desc && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{m.desc}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Matrix table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 w-48 shrink-0">Modul / Fitur</th>
                                        {ALL_ROLES.map(r => (
                                            <th key={r} className={`px-2 py-3 text-center font-semibold min-w-16 ${matrixRole === r ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}>
                                                <span className={`inline-block text-[10px] leading-tight ${
                                                    matrixRole === r
                                                        ? 'text-sky-700 dark:text-sky-300 font-bold'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                }`}>{ROLE_LABEL[r] ?? r}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {matrixFiltered.map((m, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 w-48">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base leading-none">{m.icon}</span>
                                                    <div>
                                                        <p className="font-semibold text-xs">{m.modul}</p>
                                                        {m.desc && <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{m.desc}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            {ALL_ROLES.map(r => {
                                                const hasAccess = m.roles.includes(r);
                                                return (
                                                    <td key={r} className={`px-2 py-2.5 text-center ${
                                                        matrixRole === r ? 'bg-sky-50/60 dark:bg-sky-900/10' : ''
                                                    }`}>
                                                        {hasAccess ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 mx-auto" />
                                                        ) : (
                                                            <span className="block h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto" />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                                Punya akses
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 inline-block" />
                                Tidak punya akses
            </div>
                            <div className="flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5" />
                                Klik nama peran di atas untuk highlight kolom
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
