import AppLayout from '@/Layouts/AppLayout';
import { router, usePage, Link } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import {
    ArrowLeft, Users, CheckCircle, Clock, AlertCircle,
    Download, Search, RefreshCw, Calendar,
    FolderUp, Copy, MessageCircle, Bell, X,
    ArchiveIcon, LockOpen, Lock,
} from 'lucide-react';
import { useState, useCallback } from 'react';

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

function fmtBatas(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

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
    const guruSudah = groupByGuru(sudah);
    const guruBelum = groupByGuru(belum);
    const totalGuru = groupByGuru(reportItems).length;

    const lines = [
        `📋 *LAPORAN PENGUMPULAN*`, `📝 *${pengumpulan.judul}*`, `⏰ Batas: ${batas}`, '',
        `✅ *Sudah Mengumpulkan (${sudah.length} slot — ${guruSudah.length} guru):*`,
    ];
    if (guruSudah.length === 0) { lines.push('   —'); }
    else guruSudah.forEach(([nama, slots], i) => {
        lines.push(`${i + 1}. ${nama}`);
        slots.forEach(s => lines.push(`   • ${s.mapel} (${s.rombel})${s.status === 'Terlambat' ? ' ⚠️ terlambat' : ''}`));
    });
    lines.push('', `❌ *Belum Mengumpulkan (${belum.length} slot — ${guruBelum.length} guru):*`);
    if (guruBelum.length === 0) lines.push('   Semua sudah mengumpulkan 🎉');
    else guruBelum.forEach(([nama, slots], i) => {
        lines.push(`${i + 1}. ${nama}`);
        slots.forEach(s => lines.push(`   • ${s.mapel} (${s.rombel})`));
    });
    lines.push('', `📊 *Rekap Guru:* ${guruBelum.length} dari ${totalGuru} guru belum mengumpulkan`);
    return lines.join('\n');
}

function buildPengingat(pengumpulan, reportItems) {
    const belum = reportItems.filter(i => i.status === 'Belum');
    const batas = fmtBatas(pengumpulan.batas_waktu);
    const guruBelum = groupByGuru(belum);
    const lines = [
        `⚠️ *PENGINGAT PENGUMPULAN*`, `📝 *${pengumpulan.judul}*`, `⏰ Batas: ${batas}`, '',
        `Guru berikut belum mengumpulkan (${guruBelum.length} guru, ${belum.length} slot):`,
    ];
    guruBelum.forEach(([nama, slots], i) => {
        lines.push(`${i + 1}. ${nama}`);
        slots.forEach(s => lines.push(`   • ${s.mapel} (${s.rombel})`));
    });
    lines.push('', 'Mohon segera dikumpulkan sebelum batas waktu. Terima kasih 🙏');
    return lines.join('\n');
}

