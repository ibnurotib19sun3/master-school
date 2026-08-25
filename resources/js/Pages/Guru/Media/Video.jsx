import AppLayout from '@/Layouts/AppLayout';
import { useForm, usePage } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import { Plus, Video, Play, Eye } from 'lucide-react';
import { useState } from 'react';

function VideoCard({ item }) {
    const isYoutube = item.sumber === 'YouTube';
    const ytId = isYoutube ? item.url_video.split('v=')[1]?.split('&')[0] : null;
    const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;

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
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <a href={item.url_video} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/90 p-3 hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 text-gray-900" />
                    </a>
                </div>
                <div className="absolute top-2 right-2">
                    <Badge color={item.is_publik ? 'green' : 'gray'}>{item.is_publik ? 'Publik' : 'Privat'}</Badge>
                </div>
            </div>
            <CardBody>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{item.judul}</h3>
                <p className="text-xs text-gray-400 mt-1">{item.mata_pelajaran?.nama ?? 'Umum'} · {item.sumber}</p>
                {item.deskripsi && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{item.deskripsi}</p>}
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{item.views} views</span>
                </div>
            </CardBody>
        </Card>
    );
}

export default function VideoIndex({ video, mataPelajaran }) {
    const roles  = usePage().props.auth?.user?.roles ?? [];
    const canAdd = roles.includes('guru') &&
                   !roles.includes('super_admin') &&
                   !roles.includes('kepala_sekolah');

    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        judul: '', url_video: '', sumber: 'YouTube', mata_pelajaran_id: '', deskripsi: '', is_publik: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/guru/video-edukasi', { onSuccess: () => { setShowModal(false); reset(); } });
    };

    return (
        <AppLayout title="Video Edukasi">
            {canAdd && (
                <div className="flex justify-end mb-6">
                    <Button icon={Plus} onClick={() => setShowModal(true)}>Tambah Video</Button>
                </div>
            )}

            {video.data.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Video className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>Belum ada video edukasi.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {video.data.map((item) => <VideoCard key={item.id} item={item} />)}
                </div>
            )}

            <Modal show={showModal} onClose={() => { setShowModal(false); reset(); }} title="Tambah Video Edukasi">
                <form onSubmit={submit} className="space-y-4">
                    <Input label="Judul Video" value={data.judul} onChange={(e) => setData('judul', e.target.value)} error={errors.judul} required />
                    <Select label="Platform" value={data.sumber} onChange={(e) => setData('sumber', e.target.value)}>
                        {['YouTube', 'Vimeo', 'Upload', 'Lainnya'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Input label="URL Video" type="url" value={data.url_video} onChange={(e) => setData('url_video', e.target.value)} error={errors.url_video} required placeholder="https://youtube.com/watch?v=..." />
                    <Select label="Mata Pelajaran" value={data.mata_pelajaran_id} onChange={(e) => setData('mata_pelajaran_id', e.target.value)}>
                        <option value="">Umum (semua mapel)</option>
                        {mataPelajaran.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
                    </Select>
                    <Textarea label="Deskripsi" value={data.deskripsi} onChange={(e) => setData('deskripsi', e.target.value)} rows={3} />
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={data.is_publik} onChange={(e) => setData('is_publik', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-sky-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Video dapat diakses oleh siswa</span>
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => { setShowModal(false); reset(); }}>Batal</Button>
                        <Button type="submit" loading={processing}>Tambah Video</Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
