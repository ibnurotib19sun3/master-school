import AppLayout from '@/Layouts/AppLayout';
import { Link, router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select } from '@/Components/ui/Input';
import { Plus, Search, Edit, Trash2, X, ChevronDown, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Eye, Phone, GraduationCap, Briefcase, CalendarDays, BookOpen, Clock } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

/* Slug nama → prefix email, contoh: "Ahmad Fauzi S.Pd" → "ahmadfauzi" */
function nameToEmailPrefix(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')   // hapus karakter non-alfanumerik
        .trim()
        .replace(/\s+/g, '.');          // spasi → titik
}

const EMAIL_DOMAIN = 'apikmas-djurnal.id';

const statusColors = { PNS: 'blue', PPPK: 'blue', GTY: 'green', GTT: 'yellow', Honorer: 'gray' };

const JABATAN_OPTIONS = [
    'Kepala Sekolah',
    'Wakasek Kurikulum',
    'Wakasek Kesiswaan',
    'Wakasek Sarana Prasarana',
    'Wakasek Humas',
    'Kepala Tata Usaha',
    'Guru Piket',
    'Pokja Kurikulum',
    'Pokja Kesiswaan',
    'Pokja Sarpras',
    'Pokja Humas',
    'Wali Kelas',
    'Bimbingan Konseling',
    'Kepala Laboratorium',
    'Kepala Perpustakaan',
    'Pembina OSIS',
    'Koordinator Pramuka',
    'Koordinator PMR',
    'Bendahara Sekolah',
    'Tim Penjamin Mutu Sekolah',
    'Kepala Konsentrasi Keahlian',
];

