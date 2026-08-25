import { Link, router, usePage } from '@inertiajs/react';
import {
    Menu, Bell, LogOut, UserCog, X, AlertTriangle,
    MessageSquare, FolderUp, Star, CheckCheck, Inbox,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

function LogoutConfirmModal({ show, onCancel, onConfirm }) {
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (show) setLeaving(false);
    }, [show]);

    const handleCancel = () => {
        setLeaving(true);
        setTimeout(onCancel, 300);
    };

    if (!show) return null;

    return (
        <>
            <style>{`
                @keyframes lc-in  { from{opacity:0} to{opacity:1} }
                @keyframes lc-out { from{opacity:1} to{opacity:0} }
                @keyframes lc-card-in  { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
                @keyframes lc-card-out { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(12px) scale(.97)} }
            `}</style>
            <div
                className="fixed inset-0 z-9998 bg-black/40 backdrop-blur-[3px]"
                style={{ animation: `${leaving ? 'lc-out' : 'lc-in'} 0.3s ease forwards` }}
                onClick={handleCancel}
            />
            <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none">
                <div
                    className="pointer-events-auto w-full max-w-xs mx-4"
                    style={{ animation: `${leaving ? 'lc-card-out 0.3s ease forwards' : 'lc-card-in 0.4s cubic-bezier(0.34,1.4,0.64,1) forwards'}` }}
                >
                    <div className="rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10">
                        <div className="relative bg-linear-to-br from-rose-500 to-red-600 px-6 pt-8 pb-11 overflow-hidden text-center">
                            <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/10" />
                            <div className="absolute -bottom-8 -left-6 w-32 h-32 rounded-full bg-white/10" />
                            <div className="relative mx-auto w-14 h-14 rounded-full bg-white/20 ring-4 ring-white/30 flex items-center justify-center mb-3">
                                <LogOut className="h-6 w-6 text-white" strokeWidth={2.5} />
                            </div>
                            <p className="relative text-white/70 text-xs font-semibold uppercase tracking-[0.15em]">Konfirmasi</p>
                        </div>
                        <div className="relative -mt-5 rounded-t-3xl bg-white dark:bg-gray-900 px-6 pt-5 pb-6 text-center">
                            <p className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight">Keluar dari sesi?</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 leading-relaxed">
                                Anda harus login kembali<br />untuk mengakses sistem.
                            </p>
                            <div className="flex gap-2.5 mt-6">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all duration-150"
                                >Batal</button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-sm font-semibold transition-all duration-150 shadow-md shadow-rose-500/30"
                                >Ya, Keluar</button>
                            </div>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/15 transition-colors"
                        ><X className="h-4 w-4" /></button>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Notification items config                                            */
/* ------------------------------------------------------------------ */
function buildNotifItems(notifikasi, roles) {
    if (!notifikasi) return [];
    const isGuru  = roles?.includes('guru') || notifikasi.catatan_kepsek > 0 || notifikasi.pengumpulan > 0;
    const isAdmin = roles?.some(r => ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'].includes(r));
    const items = [];

    if (isGuru && notifikasi.catatan_kepsek > 0) {
        items.push({
            key:   'catatan',
            icon:  MessageSquare,
            color: 'text-orange-500',
            bg:    'bg-orange-50 dark:bg-orange-900/20',
            label: 'Catatan Kepsek',
            desc:  `${notifikasi.catatan_kepsek} catatan belum dibaca`,
            href:  '/guru/catatan-kepsek',
        });
    }
    if (isGuru && notifikasi.pengumpulan > 0) {
        items.push({
            key:   'pengumpulan',
            icon:  FolderUp,
            color: 'text-blue-500',
            bg:    'bg-blue-50 dark:bg-blue-900/20',
            label: 'Pengumpulan Tugas',
            desc:  `${notifikasi.pengumpulan} tugas belum dinilai`,
            href:  '/guru/pengumpulan',
        });
    }
    if (isAdmin && notifikasi.kpi > 0) {
        items.push({
            key:   'kpi',
            icon:  Star,
            color: 'text-purple-500',
            bg:    'bg-purple-50 dark:bg-purple-900/20',
            label: 'Laporan KPI',
            desc:  `${notifikasi.kpi} laporan menunggu penilaian`,
            href:  '/admin/kpi',
        });
    }
    if (roles?.includes('super_admin') && notifikasi.masukan > 0) {
        items.push({
            key:   'masukan',
            icon:  Inbox,
            color: 'text-amber-500',
            bg:    'bg-amber-50 dark:bg-amber-900/20',
            label: 'Masukan',
            desc:  `${notifikasi.masukan} masukan baru dari pengguna`,
            href:  '/admin/masukan',
        });
    }
    return items;
}

export default function Navbar({ onMenuClick }) {
    const { props }   = usePage();
    const user        = props.auth?.user;
    const notifikasi  = props.notifikasi;

    const [dropdownOpen,      setDropdownOpen]      = useState(false);
    const [notifOpen,         setNotifOpen]         = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const dropdownRef = useRef(null);
    const notifRef    = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (!dropdownRef.current?.contains(e.target)) setDropdownOpen(false);
            if (!notifRef.current?.contains(e.target))    setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        setDropdownOpen(false);
        setShowLogoutConfirm(true);
    };

    const notifItems = buildNotifItems(notifikasi, user?.roles);
    const totalCount = notifikasi?.total ?? 0;

    return (
        <>
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-200/70 dark:border-white/6 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl px-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden rounded-xl p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/6 transition-colors"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="flex-1" />

                <div className="relative flex items-center gap-2">
                    <ThemeToggle />

                    {/* Notification bell */}
                    <div ref={notifRef}>
                        <button
                            onClick={() => setNotifOpen(!notifOpen)}
                            className="rounded-xl p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/6 transition-colors relative"
                        >
                            <Bell className="h-5 w-5" />
                            {totalCount > 0 && (
                                <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                                    {totalCount > 99 ? '99+' : totalCount}
                                </span>
                            )}
                        </button>

                        {notifOpen && (
                            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/8 shadow-xl shadow-black/6 dark:shadow-black/40 z-50 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/6 bg-gray-50/50 dark:bg-white/2">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                        <Bell className="h-3.5 w-3.5 text-gray-400" />
                                        Notifikasi
                                    </span>
                                    {totalCount > 0 && (
                                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                                            {totalCount} baru
                                        </span>
                                    )}
                                </div>

                                {/* Items */}
                                {notifItems.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 text-gray-400 dark:text-gray-500">
                                        <CheckCheck className="h-8 w-8 mb-2 opacity-40" />
                                        <p className="text-xs">Tidak ada notifikasi baru</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50 dark:divide-white/5">
                                        {notifItems.map(item => {
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.key}
                                                    href={item.href}
                                                    onClick={() => setNotifOpen(false)}
                                                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${item.bg}`}>
                                                        <Icon className={`h-4 w-4 ${item.color}`} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{item.label}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-white/6 transition-colors"
                        >
                            <img
                                src={user?.avatar_url}
                                alt={user?.name}
                                className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-white/10"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? '?')}&background=0284c7&color=fff&bold=true&size=64`;
                                }}
                            />
                            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name?.split(' ')[0]}</span>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/8 shadow-xl shadow-black/6 dark:shadow-black/40 z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/6 bg-gray-50/50 dark:bg-white/2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                                </div>
                                <Link
                                    href="/profile"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <UserCog className="h-4 w-4 text-gray-400" />
                                    Profil Saya
                                </Link>
                                <div className="border-t border-gray-100 dark:border-white/6">
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/8 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Keluar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <LogoutConfirmModal
                show={showLogoutConfirm}
                onCancel={() => setShowLogoutConfirm(false)}
                onConfirm={() => router.post('/logout')}
            />
        </>
    );
}
