import AppLayout from '@/Layouts/AppLayout';
import { useForm, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import { GraduationCap, Plus, Pencil, Trash2, X, BookText, Eye } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

const TINGKAT = [10, 11, 12];

function kodePreview(tingkat, semester, kode) {
    if (!tingkat || !semester || !kode) return '—';
    return `${tingkat}${semester}${String(kode).padStart(2, '0')}`;
}

export default function CapaianPembelajaranIndex({ capaian, mapelList, filterMapelId }) {
    const [showForm, setShowForm]   = useState(false);
    const [editItem, setEditItem]   = useState(null);
    const [detailData, setDetail]   = useState(null);
    const [loadingDetail, setLoading] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        mata_pelajaran_id: filterMapelId ? String(filterMapelId) : '',
        tingkat: '', semester: '', kode: '', capaian: '',
    });

    const openAdd = () => {
        reset();
        setData('mata_pelajaran_id', filterMapelId ? String(filterMapelId) : '');
        setEditItem(null);
        setShowForm(true);
    };

    const openEdit = (item) => {
        setData({
            mata_pelajaran_id: String(item.mata_pelajaran_id),
            tingkat: item.tingkat,
            semester: item.semester,
            kode: item.kode,
            capaian: item.capaian,
        });
        setEditItem(item);
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditItem(null); reset(); };

    const submit = (e) => {
        e.preventDefault();
        if (editItem) {
            put(`/guru/capaian-pembelajaran/${editItem.id}`, { onSuccess: closeForm });
        } else {
            post('/guru/capaian-pembelajaran', { onSuccess: closeForm });
        }
    };

    const handleDelete = (item) => {
        if (!confirm(`Hapus capaian "${item.kode_lengkap}"? Data jurnal yang terhubung akan terlepas.`)) return;
        destroy(`/guru/capaian-pembelajaran/${item.id}`);
    };

    const openDetail = async (item) => {
        setLoading(item.id);
        try {
            const res = await axios.get(`/guru/capaian-pembelajaran/${item.id}/jurnal`);
            setDetail(res.data);
        } finally {
            setLoading(null);
        }
    };

    const setFilter = (mapelId) => {
        router.get('/guru/capaian-pembelajaran', mapelId ? { mapel_id: mapelId } : {}, { preserveState: false });
    };

    const fmtDate = (v) => {
        if (!v) return '—';
        const d = new Date(String(v).length === 10 ? v + 'T00:00:00' : v);
        return isNaN(d) ? v : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const activeMapel = mapelList.find((m) => m.id === filterMapelId);

    return (
        <AppLayout title="Capaian Pembelajaran">
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-sky-600" /> Capaian Pembelajaran
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola capaian pembelajaran per mata pelajaran</p>
                    </div>
                    <Button icon={Plus} onClick={openAdd}>Tambah</Button>
                </div>

                {/* Filter mapel */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter(null)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            !filterMapelId
                                ? 'bg-sky-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        Semua
                    </button>
                    {mapelList.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setFilter(m.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                filterMapelId === m.id
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {m.nama}
                        </button>
                    ))}
                </div>

                {/* Form tambah/edit */}
                {showForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{editItem ? 'Edit Capaian' : 'Tambah Capaian Pembelajaran'}</span>
                                <button onClick={closeForm} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <X className="h-4 w-4 text-gray-400" />
                                </button>
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            <form onSubmit={submit} className="space-y-4">
                                {/* Pilih mapel */}
                                <Select
                                    label="Mata Pelajaran"
                                    value={data.mata_pelajaran_id}
                                    onChange={e => setData('mata_pelajaran_id', e.target.value)}
                                    required
                                    error={errors.mata_pelajaran_id}
                                >
                                    <option value="">Pilih mata pelajaran</option>
                                    {mapelList.map((m) => (
                                        <option key={m.id} value={m.id}>{m.nama}</option>
                                    ))}
                                </Select>

                                <div className="grid grid-cols-3 gap-4">
                                    <Select label="Tingkat" value={data.tingkat} onChange={e => setData('tingkat', e.target.value)} required error={errors.tingkat}>
                                        <option value="">Pilih</option>
                                        {TINGKAT.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                    <Select label="Semester" value={data.semester} onChange={e => setData('semester', e.target.value)} required error={errors.semester}>
                                        <option value="">Pilih</option>
                                        <option value="1">1 (Ganjil)</option>
                                        <option value="2">2 (Genap)</option>
                                    </Select>
                                    <Input
                                        label="Nomor Kode"
                                        value={data.kode}
                                        onChange={e => setData('kode', e.target.value.replace(/\D/g, '').slice(0, 2))}
                                        placeholder="01"
                                        required
                                        error={errors.kode}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span>Kode lengkap:</span>
                                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-base">
                                        {kodePreview(data.tingkat, data.semester, data.kode)}
                                    </span>
                                    {data.tingkat && data.semester && data.kode && (
                                        <span className="text-xs text-gray-400">
                                            (Tingkat {data.tingkat} — Semester {data.semester} — No. {String(data.kode).padStart(2,'0')})
                                        </span>
                                    )}
                                </div>
                                <Textarea
                                    label="Capaian Pembelajaran"
                                    value={data.capaian}
                                    onChange={e => setData('capaian', e.target.value)}
                                    rows={3}
                                    required
                                    error={errors.capaian}
                                    placeholder="Tuliskan deskripsi capaian pembelajaran..."
                                />
                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="secondary" onClick={closeForm}>Batal</Button>
                                    <Button type="submit" loading={processing}>
                                        {editItem ? 'Simpan Perubahan' : 'Tambah Capaian'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                )}

                {/* Tabel */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {capaian.length} Capaian
                            {activeMapel && <span className="ml-2 text-sm font-normal text-sky-600 dark:text-sky-400">— {activeMapel.nama}</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardBody className="p-0">
                        {capaian.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">
                                    {activeMapel
                                        ? `Belum ada capaian untuk ${activeMapel.nama}.`
                                        : 'Belum ada capaian pembelajaran. Klik Tambah untuk mulai.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium w-24">Kode</th>
                                            {!filterMapelId && (
                                                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Mapel</th>
                                            )}
                                            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Tingkat</th>
                                            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Sem</th>
                                            <th className="px-4 py-3 text-left font-medium">Capaian Pembelajaran</th>
                                            <th className="px-4 py-3 text-center font-medium w-20">Jurnal</th>
                                            <th className="px-4 py-3 text-left font-medium w-28">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {capaian.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                                                        {item.kode_lengkap}
                                                    </span>
                                                </td>
                                                {!filterMapelId && (
                                                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">
                                                        {item.mata_pelajaran?.nama ?? '—'}
                                                    </td>
                                                )}
                                                <td className="px-4 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-400">
                                                    Kelas {item.tingkat}
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-400">
                                                    {item.semester}
                                                </td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-xs">
                                                    <p className="line-clamp-2">{item.capaian}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => openDetail(item)}
                                                        disabled={loadingDetail === item.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 disabled:opacity-50 transition-colors"
                                                    >
                                                        <BookText className="h-3 w-3" />
                                                        {item.jurnal_mengajar_count}
                                                        <Eye className="h-3 w-3 ml-0.5" />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1.5">
                                                        <button onClick={() => openEdit(item)}
                                                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-sky-600 transition-colors">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(item)}
                                                            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Modal Detail Jurnal */}
                {detailData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BookText className="h-4 w-4 text-sky-600" />
                                        Jurnal Mengajar — <span className="font-mono text-sky-600">{detailData.capaian.kode_lengkap}</span>
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{detailData.capaian.capaian}</p>
                                </div>
                                <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <X className="h-4 w-4 text-gray-400" />
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {detailData.jurnal.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                                        Belum ada jurnal yang menggunakan capaian ini.
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left font-medium">Tanggal</th>
                                                <th className="px-4 py-2.5 text-left font-medium">Mapel</th>
                                                <th className="px-4 py-2.5 text-left font-medium">Rombel</th>
                                                <th className="px-4 py-2.5 text-left font-medium">Materi</th>
                                                <th className="px-4 py-2.5 text-center font-medium">Ke</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {detailData.jurnal.map(j => (
                                                <tr key={j.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-400 text-xs">{fmtDate(j.tanggal)}</td>
                                                    <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{j.mapel}</td>
                                                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{j.rombel}</td>
                                                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 max-w-xs">
                                                        <p className="line-clamp-1">{j.materi_pokok}</p>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center text-gray-500">{j.pertemuan_ke}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-right">
                                {detailData.jurnal.length} jurnal mengajar menggunakan capaian ini
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
