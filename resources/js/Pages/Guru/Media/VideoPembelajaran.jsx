import AppLayout from '@/Layouts/AppLayout';
import { router, useForm, Link, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import { Plus, Video, Play, Eye, ExternalLink, Trash2, Filter, Upload, Link as LinkIcon } from 'lucide-react';
import { useState, useRef } from 'react';

function ytId(url) {
    if (!url) return null;
    const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return m?.[1] ?? null;
}

function ItemCard({ item, isAdmin, onDelete }) {
    const isUpload = !item.is_link;
    const id       = isUpload ? null : ytId(item.url_video);
    const thumb    = id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
    const playUrl  = isUpload ? item.file_url : item.url_video;

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-gray-900 overflow-hidden">
                {thumb ? (
                    <img src={thumb} alt={item.judul} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Video className="h-12 w-12 text-gray-600" />
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <a href={playUrl} target="_blank" rel="noopener noreferrer"
                        className="rounded-full bg-white/90 p-3 hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 text-gray-900" />
                    </a>
                </div>
                {isUpload && (
                    <div className="absolute top-2 left-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-600 text-white">Upload</span>
                    </div>
                )}
            </div>
            <CardBody className="py-3">
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{item.judul}</p>
                {item.mata_pelajaran && (
                    <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">{item.mata_pelajaran.nama}</p>
                )}
                {isAdmin && item.guru?.user && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.guru.user.name}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                    <a href={playUrl} target="_blank" rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                        {isUpload ? <><Eye className="h-3.5 w-3.5" /> Putar</> : <><ExternalLink className="h-3.5 w-3.5" /> Buka</>}
                    </a>
                    <button onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </CardBody>
        </Card>
    );
}

export default function VideoPembelajaran({ items, mataPelajaran, guruList, isAdmin, filters }) {
    const roles  = usePage().props.auth?.user?.roles ?? [];
    const canAdd = roles.includes('guru') &&
                   !roles.includes('super_admin') &&
                   !roles.includes('kepala_sekolah');

    const [showModal, setShowModal]   = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [inputMode, setInputMode]   = useState('link'); // 'link' | 'file'
    const [fileError, setFileError]   = useState('');
    const fileRef = useRef(null);

    const form = useForm({ judul: '', url_video: '', sumber: 'YouTube', mata_pelajaran_id: '', deskripsi: '', file: null });

    const resetModal = () => {
        setShowModal(false);
        setInputMode('link');
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
        if (inputMode === 'file' && !form.data.file) { setFileError('Pilih file video terlebih dahulu.'); return; }
        if (inputMode === 'link' && !form.data.url_video) { form.setError('url_video', 'Masukkan URL video.'); return; }

        const payload = inputMode === 'file'
            ? { judul: form.data.judul, mata_pelajaran_id: form.data.mata_pelajaran_id, deskripsi: form.data.deskripsi, file: form.data.file }
            : { judul: form.data.judul, url_video: form.data.url_video, sumber: form.data.sumber, mata_pelajaran_id: form.data.mata_pelajaran_id, deskripsi: form.data.deskripsi };

        form.transform(() => payload);
        form.post('/guru/video-pembelajaran', {
            forceFormData: inputMode === 'file',
            onSuccess: resetModal,
            onError: () => {},
        });
    };

    const handleDelete = () => {
        router.delete(`/guru/video-pembelajaran/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const setFilter = (key, val) => {
        router.get('/guru/video-pembelajaran', { ...filters, [key]: val || undefined }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Video Pembelajaran">
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
                    <Button icon={Plus} onClick={() => setShowModal(true)} className="ml-auto">
                        Tambah Video
                    </Button>
                )}
            </div>

            {items.data.length === 0 ? (
                <Card>
                    <CardBody className="py-16 text-center text-gray-400">
                        <Video className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Belum ada video pembelajaran.</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.data.map((item) => (
                        <ItemCard key={item.id} item={item} isAdmin={isAdmin} onDelete={setDeleteTarget} />
                    ))}
                </div>
            )}

            {items.last_page > 1 && (
                <div className="flex justify-center gap-1 mt-5">
                    {items.links.map((link, i) => (
                        <Link key={i} href={link.url ?? '#'}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${link.active ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'} ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}

            {/* Modal Tambah */}
            <Modal show={showModal} onClose={resetModal} title="Tambah Video Pembelajaran">
                <form onSubmit={submit} className="space-y-4">
                    {/* Toggle file / link */}
                    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        {[
                            { key: 'link', label: 'Tempel Link', Icon: LinkIcon },
                            { key: 'file', label: 'Upload File', Icon: Upload },
                        ].map(({ key, label, Icon }) => (
                            <button key={key} type="button"
                                onClick={() => { setInputMode(key); setFileError(''); form.clearErrors(); }}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                                <Icon className="h-4 w-4" /> {label}
                            </button>
                        ))}
                    </div>

                    {inputMode === 'link' ? (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Video <span className="text-red-500">*</span></label>
                                <input type="url" value={form.data.url_video}
                                    onChange={(e) => form.setData('url_video', e.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                {form.errors.url_video && <p className="text-xs text-red-500 mt-1">{form.errors.url_video}</p>}
                            </div>
                            <Select label="Platform" value={form.data.sumber} onChange={(e) => form.setData('sumber', e.target.value)}>
                                {['YouTube', 'Vimeo', 'Lainnya'].map((s) => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">File Video <span className="text-red-500">*</span></label>
                            <div onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-400 dark:hover:border-sky-500 cursor-pointer transition-colors">
                                <Video className="h-6 w-6 text-sky-400 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    {form.data.file ? (
                                        <p className="text-sm font-medium text-sky-600 dark:text-sky-400 truncate">{form.data.file.name}</p>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Klik untuk pilih file video</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">MP4, MKV, AVI, MOV, WEBM · Maks. 200MB</p>
                                </div>
                            </div>
                            <input ref={fileRef} type="file" accept=".mp4,.mkv,.avi,.mov,.webm,.m4v" className="hidden" onChange={handleFileChange} />
                            {(fileError || form.errors.file) && <p className="text-xs text-red-500 mt-1">{fileError || form.errors.file}</p>}
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
                        <Button type="submit" loading={form.processing}>{inputMode === 'file' ? 'Upload' : 'Simpan'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm delete */}
            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Video">
                <p className="text-sm text-gray-600 dark:text-gray-400">Hapus video <strong>{deleteTarget?.judul}</strong>?</p>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
                    <Button variant="danger" onClick={handleDelete}>Hapus</Button>
                </div>
            </Modal>
        </AppLayout>
    );
}
