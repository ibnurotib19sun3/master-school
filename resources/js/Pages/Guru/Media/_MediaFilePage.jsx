import AppLayout from '@/Layouts/AppLayout';
import { router, useForm, Link, usePage } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import { Filter, Trash2, Download, Eye, ExternalLink, Link as LinkIcon, FileText, FileSpreadsheet } from 'lucide-react';
import { useRef, useState } from 'react';

const EXT_ICON = {
    pdf:  { icon: FileText,        cls: 'text-red-500' },
    pptx: { icon: FileText,        cls: 'text-orange-500' },
    ppt:  { icon: FileText,        cls: 'text-orange-500' },
    docx: { icon: FileText,        cls: 'text-sky-500' },
    doc:  { icon: FileText,        cls: 'text-sky-500' },
    xlsx: { icon: FileSpreadsheet, cls: 'text-green-500' },
    xlsm: { icon: FileSpreadsheet, cls: 'text-green-600' },
};

function ExtIcon({ ext, isLink }) {
    if (isLink) return <LinkIcon className="h-8 w-8 shrink-0 text-violet-500" />;
    const cfg = EXT_ICON[ext?.toLowerCase()] ?? { icon: FileText, cls: 'text-gray-400' };
    const Icon = cfg.icon;
    return <Icon className={`h-8 w-8 shrink-0 ${cfg.cls}`} />;
}

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Detect the service name from a URL for display
function linkLabel(url) {
    if (!url) return 'Link';
    try {
        const host = new URL(url).hostname.replace('www.', '');
        if (host.includes('docs.google.com')) {
            if (url.includes('/spreadsheets/')) return 'Google Sheets';
            if (url.includes('/presentation/')) return 'Google Slides';
            return 'Google Docs';
        }
        if (host.includes('drive.google.com')) return 'Google Drive';
        if (host.includes('onedrive') || host.includes('1drv.ms')) return 'OneDrive';
        if (host.includes('office.com') || host.includes('sharepoint.com')) return 'Office 365';
        if (host.includes('canva.com')) return 'Canva';
        return host;
    } catch {
        return 'Link';
    }
}