function Toast({ toasts }) {
    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto ${
                    t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}>
                    {t.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
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

function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(el); el.focus(); el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok ? Promise.resolve() : Promise.reject(new Error('Copy gagal'));
}

function CopyBtn({ text, icon: Icon, label, color, onCopied }) {
    const [busy, setBusy] = useState(false);
    const handle = () => {
        if (busy) return; setBusy(true);
        copyText(text).then(() => onCopied(true)).catch(() => onCopied(false)).finally(() => setBusy(false));
    };
    return (
        <button onClick={handle} disabled={busy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${color}`}>
            <Icon className="h-3.5 w-3.5" />{label}
        </button>
    );
}

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

/* ── Portal toggle per item ── */
function PortalToggle({ item, pengumpulan, expired }) {
    const [busy, setBusy] = useState(false);

    if (!expired || item.file_path) return null;

    // portal_buka sudah dihitung dari server
    const isOpen = item.portal_buka;

    const toggle = () => {
        if (busy) return;
        setBusy(true);
        router.post(`/admin/pengumpulan/item/${item.id}/toggle-portal`, { open: !isOpen }, {
            onFinish: () => setBusy(false),
            preserveScroll: true,
        });
    };

    return (
        <button
            onClick={toggle}
            disabled={busy}
            title={isOpen ? 'Tutup portal upload' : 'Buka portal upload'}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${
                isOpen
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
            }`}
        >
            {isOpen ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {isOpen ? 'Terbuka' : 'Tertutup'}
        </button>
    );
}

/* ── Format labels (edit modal) ── */
const FORMAT_OPTIONS = [
    { key: 'pdf',   label: 'PDF',        color: 'rose' },
    { key: 'word',  label: 'Word',       color: 'sky' },
    { key: 'excel', label: 'Excel',      color: 'emerald' },
    { key: 'ppt',   label: 'PowerPoint', color: 'orange' },
    { key: 'image', label: 'Gambar',     color: 'violet' },
    { key: 'zip',   label: 'ZIP',        color: 'amber' },
];
const FORMAT_COLOR_MAP = {
    rose:    'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-900/20 dark:text-rose-300',
    sky:     'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-900/20 dark:text-sky-300',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-300',
    orange:  'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-900/20 dark:text-orange-300',
    violet:  'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-900/20 dark:text-violet-300',
    amber:   'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-300',
};
const FORMAT_ACTIVE_MAP = {
    rose:    'border-rose-500 bg-rose-500 text-white dark:border-rose-400 dark:bg-rose-500',
    sky:     'border-sky-500 bg-sky-500 text-white dark:border-sky-400 dark:bg-sky-500',
    emerald: 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-500',
    orange:  'border-orange-500 bg-orange-500 text-white dark:border-orange-400 dark:bg-orange-500',
    violet:  'border-violet-500 bg-violet-500 text-white dark:border-violet-400 dark:bg-violet-500',
    amber:   'border-amber-500 bg-amber-500 text-white dark:border-amber-400 dark:bg-amber-500',
};

function Toggle({ checked, onChange, id }) {
    return (
        <button type="button" role="switch" aria-checked={checked} id={id}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                checked ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
        >
            <span className={`pointer-events-none inline-block h-4.5 w-4.5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
                checked ? 'translate-x-5' : 'translate-x-0.5'
            }`} style={{ height: '18px', width: '18px' }} />
        </button>
    );
}

/* ── Edit modal ── */
function ModalEdit({ open, onClose, pengumpulan }) {
    const [form, setForm] = useState({
        judul: pengumpulan.judul,
        deskripsi: pengumpulan.deskripsi ?? '',
        batas_waktu: pengumpulan.batas_waktu?.slice(0, 16) ?? '',
        is_aktif: pengumpulan.is_aktif,
        allow_late_upload: pengumpulan.allow_late_upload ?? true,
        format_file: pengumpulan.format_file ?? [],
    });
    const [busy, setBusy] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const toggleFormat = (key) => {
        set('format_file', form.format_file.includes(key)
            ? form.format_file.filter(k => k !== key)
            : [...form.format_file, key]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault(); setBusy(true);
        router.put(`/admin/pengumpulan/${pengumpulan.id}`, form, {
            onFinish: () => { setBusy(false); onClose(); },
        });
    };

    const isExpired = pengumpulan.batas_waktu && new Date(pengumpulan.batas_waktu) < new Date();

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 bg-linear-to-r from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-800/50">
                            <FolderUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Edit Pengumpulan</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-64">{pengumpulan.judul}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">

                            {/* Kolom kiri — info dasar */}
                            <div className="px-6 py-5 space-y-4">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Informasi Dasar</p>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Judul Pengumpulan</label>
                                    <input type="text" value={form.judul} onChange={e => set('judul', e.target.value)} required
                                        placeholder="Misal: Perangkat Pembelajaran Semester 1"
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors placeholder-gray-400" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Deskripsi <span className="text-gray-400 font-normal">(opsional)</span></label>
                                    <textarea value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)} rows={3}
                                        placeholder="Keterangan tambahan untuk guru…"
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors resize-none placeholder-gray-400" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" /> Batas Waktu Upload
                                        </span>
                                    </label>
                                    <input type="datetime-local" value={form.batas_waktu} onChange={e => set('batas_waktu', e.target.value)} required
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors" />
                                    {isExpired && (
                                        <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> Batas waktu sudah terlewati
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Kolom kanan — pengaturan */}
                            <div className="px-6 py-5 space-y-5">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pengaturan</p>

                                {/* Status aktif */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <label htmlFor="toggle-aktif" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">Status Aktif</label>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Guru dapat melihat dan mengupload file</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xs font-medium ${form.is_aktif ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                            {form.is_aktif ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        <Toggle id="toggle-aktif" checked={form.is_aktif} onChange={v => set('is_aktif', v)} />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-800" />

                                {/* Allow late upload */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <label htmlFor="toggle-late" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">Upload Terlambat</label>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Izinkan upload setelah batas waktu</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xs font-medium ${form.allow_late_upload ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'}`}>
                                            {form.allow_late_upload ? 'Diizinkan' : 'Ditutup'}
                                        </span>
                                        <Toggle id="toggle-late" checked={form.allow_late_upload} onChange={v => set('allow_late_upload', v)} />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-800" />

                                {/* Format file */}
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Format File Diizinkan</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                                        {form.format_file.length === 0 ? 'Semua format diterima' : `${form.format_file.length} format dipilih`}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {FORMAT_OPTIONS.map(opt => {
                                            const active = form.format_file.includes(opt.key);
                                            return (
                                                <button key={opt.key} type="button"
                                                    onClick={() => toggleFormat(opt.key)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                                        active ? FORMAT_ACTIVE_MAP[opt.color] : FORMAT_COLOR_MAP[opt.color]
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {form.format_file.length === 0 && (
                                        <p className="text-xs text-gray-400 mt-2 italic">Kosongkan untuk menerima semua format</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 shrink-0 bg-gray-50/80 dark:bg-gray-800/40">
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            {form.is_aktif ? (
                                <span className="flex items-center gap-1 text-emerald-500"><CheckCircle className="h-3.5 w-3.5" /> Pengumpulan aktif</span>
                            ) : (
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Nonaktif — tidak tampil untuk guru</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                Batal
                            </button>
                            <button type="submit" disabled={busy}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 transition-colors flex items-center gap-2">
                                {busy ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Menyimpan…</> : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Download progress overlay ── */
function DownloadProgressOverlay({ pct, total }) {
    const done = pct >= 100;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl w-80 flex flex-col gap-5">
                {/* Icon + title */}
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl transition-colors ${done ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-sky-100 dark:bg-sky-900/40'}`}>
                        <ArchiveIcon className={`h-5 w-5 ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`} />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {done ? 'Selesai!' : 'Menyiapkan ZIP…'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {done ? 'File sedang diunduh' : `${total} file sedang dikompres`}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden ${
                                done ? 'bg-emerald-500' : 'bg-sky-500'
                            }`}
                            style={{ width: `${pct}%` }}
                        >
                            {/* Shimmer bergerak */}
                            {!done && (
                                <div className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.4s linear infinite',
                                    }}
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            {done ? 'Download dimulai…' : 'Harap tunggu…'}
                        </span>
                        <span className={`text-sm font-bold tabular-nums ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
                            {pct}%
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

/* ── Main ── */
export default function PengumpulanShow({ pengumpulan, items, stats, filters, reportItems = [] }) {
    const { props } = usePage();
    const flash = props.flash ?? {};
    const { toasts, show: showToast } = useToast();

    const handleCopied = (ok) => showToast(
        ok ? 'Teks berhasil disalin!' : 'Gagal menyalin — coba salin manual.', ok ? 'success' : 'error'
    );

    const [showEdit, setShowEdit] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const [downloadPct, setDownloadPct] = useState(0);
    const [showDownload, setShowDownload] = useState(false);

    const handleDownloadAll = async () => {
        setDownloadPct(0);
        setShowDownload(true);

        // Animasi fake progress 0 → 88% selama server memproses
        let cur = 0;
        const timer = setInterval(() => {
            cur += (Math.random() * 4 + 1) * (1 - cur / 100);
            if (cur >= 88) { cur = 88; clearInterval(timer); }
            setDownloadPct(Math.round(cur));
        }, 180);

        try {
            const resp = await fetch(`/admin/pengumpulan/${pengumpulan.id}/download-all`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            clearInterval(timer);
            setDownloadPct(100);

            const blob      = await resp.blob();
            const url       = URL.createObjectURL(blob);
            const safeJudul = pengumpulan.judul.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
            const a         = document.createElement('a');
            a.href          = url;
            a.download      = `${safeJudul}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setTimeout(() => { setShowDownload(false); setDownloadPct(0); }, 900);
        } catch {
            clearInterval(timer);
            setShowDownload(false);
            setDownloadPct(0);
        }
    };

    const applyFilter = useCallback((newSearch, newStatus) => {
        router.get(`/admin/pengumpulan/${pengumpulan.id}`, {
            search: newSearch || undefined, status: newStatus || undefined,
        }, { preserveState: true, replace: true });
    }, [pengumpulan.id]);

    const handleSearch = (e) => { setSearch(e.target.value); applyFilter(e.target.value, statusFilter); };
    const handleStatus = (s) => { const next = statusFilter === s ? '' : s; setStatusFilter(next); applyFilter(search, next); };

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
                                    {!pengumpulan.allow_late_upload && batasExpired && (
                                        <span className="inline-flex items-center gap-1 text-rose-500">
                                            <Lock className="h-3 w-3" /> Portal upload ditutup
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {/* Download semua */}
                                {stats.uploaded > 0 && (
                                    <button
                                        onClick={handleDownloadAll}
                                        disabled={showDownload}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 transition-colors"
                                    >
                                        <ArchiveIcon className="h-3.5 w-3.5" />
                                        Unduh Semua ({stats.uploaded})
                                    </button>
                                )}
                                <button onClick={() => setShowEdit(true)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

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

                {/* WA Report */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <MessageCircle className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Salin untuk WhatsApp:</span>
                    <CopyBtn
                        text={buildLaporan(pengumpulan, reportItems)}
                        icon={Copy} label="Laporan Lengkap"
                        color="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100"
                        onCopied={handleCopied}
                    />
                    {stats.belum > 0 && (
                        <CopyBtn
                            text={buildPengingat(pengumpulan, reportItems)}
                            icon={Bell} label={`Pengingat Belum (${stats.belum})`}
                            color="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100"
                            onCopied={handleCopied}
                        />
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" value={search} onChange={handleSearch}
                            placeholder="Cari nama guru atau mata pelajaran…"
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    {['Tepat Waktu', 'Terlambat', 'Belum'].map(s => (
                        <button key={s} onClick={() => handleStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                statusFilter === s ? STATUS_STYLES[s] : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                                            {batasExpired && !pengumpulan.allow_late_upload && (
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Portal</th>
                                            )}
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
                                                    {batasExpired && !pengumpulan.allow_late_upload && (
                                                        <td className="px-4 py-3">
                                                            <PortalToggle item={item} pengumpulan={pengumpulan} expired={batasExpired} />
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-right">
                                                        {item.file_url ? (
                                                            <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
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

            <ModalEdit open={showEdit} onClose={() => setShowEdit(false)} pengumpulan={pengumpulan} />
            <Toast toasts={toasts} />
            {showDownload && <DownloadProgressOverlay pct={downloadPct} total={stats.uploaded} />}
        </AppLayout>
    );
}
