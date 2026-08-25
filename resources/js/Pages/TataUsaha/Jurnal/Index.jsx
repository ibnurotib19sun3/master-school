import AppLayout from '@/Layouts/AppLayout';
import { useForm, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import { Textarea } from '@/Components/ui/Input';
import {
    BookText, Calendar, CheckCircle2, AlertCircle, Edit2, Trash2,
    Clock, BookOpen, XCircle, Printer, CheckSquare, Square,
} from 'lucide-react';
import { useState } from 'react';

const STATUS_COLOR = {
    Hadir: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700',
    Sakit: 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-700',
    Izin:  'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700',
    Alpha: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
};

export default function TUJurnalIndex({ absensiHariIni, jurnalHariIni, tahunAjaran, today, riwayat }) {
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem]   = useState(null);
    const [deleteId, setDeleteId]   = useState(null);
    const [selected, setSelected]   = useState(new Set());

    const { data, setData, post, put, processing, errors, reset } = useForm({
        kegiatan: '', keterangan: '',
    });

    const bolehIsi = absensiHariIni?.status === 'Hadir';
    const sudahIsi = !!jurnalHariIni;

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const toggleAll = () => {
        setSelected(selected.size === riwayat.data.length
            ? new Set()
            : new Set(riwayat.data.map(i => i.id)));
    };
    const printIds = (ids) => {
        if (!ids.length) return;
        window.open(`/tatausaha/jurnal/print?ids=${ids.join(',')}`, '_blank');
    };
    const allSelected = riwayat.data.length > 0 && selected.size === riwayat.data.length;

    const openIsi = () => {
        reset();
        setEditItem(null);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setData({ kegiatan: item.kegiatan, keterangan: item.keterangan ?? '' });
        setEditItem(item);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditItem(null); reset(); };

    const submit = (e) => {
        e.preventDefault();
        if (editItem) {
            router.put(`/tatausaha/jurnal/${editItem.id}`, data, { onSuccess: closeModal });
        } else {
            post('/tatausaha/jurnal', { onSuccess: closeModal });
        }
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(`/tatausaha/jurnal/${deleteId}`, { onSuccess: () => setDeleteId(null) });
    };

    const fmt = (val) => {
        if (!val) return '-';
        const d = String(val).split('T')[0].split(' ')[0];
        return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
    };

    return (
        <AppLayout title="Jurnal Karyawan">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookText className="h-5 w-5 text-sky-600" />
                    Jurnal Karyawan
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {tahunAjaran ? `${tahunAjaran.nama} — Semester ${tahunAjaran.semester}` : 'Tidak ada tahun ajaran aktif'}
                </p>
            </div>

            {/* Info presensi hari ini */}
            <div className={`mb-4 p-4 rounded-xl border flex items-start gap-3 ${
                absensiHariIni
                    ? STATUS_COLOR[absensiHariIni.status] + ' border'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
            }`}>
                {absensiHariIni ? (
                    absensiHariIni.status === 'Hadir'
                        ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                        : <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                ) : (
                    <AlertCircle className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                    <p className="font-semibold text-sm">
                        {absensiHariIni
                            ? `Presensi hari ini: ${absensiHariIni.status}`
                            : 'Menunggu Presensi'}
                    </p>
                    <p className="text-xs mt-0.5 opacity-75">{fmt(today)}</p>
                    {!bolehIsi && absensiHariIni && (
                        <p className="text-xs mt-1 font-medium">
                            Jurnal hanya dapat diisi saat presensi berstatus Hadir.
                        </p>
                    )}
                </div>
            </div>

            {/* Jurnal hari ini */}
            <Card className="mb-6">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-sky-500" />
                        Jurnal Hari Ini
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {sudahIsi && (
                            <button
                                onClick={() => printIds([jurnalHariIni.id])}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                            >
                                <Printer className="h-3.5 w-3.5" /> Print Hari Ini
                            </button>
                        )}
                        {bolehIsi && !sudahIsi && (
                            <Button size="sm" onClick={openIsi} icon={BookOpen}>Isi Jurnal</Button>
                        )}
                    </div>
                </CardHeader>
                <CardBody>
                    {sudahIsi ? (
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="font-semibold text-emerald-700 dark:text-emerald-300">Jurnal hari ini sudah terisi!</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Lihat detail dan edit di riwayat di bawah.</p>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <BookText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">
                                {bolehIsi ? 'Jurnal hari ini belum diisi.' : 'Jurnal tidak dapat diisi hari ini.'}
                            </p>
                        </div>
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
                                {allSelected ? 'Batal pilih' : 'Pilih semua'}
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    {riwayat.data.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">Belum ada riwayat jurnal.</div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {riwayat.data.map((item) => {
                                const isSelected = selected.has(item.id);
                                return (
                                    <div key={item.id}
                                        className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                                            isSelected
                                                ? 'bg-sky-50/70 dark:bg-sky-900/20'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                    >
                                        {/* Checkbox */}
                                        <button onClick={() => toggleSelect(item.id)}
                                            className={`shrink-0 mt-1 rounded p-0.5 transition-colors ${
                                                isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-gray-300 dark:text-gray-600 hover:text-sky-400'
                                            }`}>
                                            {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                        </button>
                                        <div className="shrink-0 mt-0.5">
                                            <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
                                                <BookText className="h-4 w-4 text-sky-500" />
                                            </div>
                                        </div>
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
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => printIds([item.id])}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                                                title="Print entri ini">
                                                <Printer className="h-3.5 w-3.5" />
                                            </button>
                                            {item.tanggal === today && (
                                                <button onClick={() => openEdit(item)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors">
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button onClick={() => setDeleteId(item.id)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Modal isi/edit jurnal */}
            <Modal show={showModal} onClose={closeModal} title={editItem ? 'Edit Jurnal' : 'Isi Jurnal Hari Ini'}>
                <form onSubmit={submit} className="space-y-4">
                    {!editItem && tahunAjaran && (
                        <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 text-sm text-sky-700 dark:text-sky-300 space-y-1">
                            <p><span className="font-medium">Tahun Ajaran:</span> {tahunAjaran.nama}</p>
                            <p><span className="font-medium">Semester:</span> {tahunAjaran.semester}</p>
                            <p><span className="font-medium">Tanggal:</span> {fmt(today)}</p>
                        </div>
                    )}
                    <Textarea
                        label="Kegiatan"
                        value={data.kegiatan}
                        onChange={(e) => setData('kegiatan', e.target.value)}
                        rows={4}
                        placeholder="Tuliskan kegiatan yang dilakukan hari ini..."
                        error={errors.kegiatan}
                        required
                    />
                    <Textarea
                        label="Keterangan (opsional)"
                        value={data.keterangan}
                        onChange={(e) => setData('keterangan', e.target.value)}
                        rows={2}
                        placeholder="Catatan tambahan..."
                        error={errors.keterangan}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>
                            {editItem ? 'Perbarui Jurnal' : 'Simpan Jurnal'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal konfirmasi hapus */}
            <Modal show={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Jurnal">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Yakin ingin menghapus jurnal ini?
                </p>
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={() => setDeleteId(null)}>Batal</Button>
                    <Button type="button" variant="danger" icon={Trash2} onClick={confirmDelete}>Hapus</Button>
                </div>
            </Modal>
        </AppLayout>
    );
}
