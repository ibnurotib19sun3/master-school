import AppLayout from '@/Layouts/AppLayout';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select } from '@/Components/ui/Input';
import { Plus, Search, Edit, Trash2, Download, Upload, FileSpreadsheet, X, AlertCircle, KeyRound, CheckCircle } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

const EMAIL_DOMAIN = 'apikmas-djurnal.id';


const statusColors = { Aktif: 'green', Mutasi: 'yellow', Lulus: 'blue', DO: 'red' };
const PER_PAGE_OPTIONS = [
    { value: '25',  label: '25' },
    { value: '50',  label: '50' },
    { value: '75',  label: '75' },
    { value: '100', label: '100' },
    { value: 'all', label: 'Semua' },
];

export default function SiswaIndex({ siswa, rombel, filters }) {
    const { props: { flash } } = usePage();
    const [showModal, setShowModal]       = useState(false);
    const [editItem, setEditItem]         = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showImport, setShowImport]     = useState(false);
    const [importFile, setImportFile]       = useState(null);
    const [importing, setImporting]         = useState(false);
    const [importRombelId, setImportRombelId]   = useState('');
    const [importJurusanId, setImportJurusanId] = useState('');
    const [importError, setImportError]         = useState(null);
    const [selectedIds, setSelectedIds]         = useState(new Set());
    const [showBulkDelete, setShowBulkDelete]   = useState(false);
    const fileRef = useRef(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '', email: '', gender: '', tanggal_lahir: '',
        nis: '', nisn: '', tempat_lahir: '', agama: 'Islam',
        rombel_id: '', jurusan_id: '', status_siswa: 'Aktif',
    });

    /* ── Helpers filter ── */
    const setFilter = (key, val) =>
        router.get('/admin/siswa', { ...filters, [key]: val || undefined }, { preserveState: true, replace: true });

    const setPerPage = (val) =>
        router.get('/admin/siswa', { ...filters, per_page: val, page: 1 }, { preserveState: true, replace: true });

    /* ── Modal tambah/edit ── */
    const submit = (e) => {
        e.preventDefault();
        if (editItem) {
            put(`/admin/siswa/${editItem.id}`, { onSuccess: () => { setEditItem(null); reset(); setShowModal(false); } });
        } else {
            post('/admin/siswa', { onSuccess: () => { setShowModal(false); reset(); } });
        }
    };

    const openEdit = (item) => {
        setEditItem(item);
        setData({
            name: item.user.name, email: item.user.email ?? '', gender: item.user.gender ?? '',
            tanggal_lahir: item.user.tanggal_lahir ?? '',
            nis: item.nis, nisn: item.nisn ?? '', tempat_lahir: item.tempat_lahir ?? '',
            agama: item.agama ?? 'Islam', rombel_id: item.rombel_id ?? '',
            jurusan_id: item.jurusan_id ?? '', status_siswa: item.status_siswa,
        });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditItem(null); reset(); };

    /* Auto-generate email dari NIS (hanya mode tambah) */
    const handleNisChange = useCallback((nis) => {
        setData((prev) => ({
            ...prev,
            nis,
            ...(!editItem && { email: nis ? `${nis}@${EMAIL_DOMAIN}` : '' }),
        }));
    }, [editItem, setData]);

    /* ── Multi-select ── */
    const toggleSelect = (id) => setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const toggleAll = () => {
        if (selectedIds.size === siswa.data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(siswa.data.map((s) => s.id)));
        }
    };

    const submitBulkDelete = () => {
        router.post('/admin/siswa/bulk-delete', { ids: [...selectedIds] }, {
            onSuccess: () => { setSelectedIds(new Set()); setShowBulkDelete(false); },
        });
    };

    /* ── Export ── */
    const handleExport = () => {
        const params = filters.rombel_id ? `?rombel_id=${filters.rombel_id}` : '';
        window.location.href = `/admin/siswa/export${params}`;
    };

    /* ── Import ── */
    const closeImportModal = () => {
        setShowImport(false);
        setImportFile(null);
        setImportRombelId('');
        setImportJurusanId('');
        setImportError(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const submitImport = (e) => {
        e.preventDefault();
        if (!importFile) return;
        setImporting(true);
        setImportError(null);
        const formData = new FormData();
        formData.append('file', importFile);
        if (importRombelId) formData.append('rombel_id', importRombelId);
        if (importJurusanId) formData.append('jurusan_id', importJurusanId);
        router.post('/admin/siswa/import', formData, {
            forceFormData: true,
            onSuccess: () => closeImportModal(),
            onError: (errs) => setImportError(errs.file ?? 'Gagal mengimport file. Periksa format dan isi file.'),
            onFinish: () => setImporting(false),
        });
    };

    const currentPerPage = filters.per_page ?? '25';

    return (
        <AppLayout title="Data Siswa">
            {/* Flash message */}
            {flash?.success && (
                <div className="mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <p>{flash.success}</p>
                        {flash.import_errors?.length > 0 && (
                            <ul className="mt-1 list-disc list-inside text-xs text-green-600 dark:text-green-400 space-y-0.5">
                                {flash.import_errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <CardTitle>Daftar Siswa ({siswa.total})</CardTitle>
                        {selectedIds.size > 0 && (
                            <span className="text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1 rounded-full">
                                {selectedIds.size} dipilih
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {selectedIds.size > 0 ? (
                            <>
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="h-4 w-4" /> Batal Pilih
                                </button>
                                <button
                                    onClick={() => setShowBulkDelete(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" /> Hapus {selectedIds.size} Siswa
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        defaultValue={filters.search}
                                        onChange={(e) => setFilter('search', e.target.value)}
                                        placeholder="Cari NIS / nama..."
                                        className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 w-48 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                </div>

                                {/* Filter rombel */}
                                <select
                                    value={filters.rombel_id ?? ''}
                                    onChange={(e) => setFilter('rombel_id', e.target.value)}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                                >
                                    <option value="">Semua Rombel</option>
                                    {rombel.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                                </select>

                                {/* Import */}
                                <button
                                    onClick={() => setShowImport(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    title="Import dari Excel"
                                >
                                    <Upload className="h-4 w-4" /> Import
                                </button>

                                {/* Export */}
                                <button
                                    onClick={handleExport}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    title="Export ke Excel"
                                >
                                    <Download className="h-4 w-4" /> Export
                                </button>

                                <Button icon={Plus} onClick={() => setShowModal(true)}>Tambah Siswa</Button>
                            </>
                        )}
                    </div>
                </CardHeader>

                <CardBody className="p-0">
                    {/* ── Top control bar: per-page (kiri) + pagination (kanan) ── */}
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                        {/* Kiri: per-page selector */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="whitespace-nowrap">Tampilkan</span>
                            <div className="flex gap-1">
                                {PER_PAGE_OPTIONS.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        onClick={() => setPerPage(value)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                            String(currentPerPage) === value
                                                ? 'bg-sky-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <span className="whitespace-nowrap">data</span>
                        </div>

                        {/* Kanan: pagination */}
                        {siswa.last_page > 1 ? (
                            <>
                                {/* Mobile: prev / info / next */}
                                <div className="flex sm:hidden items-center gap-2">
                                    <Link
                                        href={siswa.prev_page_url ?? '#'}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            siswa.prev_page_url
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                : 'opacity-35 pointer-events-none bg-gray-100 dark:bg-gray-800 text-gray-400'
                                        }`}
                                    >
                                        ‹ Prev
                                    </Link>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                                        {siswa.from}–{siswa.to} / {siswa.total}
                                    </span>
                                    <Link
                                        href={siswa.next_page_url ?? '#'}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            siswa.next_page_url
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                : 'opacity-35 pointer-events-none bg-gray-100 dark:bg-gray-800 text-gray-400'
                                        }`}
                                    >
                                        Next ›
                                    </Link>
                                </div>

                                {/* Desktop: semua link halaman */}
                                <div className="hidden sm:flex items-center gap-1 flex-wrap justify-end">
                                    {siswa.links.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.url ?? '#'}
                                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                                link.active
                                                    ? 'bg-sky-600 text-white'
                                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            } ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {siswa.total} siswa
                            </p>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="pl-4 pr-2 py-3 w-9">
                                        <input
                                            type="checkbox"
                                            checked={siswa.data.length > 0 && selectedIds.size === siswa.data.length}
                                            onChange={toggleAll}
                                            className="rounded border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">NIS</th>
                                    <th className="px-4 py-3 text-left font-medium">Nama Siswa</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Kelas/Rombel</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Agama</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {siswa.data.map((item) => {
                                    const isSelected = selectedIds.has(item.id);
                                    return (
                                        <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-sky-50/60 dark:bg-sky-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                                            <td className="pl-4 pr-2 py-3 w-9">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(item.id)}
                                                    className="rounded border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400 hidden sm:table-cell">{item.nis}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={item.user?.avatar_url} alt={item.user?.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.user?.name}</p>
                                                        <p className="text-xs text-gray-400 truncate">{item.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.rombel?.nama ?? '–'}</td>
                                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.agama ?? '–'}</td>
                                            <td className="px-4 py-3">
                                                <Badge color={statusColors[item.status_siswa] ?? 'gray'}>{item.status_siswa}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {siswa.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                                            Tidak ada data siswa.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </CardBody>
            </Card>

            {/* ── Modal Tambah/Edit ── */}
            <Modal show={showModal} onClose={closeModal} title={editItem ? 'Edit Siswa' : 'Tambah Siswa'} size="lg">
                <form onSubmit={submit} className="space-y-4">
                    {!editItem && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-4 py-3">
                            <KeyRound className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-sky-700 dark:text-sky-300">
                                Email otomatis dari NIS — bisa diubah manual.<br />
                                <span className="font-semibold">Password default = NIS siswa</span> (diset otomatis, bisa direset lewat menu profil).
                            </p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Nama Lengkap" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} required />
                        <Input label="NIS" value={data.nis} onChange={(e) => handleNisChange(e.target.value)} error={errors.nis} required />
                        {!editItem && (
                            <div className="col-span-2 sm:col-span-1">
                                <Input label="Email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} required />
                                <p className="mt-1 text-xs text-gray-400">Otomatis dari NIS — bisa diubah manual</p>
                            </div>
                        )}
                        <Input label="NISN" value={data.nisn} onChange={(e) => setData('nisn', e.target.value)} />
                        <Input label="Tempat Lahir" value={data.tempat_lahir} onChange={(e) => setData('tempat_lahir', e.target.value)} />
                        <Input label="Tanggal Lahir" type="date" value={data.tanggal_lahir} onChange={(e) => setData('tanggal_lahir', e.target.value)} />
                        <Select label="Jenis Kelamin" value={data.gender} onChange={(e) => setData('gender', e.target.value)}>
                            <option value="">Pilih</option>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </Select>
                        <Select label="Agama" value={data.agama} onChange={(e) => setData('agama', e.target.value)}>
                            {['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map((a) => <option key={a} value={a}>{a}</option>)}
                        </Select>
                        <Select label="Rombel" value={data.rombel_id} onChange={(e) => {
                            const rombelId = e.target.value;
                            const r = rombel.find(x => String(x.id) === String(rombelId));
                            const jList = r?.jurusan_list ?? [];
                            setData(prev => ({
                                ...prev,
                                rombel_id: rombelId,
                                jurusan_id: jList.length === 1 ? String(jList[0].id) : '',
                            }));
                        }}>
                            <option value="">Pilih Rombel</option>
                            {rombel.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                        </Select>
                        {/* Jurusan — tampil jika rombel punya >1 jurusan */}
                        {(() => {
                            const r = rombel.find(x => String(x.id) === String(data.rombel_id));
                            const jList = r?.jurusan_list ?? [];
                            if (jList.length <= 1) return null;
                            return (
                                <Select label="Jurusan" value={data.jurusan_id} onChange={(e) => setData('jurusan_id', e.target.value)} error={errors.jurusan_id}>
                                    <option value="">Pilih Jurusan</option>
                                    {jList.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
                                </Select>
                            );
                        })()}
                        {editItem && (
                            <Select label="Status Siswa" value={data.status_siswa} onChange={(e) => setData('status_siswa', e.target.value)}>
                                {['Aktif', 'Mutasi', 'Lulus', 'DO'].map((s) => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            {/* ── Modal Import ── */}
            <Modal show={showImport} onClose={closeImportModal} title="Import Data Siswa dari Excel">
                <div className="space-y-4">
                    {/* Error import */}
                    {importError && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{importError}</span>
                        </div>
                    )}
                    {/* Panduan singkat */}
                    <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 p-4 text-sm space-y-2">
                        <p className="font-semibold text-sky-700 dark:text-sky-300">Panduan pengisian file Excel:</p>
                        <ul className="space-y-1 text-sky-600 dark:text-sky-400 text-xs list-disc list-inside">
                            <li><span className="font-medium">NIS</span> — wajib diisi, harus unik. Password awal siswa = NIS</li>
                            <li><span className="font-medium">Email</span> — kosongkan untuk auto-generate dari NIS: <code className="bg-white/50 px-1 rounded">{'{nis}'}@siswa.sch.id</code></li>
                            <li><span className="font-medium">Jenis Kelamin</span> — isi <code className="bg-white/50 px-1 rounded">L</code> atau <code className="bg-white/50 px-1 rounded">P</code></li>
                            <li><span className="font-medium">Agama</span> — Islam / Kristen / Katolik / Hindu / Buddha / Konghucu</li>
                            <li><span className="font-medium">Rombel</span> — nama harus sama persis. Lihat daftar di sheet Panduan</li>
                        </ul>
                    </div>

                    {/* Download template */}
                    <a
                        href="/admin/siswa/template"
                        className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl border-2 border-dashed border-sky-300 dark:border-sky-600 text-sky-600 dark:text-sky-400 text-sm font-medium hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Unduh Template Excel
                    </a>

                    {/* Upload form */}
                    <form onSubmit={submitImport} className="space-y-3">
                        {/* Pilih Rombel (opsional override) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Paksa ke Rombel <span className="font-normal text-gray-400">(opsional)</span>
                            </label>
                            <select
                                value={importRombelId}
                                onChange={(e) => { setImportRombelId(e.target.value); setImportJurusanId(''); }}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                                <option value="">— Baca dari kolom Rombel di Excel —</option>
                                {rombel.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                {importRombelId
                                    ? 'Semua siswa akan masuk ke rombel ini, kolom Rombel di Excel diabaikan.'
                                    : 'Jika dikosongkan, nama rombel dibaca dari kolom Rombel di Excel.'}
                            </p>
                        </div>

                        {/* Pilih Jurusan — muncul jika rombel yang dipilih punya >1 jurusan */}
                        {(() => {
                            const r = rombel.find(x => String(x.id) === String(importRombelId));
                            const jList = r?.jurusan_list ?? [];
                            if (jList.length <= 1) return null;
                            return (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Paksa ke Jurusan <span className="font-normal text-gray-400">(opsional)</span>
                                    </label>
                                    <select
                                        value={importJurusanId}
                                        onChange={(e) => setImportJurusanId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    >
                                        <option value="">— Baca dari kolom Jurusan di Excel —</option>
                                        {jList.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {importJurusanId
                                            ? 'Kolom Jurusan di Excel diabaikan, semua siswa masuk jurusan ini.'
                                            : 'Rombel ini punya lebih dari 1 jurusan — pilih di sini agar tidak perlu mengisi kolom Jurusan di Excel.'}
                                    </p>
                                </div>
                            );
                        })()}

                        {/* File */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Upload File Excel <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => { setImportFile(e.target.files[0] ?? null); setImportError(null); }}
                                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 dark:file:bg-sky-900/30 dark:file:text-sky-300 hover:file:bg-sky-100 dark:hover:file:bg-sky-900/50"
                            />
                            <p className="text-xs text-gray-400 mt-1">Format: .xlsx, .xls, atau .csv — maks. 5 MB</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-1">
                            <Button type="button" variant="secondary" onClick={closeImportModal}>Batal</Button>
                            <Button type="submit" loading={importing} disabled={!importFile} icon={Upload}>
                                {importing ? 'Mengimpor...' : 'Mulai Import'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Data Siswa"
                message={`Data siswa "${deleteTarget?.user?.name}" (NIS: ${deleteTarget?.nis}) akan dihapus permanen.`}
                onConfirm={() => { router.delete(`/admin/siswa/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />

            <ConfirmDialog
                show={showBulkDelete}
                title="Hapus Siswa Terpilih"
                message={`${selectedIds.size} siswa yang dipilih akan dihapus permanen beserta akun terkait. Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={submitBulkDelete}
                onCancel={() => setShowBulkDelete(false)}
            />
        </AppLayout>
    );
}