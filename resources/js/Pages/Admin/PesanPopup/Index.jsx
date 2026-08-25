import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select } from '@/Components/ui/Input';
import RichEditor from '@/Components/ui/RichEditor';
import RichContent from '@/Components/ui/RichContent';
import { Plus, Edit, Trash2, Megaphone, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const TIPE_CFG = {
    info:       { label: 'Info',       color: 'blue',   Icon: Info },
    peringatan: { label: 'Peringatan', color: 'yellow', Icon: AlertTriangle },
    sukses:     { label: 'Sukses',     color: 'green',  Icon: CheckCircle2 },
};

function formatDate(dt) {
    if (!dt) return '–';
    return new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PesanPopupIndex({ pesan }) {
    const [showModal,    setShowModal]    = useState(false);
    const [editItem,     setEditItem]     = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        judul: '', isi: '', tipe: 'info', is_aktif: true,
        mulai_pada: '', selesai_pada: '',
    });

    const closeModal = () => { setShowModal(false); setEditItem(null); reset(); };

    const openEdit = (item) => {
        setEditItem(item);
        setData({
            judul: item.judul, isi: item.isi, tipe: item.tipe,
            is_aktif: item.is_aktif,
            mulai_pada:   item.mulai_pada   ? item.mulai_pada.substring(0, 16)   : '',
            selesai_pada: item.selesai_pada ? item.selesai_pada.substring(0, 16) : '',
        });
        setShowModal(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editItem) {
            put(`/admin/pesan-popup/${editItem.id}`, { onSuccess: closeModal });
        } else {
            post('/admin/pesan-popup', { onSuccess: closeModal });
        }
    };

    return (
        <AppLayout title="Pesan Popup">
            <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-sky-500" />
                        Daftar Pesan Popup ({pesan.total})
                    </CardTitle>
                    <Button icon={Plus} onClick={() => setShowModal(true)}>Buat Pesan</Button>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Judul</th>
                                    <th className="px-4 py-3 text-left font-medium">Tipe</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Mulai</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Selesai</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Dibuat oleh</th>
                                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {pesan.data.map((item) => {
                                    const cfg = TIPE_CFG[item.tipe] ?? TIPE_CFG.info;
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">
                                                {item.judul}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge color={cfg.color}>{cfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge color={item.is_aktif ? 'green' : 'gray'}>
                                                    {item.is_aktif ? '● Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">{formatDate(item.mulai_pada)}</td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">{formatDate(item.selesai_pada)}</td>
                                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.pembuat?.name ?? '–'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {pesan.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                            Belum ada pesan popup.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* Modal Tambah / Edit */}
            <Modal show={showModal} onClose={closeModal} title={editItem ? 'Edit Pesan Popup' : 'Buat Pesan Popup'}>
                <form onSubmit={submit} className="space-y-4">
                    <Input label="Judul" value={data.judul} onChange={(e) => setData('judul', e.target.value)} error={errors.judul} required placeholder="cth: Libur Nasional" />
                    <RichEditor label="Isi Pesan" value={data.isi} onChange={(html) => setData('isi', html)} error={errors.isi} placeholder="Tulis isi pesan di sini..." />
                    <Select label="Tipe" value={data.tipe} onChange={(e) => setData('tipe', e.target.value)}>
                        <option value="info">Info</option>
                        <option value="peringatan">Peringatan</option>
                        <option value="sukses">Sukses / Pengumuman Baik</option>
                    </Select>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Mulai Ditampilkan (opsional)" type="datetime-local" value={data.mulai_pada} onChange={(e) => setData('mulai_pada', e.target.value)} error={errors.mulai_pada} />
                        <Input label="Selesai Ditampilkan (opsional)" type="datetime-local" value={data.selesai_pada} onChange={(e) => setData('selesai_pada', e.target.value)} error={errors.selesai_pada} />
                    </div>
                    <p className="text-xs text-gray-400 -mt-2">Kosongkan kedua tanggal agar ditampilkan terus menerus.</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={data.is_aktif} onChange={(e) => setData('is_aktif', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-sky-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Aktifkan pesan ini</span>
                    </label>
                    <div className="flex justify-end gap-3 pt-1">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Pesan Popup"
                message={`Pesan "${deleteTarget?.judul}" akan dihapus permanen.`}
                onConfirm={() => { router.delete(`/admin/pesan-popup/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}