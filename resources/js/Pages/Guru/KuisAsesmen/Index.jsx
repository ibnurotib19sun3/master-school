import AppLayout from '@/Layouts/AppLayout';
import { useForm, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select } from '@/Components/ui/Input';
import { router } from '@inertiajs/react';
import { Plus, ExternalLink, Trash2, HelpCircle, Upload, BookOpen } from 'lucide-react';
import { useState } from 'react';

const JENIS_COLOR = {
    Kuis:    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    Asesmen: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
};
const JENIS_ICON = { Kuis: HelpCircle, Asesmen: Upload };

export default function KuisAsesmenIndex({ list, rombel, guruId, isAdmin }) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [modalOpen, setModalOpen]   = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        jenis:     'Kuis',
        judul:     '',
        tautan:    '',
        rombel_id: '',
    });

    const openModal = () => {
        reset();
        setModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        post('/guru/kuis-asesmen', {
            onSuccess: () => { setModalOpen(false); reset(); },
        });
    };

    const confirmDelete = (item) => setDeleteTarget(item);
    const doDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/guru/kuis-asesmen/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AppLayout title="Kuis & Asesmen">
            <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>Kuis &amp; Asesmen</CardTitle>
                    <Button icon={Plus} onClick={openModal}>Tambah</Button>
                </CardHeader>
                <CardBody className="p-0">
                    {flash.success && (
                        <div className="mx-4 mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm border border-emerald-200 dark:border-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    {list.data.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>Belum ada kuis atau asesmen.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-8 hidden sm:table-cell">No</th>
                                        <th className="px-4 py-3 text-left">Jenis</th>
                                        <th className="px-4 py-3 text-left">Judul</th>
                                        <th className="px-4 py-3 text-left hidden sm:table-cell">Kelas</th>
                                        <th className="px-4 py-3 text-left hidden sm:table-cell">Tautan</th>
                                        {isAdmin && <th className="px-4 py-3 text-left hidden sm:table-cell">Guru</th>}
                                        <th className="px-4 py-3 w-12" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {list.data.map((item, idx) => {
                                        const Icon = JENIS_ICON[item.jenis] ?? BookOpen;
                                        const rombelNama = item.rombel
                                            ? `${item.rombel.kelas?.nama_kelas ?? ''} ${item.rombel.nama}`.trim()
                                            : '–';
                                        const canDelete = isAdmin || item.guru_id === guruId;
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                                                    {(list.current_page - 1) * list.per_page + idx + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${JENIS_COLOR[item.jenis]}`}>
                                                        <Icon className="h-3 w-3" />
                                                        {item.jenis}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-xs">
                                                    {item.judul}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{rombelNama}</td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <a
                                                        href={item.tautan}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline text-xs"
                                                    >
                                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                                        Buka Tautan
                                                    </a>
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">
                                                        {item.guru?.user?.name ?? '–'}
                                                    </td>
                                                )}
                                                <td className="px-4 py-3">
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => confirmDelete(item)}
                                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {list.last_page > 1 && (
                        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500">
                            <span>Halaman {list.current_page} dari {list.last_page}</span>
                            <div className="flex gap-2">
                                {list.prev_page_url && (
                                    <a href={list.prev_page_url} className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">← Prev</a>
                                )}
                                {list.next_page_url && (
                                    <a href={list.next_page_url} className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Next →</a>
                                )}
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Modal Tambah */}
            <Modal show={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Kuis / Asesmen" maxWidth="lg">
                <form onSubmit={submit} className="space-y-4">
                    <Select
                        label="Jenis"
                        value={data.jenis}
                        onChange={(e) => setData('jenis', e.target.value)}
                        error={errors.jenis}
                    >
                        <option value="Kuis">Kuis</option>
                        <option value="Asesmen">Asesmen</option>
                    </Select>

                    <Input
                        label="Judul"
                        value={data.judul}
                        onChange={(e) => setData('judul', e.target.value)}
                        error={errors.judul}
                        placeholder="Contoh: Ulangan Harian Bab 3"
                        required
                    />

                    <Input
                        label="Tautan (URL)"
                        value={data.tautan}
                        onChange={(e) => setData('tautan', e.target.value)}
                        error={errors.tautan}
                        placeholder="https://forms.gle/..."
                        required
                    />

                    <Select
                        label="Kelas (Rombel)"
                        value={data.rombel_id}
                        onChange={(e) => setData('rombel_id', e.target.value)}
                        error={errors.rombel_id}
                    >
                        <option value="">— Semua Kelas —</option>
                        {rombel.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.kelas?.nama_kelas ? `${r.kelas.nama_kelas} – ` : ''}{r.nama}
                            </option>
                        ))}
                    </Select>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
                        <Button type="submit" loading={processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus item ini?"
                message={`"${deleteTarget?.judul}" akan dihapus permanen.`}
                onConfirm={doDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}
