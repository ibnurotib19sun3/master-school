import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select } from '@/Components/ui/Input';
import { Plus, Edit, Trash2, Users, Lock, AlertCircle, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function RombelIndex({ rombel, tahunAjaran, tahunAktif, filters }) {
    const [showModal, setShowModal]       = useState(false);
    const [editItem, setEditItem]         = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [siswaDaftar, setSiswaDaftar]   = useState(null);
    const [formData, setFormData]         = useState({ kelas: [], jurusan: [], guruUsers: [] });

    const { data, setData, post, put, processing, errors, reset } = useForm({
        tahun_ajaran_id: tahunAktif?.id ?? '',
        kelas_id: '', nama: '',
        kapasitas: 36, wali_kelas_id: '', is_aktif: true,
        jurusan_ids: [],
    });

    useEffect(() => {
        fetch('/admin/rombel/form-data').then((r) => r.json()).then(setFormData);
    }, []);

    const openTambah = () => {
        setEditItem(null);
        reset();
        // Selalu set ke tahun aktif saat membuka form tambah
        setData('tahun_ajaran_id', tahunAktif?.id ?? '');
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setData({
            tahun_ajaran_id: item.tahun_ajaran_id,
            kelas_id:        item.kelas_id,
            nama:            item.nama,
            kapasitas:       item.kapasitas,
            wali_kelas_id:   item.wali_kelas_id ?? '',
            is_aktif:        item.is_aktif,
            jurusan_ids:     (item.jurusan_list ?? []).map((j) => j.id),
        });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditItem(null); reset(); };

    const submit = (e) => {
        e.preventDefault();
        if (editItem) {
            put(`/admin/rombel/${editItem.id}`, { onSuccess: closeModal });
        } else {
            post('/admin/rombel', { onSuccess: closeModal });
        }
    };

    return (
        <AppLayout title="Rombongan Belajar">
            {/* Info tahun aktif */}
            {tahunAktif ? (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-300 w-fit">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Tahun ajaran aktif: <span className="font-semibold">{tahunAktif.nama} – {tahunAktif.semester}</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 w-fit">
                    <AlertCircle className="h-4 w-4" />
                    Belum ada tahun ajaran aktif. Aktifkan terlebih dahulu di menu Tahun Ajaran.
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>Daftar Rombel ({rombel.total})</CardTitle>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Filter tahun ajaran */}
                        <select
                            value={filters.tahun_ajaran_id ?? ''}
                            onChange={(e) => router.get('/admin/rombel', { tahun_ajaran_id: e.target.value || undefined }, { preserveState: true, replace: true })}
                            className="flex-1 sm:flex-none min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="">Semua Tahun Ajaran</option>
                            {tahunAjaran.map((t) => (
                                <option key={t.id} value={t.id}>{t.nama} – {t.semester}{t.is_aktif ? ' ●' : ''}</option>
                            ))}
                        </select>
                        <Button icon={Plus} onClick={openTambah} disabled={!tahunAktif} className="shrink-0">
                            Tambah
                        </Button>
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Rombel</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Tahun Ajaran</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Kelas</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Jurusan</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Wali Kelas</th>
                                    <th className="px-4 py-3 text-left font-medium">Siswa</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {rombel.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.nama}</td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">
                                            {item.tahun_ajaran?.nama ?? '–'}
                                            {item.tahun_ajaran?.is_aktif && (
                                                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.kelas?.nama}</td>
                                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                                            {(item.jurusan_list?.length ?? 0) === 0
                                                ? '–'
                                                : item.jurusan_list.map((j) => j.kode).join(', ')
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.wali_kelas?.name ?? '–'}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => setSiswaDaftar(item)}
                                                className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:underline">
                                                <Users className="h-4 w-4" />
                                                <span className="font-medium">{item.siswa?.length ?? 0}</span>
                                                <span className="text-gray-400">/{item.kapasitas}</span>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge color={item.is_aktif ? 'green' : 'gray'}>{item.is_aktif ? 'Aktif' : 'Nonaktif'}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
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
                                {rombel.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                                            Belum ada data rombel.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* Modal Tambah / Edit */}
            <Modal show={showModal} onClose={closeModal} title={editItem ? 'Edit Rombel' : 'Tambah Rombel'} size="lg">
                <form onSubmit={submit} className="space-y-4">

                    {/* Tahun Ajaran: locked saat tambah, editable saat edit */}
                    {!editItem ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tahun Ajaran
                            </label>
                            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                                <Lock className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                    {tahunAktif ? `${tahunAktif.nama} – ${tahunAktif.semester}` : '–'}
                                </span>
                                <span className="ml-auto text-xs text-emerald-500 dark:text-emerald-400">Aktif</span>
                            </div>
                        </div>
                    ) : (
                        <Select label="Tahun Ajaran" value={data.tahun_ajaran_id} onChange={(e) => setData('tahun_ajaran_id', e.target.value)} required>
                            <option value="">Pilih Tahun Ajaran</option>
                            {formData.tahunAjaran?.map((t) => (
                                <option key={t.id} value={t.id}>{t.nama} – {t.semester}{t.is_aktif ? ' (Aktif)' : ''}</option>
                            ))}
                        </Select>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Kelas" value={data.kelas_id} onChange={(e) => setData('kelas_id', e.target.value)} required>
                            <option value="">Pilih Kelas</option>
                            {formData.kelas.map((k) => <option key={k.id} value={k.id}>{k.jenjang} {k.nama}</option>)}
                        </Select>
                        <Input label="Nama Rombel" value={data.nama} onChange={(e) => setData('nama', e.target.value)} error={errors.nama} required placeholder="XI TKJ 1" />
                        <Input label="Kapasitas" type="number" min="1" value={data.kapasitas} onChange={(e) => setData('kapasitas', e.target.value)} />
                        <Select label="Wali Kelas" value={data.wali_kelas_id} onChange={(e) => setData('wali_kelas_id', e.target.value)}>
                            <option value="">Belum ditentukan</option>
                            {formData.guruUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                    </div>

                    {/* Multi-jurusan */}
                    {formData.jurusan?.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Jurusan
                                <span className="ml-1.5 text-xs font-normal text-gray-400">boleh lebih dari satu</span>
                            </label>
                            {errors.jurusan_ids && (
                                <p className="mb-2 text-xs text-red-500 flex items-start gap-1">
                                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                    {errors.jurusan_ids}
                                </p>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                {formData.jurusan.map((j) => {
                                    const checked = data.jurusan_ids.includes(j.id);
                                    return (
                                        <label key={j.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                                            checked
                                                ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-500 dark:border-sky-500 ring-1 ring-sky-400/30'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-sky-300 dark:hover:border-sky-600'
                                        }`}>
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={checked}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...data.jurusan_ids, j.id]
                                                        : data.jurusan_ids.filter((id) => id !== j.id);
                                                    setData('jurusan_ids', ids);
                                                }}
                                            />
                                            <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                                checked
                                                    ? 'bg-sky-600 border-sky-600'
                                                    : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'
                                            }`}>
                                                {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-semibold leading-none ${checked ? 'text-sky-700 dark:text-sky-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {j.kode}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{j.nama}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {editItem && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={data.is_aktif} onChange={(e) => setData('is_aktif', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-sky-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Rombel aktif</span>
                        </label>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Rombel"
                message={`Rombel "${deleteTarget?.nama}" akan dihapus. Pastikan tidak ada siswa aktif di rombel ini.`}
                onConfirm={() => { router.delete(`/admin/rombel/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* Modal Daftar Siswa */}
            <Modal show={!!siswaDaftar} onClose={() => setSiswaDaftar(null)} title={`Daftar Siswa — ${siswaDaftar?.nama ?? ''}`} size="md">
                {siswaDaftar && (
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {siswaDaftar.siswa?.length ?? 0} siswa / kapasitas {siswaDaftar.kapasitas}
                        </p>
                        {(siswaDaftar.siswa?.length ?? 0) === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">Belum ada siswa di rombel ini.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {siswaDaftar.siswa.map((s, i) => (
                                    <li key={s.id} className="flex items-center gap-3 py-2.5">
                                        <span className="text-xs text-gray-400 w-6 shrink-0 text-right">{i + 1}.</span>
                                        <img src={s.user?.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.user?.name ?? '–'}</p>
                                            <p className="text-xs text-gray-400 font-mono">{s.nis}</p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                            s.status_siswa === 'Aktif'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>{s.status_siswa}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800 mt-3">
                            <Button type="button" variant="secondary" onClick={() => setSiswaDaftar(null)}>Tutup</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}