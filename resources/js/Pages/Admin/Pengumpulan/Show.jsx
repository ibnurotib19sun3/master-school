import AppLayout from '@/Layouts/AppLayout';
import { router, usePage, Link } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import {
    ArrowLeft, Users, CheckCircle, Clock, AlertCircle,
    Download, Search, RefreshCw, Calendar,
    FolderUp, Copy, MessageCircle, Bell, X,
} from 'lucide-react';
import { useState, useCallback } from 'react';

/* ── helpers ── */
function fmtDatetime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLES = {
    'Tepat Waktu': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Terlambat':   'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'Belum':       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};
const STATUS_ICON = {
    'Tepat Waktu': CheckCircle,
    'Terlambat':   AlertCircle,
    'Belum':       Clock,
};

/* ── copy helpers ── */
function fmtBatas(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

/* group items by nama guru, sorted A–Z */
function groupByGuru(items) {
    const map = {};
    items.forEach(item => {
        if (!map[item.nama]) map[item.nama] = [];
        map[item.nama].push(item);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'id'));
}

function buildLaporan(pengumpulan, reportItems) {
    const sudah = reportItems.filter(i => i.status !== 'Belum');
    const belum = reportItems.filter(i => i.status === 'Belum');
    const batas = fmtBatas(pengumpulan.batas_waktu);

    const guruSudah  = groupByGuru(sudah);
    const guruBelum  = groupByGuru(belum);
    const totalGuru  = groupByGuru(reportItems).length;

    const lines = [
        `📋 *LAPORAN PENGUMPULAN*`,
        `📝 *${pengumpulan.judul}*`,
        `⏰ Batas: ${batas}`,
        '',
        `✅ *Sudah Mengumpulkan (${sudah.length} slot — ${guruSudah.length} guru):*`,
    ];

    if (guruSudah.length === 0) {
        lines.push('   —');
    } else {
        guruSudah.forEach(([nama, slots], i) => {
            lines.push(`${i + 1}. ${nama}`);
            slots.forEach(slot => {
                const tanda = slot.status === 'Terlambat' ? ' ⚠️ terlambat' : '';
                lines.push(`   • ${slot.mapel} (${slot.rombel})${tanda}`);
            });
        });
    }

    lines.push('');
    lines.push(`❌ *Belum Mengumpulkan (${belum.length} slot — ${guruBelum.length} guru):*`);

    if (guruBelum.length === 0) {
        lines.push('   Semua sudah mengumpulkan 🎉');
    } else {
        guruBelum.forEach(([nama, slots], i) => {
            lines.push(`${i + 1}. ${nama}`);
            slots.forEach(slot => {
                lines.push(`   • ${slot.mapel} (${slot.rombel})`);
            });
        });
    }

    lines.push('');
    lines.push(`📊 *Rekap Guru:* ${guruBelum.length} dari ${totalGuru} guru belum mengumpulkan`);

    return lines.join('\n');
}

function buildPengingat(pengumpulan, reportItems) {
    const belum     = reportItems.filter(i => i.status === 'Belum');
    const batas     = fmtBatas(pengumpulan.batas_waktu);
    const guruBelum = groupByGuru(belum);

    const lines = [
        `⚠️ *PENGINGAT PENGUMPULAN*`,
        `📝 *${pengumpulan.judul}*`,
        `⏰ Batas: ${batas}`,
        '',
        `Guru berikut belum mengumpulkan (${guruBelum.length} guru, ${belum.length} slot):`,
    ];

    guruBelum.forEach(([nama, slots], i) => {
        lines.push(`${i + 1}. ${nama}`);
        slots.forEach(slot => {
            lines.push(`   • ${slot.mapel} (${slot.rombel})`);
        });
    });

    lines.push('');
    lines.push('Mohon segera dikumpulkan sebelum batas waktu. Terima kasih 🙏');

    return lines.join('\n');
}

/* ── Toast ── */
function Toast({ toasts }) {
    return (
        <div className="fixed bottom-5 right-5 z-200 flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto transition-all duration-300 ${
                        t.type === 'success'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 text-white'
                    }`}>
                    {t.type === 'success'
                        ? <CheckCircle className="h-4 w-4 shrink-0" />
                        : <X className="h-4 w-4 shrink-0" />}
                    {t.message}
                </div>
            ))}
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = useState([]);
    const show = useCallback((message, type = 'success', duration = 2500) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }, []);
    return { toasts, show };
}

/* ── clipboard helper: works on HTTP (Laragon) and HTTPS ── */
function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok ? Promise.resolve() : Promise.reject(new Error('Copy gagal'));
}

function CopyBtn({ text, icon: Icon, label, color, onCopied }) {
    const [busy, setBusy] = useState(false);
    const handle = () => {
        if (busy) return;
        setBusy(true);
        copyText(text)
            .then(() => onCopied(true))
            .catch(() => onCopied(false))
            .finally(() => setBusy(false));
    };
    return (
        <button onClick={handle} disabled={busy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${color}`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
        </button>
    );
}

/* ── Stat Card ── */
function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className={`rounded-xl p-4 flex items-center gap-4 ${color}`}>
            <div className="p-2.5 rounded-lg bg-white/60 dark:bg-black/20">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="text-xs mt-1 opacity-70">{label}</p>
            </div>
        </div>
    );
}

