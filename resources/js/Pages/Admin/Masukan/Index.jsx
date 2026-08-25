import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import {
    Inbox, Search, X, Check, Clock, User,
    ArrowLeft, Send, Shield,
} from 'lucide-react';

const KATEGORI_LIST = ['Saran', 'Bug/Error', 'Pertanyaan', 'Lainnya'];
const STATUS_LIST   = ['Baru', 'Dibaca', 'Ditindaklanjuti'];

const KATEGORI_STYLE = {
    'Saran':      { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    'Bug/Error':  { bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-300',         dot: 'bg-red-500' },
    'Pertanyaan': { bg: 'bg-sky-100 dark:bg-sky-900/30',         text: 'text-sky-700 dark:text-sky-300',         dot: 'bg-sky-500' },
    'Lainnya':    { bg: 'bg-gray-100 dark:bg-gray-800',          text: 'text-gray-600 dark:text-gray-400',       dot: 'bg-gray-400' },
};

const STATUS_STYLE = {
    'Baru':             { bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-300',    dot: 'bg-amber-500' },
    'Dibaca':           { bg: 'bg-sky-100 dark:bg-sky-900/30',        text: 'text-sky-700 dark:text-sky-300',        dot: 'bg-sky-500' },
    'Ditindaklanjuti':  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
};

function KategoriBadge({ kategori }) {
    const s = KATEGORI_STYLE[kategori] ?? KATEGORI_STYLE['Lainnya'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {kategori}
        </span>
    );
}

function StatusBadge({ status }) {
    const s = STATUS_STYLE[status] ?? STATUS_STYLE['Baru'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {status}
        </span>
    );
}

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)   return 'baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Thread bubble ── */
function Bubble({ msg, isAdmin }) {
    if (isAdmin) {
        return (
            <div className="flex justify-end">
                <div className="max-w-[85%]">
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                        <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>
                        <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-sky-500" />
                            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Admin</span>
                        </div>
                    </div>
                    <div className="bg-sky-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.isi}</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="flex justify-start">
            <div className="max-w-[85%]">
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {msg.user?.name ?? 'Pengguna'}
                    </span>
                    <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.isi}</p>
                </div>
            </div>
        </div>
    );
}

/* ── Detail panel ── */
function DetailPanel({ item, onClose }) {
    const { data, setData, patch, processing } = useForm({
        status:        item.status,
        catatan_admin: '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(`/admin/masukan/${item.id}/status`, {
            preserveScroll: true,
            onSuccess: () => setData('catatan_admin', ''),
        });
    };

    const balasan = item.balasan ?? [];

    return (
        <div className="flex flex-col h-full">
            {/* ── Header (always visible) ── */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 shrink-0">
                <button
                    onClick={onClose}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate block">{item.judul}</span>
                </div>
                <StatusBadge status={item.status} />
            </div>

            {/* ── Scrollable conversation area ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <KategoriBadge kategori={item.kategori} />
                    <span>·</span>
                    <User className="h-3.5 w-3.5" />
                    <span className="font-medium text-gray-600 dark:text-gray-300">{item.user?.name ?? '—'}</span>
                    <span>{item.user?.email}</span>
                    <span>·</span>
                    <Clock className="h-3 w-3" />
                    <span>{timeAgo(item.created_at)}</span>
                </div>

                {/* Original message */}
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Pesan Asli</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{item.isi}</p>
                </div>

                {/* Thread */}
                {balasan.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">
                            — Percakapan ({balasan.length} pesan) —
                        </p>
                        {balasan.map(b => (
                            <Bubble key={b.id} msg={b} isAdmin={b.is_admin} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Sticky action area (always visible at bottom) ── */}
            <form
                onSubmit={submit}
                className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3"
            >
                {/* Status */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Ubah Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {STATUS_LIST.map(s => {
                            const style = STATUS_STYLE[s];
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setData('status', s)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                        data.status === s
                                            ? `${style.bg} ${style.text} border-transparent ring-2 ring-offset-1 ring-sky-400`
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400'
                                    }`}
                                >
                                    {data.status === s && <Check className="h-3 w-3" />}
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Catatan / balasan */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Balas / Catatan <span className="font-normal text-gray-400">(opsional)</span>
                    </label>
                    <textarea
                        value={data.catatan_admin}
                        onChange={e => setData('catatan_admin', e.target.value)}
                        placeholder="Tulis balasan atau catatan tindak lanjut..."
                        rows={3}
                        maxLength={1000}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                    {processing ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                    ) : <Send className="h-4 w-4" />}
                    Simpan &amp; Kirim
                </button>
            </form>
        </div>
    );
}

/* ── Main Page ── */
export default function MasukanIndex({ masukan, counts, filters }) {
    const [selectedId, setSelectedId] = useState(null);
    const [localFilters, setLocalFilters] = useState(filters);

    const applyFilter = useCallback((next) => {
        setLocalFilters(next);
        router.get('/admin/masukan', next, { preserveScroll: true, preserveState: true });
    }, []);

    const items = masukan.data ?? [];
    const selected = items.find(i => i.id === selectedId) ?? null;

    return (
        <AppLayout title="Masukan & Laporan">
            <div className="space-y-5">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                        <Inbox className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Masukan & Laporan</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Masukan dari seluruh pengguna sistem</p>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total',           val: counts.total,           color: 'text-gray-700 dark:text-gray-300',       bg: 'bg-gray-50 dark:bg-gray-800/60' },
                        { label: 'Baru',            val: counts.baru,            color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20' },
                        { label: 'Dibaca',          val: counts.dibaca,          color: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-50 dark:bg-sky-900/20' },
                        { label: 'Ditindaklanjuti', val: counts.ditindaklanjuti, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
                            <p className={`text-2xl font-black leading-none ${s.color}`}>{s.val}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Split layout: list + detail */}
                <div className="flex gap-4 items-start">

                    {/* Left: list */}
                    <div className={`flex flex-col gap-3 min-w-0 transition-all ${selected ? 'w-full lg:w-1/2 xl:w-5/12' : 'w-full'}`}>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative flex-1 min-w-48">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={localFilters.search ?? ''}
                                    onChange={e => applyFilter({ ...localFilters, search: e.target.value })}
                                    placeholder="Cari judul atau isi..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <select
                                value={localFilters.kategori ?? ''}
                                onChange={e => applyFilter({ ...localFilters, kategori: e.target.value })}
                                className="py-2 pl-3 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="">Semua Kategori</option>
                                {KATEGORI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>

                            <select
                                value={localFilters.status ?? ''}
                                onChange={e => applyFilter({ ...localFilters, status: e.target.value })}
                                className="py-2 pl-3 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="">Semua Status</option>
                                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            {(localFilters.kategori || localFilters.status || localFilters.search) && (
                                <button
                                    onClick={() => applyFilter({})}
                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-3.5 w-3.5" /> Reset
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                            {items.length === 0 ? (
                                <div className="text-center py-14 text-gray-400">
                                    <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Belum ada masukan.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {items.map(item => {
                                        const hasBalasan = (item.balasan?.length ?? 0) > 0;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                                                className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${
                                                    selectedId === item.id ? 'bg-sky-50 dark:bg-sky-900/10 border-l-2 border-sky-500' : ''
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                            <KategoriBadge kategori={item.kategori} />
                                                            {item.status === 'Baru' && (
                                                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                            )}
                                                            {hasBalasan && (
                                                                <span className="text-[10px] font-semibold text-sky-500 flex items-center gap-0.5">
                                                                    <Send className="h-2.5 w-2.5" />
                                                                    {item.balasan.length} pesan
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-sm font-semibold truncate ${
                                                            item.status === 'Baru'
                                                                ? 'text-gray-900 dark:text-white'
                                                                : 'text-gray-600 dark:text-gray-300'
                                                        }`}>{item.judul}</p>
                                                        <p className="text-xs text-gray-400 truncate mt-0.5">{item.isi}</p>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <StatusBadge status={item.status} />
                                                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(item.created_at)}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {item.user?.name ?? '—'}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {masukan.last_page > 1 && (
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                                <span>Halaman {masukan.current_page} dari {masukan.last_page}</span>
                                <div className="flex gap-1">
                                    {masukan.prev_page_url && (
                                        <button
                                            onClick={() => router.get(masukan.prev_page_url, {}, { preserveScroll: true })}
                                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >← Prev</button>
                                    )}
                                    {masukan.next_page_url && (
                                        <button
                                            onClick={() => router.get(masukan.next_page_url, {}, { preserveScroll: true })}
                                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >Next →</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: detail panel — desktop */}
                    {selected && (
                        <div className="hidden lg:flex flex-col flex-1 min-w-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden sticky top-4"
                             style={{ height: 'calc(100vh - 8rem)' }}>
                            <DetailPanel
                                key={selectedId}
                                item={selected}
                                onClose={() => setSelectedId(null)}
                            />
                        </div>
                    )}
                </div>

                {/* Mobile: detail slide-up panel */}
                {selected && (
                    <div className="lg:hidden fixed inset-0 z-50 flex items-end">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
                        <div className="relative z-10 w-full rounded-t-2xl bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                             style={{ height: '85dvh' }}>
                            <DetailPanel
                                key={selectedId}
                                item={selected}
                                onClose={() => setSelectedId(null)}
                            />
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
