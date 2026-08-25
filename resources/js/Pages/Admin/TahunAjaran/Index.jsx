import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select } from '@/Components/ui/Input';
import { Plus, Edit, Trash2, CalendarRange } from 'lucide-react';
import { useState } from 'react';

function fmtTgl(str) {
    if (!str) return '–';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusChip({ aktif }) {
    if (aktif) return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Aktif
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
            Nonaktif
        </span>
    );
}

export default function TahunAjaranIndex({ tahunAjaran }) {
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama: '', semester: 'Ganjil', tanggal_mulai: '', tanggal_selesai: '', is_aktif: false,
    });

    const submit = (e) => {
        e.preventDefault();
        if (editItem) {
            put(`/admin/tahun-ajaran/${editItem.id}`, { onSuccess: () => { setEditItem(null); reset(); setShowModal(false); } });
        } else {
            post('/admin/tahun-ajaran', { onSuccess: () => { setShowModal(false); reset(); } });
        }
    };

    const openEdit = (item) => {
        setEditItem(item);
        setData({ nama: item.nama, semester: item.semester, tanggal_mulai: item.tanggal_mulai, tanggal_selesai: item.tanggal_selesai, is_aktif: item.is_aktif });
        setShowModal(true);
    };

    return (
        <AppLayout title="Tahun Ajaran">
            <Card>
                <CardHeader className="flex items-center justify-between gap-3">
                    <CardTitle className="min-w-0 truncate">Daftar Tahun Ajaran</CardTitle>
                    <Button icon={Plus} onClick={() => setShowModal(true)} className="shrink-0">Tambah</Button>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Tahun Ajaran</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Semester</th>
                                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Mulai</th>
                                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Selesai</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {tahunAjaran.data.map((item) => (
                                    <tr key={item.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${item.is_aktif ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <CalendarRange className={`h-4 w-4 shrink-0 ${item.is_aktif ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{item.nama}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                                                item.semester === 'Ganjil'
                                                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                                                    : 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                                            }`}>
                                                {item.semester}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{fmtTgl(item.tanggal_mulai)}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{fmtTgl(item.tanggal_selesai)}</td>
                                        <td className="px-4 py-3">
                                            <StatusChip aktif={item.is_aktif} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5">
                                                <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Hapus">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            <Modal show={showModal} onClose={() => { setShowModal(false); setEditItem(null); reset(); }} title={editItem ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}>
                <form onSubmit={submit} className="space-y-4">
                    <Input label="Nama Tahun Ajaran (cth: 2024/2025)" value={data.nama} onChange={(e) => setData('nama', e.target.value)} error={errors.nama} required />
                    <Select label="Semester" value={data.semester} onChange={(e) => setData('semester', e.target.value)} required>
                        <option value="Ganjil">Ganjil</option>
                        <option value="Genap">Genap</option>
                    </Select>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Tanggal Mulai" type="date" value={data.tanggal_mulai} onChange={(e) => setData('tanggal_mulai', e.target.value)} error={errors.tanggal_mulai} required />
                        <Input label="Tanggal Selesai" type="date" value={data.tanggal_selesai} onChange={(e) => setData('tanggal_selesai', e.target.value)} error={errors.tanggal_selesai} required />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={data.is_aktif} onChange={(e) => setData('is_aktif', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-sky-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Jadikan tahun ajaran aktif</span>
                        </label>
                        {data.is_aktif && (
                            <p className="mt-1.5 ml-6 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                ⚠ Tahun ajaran lain yang sedang aktif akan otomatis dinonaktifkan.
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditItem(null); reset(); }}>Batal</Button>
                        <Button type="submit" loading={processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Tahun Ajaran"
                message={`Tahun ajaran "${deleteTarget?.nama}" akan dihapus permanen.`}
                onConfirm={() => { router.delete(`/admin/tahun-ajaran/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}