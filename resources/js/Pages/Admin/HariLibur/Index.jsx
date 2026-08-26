import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input, Textarea } from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import {
    CalendarX, Plus, Pencil, Trash2, X, Check,
    AlertTriangle, Clock, Sun, RefreshCw, Loader2, AlertCircle,
    ArrowUpNarrowWide, ArrowDownNarrowWide,
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

/* ─── helpers ─── */
function toDatePart(val) {
    if (!val) return '';
    return String(val).split('T')[0].split(' ')[0];
}
function fmtLong(val) {
    const d = toDatePart(val);
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

/* ─── Modal form ─── */
function LiburModal({ open, onClose, jamSlots, initial }) {
    const isEdit = !!initial;
    const [form, setForm] = useState(() => initial ?? {
        tanggal: '', nama: '', keterangan: '', jam_tertentu: null,
    });
    const [mode, setMode]   = useState(() => (initial?.jam_tertentu === null || !initial) ? 'semua' : 'tertentu');
    const [saving, setSaving] = useState(false);

    const set   = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const total = jamSlots.length;

    const toggleJam = (jamKe) => {
        setForm(p => {
            const cur = Array.isArray(p.jam_tertentu) ? p.jam_tertentu : [];
            const next = cur.includes(jamKe) ? cur.filter(j => j !== jamKe) : [...cur, jamKe];
            return { ...p, jam_tertentu: next.sort((a, b) => a - b) };
        });
    };

    const handleModeChange = (m) => {
        setMode(m);
        if (m === 'semua') set('jam_tertentu', null);
        else set('jam_tertentu', []);
    };

    const handleSubmit = () => {
        const payload = {
            ...form,
            jam_tertentu: mode === 'semua' ? null : (form.jam_tertentu ?? []),
        };
        setSaving(true);
        if (isEdit) {
            router.put(`/admin/hari-libur/${initial.id}`, payload, {
                onSuccess: onClose, onFinish: () => setSaving(false),
            });
        } else {
            router.post('/admin/hari-libur', payload, {
                onSuccess: () => { setForm({ tanggal: '', nama: '', keterangan: '', jam_tertentu: null }); setMode('semua'); onClose(); },
                onFinish: () => setSaving(false),
            });
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <CalendarX className="h-5 w-5 text-rose-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {isEdit ? 'Edit Hari Libur' : 'Tambah Hari Libur'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <Input
                        label="Tanggal"
                        type="date"
                        value={toDatePart(form.tanggal)}
                        onChange={e => set('tanggal', e.target.value)}
                        required
                    />
                    <Input
                        label="Nama Hari Libur"
                        value={form.nama}
                        onChange={e => set('nama', e.target.value)}
                        placeholder="cth: Hari Raya Idul Fitri, Hari Kemerdekaan..."
                        required
                    />
                    <Textarea
                        label="Keterangan (opsional)"
                        value={form.keterangan ?? ''}
                        onChange={e => set('keterangan', e.target.value)}
                        rows={2}
                        placeholder="Catatan tambahan..."
                    />

                    {/* Jam mode */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Clock className="inline h-3.5 w-3.5 mr-1" />Jam Pembelajaran
                        </p>
                        <div className="flex gap-3 mb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="mode" value="semua" checked={mode === 'semua'} onChange={() => handleModeChange('semua')}
                                    className="text-rose-500 focus:ring-rose-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Semua Jam</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="mode" value="tertentu" checked={mode === 'tertentu'} onChange={() => handleModeChange('tertentu')}
                                    className="text-rose-500 focus:ring-rose-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jam Tertentu</span>
                            </label>
                        </div>

                        {mode === 'semua' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-lg px-3 py-2">
                                Semua jam pembelajaran pada hari ini tidak dihitung dalam keaktifan guru.
                            </p>
                        )}

                        {mode === 'tertentu' && (
                            <div>
                                <p className="text-xs text-gray-400 mb-2">Pilih jam yang libur:</p>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {jamSlots.map(slot => {
                                        const checked = Array.isArray(form.jam_tertentu) && form.jam_tertentu.includes(slot.jam_ke);
                                        return (
                                            <button key={slot.jam_ke} type="button"
                                                onClick={() => toggleJam(slot.jam_ke)}
                                                className={`flex flex-col items-center rounded-xl border-2 py-2 px-1 transition-all text-center ${
                                                    checked
                                                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}>
                                                <span className="text-xs font-bold leading-none">JP {slot.jam_ke}</span>
                                                <span className="text-[9px] mt-1 leading-none opacity-70">{slot.jam_mulai}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {Array.isArray(form.jam_tertentu) && form.jam_tertentu.length === 0 && (
                                    <p className="text-xs text-amber-500 mt-1.5">Pilih minimal satu jam, atau pilih "Semua Jam".</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 justify-end">
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Batal
                    </button>
                    <Button
                        onClick={handleSubmit}
                        loading={saving}
                        disabled={!form.tanggal || !form.nama || (mode === 'tertentu' && (form.jam_tertentu?.length ?? 0) === 0)}
                        className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
                    >
                        <Check className="h-4 w-4 mr-1" />
                        {isEdit ? 'Simpan Perubahan' : 'Tambah'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ─── Jam badge display ─── */
function JamBadge({ item, jamSlots }) {
    if (!item.jam_tertentu) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                <Sun className="h-3 w-3" /> Semua Jam
            </span>
        );
    }
    return (
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            JP {item.jam_tertentu.join(', ')}
        </span>
    );
}

/* ─── Delete confirm modal ─── */
function DeleteModal({ item, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Icon header */}
                <div className="flex flex-col items-center px-6 pt-7 pb-4">
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                        <Trash2 className="h-7 w-7 text-red-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white text-center">Hapus Hari Libur?</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>

                {/* Item info */}
                <div className="mx-6 mb-5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{item.nama}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fmtLong(item.tanggal)}</p>
                    <JamBadge item={item} jamSlots={[]} />
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pb-6">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Batal
                    </button>
                    <button onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-semibold transition-colors">
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Sync confirm modal ─── */
function SyncModal({ item, onClose }) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetch(`/admin/hari-libur/${item.id}/preview`)
            .then(r => r.json())
            .then(d => { setPreview(d); setLoading(false); });
    }, [item.id]);

    const handleSync = () => {
        setSyncing(true);
        router.post(`/admin/hari-libur/${item.id}/sync`, {}, {
            onSuccess: onClose,
            onFinish: () => setSyncing(false),
        });
    };

    const isPenuh = !preview || preview.mode === 'penuh';
    const total   = preview ? (preview.piket + preview.jurnal + preview.absensi_guru + preview.absensi_tu) : null;

    const rows = preview ? (isPenuh ? [
        { label: 'Presensi Piket Guru',  val: preview.piket },
        { label: 'Jurnal Mengajar',       val: preview.jurnal },
        { label: 'Absensi Harian Guru',   val: preview.absensi_guru },
        { label: 'Absensi Tata Usaha',    val: preview.absensi_tu },
    ] : [
        { label: 'Presensi Piket Guru',  val: preview.piket },
        { label: 'Jurnal Mengajar',       val: preview.jurnal },
    ]) : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-amber-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Sync Hari Libur</h3>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Item info + mode badge */}
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                        <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">{item.nama}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{fmtLong(item.tanggal)}</p>
                        <div className="mt-2">
                            {item.jam_tertentu ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                    <Clock className="h-3 w-3" />
                                    Jam Tertentu: JP {item.jam_tertentu.join(', ')} — hanya piket &amp; jurnal yang dihapus
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400">
                                    <Sun className="h-3 w-3" />
                                    Semua Jam — semua data kehadiran &amp; jurnal dihapus
                                </span>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                    ) : preview ? (
                        <>
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                {rows.map(({ label, val }) => (
                                    <div key={label} className="flex justify-between items-center px-4 py-2.5">
                                        <span className="text-gray-600 dark:text-gray-400">{label}</span>
                                        <span className={`font-bold tabular-nums ${val > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                            {val} data akan dihapus
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {total === 0 && (
                                <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        Tidak ada data yang perlu dihapus — mungkin sudah pernah di-sync sebelumnya. Yakin ingin sync ulang?
                                    </p>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 justify-end">
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Batal
                    </button>
                    <Button
                        onClick={handleSync}
                        loading={syncing}
                        disabled={loading || !preview}
                        className="bg-amber-500 hover:bg-amber-600 focus:ring-amber-400"
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        {total === 0 ? 'Sync Ulang' : 'Ya, Sync Sekarang'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main page ─── */
export default function HariLiburIndex({ libur, jamSlots, filters }) {
    const { props } = usePage();
    const flash     = props.flash ?? {};

    const [bulan,      setBulan]      = useState(filters.bulan ?? new Date().toISOString().slice(0, 7));
    const [sort,       setSort]       = useState(filters.sort ?? 'asc');
    const [modal,      setModal]      = useState(null);
    const [syncItem,   setSyncItem]   = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);

    const nav = useCallback((b, s) => {
        const newBulan = b ?? bulan;
        const newSort  = s ?? sort;
        setBulan(newBulan);
        setSort(newSort);
        router.get('/admin/hari-libur', { bulan: newBulan, sort: newSort }, { preserveState: true, replace: true });
    }, [bulan, sort]);

    const toggleSort = () => nav(bulan, sort === 'asc' ? 'desc' : 'asc');

    const confirmDelete = () => {
        if (!deleteItem) return;
        router.delete(`/admin/hari-libur/${deleteItem.id}`);
        setDeleteItem(null);
    };

    return (
        <AppLayout title="Hari Libur">
            {modal && (
                <LiburModal
                    open
                    onClose={() => setModal(null)}
                    jamSlots={jamSlots}
                    initial={modal === 'add' ? null : modal}
                />
            )}
            {syncItem && (
                <SyncModal item={syncItem} onClose={() => setSyncItem(null)} />
            )}
            {deleteItem && (
                <DeleteModal item={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={confirmDelete} />
            )}

            <div className="max-w-3xl mx-auto space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CalendarX className="h-5 w-5 text-rose-500" /> Hari Libur
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Tandai hari libur agar tidak dihitung dalam keaktifan guru.
                        </p>
                    </div>
                    <Button
                        icon={Plus}
                        onClick={() => setModal('add')}
                        className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 shrink-0"
                    >
                        Tambah Hari Libur
                    </Button>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                        <Check className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}

                {/* Filter bulan */}
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bulan</label>
                                <input type="month" value={bulan} onChange={e => nav(e.target.value, sort)}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-5">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{libur.length}</span> hari libur
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Info box */}
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Dampak Hari Libur</p>
                        <p className="mt-0.5 opacity-85">
                            Hari libur <strong>"Semua Jam"</strong> tidak dihitung dalam keaktifan absensi dan jurnal guru.
                            Hari libur <strong>"Jam Tertentu"</strong> hanya mengeluarkan jam tersebut dari hitungan jurnal mengajar.
                        </p>
                    </div>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <CalendarX className="h-4 w-4 text-gray-400" />
                            Daftar Hari Libur
                        </CardTitle>
                        <button
                            onClick={toggleSort}
                            title={sort === 'asc' ? 'Urutan: Terlama → Terbaru (klik untuk balik)' : 'Urutan: Terbaru → Terlama (klik untuk balik)'}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {sort === 'asc'
                                ? <><ArrowUpNarrowWide className="h-3.5 w-3.5" /> Terlama</>
                                : <><ArrowDownNarrowWide className="h-3.5 w-3.5" /> Terbaru</>
                            }
                        </button>
                    </CardHeader>
                    <CardBody className="p-0">
                        {libur.length === 0 ? (
                            <div className="py-14 text-center text-gray-400 dark:text-gray-500">
                                <CalendarX className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Belum ada hari libur di bulan ini.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Tanggal</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Nama</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-32">Jam</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Keterangan</th>
                                            <th className="px-4 py-3 w-20" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {libur.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">
                                                        {fmtLong(item.tanggal)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900 dark:text-white">{item.nama}</p>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <JamBadge item={item} jamSlots={jamSlots} />
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs italic max-w-xs">
                                                    <p className="line-clamp-2">{item.keterangan || '—'}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1 justify-end">
                                                        <button
                                                            onClick={() => setSyncItem({ ...item, tanggal: toDatePart(item.tanggal) })}
                                                            title="Sync — hapus data kehadiran & jurnal pada hari ini"
                                                            className="rounded-lg p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors">
                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setModal({
                                                                ...item,
                                                                tanggal: toDatePart(item.tanggal),
                                                            })}
                                                            className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteItem({ ...item, tanggal: toDatePart(item.tanggal) })}
                                                            className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
