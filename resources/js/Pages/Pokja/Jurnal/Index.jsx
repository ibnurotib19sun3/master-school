import AppLayout from '@/Layouts/AppLayout';
import { useForm, router, usePage } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import {
    Layers, Calendar, CheckCircle2, PenLine, Trash2,
    Clock, Printer, CheckSquare, Square, Check, X,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

function toDatePart(val) {
    if (!val) return '';
    return String(val).split('T')[0].split(' ')[0];
}

function fmt(val) {
    const d = toDatePart(val);
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

function fmtShort(val) {
    const d = toDatePart(val);
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function JurnalForm({ existing, onCancel }) {
    const isEdit = !!existing;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        kegiatan:   existing?.kegiatan   ?? '',
        keterangan: existing?.keterangan ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(`/pokja/jurnal/${existing.id}`, { onSuccess: () => { reset(); onCancel?.(); } });
        } else {
            post('/pokja/jurnal', { onSuccess: reset });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Kegiatan yang Dilaksanakan <span className="text-red-500">*</span>
                </label>
                <textarea
                    rows={4}
                    value={data.kegiatan}
                    onChange={e => setData('kegiatan', e.target.value)}
                    placeholder="Tuliskan kegiatan yang dilaksanakan hari ini..."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.kegiatan && <p className="text-xs text-red-500 mt-1">{errors.kegiatan}</p>}
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Keterangan</label>
                <textarea
                    rows={2}
                    value={data.keterangan}
                    onChange={e => setData('keterangan', e.target.value)}
                    placeholder="Catatan tambahan (opsional)"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
            </div>
            <div className="flex justify-end gap-2">
                {isEdit && (
                    <button type="button" onClick={onCancel}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-4 w-4" /> Batal
                    </button>
                )}
                <button type="submit" disabled={processing}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 transition-colors">
                    <Check className="h-4 w-4" />
                    {processing ? 'Menyimpan...' : isEdit ? 'Perbarui Jurnal' : 'Simpan Jurnal'}
                </button>
            </div>
        </form>
    );
}

export default function PokjaJurnalIndex({ jurnalHariIni, tahunAjaran, jabatan, today, riwayat }) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [editing, setEditing]     = useState(false);
    const [editItem, setEditItem]   = useState(null);
    const [selected, setSelected]   = useState(new Set());

    const sudahIsi = !!jurnalHariIni;

    const toggleSelect = (id) =>
        setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === riwayat.data.length ? new Set() : new Set(riwayat.data.map(i => i.id)));
    const allSelected = riwayat.data.length > 0 && selected.size === riwayat.data.length;

    const printIds = (ids) => {
        if (!ids.length) return;
        window.open(`/pokja/jurnal/print?ids=${ids.join(',')}`, '_blank');
    };

    const handleDelete = (id) => {
        if (!confirm('Hapus jurnal ini?')) return;
        router.delete(`/pokja/jurnal/${id}`);
    };

    return (
        <AppLayout title={`Jurnal ${jabatan}`}>
            <div className="space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Layers className="h-5 w-5 text-sky-600" />
                        Jurnal {jabatan}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {tahunAjaran ? `${tahunAjaran.nama} — Semester ${tahunAjaran.semester}` : 'Tidak ada tahun ajaran aktif'}
                    </p>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}

                {/* Info */}
                <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 text-sm text-sky-700 dark:text-sky-300 flex items-center gap-2">
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>Jurnal Pokja dapat diisi kapan saja tanpa perlu konfirmasi kehadiran dari piket.</span>
                </div>

                {/* Jurnal Hari Ini */}
                <Card className="border-sky-200 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-900/10">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                                <Calendar className="h-4 w-4" />
                                Jurnal Hari Ini
                            </CardTitle>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{fmt(today)}</span>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {sudahIsi && !editing ? (
                            <div className="space-y-3">
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">{jurnalHariIni.kegiatan}</p>
                                    {jurnalHariIni.keterangan && (
                                        <p className="text-xs text-gray-400 italic mt-2">{jurnalHariIni.keterangan}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditing(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 transition-colors">
                                        <PenLine className="h-3.5 w-3.5" /> Edit
                                    </button>
                                    <button onClick={() => printIds([jurnalHariIni.id])}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <Printer className="h-3.5 w-3.5" /> Print
                                    </button>
                                    <button onClick={() => handleDelete(jurnalHariIni.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-100 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <JurnalForm
                                existing={editing ? jurnalHariIni : null}
                                onCancel={() => setEditing(false)}
                            />
                        )}
                    </CardBody>
                </Card>

                {/* Riwayat jurnal */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            Riwayat Jurnal
                            {riwayat.total > 0 && (
                                <span className="text-xs text-gray-400 font-normal">({riwayat.total} entri)</span>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {selected.size > 0 && (
                                <button onClick={() => printIds([...selected])}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 transition-colors">
                                    <Printer className="h-3.5 w-3.5" /> Print Terpilih ({selected.size})
                                </button>
                            )}
                            {riwayat.data.length > 0 && (
                                <button onClick={toggleAll}
                                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                                    {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                    {allSelected ? 'Batal pilih semua' : 'Pilih semua'}
                                </button>
                            )}
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {riwayat.data.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                                <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Belum ada riwayat jurnal.</p>
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {riwayat.data.map((item) => {
                                        const isSelected = selected.has(item.id);
                                        const isEditingItem = editItem?.id === item.id;

                                        return (
                                            <div key={item.id}
                                                className={`px-4 py-3 transition-colors ${
                                                    isSelected
                                                        ? 'bg-sky-50/70 dark:bg-sky-900/20'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                }`}
                                            >
                                                {isEditingItem ? (
                                                    <div className="py-1">
                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                                                            Edit jurnal — {fmt(item.tanggal)}
                                                        </p>
                                                        <JurnalForm
                                                            existing={item}
                                                            onCancel={() => setEditItem(null)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start gap-3">
                                                        {/* Checkbox */}
                                                        <button onClick={() => toggleSelect(item.id)}
                                                            className={`shrink-0 mt-1 rounded p-0.5 transition-colors ${
                                                                isSelected
                                                                    ? 'text-sky-600 dark:text-sky-400'
                                                                    : 'text-gray-300 dark:text-gray-600 hover:text-sky-400'
                                                            }`}>
                                                            {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                                        </button>

                                                        {/* Icon */}
                                                        <div className="shrink-0 mt-0.5">
                                                            <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
                                                                <Layers className="h-4 w-4 text-sky-500" />
                                                            </div>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                                                {fmt(item.tanggal)}
                                                                <span className="ml-2 text-sky-500">{item.tahun_ajaran?.nama} · Sem {item.semester}</span>
                                                            </p>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{item.kegiatan}</p>
                                                            {item.keterangan && (
                                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">{item.keterangan}</p>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button onClick={() => printIds([item.id])}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                                                                title="Print">
                                                                <Printer className="h-3.5 w-3.5" />
                                                            </button>
                                                            {item.tanggal === today && (
                                                                <button onClick={() => setEditItem(item)}
                                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                                                                    title="Edit">
                                                                    <PenLine className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleDelete(item.id)}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                title="Hapus">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {riwayat.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Halaman {riwayat.current_page} dari {riwayat.last_page}
                                        </p>
                                        <div className="flex gap-2">
                                            <button disabled={!riwayat.prev_page_url}
                                                onClick={() => riwayat.prev_page_url && router.get(riwayat.prev_page_url)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800">
                                                <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                            </button>
                                            <button disabled={!riwayat.next_page_url}
                                                onClick={() => riwayat.next_page_url && router.get(riwayat.next_page_url)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800">
                                                Next <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