function FileRow({ item, isAdmin, onDelete }) {
    const isLink = item.is_link;
    const previewUrl = isLink
        ? item.url
        : item.file_path ? `/media/preview?path=${encodeURIComponent(item.file_path)}` : null;

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <ExtIcon ext={item.file_ext} isLink={isLink} />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-xs">{item.judul}</p>
                        {isLink ? (
                            <p className="text-xs text-violet-500 truncate max-w-xs">{linkLabel(item.url)}</p>
                        ) : item.file_name ? (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{item.file_name}</p>
                        ) : null}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">
                {item.mata_pelajaran?.nama ?? '–'}
            </td>
            {isAdmin && (
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                        <img src={item.guru?.user?.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                        {item.guru?.user?.name ?? '–'}
                    </div>
                </td>
            )}
            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap hidden sm:table-cell">
                {isLink ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-medium">
                        <ExternalLink className="h-3 w-3" /> Link
                    </span>
                ) : (
                    <>{item.file_ext?.toUpperCase()} {item.file_size ? `· ${formatBytes(item.file_size)}` : ''}</>
                )}
            </td>
            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap hidden sm:table-cell">
                {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '–'}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    {previewUrl && (
                        isLink ? (
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors whitespace-nowrap">
                                <ExternalLink className="h-3 w-3" /> Buka
                            </a>
                        ) : (
                            <>
                                {item.file_ext?.toLowerCase() === 'pdf' && (
                                    <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap">
                                        <Eye className="h-3 w-3" /> Lihat
                                    </a>
                                )}
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer" download={item.file_name || true}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors whitespace-nowrap">
                                    <Download className="h-3 w-3" /> Unduh
                                </a>
                            </>
                        )
                    )}
                    <button onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function MediaFilePage({
    title, storeUrl, destroyUrlPrefix, acceptMimes, acceptLabel,
    items, mataPelajaran, guruList, isAdmin, filters, filterUrl,
    icon: PageIcon,
}) {
    const roles  = usePage().props.auth?.user?.roles ?? [];
    const canAdd = roles.includes('guru') &&
                   !roles.includes('super_admin') &&
                   !roles.includes('kepala_sekolah');

    const fileRef = useRef(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [inputMode, setInputMode] = useState('file'); // 'file' | 'link'
    const [fileError, setFileError] = useState('');

    const form = useForm({ judul: '', mata_pelajaran_id: '', deskripsi: '', file: null, url: '' });

    const resetModal = () => {
        setShowModal(false);
        setInputMode('file');
        setFileError('');
        form.reset();
        if (fileRef.current) fileRef.current.value = '';
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
        if (inputMode === 'file' && !form.data.file) {
            setFileError('Pilih file terlebih dahulu.');
            return;
        }
        if (inputMode === 'link' && !form.data.url) {
            form.setError('url', 'Masukkan URL terlebih dahulu.');
            return;
        }
        // Send only the relevant field
        const payload = inputMode === 'file'
            ? { judul: form.data.judul, mata_pelajaran_id: form.data.mata_pelajaran_id, deskripsi: form.data.deskripsi, file: form.data.file }
            : { judul: form.data.judul, mata_pelajaran_id: form.data.mata_pelajaran_id, deskripsi: form.data.deskripsi, url: form.data.url };

        form.transform(() => payload);
        form.post(storeUrl, {
            forceFormData: inputMode === 'file',
            onSuccess: resetModal,
            onError: () => {},
        });
    };

    const handleDelete = () => {
        router.delete(`${destroyUrlPrefix}/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const setFilter = (key, val) => {
        router.get(filterUrl, { ...filters, [key]: val || undefined }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title={title}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select value={filters.guru_id ?? ''} onChange={(e) => setFilter('guru_id', e.target.value)}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-44">
                            <option value="">Semua Guru</option>
                            {guruList.map((g) => <option key={g.id} value={g.id}>{g.user?.name}</option>)}
                        </select>
                    </div>
                )}
                {canAdd && (
                    <Button icon={PageIcon} onClick={() => setShowModal(true)} className="ml-auto">
                        Tambah {title}
                    </Button>
                )}
            </div>

            <Card>
                <CardBody className="p-0">
                    {items.data.length === 0 ? (
                        <div className="py-16 text-center text-gray-400">
                            <PageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Belum ada {title.toLowerCase()}.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Judul</th>
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Mata Pelajaran</th>
                                        {isAdmin && <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Guru</th>}
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Tipe</th>
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Tanggal</th>
                                        <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {items.data.map((item) => (
                                        <FileRow key={item.id} item={item} isAdmin={isAdmin} onDelete={setDeleteTarget} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {items.last_page > 1 && (
                        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {items.from}–{items.to} dari {items.total}
                            </p>
                            <div className="flex gap-1">
                                {items.links.map((link, i) => (
                                    <Link key={i} href={link.url ?? '#'}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${link.active ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'} ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Add modal */}
            <Modal show={showModal} onClose={resetModal} title={`Tambah ${title}`}>
                <form onSubmit={submit} className="space-y-4">
                    {/* Mode toggle */}
                    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        {[
                            { key: 'file', label: 'Upload File', Icon: PageIcon },
                            { key: 'link', label: 'Tempel Link', Icon: LinkIcon },
                        ].map(({ key, label, Icon }) => (
                            <button key={key} type="button"
                                onClick={() => { setInputMode(key); setFileError(''); form.clearErrors(); }}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                                <Icon className="h-4 w-4" /> {label}
                            </button>
                        ))}
                    </div>

                    {inputMode === 'file' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                File <span className="text-red-500">*</span>
                            </label>
                            <div onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-400 dark:hover:border-sky-500 cursor-pointer transition-colors">
                                <PageIcon className="h-6 w-6 text-sky-400 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    {form.data.file ? (
                                        <p className="text-sm font-medium text-sky-600 dark:text-sky-400 truncate">{form.data.file.name}</p>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Klik untuk pilih file</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">{acceptLabel} · Maks. 50MB</p>
                                </div>
                            </div>
                            <input ref={fileRef} type="file" accept={acceptMimes} className="hidden" onChange={handleFileChange} />
                            {(fileError || form.errors.file) && (
                                <p className="text-xs text-red-500 mt-1">{fileError || form.errors.file}</p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                URL <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-sky-500 bg-white dark:bg-gray-800">
                                <LinkIcon className="h-4 w-4 text-violet-400 shrink-0" />
                                <input type="url" value={form.data.url}
                                    onChange={(e) => form.setData('url', e.target.value)}
                                    placeholder="https://docs.google.com/..."
                                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400" />
                            </div>
                            {form.errors.url && <p className="text-xs text-red-500 mt-1">{form.errors.url}</p>}
                            <p className="text-xs text-gray-400 mt-1.5">Google Docs, Google Sheets, Google Slides, Canva, OneDrive, dsb.</p>
                        </div>
                    )}

                    <Input label="Judul" value={form.data.judul} onChange={(e) => form.setData('judul', e.target.value)} error={form.errors.judul} required />
                    <Select label="Mata Pelajaran" value={form.data.mata_pelajaran_id} onChange={(e) => form.setData('mata_pelajaran_id', e.target.value)}>
                        <option value="">Pilih mata pelajaran...</option>
                        {mataPelajaran.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
                    </Select>
                    <Textarea label="Deskripsi" value={form.data.deskripsi} onChange={(e) => form.setData('deskripsi', e.target.value)} rows={2} />
                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="secondary" onClick={resetModal}>Batal</Button>
                        <Button type="submit" loading={form.processing}>
                            {inputMode === 'file' ? 'Upload' : 'Simpan Link'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm delete */}
            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hapus <strong>{deleteTarget?.judul}</strong>?{' '}
                    {deleteTarget?.is_link ? 'Link akan dihapus dari daftar.' : 'File akan dihapus permanen.'}
                </p>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
                    <Button variant="danger" onClick={handleDelete}>Hapus</Button>
                </div>
            </Modal>
        </AppLayout>
    );
}
