import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Inbox, MessageSquarePlus, Clock, ChevronDown, ChevronUp,
    CheckCircle2, MessageSquare, AlertCircle, Send, Shield,
} from 'lucide-react';

const KATEGORI_STYLE = {
    'Saran':      { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    'Bug/Error':  { bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-300',         dot: 'bg-red-500' },
    'Pertanyaan': { bg: 'bg-sky-100 dark:bg-sky-900/30',         text: 'text-sky-700 dark:text-sky-300',         dot: 'bg-sky-500' },
    'Lainnya':    { bg: 'bg-gray-100 dark:bg-gray-800',          text: 'text-gray-600 dark:text-gray-400',       dot: 'bg-gray-400' },
};

const STATUS_STYLE = {
    'Baru':            { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-300',     dot: 'bg-amber-500',  icon: Clock },
    'Dibaca':          { bg: 'bg-sky-100 dark:bg-sky-900/30',         text: 'text-sky-700 dark:text-sky-300',         dot: 'bg-sky-500',    icon: CheckCircle2 },
    'Ditindaklanjuti': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', icon: CheckCircle2 },
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
    const Icon = s.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            <Icon className="h-3 w-3" />
            {status}
        </span>
    );
}

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return 'baru saja';
    if (diff < 3600)  return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Thread bubble (user view) ── */
function Bubble({ msg }) {
    if (msg.is_admin) {
        return (
            <div className="flex justify-start gap-2.5">
                <div className="h-7 w-7 rounded-full bg-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Admin</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>
                    </div>
                    <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.isi}</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="flex justify-end">
            <div className="max-w-[80%]">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                    <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Anda</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tr-sm px-4 py-2.5">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.isi}</p>
                </div>
            </div>
        </div>
    );
}

function MasukanCard({ item }) {
    const [expanded, setExpanded]   = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending]     = useState(false);

    const balasan    = item.balasan ?? [];
    const hasBalasan = balasan.length > 0;

    const sendReply = () => {
        if (!replyText.trim()) return;
        setSending(true);
        router.post(`/masukan/${item.id}/balasan`, { isi: replyText }, {
            preserveScroll: true,
            onSuccess: () => {
                setReplyText('');
                setSending(false);
            },
            onError: () => setSending(false),
        });
    };

    return (
        <div className={`rounded-xl border transition-all ${
            hasBalasan
                ? 'border-sky-200 dark:border-sky-800'
                : 'border-gray-200 dark:border-gray-700'
        } bg-white dark:bg-gray-900 overflow-hidden`}>

            {/* Card header — always visible */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full text-left px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <KategoriBadge kategori={item.kategori} />
                            {hasBalasan && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-700">
                                    <MessageSquare className="h-2.5 w-2.5" />
                                    {balasan.length} pesan
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.judul}</p>
                        {!expanded && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{item.isi}</p>
                        )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <StatusBadge status={item.status} />
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(item.created_at)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-end mt-1">
                    {expanded
                        ? <ChevronUp className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
            </button>

            {/* Expanded body */}
            {expanded && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                    {/* Status info */}
                    <div className="px-4 py-3 flex items-center gap-2.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Status:</p>
                        <StatusBadge status={item.status} />
                        {item.status === 'Baru' && (
                            <p className="text-xs text-gray-400 italic">Belum ditinjau.</p>
                        )}
                        {item.status === 'Dibaca' && (
                            <p className="text-xs text-sky-600 dark:text-sky-400">Sedang ditinjau admin.</p>
                        )}
                    </div>

                    {/* Original message */}
                    <div className="px-4 pb-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Masukan Anda</p>
                        <div className="flex justify-end">
                            <div className="max-w-[85%] bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tr-sm px-4 py-2.5">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.isi}</p>
                            </div>
                        </div>
                    </div>

                    {/* Thread */}
                    {hasBalasan && (
                        <div className="px-4 pb-3 space-y-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">
                                — Percakapan —
                            </p>
                            {balasan.map(b => (
                                <Bubble key={b.id} msg={b} />
                            ))}
                        </div>
                    )}

                    {/* No reply yet */}
                    {!hasBalasan && item.status !== 'Baru' && (
                        <div className="px-4 pb-3">
                            <p className="text-xs text-gray-400 italic text-center">Belum ada balasan dari admin.</p>
                        </div>
                    )}

                    {/* Reply form */}
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Tambah Balasan</p>
                        <div className="flex gap-2 items-end">
                            <textarea
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Tulis balasan atau informasi tambahan..."
                                rows={2}
                                maxLength={1000}
                                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                            />
                            <button
                                onClick={sendReply}
                                disabled={sending || !replyText.trim()}
                                className="h-10 w-10 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
                            >
                                {sending ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                ) : <Send className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Riwayat({ masukan, counts }) {
    const items = masukan.data ?? [];

    return (
        <AppLayout title="Masukan & Laporan Saya">
            <div className="max-w-2xl mx-auto space-y-5">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                        <Inbox className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Masukan Saya</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Riwayat masukan yang pernah Anda kirim</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Dikirim',   val: counts.total,           bg: 'bg-gray-50 dark:bg-gray-800/60',         color: 'text-gray-700 dark:text-gray-300' },
                        { label: 'Menunggu',        val: counts.menunggu,        bg: 'bg-amber-50 dark:bg-amber-900/20',       color: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Ditinjau',        val: counts.diproses,        bg: 'bg-sky-50 dark:bg-sky-900/20',           color: 'text-sky-600 dark:text-sky-400' },
                        { label: 'Ditindaklanjuti', val: counts.ditindaklanjuti, bg: 'bg-emerald-50 dark:bg-emerald-900/20',   color: 'text-emerald-600 dark:text-emerald-400' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
                            <p className={`text-2xl font-black leading-none ${s.color}`}>{s.val}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Info */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 text-xs text-sky-700 dark:text-sky-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Klik tiap item untuk melihat detail, balasan admin, dan mengirim balasan balik. Gunakan tombol <strong>"Masukan"</strong> di pojok kanan bawah untuk mengirim masukan baru.</span>
                </div>

                {/* List */}
                {items.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                            <MessageSquarePlus className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Belum ada masukan</p>
                        <p className="text-xs text-gray-400 mt-1">Gunakan tombol "Masukan" di pojok kanan bawah untuk mulai mengirim.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map(item => (
                            <MasukanCard key={item.id} item={item} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {masukan.last_page > 1 && (
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Halaman {masukan.current_page} dari {masukan.last_page}</span>
                        <div className="flex gap-1.5">
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
        </AppLayout>
    );
}
