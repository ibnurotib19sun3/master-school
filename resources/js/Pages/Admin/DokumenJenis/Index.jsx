import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Textarea } from '@/Components/ui/Input';
import ActionButton from '@/Components/ui/ActionButton';
import { Plus, Trash2, Edit, FileStack, Power, FileText, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';

const TYPE_OPTIONS = [
    { key: 'jpg', label: 'JPG / JPEG' },
    { key: 'png', label: 'PNG' },
    { key: 'pdf', label: 'PDF' },
];

export default function DokumenJenisIndex({ dokumenJenis }) {
    const [showModal,    setShowModal]    = useState(false);
    const [editTarget,   setEditTarget]   = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama: '', deskripsi: '', allowed_types: ['jpg', 'png', 'pdf'], urutan: 0,
    });

    const openAdd = () => {
        setEditTarget(null);
        reset();
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditTarget(item);
        setData({ nama: item.nama, deskripsi: item.deskripsi ?? '', allowed_types: item.allowed_types, urutan: item.urutan });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); reset(); setEditTarget(null); };

    const toggleType = (key) => {
        setData('allowed_types', data.allowed_types.includes(key)
            ? data.allowed_types.filter((t) => t !== key)
            : [...data.allowed_types, key]);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editTarget) {
            put(`/admin/dokumen-jenis/${editTarget.id}`, { onSuccess: closeModal });
        } else {
            post('/admin/dokumen-jenis', { onSuccess: closeModal });
        }
    };

    return (
        <AppLayout title="Jenis Dokumen Siswa">
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileStack className="h-5 w-5 text-sky-500" /> Jenis Dokumen Siswa
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Atur jenis dokumen apa saja yang bisa diunggah Tatausaha untuk tiap siswa, beserta tipe file yang diizinkan.
                    </p>
                </div>

                <Card>
                    <CardHeader className="flex items-center justify-between gap-3">
                        <CardTitle>Daftar Jenis ({dokumenJenis.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button icon={ClipboardCheck} variant="secondary" onClick={() => router.visit('/admin/dokumen-jenis/laporan')}>Lihat Laporan</Button>
                            <Button icon={Plus} onClick={openAdd}>Tambah Jenis</Button>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Nama Dokumen</th>
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Tipe File</th>
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell w-28">Terunggah</th>
                                        <th className="px-4 py-3 text-left font-medium w-24">Status</th>
                                        <th className="px-4 py-3 text-left font-medium w-28">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {dokumenJenis.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Belum ada jenis dokumen. Klik "Tambah Jenis" untuk mulai.</td></tr>
                                    ) : dokumenJenis.map((item) => (
                                        <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!item.is_aktif ? 'opacity-50' : ''}`}>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                    <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" /> {item.nama}
                                                </p>
                                                {item.deskripsi && <p className="text-xs text-gray-400 mt-0.5 pl-5">{item.deskripsi}</p>}
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {(item.allowed_types ?? []).map((t) => (
                                                        <Badge key={t} color="sky">{t.toUpperCase()}</Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{item.dokumen_siswa_count ?? 0} siswa</td>
                                            <td className="px-4 py-3">
                                                <Badge color={item.is_aktif ? 'green' : 'gray'}>{item.is_aktif ? 'Aktif' : 'Nonaktif'}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <ActionButton icon={Power} onClick={() => router.post(`/admin/dokumen-jenis/${item.id}/toggle-aktif`)} title={item.is_aktif ? 'Nonaktifkan' : 'Aktifkan'} color={item.is_aktif ? 'rose' : 'emerald'} />
                                                    <ActionButton icon={Edit} onClick={() => openEdit(item)} title="Edit" color="sky" />
                                                    <ActionButton icon={Trash2} onClick={() => setDeleteTarget(item)} title="Hapus" color="rose" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Modal show={showModal} onClose={closeModal} title={editTarget ? 'Edit Jenis Dokumen' : 'Tambah Jenis Dokumen'}>
                <form onSubmit={submit} className="space-y-4">
                    <Input label="Nama Dokumen" value={data.nama} onChange={(e) => setData('nama', e.target.value)} error={errors.nama} required placeholder="mis. Akta Kelahiran" />
                    <Textarea label="Deskripsi (opsional)" value={data.deskripsi} onChange={(e) => setData('deskripsi', e.target.value)} rows={2} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipe File Diizinkan</label>
                        <div className="flex flex-wrap gap-2">
                            {TYPE_OPTIONS.map((opt) => {
                                const active = data.allowed_types.includes(opt.key);
                                return (
                                    <button key={opt.key} type="button" onClick={() => toggleType(opt.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                            active ? 'bg-sky-600 border-sky-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.allowed_types && <p className="text-xs text-red-500 mt-1">{errors.allowed_types}</p>}
                    </div>
                    <Input label="Urutan Tampilan" type="number" min="0" value={data.urutan} onChange={(e) => setData('urutan', e.target.value)} />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>{editTarget ? 'Simpan Perubahan' : 'Simpan'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Jenis Dokumen"
                message={`Jenis dokumen "${deleteTarget?.nama}" beserta semua file yang sudah diunggah untuk jenis ini akan dihapus permanen.`}
                onConfirm={() => { router.delete(`/admin/dokumen-jenis/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}
