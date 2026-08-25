import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Search, KeyRound, FileSpreadsheet, Users, GraduationCap, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ToggleLeft, ToggleRight, Wifi } from 'lucide-react';
import { useState, useCallback } from 'react';

function UserAvatar({ name, src, className = '', isOnline = false }) {
    const [err, setErr] = useState(false);
    const initials = (name ?? '?')
        .split(' ').filter(Boolean).slice(0, 2)
        .map(w => w[0].toUpperCase()).join('');
    const dot = isOnline ? (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-800 shadow-sm" />
    ) : null;
    return (
        <span className="relative inline-flex shrink-0">
            {(!src || err)
                ? <div className={`rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 flex items-center justify-center font-semibold select-none ${className}`}>{initials}</div>
                : <img src={src} alt={name} onError={() => setErr(true)} className={`rounded-full object-cover ${className}`} />
            }
            {dot}
        </span>
    );
}

const roleColors = {
    super_admin: 'sky', kepala_sekolah: 'sky', wakasek_kurikulum: 'sky',
    wakasek_kesiswaan: 'sky', guru: 'green', siswa: 'yellow', orang_tua: 'gray',
    tatausaha: 'teal', kepala_tatausaha: 'teal', guru_piket: 'teal',
};

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

function Pagination({ users, filters }) {
    const { current_page, last_page, from, to, total, links } = users;

    const go = (page) => {
        if (page < 1 || page > last_page) return;
        router.get('/admin/users', { ...filters, page }, { preserveState: true, replace: true });
    };

    if (last_page <= 1) return null;

    // Show at most 5 page links around current page
    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, current_page - delta); i <= Math.min(last_page, current_page + delta); i++) {
        pages.push(i);
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
                Menampilkan <span className="font-medium text-gray-700 dark:text-gray-300">{from}–{to}</span> dari <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> data
            </p>
            <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                    onClick={() => go(current_page - 1)}
                    disabled={current_page === 1}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {pages[0] > 1 && (
                    <>
                        <button onClick={() => go(1)} className="px-3 py-1.5 text-sm rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">1</button>
                        {pages[0] > 2 && <span className="px-1 text-gray-400 text-sm">…</span>}
                    </>
                )}

                {pages.map((p) => (
                    <button
                        key={p}
                        onClick={() => go(p)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                            p === current_page
                                ? 'bg-sky-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        {p}
                    </button>
                ))}

                {pages[pages.length - 1] < last_page && (
                    <>
                        {pages[pages.length - 1] < last_page - 1 && <span className="px-1 text-gray-400 text-sm">…</span>}
                        <button onClick={() => go(last_page)} className="px-3 py-1.5 text-sm rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">{last_page}</button>
                    </>
                )}

                <button
                    onClick={() => go(current_page + 1)}
                    disabled={current_page === last_page}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default function UsersIndex({ users, filters, onlineUsers = [] }) {
    const [resetTarget,  setResetTarget]  = useState(null);
    const [toggleTarget, setToggleTarget] = useState(null);

    const doToggle = () => {
        if (!toggleTarget) return;
        router.patch(`/admin/users/${toggleTarget.id}/toggle-active`, {}, {
            onSuccess: () => setToggleTarget(null),
        });
    };

    const activeTab   = filters.tab ?? 'staff';
    const perPage     = filters.per_page ?? 15;
    const sortField   = filters.sort ?? 'created_at';
    const sortDir     = filters.direction ?? 'asc';

    const navigate = useCallback((params) => {
        router.get('/admin/users', { ...filters, page: 1, ...params }, { preserveState: true, replace: true });
    }, [filters]);

    const onSort = (field) => {
        if (sortField === field) {
            navigate({ sort: field, direction: sortDir === 'asc' ? 'desc' : 'asc' });
        } else {
            navigate({ sort: field, direction: 'asc' });
        }
    };

    const onSearch = (e) => navigate({ search: e.target.value });
    const onTab    = (tab) => navigate({ tab, search: '', role: '' });
    const onPerPage = (e) => navigate({ per_page: e.target.value });

    const tabs = [
        { key: 'staff',  label: 'Pegawai / Tenaga Kependidikan', icon: Users },
        { key: 'murid',  label: 'Murid',                         icon: GraduationCap },
    ];

    return (
        <AppLayout title="Manajemen Pengguna">
            {/* ── Panel Online Sekarang ── */}
            <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        Online
                    </span>
                    <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                        {onlineUsers.length}
                    </span>
                </div>
                {onlineUsers.length === 0 ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 italic">Belum ada pengguna yang aktif dalam 5 menit terakhir.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {onlineUsers.map((u) => (
                            <div key={u.id} className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-full pl-1 pr-2.5 py-0.5 border border-emerald-200 dark:border-emerald-700 shadow-sm">
                                <UserAvatar name={u.name} src={u.avatar_url} className="h-5 w-5 text-[9px]" isOnline />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{u.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Tab switcher ── */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit mb-4">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => onTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === key
                                ? 'bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-300 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle>
                        {activeTab === 'staff' ? 'Pegawai / Tenaga Kependidikan' : 'Murid'}
                        <span className="ml-2 text-sm font-normal text-gray-400">({users.total})</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Per-page selector */}
                        <select
                            value={perPage}
                            onChange={onPerPage}
                            className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                            {PER_PAGE_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n} / halaman</option>
                            ))}
                        </select>

                        {/* Search */}
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                defaultValue={filters.search}
                                onChange={onSearch}
                                placeholder="Cari pengguna..."
                                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 w-full sm:w-56 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                        </div>

                        <a
                            href={`/admin/users-export?tab=${activeTab}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shrink-0"
                            title="Export Excel"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Export
                        </a>
                    </div>
                </CardHeader>

                <CardBody className="p-0">
                    {users.data.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
                            Tidak ada data pengguna ditemukan.
                        </div>
                    ) : (
                        <>
                            {/* Mobile card view */}
                            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {users.data.map((user) => (
                                    <div key={user.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <UserAvatar name={user.name} src={user.avatar_url} className="h-9 w-9 shrink-0 mt-0.5 text-sm" isOnline={user.is_online} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                                    {user.username && <p className="text-xs text-gray-400">@{user.username}</p>}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => setToggleTarget(user)}
                                                        className={`rounded-lg p-1.5 transition-colors ${
                                                            user.is_active
                                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                                                                : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                                                        }`}
                                                        title={user.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                                                    >
                                                        {user.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setResetTarget(user)}
                                                        className="rounded-lg p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                                                        title="Reset password"
                                                    >
                                                        <KeyRound className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                {user.roles.map((r) => (
                                                    <Badge key={r.name} color={roleColors[r.name] ?? 'gray'}>
                                                        {r.name.replace(/_/g, ' ')}
                                                    </Badge>
                                                ))}
                                                <Badge color={user.is_active ? 'green' : 'red'}>
                                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="overflow-x-auto hidden sm:block">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">
                                                <button
                                                    onClick={() => onSort('name')}
                                                    className="inline-flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group"
                                                >
                                                    Nama
                                                    {sortField === 'name'
                                                        ? sortDir === 'asc'
                                                            ? <ArrowUp className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                                                            : <ArrowDown className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                                                        : <ArrowUpDown className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 group-hover:text-sky-400" />
                                                    }
                                                </button>
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">Email</th>
                                            <th className="px-4 py-3 text-left font-medium">Username</th>
                                            <th className="px-4 py-3 text-left font-medium">Role</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                            <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {users.data.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar name={user.name} src={user.avatar_url} className="h-8 w-8 shrink-0 text-xs" isOnline={user.is_online} />
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.username ?? '–'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.map((r) => (
                                                            <Badge key={r.name} color={roleColors[r.name] ?? 'gray'}>
                                                                {r.name.replace(/_/g, ' ')}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge color={user.is_active ? 'green' : 'red'}>
                                                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => setToggleTarget(user)}
                                                            className={`rounded-lg p-1.5 transition-colors ${
                                                                user.is_active
                                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                                                                    : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                                                            }`}
                                                            title={user.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                                                        >
                                                            {user.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => setResetTarget(user)}
                                                            className="rounded-lg p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                                                            title="Reset password ke default"
                                                        >
                                                            <KeyRound className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    <Pagination users={users} filters={filters} />
                </CardBody>
            </Card>

            <ConfirmDialog
                show={!!resetTarget}
                title="Reset Password"
                message={`Password "${resetTarget?.name}" akan direset ke default "apikmasdjurnal". Lanjutkan?`}
                confirmLabel="Ya, Reset"
                confirmVariant="warning"
                onConfirm={() => { router.post(`/admin/users/${resetTarget.id}/reset-password`); setResetTarget(null); }}
                onCancel={() => setResetTarget(null)}
            />

            <ConfirmDialog
                show={!!toggleTarget}
                title={toggleTarget?.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                message={
                    toggleTarget?.is_active
                        ? `Akun "${toggleTarget?.name}" akan dinonaktifkan dan tidak bisa login. Lanjutkan?`
                        : `Akun "${toggleTarget?.name}" akan diaktifkan kembali. Lanjutkan?`
                }
                confirmLabel={toggleTarget?.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
                confirmVariant={toggleTarget?.is_active ? 'danger' : 'primary'}
                onConfirm={doToggle}
                onCancel={() => setToggleTarget(null)}
            />
        </AppLayout>
    );
}
