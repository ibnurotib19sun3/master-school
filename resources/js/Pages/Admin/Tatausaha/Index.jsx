import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select } from '@/Components/ui/Input';
import Pagination from '@/Components/ui/Pagination';
import ActionButton from '@/Components/ui/ActionButton';
import { Plus, Search, Edit, Trash2, Briefcase, UserPlus, Users, X, ChevronDown, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';

const JABATAN_LIST = ['Tatausaha', 'Keuangan', 'Operator', 'Kebersihan', 'Keamanan', 'Penjaga Kantin', 'Toolman'];
const STATUS_KEPEGAWAIAN_LIST = ['PNS', 'PPPK', 'PTY', 'Honor', 'PTT', 'Kontrak'];
const PENDIDIKAN_LIST = ['SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'];

const PER_PAGE_OPTIONS = [
    { value: '25',  label: '25' },
    { value: '50',  label: '50' },
    { value: '75',  label: '75' },
    { value: '100', label: '100' },
    { value: 'all', label: 'Semua' },
];

const JABATAN_COLOR = {
    Tatausaha: 'blue', Keuangan: 'green', Operator: 'indigo',
    Kebersihan: 'yellow', Keamanan: 'red', 'Penjaga Kantin': 'orange', Toolman: 'cyan',
};

const DEFAULT_PASSWORD = 'apikmasdjurnal';

/* ── Searchable user picker ─────────────────────────────────── */
function UserPicker({ users, value, onChange, error }) {
    const [open, setOpen]       = useState(false);
    const [q, setQ]             = useState('');
    const ref                   = useRef(null);
    const selected              = users.find(u => u.id === value);

    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase()) ||
        u.roles.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <div className="relative" ref={ref}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pilih Pengguna <span className="text-red-500">*</span>
            </label>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors
                    ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}
                    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
                    hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500`}
            >
                {selected ? (
                    <span className="flex-1 min-w-0">
                        <span className="font-medium">{selected.name}</span>
                        <span className="text-gray-400 ml-2 text-xs">{selected.roles || 'Tanpa role'}</span>
                    </span>
                ) : (
                    <span className="text-gray-400 flex-1">Cari dan pilih pengguna…</span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <span onClick={(e) => { e.stopPropagation(); onChange(''); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input
                                autoFocus
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                placeholder="Cari nama, email, atau jabatan…"
                                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-700/50 border-0 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:text-gray-200"
                            />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="text-center py-6 text-sm text-gray-400">Tidak ada pengguna ditemukan.</p>
                        ) : filtered.map(u => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => { onChange(u.id); setOpen(false); setQ(''); }}
                                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                                    ${value === u.id ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                </div>
                                {u.roles && (
                                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                                        {u.roles}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function nameToEmailPrefix(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '.');
}

const EMAIL_DOMAIN = 'apikmas-djurnal.id';

export default function TatausahaIndex({ tatausaha, filters, availableUsers = [], flash }) {
    const [showModal, setShowModal]       = useState(false);
    const [editItem, setEditItem]         = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [dariAkunAda, setDariAkunAda]   = useState(false);
    const [showImport, setShowImport]     = useState(false);
    const [importFile, setImportFile]     = useState(null);
    const [importing, setImporting]       = useState(false);
    const [importError, setImportError]   = useState(null);
    const importFileRef = useRef(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '', email: '', password: DEFAULT_PASSWORD, gender: '',
        nip: '', gelar_depan: '', gelar_belakang: '',
        jabatan: 'Tatausaha', status_kepegawaian: '', tanggal_masuk: '',
        pendidikan_terakhir: '', nomor_wa: '',
        is_aktif: true, is_active: true,
        dari_akun_ada: false, existing_user_id: '',
    });

    const handleNameChange = useCallback((name) => {
        setData((prev) => {
            const updates = { ...prev, name };
            if (!editItem) {
                const prefix = nameToEmailPrefix(name);
                updates.email = prefix ? `${prefix}@${EMAIL_DOMAIN}` : '';
            }
            return updates;
        });
    }, [editItem, setData]);

    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/admin/tatausaha', { ...filters, search: searchTerm || undefined, page: 1 }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const setPerPage = (val) => {
        router.get('/admin/tatausaha', { ...filters, per_page: val, page: 1 }, { preserveState: true, replace: true });
    };

    const closeImportModal = () => {
        setShowImport(false);
        setImportFile(null);
        setImportError(null);
        if (importFileRef.current) importFileRef.current.value = '';
    };

    const submitImport = (e) => {
        e.preventDefault();
        if (!importFile) return;
        setImporting(true);
        setImportError(null);
        router.post('/admin/tatausaha/import', { file: importFile }, {
            forceFormData: true,
            onSuccess: () => closeImportModal(),
            onError: (errs) => setImportError(errs.file ?? 'Gagal mengimport file. Periksa format dan isi file.'),
            onFinish: () => setImporting(false),
        });
    };

    const submit = (e) => {
        e.preventDefault();
        if (editItem) {
            put(`/admin/tatausaha/${editItem.id}`, {
                onSuccess: () => { setEditItem(null); reset(); setShowModal(false); },
            });
        } else {
            post('/admin/tatausaha', {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const openEdit = (item) => {
        setEditItem(item);
        setData({
            name: item.user.name, email: item.user.email, password: '',
            gender: item.user.gender ?? '',
            nip: item.nip ?? '',
            gelar_depan: item.gelar_depan ?? '',
            gelar_belakang: item.gelar_belakang ?? '',
            jabatan: item.jabatan ?? 'Tatausaha',
            status_kepegawaian: item.status_kepegawaian ?? '',
            tanggal_masuk: item.tanggal_masuk ? item.tanggal_masuk.substring(0, 10) : '',
            pendidikan_terakhir: item.pendidikan_terakhir ?? '',
            nomor_wa: item.nomor_wa ?? '',
            is_aktif: item.is_aktif ?? true,
            is_active: item.user.is_active ?? true,
        });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditItem(null); setDariAkunAda(false); reset(); };

    const openTambah = () => {
        reset();
        setEditItem(null);
        setDariAkunAda(false);
        setData((p) => ({ ...p, password: DEFAULT_PASSWORD, dari_akun_ada: false, existing_user_id: '' }));
        setShowModal(true);
    };

    const switchMode = (toAkunAda) => {
        setDariAkunAda(toAkunAda);
        setData((p) => ({ ...p, dari_akun_ada: toAkunAda, existing_user_id: '', name: '', email: '' }));
    };

    return (
        <AppLayout title="Data Tata Usaha">
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
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-violet-600" />
                        Daftar Tata Usaha ({tatausaha.total})
                    </CardTitle>
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        {/* Per-page dropdown */}
                        <select
                            value={filters.per_page ?? '25'}
                            onChange={(e) => setPerPage(e.target.value)}
                            className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            {PER_PAGE_OPTIONS.map(({ value, label }) => (
                                <option key={value} value={value}>{label} data</option>
                            ))}
                        </select>

                        {/* Search */}
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari tata usaha..."
                                className="pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Import */}
                        <button
                            onClick={() => setShowImport(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                            <FileSpreadsheet className="h-4 w-4" /> Import Excel
                        </button>

                        <Button icon={Plus} onClick={openTambah}>Tambah Tata Usaha</Button>
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    {/* Mobile card view */}
                    <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                        {tatausaha.data.length === 0 && (
                            <div className="py-14 text-center text-gray-400">
                                <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Belum ada data tata usaha.</p>
                            </div>
                        )}
                        {tatausaha.data.map((item) => (
                            <div key={item.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <img src={item.user?.avatar_url} alt={item.user?.name} className="h-9 w-9 rounded-full object-cover shrink-0 mt-0.5"
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name ?? '?')}&background=0284c7&color=fff&bold=true&size=64`; }} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.nama_lengkap}</p>
                                            <p className="text-xs text-gray-400 truncate">{item.user?.email}</p>
                                            {item.nomor_wa && <p className="text-xs text-gray-400 mt-0.5">{item.nomor_wa}</p>}
                                        </div>
                                        <div className="flex gap-1.5 shrink-0">
                                            <ActionButton icon={Edit} onClick={() => openEdit(item)} title="Edit" color="sky" />
                                            <ActionButton icon={Trash2} onClick={() => setDeleteTarget(item)} title="Hapus" color="rose" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        <Badge color={JABATAN_COLOR[item.jabatan] ?? 'gray'}>{item.jabatan ?? '–'}</Badge>
                                        <Badge color={item.is_aktif ? 'green' : 'gray'}>{item.is_aktif ? 'Aktif' : 'Non-aktif'}</Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop table */}
                    <div className="overflow-x-auto hidden sm:block">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left w-8 hidden sm:table-cell">No</th>
                                    <th className="px-4 py-3 text-left">Nama</th>
                                    <th className="px-4 py-3 text-left hidden sm:table-cell">NIP/NIPY</th>
                                    <th className="px-4 py-3 text-left">Jabatan</th>
                                    <th className="px-4 py-3 text-left hidden sm:table-cell">No. WA</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {tatausaha.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-14 text-gray-400">
                                            <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Belum ada data tata usaha.</p>
                                        </td>
                                    </tr>
                                )}
                                {tatausaha.data.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                                            {(tatausaha.current_page - 1) * tatausaha.per_page + idx + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.user?.avatar_url}
                                                    alt={item.user?.name}
                                                    className="h-8 w-8 rounded-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name ?? '?')}&background=0284c7&color=fff&bold=true&size=64`; }}
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.nama_lengkap}</p>
                                                    <p className="text-xs text-gray-400">{item.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.nip ?? '–'}</td>
                                        <td className="px-4 py-3">
                                            <Badge color={JABATAN_COLOR[item.jabatan] ?? 'gray'}>
                                                {item.jabatan ?? '–'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{item.nomor_wa ?? '–'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge color={item.is_aktif ? 'green' : 'gray'}>
                                                {item.is_aktif ? 'Aktif' : 'Non-aktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5">
                                                <ActionButton icon={Edit} onClick={() => openEdit(item)} title="Edit" color="sky" />
                                                <ActionButton icon={Trash2} onClick={() => setDeleteTarget(item)} title="Hapus" color="rose" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={tatausaha} />
                </CardBody>
            </Card>

            {/* Modal tambah / edit */}
            <Modal
                show={showModal}
                onClose={closeModal}
                title={editItem ? 'Edit Tata Usaha' : 'Tambah Tata Usaha'}
                size="lg"
            >
                <form onSubmit={submit} className="space-y-4">
                    {/* Toggle mode — hanya saat tambah baru */}
                    {!editItem && (
                        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-sm w-full">
                            <button
                                type="button"
                                onClick={() => switchMode(false)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-medium transition-colors
                                    ${!dariAkunAda ? 'bg-sky-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <UserPlus className="h-4 w-4" />
                                Buat Akun Baru
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode(true)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-medium transition-colors border-l border-gray-200 dark:border-gray-700
                                    ${dariAkunAda ? 'bg-sky-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <Users className="h-4 w-4" />
                                Dari Akun yang Ada
                            </button>
                        </div>
                    )}

                    {/* Data Akun */}
                    {dariAkunAda && !editItem ? (
                        /* ── Mode merangkap: pilih user yang sudah ada ── */
                        <div>
                            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 mb-3">
                                Role <strong>tatausaha</strong> akan ditambahkan ke akun yang dipilih — role lain (misal: guru) tetap aktif.
                            </div>
                            <UserPicker
                                users={availableUsers}
                                value={data.existing_user_id}
                                onChange={(id) => setData('existing_user_id', id)}
                                error={errors.existing_user_id}
                            />
                        </div>
                    ) : !editItem ? (
                        /* ── Mode normal: buat akun baru ── */
                        <>
                            <p className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Data Akun</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Input
                                        label="Nama Lengkap"
                                        value={data.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        error={errors.name}
                                        required
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        error={errors.email}
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-400">Otomatis dari nama — bisa diubah manual</p>
                                </div>
                                <div>
                                    <Input
                                        label="Password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        error={errors.password}
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-400">
                                        Default: <span className="font-mono">{DEFAULT_PASSWORD}</span>
                                    </p>
                                </div>
                                <Select
                                    label="Jenis Kelamin"
                                    value={data.gender}
                                    onChange={(e) => setData('gender', e.target.value)}
                                >
                                    <option value="">Pilih</option>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </Select>
                            </div>
                        </>
                    ) : (
                        /* ── Mode edit: tampil seperti sebelumnya ── */
                        <>
                            <p className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Data Akun</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Nama Lengkap"
                                    value={data.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    error={errors.name}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                    required
                                />
                                <Select
                                    label="Jenis Kelamin"
                                    value={data.gender}
                                    onChange={(e) => setData('gender', e.target.value)}
                                >
                                    <option value="">Pilih</option>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </Select>
                            </div>
                        </>
                    )}

                    {/* Data Kepegawaian */}
                    <p className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 pt-2">Data Kepegawaian</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="NIP/NIPY"
                            value={data.nip}
                            onChange={(e) => setData('nip', e.target.value)}
                            error={errors.nip}
                            placeholder="Nomor Induk Pegawai"
                        />
                        <Select
                            label="Jabatan"
                            value={data.jabatan}
                            onChange={(e) => setData('jabatan', e.target.value)}
                            error={errors.jabatan}
                            required
                        >
                            {JABATAN_LIST.map((j) => (
                                <option key={j} value={j}>{j}</option>
                            ))}
                        </Select>
                        <Input
                            label="Gelar Depan"
                            value={data.gelar_depan}
                            onChange={(e) => setData('gelar_depan', e.target.value)}
                            placeholder="contoh: Drs."
                        />
                        <Input
                            label="Gelar Belakang"
                            value={data.gelar_belakang}
                            onChange={(e) => setData('gelar_belakang', e.target.value)}
                            placeholder="contoh: S.Pd., M.M."
                        />
                        <Select
                            label="Status Kepegawaian"
                            value={data.status_kepegawaian}
                            onChange={(e) => setData('status_kepegawaian', e.target.value)}
                        >
                            <option value="">Pilih Status</option>
                            {STATUS_KEPEGAWAIAN_LIST.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </Select>
                        <Select
                            label="Pendidikan Terakhir"
                            value={data.pendidikan_terakhir}
                            onChange={(e) => setData('pendidikan_terakhir', e.target.value)}
                        >
                            <option value="">Pilih Pendidikan</option>
                            {PENDIDIKAN_LIST.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </Select>
                        <Input
                            label="Tanggal Masuk"
                            type="date"
                            value={data.tanggal_masuk}
                            onChange={(e) => setData('tanggal_masuk', e.target.value)}
                        />
                        <Input
                            label="Nomor WhatsApp"
                            value={data.nomor_wa}
                            onChange={(e) => setData('nomor_wa', e.target.value)}
                            placeholder="628123456789"
                        />
                        {editItem && (
                            <Select
                                label="Status"
                                value={data.is_aktif ? '1' : '0'}
                                onChange={(e) => setData('is_aktif', e.target.value === '1')}
                            >
                                <option value="1">Aktif</option>
                                <option value="0">Non-aktif</option>
                            </Select>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>
                            {editItem ? 'Perbarui' : 'Tambah'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Import Modal ── */}
            <Modal show={showImport} onClose={closeImportModal} title="Import Data Tata Usaha dari Excel">
                <div className="space-y-4">
                    {importError && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{importError}</span>
                        </div>
                    )}

                    <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-4 text-sm space-y-2">
                        <p className="font-semibold text-violet-700 dark:text-violet-300">Panduan pengisian file Excel:</p>
                        <ul className="space-y-1 text-violet-600 dark:text-violet-400 text-xs list-disc list-inside">
                            <li><span className="font-medium">Nama</span> — wajib diisi, nama lengkap tanpa gelar</li>
                            <li><span className="font-medium">Email</span> — kosongkan untuk auto-generate dari nama</li>
                            <li><span className="font-medium">Jabatan</span> — pilih dari dropdown: {JABATAN_LIST.join(', ')}</li>
                            <li><span className="font-medium">Status Kepegawaian</span> — {STATUS_KEPEGAWAIAN_LIST.join(' / ')}</li>
                            <li><span className="font-medium">Password</span> — kosongkan untuk default <code className="bg-white/50 px-1 rounded">apikmasdjurnal</code></li>
                        </ul>
                    </div>

                    <a
                        href="/admin/tatausaha/import-template"
                        className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-600 text-violet-600 dark:text-violet-400 text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Unduh Template Excel
                    </a>

                    <form onSubmit={submitImport} className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Upload File Excel <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={importFileRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => { setImportFile(e.target.files[0] ?? null); setImportError(null); }}
                                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 dark:file:bg-violet-900/30 dark:file:text-violet-300 hover:file:bg-violet-100 dark:hover:file:bg-violet-900/50"
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
                title="Hapus Data Tata Usaha"
                message={`Data tata usaha "${deleteTarget?.user?.name}" akan dihapus. Jika akun ini juga memiliki jabatan lain (misal: guru), hanya role tata usaha yang dicabut — akun tetap ada. Lanjutkan?`}
                onConfirm={() => { router.delete(`/admin/tatausaha/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}