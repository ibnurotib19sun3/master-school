import AppLayout from '@/Layouts/AppLayout';
import { Link, useForm, router } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import ActionButton from '@/Components/ui/ActionButton';
import { Input, Textarea } from '@/Components/ui/Input';
import {
    ArrowLeft, Plus, Link as LinkIcon, FileText, Trash2, Edit,
    Eye, EyeOff, Users, ExternalLink, Download,
} from 'lucide-react';
import { useRef, useState } from 'react';

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MateriRow({ item, totalSiswa, onEdit, onDelete }) {
    return (
        <div className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className={`shrink-0 mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center ${item.is_link ? 'bg-violet-50 dark:bg-violet-900/30' : 'bg-sky-50 dark:bg-sky-900/30'}`}>
                {item.is_link
                    ? <LinkIcon className="h-4 w-4 text-violet-500" />
                    : <FileText className="h-4 w-4 text-sky-500" />}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium truncate ${item.is_aktif ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 line-through'}`}>
                        {item.judul}
                    </p>
                    {!item.is_aktif && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400">Nonaktif</span>
                    )}
                </div>
                {item.deskripsi && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.deskripsi}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    {item.is_link ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-violet-500 hover:underline">
                            <ExternalLink className="h-3 w-3" /> Buka Link
                        </a>
                    ) : (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-500 hover:underline">
                            <Download className="h-3 w-3" /> {item.file_ext?.toUpperCase()} {item.file_size ? `· ${formatBytes(item.file_size)}` : ''}
                        </a>
                    )}
                    <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {item.dilihat_count ?? 0}/{totalSiswa} siswa sudah lihat
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <ActionButton icon={item.is_aktif ? Eye : EyeOff} onClick={() => onEdit(item, { is_aktif: !item.is_aktif })}
                    title={item.is_aktif ? 'Sembunyikan dari siswa' : 'Tampilkan ke siswa'} color={item.is_aktif ? 'emerald' : 'gray'} />
                <ActionButton icon={Edit} onClick={() => onEdit(item)} title="Edit" color="sky" />
                <ActionButton icon={Trash2} onClick={() => onDelete(item)} title="Hapus" color="rose" />
            </div>
        </div>
    );
}

