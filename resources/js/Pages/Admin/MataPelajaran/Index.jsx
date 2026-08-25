import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import { Plus, Trash2, Search, Edit, LayoutList, LayoutGrid, BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const JENJANG_COLORS = { SD: 'green', SMP: 'blue', SMA: 'indigo', SMK: 'purple' };

function Pagination({ data, filters }) {
    const { current_page, last_page, from, to, total } = data;

    const go = (page) => {
        if (page < 1 || page > last_page) return;
        router.get('/admin/mata-pelajaran', { ...filters, page }, { preserveState: true, replace: true });
    };

    if (last_page <= 1) return null;

    const pages = [];
    for (let i = Math.max(1, current_page - 2); i <= Math.min(last_page, current_page + 2); i++) pages.push(i);

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
                Menampilkan <span className="font-medium text-gray-700 dark:text-gray-300">{from}–{to}</span> dari{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> data
            </p>
            <div className="flex items-center gap-1 order-1 sm:order-2">
                <button onClick={() => go(current_page - 1)} disabled={current_page === 1}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                </button>
                {pages[0] > 1 && (
                    <>
                        <button onClick={() => go(1)} className="px-3 py-1.5 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">1</button>
                        {pages[0] > 2 && <span className="px-1 text-gray-400 text-sm">…</span>}
                    </>
                )}
                {pages.map((p) => (
                    <button key={p} onClick={() => go(p)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${p === current_page ? 'bg-sky-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        {p}
                    </button>
                ))}
                {pages[pages.length - 1] < last_page && (
                    <>
                        {pages[pages.length - 1] < last_page - 1 && <span className="px-1 text-gray-400 text-sm">…</span>}
                        <button onClick={() => go(last_page)} className="px-3 py-1.5 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">{last_page}</button>
                    </>
                )}
                <button onClick={() => go(current_page + 1)} disabled={current_page === last_page}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors">
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default function MataPelajaranIndex({ mataPelajaran, jurusan, filters }) {
    const [showModal,    setShowModal]    = useState(false);
    const [editTarget,   setEditTarget]   = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [view,         setView]         = useState('table');
    const [search,       setSearch]       = useState(filters?.q ?? '');

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/admin/mata-pelajaran', { q: search || undefined }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        kode: '', nama: '', jenjang: 'SMK', jurusan_id: '', kkm: 75, deskripsi: '',
    });

    const openAdd = () => {
        setEditTarget(null);
        reset();
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditTarget(item);
        setData({ kode: item.kode, nama: item.nama, jenjang: item.jenjang, jurusan_id: item.jurusan_id ?? '', kkm: item.kkm, deskripsi: item.deskripsi ?? '' });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); reset(); setEditTarget(null); };

    const submit = (e) => {
        e.preventDefault();
        if (editTarget) {
            put(`/admin/mata-pelajaran/${editTarget.id}`, { onSuccess: closeModal });
        } else {
            post('/admin/mata-pelajaran', { onSuccess: closeModal });
        }
    };

    return (
        <AppLayout title="Mata Pelajaran">
            <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>
                        Mata Pelajaran{' '}
                        <span className="text-sm font-normal text-gray-400">({mataPelajaran.total})</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama / kode…"
                                className="pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-48"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        {/* View toggle */}
                        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <button onClick={() => setView('table')}
                                className={`p-2 transition-colors ${view === 'table' ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                <LayoutList className="h-4 w-4" />
                            </button>
                            <button onClick={() => setView('grid')}
                                className={`p-2 transition-colors ${view === 'grid' ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                        </div>
                        <Button icon={Plus} onClick={openAdd}>Tambah</Button>
                    </div>
                </CardHeader>

                <CardBody className="p-0">
                    {/* ── Table view ── */}
                    {view === 'table' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell w-24">Kode</th>
                                        <th className="px-4 py-3 text-left font-medium">Nama</th>
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell w-24">Jenjang</th>
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Jurusan</th>
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell w-16">KKM</th>
                                        <th className="px-4 py-3 text-left font-medium w-20">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {mataPelajaran.data.length === 0 ? (
                                        <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">Tidak ada data</td></tr>
                                    ) : mataPelajaran.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500 hidden sm:table-cell">{item.kode}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.nama}</td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <Badge color={JENJANG_COLORS[item.jenjang] ?? 'gray'}>{item.jenjang}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.jurusan?.nama ?? 'Umum'}</td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <span className="font-semibold text-sky-600 dark:text-sky-400">{item.kkm}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Grid view ── */}
                    {view === 'grid' && (
                        <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {mataPelajaran.data.length === 0 ? (
                                <p className="col-span-full text-center py-10 text-sm text-gray-400">Tidak ada data</p>
                            ) : mataPelajaran.data.map((item) => (
                                <div key={item.id} className="group relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:shadow-lg transition-all duration-200">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="rounded-xl bg-sky-50 dark:bg-sky-900/30 p-2.5">
                                            <BookOpen className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <Badge color={JENJANG_COLORS[item.jenjang] ?? 'gray'} className="shrink-0">{item.jenjang}</Badge>
                                    </div>
                                    <p className="font-mono text-[11px] text-gray-400 mb-0.5">{item.kode}</p>
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">{item.nama}</p>
                                    <p className="text-xs text-gray-400 mt-1">{item.jurusan?.nama ?? 'Umum'}</p>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">KKM {item.kkm}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Pagination data={mataPelajaran} filters={filters} />
                </CardBody>
            </Card>

            {/* Add / Edit Modal */}
            <Modal show={showModal} onClose={closeModal} title={editTarget ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Kode" value={data.kode} onChange={(e) => setData('kode', e.target.value)} error={errors.kode} required placeholder="MAT" />
                        <Input label="Nama Mata Pelajaran" value={data.nama} onChange={(e) => setData('nama', e.target.value)} error={errors.nama} required />
                        <Select label="Jenjang" value={data.jenjang} onChange={(e) => setData('jenjang', e.target.value)} required>
                            {['SD', 'SMP', 'SMA', 'SMK'].map((j) => <option key={j} value={j}>{j}</option>)}
                        </Select>
                        <Select label="Jurusan" value={data.jurusan_id} onChange={(e) => setData('jurusan_id', e.target.value)}>
                            <option value="">Umum (semua jurusan)</option>
                            {jurusan.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
                        </Select>
                        <Input label="KKM" type="number" min="0" max="100" value={data.kkm} onChange={(e) => setData('kkm', e.target.value)} />
                    </div>
                    <Textarea label="Deskripsi" value={data.deskripsi} onChange={(e) => setData('deskripsi', e.target.value)} rows={2} />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>{editTarget ? 'Simpan Perubahan' : 'Simpan'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Mata Pelajaran"
                message={`Mata pelajaran "${deleteTarget?.nama}" (${deleteTarget?.kode}) akan dihapus permanen.`}
                onConfirm={() => { router.delete(`/admin/mata-pelajaran/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}