/* ── Edit modal ── */
function ModalEdit({ open, onClose, pengumpulan }) {
    const [form, setForm] = useState({
        judul: pengumpulan.judul,
        deskripsi: pengumpulan.deskripsi ?? '',
        batas_waktu: pengumpulan.batas_waktu?.slice(0, 16) ?? '',
        is_aktif: pengumpulan.is_aktif,
    });
    const [busy, setBusy] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setBusy(true);
        router.put(`/admin/pengumpulan/${pengumpulan.id}`, form, {
            onFinish: () => { setBusy(false); onClose(); },
        });
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit Pengumpulan</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul</label>
                        <input type="text" value={form.judul} onChange={e => set('judul', e.target.value)} required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                        <textarea value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batas Waktu</label>
                        <input type="datetime-local" value={form.batas_waktu} onChange={e => set('batas_waktu', e.target.value)} required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_aktif} onChange={e => set('is_aktif', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Aktif (guru bisa melihat & mengupload)</span>
                    </label>
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">Batal</button>
                        <button type="submit" disabled={busy}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 transition-colors">
                            {busy ? 'Menyimpan…' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Main ── */
export default function PengumpulanShow({ pengumpulan, items, stats, filters, reportItems = [] }) {
    const { props } = usePage();
    const flash = props.flash ?? {};
    const { toasts, show: showToast } = useToast();

    const handleCopied = (ok) => showToast(
        ok ? 'Teks berhasil disalin ke clipboard!' : 'Gagal menyalin — coba salin manual.',
        ok ? 'success' : 'error'
    );

    const [showEdit, setShowEdit] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    const applyFilter = useCallback((newSearch, newStatus) => {
        router.get(`/admin/pengumpulan/${pengumpulan.id}`, {
            search: newSearch || undefined,
            status: newStatus || undefined,
        }, { preserveState: true, replace: true });
    }, [pengumpulan.id]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        applyFilter(e.target.value, statusFilter);
    };

    const handleStatus = (s) => {
        const next = statusFilter === s ? '' : s;
        setStatusFilter(next);
        applyFilter(search, next);
    };

    const batasExpired = new Date(pengumpulan.batas_waktu) < new Date();

    return (
        <AppLayout title={pengumpulan.judul}>
            <div className="space-y-6">
                {/* Back + Header */}
                <div className="flex items-start gap-4">
                    <Link href="/admin/pengumpulan"
                        className="mt-0.5 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{pengumpulan.judul}</h1>
                                {pengumpulan.deskripsi && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{pengumpulan.deskripsi}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Batas: {fmtDatetime(pengumpulan.batas_waktu)}
                                        {batasExpired && <span className="ml-1 text-rose-500">(kedaluwarsa)</span>}
                                    </span>
                                    <span>{pengumpulan.tahun_ajaran?.nama}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowEdit(true)}
                                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                Edit
                            </button>
                        </div>
                    </div>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard label="Total Slot" value={stats.total} icon={Users}
                        color="bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300" />
                    <StatCard label="Sudah Upload" value={stats.uploaded} icon={CheckCircle}
                        color="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" />
                    <StatCard label="Belum Upload" value={stats.belum} icon={Clock}
                        color="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" />
                    <StatCard label="Terlambat" value={stats.terlambat} icon={AlertCircle}
                        color="bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300" />
                </div>

                {/* WA Report buttons */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <MessageCircle className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Salin untuk WhatsApp:</span>
                    <CopyBtn
                        text={buildLaporan(pengumpulan, reportItems)}
                        icon={Copy}
                        label="Laporan Lengkap"
                        color="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50"
                        onCopied={handleCopied}
                    />
                    {stats.belum > 0 && (
                        <CopyBtn
                            text={buildPengingat(pengumpulan, reportItems)}
                            icon={Bell}
                            label={`Pengingat Belum (${stats.belum})`}
                            color="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                            onCopied={handleCopied}
                        />
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearch}
                            placeholder="Cari nama guru atau mata pelajaran…"
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    {['Tepat Waktu', 'Terlambat', 'Belum'].map(s => (
                        <button key={s} onClick={() => handleStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                statusFilter === s
                                    ? STATUS_STYLES[s]
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}>
                            {s}
                        </button>
                    ))}
                    {(search || statusFilter) && (
                        <button onClick={() => { setSearch(''); setStatusFilter(''); applyFilter('', ''); }}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <RefreshCw className="h-3.5 w-3.5" /> Reset
                        </button>
                    )}
                </div>

                {/* Table */}
                <Card>
                    <CardBody className="p-0">
                        {items.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                                <FolderUp className="h-9 w-9 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">Tidak ada data yang sesuai filter.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Guru</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Mata Pelajaran</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Rombel</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Tgl Upload</th>
                                            <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">File</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {items.map(item => {
                                            const StatusIcon = STATUS_ICON[item.status] ?? Clock;
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        {item.pembelajaran?.guru?.user?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                        {item.pembelajaran?.mata_pelajaran?.nama ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                        {item.pembelajaran?.rombel?.nama ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] ?? ''}`}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                                                        {fmtDatetime(item.tgl_upload)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {item.file_url ? (
                                                            <a
                                                                href={item.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                                                            >
                                                                <Download className="h-3.5 w-3.5" /> Unduh
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <ModalEdit
                open={showEdit}
                onClose={() => setShowEdit(false)}
                pengumpulan={pengumpulan}
            />

            <Toast toasts={toasts} />
        </AppLayout>
    );
}