export default function LmsShow({ pembelajaran, materi, totalSiswa }) {
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [inputMode, setInputMode] = useState('file');
    const [fileError, setFileError] = useState('');
    const fileRef = useRef(null);

    const form = useForm({ judul: '', deskripsi: '', pertemuan_ke: '', file: null, url: '', is_aktif: true });

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setInputMode('file');
        setFileError('');
        form.reset();
        if (fileRef.current) fileRef.current.value = '';
    };

    const openAdd = () => {
        setEditItem(null);
        form.reset();
        setShowModal(true);
    };

    const openEdit = (item, quickPatch = null) => {
        if (quickPatch) {
            router.put(`/guru/lms/materi/${item.id}`, {
                judul: item.judul, deskripsi: item.deskripsi, pertemuan_ke: item.pertemuan_ke, ...quickPatch,
            }, { preserveScroll: true });
            return;
        }
        setEditItem(item);
        form.setData({ judul: item.judul, deskripsi: item.deskripsi ?? '', pertemuan_ke: item.pertemuan_ke ?? '', file: null, url: item.url ?? '', is_aktif: item.is_aktif });
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFileError('');
        form.setData('file', f);
        if (!form.data.judul) form.setData('judul', f.name.replace(/\.[^.]+$/, ''));
    };

    const submit = (e) => {
        e.preventDefault();

        if (editItem) {
            form.transform(() => ({
                judul: form.data.judul, deskripsi: form.data.deskripsi, pertemuan_ke: form.data.pertemuan_ke || null, is_aktif: form.data.is_aktif,
            }));
            form.put(`/guru/lms/materi/${editItem.id}`, { onSuccess: closeModal });
            return;
        }

        if (inputMode === 'file' && !form.data.file) {
            setFileError('Pilih file terlebih dahulu.');
            return;
        }
        if (inputMode === 'link' && !form.data.url) {
            form.setError('url', 'Masukkan URL terlebih dahulu.');
            return;
        }

        const payload = inputMode === 'file'
            ? { judul: form.data.judul, deskripsi: form.data.deskripsi, pertemuan_ke: form.data.pertemuan_ke || null, file: form.data.file }
            : { judul: form.data.judul, deskripsi: form.data.deskripsi, pertemuan_ke: form.data.pertemuan_ke || null, url: form.data.url };

        form.transform(() => payload);
        form.post(`/guru/lms/${pembelajaran.id}`, {
            forceFormData: inputMode === 'file',
            onSuccess: closeModal,
        });
    };

    // Group materi by pertemuan_ke
    const groups = {};
    materi.forEach((m) => {
        const key = m.pertemuan_ke ?? '_tanpa';
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a === '_tanpa') return 1;
        if (b === '_tanpa') return -1;
        return Number(a) - Number(b);
    });

    return (
        <AppLayout title="LMS">
            <div className="mb-5">
                <Link href="/guru/lms" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 mb-2">
                    <ArrowLeft className="h-4 w-4" /> Kembali ke LMS
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{pembelajaran.mata_pelajaran?.nama}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {pembelajaran.rombel?.kelas?.nama ? `Kelas ${pembelajaran.rombel.kelas.nama} · ` : ''}{pembelajaran.rombel?.nama} · {totalSiswa} siswa aktif
                        </p>
                    </div>
                    <Button icon={Plus} onClick={openAdd}>Tambah Materi</Button>
                </div>
            </div>

            {materi.length === 0 ? (
                <Card>
                    <CardBody>
                        <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">Belum ada materi untuk kelas ini.</p>
                        </div>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-4">
                    {sortedKeys.map((key) => (
                        <Card key={key}>
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    {key === '_tanpa' ? 'Tanpa Pertemuan' : `Pertemuan ke-${key}`}
                                </p>
                            </div>
                            <CardBody className="p-0 divide-y divide-gray-100 dark:divide-gray-800">
                                {groups[key].map((item) => (
                                    <MateriRow key={item.id} item={item} totalSiswa={totalSiswa} onEdit={openEdit} onDelete={setDeleteTarget} />
                                ))}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal tambah/edit materi */}
            <Modal show={showModal} onClose={closeModal} title={editItem ? 'Edit Materi' : 'Tambah Materi'}>
                <form onSubmit={submit} className="space-y-4">
                    {!editItem && (
                        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            {[
                                { key: 'file', label: 'Upload File', Icon: FileText },
                                { key: 'link', label: 'Tempel Link', Icon: LinkIcon },
                            ].map(({ key, label, Icon }) => (
                                <button key={key} type="button"
                                    onClick={() => { setInputMode(key); setFileError(''); form.clearErrors(); }}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                                    <Icon className="h-4 w-4" /> {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {!editItem && (inputMode === 'file' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                File <span className="text-red-500">*</span>
                            </label>
                            <div onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-400 dark:hover:border-sky-500 cursor-pointer transition-colors">
                                <FileText className="h-6 w-6 text-sky-400 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    {form.data.file ? (
                                        <p className="text-sm font-medium text-sky-600 dark:text-sky-400 truncate">{form.data.file.name}</p>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Klik untuk pilih file</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">Maks. 20MB</p>
                                </div>
                            </div>
                            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                            {(fileError || form.errors.file) && <p className="text-xs text-red-500 mt-1">{fileError || form.errors.file}</p>}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                URL <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-sky-500 bg-white dark:bg-gray-800">
                                <LinkIcon className="h-4 w-4 text-violet-400 shrink-0" />
                                <input type="url" value={form.data.url} onChange={(e) => form.setData('url', e.target.value)}
                                    placeholder="https://docs.google.com/..."
                                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400" />
                            </div>
                            {form.errors.url && <p className="text-xs text-red-500 mt-1">{form.errors.url}</p>}
                        </div>
                    ))}

                    <Input label="Judul" value={form.data.judul} onChange={(e) => form.setData('judul', e.target.value)} error={form.errors.judul} required />
                    <Input label="Pertemuan Ke" type="number" min="1" placeholder="Opsional"
                        value={form.data.pertemuan_ke} onChange={(e) => form.setData('pertemuan_ke', e.target.value)} />
                    <Textarea label="Deskripsi" value={form.data.deskripsi} onChange={(e) => form.setData('deskripsi', e.target.value)} rows={2} />

                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={form.processing}>
                            {editItem ? 'Simpan Perubahan' : inputMode === 'file' ? 'Upload' : 'Simpan Link'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Materi"
                message={`Materi "${deleteTarget?.judul}" akan dihapus permanen.`}
                onConfirm={() => { router.delete(`/guru/lms/materi/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}
