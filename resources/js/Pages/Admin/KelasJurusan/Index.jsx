import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import ActionButton from '@/Components/ui/ActionButton';
import { Plus, Edit, Trash2, School, Layers, Inbox } from 'lucide-react';
import { useState } from 'react';

export default function KelasJurusanIndex({ kelas, jurusan }) {
    // --- Kelas state ---
    const [showKelas, setShowKelas] = useState(false);
    const [editKelas, setEditKelas] = useState(null);
    const formKelas = useForm({ nama: '', tingkat: '', jenjang: 'SMK' });

    const openEditKelas = (k) => {
        setEditKelas(k);
        formKelas.setData({ nama: k.nama, tingkat: k.tingkat, jenjang: k.jenjang });
        setShowKelas(true);
    };

    const closeKelas = () => {
        setShowKelas(false);
        setEditKelas(null);
        formKelas.reset();
    };

    const submitKelas = (e) => {
        e.preventDefault();
        if (editKelas) {
            formKelas.put(`/admin/kelas/${editKelas.id}`, { onSuccess: closeKelas });
        } else {
            formKelas.post('/admin/kelas', { onSuccess: closeKelas });
        }
    };

    // --- Jurusan state ---
    const [showJurusan, setShowJurusan] = useState(false);
    const [editJurusan, setEditJurusan] = useState(null);
    const formJurusan = useForm({ kode: '', nama: '', jenjang: 'SMK', deskripsi: '', is_aktif: true });

    const openEditJurusan = (j) => {
        setEditJurusan(j);
        formJurusan.setData({ kode: j.kode, nama: j.nama, jenjang: j.jenjang, deskripsi: j.deskripsi ?? '', is_aktif: j.is_aktif });
        setShowJurusan(true);
    };

    const closeJurusan = () => {
        setShowJurusan(false);
        setEditJurusan(null);
        formJurusan.reset();
    };

    const submitJurusan = (e) => {
        e.preventDefault();
        if (editJurusan) {
            formJurusan.put(`/admin/jurusan/${editJurusan.id}`, { onSuccess: closeJurusan });
        } else {
            formJurusan.post('/admin/jurusan', { onSuccess: closeJurusan });
        }
    };

    // --- Delete confirm state (shared) ---
    const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'kelas'|'jurusan', item }

    const confirmDelete = () => {
        if (!deleteTarget) return;
        const url = deleteTarget.type === 'kelas'
            ? `/admin/kelas/${deleteTarget.item.id}`
            : `/admin/jurusan/${deleteTarget.item.id}`;
        router.delete(url, { onFinish: () => setDeleteTarget(null) });
    };

    const deleteMessage = () => {
        if (!deleteTarget) return '';
        return deleteTarget.type === 'kelas'
            ? `Kelas "${deleteTarget.item.jenjang} ${deleteTarget.item.nama}" akan dihapus permanen.`
            : `Jurusan "${deleteTarget.item.nama}" akan dihapus permanen.`;
    };

    return (
        <AppLayout title="Kelas & Jurusan">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kelas */}
                <Card>
                    <CardHeader className="flex items-center justify-between gap-3">
                        <CardTitle className="min-w-0 truncate flex items-center gap-2">
                            <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 shrink-0">
                                <School className="h-4 w-4" />
                            </span>
                            Kelas
                            <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({kelas.length})</span>
                        </CardTitle>
                        <Button icon={Plus} size="sm" onClick={() => setShowKelas(true)} className="shrink-0">Tambah</Button>
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        {['Nama', 'Tingkat', 'Jenjang', 'Aksi'].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {kelas.length === 0 && (
                                        <tr><td colSpan={4} className="px-4 py-10 text-center">
                                            <Inbox className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                            <p className="text-gray-400 text-xs">Belum ada data kelas.</p>
                                        </td></tr>
                                    )}
                                    {kelas.map((k) => (
                                        <tr key={k.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{k.nama}</td>
                                            <td className="px-4 py-3 text-gray-500">{k.tingkat}</td>
                                            <td className="px-4 py-3">
                                                <Badge color="indigo">{k.jenjang}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <ActionButton icon={Edit} onClick={() => openEditKelas(k)} title="Edit" color="sky" />
                                                    <ActionButton icon={Trash2} onClick={() => setDeleteTarget({ type: 'kelas', item: k })} title="Hapus" color="rose" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>

                {/* Jurusan */}
                <Card>
                    <CardHeader className="flex items-center justify-between gap-3">
                        <CardTitle className="min-w-0 truncate flex items-center gap-2">
                            <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 shrink-0">
                                <Layers className="h-4 w-4" />
                            </span>
                            <span className="truncate">Jurusan / Kompetensi Keahlian</span>
                            <span className="text-xs font-normal text-gray-400 dark:text-gray-500 shrink-0">({jurusan.length})</span>
                        </CardTitle>
                        <Button icon={Plus} size="sm" onClick={() => setShowJurusan(true)} className="shrink-0">Tambah</Button>
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Kode</th>
                                        <th className="px-4 py-3 text-left font-medium">Nama</th>
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Jenjang</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {jurusan.length === 0 && (
                                        <tr><td colSpan={5} className="px-4 py-10 text-center">
                                            <Inbox className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                            <p className="text-gray-400 text-xs">Belum ada data jurusan.</p>
                                        </td></tr>
                                    )}
                                    {jurusan.map((j) => (
                                        <tr key={j.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{j.kode}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{j.nama}</td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <Badge color="blue">{j.jenjang}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge color={j.is_aktif ? 'green' : 'gray'}>
                                                    {j.is_aktif ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <ActionButton icon={Edit} onClick={() => openEditJurusan(j)} title="Edit" color="sky" />
                                                    <ActionButton icon={Trash2} onClick={() => setDeleteTarget({ type: 'jurusan', item: j })} title="Hapus" color="rose" />
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

            {/* Modal Kelas */}
            <Modal
                show={showKelas}
                onClose={closeKelas}
                title={editKelas ? `Edit Kelas — ${editKelas.jenjang} ${editKelas.nama}` : 'Tambah Kelas'}
            >
                <form onSubmit={submitKelas} className="space-y-4">
                    <Input
                        label="Nama Kelas (cth: X, XI, XII)"
                        value={formKelas.data.nama}
                        onChange={(e) => formKelas.setData('nama', e.target.value)}
                        error={formKelas.errors.nama}
                        required
                    />
                    <Input
                        label="Tingkat"
                        type="number"
                        min="1"
                        max="13"
                        value={formKelas.data.tingkat}
                        onChange={(e) => formKelas.setData('tingkat', e.target.value)}
                        error={formKelas.errors.tingkat}
                        required
                        placeholder="10"
                    />
                    <Select
                        label="Jenjang"
                        value={formKelas.data.jenjang}
                        onChange={(e) => formKelas.setData('jenjang', e.target.value)}
                        required
                    >
                        {['SD', 'SMP', 'SMA', 'SMK'].map((j) => (
                            <option key={j} value={j}>{j}</option>
                        ))}
                    </Select>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={closeKelas}>Batal</Button>
                        <Button type="submit" loading={formKelas.processing}>
                            {editKelas ? 'Simpan Perubahan' : 'Tambah Kelas'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Jurusan */}
            <Modal
                show={showJurusan}
                onClose={closeJurusan}
                title={editJurusan ? `Edit Jurusan — ${editJurusan.nama}` : 'Tambah Jurusan'}
            >
                <form onSubmit={submitJurusan} className="space-y-4">
                    <Input
                        label="Kode"
                        value={formJurusan.data.kode}
                        onChange={(e) => formJurusan.setData('kode', e.target.value)}
                        error={formJurusan.errors.kode}
                        required
                        placeholder="IPA"
                    />
                    <Input
                        label="Nama Jurusan / Kompetensi Keahlian"
                        value={formJurusan.data.nama}
                        onChange={(e) => formJurusan.setData('nama', e.target.value)}
                        error={formJurusan.errors.nama}
                        required
                    />
                    <Select
                        label="Jenjang"
                        value={formJurusan.data.jenjang}
                        onChange={(e) => formJurusan.setData('jenjang', e.target.value)}
                        required
                    >
                        {['SD', 'SMP', 'SMA', 'SMK'].map((j) => (
                            <option key={j} value={j}>{j}</option>
                        ))}
                    </Select>
                    <Textarea
                        label="Deskripsi"
                        value={formJurusan.data.deskripsi}
                        onChange={(e) => formJurusan.setData('deskripsi', e.target.value)}
                        rows={2}
                    />
                    {editJurusan && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formJurusan.data.is_aktif}
                                onChange={(e) => formJurusan.setData('is_aktif', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Jurusan aktif</span>
                        </label>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={closeJurusan}>Batal</Button>
                        <Button type="submit" loading={formJurusan.processing}>
                            {editJurusan ? 'Simpan Perubahan' : 'Tambah Jurusan'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Dialog (shared untuk kelas & jurusan) */}
            <ConfirmDialog
                show={!!deleteTarget}
                title={deleteTarget?.type === 'kelas' ? 'Hapus Kelas' : 'Hapus Jurusan'}
                message={deleteMessage()}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}