import AppLayout from '@/Layouts/AppLayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import { Input, Select } from '@/Components/ui/Input';
import RichEditor from '@/Components/ui/RichEditor';
import RichContent from '@/Components/ui/RichContent';
import { Plus, MessageSquare, Trash2, CheckCircle, GraduationCap, Users, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

const KATEGORI_COLOR = {
    Evaluasi: 'blue', Saran: 'green', Perbaikan: 'yellow',
    Apresiasi: 'indigo', Peringatan: 'red',
};

export default function CatatanKepsekIndex({ catatan, guru, tatausaha }) {
    const { props } = usePage();
    const roles = props.auth?.user?.roles ?? [];
    const isKepsek = roles.some((r) => ['kepala_sekolah', 'super_admin'].includes(r));

    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId]   = useState(null);
    const [sasaran, setSasaran]     = useState('guru'); // 'guru' | 'tatausaha'
    const [searchNama, setSearchNama] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        sasaran: 'guru', guru_id: '', tatausaha_id: '',
        kategori: 'Evaluasi', judul: '', catatan: '',
    });

    const openModal = () => { reset(); setSasaran('guru'); setData('sasaran', 'guru'); setSearchNama(''); setShowModal(true); };
    const closeModal = () => { setShowModal(false); reset(); setSearchNama(''); };

    const changeSasaran = (val) => {
        setSasaran(val);
        setSearchNama('');
        setData((prev) => ({ ...prev, sasaran: val, guru_id: '', tatausaha_id: '' }));
    };

    const filteredGuru = useMemo(() =>
        guru.filter((g) => !searchNama || (g.user?.name ?? '').toLowerCase().includes(searchNama.toLowerCase())),
        [guru, searchNama]
    );
    const filteredTU = useMemo(() =>
        tatausaha.filter((tu) => !searchNama || (tu.user?.name ?? '').toLowerCase().includes(searchNama.toLowerCase())),
        [tatausaha, searchNama]
    );

    const submit = (e) => {
        e.preventDefault();
        post('/admin/catatan-kepsek', { onSuccess: closeModal });
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(`/admin/catatan-kepsek/${deleteId}`, { onSuccess: () => setDeleteId(null) });
    };

    const fmt = (val) => {
        if (!val) return '-';
        return new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getNama = (item) => {
        if (item.guru) return item.guru.user?.name;
        if (item.tatausaha) return item.tatausaha.user?.name;
        return '-';
    };

    const getAvatar = (item) => item.guru?.user?.avatar_url ?? item.tatausaha?.user?.avatar_url;

    const isTU = (item) => !item.guru_id && !!item.tatausaha_id;

    return (
        <AppLayout title="Catatan Kepala Sekolah">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-sky-600" />
                        Catatan Kepala Sekolah
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Catatan untuk guru dan tata usaha
                    </p>
                </div>
                {isKepsek && (
                    <Button icon={Plus} onClick={openModal}>Tulis Catatan</Button>
                )}
            </div>

            <div className="space-y-3">
                {catatan.data.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Belum ada catatan.</p>
                    </div>
                )}

                {catatan.data.map((item) => (
                    <Card key={item.id}>
                        <CardBody>
                            <div className="flex items-start gap-4">
                                <img src={getAvatar(item)} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <Badge color={KATEGORI_COLOR[item.kategori] ?? 'gray'}>{item.kategori}</Badge>
                                        {isTU(item) ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 rounded-full px-2 py-0.5">
                                                <Users className="h-3 w-3" /> Tata Usaha
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30 rounded-full px-2 py-0.5">
                                                <GraduationCap className="h-3 w-3" /> Guru
                                            </span>
                                        )}
                                        <Badge color={item.status === 'Dibaca' ? 'green' : 'blue'}>
                                            {item.status === 'Dibaca'
                                                ? <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Dibaca</span>
                                                : 'Terkirim'}
                                        </Badge>
                                        <span className="text-xs text-gray-400">{fmt(item.created_at)}</span>
                                    </div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.judul}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        Kepada: <span className="font-medium text-gray-700 dark:text-gray-300">{getNama(item)}</span>
                                        {item.kepsek && <span className="ml-2 text-gray-400">· oleh {item.kepsek?.name}</span>}
                                    </p>
                                    <RichContent html={item.catatan} className="mt-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400" />
                                    {item.status === 'Dibaca' && item.dibaca_pada && (
                                        <p className="text-xs text-gray-400 mt-1">Dibaca pada {fmt(item.dibaca_pada)}</p>
                                    )}
                                </div>
                                {isKepsek && (
                                    <button onClick={() => setDeleteId(item.id)}
                                        className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Modal tulis catatan */}
            <Modal show={showModal} onClose={closeModal} title="Tulis Catatan">
                <form onSubmit={submit} className="space-y-4">
                    {/* Toggle sasaran */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ditujukan Kepada</p>
                        <div className="flex gap-2">
                            {[
                                { val: 'guru', label: 'Guru', icon: GraduationCap },
                                { val: 'tatausaha', label: 'Tata Usaha', icon: Users },
                            ].map(({ val, label, icon: Icon }) => (
                                <button key={val} type="button" onClick={() => changeSasaran(val)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                        sasaran === val
                                            ? 'bg-sky-600 text-white border-sky-600'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-sky-400'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" /> {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchNama}
                                onChange={(e) => { setSearchNama(e.target.value); setData(sasaran === 'guru' ? 'guru_id' : 'tatausaha_id', ''); }}
                                placeholder={`Cari nama ${sasaran === 'guru' ? 'guru' : 'tata usaha'}...`}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                        {sasaran === 'guru' ? (
                            <Select label="Guru" value={data.guru_id} onChange={(e) => setData('guru_id', e.target.value)} error={errors.guru_id} required>
                                <option value="">Pilih Guru</option>
                                {filteredGuru.map((g) => <option key={g.id} value={g.id}>{g.user?.name}</option>)}
                            </Select>
                        ) : (
                            <Select label="Tata Usaha" value={data.tatausaha_id} onChange={(e) => setData('tatausaha_id', e.target.value)} error={errors.tatausaha_id} required>
                                <option value="">Pilih Tata Usaha</option>
                                {filteredTU.map((tu) => <option key={tu.id} value={tu.id}>{tu.user?.name}</option>)}
                            </Select>
                        )}
                    </div>

                    <Select label="Kategori" value={data.kategori} onChange={(e) => setData('kategori', e.target.value)}>
                        {['Evaluasi', 'Saran', 'Perbaikan', 'Apresiasi', 'Peringatan'].map((k) => <option key={k} value={k}>{k}</option>)}
                    </Select>
                    <Input label="Judul Catatan" value={data.judul} onChange={(e) => setData('judul', e.target.value)} error={errors.judul} required />
                    <RichEditor label="Isi Catatan" value={data.catatan} onChange={(html) => setData('catatan', html)} error={errors.catatan} placeholder="Tulis isi catatan di sini..." />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>Kirim Catatan</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal hapus */}
            <Modal show={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Catatan">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Yakin ingin menghapus catatan ini?</p>
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={() => setDeleteId(null)}>Batal</Button>
                    <Button type="button" variant="danger" icon={Trash2} onClick={confirmDelete}>Hapus</Button>
                </div>
            </Modal>
        </AppLayout>
    );
}