/* ─── Generic multi-select dengan search ─── */
function MultiSelectSearch({ label, placeholder, value = [], onChange, options, useId = false }) {
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    // useId=true  → options adalah {id, nama}, key=id, label=nama
    // useId=false → options adalah string atau {id, nama}, key=nama, label=nama
    const getKey   = (o) => (typeof o === 'string' ? o : (useId ? o.id : o.nama));
    const getLabel = (o) => (typeof o === 'string' ? o : o.nama);

    // Lookup label dari key (untuk tampilkan chip)
    const labelOf = (key) => {
        const found = options.find((o) => getKey(o) === key);
        return found ? getLabel(found) : String(key);
    };

    const filtered = options.filter((o) =>
        !search || getLabel(o).toLowerCase().includes(search.toLowerCase())
    );

    const toggle = (key) => {
        const norm = useId ? Number(key) : key;
        onChange(value.map(v => useId ? Number(v) : v).includes(norm)
            ? value.filter((v) => (useId ? Number(v) : v) !== norm)
            : [...value, norm]);
    };

    useEffect(() => {
        if (!open) return;
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-left focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
                <span className="flex flex-wrap gap-1 flex-1 min-w-0">
                    {value.length === 0 ? (
                        <span className="text-gray-400">{placeholder}</span>
                    ) : (
                        value.map((v) => (
                            <span key={v} className="inline-flex items-center gap-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs px-2 py-0.5 rounded-full">
                                {labelOf(v)}
                                <button type="button" onClick={(e) => { e.stopPropagation(); toggle(v); }} className="hover:text-sky-900 dark:hover:text-sky-100">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))
                    )}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Cari ${label.toLowerCase()}...`}
                            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400"
                            autoFocus
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-3 text-xs text-gray-400 text-center">Tidak ditemukan.</p>
                        ) : (
                            filtered.map((o) => {
                                const key     = getKey(o);
                                const checked = value.map(v => useId ? Number(v) : v).includes(useId ? Number(key) : key);
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => toggle(key)}
                                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                                            checked
                                                ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                                                : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <span className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                            checked ? 'bg-sky-600 border-sky-600' : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                            {checked && (
                                                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </span>
                                        {getLabel(o)}
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {value.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                            <button type="button" onClick={() => onChange([])} className="w-full text-xs text-red-500 hover:text-red-700 py-1">
                                Hapus semua pilihan
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function GuruIndex({ guru, filters, mataPelajaran, flash }) {
    const [showModal, setShowModal]       = useState(false);
    const [editItem, setEditItem]         = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [detailGuru, setDetailGuru]     = useState(null);
    const [detailJadwal, setDetailJadwal] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [showImport, setShowImport]       = useState(false);
    const [importFile, setImportFile]       = useState(null);
    const [importing, setImporting]         = useState(false);
    const [importError, setImportError]     = useState(null);
    const [selectedIds, setSelectedIds]     = useState(new Set());
    const [showBulkDelete, setShowBulkDelete] = useState(false);
    const importFileRef = useRef(null);

    const DEFAULT_PASSWORD = 'apikmasdjurnal';

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '', email: '', password: DEFAULT_PASSWORD, gender: '',
        nip: '', nuptk: '', gelar_depan: '', gelar_belakang: '',
        status_kepegawaian: 'GTY', pendidikan_terakhir: 'S1',
        bidang_studi: [], jabatan: [], tanggal_masuk: '', nomor_wa: '',
    });

    /* Auto-generate email saat nama diketik (hanya mode tambah) */
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

    // Lookup nama mapel dari ID
    const mapelMap = Object.fromEntries(mataPelajaran.map((m) => [m.id, m.nama]));
    const mapelNames = (ids) => (ids ?? []).map((id) => mapelMap[id] ?? id).join(', ');

    const search = (e) => {
        router.get('/admin/guru', { search: e.target.value }, { preserveState: true, replace: true });
    };

    const submit = (e) => {
        e.preventDefault();
        if (editItem) {
            put(`/admin/guru/${editItem.id}`, { onSuccess: () => { setEditItem(null); reset(); setShowModal(false); } });
        } else {
            post('/admin/guru', { onSuccess: () => { setShowModal(false); reset(); } });
        }
    };

    const openEdit = (item) => {
        setEditItem(item);
        setData({
            name: item.user.name, email: item.user.email, password: '', gender: item.user.gender ?? '',
            nip: item.nip ?? '', nuptk: item.nuptk ?? '', gelar_depan: item.gelar_depan ?? '',
            gelar_belakang: item.gelar_belakang ?? '', status_kepegawaian: item.status_kepegawaian,
            pendidikan_terakhir: item.pendidikan_terakhir ?? 'S1',
            bidang_studi: item.bidang_studi ?? [],
            jabatan: item.jabatan ?? [],
            tanggal_masuk: item.tanggal_masuk ?? '', nomor_wa: item.nomor_wa ?? '',
        });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditItem(null); reset(); };

    const openDetail = (item) => {
        setDetailGuru(item);
        setDetailJadwal([]);
        setLoadingDetail(true);
        fetch(`/admin/guru/${item.id}/jadwal`, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
            .then((r) => r.json())
            .then((d) => setDetailJadwal(d.jadwal ?? []))
            .catch(() => setDetailJadwal([]))
            .finally(() => setLoadingDetail(false));
    };
    const closeDetail = () => { setDetailGuru(null); setDetailJadwal([]); };

    const toggleSelect = (id) => setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const toggleAll = () => {
        if (selectedIds.size === guru.data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(guru.data.map((g) => g.id)));
        }
    };

    const submitBulkDelete = () => {
        router.post('/admin/guru/bulk-delete', { ids: [...selectedIds] }, {
            onSuccess: () => { setSelectedIds(new Set()); setShowBulkDelete(false); },
        });
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
        router.post('/admin/guru/import', { file: importFile }, {
            forceFormData: true,
            onSuccess: () => closeImportModal(),
            onError: (errs) => setImportError(errs.file ?? 'Gagal mengimport file. Periksa format dan isi file.'),
            onFinish: () => setImporting(false),
        });
    };

    return (
        <AppLayout title="Data Guru">
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
                        <CardTitle>Daftar Guru ({guru.total})</CardTitle>
                        {selectedIds.size > 0 && (
                            <span className="text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1 rounded-full">
                                {selectedIds.size} dipilih
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
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
                                    <Trash2 className="h-4 w-4" /> Hapus {selectedIds.size} Guru
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="relative flex-1 sm:flex-none">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        defaultValue={filters.search}
                                        onChange={search}
                                        placeholder="Cari guru..."
                                        className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 w-full sm:w-52 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowImport(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                >
                                    <FileSpreadsheet className="h-4 w-4" /> Import Excel
                                </button>
                                <Button icon={Plus} onClick={() => setShowModal(true)}>Tambah Guru</Button>
                            </>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    {/* Mobile card view */}
                    <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                        {guru.data.map((item) => (
                            <div key={item.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <img src={item.user?.avatar_url} alt={item.user?.name} className="h-9 w-9 rounded-full object-cover shrink-0 mt-0.5"
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name ?? '?')}&background=0284c7&color=fff&bold=true&size=64`; }} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                {item.gelar_depan ? `${item.gelar_depan} ` : ''}{item.user?.name}{item.gelar_belakang ? `, ${item.gelar_belakang}` : ''}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">{item.user?.email}</p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button onClick={() => openDetail(item)} className="rounded-lg p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors" title="Detail">
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors" title="Edit">
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Hapus">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        <Badge color={statusColors[item.status_kepegawaian] ?? 'gray'}>{item.status_kepegawaian}</Badge>
                                        {Array.isArray(item.jabatan) && item.jabatan.map((j) => (
                                            <span key={j} className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full text-[11px] font-medium">{j}</span>
                                        ))}
                                    </div>
                                    {Array.isArray(item.bidang_studi) && item.bidang_studi.length > 0 && (
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">{mapelNames(item.bidang_studi)}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop table */}
                    <div className="overflow-x-auto hidden sm:block">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="pl-4 pr-2 py-3 w-9">
                                        <input
                                            type="checkbox"
                                            checked={guru.data.length > 0 && selectedIds.size === guru.data.length}
                                            onChange={toggleAll}
                                            className="rounded border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">Nama Guru</th>
                                    <th className="px-4 py-3 text-left font-medium">NIP/NIPY</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Jabatan</th>
                                    <th className="px-4 py-3 text-left font-medium">Bid. Studi</th>
                                    <th className="px-4 py-3 text-left font-medium">Pendidikan</th>
                                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {guru.data.map((item) => {
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
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={item.user?.avatar_url} alt={item.user?.name} className="h-8 w-8 rounded-full object-cover shrink-0"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name ?? '?')}&background=0284c7&color=fff&bold=true&size=64`; }} />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {item.gelar_depan ? `${item.gelar_depan} ` : ''}{item.user?.name}{item.gelar_belakang ? `, ${item.gelar_belakang}` : ''}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate">{item.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">{item.nip ?? '–'}</td>
                                            <td className="px-4 py-3">
                                                <Badge color={statusColors[item.status_kepegawaian] ?? 'gray'}>{item.status_kepegawaian}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                {Array.isArray(item.jabatan) && item.jabatan.length > 0 ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full text-[11px] font-medium max-w-32 truncate block">
                                                            {item.jabatan[0]}
                                                        </span>
                                                        {item.jabatan.length > 1 && (
                                                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full text-[11px] font-medium shrink-0">
                                                                +{item.jabatan.length - 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs">–</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs max-w-36">
                                                <span className="truncate block">
                                                    {Array.isArray(item.bidang_studi) && item.bidang_studi.length > 0
                                                        ? mapelNames(item.bidang_studi)
                                                        : '–'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-sm">{item.pendidikan_terakhir ?? '–'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <button onClick={() => openDetail(item)} className="rounded-lg p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors" title="Detail & Jadwal">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors" title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Hapus">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            <Modal show={showModal} onClose={closeModal} title={editItem ? 'Edit Guru' : 'Tambah Guru'} size="xl">
                <form onSubmit={submit} className="space-y-4">
                    <p className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Data Akun</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nama Lengkap" value={data.name} onChange={(e) => handleNameChange(e.target.value)} error={errors.name} required />
                        <div>
                            <Input label="Email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} required />
                            {!editItem && (
                                <p className="mt-1 text-xs text-gray-400">Otomatis dari nama — bisa diubah manual</p>
                            )}
                        </div>
                        {!editItem && (
                            <div>
                                <Input label="Password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} required />
                                <p className="mt-1 text-xs text-gray-400">Default: <span className="font-mono">apikmasdjurnal</span></p>
                            </div>
                        )}
                        <Select label="Jenis Kelamin" value={data.gender} onChange={(e) => setData('gender', e.target.value)}>
                            <option value="">Pilih</option>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </Select>
                    </div>

                    <p className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 pt-2">Data Kepegawaian</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Gelar Depan" value={data.gelar_depan} onChange={(e) => setData('gelar_depan', e.target.value)} placeholder="Dr., Drs., dst." />
                        <Input label="Gelar Belakang" value={data.gelar_belakang} onChange={(e) => setData('gelar_belakang', e.target.value)} placeholder="S.Pd, M.Pd, dst." />
                        <Input label="NIP/NIPY" value={data.nip} onChange={(e) => setData('nip', e.target.value)} error={errors.nip} />
                        <Input label="NUPTK" value={data.nuptk} onChange={(e) => setData('nuptk', e.target.value)} />
                        <Select label="Status Kepegawaian" value={data.status_kepegawaian} onChange={(e) => setData('status_kepegawaian', e.target.value)} required>
                            {['PNS', 'PPPK', 'GTY', 'GTT', 'Honorer'].map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <Select label="Pendidikan Terakhir" value={data.pendidikan_terakhir} onChange={(e) => setData('pendidikan_terakhir', e.target.value)}>
                            {['D3', 'S1', 'S2', 'S3'].map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <Input label="Tanggal Masuk" type="date" value={data.tanggal_masuk} onChange={(e) => setData('tanggal_masuk', e.target.value)} />
                        <Input label="Nomor WhatsApp" value={data.nomor_wa} onChange={(e) => setData('nomor_wa', e.target.value)} placeholder="628123456789" />
                    </div>

                    {/* Jabatan Struktural + Bidang Studi — full width, 2 kolom */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <MultiSelectSearch
                            label="Jabatan Struktural"
                            placeholder="Pilih jabatan..."
                            value={data.jabatan}
                            onChange={(val) => setData('jabatan', val)}
                            options={JABATAN_OPTIONS}
                        />
                        <MultiSelectSearch
                            label="Bidang Studi"
                            placeholder="Pilih bidang studi..."
                            value={data.bidang_studi}
                            onChange={(val) => setData('bidang_studi', val)}
                            options={mataPelajaran}
                            useId
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Data Guru"
                message={`Data guru "${deleteTarget?.user?.name}" akan dihapus permanen beserta akun terkait.`}
                onConfirm={() => { router.delete(`/admin/guru/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />

            <ConfirmDialog
                show={showBulkDelete}
                title="Hapus Guru Terpilih"
                message={`${selectedIds.size} guru yang dipilih akan dihapus permanen beserta akun terkait. Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={submitBulkDelete}
                onCancel={() => setShowBulkDelete(false)}
            />

            {/* ── Modal Detail Guru ── */}
            <Modal show={!!detailGuru} onClose={closeDetail}
                title={detailGuru ? `${detailGuru.gelar_depan ? detailGuru.gelar_depan + ' ' : ''}${detailGuru.user?.name}${detailGuru.gelar_belakang ? ', ' + detailGuru.gelar_belakang : ''}` : ''}
                size="xl">
                {detailGuru && (() => {
                    const g = detailGuru;
                    const namaLengkap = `${g.gelar_depan ? g.gelar_depan + ' ' : ''}${g.user?.name}${g.gelar_belakang ? ', ' + g.gelar_belakang : ''}`;
                    const hariOrder   = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
                    const hariGroups  = hariOrder.reduce((acc, h) => {
                        const rows = detailJadwal.filter((j) => j.hari === h);
                        if (rows.length) acc[h] = rows;
                        return acc;
                    }, {});

                    return (
                        <div className="space-y-5">
                            {/* ── Profil singkat ── */}
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800">
                                <img src={g.user?.avatar_url} alt={namaLengkap}
                                    className="h-16 w-16 rounded-full object-cover shrink-0 ring-2 ring-sky-200 dark:ring-sky-700"
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(g.user?.name ?? '?')}&background=0284c7&color=fff&bold=true&size=96`; }} />
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug">{namaLengkap}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{g.user?.email}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <Badge color={statusColors[g.status_kepegawaian] ?? 'gray'}>{g.status_kepegawaian}</Badge>
                                        {(g.jabatan ?? []).map((j) => (
                                            <span key={j} className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-[11px] font-medium">{j}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Info kepegawaian ── */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[
                                    { icon: Briefcase,      label: 'NIP/NIPY',          value: g.nip ?? '–' },
                                    { icon: Briefcase,      label: 'NUPTK',             value: g.nuptk ?? '–' },
                                    { icon: GraduationCap,  label: 'Pendidikan',        value: g.pendidikan_terakhir ?? '–' },
                                    { icon: Phone,          label: 'WhatsApp',          value: g.nomor_wa ?? '–' },
                                    { icon: CalendarDays,   label: 'Tanggal Masuk',     value: g.tanggal_masuk ? new Date(g.tanggal_masuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '–' },
                                    { icon: BookOpen,       label: 'Bidang Studi',      value: mapelNames(g.bidang_studi) || '–' },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
                                        <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{label}</p>
                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 break-words">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Jadwal Mengajar ── */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="h-4 w-4 text-sky-500" />
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Jadwal Mengajar</p>
                                    {!loadingDetail && (
                                        <span className="text-xs text-gray-400">({detailJadwal.length} JP/minggu)</span>
                                    )}
                                </div>

                                {loadingDetail ? (
                                    <div className="flex items-center justify-center py-8 text-gray-400">
                                        <div className="animate-spin h-5 w-5 rounded-full border-2 border-sky-400 border-t-transparent mr-2" />
                                        <span className="text-sm">Memuat jadwal...</span>
                                    </div>
                                ) : detailJadwal.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        Belum ada jadwal terdaftar.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(hariGroups).map(([hari, rows]) => (
                                            <div key={hari}>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide">{hari}</span>
                                                    <div className="flex-1 h-px bg-sky-100 dark:bg-sky-900/40" />
                                                </div>
                                                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-medium w-10">JP</th>
                                                                <th className="px-3 py-2 text-left font-medium w-24">Jam</th>
                                                                <th className="px-3 py-2 text-left font-medium">Mata Pelajaran</th>
                                                                <th className="px-3 py-2 text-left font-medium w-32">Kelas</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                                            {rows.map((j) => (
                                                                <tr key={j.id} className="hover:bg-sky-50/40 dark:hover:bg-sky-950/20 transition-colors">
                                                                    <td className="px-3 py-2 font-mono font-semibold text-sky-600 dark:text-sky-400">{j.jam_ke}</td>
                                                                    <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{j.jam_mulai}–{j.jam_selesai}</td>
                                                                    <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{j.mata_pelajaran}</td>
                                                                    <td className="px-3 py-2 w-32">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">{j.rombel}</span>
                                                                            {j.jurusan && <span className="shrink-0 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1 rounded">{j.jurusan}</span>}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-1 border-t border-gray-100 dark:border-gray-800">
                                <button onClick={closeDetail}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    Tutup
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* ── Import Modal ── */}
            <Modal show={showImport} onClose={closeImportModal} title="Import Data Guru dari Excel">
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
                            <li><span className="font-medium">Nama</span> — wajib diisi, nama lengkap tanpa gelar</li>
                            <li><span className="font-medium">Email</span> — kosongkan untuk auto-generate dari nama</li>
                            <li><span className="font-medium">Bidang Studi</span> — pilih dari dropdown, atau ketik nama persis. Pisahkan koma untuk lebih dari satu</li>
                            <li><span className="font-medium">Jabatan</span> — pilih dari dropdown. Pisahkan koma untuk lebih dari satu</li>
                            <li><span className="font-medium">Status Kepegawaian</span> — PNS / PPPK / GTY / GTT / Honorer</li>
                            <li><span className="font-medium">Password</span> — kosongkan untuk default <code className="bg-white/50 px-1 rounded">apikmasdjurnal</code></li>
                        </ul>
                    </div>

                    {/* Download template */}
                    <a
                        href="/admin/guru/import-template"
                        className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl border-2 border-dashed border-sky-300 dark:border-sky-600 text-sky-600 dark:text-sky-400 text-sm font-medium hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Unduh Template Excel
                    </a>

                    {/* Upload form */}
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
        </AppLayout>
    );
}